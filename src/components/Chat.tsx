import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Search, 
  Plus, 
  MessageCircle, 
  User as UserIcon, 
  Users as UsersIcon,
  X,
  ChevronLeft,
  Eye,
  Smile,
  AlertCircle,
  Bell,
  Volume2,
  VolumeX,
  Database,
  CheckCircle2
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc,
  getDocs,
  limit,
  setDoc,
  Timestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { supabase } from '../lib/supabase.js';
import { User, ChatRoom, ChatMessage } from '../types.js';
import { motion, AnimatePresence } from 'motion/react';
import EmojiPicker from 'emoji-picker-react';

interface ChatProps {
  currentUser: User;
  allUsers: User[];
  initialRoomId?: string | null;
  onClose: () => void;
}

export default function Chat({ currentUser, allUsers, initialRoomId, onClose }: ChatProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Sound alert player
  const playSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      // Audio autoplay blocked
    }
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch rooms from Supabase and sync
  const loadSupabaseRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (!error && data) {
        const supaRooms: ChatRoom[] = data
          .map(row => ({
            id: row.id,
            name: row.name || undefined,
            type: (row.type as 'PRIVATE' | 'GROUP') || 'PRIVATE',
            participantIds: Array.isArray(row.participant_ids) ? row.participant_ids : [],
            lastMessage: row.last_message || undefined,
            lastMessageAt: row.last_message_at || undefined,
            createdAt: row.created_at || new Date().toISOString(),
            unreadCounts: row.unread_counts || {}
          }))
          .filter(room => room.participantIds.includes(currentUser.id));

        setRooms(prev => {
          // Merge Supabase rooms with existing rooms without duplicating
          const merged = [...supaRooms];
          prev.forEach(p => {
            if (!merged.some(m => m.id === p.id)) {
              merged.push(p);
            }
          });
          return merged;
        });
      }
    } catch (e) {
      console.warn('Supabase rooms sync warning:', e);
    }
  };

  // Fetch messages from Supabase for active room
  const loadSupabaseMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const supaMsgs: ChatMessage[] = data.map(row => ({
          id: row.id,
          roomId: row.room_id,
          senderId: row.sender_id,
          senderName: row.sender_name,
          text: row.text,
          createdAt: row.created_at,
          readBy: Array.isArray(row.read_by) ? row.read_by : []
        }));

        setMessages(prev => {
          const combined = [...supaMsgs];
          prev.forEach(p => {
            if (!combined.some(m => m.id === p.id)) {
              combined.push(p);
            }
          });
          return combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });
      }
    } catch (e) {
      console.warn('Supabase messages sync warning:', e);
    }
  };

  // Subscribe to Firestore rooms where current user is a participant + Poll Supabase
  useEffect(() => {
    loadSupabaseRooms();
    const interval = setInterval(loadSupabaseRooms, 3000);

    const q = query(
      collection(db, 'chatRooms'),
      where('participantIds', 'array-contains', currentUser.id),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatRoom[];
      setRooms(prev => {
        const map = new Map<string, ChatRoom>();
        prev.forEach(r => map.set(r.id, r));
        roomData.forEach(r => map.set(r.id, r));
        return Array.from(map.values());
      });
      setFirestoreError(null);
    }, (error) => {
      console.warn('Chat rooms list subscription notice:', error);
      // Suppress raw error if Supabase rooms are loaded
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [currentUser.id]);

  // Handle initialRoomId if provided
  useEffect(() => {
    if (initialRoomId && rooms.length > 0) {
      const found = rooms.find(r => r.id === initialRoomId);
      if (found) {
        setActiveRoom(found);
      }
    }
  }, [initialRoomId, rooms]);

  // Mark messages as read when room becomes active
  useEffect(() => {
    if (!activeRoom || !messages.length) return;

    const unreadMessages = messages.filter(m => 
      m.senderId !== currentUser.id && 
      (!m.readBy || !m.readBy.includes(currentUser.id))
    );

    if (unreadMessages.length > 0) {
      const markAsRead = async () => {
        try {
          const batch = writeBatch(db);
          unreadMessages.forEach(m => {
            const msgRef = doc(db, 'chatRooms', activeRoom.id, 'messages', m.id);
            batch.update(msgRef, {
              readBy: [...(m.readBy || []), currentUser.id]
            });
          });
          
          // Reset unread count for this user in the room doc
          const roomRef = doc(db, 'chatRooms', activeRoom.id);
          batch.update(roomRef, {
            [`unreadCounts.${currentUser.id}`]: 0
          });

          await batch.commit();
        } catch (err) {
          // Ignore
        }

        // Also update Supabase
        try {
          const updatedUnread = { ...(activeRoom.unreadCounts || {}) };
          updatedUnread[currentUser.id] = 0;
          await supabase.from('chat_rooms').update({ unread_counts: updatedUnread }).eq('id', activeRoom.id);
        } catch (err) {
          // Ignore
        }
      };
      markAsRead();
    }
  }, [activeRoom?.id, messages, currentUser.id]);

  // Subscribe to messages of active room + Poll Supabase
  useEffect(() => {
    if (!activeRoom) {
      setMessages([]);
      return;
    }

    loadSupabaseMessages(activeRoom.id);
    const interval = setInterval(() => loadSupabaseMessages(activeRoom.id), 2500);

    const q = query(
      collection(db, 'chatRooms', activeRoom.id, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      setMessages(prev => {
        const map = new Map<string, ChatMessage>();
        prev.forEach(m => map.set(m.id, m));
        msgData.forEach(m => map.set(m.id, m));
        return Array.from(map.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      });
      setFirestoreError(null);
    }, (error) => {
      console.warn('Active room messages subscription notice:', error);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [activeRoom?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeRoom) return;

    const text = inputText;
    setInputText('');
    const nowIso = new Date().toISOString();
    const msgId = `MSG_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newMsg: ChatMessage = {
      id: msgId,
      roomId: activeRoom.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text,
      createdAt: nowIso,
      readBy: [currentUser.id]
    };

    // Optimistic UI update
    setMessages(prev => [...prev, newMsg]);

    // 1. Save to Supabase (Primary persistent database)
    try {
      await supabase.from('chat_messages').insert({
        id: msgId,
        room_id: activeRoom.id,
        sender_id: currentUser.id,
        sender_name: currentUser.name,
        text,
        created_at: nowIso,
        read_by: [currentUser.id]
      });

      const updatedUnread = { ...(activeRoom.unreadCounts || {}) };
      activeRoom.participantIds.forEach(id => {
        if (id !== currentUser.id) {
          updatedUnread[id] = (updatedUnread[id] || 0) + 1;
        }
      });

      await supabase.from('chat_rooms').upsert({
        id: activeRoom.id,
        name: activeRoom.name || null,
        type: activeRoom.type,
        participant_ids: activeRoom.participantIds,
        last_message: text,
        last_message_at: nowIso,
        created_at: activeRoom.createdAt || nowIso,
        unread_counts: updatedUnread
      });
    } catch (err) {
      console.error('Error saving message to Supabase:', err);
    }

    // 2. Try saving to Firestore if available
    try {
      const msgData = {
        roomId: activeRoom.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        text,
        createdAt: nowIso,
        readBy: [currentUser.id]
      };

      await addDoc(collection(db, 'chatRooms', activeRoom.id, 'messages'), {
        ...msgData,
        createdAt: serverTimestamp()
      });

      const updates: any = {
        lastMessage: text,
        lastMessageAt: serverTimestamp()
      };

      activeRoom.participantIds.forEach(id => {
        if (id !== currentUser.id) {
          updates[`unreadCounts.${id}`] = increment(1);
        }
      });

      await updateDoc(doc(db, 'chatRooms', activeRoom.id), updates);
    } catch (err) {
      // Ignore Firestore warning if Supabase handled it
    }
  };

  const startPrivateChat = async (targetUser: User) => {
    // Check if private chat already exists
    const existingRoom = rooms.find(r => 
      r.type === 'PRIVATE' && 
      r.participantIds.includes(targetUser.id) && 
      r.participantIds.length === 2
    );

    if (existingRoom) {
      setActiveRoom(existingRoom);
      setShowUserSearch(false);
      return;
    }

    // Create new private chat
    const roomId = [currentUser.id, targetUser.id].sort().join('_');
    const nowIso = new Date().toISOString();

    const newRoom: ChatRoom = {
      id: roomId,
      type: 'PRIVATE',
      participantIds: [currentUser.id, targetUser.id],
      createdAt: nowIso,
      lastMessageAt: nowIso
    };

    // 1. Save room to Supabase
    try {
      await supabase.from('chat_rooms').upsert({
        id: roomId,
        type: 'PRIVATE',
        participant_ids: [currentUser.id, targetUser.id],
        created_at: nowIso,
        last_message_at: nowIso,
        unread_counts: {}
      });
    } catch (e) {
      console.error('Error saving new room to Supabase:', e);
    }

    // 2. Try saving room to Firestore
    try {
      await setDoc(doc(db, 'chatRooms', roomId), {
        id: roomId,
        type: 'PRIVATE',
        participantIds: [currentUser.id, targetUser.id],
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      // Ignore
    }

    setRooms(prev => [...prev.filter(r => r.id !== roomId), newRoom]);
    setActiveRoom(newRoom);
    setShowUserSearch(false);
  };

  const getRoomName = (room: ChatRoom) => {
    if (room.type === 'GROUP') return room.name || 'Group Chat';
    
    // For private chat, find the other participant
    const otherId = room.participantIds.find(id => id !== currentUser.id);
    const otherUser = allUsers.find(u => u.id === otherId);
    return otherUser ? otherUser.name : 'Unknown User';
  };

  const filteredUsers = allUsers.filter(u => 
    u.id !== currentUser.id && 
    (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     (u.departmentName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false))
  );

  // Total unread messages across all OTHER rooms
  const otherUnreadTotal = rooms
    .filter(r => activeRoom && r.id !== activeRoom.id)
    .reduce((sum, r) => sum + ((r.unreadCounts && r.unreadCounts[currentUser.id]) || 0), 0);

  return (
    <motion.div 
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="fixed inset-y-0 right-0 w-80 md:w-96 bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col no-print"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-sky-400" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm">ข้อความแชตพนักงาน</h2>
              <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/30">
                <Database className="h-2.5 w-2.5 text-emerald-400" /> Supabase
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Message & Team Chat History</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)} 
            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            title={soundEnabled ? 'ปิดเสียงการแจ้งเตือน (Mute)' : 'เปิดเสียงการแจ้งเตือน (Unmute)'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-slate-300 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col relative">
        <div className="bg-emerald-50 border-b border-emerald-100 px-3 py-1.5 text-[11px] text-emerald-800 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            ประวัติการพูดคุยถูกบันทึกบน Supabase (PostgreSQL)
          </span>
          <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded font-semibold">Active</span>
        </div>
        {activeRoom ? (
          /* Active Chat View */
          <div className="flex-1 flex flex-col h-full">
            {/* Top notification bar if another room has unread messages */}
            {otherUnreadTotal > 0 && (
              <div className="bg-amber-500 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-200">
                <div className="flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 animate-bounce" />
                  <span>มี {otherUnreadTotal} ข้อความใหม่ในแชตอื่น</span>
                </div>
                <button 
                  onClick={() => setActiveRoom(null)}
                  className="bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer"
                >
                  ดูรายการแชต
                </button>
              </div>
            )}

            <div className="p-3 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
              <button 
                onClick={() => setActiveRoom(null)}
                className="p-1 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </button>
              <div>
                <div className="font-bold text-sm text-slate-800">{getRoomName(activeRoom)}</div>
                <div className="text-[10px] text-slate-500">{activeRoom.type === 'PRIVATE' ? 'แชตส่วนตัว' : 'แชตกลุ่ม'}</div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.map((msg) => {
                const isMine = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!isMine && (
                        <span className="text-[10px] text-slate-500 mb-1 ml-1">{msg.senderName}</span>
                      )}
                      <div className={`px-3 py-2 rounded-2xl text-sm shadow-sm relative ${
                        isMine 
                          ? 'bg-sky-600 text-white rounded-tr-none' 
                          : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                      }`}>
                        {msg.text}
                        {isMine && (
                          <div className="absolute -right-6 bottom-0.5 flex items-center bg-white/80 rounded-full p-0.5 shadow-sm border border-slate-100">
                            {msg.readBy && msg.readBy.length > 1 ? (
                              <Eye className="h-2.5 w-2.5 text-sky-500" title="Read" />
                            ) : (
                              <div className="w-2.5 h-2.5 border border-slate-300 rounded-full" />
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 mx-1">
                        {msg.createdAt && typeof msg.createdAt === 'string' 
                          ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : (msg.createdAt as any)?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''
                        }
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="relative border-t border-slate-100 bg-white">
              {showEmojiPicker && (
                <div ref={emojiPickerRef} className="absolute bottom-full right-0 z-50 mb-2">
                  <EmojiPicker 
                    onEmojiClick={(emojiData) => {
                      setInputText(prev => prev + emojiData.emoji);
                      setShowEmojiPicker(false);
                    }}
                    width={280}
                    height={350}
                  />
                </div>
              )}
              <form onSubmit={sendMessage} className="p-3 flex gap-2 items-center">
                <button 
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-full transition-colors cursor-pointer"
                >
                  <Smile className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="พิมพ์ข้อความตอบกลับ..."
                  className="flex-1 bg-slate-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none transition-all"
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2 bg-sky-600 text-white rounded-full hover:bg-sky-500 disabled:opacity-50 transition-all shadow-md cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Room List View */
          <div className="flex-1 flex flex-col h-full">
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาบทสนทนา..."
                  className="w-full bg-slate-100 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none transition-all"
                />
              </div>

              <button 
                onClick={() => setShowUserSearch(true)}
                className="w-full py-2.5 bg-sky-50 text-sky-600 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-sky-100 transition-colors border border-sky-100 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                สร้างการสนทนาใหม่ (New Chat)
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {rooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                  <MessageCircle className="h-12 w-12 opacity-20 mb-2" />
                  <p className="text-xs">ยังไม่มีรายการแชตเดิม กดปุ่มสร้างการสนทนาใหม่เพื่อเริ่มทักทายเพื่อนร่วมงาน</p>
                </div>
              ) : (
                rooms.map((room) => {
                  const unreadCount = room.unreadCounts && room.unreadCounts[currentUser.id] ? room.unreadCounts[currentUser.id] : 0;
                  const isUnread = unreadCount > 0;

                  return (
                    <button
                      key={room.id}
                      onClick={() => setActiveRoom(room)}
                      className={`w-full p-3.5 flex items-center gap-3 transition-colors border-b border-slate-100 group cursor-pointer text-left ${
                        isUnread ? 'bg-sky-50/80 border-l-4 border-l-sky-500 hover:bg-sky-100/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                        isUnread ? 'bg-sky-600 text-white shadow-xs' : 'bg-sky-100 text-sky-600'
                      }`}>
                        {room.type === 'GROUP' ? <UsersIcon className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 text-left overflow-hidden">
                        <div className="flex justify-between items-center">
                          <span className={`text-xs truncate ${isUnread ? 'font-black text-slate-950' : 'font-bold text-slate-800'}`}>
                            {getRoomName(room)}
                          </span>
                          <span className={`text-[10px] ${isUnread ? 'font-bold text-sky-600' : 'text-slate-400'}`}>
                            {room.lastMessageAt && typeof room.lastMessageAt === 'string'
                              ? new Date(room.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : (room.lastMessageAt as any)?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''
                            }
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <div className={`text-[11px] truncate flex-1 pr-2 ${isUnread ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                            {room.lastMessage || 'ไม่มีข้อความ'}
                          </div>
                          {isUnread && (
                            <div className="bg-rose-600 text-white text-[10px] font-bold h-4 min-w-[18px] px-1 rounded-full flex items-center justify-center shadow-xs animate-bounce shrink-0">
                              {unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* User Search Overlay */}
        <AnimatePresence>
          {showUserSearch && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute inset-0 bg-white z-20 flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800 text-sm">เลือกเพื่อนร่วมงานเพื่อส่งข้อความ</h3>
                <button onClick={() => setShowUserSearch(false)} className="p-1 hover:bg-slate-200 rounded-full cursor-pointer">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>
              
              <div className="p-4 border-b border-slate-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อ หรือแผนก..."
                    className="w-full bg-slate-100 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">รายชื่อพนักงานทั้งหมด (All Employees)</div>
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => startPrivateChat(user)}
                    className="w-full p-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100 cursor-pointer text-left"
                  >
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <div className="font-bold text-xs text-slate-800 truncate">{user.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{user.title} • {user.departmentName || 'ไม่ระบุแผนก'}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}


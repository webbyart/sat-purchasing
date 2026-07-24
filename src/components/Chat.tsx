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
  AlertCircle
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
import { User, ChatRoom, ChatMessage } from '../types.js';
import { motion, AnimatePresence } from 'motion/react';
import EmojiPicker from 'emoji-picker-react';

interface ChatProps {
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
}

export default function Chat({ currentUser, allUsers, onClose }: ChatProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

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

  // Subscribe to rooms where current user is a participant
  useEffect(() => {
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
      setRooms(roomData);
      setFirestoreError(null);
    }, (error) => {
      console.warn('Chat rooms list subscription error:', error);
      setFirestoreError(error.message);
    });

    return () => unsubscribe();
  }, [currentUser.id]);

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
          console.error('Error marking messages as read:', err);
        }
      };
      markAsRead();
    }
  }, [activeRoom?.id, messages, currentUser.id]);

  // Subscribe to messages of active room
  useEffect(() => {
    if (!activeRoom) {
      setMessages([]);
      return;
    }

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
      setMessages(msgData);
      setFirestoreError(null);
    }, (error) => {
      console.warn('Active room messages subscription error:', error);
      setFirestoreError(error.message);
    });

    return () => unsubscribe();
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

    try {
      const msgData = {
        roomId: activeRoom.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        text,
        createdAt: new Date().toISOString(),
        readBy: [currentUser.id]
      };

      // Add message to subcollection
      await addDoc(collection(db, 'chatRooms', activeRoom.id, 'messages'), {
        ...msgData,
        createdAt: serverTimestamp()
      });

      // Update room last message and increment unread counts for other participants
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
      console.error('Error sending message:', err);
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
    
    try {
      // Use setDoc with merge to avoid overwriting and handle existing docs
      await setDoc(doc(db, 'chatRooms', roomId), {
        id: roomId,
        type: 'PRIVATE',
        participantIds: [currentUser.id, targetUser.id],
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }, { merge: true });

      const newRoom: ChatRoom = {
        id: roomId,
        type: 'PRIVATE',
        participantIds: [currentUser.id, targetUser.id],
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString()
      };
      
      setActiveRoom(newRoom);
      setShowUserSearch(false);
    } catch (err) {
      console.error('Error creating chat room:', err);
      // Fallback: just set active room locally if it fails
      setActiveRoom({
        id: roomId,
        type: 'PRIVATE',
        participantIds: [currentUser.id, targetUser.id],
        createdAt: new Date().toISOString()
      });
      setShowUserSearch(false);
    }
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

  return (
    <motion.div 
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col no-print"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-sky-400" />
          <h2 className="font-bold">E-Purchasing Chat</h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col relative">
        {firestoreError && (
          <div className="m-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] leading-normal flex items-start gap-2 animate-in fade-in duration-200 no-print">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="font-bold mb-0.5">ระบบสนทนาเรียลไทม์ (Firebase Firestore) ยังไม่ถูกเปิดใช้งาน</p>
              <p>ระบบจัดซื้อ ใบเสนอราคา และเปรียบเทียบราคาจะทำงานบนฐานข้อมูลหลัก (Supabase) ได้อย่างสมบูรณ์ตามปกติ หากต้องการใช้งานแชทเพิ่มเติม กรุณาตั้งค่า/เปิดใช้งาน Firestore ใน Firebase Console</p>
            </div>
          </div>
        )}
        {activeRoom ? (
          /* Active Chat View */
          <div className="flex-1 flex flex-col h-full">
            <div className="p-3 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
              <button 
                onClick={() => setActiveRoom(null)}
                className="p-1 hover:bg-slate-200 rounded-full transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </button>
              <div>
                <div className="font-bold text-sm text-slate-800">{getRoomName(activeRoom)}</div>
                <div className="text-[10px] text-slate-500">{activeRoom.type}</div>
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
                  className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-full transition-colors"
                >
                  <Smile className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none transition-all"
                />
                <button 
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2 bg-sky-600 text-white rounded-full hover:bg-sky-500 disabled:opacity-50 transition-all shadow-md"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Room List View */
          <div className="flex-1 flex flex-col h-full">
            <div className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search chats..."
                  className="w-full bg-slate-100 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none transition-all"
                />
              </div>

              <button 
                onClick={() => setShowUserSearch(true)}
                className="w-full py-2.5 bg-sky-50 text-sky-600 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-sky-100 transition-colors border border-sky-100"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {rooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                  <MessageCircle className="h-12 w-12 opacity-20 mb-2" />
                  <p className="text-sm">No chats yet. Start one to collaborate with your team.</p>
                </div>
              ) : (
                rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoom(room)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 group"
                  >
                    <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 group-hover:scale-105 transition-transform">
                      {room.type === 'GROUP' ? <UsersIcon className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 text-left overflow-hidden">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-slate-800 truncate">{getRoomName(room)}</span>
                        <span className="text-[10px] text-slate-400">
                          {room.lastMessageAt && typeof room.lastMessageAt === 'string'
                            ? new Date(room.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : (room.lastMessageAt as any)?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-0.5">
                        <div className="text-[11px] text-slate-500 truncate flex-1 pr-4">
                          {room.lastMessage || 'No messages yet'}
                        </div>
                        {room.unreadCounts && room.unreadCounts[currentUser.id] > 0 && (
                          <div className="bg-red-500 text-white text-[9px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-sm animate-bounce">
                            {room.unreadCounts[currentUser.id]}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))
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
                <h3 className="font-bold text-slate-800">New Chat</h3>
                <button onClick={() => setShowUserSearch(false)} className="p-1 hover:bg-slate-200 rounded-full">
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
                    placeholder="Search name or department..."
                    className="w-full bg-slate-100 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested Users</div>
                {filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => startPrivateChat(user)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50"
                  >
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-sm text-slate-800">{user.name}</div>
                      <div className="text-[10px] text-slate-500">{user.departmentName || 'No Department'}</div>
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

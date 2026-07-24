/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Globe, 
  Menu, 
  CheckCircle, 
  X, 
  ShieldAlert, 
  Loader2,
  Settings,
  HelpCircle,
  TrendingUp,
  FolderSync,
  LayoutDashboard,
  FileText,
  FileCheck,
  Sliders,
  Sparkles,
  UserCheck,
  ChevronRight,
  Maximize,
  MessageSquare,
  MessageCircle,
  ChevronDown,
  ArrowRight
} from 'lucide-react';

import { 
  User, 
  Department, 
  Vendor, 
  PR, 
  PO, 
  WorkflowRule, 
  NotificationLog, 
  AuditLog, 
  PRStatus, 
  POStatus,
  UserRole,
  ComparisonSheet
} from './types';

import { 
  loginUserApi, 
  fetchAllDataApi, 
  createPrApi, 
  updatePrStatusApi, 
  deletePrApi, 
  approvePrApi, 
  generatePoApi, 
  deletePoApi 
} from './lib/apiClient';

import { translations, Language } from './lib/translations';

import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './lib/firebase';
import { supabase } from './lib/supabase';

import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import PRListView from './components/PRListView';
import PRFormView from './components/PRFormView';
import PRDetailsView from './components/PRDetailsView';
import POListView from './components/POListView';
import PODetailsView from './components/PODetailsView';
import AdminPanel from './components/AdminPanel';
import AuditLogView from './components/AuditLogView';
import LoginView from './components/LoginView';
import ComparisonView from './components/ComparisonView';
import OtherModulesView from './components/OtherModulesView';
import CapexFormView from './components/CapexFormView';
import PurchasingProcessView from './components/PurchasingProcessView';
import UserManualView from './components/UserManualView';
import Chat from './components/Chat';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Navigation & Sizing
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>('TH');
  const t = translations[lang] || translations.TH;

  // Master Data State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [prs, setPrs] = useState<PR[]>([]);
  const [pos, setPos] = useState<PO[]>([]);
  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [comparisons, setComparisons] = useState<ComparisonSheet[]>([]);

  // Page Load State
  const [isLoading, setIsLoading] = useState(true);
  const [showNotificationList, setShowNotificationList] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | null>(null);
  const [chatToast, setChatToast] = useState<{ roomId: string; senderName: string; text: string } | null>(null);

  const previousRoomStateRef = React.useRef<Record<string, number>>({});
  const isFirstMountRef = React.useRef(true);

  // Sound chime synthesizer for chat alerts
  const playChatNotificationSound = () => {
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

  // Request browser notification permission on load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Real-time unread chat counter & alert notification listener (Firestore + Supabase)
  useEffect(() => {
    if (!currentUser) return;

    const triggerNotification = (senderName: string, text: string, roomId: string) => {
      playChatNotificationSound();
      setChatToast({ roomId, senderName, text });
      
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`ข้อความใหม่จาก ${senderName}`, {
            body: text,
            icon: '/favicon.ico'
          });
        } catch (e) {
          // Notification failed
        }
      }
    };

    // Supabase polling for chat notifications
    const checkSupabaseChatUnread = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_rooms')
          .select('*');

        if (!error && data) {
          let totalUnread = 0;
          let newestMsg: { roomId: string; senderName: string; text: string } | null = null;

          data.forEach(room => {
            const pIds = Array.isArray(room.participant_ids) ? room.participant_ids : [];
            if (pIds.includes(currentUser.id)) {
              const unreadCounts = room.unread_counts || {};
              const unreadForMe = unreadCounts[currentUser.id] || 0;
              totalUnread += unreadForMe;

              const prevUnread = previousRoomStateRef.current[room.id] || 0;
              if (!isFirstMountRef.current && unreadForMe > prevUnread && room.last_message) {
                const otherParticipantId = pIds.find((id: string) => id !== currentUser.id);
                const otherUser = allUsers.find(u => u.id === otherParticipantId);
                const senderName = otherUser ? (otherUser.thaiName || otherUser.name) : 'เพื่อนร่วมงาน (Colleague)';

                newestMsg = {
                  roomId: room.id,
                  senderName,
                  text: room.last_message
                };
              }
              previousRoomStateRef.current[room.id] = unreadForMe;
            }
          });

          setUnreadChatCount(prev => Math.max(prev, totalUnread));

          if (newestMsg) {
            triggerNotification(newestMsg.senderName, newestMsg.text, newestMsg.roomId);
          }

          isFirstMountRef.current = false;
        }
      } catch (e) {
        // Supabase query fallback
      }
    };

    checkSupabaseChatUnread();
    const supaInterval = setInterval(checkSupabaseChatUnread, 2000);

    // Supabase Realtime channel subscription for chat messages & rooms
    let supaChannel: any = null;
    try {
      supaChannel = supabase
        .channel('public:chat_notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms' }, () => {
          checkSupabaseChatUnread();
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload: any) => {
          const newMsg = payload.new;
          if (newMsg && newMsg.sender_id !== currentUser.id) {
            const senderUser = allUsers.find(u => u.id === newMsg.sender_id);
            const senderName = senderUser ? (senderUser.thaiName || senderUser.name) : (newMsg.sender_name || 'เพื่อนร่วมงาน');
            triggerNotification(senderName, newMsg.text || 'ส่งข้อความใหม่ถึงคุณ', newMsg.room_id);
            checkSupabaseChatUnread();
          }
        })
        .subscribe();
    } catch (e) {
      console.warn('Supabase realtime channel setup notice:', e);
    }

    let unsubscribe = () => {};
    if (db) {
      try {
        const q = query(
          collection(db, 'chatRooms'),
          where('participantIds', 'array-contains', currentUser.id)
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          let totalUnread = 0;
          let newestMsg: { roomId: string; senderName: string; text: string } | null = null;

          snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            const roomId = docSnap.id;
            const unreadForMe = (data.unreadCounts && data.unreadCounts[currentUser.id]) || 0;
            totalUnread += unreadForMe;

            const prevUnread = previousRoomStateRef.current[roomId] || 0;

            if (!isFirstMountRef.current && unreadForMe > prevUnread && data.lastMessage) {
              const otherParticipantId = (data.participantIds || []).find((id: string) => id !== currentUser.id);
              const otherUser = allUsers.find(u => u.id === otherParticipantId);
              const senderName = otherUser ? (otherUser.thaiName || otherUser.name) : 'เพื่อนร่วมงาน (Colleague)';

              newestMsg = {
                roomId,
                senderName,
                text: data.lastMessage
              };
            }

            previousRoomStateRef.current[roomId] = unreadForMe;
          });

          setUnreadChatCount(prev => Math.max(prev, totalUnread));

          if (newestMsg) {
            triggerNotification(newestMsg.senderName, newestMsg.text, newestMsg.roomId);
          }

          isFirstMountRef.current = false;
        }, (error) => {
          console.warn('Real-time chat update subscription notice:', error.message);
        });
      } catch (e) {
        console.warn('Firestore chat listener setup skipped:', e);
      }
    }

    return () => {
      clearInterval(supaInterval);
      if (supaChannel) {
        supabase.removeChannel(supaChannel);
      }
      unsubscribe();
    };
  }, [currentUser?.id, allUsers]);

  // Sync Master Data helper
  const fetchData = async () => {
    try {
      const data = await fetchAllDataApi();

      setAllUsers(data.users || []);
      setDepartments(data.departments || []);
      setVendors(data.vendors || []);
      setPrs(data.prs || []);
      setPos(data.pos || []);
      setWorkflowRules(data.workflowRules || []);
      setAuditLogs(data.auditLogs || []);
      setNotifications(data.notifications || []);
      setComparisons(data.comparisons || []);

      const storedUserString = localStorage.getItem('sumino_user');
      if (storedUserString && Array.isArray(data.users) && data.users.length > 0) {
        try {
          const storedUser = JSON.parse(storedUserString);
          const freshUser = data.users.find((u: User) => u && (u.id === storedUser.id || u.employeeId === storedUser.employeeId));
          if (freshUser) {
            setCurrentUser(freshUser);
          }
        } catch (e) {
          console.error('Failed reading session', e);
        }
      }
    } catch (err) {
      console.error('Failed fetching DB records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Sync on start
  useEffect(() => {
    fetchData();
  }, []);

  // Display alert feedback
  const triggerAlert = (type: 'success' | 'error', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // Impersonator Switch helper
  const handleSwitchUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const selected = allUsers.find(u => u.id === userId);
      if (!selected) return;

      let userToSet = selected;
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: selected.email })
        });
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            if (data && data.user) userToSet = data.user;
          }
        }
      } catch (e) {
        // Fallback to local user object
      }

      setCurrentUser(userToSet);
      localStorage.setItem('sumino_user', JSON.stringify(userToSet));
      triggerAlert('success', `Impersonating: ${userToSet.name} (${userToSet.role})`);
      fetchData(); // reload audits
    } catch (err) {
      triggerAlert('error', 'Failed switching user session context.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (employeeId: string): Promise<boolean> => {
    try {
      const res = await loginUserApi(employeeId);
      if (res && res.user) {
        setCurrentUser(res.user);
        localStorage.setItem('sumino_user', JSON.stringify(res.user));
        triggerAlert('success', `เข้าสู่ระบบสำเร็จ: คุณ${res.user.thaiName || res.user.name}`);
        fetchData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sumino_user');
    setCurrentUser(null);
    setCurrentView('dashboard');
    triggerAlert('success', 'ออกจากระบบเรียบร้อยแล้ว');
  };

  // Create PR
  const handleCreatePR = async (prData: any) => {
    setIsLoading(true);
    try {
      const newPr = await createPrApi(prData, currentUser!);

      if (prData.status === PRStatus.PENDING_DEPT_MGR) {
        await updatePrStatusApi(newPr.id, {
          status: PRStatus.PENDING_DEPT_MGR,
          signatureData: prData.signatureData,
          companyStampData: prData.companyStampData,
          geoCoordinates: prData.geoCoordinates
        });
      }

      triggerAlert('success', `สร้างใบขอซื้อ (PR) และบันทึกลงฐานข้อมูลสำเร็จ!`);
      setCurrentView('pr');
      fetchData();
    } catch (err: any) {
      triggerAlert('error', err.message || 'Failed to submit Purchase Requisition');
    } finally {
      setIsLoading(false);
    }
  };

  // Change PR Status
  const handleUpdatePRStatus = async (id: string, status: PRStatus) => {
    setIsLoading(true);
    try {
      await updatePrStatusApi(id, { status });
      triggerAlert('success', `อัปเดตสถานะใบขอซื้อสำเร็จ!`);
      fetchData();
    } catch (err: any) {
      triggerAlert('error', err.message || 'Failed to update PR status');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete PR
  const handleDeletePR = async (id: string) => {
    if (!window.confirm('คุณต้องการลบใบขอซื้อ (Purchase Requisition) นี้ใช่หรือไม่?')) return;
    setIsLoading(true);
    try {
      await deletePrApi(id);
      triggerAlert('success', `ลบใบขอซื้อสำเร็จ!`);
      fetchData();
    } catch (err: any) {
      triggerAlert('error', err.message || 'ลบใบขอซื้อไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete PO
  const handleDeletePO = async (id: string) => {
    if (!window.confirm('คุณต้องการลบใบสั่งซื้อ (Purchase Order) นี้ใช่หรือไม่?')) return;
    setIsLoading(true);
    try {
      await deletePoApi(id);
      triggerAlert('success', `ลบใบสั่งซื้อสำเร็จ!`);
      fetchData();
    } catch (err: any) {
      triggerAlert('error', err.message || 'ลบใบสั่งซื้อไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign & Approve/Reject PR
  const handleApprovePR = async (id: string, isReject: boolean, comment: string, signatureData: string, companyStampData?: string, geoCoordinates?: string) => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      await approvePrApi(id, currentUser, comment, signatureData, companyStampData, geoCoordinates, isReject);
      triggerAlert('success', isReject ? 'ปฏิเสธใบขอซื้อเรียบร้อยแล้ว' : 'ลงนามและอนุมัติใบขอซื้อสำเร็จ');
      setCurrentView('pr');
      fetchData();
    } catch (err: any) {
      triggerAlert('error', err.message || 'Failed saving signature review');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate PO
  const handleGeneratePO = async (prId: string, signatureData?: string, companyStampData?: string) => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      await generatePoApi(prId, currentUser, signatureData, companyStampData);
      triggerAlert('success', 'ออกใบสั่งซื้อ (PO) และบันทึกลงฐานข้อมูลเรียบร้อยแล้ว!');
      setCurrentView('po');
      fetchData();
    } catch (err: any) {
      triggerAlert('error', err.message || 'Failed to generate PO');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign & Approve/Reject PO
  const handleApprovePO = async (id: string, isReject: boolean, comment: string, signatureData: string, companyStampData?: string, geoCoordinates?: string) => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/po/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          comment,
          signatureData,
          companyStampData,
          geoCoordinates,
          isReject
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Error committing PO signature');
      }

      triggerAlert('success', isReject ? 'PO rejected and canceled' : 'PO digitally signed & approved');
      setCurrentView('po');
      fetchData();
    } catch (err: any) {
      triggerAlert('error', err.message || 'Failed saving PO approval signature');
    } finally {
      setIsLoading(false);
    }
  };

  // Issue PO
  const handleIssuePO = async (id: string, signatureData: string, companyStampData?: string, geoCoordinates?: string) => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/po/${id}/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          signatureData,
          companyStampData,
          geoCoordinates
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to issue PO');
      }
      
      const updatedPO = await response.json();
      setPos(prev => prev.map(p => p.id === id ? updatedPO : p));
      
      triggerAlert('success', 'PO has been officially issued and signed.');
    } catch (err: any) {
      console.error(err);
      triggerAlert('error', err.message || 'Error issuing PO');
    } finally {
      setIsLoading(false);
    }
  };

  // Send to Vendor
  const handleSendVendor = async (id: string) => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      await fetch(`/api/po/${id}/send-vendor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      triggerAlert('success', 'PO dispatched successfully via secure API to Vendor inbox.');
      setCurrentView('po');
      fetchData();
    } catch (err) {
      triggerAlert('error', 'Failed releasing PO dispatch');
    } finally {
      setIsLoading(false);
    }
  };

  // Upload Invoice / Delivery notes
  const handleUploadDocs = async (id: string, invoiceUrl?: string, deliveryUrl?: string) => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      await fetch(`/api/po/${id}/upload-docs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          invoiceUrl,
          deliveryUrl
        })
      });
      triggerAlert('success', 'Post-procurement verification file uploaded and locked.');
      fetchData();
    } catch (err: any) {
      triggerAlert('error', err.message || 'Failed saving document attachment.');
    } finally {
      setIsLoading(false);
    }
  };

  // Close job
  const handleCloseJob = async (id: string) => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      await fetch(`/api/po/${id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      triggerAlert('success', 'PO pipeline closed and budget committed successfully.');
      setCurrentView('po');
      fetchData();
    } catch (err) {
      triggerAlert('error', 'Failed closing procurement pipeline job');
    } finally {
      setIsLoading(false);
    }
  };

  // Update Workflow Matrix
  const handleUpdateWorkflowRule = async (id: string, ruleData: Partial<WorkflowRule>) => {
    try {
      await fetch(`/api/workflow/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      });
      fetchData();
    } catch (err) {
      triggerAlert('error', 'Failed saving workflow limits.');
    }
  };

  // Add Vendor
  const handleAddVendor = async (vendorData: Partial<Vendor>) => {
    try {
      await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorData)
      });
      fetchData();
    } catch (err) {
      triggerAlert('error', 'Failed registering partner supplier.');
    }
  };

  // Add New User
  const handleAddUser = async (userData: Partial<User>) => {
    try {
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (res.ok) {
        triggerAlert('success', 'เพิ่มผู้ใช้งานใหม่และบันทึกลงฐานข้อมูลเรียบร้อยแล้ว');
        fetchData();
      } else {
        const data = await res.json();
        triggerAlert('error', data.message || 'ไม่สามารถสร้างผู้ใช้งานได้');
      }
    } catch (err) {
      triggerAlert('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  // User Update signature
  const handleUpdateUser = async (id: string, userData: Partial<User>) => {
    try {
      const res = await fetch(`/api/auth/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (res.ok) {
        triggerAlert('success', 'ปรับปรุงข้อมูลผู้ใช้งานและบันทึกลงฐานข้อมูลเรียบร้อยแล้ว');
        fetchData();
      } else {
        const data = await res.json();
        triggerAlert('error', data.message || 'ไม่สามารถอัปเดตผู้ใช้งานได้');
      }
    } catch (err) {
      triggerAlert('error', 'Failed updating employee credentials.');
    }
  };

  // Dismiss Notifications Read
  const handleReadAllNotifications = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (notification: NotificationLog) => {
    handleMarkAsRead(notification.id);

    // Parse out PR or PO numbers from title and message
    const combinedText = (notification.title + " " + notification.message).toUpperCase();
    
    // Check for PR format
    const prRegex = /(PR\d{8}|PR-SAMPLE-\d+|PR-[A-Z0-9-]+)/;
    const prMatch = combinedText.match(prRegex);
    if (prMatch) {
      const parsedPr = prMatch[0];
      const foundPr = prs.find(p => p.prNumber.toUpperCase() === parsedPr || p.id.toUpperCase() === parsedPr);
      if (foundPr) {
        navigateTo('pr-details', foundPr.id);
        setShowNotificationList(false);
        return;
      }
    }

    // Check for PO format
    const poRegex = /(PO\d{8}|PO-[A-Z0-9-]+)/;
    const poMatch = combinedText.match(poRegex);
    if (poMatch) {
      const parsedPo = poMatch[0];
      const foundPo = pos.find(o => o.poNumber.toUpperCase() === parsedPo || o.id.toUpperCase() === parsedPo);
      if (foundPo) {
        navigateTo('po-details', foundPo.id);
        setShowNotificationList(false);
        return;
      }
    }

    // Default: just close dropdown
    setShowNotificationList(false);
  };

  // Simple view routing
  const navigateTo = (view: string, id: string | null = null) => {
    setCurrentView(view);
    setSelectedId(id);
    window.scrollTo(0, 0);
  };

  const filteredNotifications = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.ADMINISTRATOR) {
      return notifications;
    }

    return notifications.filter(n => {
      // 1. Direct recipient match
      if (n.recipientEmail.toLowerCase() === currentUser.email.toLowerCase()) {
        // "เมื่อกดอนุมัติแล้ว ให้รายการนั้นหายไป" - Hide fully approved/completed alerts for executives
        if (currentUser.role === UserRole.EXECUTIVE) {
          const isFullyApproved = n.title.toLowerCase().includes('fully approved') || n.message.toLowerCase().includes('fully approved') || (n.title.toLowerCase().includes('approved') && !n.title.toLowerCase().includes('pending'));
          if (isFullyApproved) return false;
        }
        return true;
      }

      // 2. Department Manager sees notifications of subordinates
      if (currentUser.role === UserRole.DEPARTMENT_MANAGER) {
        const recipientUser = allUsers.find(u => u.email.toLowerCase() === n.recipientEmail.toLowerCase());
        if (recipientUser && recipientUser.departmentId === currentUser.departmentId) {
          return true;
        }
      }

      // 3. Executive sees alerts that are routed to Executive for approval
      if (currentUser.role === UserRole.EXECUTIVE) {
        const isPendingExec = n.title.toLowerCase().includes('executive') || n.message.toLowerCase().includes('executive') || n.title.toLowerCase().includes('pending po approval');
        const isFullyApproved = n.title.toLowerCase().includes('fully approved') || n.message.toLowerCase().includes('fully approved') || (n.title.toLowerCase().includes('approved') && !n.title.toLowerCase().includes('pending'));
        if (isPendingExec && !isFullyApproved) {
          return true;
        }
      }

      return false;
    });
  }, [notifications, currentUser, allUsers]);

  const unreadNotifications = filteredNotifications.filter(n => !n.isRead);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-3">
        <Loader2 className="h-10 w-10 text-sky-400 animate-spin" />
        <span className="text-xs font-mono font-medium text-slate-400 tracking-widest uppercase">
          Initializing Sumino-Aapico Enterprise Systems...
        </span>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView allUsers={allUsers} onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      
      {/* 1. Left Drawer Sidebar */}
      <Sidebar 
        currentView={currentView}
        onNavigate={(view) => navigateTo(view)}
        currentUser={currentUser}
        allUsers={allUsers}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        prs={prs}
        pos={pos}
        lang={lang}
      />

      {/* 2. Main Work Panel Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Adminty style Top Bar Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0 no-print font-sans">
          
          {/* Left Actions: Search & Fullscreen */}
          <div className="flex items-center gap-3">
            {/* Logo on Mobile (only shown when sidebar is hidden) */}
            <div className="flex md:hidden items-center gap-1.5 mr-2">
              <div className="h-6 w-6 rounded bg-gradient-to-tr from-adminty-orange to-adminty-pink flex items-center justify-center shadow">
                <span className="text-white font-black text-xs">a</span>
              </div>
              <span className="text-xs font-black tracking-wider text-slate-800">adminty</span>
            </div>

            {/* Interactive Search Bar */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder={t.searchPlaceholder} 
                className="pl-9 pr-4 py-1.5 w-48 lg:w-64 bg-slate-50 border border-slate-200 rounded-full text-xs focus:outline-none focus:border-adminty-primary focus:bg-white transition-all text-slate-600 font-medium" 
              />
            </div>

            {/* Fullscreen Trigger */}
            <button 
              onClick={() => { 
                if (!document.fullscreenElement) { 
                  document.documentElement.requestFullscreen().catch(() => {}); 
                } else { 
                  document.exitFullscreen().catch(() => {}); 
                } 
              }} 
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors hidden sm:inline-block cursor-pointer"
              title={t.fullscreen}
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>

          {/* Right Actions: Notifications, Messages, Profile */}
          <div className="flex items-center gap-3 sm:gap-5">
            
            {/* Language Switcher (TH / EN / JA) */}
            <button
              onClick={() => setLang(prev => {
                if (prev === 'TH') return 'EN';
                if (prev === 'EN') return 'JA';
                return 'TH';
              })}
              className="p-1.5 text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-all text-[11px] font-extrabold font-mono cursor-pointer shadow-xs"
              id="btn-lang-toggle"
              title="เปลี่ยนภาษา / Switch Language / 言語切替"
            >
              <Globe className="h-3.5 w-3.5 text-sky-600" />
              <span>{lang === 'TH' ? '🇹🇭 TH' : lang === 'EN' ? '🇬🇧 EN' : '🇯🇵 JA'}</span>
            </button>

            {/* Notification Bell (Red badge) */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationList(!showNotificationList)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg relative cursor-pointer"
                id="btn-notifications-bell"
              >
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-adminty-pink text-[9px] font-mono font-black text-white flex items-center justify-center border-2 border-white shadow-xs">
                  {unreadNotifications.length > 0 ? unreadNotifications.length : 5}
                </span>
              </button>

              {/* Notification Overlay List */}
              {showNotificationList && (
                <div className="absolute right-0 mt-2.5 w-92 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1">
                  <div className="bg-slate-900 text-white p-3 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider">Multi-Channel Alerts Log</span>
                    <button 
                      onClick={handleReadAllNotifications}
                      className="text-[10px] text-sky-400 font-bold hover:underline cursor-pointer"
                    >
                      Clear / Read All
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 scrollbar-hidden">
                    {filteredNotifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3 text-left space-y-1 transition-colors cursor-pointer hover:bg-slate-50 border-l-4 ${
                          n.isRead ? 'bg-white border-l-transparent' : 'bg-sky-50/40 border-l-sky-500'
                        }`}
                      >
                        <div className="flex justify-between items-start text-xs">
                          <span className={`font-bold ${n.isRead ? 'text-slate-700' : 'text-slate-900 font-extrabold'}`}>
                            {n.title}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono bg-slate-100 px-1 rounded shrink-0 ml-2">{n.channel}</span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-normal line-clamp-2">{n.message}</p>
                        <span className="text-[8px] text-slate-400 font-mono block">
                          Logged: {n.timestamp.replace('T', ' ').substring(0, 19)}
                        </span>
                      </div>
                    ))}
                    {filteredNotifications.length === 0 && (
                      <div className="p-6 text-center text-slate-400 text-xs font-medium">
                        No recent workflow notifications triggered.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Chat/Message Icon (Green badge) to match Adminty exactly */}
            <div className="relative">
              <button 
                onClick={() => setShowChat(!showChat)}
                className={`p-2 rounded-lg relative cursor-pointer transition-colors ${showChat ? 'bg-sky-100 text-sky-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                title="เปิดแชตพนักงาน (Chat & Collaboration)"
              >
                <MessageSquare className="h-4.5 w-4.5" />
                {unreadChatCount > 0 && (
                  <>
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white border-2 border-white shadow-sm animate-in zoom-in duration-200">
                      {unreadChatCount > 99 ? '99+' : unreadChatCount}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* User Profile block with dropdown chevron */}
            <div 
              onClick={() => setShowSandboxModal(true)}
              className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-all select-none pl-2 border-l border-slate-200"
              title="คลิกเพื่อเลือกสลับผู้ใช้จำลองระบบจัดซื้อ"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 text-white font-bold text-xs flex items-center justify-center uppercase shrink-0 border border-slate-100 shadow-3xs">
                {currentUser.name.substring(0, 2)}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-bold text-slate-700 leading-none">{currentUser.thaiName || currentUser.name}</p>
                <p className="text-[9px] text-slate-400 font-semibold font-mono tracking-wide mt-0.5">{currentUser.role}</p>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400 hidden sm:inline-block" />
            </div>
          </div>
        </header>

        {/* Global Feedback Floating alert */}
        {alertMsg && (
          <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top duration-200 no-print">
            <div className={`p-4 rounded-xl border flex items-center gap-2.5 shadow-lg max-w-sm ${
              alertMsg.type === 'success' 
                ? 'bg-slate-900 text-white border-slate-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <CheckCircle className={`h-5 w-5 shrink-0 ${alertMsg.type === 'success' ? 'text-sky-400' : 'text-rose-500'}`} />
              <p className="text-xs font-semibold leading-normal">{alertMsg.text}</p>
            </div>
          </div>
        )}

        {/* 3. Main content body panel */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 pb-24 md:pb-8 bg-slate-50/40 print:p-0 print:bg-white">
          {/* Active view routing */}
          {currentView === 'dashboard' && (
            <DashboardView 
              prs={prs} 
              pos={pos} 
              departments={departments}
              workflowRules={workflowRules}
              currentUser={currentUser}
              onNavigate={(view, id) => navigateTo(view, id)}
              unreadChatCount={unreadChatCount}
              onOpenChat={() => setShowChat(true)}
            />
          )}

          {currentView === 'process' && (
            <PurchasingProcessView onNavigate={(view) => navigateTo(view)} />
          )}

          {currentView === 'guide' && (
            <UserManualView onNavigate={(view, id) => navigateTo(view, id)} />
          )}

          {currentView === 'pr' && (
            <PRListView 
              prs={prs}
              currentUser={currentUser}
              onNavigate={(view, id) => navigateTo(view, id)}
              onCancelRequest={handleDeletePR}
            />
          )}

          {currentView === 'pr-new' && (
            <PRFormView 
              currentUser={currentUser}
              vendors={vendors}
              departments={departments}
              onSave={handleCreatePR}
              onCancel={() => navigateTo('pr')}
              onRefreshVendors={fetchData}
            />
          )}

          {currentView === 'pr-details' && selectedId && (
            <PRDetailsView 
              pr={prs.find(p => p.id === selectedId)!}
              currentUser={currentUser}
              onApprove={handleApprovePR}
              onGeneratePO={handleGeneratePO}
              onCancel={() => navigateTo('pr')}
              onNavigate={(view, id) => navigateTo(view, id)}
              onStatusUpdate={handleUpdatePRStatus}
            />
          )}

          {currentView === 'po' && (
            <POListView 
              pos={pos}
              prs={prs}
              currentUser={currentUser}
              onNavigate={(view, id) => navigateTo(view, id)}
              onDeletePO={handleDeletePO}
            />
          )}

          {currentView === 'po-details' && selectedId && (
            <PODetailsView 
              po={pos.find(p => p.id === selectedId)!}
              currentUser={currentUser}
              onApprove={handleApprovePO}
              onSendVendor={handleSendVendor}
              onUploadDocs={handleUploadDocs}
              onCloseJob={handleCloseJob}
              onIssue={handleIssuePO}
              onCancel={() => navigateTo('po')}
            />
          )}

          {currentView === 'comparison' && currentUser && (
            <ComparisonView
              comparisons={comparisons}
              prs={prs}
              vendors={vendors}
              currentUser={currentUser}
              onRefresh={fetchData}
              onNavigate={(view, id) => navigateTo(view, id)}
            />
          )}

          {currentView === 'other-modules' && currentUser && (
            <OtherModulesView
              currentUser={currentUser}
              pos={pos}
              prs={prs}
              onNavigate={(view, id) => navigateTo(view, id)}
            />
          )}

          {currentView === 'capex' && currentUser && (
            <CapexFormView
              currentUser={currentUser}
              allUsers={allUsers}
              onNavigate={(view, id) => navigateTo(view, id)}
              triggerAlert={(type, text) => triggerAlert(type, text)}
            />
          )}

          {currentView === 'admin' && (
            <AdminPanel 
              users={allUsers}
              vendors={vendors}
              departments={departments}
              workflowRules={workflowRules}
              onUpdateWorkflowRule={handleUpdateWorkflowRule}
              onAddVendor={handleAddVendor}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
            />
          )}

          {currentView === 'audit' && (
            <AuditLogView logs={auditLogs} />
          )}
        </main>

        <AnimatePresence>
          {showChat && currentUser && (
            <Chat 
              currentUser={currentUser} 
              allUsers={allUsers} 
              initialRoomId={selectedChatRoomId}
              onClose={() => {
                setShowChat(false);
                setSelectedChatRoomId(null);
              }} 
            />
          )}
        </AnimatePresence>

        {/* Real-time Chat Toast Popup Alert */}
        <AnimatePresence>
          {chatToast && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 p-4 space-y-3 no-print backdrop-blur-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative shrink-0">
                    <div className="h-10 w-10 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-400/30 font-bold text-sm">
                      <MessageSquare className="h-5 w-5 text-sky-400 animate-pulse" />
                    </div>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-800/50">
                        ข้อความใหม่ถึงคุณ
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-100 mt-0.5">{chatToast.senderName}</h4>
                  </div>
                </div>
                <button 
                  onClick={() => setChatToast(null)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50 font-sans line-clamp-2 leading-relaxed">
                "{chatToast.text}"
              </p>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setChatToast(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  ข้าม
                </button>
                <button
                  onClick={() => {
                    setSelectedChatRoomId(chatToast.roomId);
                    setShowChat(true);
                    setChatToast(null);
                  }}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-102 active:scale-98"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>เปิดอ่านแชต</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex justify-around items-center py-1 px-1 z-40 no-print shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-safe">
        <button
          onClick={() => navigateTo('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center h-12 transition-all ${
            currentView === 'dashboard' ? 'text-sky-600 font-bold' : 'text-slate-400 font-medium'
          }`}
          id="btn-mobile-dashboard"
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[9px] mt-0.5 font-sans">{t.mobileDashboard}</span>
        </button>

        <button
          onClick={() => navigateTo('pr')}
          className={`flex-1 flex flex-col items-center justify-center h-12 transition-all ${
            currentView.startsWith('pr') ? 'text-sky-600 font-bold' : 'text-slate-400 font-medium'
          }`}
          id="btn-mobile-pr"
        >
          <FileText className="h-5 w-5" />
          <span className="text-[9px] mt-0.5 font-sans">{t.mobilePR}</span>
        </button>

        <button
          onClick={() => navigateTo('po')}
          className={`flex-1 flex flex-col items-center justify-center h-12 transition-all ${
            currentView.startsWith('po') ? 'text-sky-600 font-bold' : 'text-slate-400 font-medium'
          }`}
          id="btn-mobile-po"
        >
          <FileCheck className="h-5 w-5" />
          <span className="text-[9px] mt-0.5 font-sans">{t.mobilePO}</span>
        </button>

        <button
          onClick={() => setShowChat(!showChat)}
          className={`flex-1 flex flex-col items-center justify-center h-12 transition-all relative ${
            showChat ? 'text-sky-600 font-bold' : 'text-slate-400 font-medium'
          }`}
          id="btn-mobile-chat"
        >
          <div className="relative">
            <MessageSquare className="h-5 w-5" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-3.5 min-w-[14px] px-0.5 items-center justify-center rounded-full bg-rose-600 text-[8px] font-bold text-white border border-white">
                {unreadChatCount > 99 ? '99+' : unreadChatCount}
              </span>
            )}
          </div>
          <span className="text-[9px] mt-0.5 font-sans">แชตพนักงาน</span>
        </button>

        {currentUser.role === UserRole.ADMINISTRATOR && (
          <>
            <button
              onClick={() => navigateTo('admin')}
              className={`flex-1 flex flex-col items-center justify-center h-12 transition-all ${
                currentView === 'admin' ? 'text-sky-600 font-bold' : 'text-slate-400 font-medium'
              }`}
              id="btn-mobile-admin"
            >
              <Sliders className="h-5 w-5" />
              <span className="text-[9px] mt-0.5 font-sans">{t.mobileSettings}</span>
            </button>

            <button
              onClick={() => navigateTo('audit')}
              className={`flex-1 flex flex-col items-center justify-center h-12 transition-all ${
                currentView === 'audit' ? 'text-sky-600 font-bold' : 'text-slate-400 font-medium'
              }`}
              id="btn-mobile-audit"
            >
              <ShieldAlert className="h-5 w-5" />
              <span className="text-[9px] mt-0.5 font-sans">{t.mobileAudit}</span>
            </button>
          </>
        )}
      </div>

      {/* 5. Switch User Dialog Modal */}
      {showSandboxModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 no-print">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200 text-left">
            <div className="p-5 bg-sky-600 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-sky-200 animate-pulse" />
                <h3 className="font-bold text-sm">สลับบัญชีผู้ใช้งาน (Switch User)</h3>
              </div>
              <button 
                onClick={() => setShowSandboxModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4">
              <p className="text-[11px] text-slate-500 leading-normal">
                เลือกบัญชีผู้ใช้งานที่ต้องการสลับสิทธิ์การทำงานในระบบ:
              </p>
              
              <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                {allUsers.map((user) => {
                  const isSelected = currentUser.id === user.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        handleSwitchUser(user.id);
                        setShowSandboxModal(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-sky-50 border-2 border-sky-500 text-sky-950 font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-700'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-semibold text-xs">{user.name}</div>
                        <div className={`text-[10px] ${isSelected ? 'text-sky-700 font-medium' : 'text-slate-400'}`}>
                          {user.title} • <span className="font-mono">{user.role}</span>
                        </div>
                      </div>
                      {isSelected ? (
                        <UserCheck className="h-5 w-5 shrink-0 text-sky-600" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setShowSandboxModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

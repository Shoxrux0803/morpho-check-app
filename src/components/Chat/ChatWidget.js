import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { chatService } from '../../services/chatService';
import { toast } from 'react-hot-toast';
import { useThemeMode } from '../../providers/ThemeProviderMUI';
import { useLanguage } from '../../contexts/LanguageContext';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

const VIEWS = {
  LIST: 'LIST',
  CHAT: 'CHAT',
  BROADCAST: 'BROADCAST',
  MONITORING_LIST: 'MONITORING_LIST',
  MONITORING_CHAT: 'MONITORING_CHAT',
};

const MESSAGE_REACTIONS = ['👍', '❤️', '🙌', '😁', '😊'];

const ChatWidget = () => {
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const { t } = useLanguage();
  const isDark = mode === 'dark';
  const isAdmin = user?.role === 'superadmin';
  const isListUser =
    user?.role === 'superadmin' ||
    user?.role === 'admin' ||
    user?.role === 'field_assistant';

  const [isOpen, setIsOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    message: '',
    onConfirm: null,
  });
  const [currentView, setCurrentView] = useState(VIEWS.LIST);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [content, setContent] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    messageId: null,
    content: '',
  });
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [monitoringPairs, setMonitoringPairs] = useState([]);
  const [selectedMonitoringPair, setSelectedMonitoringPair] = useState(null);

  useEffect(() => {
    const handleClick = () =>
      setContextMenu({
        visible: false,
        x: 0,
        y: 0,
        messageId: null,
        content: '',
      });
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Set initial view once user is available
  useEffect(() => {
    if (user) {
      if (isListUser) {
        if (!selectedUser) setCurrentView(VIEWS.LIST);
      } else {
        setCurrentView(VIEWS.CHAT);
      }
    }
  }, [user?.role, isOpen, isListUser, selectedUser]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const API_BASE = (
    process.env.REACT_APP_API_URL || 'http://localhost:8000/api'
  ).replace('/api', '');

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const quickPhrases = useMemo(() => {
    return isAdmin
      ? [
          t('quickPhraseWelcome'),
          t('quickPhraseSolved'),
          t('quickPhraseReady'),
          t('quickPhraseClear'),
        ]
      : [
          t('quickPhraseNeedHelp'),
          t('quickPhraseError'),
          t('quickPhraseCheck'),
          t('quickPhraseThanks'),
        ];
  }, [isAdmin, t]);

  const scrollToBottom = (behavior = 'auto') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    if (user) {
      if (isListUser && currentView === VIEWS.LIST) {
        fetchConversations();
      } else if (currentView === VIEWS.MONITORING_LIST) {
        fetchMonitoringPairs();
      } else if (
        currentView === VIEWS.CHAT ||
        currentView === VIEWS.BROADCAST
      ) {
        fetchMessages();
      } else if (currentView === VIEWS.MONITORING_CHAT) {
        fetchMonitoringHistory();
      }

      const interval = setInterval(() => {
        if (isListUser && currentView === VIEWS.LIST) fetchConversations();
        else if (currentView === VIEWS.MONITORING_LIST) fetchMonitoringPairs();
        else if (currentView === VIEWS.CHAT || currentView === VIEWS.BROADCAST)
          fetchMessages();
        else if (currentView === VIEWS.MONITORING_CHAT)
          fetchMonitoringHistory();
        fetchTypingStatus();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [user, currentView, selectedUser, selectedMonitoringPair]);

  useEffect(() => {
    if (
      isOpen &&
      (currentView === VIEWS.CHAT || currentView === VIEWS.BROADCAST)
    ) {
      const behavior =
        messages.length > 0 &&
        messages[messages.length - 1].sender_id !== user.id
          ? 'smooth'
          : 'auto';
      const timeoutId = setTimeout(() => scrollToBottom(behavior), 300);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, isOpen, currentView]);

  // Handle marking as read
  useEffect(() => {
    if (
      isOpen &&
      (currentView === VIEWS.CHAT || currentView === VIEWS.BROADCAST) &&
      unreadCount > 0
    ) {
      handleMarkRead();
    }
  }, [isOpen, currentView, selectedUser, messages.length]);

  // Mutual exclusion logic
  useEffect(() => {
    const handleCloseMainChat = () => setIsOpen(false);
    window.addEventListener('close-main-chat', handleCloseMainChat);
    return () =>
      window.removeEventListener('close-main-chat', handleCloseMainChat);
  }, []);

  useEffect(() => {
    const handleOpenMainChat = (event) => {
      const targetUser = event.detail?.user;
      if (!targetUser?.id) return;
      setSelectedUser(targetUser);
      setCurrentView(VIEWS.CHAT);
      setIsOpen(true);
    };
    window.addEventListener('open-main-chat', handleOpenMainChat);
    return () =>
      window.removeEventListener('open-main-chat', handleOpenMainChat);
  }, []);

  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('close-ai-chat'));
    }
    window.dispatchEvent(
      new CustomEvent('admin-chat-toggled', { detail: { isOpen } })
    );
  }, [isOpen]);

  const fetchMonitoringPairs = async () => {
    try {
      const data = await chatService.getMonitoringPairs();
      setMonitoringPairs(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMonitoringHistory = async () => {
    if (!selectedMonitoringPair) return;
    try {
      const data = await chatService.getMonitoringHistory(
        selectedMonitoringPair.admin_id,
        selectedMonitoringPair.assistant_id
      );
      const sorted = [...data].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
      setMessages(sorted);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchConversations = async () => {
    try {
      const data = await chatService.getSuperadminConversations();
      setConversations(data);
      // Update global unread count
      const totalUnread = data.reduce(
        (acc, curr) => acc + curr.unread_count,
        0
      );
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Fetch conversations error', error);
    }
  };

  const fetchMessages = async () => {
    try {
      let data;
      if (isListUser) {
        if (selectedUser?.id) {
          data = await chatService.getHistoryWithUser(selectedUser.id);
        } else if (currentView === VIEWS.BROADCAST && isAdmin) {
          // Broadcast is a special case, we can fetch all broadcast messages
          data = await chatService.getMessages('broadcast');
        } else {
          return;
        }
      } else {
        data = await chatService.getMessages();
      }

      const sorted = [...data].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
      setMessages(sorted);

      if (!isAdmin) {
        const unread = data.filter(
          (m) =>
            !m.is_read &&
            m.sender_id !== user.id &&
            m.message_type !== 'broadcast'
        ).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Fetch messages error', error);
    }
  };

  const fetchTypingStatus = async () => {
    try {
      const data = await chatService.getTypingStatus();
      setTypingUsers(data);
    } catch (error) {
      console.error('Fetch typing status error', error);
    }
  };

  const handleMarkRead = async () => {
    try {
      if (isListUser && selectedUser?.id) {
        await chatService.markUserMessagesRead(selectedUser.id);
        fetchConversations();
      } else {
        await chatService.markAllRead();
        if (!isListUser) setUnreadCount(0);
        else fetchConversations();
      }
    } catch (error) {
      console.error('Mark read error', error);
    }
  };

  const handleSend = async (msgContent = null, fileUrl = null) => {
    const finalContent = typeof msgContent === 'string' ? msgContent : content;
    if (!finalContent.trim() && !fileUrl) return;

    try {
      if (editingMessageId) {
        await chatService.editMessage(editingMessageId, finalContent);
        setEditingMessageId(null);
        setContent('');
        setTimeout(fetchMessages, 300);
        return;
      }

      const recipientId = isListUser
        ? currentView === VIEWS.BROADCAST && isAdmin
          ? null
          : selectedUser?.id
        : null;

      const type =
        isAdmin && currentView === VIEWS.BROADCAST ? 'broadcast' : 'direct';

      await chatService.sendMessage(
        recipientId,
        finalContent,
        type,
        replyingTo?.id,
        fileUrl
      );

      if (typeof msgContent !== 'string') setContent('');
      setReplyingTo(null);
      setTimeout(fetchMessages, 300);
    } catch (error) {
      toast.error(t('errorSendingMessage'));
    }
  };

  const handleFileUpload = async (e) => {
    let file = null;
    if (e.target && e.target.files) {
      file = e.target.files[0];
    } else if (e instanceof File) {
      file = e;
    }

    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await chatService.uploadFile(file);
      await handleSend(`${t('filePrefix')}: ${file.name}`, file_url);
    } catch (error) {
      toast.error(t('errorUploadingFile'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleTyping = () => {
    if (!typingTimeoutRef.current) {
      chatService.sendTypingStatus();
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const handleReaction = async (messageId, reaction) => {
    if (!messageId) return;

    const currentReaction = messages.find(
      (msg) => msg.id === messageId
    )?.reaction;
    const nextReaction = currentReaction === reaction ? null : reaction;

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, reaction: nextReaction } : msg
      )
    );

    try {
      const updated = await chatService.reactToMessage(messageId, reaction);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, reaction: updated.reaction } : msg
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, reaction: currentReaction } : msg
        )
      );
      toast.error(t('errorSendingMessage'));
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    if (a.user_name === 'Xavfsizlik xabarlari') return -1;
    if (b.user_name === 'Xavfsizlik xabarlari') return 1;
    return 0; // The original list is already sorted by unread/time from backend
  });

  const openConversation = (conv) => {
    setSelectedUser({ id: conv.user_id, name: conv.user_name });
    setCurrentView(VIEWS.CHAT);
    setMessages([]); // Clear old messages while loading
  };

  if (!user) return null;

  if (
    user &&
    user.role !== 'superadmin' &&
    user.internal_chat_enabled === false
  ) {
    return null;
  }

  return (
    <div
      className="chat-widget-wrapper"
      style={{
        position: 'fixed',
        bottom: isMobile ? '12px' : '30px',
        left: isMobile ? '12px' : 'auto',
        right: isMobile ? 'auto' : '30px',
        zIndex: 9999,
      }}
    >
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="chat-window"
            layoutId="chat-box"
            className={isDark ? 'premium-chat-glow-dark' : 'premium-chat-glow-light'}
            transition={{
              type: 'spring',
              damping: 26,
              stiffness: 240,
            }}
            style={{
              width: isMobile ? 'calc(100vw - 24px)' : '400px',
              height: isMobile ? 'calc(100dvh - 40px)' : '650px',
              maxHeight: isMobile ? 'calc(100dvh - 40px)' : '90vh',
              background: isDark
                ? 'rgba(15, 15, 20, 0.82)'
                : 'rgba(255, 255, 255, 0.88)',
              backdropFilter: isMobile ? 'none' : 'blur(20px)',
              boxShadow: isDark
                ? '0 12px 40px rgba(0,0,0,0.4)'
                : '0 12px 40px rgba(31,38,135,0.08)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid',
              marginBottom: isMobile ? '0' : '10px',
              color: isDark ? '#fff' : '#000',
              transformOrigin: isMobile ? 'bottom left' : 'bottom right',
              left: isMobile ? 0 : 'auto',
              right: isMobile ? 'auto' : 0,
              borderRadius: isMobile ? '18px' : '24px',
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                background:
                  currentView === VIEWS.BROADCAST
                    ? 'linear-gradient(135deg, #ff9500 0%, #ff5e00 100%)'
                    : 'linear-gradient(135deg, #0f766e 0%, #2563eb 100%)',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10,
                boxShadow: '0 4px 15px rgba(0,0,0,0.12)',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                {isListUser && currentView !== VIEWS.LIST && (
                  <IconButton
                    onClick={() => {
                      if (currentView === VIEWS.MONITORING_CHAT) {
                        setCurrentView(VIEWS.MONITORING_LIST);
                      } else {
                        setCurrentView(VIEWS.LIST);
                        setSelectedUser(null);
                      }
                    }}
                    color="#fff"
                    bg="rgba(255,255,255,0.2)"
                  >
                    <i
                      className="bi bi-chevron-left"
                      style={{ fontWeight: 'bold' }}
                    ></i>
                  </IconButton>
                )}
                <div>
                  <h6
                    style={{
                      margin: 0,
                      fontWeight: '700',
                      fontSize: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {currentView === VIEWS.BROADCAST && (
                      <i className="bi bi-megaphone-fill"></i>
                    )}
                    {currentView === VIEWS.LIST
                      ? t('messages')
                      : currentView === VIEWS.MONITORING_LIST
                        ? 'Chat Nazorati'
                        : currentView === VIEWS.MONITORING_CHAT
                          ? `${selectedMonitoringPair?.admin_name} ↔ ${selectedMonitoringPair?.assistant_name}`
                          : selectedUser?.name || t('chat')}
                  </h6>
                  {currentView === VIEWS.CHAT && (
                    <div style={{ fontSize: '10px', opacity: 0.8 }}>
                      {typingUsers.some((u) => u.id === selectedUser?.id)
                        ? t('typing')
                        : t('online')}
                    </div>
                  )}
                  {currentView === VIEWS.BROADCAST && (
                    <div style={{ fontSize: '10px', opacity: 0.8 }}>
                      {t('broadcastDesc')}
                    </div>
                  )}
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                {currentView === VIEWS.LIST && (
                  <IconButton
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    color="#fff"
                    bg="rgba(255,255,255,0.1)"
                  >
                    <i className="bi bi-search"></i>
                  </IconButton>
                )}
                <IconButton
                  onClick={() => setIsOpen(false)}
                  color="#fff"
                  bg="rgba(255,255,255,0.2)"
                >
                  <i className="bi bi-x-lg" style={{ fontSize: '12px' }}></i>
                </IconButton>
              </div>
            </div>

            {/* Content Area */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                background: 'transparent',
                position: 'relative',
              }}
            >
              <AnimatePresence mode="wait">
                {currentView === VIEWS.LIST && (
                  /* Conversation List */
                  <motion.div
                    key="list-view"
                    className={`premium-chat-scrollbar ${isDark ? 'dark-mode-scrollbar' : ''}`}
                    initial={{ opacity: 0, x: -30, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: -30, filter: 'blur(4px)' }}
                    transition={{ type: 'spring', damping: 22, stiffness: 220 }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      overflowY: 'auto',
                    }}
                  >
                    {isSearchOpen && (
                      <div style={{ padding: '10px 15px' }}>
                        <input
                          autoFocus
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={t('searchPlaceholder')}
                          style={{
                            width: '100%',
                            background: isDark ? '#333' : '#fff',
                            border: '1px solid rgba(0,0,0,0.1)',
                            borderRadius: '12px',
                            padding: '8px 15px',
                            color: isDark ? '#fff' : '#000',
                            outline: 'none',
                            fontSize: '13px',
                          }}
                        />
                      </div>
                    )}

                    {/* Broadcast Item */}
                    {isAdmin && (
                      <div
                        onClick={() => {
                          setCurrentView(VIEWS.BROADCAST);
                          setSelectedUser({ name: t('broadcastToAll') });
                        }}
                        style={{
                          padding: '12px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '15px',
                          cursor: 'pointer',
                          borderBottom: isDark
                            ? '1px solid #222'
                            : '1px solid #eee',
                          background:
                            currentView === VIEWS.BROADCAST
                              ? isDark
                                ? '#2c2c2c'
                                : '#e9ecef'
                              : 'transparent',
                        }}
                      >
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background:
                              'linear-gradient(135deg, #ff9500 0%, #ff5e00 100%)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: '#fff',
                            boxShadow: '0 4px 10px rgba(255,149,0,0.3)',
                          }}
                        >
                          <i
                            className="bi bi-megaphone-fill"
                            style={{ fontSize: '20px' }}
                          ></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '700', fontSize: '14px' }}>
                            {t('broadcastTitle')}
                          </div>
                          <div style={{ fontSize: '12px', color: '#888' }}>
                            {t('broadcastDesc')}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Monitoring Item */}
                    {isAdmin && (
                      <div
                        onClick={() => {
                          setCurrentView(VIEWS.MONITORING_LIST);
                        }}
                        style={{
                          padding: '12px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '15px',
                          cursor: 'pointer',
                          borderBottom: isDark
                            ? '1px solid #222'
                            : '1px solid #eee',
                          background: 'transparent',
                        }}
                      >
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background:
                              'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: '#fff',
                            boxShadow: '0 4px 10px rgba(16,185,129,0.3)',
                          }}
                        >
                          <i
                            className="bi bi-shield-lock-fill"
                            style={{ fontSize: '20px' }}
                          ></i>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '700', fontSize: '14px' }}>
                            Chat Nazorati
                          </div>
                          <div style={{ fontSize: '12px', color: '#888' }}>
                            Adminlar va assistentlar yozishmalari
                          </div>
                        </div>
                      </div>
                    )}

                    {filteredConversations.length === 0 ? (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '40px',
                          color: '#888',
                        }}
                      >
                        <i
                          className="bi bi-chat-dots"
                          style={{ fontSize: '40px', opacity: 0.2 }}
                        ></i>
                        <p style={{ marginTop: '10px' }}>
                          {t('noMessagesFound')}
                        </p>
                      </div>
                    ) : (
                      filteredConversations.map((conv, idx) => {
                        const hash = conv.user_name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                        const gradIndex = hash % 5;
                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ 
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                              x: 4
                            }}
                            transition={{ 
                              type: 'spring', 
                              stiffness: 300, 
                              damping: 22,
                              delay: idx * 0.03 
                            }}
                            key={conv.user_id}
                            onClick={() => openConversation(conv)}
                            style={{
                              padding: '12px 20px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '15px',
                              cursor: 'pointer',
                              borderBottom: isDark
                                ? '1px solid rgba(255,255,255,0.05)'
                                : '1px solid rgba(0,0,0,0.05)',
                            }}
                          >
                            <div style={{ position: 'relative' }}>
                              <div
                                className={`avatar-gradient-${gradIndex}`}
                                style={{
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '14px',
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  color: '#fff',
                                  fontSize: '18px',
                                  fontWeight: '700',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                }}
                              >
                                {conv.user_name.charAt(0).toUpperCase()}
                              </div>
                              {conv.unread_count > 0 && (
                                <div
                                  className="pulse-badge"
                                  style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '-4px',
                                    background: '#ff3b30',
                                    color: '#fff',
                                    borderRadius: '50%',
                                    minWidth: '18px',
                                    height: '18px',
                                    padding: '0 5px',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    border:
                                      '2px solid ' +
                                      (isDark ? '#1a1a24' : '#fff'),
                                  }}
                                >
                                  {conv.unread_count}
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'baseline',
                                  marginBottom: '3px',
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: '700',
                                    fontSize: '14px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    color: isDark ? '#fff' : '#1f2937',
                                  }}
                                >
                                  {conv.user_name}
                                </div>
                                <div style={{ fontSize: '10px', color: '#888' }}>
                                  {formatTime(conv.last_message_time)}
                                </div>
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: '12px',
                                    color:
                                      conv.unread_count > 0
                                        ? isDark
                                          ? '#fff'
                                          : '#000'
                                        : '#888',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    fontWeight:
                                      conv.unread_count > 0 ? '600' : '400',
                                  }}
                                >
                                  {conv.is_last_message_mine && (
                                    <span
                                      style={{
                                        color: '#14b8a6',
                                        marginRight: '4px',
                                        fontWeight: '600',
                                      }}
                                    >
                                      {t('you')}
                                    </span>
                                  )}
                                  {conv.last_message}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </motion.div>
                )}

                {/* Monitoring List View */}
                {currentView === VIEWS.MONITORING_LIST && (
                  <motion.div
                    key="monitoring-list-view"
                    className={`premium-chat-scrollbar ${isDark ? 'dark-mode-scrollbar' : ''}`}
                    initial={{ opacity: 0, x: -30, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: -30, filter: 'blur(4px)' }}
                    transition={{ type: 'spring', damping: 22, stiffness: 220 }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      overflowY: 'auto',
                    }}
                  >
                    <div
                      onClick={() => setCurrentView(VIEWS.LIST)}
                      style={{
                        padding: '15px 20px',
                        cursor: 'pointer',
                        color: isDark ? '#10b981' : '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontWeight: '600',
                        borderBottom: isDark
                          ? '1px solid #222'
                          : '1px solid #eee',
                      }}
                    >
                      <i className="bi bi-arrow-left"></i>
                      Orqaga
                    </div>

                    {monitoringPairs.length === 0 ? (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '40px',
                          color: '#888',
                        }}
                      >
                        <i
                          className="bi bi-shield-lock"
                          style={{ fontSize: '40px', opacity: 0.2 }}
                        ></i>
                        <div style={{ marginTop: '10px', fontSize: '14px' }}>
                          Yozishmalar mavjud emas
                        </div>
                      </div>
                    ) : (
                      monitoringPairs.map((pair) => (
                        <motion.div
                          key={`${pair.admin_id}-${pair.assistant_id}`}
                          whileHover={{
                            backgroundColor: isDark ? '#2c2c2c' : '#f8f9fa',
                          }}
                          onClick={() => {
                            setSelectedMonitoringPair(pair);
                            setCurrentView(VIEWS.MONITORING_CHAT);
                          }}
                          style={{
                            padding: '15px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            cursor: 'pointer',
                            borderBottom: isDark
                              ? '1px solid #222'
                              : '1px solid #eee',
                          }}
                        >
                          <div style={{ position: 'relative' }}>
                            <div
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: '#10b981',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: '#fff',
                                fontSize: '18px',
                                fontWeight: '700',
                              }}
                            >
                              <i className="bi bi-people-fill"></i>
                            </div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'baseline',
                                marginBottom: '4px',
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: '600',
                                  fontSize: '14px',
                                  color: isDark ? '#fff' : '#000',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {pair.admin_name} ↔ {pair.assistant_name}
                              </div>
                              <div style={{ fontSize: '10px', color: '#888' }}>
                                {formatTime(pair.last_message_time)}
                              </div>
                            </div>
                            <div
                              style={{
                                fontSize: '12px',
                                color: '#888',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {pair.last_message || 'Yozishma boshlanmagan'}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}

                {(currentView === VIEWS.CHAT ||
                  currentView === VIEWS.BROADCAST ||
                  currentView === VIEWS.MONITORING_CHAT) && (
                  /* Individual Chat View */
                  <motion.div
                    key={`chat-${selectedUser?.id || 'broadcast'}`}
                    initial={{ opacity: 0, x: 30, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, x: 30, filter: 'blur(4px)' }}
                    transition={{ type: 'spring', damping: 22, stiffness: 220 }}
                    onAnimationComplete={() => scrollToBottom('auto')}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                  >
                    {isDragOver && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'rgba(15,118,110,0.1)',
                          backdropFilter: 'blur(4px)',
                          zIndex: 100,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          border: '2px dashed #0f766e',
                          margin: '10px',
                          borderRadius: '16px',
                          color: '#0f766e',
                          pointerEvents: 'none',
                        }}
                      >
                        <i
                          className="bi bi-cloud-arrow-up-fill"
                          style={{ fontSize: '48px' }}
                        ></i>
                        <div style={{ fontWeight: '700', marginTop: '10px' }}>
                          {t('dropFileHere')}
                        </div>
                      </div>
                    )}
                    <div
                      className={`premium-chat-scrollbar ${isDark ? 'dark-mode-scrollbar' : ''}`}
                      style={{ flex: 1, overflowY: 'auto', padding: '15px' }}
                    >
                      {messages.map((msg, i) => {
                        const isMine =
                          currentView === VIEWS.MONITORING_CHAT
                            ? msg.sender_id === selectedMonitoringPair?.admin_id
                            : msg.sender_id === user.id;

                        const senderName =
                          currentView === VIEWS.MONITORING_CHAT
                            ? msg.sender_id === selectedMonitoringPair?.admin_id
                              ? selectedMonitoringPair?.admin_name
                              : selectedMonitoringPair?.assistant_name
                            : '';

                        const isRecent = messages.length - i <= 15;

                        return (
                          <motion.div
                            initial={isRecent ? { opacity: 0, y: 15, scale: 0.95 } : false}
                            animate={isRecent ? { opacity: 1, y: 0, scale: 1 } : false}
                            transition={{
                              type: 'spring',
                              stiffness: 350,
                              damping: 25,
                              delay: isRecent ? (15 - (messages.length - i)) * 0.025 : 0,
                            }}
                            key={msg.id || i}
                            onMouseEnter={() => setHoveredMessageId(msg.id)}
                            onMouseLeave={() => setHoveredMessageId(null)}
                            style={{
                              marginBottom: msg.reaction ? '24px' : '15px',
                              textAlign: isMine ? 'right' : 'left',
                              position: 'relative',
                              zIndex: hoveredMessageId === msg.id ? 50 : 1,
                            }}
                          >
                            {currentView === VIEWS.MONITORING_CHAT && (
                              <div
                                style={{
                                  fontSize: '11px',
                                  color: '#888',
                                  marginBottom: '4px',
                                  padding: isMine ? '0 15px 0 0' : '0 0 0 15px',
                                }}
                              >
                                {senderName}
                              </div>
                            )}
                            <div
                              onContextMenu={(e) => {
                                if (isAdmin && msg.sender_id === user.id) {
                                  e.preventDefault();
                                  const menuWidth = 160;
                                  const menuHeight = 100;
                                  let x = e.pageX;
                                  let y = e.pageY;
                                  if (x + menuWidth > window.innerWidth) {
                                    x = window.innerWidth - menuWidth - 10;
                                  }
                                  if (y + menuHeight > window.innerHeight) {
                                    y = window.innerHeight - menuHeight - 10;
                                  }
                                  setContextMenu({
                                    visible: true,
                                    x: x,
                                    y: y,
                                    messageId: msg.id,
                                    content: msg.content,
                                  });
                                }
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: isMine
                                  ? 'flex-end'
                                  : 'flex-start',
                                maxWidth: '100%',
                                position: 'relative',
                              }}
                            >
                              <motion.div
                                whileHover={{ scale: 1.01 }}
                                style={{
                                  display: 'inline-block',
                                  padding: '10px 16px',
                                  borderRadius: isMine
                                    ? '18px 18px 4px 18px'
                                    : '18px 18px 18px 4px',
                                  background: isMine
                                    ? currentView === VIEWS.BROADCAST
                                      ? 'linear-gradient(135deg, #ff9500 0%, #ffa502 100%)'
                                      : 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)'
                                    : isDark
                                      ? 'rgba(255, 255, 255, 0.08)'
                                      : 'rgba(255, 255, 255, 0.9)',
                                  color: isMine
                                    ? '#fff'
                                    : isDark
                                      ? '#f3f4f6'
                                      : '#1f2937',
                                  maxWidth: '80%',
                                  boxShadow: isDark
                                    ? '0 4px 15px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)'
                                    : '0 4px 15px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.4)',
                                  border: isDark
                                    ? '1px solid rgba(255, 255, 255, 0.05)'
                                    : '1px solid rgba(0, 0, 0, 0.04)',
                                  fontSize: '14px',
                                  position: 'relative',
                                  textAlign: 'left',
                                  backdropFilter: isMine ? 'none' : 'blur(8px)',
                                }}
                              >
                                {msg.file_url && (
                                  <div
                                    style={{
                                      marginBottom: '8px',
                                      maxWidth: '100%',
                                    }}
                                  >
                                    {isImage(msg.file_url) ? (
                                      <a
                                        href={`${API_BASE}${msg.file_url}`}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        <img
                                          src={`${API_BASE}${msg.file_url}`}
                                          alt="file"
                                          style={{
                                            maxWidth: '100%',
                                            borderRadius: '12px',
                                            border: isDark
                                              ? '1px solid #444'
                                              : '1px solid #eee',
                                          }}
                                        />
                                      </a>
                                    ) : (
                                      <div
                                        onClick={() =>
                                          window.open(
                                            `${API_BASE}${msg.file_url}`,
                                            '_blank'
                                          )
                                        }
                                        style={{
                                          background: isDark
                                            ? 'rgba(255,255,255,0.05)'
                                            : 'rgba(0,0,0,0.03)',
                                          padding: '12px',
                                          borderRadius: '12px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '12px',
                                          border: isDark
                                            ? '1px solid rgba(255,255,255,0.1)'
                                            : '1px solid rgba(0,0,0,0.05)',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: isMine
                                              ? 'rgba(255,255,255,0.2)'
                                              : '#0f766e',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            color: '#fff',
                                            fontSize: '20px',
                                          }}
                                        >
                                          <i
                                            className={`bi ${getFileIcon(msg.file_url)}`}
                                          ></i>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div
                                            style={{
                                              fontSize: '13px',
                                              fontWeight: '600',
                                              whiteSpace: 'nowrap',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              color: isMine
                                                ? '#fff'
                                                : isDark
                                                  ? '#eee'
                                                  : '#333',
                                            }}
                                          >
                                            {msg.content.replace(
                                              /^(Fayl|File|Файл|Файлды|Fayly|Dosya|Файлdar):\s*/i,
                                              ''
                                            )}
                                          </div>
                                          <a
                                            href={`${API_BASE}${msg.file_url}`}
                                            download
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{
                                              fontSize: '11px',
                                              color: isMine
                                                ? 'rgba(255,255,255,0.8)'
                                                : '#0f766e',
                                              textDecoration: 'none',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              marginTop: '2px',
                                            }}
                                          >
                                            <i className="bi bi-download"></i>{' '}
                                            {t('download')}
                                          </a>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {msg.content.split(/(\[.*?\]\(.*?\))/g).map((part, i) => {
                                  const match = part.match(/\[(.*?)\]\((.*?)\)/);
                                  if (match) {
                                    return <a key={i} href={match[2]} style={{ color: isDark ? '#64b5f6' : '#1976d2', textDecoration: 'underline' }}>{match[1]}</a>;
                                  }
                                  return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
                                })}
                                <div
                                  style={{
                                    fontSize: '9px',
                                    opacity: 0.6,
                                    marginTop: '4px',
                                    textAlign: 'right',
                                  }}
                                >
                                  {formatTime(msg.created_at)}
                                  {msg.sender_id === user.id && (
                                    <i
                                      className={`bi bi-check2${msg.is_read ? '-all' : ''} ms-1`}
                                    ></i>
                                  )}
                                </div>
                                {msg.reaction && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      right:
                                        msg.sender_id === user.id
                                          ? '8px'
                                          : 'auto',
                                      left:
                                        msg.sender_id === user.id
                                          ? 'auto'
                                          : '8px',
                                      bottom: '-18px',
                                      minWidth: '28px',
                                      height: '24px',
                                      borderRadius: '14px',
                                      background: isDark ? '#242424' : '#fff',
                                      border: isDark
                                        ? '1px solid rgba(255,255,255,0.12)'
                                        : '1px solid rgba(15,23,42,0.1)',
                                      boxShadow:
                                        '0 6px 14px rgba(15,23,42,0.16)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '14px',
                                      lineHeight: 1,
                                    }}
                                  >
                                    {msg.reaction}
                                  </div>
                                )}
                                <AnimatePresence>
                                  {hoveredMessageId === msg.id && (
                                    <motion.div
                                      initial={{
                                        opacity: 0,
                                        y: 8,
                                        scale: 0.9,
                                        filter: 'blur(4px)',
                                      }}
                                      animate={{
                                        opacity: 1,
                                        y: 0,
                                        scale: 1,
                                        filter: 'blur(0px)',
                                      }}
                                      exit={{
                                        opacity: 0,
                                        y: 6,
                                        scale: 0.92,
                                        filter: 'blur(4px)',
                                      }}
                                      transition={{
                                        type: 'spring',
                                        stiffness: 450,
                                        damping: 26,
                                      }}
                                      style={{
                                        position: 'absolute',
                                        bottom: i === 0 ? 'auto' : 'calc(100% + 6px)',
                                        top: i === 0 ? 'calc(100% + 6px)' : 'auto',
                                        right: msg.sender_id === user.id ? '0' : 'auto',
                                        left: msg.sender_id === user.id ? 'auto' : '0',
                                        zIndex: 100,
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: '5px',
                                        padding: '4px 6px',
                                        borderRadius: '24px',
                                        background: isDark
                                          ? 'rgba(28, 28, 35, 0.92)'
                                          : 'rgba(255, 255, 255, 0.95)',
                                        border: isDark
                                          ? '1px solid rgba(255,255,255,0.1)'
                                          : '1px solid rgba(0,0,0,0.08)',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
                                        backdropFilter: 'blur(12px)',
                                      }}
                                    >
                                      {MESSAGE_REACTIONS.map(
                                        (reaction, index) => (
                                          <motion.button
                                            key={`${msg.id || i}-${reaction}`}
                                            type="button"
                                            onClick={() =>
                                              handleReaction(msg.id, reaction)
                                            }
                                            title={reaction}
                                            initial={{
                                              opacity: 0,
                                              scale: 0.85,
                                            }}
                                            animate={{
                                              opacity: 1,
                                              scale: 1,
                                            }}
                                            transition={{
                                              delay: index * 0.02,
                                              type: 'spring',
                                              stiffness: 500,
                                              damping: 22,
                                            }}
                                            whileHover={{ scale: 1.25, rotate: 8 }}
                                            whileTap={{ scale: 0.88 }}
                                            style={{
                                              width: '28px',
                                              height: '28px',
                                              borderRadius: '50%',
                                              border:
                                                msg.reaction === reaction
                                                  ? '1px solid #0f766e'
                                                  : '1px solid transparent',
                                              background:
                                                msg.reaction === reaction
                                                  ? isDark
                                                    ? 'rgba(20,184,166,0.24)'
                                                    : 'rgba(15,118,110,0.12)'
                                                  : 'transparent',
                                              cursor: msg.id
                                                ? 'pointer'
                                                : 'default',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              fontSize: '15px',
                                              lineHeight: 1,
                                              padding: 0,
                                            }}
                                            disabled={!msg.id}
                                          >
                                            {reaction}
                                          </motion.button>
                                        )
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            </div>
                          </motion.div>
                        );
                      })}
                      {currentView === VIEWS.CHAT && typingUsers.some(u => u.id === selectedUser?.id) && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 12px',
                            marginTop: '8px',
                            marginBottom: '4px',
                            maxWidth: '120px',
                            borderRadius: '14px 14px 14px 4px',
                            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                          }}
                        >
                          <div style={{ display: 'flex', gap: '3px' }}>
                            {[0, 1, 2].map((dot) => (
                              <motion.span
                                key={dot}
                                animate={{ y: [0, -4, 0] }}
                                transition={{
                                  duration: 0.8,
                                  repeat: Infinity,
                                  delay: dot * 0.15,
                                  ease: "easeInOut"
                                }}
                                style={{
                                  width: '5px',
                                  height: '5px',
                                  borderRadius: '50%',
                                  background: '#0f766e',
                                  display: 'inline-block',
                                }}
                              />
                            ))}
                          </div>
                          <span style={{ fontSize: '11px', color: '#888', fontWeight: '500' }}>
                            {t('typing')}
                          </span>
                        </motion.div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    {currentView !== VIEWS.MONITORING_CHAT && (
                      <div
                        style={{
                          padding: '12px 18px',
                          background: isDark ? 'rgba(24, 24, 28, 0.8)' : 'rgba(255, 255, 255, 0.85)',
                          backdropFilter: isMobile ? 'none' : 'blur(10px)',
                          borderTop: isDark
                            ? '1px solid rgba(255, 255, 255, 0.05)'
                            : '1px solid rgba(0, 0, 0, 0.05)',
                        }}
                      >
                        {editingMessageId && (
                          <div
                            style={{
                              padding: '8px 15px',
                              fontSize: '12px',
                              color: '#888',
                              display: 'flex',
                              justifyContent: 'space-between',
                              backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
                              borderBottom: '1px solid rgba(0,0,0,0.05)',
                              borderRadius: '8px',
                              marginBottom: '8px',
                            }}
                          >
                            <span>Tahrirlanmoqda...</span>
                            <i
                              className="bi bi-x-circle-fill"
                              style={{ cursor: 'pointer', color: '#ff3b30' }}
                              onClick={() => {
                                setEditingMessageId(null);
                                setContent('');
                              }}
                            ></i>
                          </div>
                        )}
                        <div
                          style={{
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'center',
                          }}
                        >
                          <motion.button
                            whileHover={{ scale: 1.12, rotate: 15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => fileInputRef.current.click()}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: '22px',
                              color: '#0f766e',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              padding: 0,
                            }}
                          >
                            <i className="bi bi-paperclip"></i>
                          </motion.button>
                          <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                          />
                          <input
                            type="text"
                            value={content}
                            onChange={(e) => {
                              setContent(e.target.value);
                              handleTyping();
                            }}
                            onKeyPress={(e) =>
                              e.key === 'Enter' && handleSend()
                            }
                            placeholder={
                              currentView === VIEWS.BROADCAST
                                ? t('typeMessageAll')
                                : t('typeMessage')
                            }
                            style={{
                              flex: 1,
                              border: isDark
                                ? '1px solid rgba(255, 255, 255, 0.1)'
                                : '1px solid rgba(0, 0, 0, 0.08)',
                              background: isDark ? 'rgba(0, 0, 0, 0.2)' : '#f3f4f6',
                              borderRadius: '24px',
                              padding: '10px 18px',
                              color: isDark ? '#fff' : '#000',
                              outline: 'none',
                              fontSize: '14px',
                            }}
                          />
                          <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => handleSend()}
                            disabled={!content.trim() && !isUploading}
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background:
                                currentView === VIEWS.BROADCAST
                                  ? 'linear-gradient(135deg, #ff9500 0%, #ff5e00 100%)'
                                  : 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                              color: '#fff',
                              border: 'none',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              boxShadow:
                                currentView === VIEWS.BROADCAST
                                  ? '0 4px 12px rgba(255,149,0,0.3)'
                                  : '0 4px 12px rgba(15,118,110,0.24)',
                              cursor: 'pointer',
                            }}
                          >
                            <i className="bi bi-send-fill"></i>
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </motion.div>
          </motion.div>
        ) : (
          /* Floating Button */
          <motion.button
            className="float-chat-button"
            layoutId="chat-box"
            transition={{
              type: 'spring',
              damping: 26,
              stiffness: 240,
            }}
            whileHover={{ 
              scale: 1.08, 
              rotate: 5, 
              boxShadow: isDark 
                ? '0 8px 25px rgba(20,184,166,0.35)' 
                : '0 8px 25px rgba(37,99,235,0.25)' 
            }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsOpen(true)}
            style={{
              width: '65px',
              height: '65px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0f766e 0%, #2563eb 100%)',
              color: '#fff',
              border: 'none',
              boxShadow: '0 5px 15px rgba(15,118,110,0.24)',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '28px',
              position: 'relative',
            }}
          >
            <i className="bi bi-chat-dots-fill"></i>
            {unreadCount > 0 && (
              <div
                className="pulse-badge"
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: '#ff3b30',
                  color: '#fff',
                  borderRadius: '50%',
                  minWidth: '22px',
                  height: '22px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  border: '2px solid ' + (isDark ? '#121212' : '#fff'),
                }}
              >
                {unreadCount}
              </div>
            )}
          </motion.button>
        )}
      </AnimatePresence>
      {contextMenu.visible && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: isDark ? '#333' : '#fff',
            border: `1px solid ${isDark ? '#444' : '#ddd'}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: '8px',
            zIndex: 9999,
            overflow: 'hidden',
            minWidth: '150px',
          }}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              setContent(contextMenu.content);
              setEditingMessageId(contextMenu.messageId);
              setContextMenu({ ...contextMenu, visible: false });
            }}
            style={{
              padding: '10px 16px',
              cursor: 'pointer',
              borderBottom: `1px solid ${isDark ? '#444' : '#eee'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: isDark ? '#fff' : '#000',
            }}
          >
            <i className="bi bi-pencil"></i> Tahrirlash
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setContextMenu({ ...contextMenu, visible: false });
              setConfirmDialog({
                open: true,
                message: "Xabarni o'chirishni xohlaysizmi?",
                onConfirm: async () => {
                  await chatService.deleteMessage(contextMenu.messageId);
                  fetchMessages();
                }
              });
            }}
            style={{
              padding: '10px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#ff3b30',
            }}
          >
            <i className="bi bi-trash"></i> O'chirish
          </div>
        </div>
      )}

      {/* Custom Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        PaperProps={{
          sx: {
            background: isDark ? 'rgba(30, 30, 40, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            p: 1,
            minWidth: 280,
            maxWidth: 400,
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
          {t('confirm') || 'Tasdiqlash'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: isDark ? '#ccc' : '#444' }}>
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            {t('cancel') || 'Bekor qilish'}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (confirmDialog.onConfirm) {
                await confirmDialog.onConfirm();
              }
              setConfirmDialog(prev => ({ ...prev, open: false }));
            }}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            autoFocus
          >
            {t('delete') || "O'chirish"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

// Helper Components
const IconButton = ({
  children,
  onClick,
  color = 'inherit',
  bg = 'transparent',
}) => (
  <button
    onClick={onClick}
    style={{
      background: bg,
      border: 'none',
      color: color,
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',
    }}
  >
    {children}
  </button>
);

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const isImage = (url) => {
  if (!url) return false;
  const ext = url.split('.').pop().toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
};

const getFileIcon = (url) => {
  if (!url) return 'bi-file-earmark';
  const ext = url.split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'bi-file-earmark-pdf-fill';
    case 'doc':
    case 'docx':
      return 'bi-file-earmark-word-fill';
    case 'xls':
    case 'xlsx':
      return 'bi-file-earmark-excel-fill';
    case 'zip':
    case 'rar':
    case '7z':
      return 'bi-file-earmark-zip-fill';
    default:
      return 'bi-file-earmark-fill';
  }
};

export default ChatWidget;

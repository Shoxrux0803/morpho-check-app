import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { chatService } from '../../services/chatService';
import { toast } from 'react-hot-toast';
import { useThemeMode } from '../../providers/ThemeProviderMUI';

const VIEWS = {
  LIST: 'LIST',
  CHAT: 'CHAT',
  BROADCAST: 'BROADCAST',
};

const ChatWidget = () => {
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState(VIEWS.LIST);
  // Set initial view once user is available
  useEffect(() => {
    if (user) {
      if (user.role === 'superadmin') {
        if (!selectedUser) setCurrentView(VIEWS.LIST);
      } else {
        setCurrentView(VIEWS.CHAT);
      }
    }
  }, [user?.role, isOpen]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
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

  const API_BASE = (
    process.env.REACT_APP_API_URL || 'http://localhost:8000/api'
  ).replace('/api', '');

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isAdmin = user?.role === 'superadmin';

  const quickPhrases = isAdmin
    ? [
        'Xush kelibsiz!',
        'Muammo hal qilindi',
        'Hisobot tayyor',
        'Tushunarlimi?',
      ]
    : ['Yordam kerak', 'Xatolik bor', 'Hisobotni tekshiring', 'Rahmat!'];

  const scrollToBottom = (behavior = 'auto') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    if (user) {
      if (isAdmin && currentView === VIEWS.LIST) {
        fetchConversations();
      } else if (
        currentView === VIEWS.CHAT ||
        currentView === VIEWS.BROADCAST
      ) {
        fetchMessages();
      }

      const interval = setInterval(() => {
        if (isAdmin && currentView === VIEWS.LIST) fetchConversations();
        else if (currentView === VIEWS.CHAT || currentView === VIEWS.BROADCAST)
          fetchMessages();
        fetchTypingStatus();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [user, currentView, selectedUser]);

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
  }, [isOpen]);

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
      if (isAdmin) {
        if (selectedUser?.id) {
          data = await chatService.getHistoryWithUser(selectedUser.id);
        } else if (currentView === VIEWS.BROADCAST) {
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
      if (isAdmin && selectedUser?.id) {
        await chatService.markUserMessagesRead(selectedUser.id);
        fetchConversations();
      } else {
        await chatService.markAllRead();
        if (!isAdmin) setUnreadCount(0);
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
      const recipientId = isAdmin
        ? currentView === VIEWS.BROADCAST
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
      toast.error('Xabar yuborishda xatolik');
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
      await handleSend(`Fayl: ${file.name}`, file_url);
    } catch (error) {
      toast.error('Fayl yuklashda xatolik');
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

  const filteredConversations = conversations.filter((c) =>
    c.user_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openConversation = (conv) => {
    setSelectedUser({ id: conv.user_id, name: conv.user_name });
    setCurrentView(VIEWS.CHAT);
    setMessages([]); // Clear old messages while loading
  };

  if (!user) return null;

  return (
    <div
      className="chat-widget-wrapper"
      style={{
        position: 'fixed',
        bottom: isMobile ? '12px' : '30px',
        left: isMobile ? '12px' : 'auto',
        right: isMobile ? 'auto' : '30px',
        zIndex: 1000,
      }}
    >
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="chat-window"
            layoutId="chat-box"
            initial={{ opacity: 0, scale: 0.5, borderRadius: '50%' }}
            animate={{
              opacity: 1,
              scale: 1,
              borderRadius: isMobile ? '18px' : '24px',
            }}
            exit={{ opacity: 0, scale: 0.5, borderRadius: '50%' }}
            style={{
              width: isMobile ? 'calc(100vw - 24px)' : '400px',
              height: isMobile ? 'calc(100dvh - 88px)' : '650px',
              maxHeight: isMobile ? 'calc(100dvh - 88px)' : '90vh',
              background: isDark ? '#1e1e1e' : '#ffffff',
              backdropFilter: 'blur(20px)',
              boxShadow: isDark
                ? '0 20px 40px rgba(0,0,0,0.4)'
                : '0 20px 40px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: isDark
                ? '1px solid rgba(255,255,255,0.1)'
                : '1px solid rgba(0,0,0,0.05)',
              marginBottom: isMobile ? '0' : '10px',
              color: isDark ? '#fff' : '#000',
              transformOrigin: isMobile ? 'bottom left' : 'bottom right',
              left: isMobile ? 0 : 'auto',
              right: isMobile ? 'auto' : 0,
              borderRadius: isMobile ? '18px' : '24px',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '15px 20px',
                background:
                  currentView === VIEWS.BROADCAST
                    ? 'linear-gradient(135deg, #ff9500 0%, #ff5e00 100%)'
                    : 'linear-gradient(135deg, #0f766e 0%, #2563eb 100%)',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                {isAdmin && currentView !== VIEWS.LIST && (
                  <IconButton
                    onClick={() => {
                      setCurrentView(VIEWS.LIST);
                      setSelectedUser(null);
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
                      ? 'Xabarlar'
                      : selectedUser?.name || 'Chat'}
                  </h6>
                  {currentView === VIEWS.CHAT && (
                    <div style={{ fontSize: '10px', opacity: 0.8 }}>
                      {typingUsers.some((u) => u.id === selectedUser?.id)
                        ? 'yozmoqda...'
                        : 'onlayn'}
                    </div>
                  )}
                  {currentView === VIEWS.BROADCAST && (
                    <div style={{ fontSize: '10px', opacity: 0.8 }}>
                      Hamma uchun ochiq e'lon
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
                background: isDark ? '#121212' : '#f8f9fa',
                position: 'relative',
              }}
            >
              <AnimatePresence mode="wait">
                {currentView === VIEWS.LIST ? (
                  /* Conversation List */
                  <motion.div
                    key="list-view"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
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
                          placeholder="Qidirish..."
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
                    <div
                      onClick={() => {
                        setCurrentView(VIEWS.BROADCAST);
                        setSelectedUser({ name: 'Hammaga xabar' });
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
                          E'lonlar (Broadcast)
                        </div>
                        <div style={{ fontSize: '12px', color: '#888' }}>
                          Barcha foydalanuvchilarga xabar
                        </div>
                      </div>
                    </div>

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
                        <p style={{ marginTop: '10px' }}>Xabarlar topilmadi</p>
                      </div>
                    ) : (
                      filteredConversations.map((conv, idx) => (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          key={conv.user_id}
                          onClick={() => openConversation(conv)}
                          style={{
                            padding: '12px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            cursor: 'pointer',
                            borderBottom: isDark
                              ? '1px solid #222'
                              : '1px solid #eee',
                            transition: 'background 0.2s',
                            background: isDark ? 'transparent' : 'transparent',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = isDark
                              ? '#2c2c2c'
                              : '#f1f3f5')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = 'transparent')
                          }
                        >
                          <div style={{ position: 'relative' }}>
                            <div
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: '#0f766e',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                color: '#fff',
                                fontSize: '18px',
                                fontWeight: '700',
                              }}
                            >
                              {conv.user_name.charAt(0)}
                            </div>
                            {conv.unread_count > 0 && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '-2px',
                                  right: '-2px',
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
                                    (isDark ? '#1e1e1e' : '#fff'),
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
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: '700',
                                  fontSize: '14px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
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
                                      color: '#0f766e',
                                      marginRight: '4px',
                                    }}
                                  >
                                    Siz:
                                  </span>
                                )}
                                {conv.last_message}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                ) : (
                  /* Individual Chat View */
                  <motion.div
                    key={`chat-${selectedUser?.id || 'broadcast'}`}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
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
                          Faylni shu yerga tashlang
                        </div>
                      </div>
                    )}
                    <div
                      style={{ flex: 1, overflowY: 'auto', padding: '15px' }}
                    >
                      {messages.map((msg, i) => (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          key={msg.id || i}
                          style={{
                            marginBottom: '15px',
                            textAlign:
                              msg.sender_id === user.id ? 'right' : 'left',
                          }}
                        >
                          <div
                            style={{
                              display: 'inline-block',
                              padding: '10px 15px',
                              borderRadius:
                                msg.sender_id === user.id
                                  ? '18px 18px 4px 18px'
                                  : '18px 18px 18px 4px',
                              background:
                                msg.sender_id === user.id
                                  ? currentView === VIEWS.BROADCAST
                                    ? '#ff9500'
                                    : '#0f766e'
                                  : isDark
                                    ? '#333'
                                    : '#fff',
                              color:
                                msg.sender_id === user.id
                                  ? '#fff'
                                  : isDark
                                    ? '#eee'
                                    : '#333',
                              maxWidth: '80%',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                              fontSize: '14px',
                              position: 'relative',
                              textAlign: 'left',
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
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background:
                                          msg.sender_id === user.id
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
                                          color:
                                            msg.sender_id === user.id
                                              ? '#fff'
                                              : isDark
                                                ? '#eee'
                                                : '#333',
                                        }}
                                      >
                                        {msg.content.replace('Fayl: ', '')}
                                      </div>
                                      <a
                                        href={`${API_BASE}${msg.file_url}`}
                                        download
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                          fontSize: '11px',
                                          color:
                                            msg.sender_id === user.id
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
                                        Yuklab olish
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {msg.content}
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
                          </div>
                        </motion.div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div
                      style={{
                        padding: '15px',
                        background: isDark ? '#1e1e1e' : '#fff',
                        borderTop: '1px solid rgba(0,0,0,0.05)',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => fileInputRef.current.click()}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '20px',
                            color: '#888',
                          }}
                        >
                          <i className="bi bi-paperclip"></i>
                        </button>
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
                          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                          placeholder={
                            currentView === VIEWS.BROADCAST
                              ? 'Barcha foydalanuvchilarga xabar yozing...'
                              : 'Xabar yozing...'
                          }
                          style={{
                            flex: 1,
                            border: 'none',
                            background: isDark ? '#333' : '#f1f3f5',
                            borderRadius: '20px',
                            padding: '8px 15px',
                            color: isDark ? '#fff' : '#000',
                            outline: 'none',
                          }}
                        />
                        <button
                          onClick={() => handleSend()}
                          disabled={!content.trim() && !isUploading}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background:
                              currentView === VIEWS.BROADCAST
                                ? '#ff9500'
                                : '#0f766e',
                            color: '#fff',
                            border: 'none',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            boxShadow:
                              currentView === VIEWS.BROADCAST
                                ? '0 4px 10px rgba(255,149,0,0.3)'
                                : '0 4px 10px rgba(15,118,110,0.24)',
                          }}
                        >
                          <i className="bi bi-send-fill"></i>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          /* Floating Button */
          <motion.button
            layoutId="chat-box"
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
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: '#ff3b30',
                  color: '#fff',
                  borderRadius: '50%',
                  minWidth: '24px',
                  height: '24px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  border: '3px solid #fff',
                }}
              >
                {unreadCount}
              </div>
            )}
          </motion.button>
        )}
      </AnimatePresence>
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

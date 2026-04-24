// src/components/Chat/ChatWidget.js
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { chatService } from '../../services/chatService';
import { toast } from 'react-hot-toast';
import { useThemeMode } from '../../providers/ThemeProviderMUI';

const ChatWidget = () => {
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState(null);
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isAdmin = user?.role === 'superadmin';

  const quickPhrases = isAdmin 
    ? ["Xush kelibsiz!", "Muammo hal qilindi", "Hisobot tayyor", "Tushunarlimi?"]
    : ["Yordam kerak", "Xatolik bor", "Hisobotni tekshiring", "Rahmat!"];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (user) {
      fetchMessages();
      fetchTypingStatus();
      const msgInterval = setInterval(fetchMessages, 5000); 
      const typingInterval = setInterval(fetchTypingStatus, 3000);
      return () => {
        clearInterval(msgInterval);
        clearInterval(typingInterval);
      };
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin && isOpen) {
      fetchUsers();
    }
    if (isOpen && unreadCount > 0) {
      handleMarkAllRead();
    }
  }, [isAdmin, isOpen]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await chatService.markAllRead();
      setUnreadCount(0);
    } catch (error) {
      console.error("Mark all read error", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await chatService.getMessages();
      const sorted = [...data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setMessages(sorted);
      
      if (!isOpen) {
        const unread = data.filter(m => !m.is_read && m.sender_id !== user.id).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Fetch messages error", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await chatService.getUsersForSuperadmin();
      setUsers(data.filter(u => u.id !== user.id));
    } catch (error) {
      console.error("Fetch users error", error);
    }
  };

  const fetchTypingStatus = async () => {
    try {
      const data = await chatService.getTypingStatus();
      setTypingUsers(data);
    } catch (error) {
      console.error("Fetch typing status error", error);
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await chatService.uploadFile(file);
      await handleSend(`Fayl yuborildi: ${file.name}`, file_url);
      toast.success("Fayl yuklandi");
    } catch (error) {
      toast.error("Faylni yuklashda xatolik");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async (msgContent = null, fileUrl = null) => {
    const finalContent = typeof msgContent === 'string' ? msgContent : content;
    if (!finalContent.trim() && !fileUrl) return;

    if (isAdmin && !isBroadcast && !selectedRecipientId) {
      toast.error("Iltimos, qabul qiluvchini tanlang");
      return;
    }

    try {
      await chatService.sendMessage(
        isAdmin ? (isBroadcast ? null : selectedRecipientId) : null,
        finalContent,
        (isAdmin && isBroadcast) ? 'broadcast' : 'direct',
        replyingTo?.id,
        fileUrl
      );
      if (typeof msgContent !== 'string') setContent('');
      setReplyingTo(null);
      setTimeout(fetchMessages, 500); 
      if (isAdmin && !fileUrl) toast.success("Xabar yuborildi");
    } catch (error) {
      toast.error("Xabar yuborishda xatolik");
    }
  };
  
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const messagesHtml = filteredMessages.map(msg => `
      <div style="margin-bottom: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">
        <div style="font-weight: 600; font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 4px;">
          ${msg.sender_name} • ${new Date(msg.created_at).toLocaleString('uz-UZ')}
        </div>
        ${msg.reply_to_id ? `
          <div style="background: #f8f9fa; padding: 6px 10px; border-left: 3px solid #007bff; font-size: 12px; margin: 5px 0 8px 0; color: #555; border-radius: 4px;">
            <div style="font-weight: bold; font-size: 10px; color: #007bff;">Javob: ${msg.reply_to_sender}</div>
            <div style="font-style: italic;">"${msg.reply_to_content}"</div>
          </div>
        ` : ''}
        <div style="font-size: 14px; line-height: 1.5; color: #333;">${msg.content}</div>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>MorphoCheck Chat Tarixi</title>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #007bff; padding-bottom: 15px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #007bff; }
            .meta { font-size: 12px; color: #777; text-align: right; }
            @media print {
              body { padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">MorphoCheck Chat Tarixi</div>
            <div class="meta">
              Sana: ${new Date().toLocaleDateString('uz-UZ')}<br>
              Chop etuvchi: ${user.name}
            </div>
          </div>
          <div class="messages">
            ${messagesHtml || '<p style="text-align: center; color: #999;">Xabarlar topilmadi</p>'}
          </div>
          <script>
            window.onload = function() { 
              setTimeout(() => {
                window.print(); 
                window.close();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredMessages = messages.filter(m => 
    m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.sender_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="chat-widget-wrapper" style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000 }}>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="chat-window"
            layoutId="chat-box"
            initial={{ opacity: 0, scale: 0.5, borderRadius: '50%' }}
            animate={{ opacity: 1, scale: 1, borderRadius: '24px' }}
            exit={{ opacity: 0, scale: 0.5, borderRadius: '50%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            style={{
              width: '380px',
              height: '600px',
              background: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 20px 40px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.3)',
              marginBottom: '10px',
              color: isDark ? '#fff' : '#000',
              transformOrigin: 'bottom right'
            }}
          >
            {/* Header */}
            <div style={{ 
              padding: '15px 20px', 
              background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)', 
              color: '#fff', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 10
            }}>
              {!isSearchOpen ? (
                <>
                  <div>
                    <h6 style={{ margin: 0, fontWeight: '700', fontSize: '15px' }}>
                      {isAdmin ? "Boshqaruv" : "Aloqa"}
                    </h6>
                  </div>
                  <div className="d-flex align-items-center">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      onClick={() => setIsSearchOpen(true)}
                      style={{ background: 'none', border: 'none', color: '#fff', marginRight: '12px', padding: 0 }}
                      title="Qidirish"
                    >
                      <i className="bi bi-search"></i>
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      onClick={handlePrint}
                      style={{ background: 'none', border: 'none', color: '#fff', marginRight: '12px', padding: 0 }}
                      title="Chop etish"
                    >
                      <i className="bi bi-printer"></i>
                    </motion.button>
                    <motion.button 
                      whileHover={{ rotate: 90, scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsOpen(false)} 
                      style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <i className="bi bi-x-lg" style={{ fontSize: '12px' }}></i>
                    </motion.button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                  <input 
                    autoFocus
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Qidirish..."
                    style={{ flex: 1, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '15px', padding: '4px 12px', color: '#fff', outline: 'none', fontSize: '13px' }}
                  />
                  <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} style={{ background: 'none', border: 'none', color: '#fff', marginLeft: '10px' }}>
                    <i className="bi bi-x-circle-fill"></i>
                  </button>
                </div>
              )}
            </div>

            {/* Admin Controls */}
            {isAdmin && (
              <div style={{ padding: '10px 15px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '12px' }}>
                <div className="d-flex align-items-center mb-1">
                  <input 
                    type="checkbox" 
                    id="broadcast" 
                    checked={isBroadcast} 
                    onChange={(e) => setIsBroadcast(e.target.checked)} 
                    style={{ cursor: 'pointer', transform: 'scale(0.8)' }}
                    className="me-2"
                  />
                  <label htmlFor="broadcast" style={{ cursor: 'pointer', fontWeight: '500' }}>Hammaga</label>
                </div>
                {!isBroadcast && (
                  <select 
                    value={selectedRecipientId || ''} 
                    onChange={(e) => setSelectedRecipientId(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '4px 8px', 
                      borderRadius: '8px', 
                      border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                      background: isDark ? '#333' : '#fff',
                      color: isDark ? '#fff' : '#000',
                      outline: 'none',
                      fontSize: '12px'
                    }}
                  >
                    <option value="">Kimga...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Message List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '15px', background: isDark ? '#1a1a1a' : '#fcfcfc' }}>
              <AnimatePresence initial={false}>
                {filteredMessages.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="text-center text-muted mt-5"
                  >
                    <i className="bi bi-chat-dots" style={{ fontSize: '30px', opacity: 0.3 }}></i>
                    <p className="mt-2" style={{ fontSize: '13px' }}>
                      {searchQuery ? "Natija topilmadi" : "Habarlar yo'q"}
                    </p>
                  </motion.div>
                ) : (
                  filteredMessages.map((msg, i) => (
                    <motion.div 
                      key={msg.id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ 
                        marginBottom: '15px', 
                        textAlign: msg.sender_id === user.id ? 'right' : 'left' 
                      }}
                    >
                      <div style={{ 
                        fontSize: '9px', 
                        color: '#999', 
                        marginBottom: '3px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {msg.sender_id === user.id ? "Siz" : msg.sender_name} 
                      </div>
                      <div style={{ 
                        display: 'inline-block', 
                        padding: '8px 14px', 
                        borderRadius: msg.sender_id === user.id ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: msg.sender_id === user.id 
                          ? 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)' 
                          : (isDark ? '#333' : '#fff'),
                        color: msg.sender_id === user.id ? '#fff' : (isDark ? '#eee' : '#333'),
                        maxWidth: '85%',
                        boxShadow: msg.sender_id === user.id ? '0 4px 10px rgba(0,123,255,0.2)' : '0 4px 10px rgba(0,0,0,0.03)',
                        fontSize: '13.5px',
                        lineHeight: '1.4',
                        wordBreak: 'break-word',
                        border: msg.sender_id === user.id ? 'none' : (isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)'),
                        position: 'relative',
                        group: 'true'
                      }} className="message-bubble">
                        {msg.reply_to_id && (
                          <div style={{
                            background: 'rgba(0,0,0,0.05)',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            borderLeft: '3px solid #007bff',
                            marginBottom: '5px',
                            fontSize: '11px',
                            opacity: 0.8,
                            textAlign: 'left'
                          }}>
                            <div style={{ fontWeight: 'bold', fontSize: '10px' }}>{msg.reply_to_sender}</div>
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                              {msg.reply_to_content}
                            </div>
                          </div>
                        )}
                        {msg.file_url && (
                          <div style={{ marginBottom: '8px' }}>
                            {msg.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                              <img 
                                src={`http://localhost:8000${msg.file_url}`} 
                                alt="Fayl" 
                                style={{ maxWidth: '100%', borderRadius: '8px', cursor: 'pointer' }}
                                onClick={() => window.open(`http://localhost:8000${msg.file_url}`, '_blank')}
                              />
                            ) : (
                              <a 
                                href={`http://localhost:8000${msg.file_url}`} 
                                target="_blank" 
                                rel="noreferrer"
                                style={{ 
                                  color: msg.sender_id === user.id ? '#fff' : '#007bff', 
                                  textDecoration: 'underline',
                                  fontSize: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px'
                                }}
                              >
                                <i className="bi bi-file-earmark-arrow-down"></i>
                                Faylni yuklab olish
                              </a>
                            )}
                          </div>
                        )}
                        {msg.content}
                        <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '2px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.sender_id === user.id && (
                            <i className={`bi bi-check2${msg.is_read ? '-all' : ''} ms-1`} style={{ fontSize: '12px', color: msg.is_read ? '#4ade80' : 'inherit' }}></i>
                          )}
                        </div>
                        
                        {/* Reply Button on Hover - simpler implementation via button */}
                        <button 
                          onClick={() => setReplyingTo(msg)}
                          style={{
                            position: 'absolute',
                            top: '50%',
                            [msg.sender_id === user.id ? 'left' : 'right']: '-35px',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#999',
                            cursor: 'pointer',
                            opacity: 0.6,
                            padding: '5px'
                          }}
                          title="Javob berish"
                        >
                          <i className="bi bi-reply-fill"></i>
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Typing Indicator */}
            <AnimatePresence>
              {typingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ padding: '4px 20px', fontSize: '11px', color: '#999', fontStyle: 'italic', background: isDark ? '#1a1a1a' : '#fcfcfc' }}
                >
                  {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'yozmoqda...' : 'yozishmoqda...'}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Phrases */}
            {!searchQuery && (
              <div style={{ padding: '8px 15px', background: isDark ? '#222' : '#f8f9fa', display: 'flex', overflowX: 'auto', gap: '8px', borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }} className="hide-scrollbar">
                {quickPhrases.map((phrase, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSend(phrase)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      border: '1px solid rgba(0,123,255,0.3)',
                      background: 'rgba(0,123,255,0.1)',
                      color: '#007bff',
                      fontSize: '11px',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}
                  >
                    {phrase}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Reply Preview */}
            {replyingTo && (
              <div style={{ 
                padding: '8px 15px', 
                background: isDark ? 'rgba(0,123,255,0.1)' : '#f0f7ff', 
                borderTop: '2px solid #007bff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div style={{ fontSize: '10px', color: '#007bff', fontWeight: 'bold' }}>
                    Javob berilmoqda: {replyingTo.sender_name}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {replyingTo.content}
                  </div>
                </div>
                <button 
                  onClick={() => setReplyingTo(null)}
                  style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}
                >
                  <i className="bi bi-x-circle"></i>
                </button>
              </div>
            )}

            {/* Input Area */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
              style={{ padding: '12px 15px', background: isDark ? '#222' : '#fff', borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }} 
              className="d-flex align-items-center"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: isDark ? '#999' : '#666', 
                  fontSize: '20px', 
                  marginRight: '10px',
                  cursor: isUploading ? 'default' : 'pointer'
                }}
              >
                {isUploading ? (
                  <div className="spinner-border spinner-border-sm" role="status" style={{ width: '18px', height: '18px' }}></div>
                ) : (
                  <i className="bi bi-paperclip"></i>
                )}
              </motion.button>
              <input 
                type="text" 
                value={content} 
                onChange={(e) => { setContent(e.target.value); handleTyping(); }}
                placeholder="Xabar yozing..."
                style={{ 
                  flex: 1, 
                  padding: '10px 18px', 
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', 
                  borderRadius: '20px', 
                  outline: 'none',
                  fontSize: '13px',
                  background: isDark ? '#333' : '#f8f9fa',
                  color: isDark ? '#fff' : '#000',
                  transition: 'all 0.2s'
                }}
              />
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="submit" 
                disabled={!content.trim()}
                style={{ 
                  marginLeft: '10px', 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  border: 'none', 
                  background: content.trim() ? '#007bff' : '#ccc', 
                  color: '#fff', 
                  cursor: content.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <i className="bi bi-send-fill"></i>
              </motion.button>
            </form>
          </motion.div>
        ) : (
          <motion.button
            key="chat-button"
            layoutId="chat-box"
            whileHover={{ scale: 1.05, boxShadow: '0 8px 25px rgba(0,123,255,0.4)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            style={{
              width: '65px',
              height: '65px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
              color: '#fff',
              border: 'none',
              boxShadow: '0 5px 15px rgba(0,123,255,0.3)',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '28px',
              position: 'relative'
            }}
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
            >
              <i className="bi bi-chat-dots-fill"></i>
            </motion.div>
            
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: '#ff3b30',
                    color: '#fff',
                    borderRadius: '50%',
                    minWidth: '24px',
                    height: '24px',
                    padding: '0 6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '3px solid #fff',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                  }}
                >
                  {unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWidget;

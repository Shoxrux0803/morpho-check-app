// src/components/AI/AIAssistantWidget.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import RobotAvatar from './RobotAvatar';
import {
  Box,
  Fab,
  Paper,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Avatar,
  Tooltip,
  Zoom,
  Fade,
  Chip,
} from '@mui/material';
import {
  SmartToy,
  Close,
  Send,
  AutoAwesome,
  InfoOutlined,
  AttachFile,
  Download,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import aiService from '../../services/aiService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

const TypewriterMessage = ({ content, onUpdate, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      index += 3; // Advance by multiple chars for smoother markdown rendering
      if (index > content.length) index = content.length;
      setDisplayedText(content.substring(0, index));
      if (onUpdate) onUpdate();
      if (index >= content.length) {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, 15);
    return () => clearInterval(timer);
  }, [content, onUpdate, onComplete]);

  return (
    <Box sx={{ fontSize: '0.875rem' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedText}</ReactMarkdown>
    </Box>
  );
};

const LOCALIZED_SMART_PROMPTS = {
  uz: [
    'Bemor BMI tahlili',
    "JSST me'yorlari haqida",
    "O'sish dinamikasi",
    'Tavsiyalar bering',
  ],
  ru: [
    'Анализ ИМТ пациента',
    'О нормах ВОЗ',
    'Динамика роста',
    'Дайте рекомендации',
  ],
  en: [
    'Patient BMI Analysis',
    'About WHO standards',
    'Growth dynamics',
    'Give recommendations',
  ],
  tr: [
    'Hasta BMI Analizi',
    'DSÖ standartları hakkında',
    'Büyüme dinamikleri',
    'Öneriler verin',
  ],
  tg: [
    'Таҳлили BMI-и бемор',
    'Дар бораи меъёрҳои ТУТ',
    'Динамикаи рушд',
    'Тавсияҳо диҳед',
  ],
  tm: [
    'Näsagyň BMI seljermesi',
    'BSG kadalary hakda',
    'Ösüş dinamikasy',
    'Maslahat beriň',
  ],
  ky: [
    'Бейтаптын ИМТ анализи',
    'ДСУ нормалары жөнүндө',
    'Өсүү динамикасы',
    'Сунуштарды бериңиз',
  ],
  kz: [
    'Пациенттің ДСИ талдауы',
    'ДДҰ нормалары туралы',
    'Өсу динамикасы',
    'Ұсыныстар беріңіз',
  ],
};

const WELCOME_MESSAGES = {
  uz: "Salom! Men MorphoAI yordamchisiman. Sizga loyiha haqida ma'lumot berishim yoki tahlillarni kiritishda yordam berishim mumkin. Qanday yordam bera olaman?",
  ru: 'Здравствуйте! Я помощник MorphoAI. Я могу предоставить информацию о проекте или помочь с вводом анализов. Чем я могу помочь?',
  en: 'Hello! I am MorphoAI assistant. I can provide project information or help with entering measurements. How can I help you?',
  tr: 'Merhaba! Ben MorphoAI yardımcısıyım. Proje hakkında bilgi verebilir veya ölçümleri girmenize yardımcı olabilirim. Nasıl yardımcı olabilirim?',
  tg: 'Салом! Ман ёвар MorphoAI ҳастам. Ман метавонам дар бораи лоиҳа маълумот диҳам ё дар ворид кардани ченкуниҳо кӯмак кунам. Чӣ тавр метавонам кӯмак кунам?',
  tm: 'Salam! Men MorphoAI kömekçisi. Men size taslama barada maglumat berip bilerin ýa-da ölçegleri girizmäge kömek edip bilerin. Nähili kömek edip bilerin?',
  ky: 'Салам! Мен MorphoAI жардамчысымын. Мен сизге долбоор жөнүндө маалымат бере алам же өлчөөлөрдү киргизүүгө жардам бере алам. Кантип жардам бере алам?',
  kz: 'Сәлем! Мен MorphoAI көмекшісімін. Мен сізге жоба туралы ақпарат бере аламын немесе өлшемдерді енгізуге көмектесе аламын. Қалай көмектесе аламын?',
};

const PLACEHOLDERS = {
  uz: 'Xabar yozing...',
  ru: 'Введите сообщение...',
  en: 'Type a message...',
  tr: 'Bir mesaj yazın...',
  tg: 'Паём нависед...',
  tm: 'Habar ýazyň...',
  ky: 'Кабар жазыңыз...',
  kz: 'Хабарлама жазыңыз...',
};

const DISCLAIMERS = {
  uz: "Diqqat: AI tavsiyalari va bashoratlari faqat ma'lumot uchun. Tibbiy qarorlarni mutaxassis tasdiqlashi shart.",
  ru: 'Внимание: Рекомендации и прогнозы ИИ носят исключительно информационный характер. Медицинские решения должны быть подтверждены специалистом.',
  en: 'Disclaimer: AI recommendations and predictions are for information only. Medical decisions must be validated by a professional.',
  tr: 'Dikkat: Yapay zeka önerileri ve tahminleri yalnızca bilgi amaçlıdır. Tıbbi kararlar bir uzman tarafından onaylanmalıdır.',
  tg: 'Диққат: Тавсияҳо ва пешгӯиҳои AI танҳо барои маълумотанд. Қарорҳои тиббӣ бояд аз ҷониби мутахассис тасдиқ карда шаванд.',
  tm: 'Üns beriň: AI maslahatlary we çaklamalary diňe maglumat üçin. Lukmançylyk kararlary hünärmen tarapyndan tassyklanmalydyr.',
  ky: 'Көңүл буруңуз: Жасалма интеллекттин сунуштары жана божомолдору маалымат үчүн гана. Медициналык чечимдер адис тарабындан тастыкталышы керек.',
  kz: 'Назар аударыңыз: Жасанды интеллект ұсыныстары мен болжамдары тек ақпараттық сипатта. Медициналық шешімдерді маман растауы тиіс.',
};

const PAGE_LABELS = {
  uz: 'Sahifa',
  ru: 'Страница',
  en: 'Page',
  tr: 'Sayfa',
  tg: 'Саҳифа',
  tm: 'Sahypa',
  ky: 'Баракча',
  kz: 'Парақша',
};

const ERROR_PREFIX = {
  uz: 'Uzr, xatolik yuz berdi.',
  ru: 'Извините, произошла ошибка.',
  en: 'Sorry, an error occurred.',
  tr: 'Üzgünüz, bir hata oluştu.',
  tg: 'Бубахшед, хатогӣ рӯй дод.',
  tm: 'Bagyşlaň, säwlik ýüze çykdy.',
  ky: 'Кечиресиз, ката кетti.',
  kz: 'Кешіріңіз, қате кетті.',
};

const AIAssistantWidget = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const { lang } = useLanguage();
  const location = useLocation();
  const { isAuthenticated, user, loading } = useAuth();
  const [guestEnabled, setGuestEnabled] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      import('../../services/api').then(({ getPublicChatStatus }) => {
        getPublicChatStatus()
          .then((res) => setGuestEnabled(res.ai_chat_enabled))
          .catch(() => setGuestEnabled(false));
      });
    }
  }, [isAuthenticated]);

  // Password visibility tracking for login page robot eyes
  const [passwordVisible, setPasswordVisible] = useState(null);

  useEffect(() => {
    const isLoginPage = !isAuthenticated && (location.pathname === '/admin' || location.pathname === '/login');
    if (!isLoginPage) {
      setPasswordVisible(null);
      return;
    }
    // Default: eyes closed (password hidden)
    setPasswordVisible(false);
    const handleToggle = (e) => {
      setPasswordVisible(e.detail?.visible ?? false);
    };
    window.addEventListener('robot-password-toggle', handleToggle);
    return () => window.removeEventListener('robot-password-toggle', handleToggle);
  }, [location.pathname, isAuthenticated]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    setMessages((prev) => {
      if (
        prev.length === 0 ||
        (prev.length === 1 && prev[0].role === 'assistant')
      ) {
        return [
          {
            role: 'assistant',
            content: WELCOME_MESSAGES[lang] || WELCOME_MESSAGES.en,
          },
        ];
      }
      return prev;
    });
  }, [lang]);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Robot talking state: true ONLY when AI is responding/loading
  const isTalking = isLoading || messages.some((m) => m.animate === true);

  // Image Upload State
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMimeType, setImageMimeType] = useState(null);

  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages, isLoading, isOpen, scrollToBottom]);

  // Mutual exclusion logic
  useEffect(() => {
    const handleCloseAIChat = () => setIsOpen(false);
    window.addEventListener('close-ai-chat', handleCloseAIChat);
    return () => window.removeEventListener('close-ai-chat', handleCloseAIChat);
  }, []);

  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('close-main-chat'));
    }
  }, [isOpen]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(URL.createObjectURL(file));
      setImageMimeType(file.type);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImageBase64(null);
    setImageMimeType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (overrideMessage = null) => {
    const textToSend =
      overrideMessage !== null && typeof overrideMessage === 'string'
        ? overrideMessage
        : inputValue.trim();
    if (!textToSend && !imageBase64) return;
    if (isLoading) return;

    setInputValue('');

    const defaultImageMsg = {
      uz: 'Ilovadagi rasmni tahlil qiling.',
      ru: 'Проанализируйте изображение.',
      en: 'Analyze the image.',
      tr: 'Resmi analiz edin.',
      tg: 'Аксро таҳлил кунед.',
      tm: 'Suraty seljeriň.',
      ky: 'Сүрөттү анализдеңиз.',
      kz: 'Суретті талдаңыз.',
    };
    const imageMsgContent = defaultImageMsg[lang] || defaultImageMsg.en;

    const userMsg = {
      role: 'user',
      content: textToSend || imageMsgContent,
    };
    if (selectedImage) {
      userMsg.image = selectedImage; // For display only
    }
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Mock Context Data for now (in a real app, this would be fetched from Redux/Context based on the current patient)
    const contextData = {
      page: location.pathname,
      note: 'User is viewing the platform. Provide professional clinical assistance.',
    };

    try {
      const history = messages
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await aiService.chat(
        userMsg.content,
        location.pathname,
        history,
        contextData,
        imageBase64,
        imageMimeType,
        lang
      );

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.reply, animate: true },
      ]);
    } catch (error) {
      const defaultErrorMsg = {
        uz: "Gemini API bilan bog'lanib bo'lmadi.",
        ru: 'Не удалось связаться с Gemini API.',
        en: 'Could not connect to Gemini API.',
        tr: 'Gemini API ile bağlantı kurulamadı.',
        tg: 'Пайвастшавӣ бо Gemini API имконнопазир аст.',
        tm: 'Gemini API bilen birigip bolmady.',
        ky: 'Gemini API менен байланышууга мүмкүн болгон жок.',
        kz: 'Gemini API-мен байланысу мүмкін болмады.',
      };
      const detail =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        defaultErrorMsg[lang] ||
        defaultErrorMsg.en;
      const errPrefix = ERROR_PREFIX[lang] || ERROR_PREFIX.en;
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `**${errPrefix}** ${detail}`,
          animate: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      removeImage();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSmartPrompt = (prompt) => {
    handleSend(prompt);
  };

  const exportToPDF = async (messageId, idx) => {
    const element = document.getElementById(messageId);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: isDark ? '#2d2d2d' : '#ffffff',
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20; // 10mm margins
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.text('MorphoCheck Pro - AI Analysis Report', 10, 10);
      pdf.addImage(imgData, 'PNG', 10, 20, pdfWidth, pdfHeight);
      pdf.save(`MorphoAI_Report_${idx}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
    }
  };

  const [isAdminChatOpen, setIsAdminChatOpen] = useState(false);

  useEffect(() => {
    const handleAdminChat = (e) => {
      setIsAdminChatOpen(e.detail?.isOpen || false);
    };
    window.addEventListener('admin-chat-toggled', handleAdminChat);
    return () => window.removeEventListener('admin-chat-toggled', handleAdminChat);
  }, []);

  if (loading) {
    return null;
  }

  if (user && user.role !== 'superadmin' && user.ai_chat_enabled === false) {
    return null;
  }

  if (!isAuthenticated && guestEnabled === false) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 92, md: 30 },
        left: { xs: 16, md: 'auto' },
        right: (!isOpen && isAdminChatOpen) ? { xs: 'auto', md: 450 } : { xs: 'auto', md: 110 },
        zIndex: 9999,
        transition: 'right 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {/* Floating Action Button — Living Robot */}
      <Zoom in={true}>
        <Fab
          color="primary"
          aria-label="ai-assistant"
          onClick={() => setIsOpen(!isOpen)}
          sx={{
            boxShadow: isDark
              ? '0 8px 40px rgba(13,71,161,0.7)'
              : '0 8px 40px rgba(25,118,210,0.35)',
            background: 'transparent',
            padding: 0,
            overflow: 'visible',
            width: 64,
            height: 64,
            transform: 'none',
            '&:hover': {
              transform: 'scale(1.08)',
              background: 'transparent',
            },
            '&:active': {
              transform: 'scale(0.96)',
            },
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            zIndex: 1001,
          }}
        >
          {isOpen ? (
            <div
              style={{
                width: 64,
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                borderRadius: '50%',
              }}
            >
              <Close sx={{ color: 'white', fontSize: 28 }} />
            </div>
          ) : (
            <RobotAvatar
              isOpen={isOpen}
              passwordVisible={passwordVisible}
              size={64}
              isTalking={isTalking}
              isMobile={isMobile}
            />
          )}
        </Fab>
      </Zoom>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              position: isMobile ? 'fixed' : 'absolute',
              bottom: isMobile ? 16 : 80,
              left: isMobile ? 12 : 'auto',
              right: isMobile ? 12 : 0,
              width: isMobile ? 'calc(100vw - 24px)' : '420px',
              maxWidth: isMobile ? 'calc(100vw - 24px)' : '90vw',
              borderRadius: isMobile ? '18px' : '24px',
              marginLeft: isMobile ? 0 : 'auto',
            }}
          >
            <Paper
              elevation={24}
              sx={{
                borderRadius: isMobile ? '18px' : '24px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: isMobile ? 'calc(100dvh - 40px)' : '600px',
                maxHeight: isMobile ? 'calc(100dvh - 40px)' : '90vh',
                background: isDark
                  ? 'rgba(18, 18, 18, 0.45)'
                  : 'rgba(255, 255, 255, 0.45)',
                backdropFilter: 'blur(24px) saturate(180%)',
                border: isDark
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid rgba(255, 255, 255, 0.4)',
                boxShadow: isDark
                  ? '0 8px 32px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.05)'
                  : '0 8px 32px rgba(31,38,135,0.15), inset 0 0 0 1px rgba(255,255,255,0.6)',
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(9,30,90,0.9) 0%, rgba(13,71,161,0.85) 50%, rgba(25,118,210,0.8) 100%)'
                    : 'linear-gradient(135deg, rgba(13,71,161,0.95) 0%, rgba(25,118,210,0.9) 50%, rgba(66,165,245,0.85) 100%)',
                  backdropFilter: 'blur(12px)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  borderBottom: '1px solid rgba(255,255,255,0.12)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Background shimmer */}
                <Box sx={{
                  position: 'absolute', inset: 0,
                  background: 'radial-gradient(circle at 15% 50%, rgba(100,181,246,0.15) 0%, transparent 60%)',
                  pointerEvents: 'none',
                }} />

                {/* Robot avatar in header */}
                <Box sx={{
                  width: 56, height: 56, flexShrink: 0,
                  position: 'relative',
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
                  zIndex: 1,
                }}>
                  <RobotAvatar
                    isOpen={true}
                    passwordVisible={null}
                    size={56}
                    isTalking={isTalking}
                    isMobile={isMobile}
                  />
                  {/* Talking pulse ring */}
                  {isTalking && (
                    <Box sx={{
                      position: 'absolute', inset: '-4px',
                      borderRadius: '50%',
                      border: '2px solid rgba(100,181,246,0.8)',
                      animation: 'pulse-ring 1s ease-out infinite',
                      '@keyframes pulse-ring': {
                        '0%':   { transform: 'scale(0.95)', opacity: 1 },
                        '100%': { transform: 'scale(1.15)', opacity: 0 },
                      },
                    }} />
                  )}
                </Box>

                <Box sx={{ flex: 1, zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: '0.95rem' }}>
                      MorphoAI
                    </Typography>
                    {/* Online indicator */}
                    <Box sx={{
                      width: 7, height: 7, borderRadius: '50%',
                      bgcolor: isTalking ? '#ffd54f' : '#69f0ae',
                      boxShadow: isTalking ? '0 0 6px #ffd54f' : '0 0 6px #69f0ae',
                      animation: 'pulse-dot 2s ease-in-out infinite',
                      '@keyframes pulse-dot': {
                        '0%,100%': { opacity: 1 },
                        '50%':     { opacity: 0.4 },
                      },
                    }} />
                  </Box>
                  <Typography variant="caption" sx={{ opacity: 0.75, display: 'block' }}>
                    {isTalking ? '🤖 Javob yozmoqda...' : '✨ Powered by Gemini'}
                  </Typography>
                </Box>

                <IconButton
                  size="small"
                  onClick={() => setIsOpen(false)}
                  sx={{ color: 'white', zIndex: 1 }}
                >
                  <Close />
                </IconButton>
              </Box>

              {/* Messages Area */}
              <Box
                ref={scrollRef}
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  bgcolor: 'transparent',
                }}
              >
                {messages.map((msg, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      alignSelf:
                        msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                        flexDirection:
                          msg.role === 'user' ? 'row-reverse' : 'row',
                      }}
                    >
                      <Paper
                        id={`msg-${idx}`}
                        elevation={0}
                        sx={{
                          p: 1.5,
                          borderRadius:
                            msg.role === 'user'
                              ? '18px 18px 4px 18px'
                              : '18px 18px 18px 4px',
                          bgcolor:
                            msg.role === 'user'
                              ? isDark
                                ? '#1565c0'
                                : '#1976d2'
                              : isDark
                                ? '#2d2d2d'
                                : 'white',
                          color:
                            msg.role === 'user'
                              ? 'white'
                              : isDark
                                ? '#e0e0e0'
                                : '#333',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                          border:
                            msg.role === 'user'
                              ? 'none'
                              : isDark
                                ? '1px solid #444'
                                : '1px solid #e0e0e0',
                          overflowWrap: 'break-word',
                          wordBreak: 'break-word',
                          // Styles for ReactMarkdown elements
                          '& p': { m: 0, mb: 1 },
                          '& p:last-child': { mb: 0 },
                          '& strong': {
                            color:
                              msg.role === 'user'
                                ? 'white'
                                : isDark
                                  ? '#90caf9'
                                  : '#1565c0',
                            fontWeight: 700,
                          },
                          '& em': {
                            color:
                              msg.role === 'user'
                                ? 'white'
                                : isDark
                                  ? '#ce93d8'
                                  : '#7b1fa2',
                            fontStyle: 'italic',
                          },
                          '& ul, & ol': { mt: 0.5, mb: 1, pl: 2.5 },
                          '& li': { mb: 0.5 },
                          '& code': {
                            bgcolor:
                              msg.role === 'user'
                                ? 'rgba(255,255,255,0.2)'
                                : isDark
                                  ? 'rgba(255,255,255,0.1)'
                                  : 'rgba(0,0,0,0.05)',
                            px: 0.5,
                            py: 0.2,
                            borderRadius: 1,
                            fontFamily: 'monospace',
                          },
                          '& a': {
                            color:
                              msg.role === 'user'
                                ? '#bbdefb'
                                : isDark
                                  ? '#64b5f6'
                                  : '#1976d2',
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {msg.image && (
                          <Box sx={{ mb: 1 }}>
                            <img
                              src={msg.image}
                              alt="uploaded"
                              style={{ maxWidth: '100%', borderRadius: '8px' }}
                            />
                          </Box>
                        )}
                        {msg.animate ? (
                          <TypewriterMessage
                            content={msg.content}
                            onUpdate={scrollToBottom}
                            onComplete={() => {
                              setMessages((prev) =>
                                prev.map((m, i) =>
                                  i === idx ? { ...m, animate: false } : m
                                )
                              );
                            }}
                          />
                        ) : (
                          <Box sx={{ fontSize: '0.875rem' }}>
                            {msg.role === 'user' ? (
                              <Typography
                                variant="body2"
                                sx={{ whiteSpace: 'pre-wrap' }}
                              >
                                {msg.content}
                              </Typography>
                            ) : (
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.content}
                              </ReactMarkdown>
                            )}
                          </Box>
                        )}
                      </Paper>

                      {msg.role === 'assistant' && !msg.animate && idx > 0 && (
                        <Tooltip title="PDF formatida yuklab olish">
                          <IconButton
                            size="small"
                            onClick={() => exportToPDF(`msg-${idx}`, idx)}
                            sx={{ color: isDark ? '#aaa' : '#777', mt: 1 }}
                          >
                            <Download fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                ))}
                {isLoading && (
                  <Box
                    sx={{
                      alignSelf: 'flex-start',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Paper
                      sx={{
                        p: 1.5,
                        borderRadius: '18px 18px 18px 4px',
                        bgcolor: isDark ? '#2d2d2d' : 'white',
                        display: 'flex',
                        gap: 0.5,
                        border: isDark ? '1px solid #444' : '1px solid #e0e0e0',
                      }}
                    >
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        style={{ color: isDark ? '#e0e0e0' : '#333' }}
                      >
                        ●
                      </motion.div>
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          delay: 0.2,
                        }}
                        style={{ color: isDark ? '#e0e0e0' : '#333' }}
                      >
                        ●
                      </motion.div>
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          delay: 0.4,
                        }}
                        style={{ color: isDark ? '#e0e0e0' : '#333' }}
                      >
                        ●
                      </motion.div>
                    </Paper>
                  </Box>
                )}
              </Box>

              {/* Page Context Badge */}
              <Box
                sx={{
                  px: 2,
                  py: 0.5,
                  bgcolor: isDark
                    ? 'rgba(144, 202, 249, 0.1)'
                    : 'rgba(25, 118, 210, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <InfoOutlined
                  sx={{ fontSize: 14, color: isDark ? '#90caf9' : '#1976d2' }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: isDark ? '#90caf9' : '#1976d2' }}
                >
                  {PAGE_LABELS[lang] || PAGE_LABELS.en}: {location.pathname}
                </Typography>
              </Box>

              {/* Smart Prompts */}
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  display: 'flex',
                  gap: 1,
                  overflowX: 'auto',
                  '&::-webkit-scrollbar': { display: 'none' },
                }}
              >
                {(
                  LOCALIZED_SMART_PROMPTS[lang] || LOCALIZED_SMART_PROMPTS.en
                ).map((prompt, i) => (
                  <Chip
                    key={i}
                    label={prompt}
                    size="small"
                    onClick={() => handleSmartPrompt(prompt)}
                    disabled={isLoading}
                    sx={{
                      bgcolor: isDark
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(25, 118, 210, 0.08)',
                      color: isDark ? '#bbdefb' : '#1976d2',
                      '&:hover': {
                        bgcolor: isDark
                          ? 'rgba(255,255,255,0.2)'
                          : 'rgba(25, 118, 210, 0.15)',
                      },
                    }}
                  />
                ))}
              </Box>

              {/* Disclaimer */}
              <Box
                sx={{
                  px: 2,
                  py: 0.5,
                  borderTop: isDark
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid rgba(0,0,0,0.05)',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '9px',
                    color: isDark ? '#aaa' : 'text.secondary',
                    fontStyle: 'italic',
                    display: 'block',
                    textAlign: 'center',
                  }}
                >
                  {DISCLAIMERS[lang] || DISCLAIMERS.en}
                </Typography>
              </Box>

              {/* Image Preview Area */}
              {selectedImage && (
                <Box
                  sx={{
                    px: 2,
                    pt: 1,
                    position: 'relative',
                    display: 'inline-block',
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: isDark ? '1px solid #444' : '1px solid #ccc',
                    }}
                  >
                    <img
                      src={selectedImage}
                      alt="Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={removeImage}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                        padding: '2px',
                      }}
                    >
                      <Close sx={{ fontSize: '14px' }} />
                    </IconButton>
                  </Box>
                </Box>
              )}

              {/* Input Area */}
              <Box
                sx={{
                  p: 2,
                  pt: selectedImage ? 1 : 2,
                  bgcolor: isDark
                    ? 'rgba(30, 30, 30, 0.5)'
                    : 'rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(10px)',
                  borderTop: isDark
                    ? '1px solid rgba(255,255,255,0.05)'
                    : '1px solid rgba(0,0,0,0.05)',
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <TextField
                  fullWidth
                  placeholder={PLACEHOLDERS[lang] || PLACEHOLDERS.en}
                  variant="outlined"
                  size="small"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      bgcolor: isDark ? '#2d2d2d' : 'white',
                      '& fieldset': {
                        borderColor: isDark ? '#444' : 'rgba(0, 0, 0, 0.23)',
                      },
                      '&:hover fieldset': {
                        borderColor: isDark ? '#90caf9' : '#1976d2',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: isDark ? '#90caf9' : '#1976d2',
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: isDark ? '#e0e0e0' : 'inherit',
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconButton
                          size="small"
                          onClick={() =>
                            fileInputRef.current && fileInputRef.current.click()
                          }
                          disabled={isLoading}
                          sx={{ color: isDark ? '#aaa' : '#777' }}
                        >
                          <AttachFile fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          color="primary"
                          onClick={() => handleSend(null)}
                          disabled={
                            (!inputValue.trim() && !imageBase64) || isLoading
                          }
                          sx={{
                            color: isDark
                              ? (!inputValue.trim() && !imageBase64) ||
                                isLoading
                                ? '#555'
                                : '#90caf9'
                              : undefined,
                          }}
                        >
                          <Send />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default AIAssistantWidget;

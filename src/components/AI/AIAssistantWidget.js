// src/components/AI/AIAssistantWidget.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
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

  // Image Upload State
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMimeType, setImageMimeType] = useState(null);

  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const location = useLocation();

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

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 92, md: 30 },
        left: { xs: 16, md: 'auto' },
        right: { xs: 'auto', md: 110 },
        zIndex: 1000,
      }}
    >
      {/* Floating Action Button */}
      <Zoom in={true}>
        <Fab
          color="primary"
          aria-label="ai-assistant"
          onClick={() => setIsOpen(!isOpen)}
          sx={{
            boxShadow: isDark
              ? '0 8px 32px rgba(0,0,0,0.5)'
              : '0 8px 32px rgba(0,0,0,0.2)',
            background: isDark
              ? 'linear-gradient(45deg, #0d47a1, #1976d2)'
              : 'linear-gradient(45deg, #1976d2, #42a5f5)',
            '&:hover': {
              transform: 'scale(1.1) rotate(5deg)',
            },
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
        >
          {isOpen ? <Close /> : <SmartToy className="floating" />}
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
                height: isMobile ? 'calc(100dvh - 92px)' : '600px',
                maxHeight: isMobile ? 'calc(100dvh - 92px)' : '90vh',
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
                  p: 2,
                  background: isDark
                    ? 'linear-gradient(90deg, rgba(13,71,161,0.6), rgba(25,118,210,0.6))'
                    : 'linear-gradient(90deg, rgba(25,118,210,0.7), rgba(100,181,246,0.7))',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                  <AutoAwesome sx={{ color: 'white' }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    MorphoAI Assistant Pro
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Powered by Gemini 1.5
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => setIsOpen(false)}
                  sx={{ color: 'white' }}
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

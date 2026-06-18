import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Avatar, CircularProgress, useTheme } from '@mui/material';
import { Security, Science, AdminPanelSettings } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const TRANSLATIONS = {
  uz: {
    welcome: 'Xush kelibsiz!',
    admin: 'Tizimga muvaffaqiyatli kirdingiz, Admin!',
    superadmin: 'Tizimga muvaffaqiyatli kirdingiz, Super Admin!',
    researcher: 'Tizimga muvaffaqiyatli kirdingiz, Izlanuvchi!',
    loading: 'Boshqaruv paneli yuklanmoqda...',
  },
  ru: {
    welcome: 'Добро пожаловать!',
    admin: 'Вы успешно вошли в систему как Администратор!',
    superadmin: 'Вы успешно вошли в систему как Супер Администратор!',
    researcher: 'Вы успешно вошли в систему как Исследователь!',
    loading: 'Панель управления загружается...',
  },
  en: {
    welcome: 'Welcome!',
    admin: 'Successfully logged in as Admin!',
    superadmin: 'Successfully logged in as Super Admin!',
    researcher: 'Successfully logged in as Researcher!',
    loading: 'Loading dashboard...',
  },
  tg: {
    welcome: 'Хуш омадед!',
    admin: 'Вуруди муваффақона ҳамчун Администратор!',
    superadmin: 'Вуруди муваффақона ҳамчун Супер Администратор!',
    researcher: 'Вуруди муваффақона ҳамчун Таҳқиқотчӣ!',
    loading: 'Панели идоракунӣ бор карда мешавад...',
  },
  tm: {
    welcome: 'Hoş geldiňiz!',
    admin: 'Admin hökmünde üstünlikli girdiňiz!',
    superadmin: 'Super Admin hökmünde üstünlikli girdiňiz!',
    researcher: 'Izlanuvchi hökmünde üstünlikli girdiňiz!',
    loading: 'Dolandyryş paneli ýüklenýär...',
  },
  tr: {
    welcome: 'Hoş geldiniz!',
    admin: 'Yönetici olarak başarıyla giriş yapıldı!',
    superadmin: 'Süper Yönetici olarak başarıyla giriş yapıldı!',
    researcher: 'Araştırmacı olarak başarıyla giriş yapıldı!',
    loading: 'Kontrol paneli yükleniyor...',
  },
  kz: {
    welcome: 'Қош келдіңіз!',
    admin: 'Администратор ретінде жүйеге сәтті кірдіңіз!',
    superadmin: 'Супер Администратор ретінде жүйеге сәтті кірдіңіз!',
    researcher: 'Зерттеуші ретінде жүйеге сәтті кірдіңіз!',
    loading: 'Басқару панелі жүктелуде...',
  },
  ky: {
    welcome: 'Кош келиңиз!',
    admin: 'Администратор катары ийгиликтүү кирдиңиз!',
    superadmin: 'Супер Администратор катары ийгиликтүү кирдиңиз!',
    researcher: 'Изилдөөчү катары ийгиликтүү кирдиңиз!',
    loading: 'Башкаруу панели жүктөлүүдө...',
  }
};

const getRoleDetails = (role) => {
  switch (role) {
    case 'superadmin':
      return {
        icon: <Security sx={{ fontSize: 48, color: '#2563eb' }} />,
        color: '#2563eb',
        bg: 'rgba(37, 99, 235, 0.1)',
        langKey: 'superadmin',
      };
    case 'researcher':
      return {
        icon: <Science sx={{ fontSize: 48, color: '#10b981' }} />,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.1)',
        langKey: 'researcher',
      };
    case 'admin':
    default:
      return {
        icon: <AdminPanelSettings sx={{ fontSize: 48, color: '#0f766e' }} />,
        color: '#0f766e',
        bg: 'rgba(15, 118, 110, 0.1)',
        langKey: 'admin',
      };
  }
};

export default function WelcomeOverlay({ onComplete }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const { lang } = useLanguage();

  const role = user?.role || 'admin';
  const name = user?.name || user?.email || '';
  const roleInfo = getRoleDetails(role);

  const dict = TRANSLATIONS[lang] || TRANSLATIONS.uz;
  const welcomeText = dict.welcome;
  const subText = dict[roleInfo.langKey] || dict.admin;
  const loadingText = dict.loading;

  useEffect(() => {
    // 1.8 seconds transition screen
    const timer = setTimeout(() => {
      onComplete();
    }, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: isDark
          ? 'radial-gradient(circle at center, rgba(15, 23, 42, 0.95) 0%, rgba(2, 6, 23, 0.98) 100%)'
          : 'radial-gradient(circle at center, rgba(248, 250, 252, 0.96) 0%, rgba(226, 232, 240, 0.98) 100%)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Animated Glowing Orb in the background */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${roleInfo.color}15 0%, transparent 70%)`,
          filter: 'blur(30px)',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.1 }}
        style={{
          padding: '40px',
          borderRadius: '24px',
          width: '90%',
          maxWidth: '450px',
          textAlign: 'center',
          background: isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(255, 255, 255, 0.75)',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'}`,
          boxShadow: isDark
            ? '0 20px 50px rgba(0, 0, 0, 0.4)'
            : '0 20px 50px rgba(148, 163, 184, 0.15)',
          position: 'relative',
        }}
      >
        {/* Animated Icon Container */}
        <Box display="flex" justifyContent="center" mb={4}>
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.25 }}
          >
            <Avatar
              sx={{
                width: 96,
                height: 96,
                bgcolor: roleInfo.bg,
                boxShadow: `0 8px 24px ${roleInfo.color}20`,
                border: `2px solid ${roleInfo.color}30`,
              }}
            >
              {roleInfo.icon}
            </Avatar>
          </motion.div>
        </Box>

        {/* Text Area */}
        <Box mb={4}>
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Typography
              variant="h4"
              fontWeight={900}
              gutterBottom
              sx={{
                background: `linear-gradient(135deg, ${isDark ? '#fff' : '#0f172a'} 0%, ${roleInfo.color} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {welcomeText}
            </Typography>
            {name && (
              <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
                {name}
              </Typography>
            )}
            <Typography variant="body1" color="text.secondary" fontWeight={500}>
              {subText}
            </Typography>
          </motion.div>
        </Box>

        {/* Loading Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
            <CircularProgress
              size={28}
              thickness={4.5}
              sx={{
                color: roleInfo.color,
                animationDuration: '750ms',
              }}
            />
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ letterSpacing: '0.5px' }}>
              {loadingText}
            </Typography>
          </Box>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

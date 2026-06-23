// src/pages/IntroPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  useSpring,
} from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  FileText,
  Mail,
  Phone,
  Sparkles,
  ArrowRight,
  Zap,
  BarChart3,
  GraduationCap,
  Fingerprint,
  Globe,
  Award,
  Microscope,
} from 'lucide-react';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  Grid,
  Paper,
  useTheme,
  alpha,
  Stack,
} from '@mui/material';
import { useThemeMode } from '../providers/ThemeProviderMUI';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import GrowthGalaxy from '../components/GrowthGalaxy';
import TubesBackground from '../components/TubesBackground';
const createStorySteps = (t) => [
  {
    eyebrow: t('storyStep1Eyebrow'),
    title: t('storyStep1Title'),
    desc: t('storyStep1Desc'),
    metric: '140+',
    label: t('storyStep1Metric'),
    color: '#0891b2',
    icon: Fingerprint,
  },
  {
    eyebrow: t('storyStep2Eyebrow'),
    title: t('storyStep2Title'),
    desc: t('storyStep2Desc'),
    metric: '98.4%',
    label: t('storyStep2Metric'),
    color: '#16a34a',
    icon: Activity,
  },
  {
    eyebrow: t('storyStep3Eyebrow'),
    title: t('storyStep3Title'),
    desc: t('storyStep3Desc'),
    metric: '14',
    label: t('storyStep3Metric'),
    color: '#ca8a04',
    icon: Globe,
  },
  {
    eyebrow: t('storyStep4Eyebrow'),
    title: t('storyStep4Title'),
    desc: t('storyStep4Desc'),
    metric: 'PDF',
    label: t('storyStep4Metric'),
    color: '#7c3aed',
    icon: FileText,
  },
];

const ScrollProgress = ({ progress, color }) => (
  <motion.div
    style={{
      scaleX: progress,
      transformOrigin: '0% 50%',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      backgroundColor: color,
      boxShadow: `0 0 18px ${alpha(color, 0.55)}`,
      zIndex: 2000,
      pointerEvents: 'none',
    }}
    aria-hidden="true"
    className="scroll-progress"
  />
);

const StickyScrollStory = ({ theme, mode, fadeInUp, t }) => {
  const sectionRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const storySteps = createStorySteps(t);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start center', 'end center'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const nextIndex = Math.min(
      storySteps.length - 1,
      Math.max(0, Math.floor(latest * storySteps.length))
    );
    setActiveIndex(nextIndex);
  });

  return (
    <Box
      ref={sectionRef}
      sx={{
        py: { xs: 10, md: 18 },
        position: 'relative',
        zIndex: 10,
        bgcolor: alpha(
          theme.palette.background.paper,
          mode === 'dark' ? 0.12 : 0.28
        ),
      }}
    >
      <Container maxWidth="lg">
        <motion.div {...fadeInUp}>
          <Typography
            variant="h2"
            fontWeight="900"
            gutterBottom
            letterSpacing={0}
          >
            {t('storyTitle')}
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 760, mb: 8 }}
          >
            {t('storyDesc')}
          </Typography>
        </motion.div>

        <Grid container spacing={{ xs: 4, md: 7 }} alignItems="flex-start">
          <Grid item xs={12} md={5}>
            <Stack spacing={{ xs: 2, md: 6 }}>
              {storySteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeIndex === index;
                return (
                  <motion.div
                    key={step.eyebrow}
                    initial={{ opacity: 0, y: 26 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-10% 0px' }}
                    transition={{ duration: 0.55, delay: index * 0.08 }}
                  >
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '48px minmax(0, 1fr)',
                        gap: 2,
                        p: { xs: 2, md: 2.5 },
                        borderRadius: '18px',
                        border: `1px solid ${
                          isActive
                            ? alpha(step.color, 0.55)
                            : alpha(theme.palette.text.primary, 0.1)
                        }`,
                        bgcolor: isActive
                          ? alpha(step.color, mode === 'dark' ? 0.14 : 0.08)
                          : alpha(theme.palette.background.paper, 0.05),
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        boxShadow: isActive ? `0 8px 32px ${alpha(step.color, 0.2)}` : 'none',
                        transition: 'all 0.35s ease',
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '14px',
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: alpha(step.color, isActive ? 0.18 : 0.1),
                          color: step.color,
                        }}
                      >
                        <Icon size={22} />
                      </Box>
                      <Box>
                        <Typography
                          variant="overline"
                          fontWeight={800}
                          sx={{ color: step.color }}
                        >
                          {step.eyebrow}
                        </Typography>
                        <Typography variant="h5" fontWeight={800} gutterBottom>
                          {step.title}
                        </Typography>
                        <Typography
                          color="text.secondary"
                          sx={{ lineHeight: 1.7 }}
                        >
                          {step.desc}
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>
                );
              })}
            </Stack>
          </Grid>

          <Grid item xs={12} md={7}>
            <Box sx={{ position: { md: 'sticky' }, top: { md: 96 } }}>
              <Grid container spacing={2}>
                {storySteps.map((step, index) => (
                  <Grid item xs={6} sm={3} key={step.label}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: '16px',
                        border: `1px solid ${alpha(step.color, activeIndex === index ? 0.48 : 0.14)}`,
                        bgcolor: alpha(
                          step.color,
                          activeIndex === index
                            ? mode === 'dark'
                              ? 0.16
                              : 0.08
                            : 0.03
                        ),
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        boxShadow: activeIndex === index ? `0 8px 32px ${alpha(step.color, 0.2)}` : 'none',
                      }}
                    >
                      <Typography
                        variant="h5"
                        fontWeight={800}
                        sx={{ color: step.color }}
                      >
                        {step.metric}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={800}
                      >
                        {step.label}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default function IntroPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const { lang, t } = useLanguage();
  const theme = useTheme();

  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const yParallax = useTransform(scrollYProgress, [0, 0.5], [0, -100]);

  const [weatherData, setWeatherData] = useState(null);

  useEffect(() => {
    const handleWeather = (e) => setWeatherData(e.detail);
    window.addEventListener('weather-update', handleWeather);
    return () => window.removeEventListener('weather-update', handleWeather);
  }, []);

  const getGrowthGalaxyPalette = (weather) => {
    if (!weather) return undefined;
    const { temp, code } = weather;
    if (temp >= 28) return ['#ff8c00', '#ff4500', '#ffffff'];
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return ['#00bfff', '#1e90ff', '#ffffff'];
    if ((code >= 71 && code <= 86) || temp <= 5) return ['#add8e6', '#e0ffff', '#ffffff'];
    return undefined; // Default
  };

  const currentPalette = getGrowthGalaxyPalette(weatherData);

  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  const styles = {
    heroGradient: {
      background: `linear-gradient(to right, 
        ${theme.palette.primary.main}, #0891b2, #0f766e, #ca8a04, ${theme.palette.primary.main})`,
      backgroundSize: '200% auto',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      fontWeight: 900,
      animation: 'slowRainbow 12s linear infinite',
      '@keyframes slowRainbow': {
        '0%': { backgroundPosition: '0% 50%' },
        '50%': { backgroundPosition: '100% 50%' },
        '100%': { backgroundPosition: '0% 50%' },
      },
    },
    premiumCard: {
      background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, mode === 'dark' ? 0.55 : 0.82)} 0%, ${alpha(theme.palette.background.default, mode === 'dark' ? 0.32 : 0.62)} 100%)`,
      backdropFilter: 'blur(28px) saturate(180%)',
      WebkitBackdropFilter: 'blur(28px) saturate(180%)',
      border: `1px solid ${alpha(theme.palette.primary.main, mode === 'dark' ? 0.2 : 0.14)}`,
      borderRadius: '24px',
      boxShadow: `0 24px 70px ${alpha(theme.palette.common.black, mode === 'dark' ? 0.36 : 0.12)}`,
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden',
      '&:hover': {
        transform: 'translateY(-8px)',
        boxShadow: `0 30px 90px ${alpha(theme.palette.common.black, mode === 'dark' ? 0.5 : 0.16)}`,
        borderColor: alpha(theme.palette.primary.main, 0.36),
      },
    },
    actionButton: {
      minHeight: 58,
      borderRadius: '18px',
      padding: '14px 28px',
      fontSize: '1.02rem',
      fontWeight: '800',
      textTransform: 'none',
      letterSpacing: 0,
      position: 'relative',
      overflow: 'hidden',
      isolation: 'isolate',
      border: `1px solid ${alpha(theme.palette.common.white, mode === 'dark' ? 0.2 : 0.48)}`,
      backgroundClip: 'padding-box',
      backdropFilter: 'blur(20px) saturate(180%) brightness(1.06)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%) brightness(1.06)',
      transition:
        'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.32s ease, box-shadow 0.32s ease, background 0.32s ease',
      boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.42)}, inset 0 -10px 24px ${alpha(theme.palette.common.white, mode === 'dark' ? 0.05 : 0.22)}, 0 18px 42px ${alpha(theme.palette.common.black, mode === 'dark' ? 0.34 : 0.14)}`,
      '&::before': {
        content: '""',
        position: 'absolute',
        inset: 1,
        zIndex: -1,
        borderRadius: 'inherit',
        background: `linear-gradient(145deg, ${alpha(theme.palette.common.white, mode === 'dark' ? 0.16 : 0.42)} 0%, ${alpha(theme.palette.common.white, mode === 'dark' ? 0.05 : 0.16)} 42%, ${alpha(theme.palette.common.white, mode === 'dark' ? 0.12 : 0.3)} 100%)`,
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        top: '-70%',
        left: '-45%',
        width: '70%',
        height: '220%',
        zIndex: -1,
        borderRadius: '999px',
        background: `linear-gradient(115deg, transparent 0%, ${alpha(theme.palette.common.white, 0.08)} 30%, ${alpha(theme.palette.common.white, 0.5)} 48%, ${alpha(theme.palette.common.white, 0.08)} 66%, transparent 100%)`,
        filter: 'blur(1px)',
        transform: 'translateX(-20%) rotate(8deg)',
        opacity: 0,
        transition:
          'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease',
      },
      '& .MuiButton-startIcon, & .MuiButton-endIcon': {
        position: 'relative',
        zIndex: 1,
      },
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.56)}, inset 0 -12px 26px ${alpha(theme.palette.common.white, mode === 'dark' ? 0.08 : 0.26)}, 0 24px 58px ${alpha(theme.palette.common.black, mode === 'dark' ? 0.42 : 0.18)}`,
      },
      '&:hover::after': {
        opacity: 1,
        transform: 'translateX(190%) rotate(8deg)',
      },
      '&:active': {
        transform: 'translateY(-1px) scale(0.99)',
      },
      '&:focus-visible': {
        outline: `3px solid ${alpha(theme.palette.primary.main, 0.3)}`,
        outlineOffset: 3,
      },
    },
    featurePill: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 1,
      px: 1.7,
      py: 1,
      minHeight: 36,
      borderRadius: '14px',
      position: 'relative',
      overflow: 'hidden',
      isolation: 'isolate',
      color: 'text.primary',
      background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, mode === 'dark' ? 0.3 : 0.66)}, ${alpha(theme.palette.background.default, mode === 'dark' ? 0.14 : 0.42)})`,
      border: `1px solid ${alpha(theme.palette.common.white, mode === 'dark' ? 0.16 : 0.46)}`,
      backdropFilter: 'blur(18px) saturate(180%)',
      WebkitBackdropFilter: 'blur(18px) saturate(180%)',
      boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, mode === 'dark' ? 0.18 : 0.48)}, 0 12px 28px ${alpha(theme.palette.common.black, mode === 'dark' ? 0.2 : 0.08)}`,
      transition:
        'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.28s ease, box-shadow 0.28s ease',
      '&::before': {
        content: '""',
        position: 'absolute',
        inset: 1,
        zIndex: -1,
        borderRadius: 'inherit',
        background: `linear-gradient(145deg, ${alpha(theme.palette.common.white, mode === 'dark' ? 0.08 : 0.26)}, transparent 48%, ${alpha(theme.palette.primary.main, 0.08)})`,
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        top: '-50%',
        left: '-35%',
        width: '55%',
        height: '190%',
        zIndex: -1,
        borderRadius: '999px',
        background: alpha(
          theme.palette.common.white,
          mode === 'dark' ? 0.16 : 0.42
        ),
        filter: 'blur(14px)',
        opacity: 0.45,
      },
      '&:hover': {
        transform: 'translateY(-2px)',
        borderColor: alpha(theme.palette.primary.main, 0.4),
        boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, mode === 'dark' ? 0.26 : 0.56)}, 0 16px 36px ${alpha(theme.palette.primary.main, 0.16)}`,
      },
    },
    glassChip: {
      px: 2,
      py: 0.8,
      borderRadius: '100px',
      position: 'relative',
      overflow: 'hidden',
      isolation: 'isolate',
      background: `linear-gradient(135deg, ${alpha('#f8c271', mode === 'dark' ? 0.16 : 0.24)}, ${alpha(theme.palette.background.paper, mode === 'dark' ? 0.16 : 0.58)})`,
      color: theme.palette.primary.main,
      fontWeight: '800',
      fontSize: '0.8rem',
      border: `1px solid ${alpha('#f8c271', mode === 'dark' ? 0.28 : 0.46)}`,
      backdropFilter: 'blur(18px) saturate(180%)',
      WebkitBackdropFilter: 'blur(18px) saturate(180%)',
      boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, mode === 'dark' ? 0.18 : 0.48)}, 0 12px 30px ${alpha('#f8c271', 0.1)}`,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 1,
      mb: 3,
      '&::before': {
        content: '""',
        position: 'absolute',
        inset: 1,
        zIndex: -1,
        borderRadius: 'inherit',
        background: `linear-gradient(145deg, ${alpha(theme.palette.common.white, mode === 'dark' ? 0.12 : 0.34)}, transparent 56%, ${alpha('#f8c271', 0.18)})`,
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        top: '-80%',
        left: '-15%',
        zIndex: -1,
        width: '54%',
        height: '220%',
        borderRadius: '999px',
        background: alpha(
          theme.palette.common.white,
          mode === 'dark' ? 0.12 : 0.34
        ),
        filter: 'blur(14px)',
        transform: 'rotate(12deg)',
      },
    },
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: 'easeOut' },
  };

  const isLongHeroTitle = lang === 'kz' || lang === 'ru';
  const heroTitleFontSize = isLongHeroTitle
    ? { xs: '2.2rem', sm: '3.05rem', md: '4rem', lg: '4.7rem' }
    : { xs: '2.45rem', sm: '3.7rem', md: '5.2rem', lg: '6rem' };

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative' }}>
      <TubesBackground />
      <ScrollProgress
        progress={smoothProgress}
        color={theme.palette.primary.main}
      />

      {/* Hero Section */}
      <Box sx={{ position: 'relative', zIndex: 10 }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: { xs: 'flex-start', md: 'center' },
              pt: { xs: 12, sm: 13, md: 14, lg: 15 },
              pb: { xs: 8, md: 10 },
            }}
          >
            <Box
              sx={{
                width: '100%',
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'minmax(0, 1fr)',
                  md: 'minmax(0, 1fr) minmax(420px, 1fr)',
                  lg: 'minmax(0, 7fr) minmax(460px, 5fr)',
                },
                columnGap: { md: 5, lg: 8 },
                rowGap: 4,
                alignItems: 'center',
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <motion.div style={{ opacity, scale, y: yParallax }}>
                  <motion.div
                    initial={{ opacity: 0, x: -60 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, ease: 'circOut' }}
                  >
                    <Box sx={styles.glassChip}>
                      <Sparkles size={16} />
                      {t('newEra')}
                    </Box>

                    <Typography
                      variant="h1"
                      sx={{
                        fontSize: heroTitleFontSize,
                        fontWeight: 900,
                        mb: { xs: 2.5, md: 3 },
                        lineHeight: isLongHeroTitle ? 1.08 : 1.02,
                        letterSpacing: 0,
                        color: 'text.primary',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {t('heroTitle1')}
                      <Box
                        component="span"
                        sx={styles.heroGradient}
                        display={{ xs: 'inline', sm: 'block' }}
                      >
                        {' '}
                        {t('heroTitle2')}
                      </Box>
                    </Typography>

                    <Typography
                      variant="h5"
                      sx={{
                        color: 'text.secondary',
                        mb: 4,
                        maxWidth: { xs: '100%', sm: '95%', md: '650px' },
                        lineHeight: 1.7,
                        fontWeight: 500,
                        fontSize: { xs: '1.1rem', md: '1.35rem' },
                      }}
                    >
                      {t('heroDesc')}
                    </Typography>

                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1.5}
                      sx={{ mb: 5, maxWidth: 680 }}
                    >
                      {[
                        { icon: ShieldCheck, text: 'WHO standartlari' },
                        { icon: BarChart3, text: 'Z-score monitoring' },
                        { icon: Microscope, text: 'AI klinik tahlil' },
                      ].map((item) => (
                        <Box key={item.text} sx={styles.featurePill}>
                          <item.icon
                            size={17}
                            color={theme.palette.primary.main}
                          />
                          <Typography variant="caption" fontWeight={800}>
                            {item.text}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>

                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={2.5}
                    >
                      <Button
                        variant="contained"
                        onClick={() =>
                          navigate(
                            user?.role === 'researcher'
                              ? '/researcher'
                              : '/morphocheck-pro'
                          )
                        }
                        sx={{
                          ...styles.actionButton,
                          color: theme.palette.common.white,
                          background: `linear-gradient(135deg, ${alpha('#f8c271', 0.95)} 0%, ${alpha(theme.palette.primary.main, 0.9)} 46%, ${alpha('#0891b2', 0.95)} 100%)`,
                          borderColor: alpha(theme.palette.common.white, 0.38),
                          boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.6)}, inset 0 -14px 28px ${alpha('#0891b2', 0.18)}, 0 18px 48px ${alpha(theme.palette.primary.main, 0.34)}`,
                          '&:hover': {
                            ...styles.actionButton['&:hover'],
                            background: `linear-gradient(135deg, ${alpha('#ffd59a', 0.98)} 0%, ${alpha(theme.palette.primary.main, 0.95)} 44%, ${alpha('#06b6d4', 0.98)} 100%)`,
                            borderColor: alpha(
                              theme.palette.common.white,
                              0.58
                            ),
                            boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.72)}, inset 0 -14px 30px ${alpha('#0891b2', 0.22)}, 0 24px 64px ${alpha(theme.palette.primary.main, 0.42)}`,
                          },
                        }}
                        startIcon={<Zap size={22} />}
                      >
                        {t('enterSystem')}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => navigate('/info')}
                        sx={{
                          ...styles.actionButton,
                          borderWidth: '1px',
                          borderColor: alpha(
                            theme.palette.common.white,
                            mode === 'dark' ? 0.18 : 0.5
                          ),
                          color: 'text.primary',
                          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, mode === 'dark' ? 0.22 : 0.58)}, ${alpha('#64748b', mode === 'dark' ? 0.12 : 0.1)})`,
                          '&:hover': {
                            ...styles.actionButton['&:hover'],
                            borderWidth: '1px',
                            borderColor: alpha(
                              theme.palette.primary.main,
                              0.45
                            ),
                            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, mode === 'dark' ? 0.3 : 0.72)}, ${alpha(theme.palette.primary.main, mode === 'dark' ? 0.14 : 0.1)})`,
                          },
                        }}
                      >
                        {t('details')}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => navigate('/author')}
                        startIcon={<GraduationCap size={18} />}
                        sx={{
                          ...styles.actionButton,
                          borderWidth: '1px',
                          borderColor: alpha(
                            '#14b8a6',
                            mode === 'dark' ? 0.34 : 0.42
                          ),
                          color: mode === 'dark' ? '#5eead4' : '#0f766e',
                          background: `linear-gradient(135deg, ${alpha('#14b8a6', mode === 'dark' ? 0.16 : 0.12)}, ${alpha(theme.palette.background.paper, mode === 'dark' ? 0.2 : 0.5)})`,
                          '&:hover': {
                            ...styles.actionButton['&:hover'],
                            borderWidth: '1px',
                            borderColor: '#14b8a6',
                            background: `linear-gradient(135deg, ${alpha('#14b8a6', mode === 'dark' ? 0.24 : 0.18)}, ${alpha(theme.palette.background.paper, mode === 'dark' ? 0.26 : 0.62)})`,
                            boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, mode === 'dark' ? 0.28 : 0.54)}, 0 24px 58px ${alpha('#0f766e', 0.24)}`,
                          },
                        }}
                      >
                        Avtor haqida
                      </Button>
                    </Stack>
                  </motion.div>
                </motion.div>
              </Box>

              <Box sx={{ minWidth: 0, width: '100%' }}>
                <GrowthGalaxy mode={mode} colorPalette={currentPalette} />
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Trust Section */}
      <Box sx={{ py: 10, position: 'relative', zIndex: 10 }}>
        <Container maxWidth="lg">
          <Typography
            variant="overline"
            sx={{
              display: 'block',
              textAlign: 'center',
              mb: 4,
              fontWeight: 900,
              letterSpacing: 2,
              color: 'text.secondary',
            }}
          >
            {t('trustedBy')}
          </Typography>
          <Stack
            direction="row"
            spacing={8}
            justifyContent="center"
            alignItems="center"
            sx={{
              opacity: 0.6,
              flexWrap: 'wrap',
              '& svg': {
                filter:
                  mode === 'dark' ? 'grayscale(1) invert(1)' : 'grayscale(1)',
              },
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <ShieldCheck size={32} />
              <Typography variant="h6" fontWeight="900">
                ISO 27001
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Globe size={32} />
              <Typography variant="h6" fontWeight="900">
                WHO Standards
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Award size={32} />
              <Typography variant="h6" fontWeight="900">
                MedTech 2024
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 20, position: 'relative', zIndex: 10 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 12 }}>
            <motion.div {...fadeInUp}>
              <Typography
                variant="h2"
                fontWeight="900"
                gutterBottom
                letterSpacing={0}
              >
                {t('whyMorpho')}
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{
                  maxWidth: { xs: '95vw', sm: '90vw', md: '700px' },
                  mx: 'auto',
                  fontWeight: 400,
                }}
              >
                {t('whyDesc')}
              </Typography>
            </motion.div>
          </Box>

          <Grid container spacing={4}>
            {[
              {
                icon: ShieldCheck,
                title: t('feat1Title'),
                desc: t('feat1Desc'),
                color: '#3b82f6',
              },
              {
                icon: Activity,
                title: t('feat2Title'),
                desc: t('feat2Desc'),
                color: '#10b981',
              },
              {
                icon: FileText,
                title: t('feat3Title'),
                desc: t('feat3Desc'),
                color: '#f59e0b',
              },
            ].map((feature, i) => (
              <Grid item xs={12} md={4} key={i}>
                <motion.div
                  {...fadeInUp}
                  transition={{ delay: i * 0.15 + 0.3 }}
                >
                  <Card sx={styles.premiumCard}>
                    <CardContent sx={{ p: 5 }}>
                      <Box
                        sx={{
                          mb: 4,
                          p: 2.5,
                          display: 'inline-flex',
                          borderRadius: '20px',
                          bgcolor: alpha(feature.color, 0.1),
                          color: feature.color,
                        }}
                      >
                        <feature.icon size={40} strokeWidth={1.5} />
                      </Box>
                      <Typography variant="h5" fontWeight="900" gutterBottom>
                        {feature.title}
                      </Typography>
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ lineHeight: 1.7 }}
                      >
                        {feature.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <StickyScrollStory theme={theme} mode={mode} fadeInUp={fadeInUp} t={t} />

      {/* Process Section */}
      <Box
        sx={{
          py: 20,
          position: 'relative',
          zIndex: 10,
          bgcolor: alpha(theme.palette.background.paper, 0.2),
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 12 }}>
            <Typography
              variant="h2"
              fontWeight="900"
              gutterBottom
              letterSpacing={0}
            >
              {t('processTitle')}
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              { step: '01', title: t('step1Title'), desc: t('step1Desc') },
              { step: '02', title: t('step2Title'), desc: t('step2Desc') },
              { step: '03', title: t('step3Title'), desc: t('step3Desc') },
            ].map((item, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Box sx={{ position: 'relative' }}>
                  <Typography
                    variant="h1"
                    sx={{
                      position: 'absolute',
                      top: -40,
                      left: { xs: 0, sm: -10 },
                      fontSize: { xs: '5rem', sm: '8rem' },
                      fontWeight: 900,
                      opacity: 0.05,
                      color: theme.palette.primary.main,
                    }}
                  >
                    {item.step}
                  </Typography>
                  <Box sx={{ pt: 4 }}>
                    <Typography variant="h4" fontWeight="900" gutterBottom>
                      {item.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ fontSize: '1.1rem' }}
                    >
                      {item.desc}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 15, position: 'relative', zIndex: 10 }}>
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Paper
              sx={{
                p: { xs: 6, md: 10 },
                textAlign: 'center',
                borderRadius: '40px',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)} 0%, #8b5cf6 100%)`,
                color: 'white',
                boxShadow: `0 30px 60px ${alpha(theme.palette.primary.main, 0.3)}`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  opacity: 0.1,
                }}
              >
                <Zap size={200} />
              </Box>

              <Typography variant="h2" fontWeight="900" gutterBottom>
                {t('getStartedNow')}
              </Typography>
              <Typography variant="h6" sx={{ mb: 6, opacity: 0.9 }}>
                {t('heroDesc').split('.')[0]}.
              </Typography>

              <Button
                variant="contained"
                onClick={() => navigate('/morphocheck-pro')}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  borderRadius: '20px',
                  px: 6,
                  py: 2,
                  fontSize: '1.2rem',
                  fontWeight: 900,
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.9),
                    transform: 'translateY(-5px)',
                  },
                }}
              >
                {t('enterSystem')}{' '}
                <ArrowRight size={24} style={{ marginLeft: '12px' }} />
              </Button>
            </Paper>
          </motion.div>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 10,
          py: 8,
          borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
          backdropFilter: 'blur(10px)',
        }}
      >
        <Container maxWidth="lg">
          <Grid
            container
            spacing={6}
            justifyContent="space-between"
            alignItems="center"
          >
            <Grid item xs={12} md={4}>
              <Typography
                variant="h5"
                fontWeight="900"
                sx={styles.heroGradient}
              >
                MorphoCheck Pro
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                © {new Date().getFullYear()} {t('footerCopy')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={3}
                justifyContent="flex-end"
              >
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{
                      px: 3,
                      py: 1.5,
                      borderRadius: '16px',
                      background: alpha(theme.palette.background.paper, 0.4),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    }}
                  >
                    <a
                      href="mailto:shermanov356abduvali@gmail.com"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: 'inherit',
                        textDecoration: 'none',
                      }}
                    >
                      <Mail size={20} color={theme.palette.primary.main} />
                      <Typography variant="body2" fontWeight="700">
                        Email Us
                      </Typography>
                    </a>
                  </Stack>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{
                      px: 3,
                      py: 1.5,
                      borderRadius: '16px',
                      background: alpha(theme.palette.background.paper, 0.4),
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                    }}
                  >
                    <a
                      href="tel:+998909699680"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: 'inherit',
                        textDecoration: 'none',
                      }}
                    >
                      <Phone size={20} color={theme.palette.secondary.main} />
                      <Typography variant="body2" fontWeight="700">
                        Call Support
                      </Typography>
                    </a>
                  </Stack>
                </motion.div>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

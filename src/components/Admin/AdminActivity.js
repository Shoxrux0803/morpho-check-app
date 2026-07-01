import React, { useState, useEffect, useCallback } from 'react';
import { AdminApi } from '../../services/AdminApi';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  LinearProgress,
  Stack,
  IconButton,
  Tooltip,
  Paper,
  useTheme,
  Button,
  ButtonGroup,
  Divider,
} from '@mui/material';
import {
  Refresh,
  Speed,
  AccessTime,
  QueryBuilder,
  LocationOn,
  AccountCircle,
  Science,
  EmojiEvents,
  CalendarMonth,
} from '@mui/icons-material';
import TrendingUp from '@mui/icons-material/TrendingUp';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLocalizedLocationLabel } from '../../utils/locationI18n';

const ACTIVITY_I18N = {
  uz: {
    typing: '• kiritmoqda...',
    sec: 'sek',
    min: 'daq',
    best: 'Eng yaxshi',
    researcher: 'Izlanuvchi',
    admin: 'Admin',
    today: 'Bugun',
    week: 'Hafta',
    month: 'Shu oy',
    monthShort: 'Oy',
    ratingScore: 'Reyting balli',
    perRecord: "1 ta ma'lumotga:",
    totalEntered: 'Jami kiritgan:',
    unit: 'ta',
    activeTime: 'Eng faol vaqti:',
    lastActivity: 'Oxirgi faollik:',
    refreshError: "Ma'lumotlarni yangilashda xato!",
    title: 'Top chart',
    usersOnline: (count) => `Hozirda ${count} ta foydalanuvchi online`,
    lastUpdate: 'Oxirgi yangilanish',
    all: 'Barchasi',
    admins: 'Adminlar',
    researchers: 'Izlanuvchilar',
    refresh: 'Yangilash',
    loading: "Ma'lumotlar yuklanmoqda...",
    bestResult: 'Eng yaxshi natija',
    oneRecord: '1 yozuv',
    noUsers: 'Foydalanuvchilar topilmadi',
    noAdmins: 'Adminlar topilmadi',
    noResearchers: 'Izlanuvchilar topilmadi',
  },
  ru: {
    typing: '• вводит...',
    sec: 'сек',
    min: 'мин',
    best: 'Лучший',
    researcher: 'Исследователь',
    admin: 'Админ',
    today: 'Сегодня',
    week: 'Неделя',
    month: 'Этот месяц',
    monthShort: 'Месяц',
    ratingScore: 'Рейтинговый балл',
    perRecord: 'На 1 запись:',
    totalEntered: 'Всего внесено:',
    unit: 'шт',
    activeTime: 'Самое активное время:',
    lastActivity: 'Последняя активность:',
    refreshError: 'Ошибка при обновлении данных!',
    title: 'Топ-чарт',
    usersOnline: (count) => `Сейчас онлайн: ${count} пользователь(ей)`,
    lastUpdate: 'Последнее обновление',
    all: 'Все',
    admins: 'Админы',
    researchers: 'Исследователи',
    refresh: 'Обновить',
    loading: 'Данные загружаются...',
    bestResult: 'Лучший результат',
    oneRecord: '1 запись',
    noUsers: 'Пользователи не найдены',
    noAdmins: 'Админы не найдены',
    noResearchers: 'Исследователи не найдены',
  },
  en: {
    typing: '• typing...',
    sec: 'sec',
    min: 'min',
    best: 'Best',
    researcher: 'Researcher',
    admin: 'Admin',
    today: 'Today',
    week: 'Week',
    month: 'This month',
    monthShort: 'Month',
    ratingScore: 'Rating score',
    perRecord: 'Per record:',
    totalEntered: 'Total entered:',
    unit: 'records',
    activeTime: 'Most active time:',
    lastActivity: 'Last activity:',
    refreshError: 'Error while refreshing data!',
    title: 'Top chart',
    usersOnline: (count) =>
      `${count} user${count === 1 ? '' : 's'} currently online`,
    lastUpdate: 'Last update',
    all: 'All',
    admins: 'Admins',
    researchers: 'Researchers',
    refresh: 'Refresh',
    loading: 'Loading data...',
    bestResult: 'Best result',
    oneRecord: '1 record',
    noUsers: 'No users found',
    noAdmins: 'No admins found',
    noResearchers: 'No researchers found',
  },
  kz: {
    typing: '• енгізіп жатыр...',
    sec: 'сек',
    min: 'мин',
    best: 'Үздік',
    researcher: 'Зерттеуші',
    admin: 'Админ',
    today: 'Бүгін',
    week: 'Апта',
    month: 'Осы ай',
    monthShort: 'Ай',
    ratingScore: 'Рейтинг балы',
    perRecord: '1 жазбаға:',
    totalEntered: 'Барлығы енгізген:',
    unit: 'дана',
    activeTime: 'Ең белсенді уақыты:',
    lastActivity: 'Соңғы белсенділік:',
    refreshError: 'Деректерді жаңарту қатесі!',
    title: 'Топ chart',
    usersOnline: (count) => `Қазір ${count} пайдаланушы online`,
    lastUpdate: 'Соңғы жаңарту',
    all: 'Барлығы',
    admins: 'Админдер',
    researchers: 'Зерттеушілер',
    refresh: 'Жаңарту',
    loading: 'Деректер жүктелуде...',
    bestResult: 'Ең жақсы нәтиже',
    oneRecord: '1 жазба',
    noUsers: 'Пайдаланушылар табылмады',
    noAdmins: 'Админдер табылмады',
    noResearchers: 'Зерттеушілер табылмады',
  },
  tg: {
    typing: '• ворид мекунад...',
    sec: 'сон',
    min: 'дақ',
    best: 'Беҳтарин',
    researcher: 'Таҳқиқотчӣ',
    admin: 'Админ',
    today: 'Имрӯз',
    week: 'Ҳафта',
    month: 'Ин моҳ',
    monthShort: 'Моҳ',
    ratingScore: 'Холи рейтинг',
    perRecord: 'Барои 1 сабт:',
    totalEntered: 'Ҳамагӣ ворид кард:',
    unit: 'то',
    activeTime: 'Вақти фаъолтарин:',
    lastActivity: 'Фаъолияти охирин:',
    refreshError: 'Хато ҳангоми навсозии маълумот!',
    title: 'Top chart',
    usersOnline: (count) => `Ҳоло ${count} истифодабаранда online`,
    lastUpdate: 'Навсозии охирин',
    all: 'Ҳама',
    admins: 'Админҳо',
    researchers: 'Таҳқиқотчиён',
    refresh: 'Навсозӣ',
    loading: 'Маълумот бор шуда истодааст...',
    bestResult: 'Натиҷаи беҳтарин',
    oneRecord: '1 сабт',
    noUsers: 'Истифодабаранда ёфт нашуд',
    noAdmins: 'Админҳо ёфт нашуданд',
    noResearchers: 'Таҳқиқотчиён ёфт нашуданд',
  },
};

ACTIVITY_I18N.tm = {
  typing: '- girizyar...',
  sec: 'sek',
  min: 'min',
  best: 'In gowy',
  researcher: 'Gozlegci',
  admin: 'Admin',
  today: 'Bugun',
  week: 'Hepde',
  month: 'Su ay',
  monthShort: 'Ay',
  ratingScore: 'Reyting baly',
  perRecord: '1 yazga:',
  totalEntered: 'Jemi girizen:',
  unit: 'sany',
  activeTime: 'In isjen wagty:',
  lastActivity: 'Songky isjenlik:',
  refreshError: 'Maglumatlary tazelemekde yalnyslyk!',
  title: 'Top chart',
  usersOnline: (count) => `Hazir ${count} ulanyjy online`,
  lastUpdate: 'Songky tazelenme',
  all: 'Hemmesi',
  admins: 'Adminler',
  researchers: 'Gozlegciler',
  refresh: 'Tazele',
  loading: 'Maglumatlar yuklenyar...',
  bestResult: 'In gowy netije',
  oneRecord: '1 yazgy',
  noUsers: 'Ulanyjylar tapylmady',
  noAdmins: 'Adminler tapylmady',
  noResearchers: 'Gozlegciler tapylmady',
};

ACTIVITY_I18N.tr = {
  typing: '• yazıyor...',
  sec: 'sn',
  min: 'dk',
  best: 'En İyi',
  researcher: 'Araştırmacı',
  admin: 'Yönetici',
  today: 'Bugün',
  week: 'Hafta',
  month: 'Bu Ay',
  monthShort: 'Ay',
  ratingScore: 'Derecelendirme Puanı',
  perRecord: 'Kayıt Başına:',
  totalEntered: 'Toplam Girilen:',
  unit: 'adet',
  activeTime: 'En Aktif Zaman:',
  lastActivity: 'Son Aktivite:',
  refreshError: 'Veriler güncellenirken hata oluştu!',
  title: 'Top listesi',
  usersOnline: (count) => `Şu anda ${count} kullanıcı çevrimiçi`,
  lastUpdate: 'Son Güncelleme',
  all: 'Hepsi',
  admins: 'Yöneticiler',
  researchers: 'Araştırmacılar',
  refresh: 'Yenile',
  loading: 'Veriler yükleniyor...',
  bestResult: 'En iyi sonuç',
  oneRecord: '1 kayıt',
  noUsers: 'Kullanıcı bulunamadı',
  noAdmins: 'Yönetici bulunamadı',
  noResearchers: 'Araştırmacı bulunamadı',
};

const StatusBadge = ({ status, isTyping, t }) => {
  const colors = {
    online: '#10B981',
    away: '#F59E0B',
    offline: '#6B7280',
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: colors[status] || colors.offline,
          boxShadow: status === 'online' ? `0 0 10px ${colors.online}` : 'none',
        }}
        component={motion.div}
        animate={
          status === 'online'
            ? { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }
            : {}
        }
        transition={{ repeat: Infinity, duration: 2 }}
      />
      <Typography
        variant="caption"
        sx={{
          textTransform: 'capitalize',
          fontWeight: 'bold',
          fontSize: '0.7rem',
          color: colors[status],
        }}
      >
        {status} {isTyping && t.typing}
      </Typography>
    </Box>
  );
};

const formatAvgMinutes = (seconds = 0, t = ACTIVITY_I18N.uz) => {
  if (!seconds) return '-';
  const minutes = seconds / 60;
  if (minutes < 1) return `${Math.max(1, Math.round(seconds))} ${t.sec}`;
  return `${minutes.toFixed(minutes >= 10 ? 0 : 1)} ${t.min}`;
};

const localeByLang = {
  uz: 'uz-UZ',
  tg: 'tg-TJ',
  tm: 'tk-TM',
  ru: 'ru-RU',
  en: 'en-US',
  kz: 'kk-KZ',
};

const getScore = (admin) =>
  (admin.stats_today || 0) * 3 +
  (admin.stats_week || 0) * 2 +
  (admin.stats_month || 0);

const getActivityKey = (admin, index) => {
  const id = admin.id || admin.user_id || admin.email || admin.name;
  return id ? `activity-${id}` : `activity-${admin.role || 'user'}-${index}`;
};

const ActivityCard = ({
  admin,
  isDark,
  rank,
  isBest,
  maxScore,
  t,
  locale,
  lang,
}) => {
  const isResearcher = admin.role === 'researcher';
  const isFieldAssistant = admin.role === 'field_assistant';
  const score = getScore(admin);
  const progress = maxScore ? Math.round((score / maxScore) * 100) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          height: '100%',
          borderRadius: 2,
          background: isBest
            ? isDark
              ? 'linear-gradient(135deg, rgba(120, 83, 18, 0.9) 0%, rgba(251, 191, 36, 0.28) 48%, rgba(146, 64, 14, 0.82) 100%)'
              : 'linear-gradient(135deg, #fff7cc 0%, #fbbf24 45%, #fff1b8 100%)'
            : isDark
              ? 'linear-gradient(135deg, rgba(30, 30, 40, 0.9) 0%, rgba(20, 20, 25, 0.9) 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
          border: '1px solid',
          borderColor: isBest
            ? '#f59e0b'
            : isDark
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(0,0,0,0.05)',
          boxShadow: isBest
            ? '0 18px 45px rgba(245, 158, 11, 0.32)'
            : isDark
              ? '0 8px 32px rgba(0,0,0,0.4)'
              : '0 8px 32px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          position: 'relative',
          animation: isBest
            ? 'goldCardPulse 2.8s ease-in-out infinite'
            : 'none',
          '&::before': isBest
            ? {
                content: '""',
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.18) 28%, rgba(255,255,255,0.65) 45%, rgba(255,255,255,0.12) 58%, transparent 100%)',
                transform: 'translateX(-120%)',
                animation: 'goldShine 3.2s ease-in-out infinite',
                pointerEvents: 'none',
              }
            : undefined,
          '&::after': isBest
            ? {
                content: '""',
                position: 'absolute',
                inset: 2,
                borderRadius: 1.75,
                border: '1px solid rgba(255, 255, 255, 0.42)',
                pointerEvents: 'none',
              }
            : undefined,
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box display="flex" gap={2} alignItems="flex-start" mb={2}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: isBest
                  ? '#f59e0b'
                  : isResearcher
                    ? 'secondary.main'
                    : 'primary.main',
                background: isBest
                  ? 'linear-gradient(135deg, #fef3c7 0%, #f59e0b 55%, #92400e 100%)'
                  : undefined,
                color: isBest ? '#111827' : undefined,
                boxShadow: isBest
                  ? '0 0 0 4px rgba(255,255,255,0.28), 0 0 24px rgba(245,158,11,0.75)'
                  : isResearcher
                    ? '0 4px 12px rgba(156,39,176,0.3)'
                    : '0 4px 12px rgba(15,118,110,0.24)',
                animation: isBest
                  ? 'goldTrophyPulse 1.8s ease-in-out infinite'
                  : 'none',
              }}
            >
              {isBest ? (
                <EmojiEvents />
              ) : isResearcher ? (
                <Science />
              ) : (
                admin.name?.[0].toUpperCase() || 'A'
              )}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 0.5, flexWrap: 'wrap', rowGap: 0.5 }}
              >
                <Typography
                  variant="h6"
                  fontWeight="800"
                  sx={{ lineHeight: 1.2, minWidth: 0 }}
                >
                  #{rank} {admin.name}
                </Typography>
                {isBest && (
                  <Chip
                    label={t.best}
                    size="small"
                    sx={{
                      height: 20,
                      borderRadius: 1,
                      fontSize: '0.65rem',
                      fontWeight: 900,
                      bgcolor: '#111827',
                      color: '#fde68a',
                      border: '1px solid rgba(253,230,138,0.7)',
                      boxShadow: '0 0 16px rgba(245,158,11,0.45)',
                    }}
                  />
                )}
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={
                    isResearcher
                      ? t.researcher
                      : isFieldAssistant
                        ? 'Field assistant'
                        : t.admin
                  }
                  size="small"
                  variant="outlined"
                  color={isResearcher ? 'secondary' : 'primary'}
                  sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    borderRadius: 1,
                    fontWeight: 'bold',
                  }}
                />
                <StatusBadge
                  status={admin.status}
                  isTyping={admin.is_typing}
                  t={t}
                />
              </Stack>
              <Stack direction="row" sx={{ mt: 1 }}>
                <Chip
                  icon={<LocationOn sx={{ fontSize: '0.9rem !important' }} />}
                  label={
                    admin.region
                      ? getLocalizedLocationLabel(admin.region, lang, 1)
                      : 'Global'
                  }
                  size="small"
                  sx={{
                    maxWidth: '100%',
                    borderRadius: 2,
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    },
                  }}
                />
              </Stack>
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 4 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  textAlign: 'center',
                  bgcolor: 'transparent',
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  {t.today}
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight="900"
                  color="primary"
                  sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}
                >
                  {admin.stats_today}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  textAlign: 'center',
                  bgcolor: 'transparent',
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  {t.week}
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight="900"
                  color="success.main"
                  sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}
                >
                  {admin.stats_week || 0}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  textAlign: 'center',
                  bgcolor: 'transparent',
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  {t.month}
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight="900"
                  color="secondary"
                  sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}
                >
                  {admin.stats_month}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Stack spacing={2} sx={{ mt: 3 }}>
            <Box>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <TrendingUp sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" fontWeight="bold">
                    {t.ratingScore}
                  </Typography>
                </Box>
                <Typography variant="caption" fontWeight="bold">
                  {score}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                color={isBest ? 'warning' : 'primary'}
                sx={{
                  borderRadius: 1,
                  height: 4,
                  bgcolor: isBest ? 'rgba(120, 53, 15, 0.22)' : undefined,
                  '& .MuiLinearProgress-bar': isBest
                    ? {
                        background:
                          'linear-gradient(90deg, #92400e, #f59e0b, #fef3c7)',
                      }
                    : undefined,
                }}
              />
            </Box>

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box display="flex" alignItems="center" gap={0.5}>
                <Speed sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {t.perRecord}
                </Typography>
              </Box>
              <Typography variant="caption" fontWeight="bold">
                {formatAvgMinutes(admin.avg_entry_time, t)}
              </Typography>
            </Box>

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box display="flex" alignItems="center" gap={0.5}>
                <CalendarMonth sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {t.totalEntered}
                </Typography>
              </Box>
              <Typography variant="caption" fontWeight="bold">
                {admin.total_entries || 0} {t.unit}
              </Typography>
            </Box>

            <Divider flexItem />

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box display="flex" alignItems="center" gap={0.5}>
                <QueryBuilder sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {t.activeTime}
                </Typography>
              </Box>
              <Typography variant="caption" fontWeight="bold">
                {admin.most_active_hour || '-'}
              </Typography>
            </Box>

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box display="flex" alignItems="center" gap={0.5}>
                <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {t.lastActivity}
                </Typography>
              </Box>
              <Typography variant="caption" fontWeight="bold">
                {admin.last_active_at
                  ? new Date(admin.last_active_at).toLocaleTimeString(locale)
                  : '-'}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function AdminActivity() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [roleFilter, setRoleFilter] = useState('all');

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { lang } = useLanguage();
  const t = ACTIVITY_I18N[lang] || ACTIVITY_I18N.uz;
  const locale = localeByLang[lang] || 'uz-UZ';

  const fetchActivity = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await AdminApi.activity.list();
        setData(res.items || []);
        setLastUpdated(new Date());
      } catch (err) {
        console.error(err);
        toast.error(t.refreshError);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    fetchActivity();
    const timer = setInterval(() => fetchActivity(true), 30000);
    return () => clearInterval(timer);
  }, [fetchActivity]);

  const filteredData = data
    .filter((a) => {
      if (roleFilter === 'all') return true;
      return a.role === roleFilter;
    })
    .sort(
      (a, b) =>
        getScore(b) - getScore(a) ||
        (b.total_entries || 0) - (a.total_entries || 0)
    );

  const onlineCount = data.filter((a) => a.status === 'online').length;
  const bestUser = filteredData[0];
  const maxScore = bestUser ? getScore(bestUser) : 0;

  return (
    <Box>
      <Box
        display="flex"
        flexDirection={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        mb={4}
        gap={2}
      >
        <Box sx={{ maxWidth: '100%', wordBreak: 'break-word' }}>
          <Typography
            variant="h4"
            fontWeight="900"
            color="primary.main"
            gutterBottom
            sx={{ fontSize: { xs: '1.75rem', md: '2.125rem' } }}
          >
            {t.title}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.85rem', md: '1rem' } }}
          >
            {t.usersOnline(onlineCount)} • {t.lastUpdate}:{' '}
            {lastUpdated.toLocaleTimeString()}
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          width={{ xs: '100%', md: 'auto' }}
        >
          <Box
            sx={{
              display: 'flex',
              overflowX: 'auto',
              width: '100%',
              pb: { xs: 0.5, md: 0 },
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
            }}
          >
            <ButtonGroup
              size="small"
              variant="outlined"
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 2,
                flexShrink: 0,
              }}
            >
              <Button
                onClick={() => setRoleFilter('all')}
                variant={roleFilter === 'all' ? 'contained' : 'outlined'}
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
              >
                {t.all}
              </Button>
              <Button
                onClick={() => setRoleFilter('admin')}
                variant={roleFilter === 'admin' ? 'contained' : 'outlined'}
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
              >
                {t.admins}
              </Button>
              <Button
                onClick={() => setRoleFilter('researcher')}
                variant={roleFilter === 'researcher' ? 'contained' : 'outlined'}
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
              >
                {t.researchers}
              </Button>
              <Button
                onClick={() => setRoleFilter('field_assistant')}
                variant={
                  roleFilter === 'field_assistant' ? 'contained' : 'outlined'
                }
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
              >
                Field assistants
              </Button>
            </ButtonGroup>
          </Box>

          <Tooltip title={t.refresh}>
            <span>
              <IconButton
                onClick={() => fetchActivity()}
                disabled={loading}
                sx={{
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                  '&:hover': { bgcolor: 'primary.main', color: 'white' },
                }}
              >
                <Refresh
                  sx={{
                    animation: loading ? 'spin 1s linear infinite' : 'none',
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {loading && data.length === 0 ? (
        <Box py={10} textAlign="center">
          <LinearProgress sx={{ maxWidth: 400, mx: 'auto', borderRadius: 2 }} />
          <Typography sx={{ mt: 2 }} color="text.secondary">
            {t.loading}
          </Typography>
        </Box>
      ) : (
        <AnimatePresence>
          {bestUser && (
            <Paper
              key="best-user-summary"
              elevation={0}
              sx={{
                mb: 3,
                p: { xs: 2, md: 3 },
                borderRadius: 2,
                border: '1px solid',
                borderColor: '#f59e0b',
                background: isDark
                  ? 'linear-gradient(135deg, rgba(120, 53, 15, 0.9), rgba(245, 158, 11, 0.26), rgba(17, 24, 39, 0.82))'
                  : 'linear-gradient(135deg, #fff7cc, #fbbf24, #fff8dc)',
                boxShadow: '0 20px 55px rgba(245, 158, 11, 0.24)',
                overflow: 'hidden',
                position: 'relative',
                animation: 'goldCardPulse 2.8s ease-in-out infinite',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.14) 32%, rgba(255,255,255,0.72) 48%, rgba(255,255,255,0.12) 62%, transparent 100%)',
                  transform: 'translateX(-120%)',
                  animation: 'goldShine 3.2s ease-in-out infinite',
                  pointerEvents: 'none',
                },
              }}
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                alignItems={{ xs: 'flex-start', md: 'center' }}
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    sx={{
                      width: 52,
                      height: 52,
                      color: '#111827',
                      background:
                        'linear-gradient(135deg, #fef3c7 0%, #f59e0b 55%, #92400e 100%)',
                      boxShadow:
                        '0 0 0 4px rgba(255,255,255,0.28), 0 0 24px rgba(245,158,11,0.75)',
                      animation: 'goldTrophyPulse 1.8s ease-in-out infinite',
                    }}
                  >
                    <EmojiEvents />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="overline"
                      fontWeight={900}
                      sx={{ color: isDark ? '#fde68a' : '#92400e' }}
                    >
                      {t.bestResult}
                    </Typography>
                    <Typography variant="h5" fontWeight={800}>
                      {bestUser.name}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    label={`${t.today} ${bestUser.stats_today || 0} ${t.unit}`}
                    color="primary"
                  />
                  <Chip
                    label={`${t.week} ${bestUser.stats_week || 0} ${t.unit}`}
                    color="success"
                  />
                  <Chip
                    label={`${t.monthShort} ${bestUser.stats_month || 0} ${t.unit}`}
                    color="secondary"
                  />
                  <Chip
                    label={`${t.oneRecord} ${formatAvgMinutes(bestUser.avg_entry_time, t)}`}
                  />
                </Stack>
              </Stack>
            </Paper>
          )}
          <Grid key="activity-grid" container spacing={3}>
            {filteredData.map((admin, index) => (
              <Grid
                size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
                key={getActivityKey(admin, index)}
              >
                <ActivityCard
                  admin={admin}
                  isDark={isDark}
                  rank={index + 1}
                  isBest={index === 0}
                  maxScore={maxScore}
                  t={t}
                  locale={locale}
                  lang={lang}
                />
              </Grid>
            ))}
            {filteredData.length === 0 && (
              <Grid size={{ xs: 12 }}>
                <Paper
                  sx={{
                    p: 10,
                    textAlign: 'center',
                    borderRadius: 4,
                    bgcolor: 'transparent',
                    border: '1px dashed',
                    borderColor: 'divider',
                  }}
                >
                  <AccountCircle
                    sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
                  />
                  <Typography color="text.secondary">
                    {roleFilter === 'all'
                      ? t.noUsers
                      : roleFilter === 'admin'
                        ? t.noAdmins
                        : roleFilter === 'researcher'
                          ? t.noResearchers
                          : 'Field assistants topilmadi'}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </AnimatePresence>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes goldShine {
          0% { transform: translateX(-120%); }
          42%, 100% { transform: translateX(120%); }
        }

        @keyframes goldCardPulse {
          0%, 100% { box-shadow: 0 18px 45px rgba(245, 158, 11, 0.24); }
          50% { box-shadow: 0 22px 64px rgba(245, 158, 11, 0.48); }
        }

        @keyframes goldTrophyPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </Box>
  );
}

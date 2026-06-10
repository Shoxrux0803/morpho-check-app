// src/components/Dashboard/SuperAdminDashboard.js
import React, { useMemo } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Divider,
  LinearProgress,
  useTheme,
  Chip,
  Stack,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  AdminPanelSettings,
  FmdGoodOutlined,
  MonitorWeightOutlined,
  ReportProblemOutlined,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
} from 'recharts';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLocalizedLocationLabel } from '../../utils/locationI18n';

const DASH_I18N = {
  uz: {
    title: 'SuperAdmin analitika markazi',
    subtitle:
      "Hududlar, adminlar, klinik xavf va oylik dinamika bo'yicha yagona nazorat paneli",
    analyses: 'Analizlar',
    admins: 'Adminlar',
    today: 'Bugun',
    totalAnalyses: 'Jami analizlar',
    allTime: 'Barcha vaqt davomida',
    todayAnalyses: 'Bugungi analizlar',
    enteredToday: 'Bugun kiritilgan',
    weeklyGrowth: "Haftalik o'sish",
    thisWeek: 'ta shu hafta',
    totalAdmins: 'Jami adminlar',
    simple: 'oddiy',
    avgBmi: "O'rtacha BMI",
    systemWide: "Tizim bo'yicha",
    riskRegions: "Eng ko'p risk chiqqan regionlar",
    riskRegionsSub: 'BMI yoki Z-score xavf chegarasidan chiqqan yozuvlar',
    riskFrom: 'tadan',
    risk: 'risk',
    monthlyDynamics: 'Oylik dinamika',
    monthlyDynamicsSub: "So'nggi 12 oy davomidagi analizlar soni",
    analysesCount: 'Analizlar soni',
    genderDistribution: 'Jinsiy taqsimot',
    genderDistributionSub: 'Erkak / Ayol nisbati',
    ageGroups: 'Yosh guruhlari',
    ageGroupsSub: "Bemorlar yosh bo'yicha",
    patientsCount: 'Bemorlar soni',
    somatotypeDistribution: 'Somatotip taqsimoti',
    somatotypeDistributionSub: 'Tana tuzilishi klassifikatsiyasi',
    count: 'Soni',
    topRegions: "Viloyatlar bo'yicha top-10",
    topRegionsSub: "Eng ko'p analiz kiritilgan hududlar",
    bmiStatusDistribution: 'BMI holati taqsimoti',
    bmiStatusDistributionSub: "Sog'lik guruhlari bo'yicha",
    noData: "Ma'lumot yo'q",
    patient: 'bemor',
    avgRadar: "Somatotip o'rtacha radar",
    avgRadarSub: "Tizim bo'yicha o'rtacha somatometrik ko'rsatkichlar",
    average: "O'rtacha",
    adminsDistribution: 'Adminlar taqsimoti',
    adminsDistributionSub: "Rollar bo'yicha tizim foydalanuvchilari",
    lastUpdate: "So'nggi yangilanish",
    male: 'Erkak',
    female: 'Ayol',
    unknown: "Noma'lum",
    normal: 'Normal',
    overweight: 'Ortiqcha',
    obese: 'Semizlik',
    underweight: "Ozg'in",
  },
  ru: {
    title: 'Центр аналитики SuperAdmin',
    subtitle:
      'Единая панель контроля по регионам, администраторам, клиническим рискам и месячной динамике',
    analyses: 'Анализы',
    admins: 'Администраторы',
    today: 'Сегодня',
    totalAnalyses: 'Всего анализов',
    allTime: 'За все время',
    todayAnalyses: 'Анализы сегодня',
    enteredToday: 'Внесено сегодня',
    weeklyGrowth: 'Недельный рост',
    thisWeek: 'за эту неделю',
    totalAdmins: 'Всего администраторов',
    simple: 'обычных',
    avgBmi: 'Средний BMI',
    systemWide: 'По системе',
    riskRegions: 'Регионы с наибольшим риском',
    riskRegionsSub: 'Записи, вышедшие за риск-границы BMI или Z-score',
    riskFrom: 'из',
    risk: 'риск',
    monthlyDynamics: 'Месячная динамика',
    monthlyDynamicsSub: 'Количество анализов за последние 12 месяцев',
    analysesCount: 'Количество анализов',
    genderDistribution: 'Распределение по полу',
    genderDistributionSub: 'Соотношение мужчин и женщин',
    ageGroups: 'Возрастные группы',
    ageGroupsSub: 'Пациенты по возрасту',
    patientsCount: 'Количество пациентов',
    somatotypeDistribution: 'Распределение соматотипов',
    somatotypeDistributionSub: 'Классификация телосложения',
    count: 'Количество',
    topRegions: 'Топ-10 по областям',
    topRegionsSub: 'Регионы с наибольшим количеством анализов',
    bmiStatusDistribution: 'Распределение статуса BMI',
    bmiStatusDistributionSub: 'По группам здоровья',
    noData: 'Данных нет',
    patient: 'пациент',
    avgRadar: 'Средний радар соматотипа',
    avgRadarSub: 'Средние соматометрические показатели по системе',
    average: 'Среднее',
    adminsDistribution: 'Распределение администраторов',
    adminsDistributionSub: 'Пользователи системы по ролям',
    lastUpdate: 'Последнее обновление',
    male: 'Мужчины',
    female: 'Женщины',
    unknown: 'Неизвестно',
    normal: 'Норма',
    overweight: 'Избыточный вес',
    obese: 'Ожирение',
    underweight: 'Недостаточный вес',
  },
  en: {
    title: 'SuperAdmin analytics center',
    subtitle:
      'A single control panel for regions, admins, clinical risk, and monthly dynamics',
    analyses: 'Analyses',
    admins: 'Admins',
    today: 'Today',
    totalAnalyses: 'Total analyses',
    allTime: 'All time',
    todayAnalyses: "Today's analyses",
    enteredToday: 'Entered today',
    weeklyGrowth: 'Weekly growth',
    thisWeek: 'this week',
    totalAdmins: 'Total admins',
    simple: 'standard',
    avgBmi: 'Average BMI',
    systemWide: 'System-wide',
    riskRegions: 'Regions with the highest risk',
    riskRegionsSub: 'Records outside BMI or Z-score risk thresholds',
    riskFrom: 'from',
    risk: 'risk',
    monthlyDynamics: 'Monthly dynamics',
    monthlyDynamicsSub: 'Number of analyses over the last 12 months',
    analysesCount: 'Number of analyses',
    genderDistribution: 'Gender distribution',
    genderDistributionSub: 'Male / female ratio',
    ageGroups: 'Age groups',
    ageGroupsSub: 'Patients by age',
    patientsCount: 'Number of patients',
    somatotypeDistribution: 'Somatotype distribution',
    somatotypeDistributionSub: 'Body composition classification',
    count: 'Count',
    topRegions: 'Top 10 regions',
    topRegionsSub: 'Regions with the most entered analyses',
    bmiStatusDistribution: 'BMI status distribution',
    bmiStatusDistributionSub: 'By health groups',
    noData: 'No data',
    patient: 'patient',
    avgRadar: 'Average somatotype radar',
    avgRadarSub: 'Average system-wide somatometric indicators',
    average: 'Average',
    adminsDistribution: 'Admin distribution',
    adminsDistributionSub: 'System users by role',
    lastUpdate: 'Last update',
    male: 'Male',
    female: 'Female',
    unknown: 'Unknown',
    normal: 'Normal',
    overweight: 'Overweight',
    obese: 'Obesity',
    underweight: 'Underweight',
  },
  kz: {
    title: 'SuperAdmin аналитика орталығы',
    subtitle:
      'Аймақтар, админдер, клиникалық қауіп және айлық динамика бойынша бірыңғай бақылау панелі',
    analyses: 'Талдаулар',
    admins: 'Админдер',
    today: 'Бүгін',
    totalAnalyses: 'Жалпы талдаулар',
    allTime: 'Барлық уақыт бойынша',
    todayAnalyses: 'Бүгінгі талдаулар',
    enteredToday: 'Бүгін енгізілген',
    weeklyGrowth: 'Апталық өсім',
    thisWeek: 'осы аптада',
    totalAdmins: 'Жалпы админдер',
    simple: 'қарапайым',
    avgBmi: 'Орташа BMI',
    systemWide: 'Жүйе бойынша',
    riskRegions: 'Қауіп ең көп шыққан аймақтар',
    riskRegionsSub: 'BMI немесе Z-score қауіп шегінен шыққан жазбалар',
    riskFrom: 'ішінен',
    risk: 'қауіп',
    monthlyDynamics: 'Айлық динамика',
    monthlyDynamicsSub: 'Соңғы 12 айдағы талдаулар саны',
    analysesCount: 'Талдаулар саны',
    genderDistribution: 'Жыныстық таралу',
    genderDistributionSub: 'Ер / әйел арақатынасы',
    ageGroups: 'Жас топтары',
    ageGroupsSub: 'Пациенттер жасы бойынша',
    patientsCount: 'Пациенттер саны',
    somatotypeDistribution: 'Соматотип таралуы',
    somatotypeDistributionSub: 'Дене құрылымы классификациясы',
    count: 'Саны',
    topRegions: 'Облыстар бойынша топ-10',
    topRegionsSub: 'Ең көп талдау енгізілген аймақтар',
    bmiStatusDistribution: 'BMI жағдайы таралуы',
    bmiStatusDistributionSub: 'Денсаулық топтары бойынша',
    noData: 'Дерек жоқ',
    patient: 'пациент',
    avgRadar: 'Соматотиптің орташа радари',
    avgRadarSub: 'Жүйе бойынша орташа соматометриялық көрсеткіштер',
    average: 'Орташа',
    adminsDistribution: 'Админдер таралуы',
    adminsDistributionSub: 'Жүйе пайдаланушылары рөлдер бойынша',
    lastUpdate: 'Соңғы жаңарту',
    male: 'Ерлер',
    female: 'Әйелдер',
    unknown: 'Белгісіз',
    normal: 'Қалыпты',
    overweight: 'Артық салмақ',
    obese: 'Семіздік',
    underweight: 'Салмақ жетіспеушілігі',
  },
};

DASH_I18N.tg = {
  ...DASH_I18N.uz,
  title: 'Маркази таҳлилии SuperAdmin',
  subtitle:
    'Панели ягона барои ҳудудҳо, админҳо, хавфи клиникӣ ва динамикаи моҳона',
  analyses: 'Таҳлилҳо',
  admins: 'Админҳо',
  today: 'Имрӯз',
  totalAnalyses: 'Ҳамаи таҳлилҳо',
  allTime: 'Дар тамоми давра',
  todayAnalyses: 'Таҳлилҳои имрӯза',
  enteredToday: 'Имрӯз ворид шудааст',
  weeklyGrowth: 'Афзоиши ҳафтаина',
  thisWeek: 'дар ин ҳафта',
  totalAdmins: 'Ҳамаи админҳо',
  simple: 'оддӣ',
  avgBmi: 'BMI миёна',
  systemWide: 'Дар тамоми низом',
  riskRegions: 'Ҳудудҳои дорои хавфи бештар',
  riskRegionsSub: 'Сабтҳое, ки аз ҳадди хавфи BMI ё Z-score гузаштаанд',
  riskFrom: 'аз',
  risk: 'хавф',
  monthlyDynamics: 'Динамикаи моҳона',
  monthlyDynamicsSub: 'Шумораи таҳлилҳо дар 12 моҳи охир',
  analysesCount: 'Шумораи таҳлилҳо',
  genderDistribution: 'Тақсимот аз рӯи ҷинс',
  genderDistributionSub: 'Нисбати мард / зан',
  ageGroups: 'Гурӯҳҳои синнусолӣ',
  ageGroupsSub: 'Беморон аз рӯи синну сол',
  patientsCount: 'Шумораи беморон',
  somatotypeDistribution: 'Тақсимоти соматотип',
  somatotypeDistributionSub: 'Таснифи сохтори бадан',
  count: 'Шумора',
  topRegions: 'Top-10 аз рӯи вилоятҳо',
  topRegionsSub: 'Ҳудудҳои дорои таҳлилҳои бештар',
  bmiStatusDistribution: 'Тақсимоти ҳолати BMI',
  bmiStatusDistributionSub: 'Аз рӯи гурӯҳҳои саломатӣ',
  noData: 'Маълумот нест',
  patient: 'бемор',
  avgRadar: 'Радари миёнаи соматотип',
  avgRadarSub: 'Нишондиҳандаҳои миёнаи соматометрӣ дар низом',
  average: 'Миёна',
  adminsDistribution: 'Тақсимоти админҳо',
  adminsDistributionSub: 'Истифодабарандагони низом аз рӯи нақшҳо',
  lastUpdate: 'Навсозии охирин',
  male: 'Мард',
  female: 'Зан',
  unknown: 'Номаълум',
  normal: 'Меъёр',
  overweight: 'Вазни зиёдатӣ',
  obese: 'Фарбеҳӣ',
  underweight: 'Камвазнӣ',
};

DASH_I18N.tm = {
  ...DASH_I18N.uz,
  title: 'SuperAdmin analitika merkezi',
  subtitle:
    'Sebitler, adminler, kliniki risk we aylyk dinamika boyunca yeke-tak gozegcilik paneli',
  analyses: 'Analizler',
  admins: 'Adminler',
  today: 'Bugun',
  totalAnalyses: 'Jemi analizler',
  allTime: 'Ahli wagt boyunca',
  todayAnalyses: 'Bugunki analizler',
  enteredToday: 'Bugun girizilen',
  weeklyGrowth: 'Hepdelik osus',
  thisWeek: 'su hepde',
  totalAdmins: 'Jemi adminler',
  simple: 'adaty',
  avgBmi: 'Orta BMI',
  systemWide: 'Ulgam boyunca',
  riskRegions: 'Risk in kop cykan sebitler',
  riskRegionsSub: 'BMI ya-da Z-score risk serhedinden cykan yazgylar',
  riskFrom: 'icinden',
  risk: 'risk',
  monthlyDynamics: 'Aylyk dinamika',
  monthlyDynamicsSub: 'Songky 12 ay boyunca analizler sany',
  analysesCount: 'Analizler sany',
  genderDistribution: 'Jyns boyunca paylanys',
  genderDistributionSub: 'Erkek / ayal gatnasygy',
  ageGroups: 'Yas toparlary',
  ageGroupsSub: 'Patientler yasy boyunca',
  patientsCount: 'Patientler sany',
  somatotypeDistribution: 'Somatotip paylanysy',
  somatotypeDistributionSub: 'Beden duzulisi klassifikasiýasy',
  count: 'Sany',
  topRegions: 'Welayatlar boyunca top-10',
  topRegionsSub: 'In kop analiz girizilen sebitler',
  bmiStatusDistribution: 'BMI yagdayy paylanysy',
  bmiStatusDistributionSub: 'Saglyk toparlary boyunca',
  noData: 'Maglumat yok',
  patient: 'patient',
  avgRadar: 'Orta somatotip radary',
  avgRadarSub: 'Ulgam boyunca orta somatometrik gorkezijiler',
  average: 'Orta',
  adminsDistribution: 'Adminler paylanysy',
  adminsDistributionSub: 'Ulgam ulanyjylary rollar boyunca',
  lastUpdate: 'Songky tazelenme',
  male: 'Erkek',
  female: 'Ayal',
  unknown: 'Namalum',
  normal: 'Kada',
  overweight: 'Artyk agram',
  obese: 'Semizlik',
  underweight: 'Agram yetmezciligi',
};

// ==== PALETTE ====
const COLORS = {
  primary: '#0f766e',
  secondary: '#2563eb',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  teal: '#14b8a6',
  rose: '#f43f5e',
};
const PIE_COLORS = [COLORS.info, COLORS.rose, COLORS.teal, COLORS.warning];
const AGE_COLORS = ['#0f766e', '#2563eb', '#14b8a6', '#f59e0b', '#64748b'];
const localeByLang = {
  uz: 'uz-UZ',
  tg: 'tg-TJ',
  tm: 'tk-TM',
  ru: 'ru-RU',
  en: 'en-US',
  kz: 'kk-KZ',
};

const REGION_LABELS_RU = {
  'toshkent shahri': 'г. Ташкент',
  toshkent: 'Ташкентская область',
  'toshkent viloyati': 'Ташкентская область',
  qoraqalpogiston: 'Республика Каракалпакстан',
  "qoraqalpog'iston": 'Республика Каракалпакстан',
  "qoraqalpog'iston respublikasi": 'Республика Каракалпакстан',
  andijon: 'Андижанская область',
  'andijon viloyati': 'Андижанская область',
  buxoro: 'Бухарская область',
  'buxoro viloyati': 'Бухарская область',
  fargona: 'Ферганская область',
  "farg'ona": 'Ферганская область',
  "farg'ona viloyati": 'Ферганская область',
  jizzax: 'Джизакская область',
  'jizzax viloyati': 'Джизакская область',
  xorazm: 'Хорезмская область',
  'xorazm viloyati': 'Хорезмская область',
  namangan: 'Наманганская область',
  'namangan viloyati': 'Наманганская область',
  navoiy: 'Навоийская область',
  'navoiy viloyati': 'Навоийская область',
  qashqadaryo: 'Кашкадарьинская область',
  'qashqadaryo viloyati': 'Кашкадарьинская область',
  samarqand: 'Самаркандская область',
  'samarqand viloyati': 'Самаркандская область',
  sirdaryo: 'Сырдарьинская область',
  'sirdaryo viloyati': 'Сырдарьинская область',
  surxondaryo: 'Сурхандарьинская область',
  'surxondaryo viloyati': 'Сурхандарьинская область',
};

const normalizeRegionKey = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/[‘’`ʻʼ]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const getRegionLabel = (value, lang) => {
  if (['en', 'ru', 'tm'].includes(lang))
    return getLocalizedLocationLabel(value, lang, 1);
  const key = normalizeRegionKey(value);
  return REGION_LABELS_RU[key] || value || '-';
};

// ==== HELPERS ====
const GlassCard = ({ children, sx = {}, gradient }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        borderRadius: 2,
        background: gradient
          ? gradient
          : isDark
            ? 'rgba(15,23,42,0.78)'
            : 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(14px)',
        border: '1px solid',
        borderColor: isDark
          ? 'rgba(148,163,184,0.18)'
          : 'rgba(15,118,110,0.14)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 16px 44px rgba(15,23,42,0.10)',
        },
        overflowX: 'auto',
        '&::-webkit-scrollbar': {
          height: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderRadius: '10px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
        },
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
};

const KpiCard = ({ label, value, sub, icon, color, trend, loading }) => (
  <GlassCard
    gradient={`linear-gradient(180deg, ${color}12 0%, transparent 68%)`}
    sx={{ minHeight: 148, borderTop: `3px solid ${color}` }}
  >
    {loading ? (
      <CircularProgress size={28} sx={{ color }} />
    ) : (
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            sx={{
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontSize: '0.7rem',
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ color, mt: 0.5, lineHeight: 1 }}
          >
            {value ?? '—'}
          </Typography>
          {sub && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: 'block' }}
            >
              {sub}
            </Typography>
          )}
          {typeof trend === 'number' && (
            <Chip
              size="small"
              label={`${trend > 0 ? '+' : ''}${trend}%`}
              sx={{
                mt: 1,
                fontSize: '0.65rem',
                height: 20,
                bgcolor: trend >= 0 ? '#10b98122' : '#ef444422',
                color: trend >= 0 ? COLORS.success : COLORS.error,
                fontWeight: 700,
              }}
            />
          )}
        </Box>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: `${color}22`,
            color,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    )}
  </GlassCard>
);

const SectionTitle = ({ title, subtitle }) => (
  <Box mb={2}>
    <Typography
      variant="h6"
      fontWeight={800}
      sx={{
        color: 'text.primary',
        letterSpacing: 0,
      }}
    >
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="caption" color="text.secondary">
        {subtitle}
      </Typography>
    )}
  </Box>
);

const CustomTooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: 'none',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    backdropFilter: 'blur(20px)',
    background: 'rgba(15,15,25,0.92)',
    color: '#fff',
    fontSize: 13,
  },
  labelStyle: { color: '#a5b4fc', fontWeight: 700 },
  itemStyle: { color: '#e2e8f0' },
};

// ==== MAIN COMPONENT ====
export default function SuperAdminDashboard({
  stats,
  statsLoading,
  admins = [],
}) {
  const theme = useTheme();
  const { lang } = useLanguage();
  const tt = DASH_I18N[lang] || DASH_I18N.uz;
  const locale = localeByLang[lang] || 'uz-UZ';

  // ----- Derived data -----
  const genderData = useMemo(
    () =>
      [
        { name: tt.male, value: stats?.by_gender?.erkak || 0 },
        { name: tt.female, value: stats?.by_gender?.ayol || 0 },
        { name: tt.unknown, value: stats?.by_gender?.["noma'lum"] || 0 },
      ].filter((d) => d.value > 0),
    [stats, tt]
  );

  const ageGroupData = useMemo(
    () =>
      (stats?.by_age_group || []).map((g, i) => ({
        ...g,
        fill: AGE_COLORS[i % AGE_COLORS.length],
      })),
    [stats]
  );

  const somatoData = useMemo(
    () =>
      Object.entries(stats?.by_somatotype || {}).map(([name, value]) => ({
        name,
        value,
      })),
    [stats]
  );

  const regionData = useMemo(
    () =>
      (stats?.by_region || []).slice(0, 10).map((row) => ({
        ...row,
        regionLabel: getRegionLabel(row.region, lang),
      })),
    [lang, stats]
  );
  const riskRegionRows = useMemo(
    () =>
      (stats?.top_risk_regions || []).slice(0, 6).map((row) => ({
        ...row,
        regionLabel: getRegionLabel(row.region, lang),
      })),
    [lang, stats]
  );

  const monthlyTrend = useMemo(
    () =>
      (stats?.monthly_trend || []).map((m) => ({
        ...m,
        avgBmi: m.avg_bmi ? parseFloat(m.avg_bmi).toFixed(1) : null,
      })),
    [stats]
  );

  const bmiCategories = useMemo(() => {
    const total =
      (stats?.bmi_distribution?.normal || 0) +
      (stats?.bmi_distribution?.underweight || 0) +
      (stats?.bmi_distribution?.overweight || 0) +
      (stats?.bmi_distribution?.obese || 0);
    if (!total) return [];
    return [
      {
        name: tt.normal,
        value: stats.bmi_distribution.normal,
        pct: Math.round((stats.bmi_distribution.normal / total) * 100),
        color: COLORS.success,
      },
      {
        name: tt.overweight,
        value: stats.bmi_distribution.overweight,
        pct: Math.round((stats.bmi_distribution.overweight / total) * 100),
        color: COLORS.warning,
      },
      {
        name: tt.obese,
        value: stats.bmi_distribution.obese,
        pct: Math.round((stats.bmi_distribution.obese / total) * 100),
        color: COLORS.error,
      },
      {
        name: tt.underweight,
        value: stats.bmi_distribution.underweight,
        pct: Math.round((stats.bmi_distribution.underweight / total) * 100),
        color: COLORS.info,
      },
    ];
  }, [stats, tt]);

  const radarData = useMemo(() => {
    // Somatotip radar: endomorph/mesomorph/ectomorph average comparisons
    const st = stats?.somatotype_avg || {};
    return [
      { metric: 'Endomorph', value: parseFloat(st.endomorph || 0).toFixed(2) },
      { metric: 'Mezomorph', value: parseFloat(st.mesomorph || 0).toFixed(2) },
      { metric: 'Ektomorph', value: parseFloat(st.ectomorph || 0).toFixed(2) },
    ];
  }, [stats]);

  // Admins per role
  const adminRolePie = useMemo(() => {
    const superCount = admins.filter((a) => a.role === 'superadmin').length;
    const adminCount = admins.filter((a) => a.role === 'admin').length;
    return [
      { name: 'Superadmin', value: superCount },
      { name: tt.admins, value: adminCount },
    ].filter((d) => d.value > 0);
  }, [admins, tt]);

  if (statsLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={400}
      >
        <CircularProgress size={48} sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        mb={3}
        p={3}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor:
            theme.palette.mode === 'dark'
              ? 'rgba(148,163,184,0.18)'
              : 'rgba(15,118,110,0.16)',
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(15,118,110,0.22), rgba(37,99,235,0.12))'
              : 'linear-gradient(135deg, rgba(15,118,110,0.10), rgba(37,99,235,0.06))',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography
              variant="h4"
              fontWeight={900}
              sx={{ color: 'text.primary' }}
            >
              {tt.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {tt.subtitle}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={`${tt.analyses}: ${stats?.total_analyses?.toLocaleString(locale) ?? 0}`}
              sx={{ fontWeight: 800 }}
            />
            <Chip
              label={`${tt.admins}: ${admins.length}`}
              color="primary"
              sx={{ fontWeight: 800 }}
            />
            <Chip
              label={`${tt.today}: ${stats?.today_analyses ?? 0}`}
              color="success"
              sx={{ fontWeight: 800 }}
            />
          </Stack>
        </Stack>
      </Box>

      {/* ===== KPI CARDS ===== */}
      <Grid container spacing={2} mb={4}>
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
          <KpiCard
            label={tt.totalAnalyses}
            value={stats?.total_analyses?.toLocaleString(locale) ?? '0'}
            sub={tt.allTime}
            icon={<Assessment />}
            color={COLORS.primary}
            trend={stats?.monthly_growth}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
          <KpiCard
            label={tt.todayAnalyses}
            value={stats?.today_analyses?.toLocaleString(locale) ?? '0'}
            sub={tt.enteredToday}
            icon={<TrendingUp />}
            color={COLORS.success}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
          <KpiCard
            label={tt.weeklyGrowth}
            value={
              stats?.weekly_growth_pct != null
                ? `${Number(stats.weekly_growth_pct) > 0 ? '+' : ''}${stats.weekly_growth_pct}%`
                : '0%'
            }
            sub={`${stats?.weekly_analyses ?? 0} ${tt.thisWeek}`}
            icon={<TrendingUp />}
            color={COLORS.info}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
          <KpiCard
            label={tt.totalAdmins}
            value={admins.length}
            sub={`${admins.filter((a) => a.role === 'superadmin').length} super, ${admins.filter((a) => a.role === 'admin').length} ${tt.simple}`}
            icon={<AdminPanelSettings />}
            color={COLORS.secondary}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
          <KpiCard
            label={tt.avgBmi}
            value={stats?.avg_bmi ? parseFloat(stats.avg_bmi).toFixed(1) : '—'}
            sub={tt.systemWide}
            icon={<MonitorWeightOutlined />}
            color={COLORS.warning}
          />
        </Grid>
      </Grid>

      {/* ===== CHARTS SECTION ===== */}
      <Grid container spacing={3}>
        {riskRegionRows.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <GlassCard>
              <SectionTitle
                title={tt.riskRegions}
                subtitle={tt.riskRegionsSub}
              />
              <Grid container spacing={2}>
                {riskRegionRows.map((row) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={row.region}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor:
                          theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.03)'
                            : 'rgba(239,68,68,0.04)',
                      }}
                    >
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        gap={2}
                      >
                        <Box display="flex" gap={1.2} alignItems="center">
                          <FmdGoodOutlined color="error" fontSize="small" />
                          <Typography variant="body2" fontWeight={800}>
                            {row.regionLabel}
                          </Typography>
                        </Box>
                        <ReportProblemOutlined
                          sx={{ color: COLORS.error }}
                          fontSize="small"
                        />
                      </Box>
                      <Typography
                        variant="h5"
                        fontWeight={800}
                        color="error.main"
                        mt={1}
                      >
                        {row.count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.total} {tt.riskFrom} {row.risk_rate}% {tt.risk}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(row.risk_rate, 100)}
                        sx={{
                          mt: 1.2,
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'rgba(239,68,68,0.12)',
                          '& .MuiLinearProgress-bar': { bgcolor: COLORS.error },
                        }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </GlassCard>
          </Grid>
        )}
        {/* ROW 1: Wide Chart (Monthly trend) */}
        <Grid size={{ xs: 12 }}>
          <GlassCard sx={{ height: '100%' }}>
            <SectionTitle
              title={tt.monthlyDynamics}
              subtitle={tt.monthlyDynamicsSub}
            />
            <Box sx={{ height: 350, minWidth: { xs: 280, sm: 400, md: 600 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="gradCount" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={COLORS.primary}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor={COLORS.primary}
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient id="gradBmi" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={COLORS.warning}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={COLORS.warning}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <YAxis
                    yAxisId="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <ReTooltip {...CustomTooltipStyle} />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="count"
                    name={tt.analysesCount}
                    stroke={COLORS.primary}
                    strokeWidth={2.5}
                    fill="url(#gradCount)"
                    dot={{ r: 3, fill: COLORS.primary }}
                  />
                  {monthlyTrend.some((d) => d.avgBmi) && (
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="avgBmi"
                      name={tt.avgBmi}
                      stroke={COLORS.warning}
                      strokeWidth={2}
                      fill="url(#gradBmi)"
                      strokeDasharray="5 3"
                      dot={false}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>

        {/* ROW 2: Triple Distribution Charts (Gender, Age, Somatotype) */}
        <Grid size={{ xs: 12, md: 4 }}>
          <GlassCard sx={{ height: '100%' }}>
            <SectionTitle
              title={tt.genderDistribution}
              subtitle={tt.genderDistributionSub}
            />
            <Box sx={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {genderData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} stroke="none" />
                    ))}
                  </Pie>
                  <ReTooltip {...CustomTooltipStyle} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Stack spacing={0.8}>
              {genderData.map((g, i) => {
                const total = genderData.reduce((s, d) => s + d.value, 0);
                const pct = total ? Math.round((g.value / total) * 100) : 0;
                return (
                  <Box
                    key={i}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: PIE_COLORS[i],
                        }}
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                      >
                        {g.name}
                      </Typography>
                    </Box>
                    <Typography variant="caption" fontWeight={800}>
                      {g.value.toLocaleString()} ({pct}%)
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <GlassCard sx={{ height: '100%' }}>
            <SectionTitle title={tt.ageGroups} subtitle={tt.ageGroupsSub} />
            <Box sx={{ height: 260, minWidth: { xs: 280, sm: 350, md: 400 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageGroupData} barCategoryGap="30%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <ReTooltip {...CustomTooltipStyle} />
                  <Bar
                    dataKey="value"
                    name={tt.patientsCount}
                    radius={[6, 6, 0, 0]}
                    barSize={28}
                  >
                    {ageGroupData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill || COLORS.primary} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <GlassCard sx={{ height: '100%' }}>
            <SectionTitle
              title={tt.somatotypeDistribution}
              subtitle={tt.somatotypeDistributionSub}
            />
            <Box sx={{ height: 260, minWidth: { xs: 280, sm: 350, md: 400 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={somatoData}
                  barCategoryGap="15%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={90}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <ReTooltip {...CustomTooltipStyle} />
                  <Bar
                    dataKey="value"
                    name={tt.count}
                    fill={COLORS.secondary}
                    radius={[0, 6, 6, 0]}
                    barSize={14}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>

        {/* ROW 3: Region + BMI status */}
        {regionData.length > 0 && (
          <Grid size={{ xs: 12, md: 7 }}>
            <GlassCard>
              <SectionTitle title={tt.topRegions} subtitle={tt.topRegionsSub} />
              <Box sx={{ height: 280, minWidth: 500 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={regionData}
                    layout="vertical"
                    barCategoryGap="20%"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                    />
                    <YAxis
                      dataKey="regionLabel"
                      type="category"
                      width={110}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                    />
                    <ReTooltip {...CustomTooltipStyle} />
                    <Bar
                      dataKey="count"
                      name={tt.analyses}
                      fill={COLORS.teal}
                      radius={[0, 6, 6, 0]}
                      barSize={12}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: regionData.length > 0 ? 5 : 12 }}>
          <GlassCard sx={{ height: '100%' }}>
            <SectionTitle
              title={tt.bmiStatusDistribution}
              subtitle={tt.bmiStatusDistributionSub}
            />
            {bmiCategories.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                py={4}
                textAlign="center"
              >
                {tt.noData}
              </Typography>
            ) : (
              <Stack spacing={2} mt={1}>
                {bmiCategories.map((cat) => (
                  <Box key={cat.name}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color="text.primary"
                        fontSize="0.85rem"
                      >
                        {cat.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ color: cat.color }}
                      >
                        {cat.pct}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={cat.pct}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: `${cat.color}15`,
                        '& .MuiLinearProgress-bar': {
                          bgcolor: cat.color,
                          borderRadius: 5,
                        },
                      }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={500}
                    >
                      {cat.value.toLocaleString()} {tt.patient}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </GlassCard>
        </Grid>

        {/* ROW 4: Radar + Admin piechart */}
        {radarData.some((d) => parseFloat(d.value) > 0) && (
          <Grid size={{ xs: 12, md: 6 }}>
            <GlassCard>
              <SectionTitle title={tt.avgRadar} subtitle={tt.avgRadarSub} />
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis
                      dataKey="metric"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 7]}
                      tick={{ fill: '#64748b', fontSize: 10 }}
                    />
                    <Radar
                      name={tt.average}
                      dataKey="value"
                      stroke={COLORS.primary}
                      fill={COLORS.primary}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <ReTooltip {...CustomTooltipStyle} />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Grid>
        )}
        {adminRolePie.length > 0 && (
          <Grid size={{ xs: 12, md: 6 }}>
            <GlassCard>
              <SectionTitle
                title={tt.adminsDistribution}
                subtitle={tt.adminsDistributionSub}
              />
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={adminRolePie}
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {adminRolePie.map((_, i) => (
                        <Cell
                          key={i}
                          fill={[COLORS.error, COLORS.primary][i % 2]}
                          stroke="none"
                        />
                      ))}
                    </Pie>
                    <ReTooltip {...CustomTooltipStyle} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Grid>
        )}
      </Grid>

      {/* Summary Footer */}
      <Box mt={4} py={2} textAlign="center">
        <Typography variant="caption" color="text.secondary">
          {tt.lastUpdate}: {new Date().toLocaleString(locale)} • MorphoCheck
          SuperAdmin Analytics Pro
        </Typography>
      </Box>
    </Box>
  );
}

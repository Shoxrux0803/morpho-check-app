import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import maplibregl from 'maplibre-gl';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  IconButton,
  LinearProgress,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  BarChart,
  CameraAlt,
  ChatBubbleOutline,
  Close,
  Download,
  Groups,
  HealthAndSafety,
  Insights,
  LocationOn,
  MyLocation,
  Public,
  SatelliteAlt,
  TableChart,
  Speed,
  TrendingUp,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import SearchIcon from '@mui/icons-material/Search';
import { AdminApi, ResearchApi } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLocalizedLocationLabel } from '../../utils/locationI18n';

const BOUNDARY_BASE = '/maps/admin-boundaries';
const EMPTY_COLLECTION = { type: 'FeatureCollection', features: [] };
const PIN_SOURCE = 'regional-pins-source';
const MAP_LABEL_SOURCE = 'regional-map-labels-source';
const MAP_LABEL_LAYER = 'regional-map-labels-layer';
const GOOGLE_SATELLITE_SOURCE = 'google-satellite-source';
const GOOGLE_SATELLITE_LAYER = 'google-satellite-layer';
const SATELLITE_MAX_ZOOM = 21;
const SVG_WIDTH = 1000;
const SVG_HEIGHT = 760;
const MAP_CAMERA_EASING = (time) =>
  time < 0.5 ? 4 * time * time * time : 1 - Math.pow(-2 * time + 2, 3) / 2;

const PIN_COLORS = {
  admin: '#2563eb',
  researcher: '#7c3aed',
  field_assistant: '#f59e0b',
};

const normalizeMapSearch = (value = '') =>
  String(value)
    .toLocaleLowerCase()
    .replace(/[ʻʼ’`']/g, '')
    .replace(/[^a-zа-яё0-9\s-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const MAP_I18N = {
  uz: {
    country: "O'zbekiston",
    title: 'Hududiy tahlil xaritasi',
    subtitle:
      'Viloyat, tuman va mahalla kesimida analizlar, adminlar va izlanuvchilar holatini kuzating.',
    region: 'Viloyat',
    district: 'Tuman',
    mahalla: 'Mahalla',
    analyticsLoading: 'Analitika yuklanmoqda',
    analyses: 'Analiz',
    admin: 'Admin',
    admins: 'Admin',
    researcher: 'Izlanuvchi',
    fieldAssistant: 'Dala yordamchisi',
    highRisk: 'Yuqori risk',
    watchRisk: 'Kuzatuv kerak',
    lowRisk: 'Past risk',
    dominantClinicalGroup: 'Dominant klinik guruh',
    highZSignal: 'Z-score +2 dan yuqori yozuvlar',
    operationalReadiness: 'Qamrov va faol rollar asosida',
    nextLayer: 'Keyingi qatlam',
    area: 'Maydon',
    riskSignal: 'Klinik risk signali',
    scientificProfile: 'Ilmiy klinik profil',
    clinicalIndexProfile: 'Klinik indeks profili',
    clinicalIndexSub:
      "Normalizatsiya qilingan BMI, Z-score va risk ko'rsatkichlari",
    bmiDistribution: 'BMI taqsimoti',
    regionSample: (count) => `Hudud bo'yicha n=${count}`,
    zBands: 'BMI Z-score bandlari',
    zBandsSub: "WHO LMS bo'yicha klinik guruhlash",
    analyticalIndicators: 'Tahliliy indikatorlar',
    activityStructure: 'Faoliyat tarkibi',
    operationalAnalysis: 'Operatsion tahlil',
    contact: "Bog'lanish",
    satelliteOn: 'Google satellite kartani yoqish',
    satelliteOff: 'Oddiy hududiy xaritaga qaytish',
    layerLoading: 'Hududiy qatlam yuklanmoqda',
    patientExists: 'Patient bor',
    patientDataTooltip: (name, count) =>
      count > 0
        ? `${name}: ${count} ta patient ma'lumoti bor`
        : `${name}: patient ma'lumoti yo'q`,
    selectedBack: 'Tanlangan hududga qaytish',
    coverageIndex: 'Qamrov indeksi',
    contactPoints: 'Aloqa nuqtalari',
    riskRecords: 'Risk yozuvlari',
    lowerLayer: 'Quyi qatlam',
    analysesShare: 'Analiz ulushi',
    adminActivity: 'Admin faolligi',
    researcherBase: 'Izlanuvchi bazasi',
    regionalDensity: 'Hududiy zichlik',
    role: 'Kimligi',
    userId: 'User ID',
    roleField: 'Rol',
    email: 'Email',
    phone: 'Telefon',
    location: 'Hudud',
    address: 'Aniq manzil',
    coordinate: 'Koordinata',
    status: 'Holat',
    registered: "Ro'yxatdan o'tgan",
    lastActivity: 'Oxirgi faollik',
    todayEntries: 'Bugungi yozuvlar',
    monthEntries: 'Oylik yozuvlar',
    totalEntries: 'Jami yozuvlar',
    avgTime: "O'rtacha vaqt",
    mostActiveTime: 'Eng faol vaqt',
    regionMatch: 'Region mosligi',
    matched: 'Mos tushdi',
    fallback: 'Fallback nuqta',
    notSpecified: 'Kiritilmagan',
    regionNotSpecified: 'Hudud kiritilmagan',
    sameAreaPin: 'Shu hududdagi pin',
    chatError: 'Chat faqat admin yoki izlanuvchi user pinlari uchun ochiladi',
    chatOpened: (name) => `${name} bilan chat ochildi`,
    chatPrompt: 'Chat oynasi orqali admin yoki izlanuvchiga yozishingiz mumkin',
    underweight: 'Kam vazn',
    normal: 'Norma',
    overweight: 'Ortiqcha',
    obese: 'Semizlik',
    coverage: 'Qamrov',
    metricLayer: 'Rang qatlami',
    timeFilter: 'Vaqt filtri',
    metricDefault: 'Standart',
    metricRisk: 'Risk',
    metricCoverage: 'Qamrov',
    metricAnalyses: 'Analiz soni',
    metricBmi: "O'rtacha BMI",
    metricZRisk: 'Z-score risk',
    metricActivity: 'Admin/izlanuvchi',
    timeAll: 'Barchasi',
    timeToday: 'Bugun',
    time7d: '7 kun',
    time30d: '30 kun',
    timeYear: 'Yil',
    timeCustom: 'Maxsus',
    dateFrom: 'Boshlanish',
    dateTo: 'Tugash',
    trend: 'Trend',
    trendUp: 'Risk oshgan',
    trendDown: 'Risk pasaygan',
    trendFlat: 'Barqaror',
    qualityScore: 'Monitoring sifati',
    topProblemAreas: 'Top muammo hududlar',
    highestRisk: 'Eng yuqori risk',
    lowestCoverage: 'Qamrov past',
    mostPatients: "Ko'p patient",
    emptyMahallas: "Bo'sh mahallalar",
    riskReasons: 'Risk sabablari',
    noPatientData: "Patient ma'lumoti yo'q",
    latestAnalysis: 'Oxirgi analiz',
    avgBmi: "O'rtacha BMI",
    zRisk: 'Z-risk',
    patientCount: 'Patient',
    exportReport: 'Hisobot eksport',
    exportPdf: 'PDF',
    exportXls: 'XLS',
    exportSnapshot: 'Snapshot',
    exportSuccess: 'Hisobot tayyor',
    exportError: 'Eksport xatosi',
    snapshotSuccess: 'Snapshot tayyor',
    reportSection: "Bo'lim",
    reportArea: 'Hudud',
    reportRisk: 'Risk',
    reportQuality: 'Sifat',
  },
  ru: {
    country: 'Узбекистан',
    title: 'Карта регионального анализа',
    subtitle:
      'Отслеживайте анализы, админов и исследователей по областям, районам и махаллям.',
    region: 'Область',
    district: 'Район',
    mahalla: 'Махалля',
    analyticsLoading: 'Аналитика загружается',
    analyses: 'Анализы',
    admin: 'Админ',
    admins: 'Админ',
    researcher: 'Исследователь',
    nextLayer: 'Следующий слой',
    area: 'Площадь',
    riskSignal: 'Клинический сигнал риска',
    scientificProfile: 'Научно-клинический профиль',
    clinicalIndexProfile: 'Профиль клинических индексов',
    clinicalIndexSub: 'Нормализованные показатели BMI, Z-score и риска',
    bmiDistribution: 'Распределение BMI',
    regionSample: (count) => `По региону n=${count}`,
    zBands: 'Диапазоны BMI Z-score',
    zBandsSub: 'Клиническая группировка по WHO LMS',
    analyticalIndicators: 'Аналитические индикаторы',
    activityStructure: 'Структура активности',
    operationalAnalysis: 'Операционный анализ',
    contact: 'Связаться',
    satelliteOn: 'Включить Google satellite',
    satelliteOff: 'Вернуться к обычной карте',
    layerLoading: 'Региональный слой загружается',
    patientExists: 'Есть пациент',
    selectedBack: 'Вернуться к выбранному региону',
    coverageIndex: 'Индекс охвата',
    contactPoints: 'Точки контакта',
    riskRecords: 'Записи риска',
    lowerLayer: 'Нижний слой',
    analysesShare: 'Доля анализов',
    adminActivity: 'Активность админов',
    researcherBase: 'База исследователей',
    regionalDensity: 'Региональная плотность',
    role: 'Кто',
    userId: 'User ID',
    roleField: 'Роль',
    email: 'Email',
    phone: 'Телефон',
    location: 'Регион',
    address: 'Точный адрес',
    coordinate: 'Координата',
    status: 'Статус',
    registered: 'Дата регистрации',
    lastActivity: 'Последняя активность',
    todayEntries: 'Записи сегодня',
    monthEntries: 'Записи за месяц',
    totalEntries: 'Всего записей',
    avgTime: 'Среднее время',
    mostActiveTime: 'Самое активное время',
    regionMatch: 'Совпадение региона',
    matched: 'Совпало',
    fallback: 'Fallback-точка',
    notSpecified: 'Не указано',
    regionNotSpecified: 'Регион не указан',
    sameAreaPin: 'Пин в этой области',
    chatError: 'Чат открывается только для пинов админа или исследователя',
    chatOpened: (name) => `Чат с ${name} открыт`,
    chatPrompt: 'Через окно чата можно написать админу или исследователю',
    underweight: 'Недостаточный вес',
    normal: 'Норма',
    overweight: 'Избыточный вес',
    obese: 'Ожирение',
    coverage: 'Охват',
  },
  en: {
    country: 'Uzbekistan',
    title: 'Regional analytics map',
    subtitle:
      'Track analyses, admins, and researchers by region, district, and mahalla.',
    region: 'Region',
    district: 'District',
    mahalla: 'Mahalla',
    analyticsLoading: 'Loading analytics',
    analyses: 'Analysis',
    admin: 'Admin',
    admins: 'Admin',
    researcher: 'Researcher',
    fieldAssistant: 'Field assistant',
    nextLayer: 'Next layer',
    area: 'Area',
    riskSignal: 'Clinical risk signal',
    scientificProfile: 'Scientific clinical profile',
    clinicalIndexProfile: 'Clinical index profile',
    clinicalIndexSub: 'Normalized BMI, Z-score, and risk indicators',
    bmiDistribution: 'BMI distribution',
    regionSample: (count) => `Regional sample n=${count}`,
    zBands: 'BMI Z-score bands',
    zBandsSub: 'Clinical grouping by WHO LMS',
    analyticalIndicators: 'Analytical indicators',
    activityStructure: 'Activity structure',
    operationalAnalysis: 'Operational analysis',
    contact: 'Contact',
    satelliteOn: 'Turn on Google satellite map',
    satelliteOff: 'Return to the standard regional map',
    layerLoading: 'Loading regional layer',
    patientExists: 'Patient exists',
    patientDataTooltip: (name, count) =>
      count > 0
        ? `${name}: ${count} patient record${count === 1 ? '' : 's'} available`
        : `${name}: no patient records`,
    selectedBack: 'Return to selected region',
    coverageIndex: 'Coverage index',
    contactPoints: 'Contact points',
    riskRecords: 'Risk records',
    lowerLayer: 'Lower layer',
    analysesShare: 'Analysis share',
    adminActivity: 'Admin activity',
    researcherBase: 'Researcher base',
    regionalDensity: 'Regional density',
    role: 'Identity',
    userId: 'User ID',
    roleField: 'Role',
    email: 'Email',
    phone: 'Phone',
    location: 'Location',
    address: 'Exact address',
    coordinate: 'Coordinate',
    status: 'Status',
    registered: 'Registered',
    lastActivity: 'Last activity',
    todayEntries: "Today's entries",
    monthEntries: 'Monthly entries',
    totalEntries: 'Total entries',
    avgTime: 'Average time',
    mostActiveTime: 'Most active time',
    regionMatch: 'Region match',
    matched: 'Matched',
    fallback: 'Fallback point',
    notSpecified: 'Not specified',
    regionNotSpecified: 'Region not specified',
    sameAreaPin: 'Pin in this area',
    chatError: 'Chat opens only for admin or researcher user pins',
    chatOpened: (name) => `Chat with ${name} opened`,
    chatPrompt:
      'You can message an admin or researcher through the chat window',
    underweight: 'Underweight',
    normal: 'Normal',
    overweight: 'Overweight',
    obese: 'Obesity',
    coverage: 'Coverage',
  },
  kz: {
    country: 'Өзбекстан',
    title: 'Аймақтық талдау картасы',
    subtitle:
      'Облыс, аудан және махалла бойынша талдаулар, админдер және зерттеушілер жағдайын бақылаңыз.',
    region: 'Облыс',
    district: 'Аудан',
    mahalla: 'Махалла',
    analyticsLoading: 'Аналитика жүктелуде',
    analyses: 'Талдау',
    admin: 'Админ',
    admins: 'Админ',
    researcher: 'Зерттеуші',
    nextLayer: 'Келесі қабат',
    area: 'Аудан',
    riskSignal: 'Клиникалық қауіп сигналы',
    scientificProfile: 'Ғылыми клиникалық профиль',
    clinicalIndexProfile: 'Клиникалық индекс профилі',
    clinicalIndexSub: 'Нормаланған BMI, Z-score және қауіп көрсеткіштері',
    bmiDistribution: 'BMI таралуы',
    regionSample: (count) => `Аймақ бойынша n=${count}`,
    zBands: 'BMI Z-score белдеулері',
    zBandsSub: 'WHO LMS бойынша клиникалық топтастыру',
    analyticalIndicators: 'Талдамалық индикаторлар',
    activityStructure: 'Белсенділік құрылымы',
    operationalAnalysis: 'Операциялық талдау',
    contact: 'Байланысу',
    satelliteOn: 'Google satellite картасын қосу',
    satelliteOff: 'Қалыпты аймақтық картаға қайту',
    layerLoading: 'Аймақтық қабат жүктелуде',
    patientExists: 'Пациент бар',
    selectedBack: 'Таңдалған аймаққа қайту',
    coverageIndex: 'Қамту индексі',
    contactPoints: 'Байланыс нүктелері',
    riskRecords: 'Қауіп жазбалары',
    lowerLayer: 'Төменгі қабат',
    analysesShare: 'Талдау үлесі',
    adminActivity: 'Админ белсенділігі',
    researcherBase: 'Зерттеуші базасы',
    regionalDensity: 'Аймақтық тығыздық',
    role: 'Кім екені',
    userId: 'User ID',
    roleField: 'Рөл',
    email: 'Email',
    phone: 'Телефон',
    location: 'Аймақ',
    address: 'Нақты мекенжай',
    coordinate: 'Координата',
    status: 'Күйі',
    registered: 'Тіркелген',
    lastActivity: 'Соңғы белсенділік',
    todayEntries: 'Бүгінгі жазбалар',
    monthEntries: 'Айлық жазбалар',
    totalEntries: 'Жалпы жазбалар',
    avgTime: 'Орташа уақыт',
    mostActiveTime: 'Ең белсенді уақыт',
    regionMatch: 'Аймақ сәйкестігі',
    matched: 'Сәйкес келді',
    fallback: 'Fallback нүкте',
    notSpecified: 'Көрсетілмеген',
    regionNotSpecified: 'Аймақ көрсетілмеген',
    sameAreaPin: 'Осы аймақтағы pin',
    chatError: 'Chat тек админ немесе зерттеуші user pinдері үшін ашылады',
    chatOpened: (name) => `${name} арқылы chat ашылды`,
    chatPrompt: 'Chat терезесі арқылы админге немесе зерттеушіге жаза аласыз',
    underweight: 'Салмақ жетіспеушілігі',
    normal: 'Қалыпты',
    overweight: 'Артық салмақ',
    obese: 'Семіздік',
    coverage: 'Қамту',
  },
};

const PATIENT_BOUNDARY_COLOR = '#16a34a';
const PATIENT_BOUNDARY_HOVER = '#22c55e';

const LEVEL_META = {
  1: {
    source: 'admin-level-1',
    fill: 'admin-level-1-fill',
    line: 'admin-level-1-line',
    color: '#0f766e',
    selected: '#2563eb',
    hover: '#14b8a6',
    label: 'Viloyat',
    nextLabel: 'Tumanlar',
    zoom: 6.7,
  },
  2: {
    source: 'admin-level-2',
    fill: 'admin-level-2-fill',
    line: 'admin-level-2-line',
    color: '#f59e0b',
    selected: '#dc2626',
    hover: '#f97316',
    label: 'Tuman',
    nextLabel: 'Mahallalar',
    zoom: 9.1,
  },
  3: {
    source: 'admin-level-3',
    fill: 'admin-level-3-fill',
    line: 'admin-level-3-line',
    color: '#7c3aed',
    selected: '#0f766e',
    hover: '#8b5cf6',
    label: 'Mahalla',
    nextLabel: '',
    zoom: 12.8,
  },
};

const normalizeText = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/[ʻ‘’`]/g, "'")
    .replace(/вЂ|вЂ™|К»/g, "'")
    .replace(/[‘’`´ʻʼ]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const canonicalDistrictName = (value = '') =>
  value.replace(/\bsergeli\b/g, 'sirgali').replace(/\bsirgali\b/g, 'sirgali');

const displayLocationName = (value = '') => {
  const text = String(value || '');
  const normalized = baseName(text);
  if (normalized === 'sirgali') return 'Sergeli tumani';
  return text;
};

const looksMojibake = (value = '') =>
  /(Р[ђ-џЃ‚]|\u0420[\u0452-\u045f\u0403\u201a]|вЂ|РІР‚|К»)/.test(
    String(value || '')
  );

const latinToCyrillicUz = (value = '') => {
  const text = displayLocationName(value)
    .replace(/G['‘’`]/g, 'Ғ')
    .replace(/g['‘’`]/g, 'ғ')
    .replace(/O['‘’`]/g, 'Ў')
    .replace(/o['‘’`]/g, 'ў')
    .replace(/Ch/g, 'Ч')
    .replace(/ch/g, 'ч')
    .replace(/Sh/g, 'Ш')
    .replace(/sh/g, 'ш');
  const map = {
    A: 'А',
    B: 'Б',
    D: 'Д',
    E: 'Э',
    F: 'Ф',
    G: 'Г',
    H: 'Ҳ',
    I: 'И',
    J: 'Ж',
    K: 'К',
    L: 'Л',
    M: 'М',
    N: 'Н',
    O: 'О',
    P: 'П',
    Q: 'Қ',
    R: 'Р',
    S: 'С',
    T: 'Т',
    U: 'У',
    V: 'В',
    X: 'Х',
    Y: 'Й',
    Z: 'З',
    a: 'а',
    b: 'б',
    d: 'д',
    e: 'е',
    f: 'ф',
    g: 'г',
    h: 'ҳ',
    i: 'и',
    j: 'ж',
    k: 'к',
    l: 'л',
    m: 'м',
    n: 'н',
    o: 'о',
    p: 'п',
    q: 'қ',
    r: 'р',
    s: 'с',
    t: 'т',
    u: 'у',
    v: 'в',
    x: 'х',
    y: 'й',
    z: 'з',
  };
  return text.replace(/[A-Za-z]/g, (letter) => map[letter] || letter);
};

const transliterateUzToAscii = (value = '') =>
  displayLocationName(value)
    .replace(/[‘’`]/g, "'")
    .replace(/g'/gi, (match) => (match[0] === 'G' ? 'Gh' : 'gh'))
    .replace(/o'/gi, (match) => (match[0] === 'O' ? 'O' : 'o'))
    .replace(/ʻ|ʼ/g, "'")
    .replace(/Q/g, 'K')
    .replace(/q/g, 'k')
    .replace(/X/g, 'Kh')
    .replace(/x/g, 'kh');

const localizedSuffix = (base, level, lang) => {
  const clean = baseName(base);
  const title = displayLocationName(base)
    .replace(/\s+(respublikasi|viloyati|tumani|shahri|mahallasi)$/i, '')
    .trim();
  const ascii = transliterateUzToAscii(title);

  if (lang === 'en') {
    if (clean === 'toshkent shahri' || /shahri$/i.test(base))
      return `${ascii} city`;
    if (/respublikasi$/i.test(base)) return `Republic of ${ascii}`;
    if (level === 1) return `${ascii} region`;
    if (level === 2) return `${ascii} district`;
    return title;
  }

  if (lang === 'tm') {
    if (clean === 'toshkent shahri' || /shahri$/i.test(base))
      return `${ascii} saheri`;
    if (/respublikasi$/i.test(base)) return `${ascii} Respublikasy`;
    if (level === 1) return `${ascii} welayaty`;
    if (level === 2) return `${ascii} etraby`;
    return title;
  }

  if (lang === 'tr') {
    if (clean === 'toshkent shahri' || /shahri$/i.test(base))
      return `${ascii} sehri`;
    if (/respublikasi$/i.test(base)) return `${ascii} Cumhuriyeti`;
    if (level === 1) return `${ascii} bolgesi`;
    if (level === 2) return `${ascii} ilcesi`;
    return title;
  }

  if (lang === 'ru') {
    const cyrillic = latinToCyrillicUz(title);
    if (clean === 'toshkent shahri' || /shahri$/i.test(base))
      return `город ${cyrillic}`;
    if (/respublikasi$/i.test(base)) return `Республика ${cyrillic}`;
    if (level === 1) return `${cyrillic}ская область`;
    if (level === 2) return `${cyrillic}ский район`;
    return cyrillic;
  }

  if (lang === 'ky') {
    const cyrillic = latinToCyrillicUz(title);
    if (clean === 'toshkent shahri' || /shahri$/i.test(base))
      return `${cyrillic} шаары`;
    if (/respublikasi$/i.test(base)) return `${cyrillic} Республикасы`;
    if (level === 1) return `${cyrillic} облусу`;
    if (level === 2) return `${cyrillic} району`;
    return cyrillic;
  }

  if (lang === 'kz') {
    const cyrillic = latinToCyrillicUz(title);
    if (clean === 'toshkent shahri' || /shahri$/i.test(base))
      return `${cyrillic} қаласы`;
    if (/respublikasi$/i.test(base)) return `${cyrillic} Республикасы`;
    if (level === 1) return `${cyrillic} облысы`;
    if (level === 2) return `${cyrillic} ауданы`;
    return cyrillic;
  }

  return displayLocationName(base);
};

const baseName = (value = '') =>
  canonicalDistrictName(
    normalizeText(value)
      .replace(/[']/g, '')
      .replace(' respublikasi', '')
      .replace(' viloyati', '')
      .replace(' tumani', '')
      .replace(' shahri', '')
      .replace(' mahallasi', '')
      .replace(' region', '')
      .replace(' province', '')
      .trim()
  );

const canonicalRegionName = (value = '') => {
  const raw = normalizeText(value);
  if (raw.includes('toshkent')) {
    if (raw.includes('shah') || raw.includes('city') || raw.includes('город')) {
      return 'toshkent shahri';
    }
    if (
      raw.includes('viloyat') ||
      raw.includes('region') ||
      raw.includes('област')
    ) {
      return 'toshkent viloyati';
    }
    return 'toshkent shahri';
  }
  const normalized = baseName(value);
  const aliases = {
    fargona: "farg'ona",
    qoraqalpogiston: "qoraqalpog'iston",
    "qoraqalpog'iston": "qoraqalpog'iston",
  };
  return aliases[normalized] || normalized;
};

const locationTokens = (value = '') =>
  baseName(value)
    .split(' ')
    .filter((part) => part && part.length > 1);

const searchableLocation = (value = '') =>
  baseName(value)
    .replace(/'/g, '')
    .replace(/[^a-zа-яё0-9]+/gi, ' ')
    .replace(/\b(tuman|tumani|shahar|shahri|mahalla|mahallasi|mfy|ofy)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const locationMatches = (left = '', right = '') => {
  const a = searchableLocation(left);
  const b = searchableLocation(right);
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;
  const aTokens = a.split(' ').filter((part) => part.length > 1);
  const bTokens = b.split(' ').filter((part) => part.length > 1);
  return (
    aTokens.length > 0 && aTokens.every((token) => bTokens.includes(token))
  );
};

const buildLocationSearchText = (item = {}) =>
  [
    item.mahalla,
    item.district,
    item.address,
    item.settlement,
    item.school_name,
    item.birth_place,
    item.region,
    item.name,
    item.full_name,
  ]
    .filter(Boolean)
    .join(' ');

const normalizeLocationItem = (item = {}) => {
  const text = buildLocationSearchText(item);
  return {
    ...item,
    __locationText: text,
    district: item.district || text,
    mahalla: item.mahalla || text,
    address: item.address || item.settlement || item.school_name || text,
  };
};

const getLocationFieldCandidates = (item = {}) =>
  [
    { value: item.mahalla, weight: 180 },
    { value: item.district, weight: 170 },
    { value: item.address, weight: 150 },
    { value: item.settlement, weight: 130 },
    { value: item.school_name, weight: 110 },
    { value: item.birth_place, weight: 90 },
    { value: item.region, weight: 70 },
  ].filter((entry) => entry.value);

const scoreLocationText = (boundaryName = '', rawText = '') => {
  const boundary = searchableLocation(boundaryName);
  const text = searchableLocation(rawText);
  if (!boundary || !text) return 0;
  if (boundary === text) return 1200;
  const paddedText = ` ${text} `;
  const paddedBoundary = ` ${boundary} `;
  if (paddedText.includes(paddedBoundary)) return 1000 + boundary.length;
  const boundaryTokens = locationTokens(boundary);
  if (
    boundaryTokens.length > 1 &&
    boundaryTokens.every((token) => paddedText.includes(` ${token} `))
  ) {
    return 820 + boundaryTokens.length * 15;
  }
  if (text.includes(boundary)) return 760 + Math.min(boundary.length, 120);
  if (boundary.includes(text) && text.length >= 5) return 520 + text.length;
  return 0;
};

const findBestBoundaryMatch = (features = [], item = {}, minScore = 0) => {
  const fields = getLocationFieldCandidates(item);
  let bestFeature = null;
  let bestScore = minScore;

  features.forEach((feature) => {
    const name = featureName(feature);
    let featureScore = 0;
    fields.forEach(({ value, weight }) => {
      const score = scoreLocationText(name, value);
      if (!score) return;
      featureScore = Math.max(featureScore, score + weight);
    });
    if (featureScore > bestScore) {
      bestScore = featureScore;
      bestFeature = feature;
    }
  });

  return bestFeature;
};

const featureName = (item) =>
  displayLocationName(
    item?.name_uz ||
      item?.display_name ||
      item?.name_en ||
      item?.name_ru ||
      'Unknown region'
  );

const localizedFeatureName = (item, lang = 'uz') => {
  const props = item?.properties || item || {};
  const level = Number(props.admin_leve || props.admin_level || 0);
  const fallback = featureName(props);
  const direct =
    lang === 'en'
      ? props.name_en
      : lang === 'tr'
        ? props.name_tr
        : lang === 'ru'
          ? props.name_ru
          : lang === 'ky'
            ? props.name_ky || props.name_kg
            : lang === 'kz'
              ? props.name_kz || props.name_kk
              : lang === 'tg'
                ? props.name_tg || props.name_tj
                : props.name_uz || props.display_name;

  if (direct && !looksMojibake(direct)) return displayLocationName(direct);
  return localizedSuffix(fallback, level, lang);
};

const recordMatchesBoundary = (
  record,
  level,
  props,
  parentRegion,
  parentDistrict
) => {
  // 1. Check Region Match
  if (parentRegion) {
    const regionKey = canonicalRegionName(featureName(parentRegion));
    const recordRegion = canonicalRegionName(
      record.region || record.settlement || record.birth_place
    );
    if (regionKey !== recordRegion) return false;
  } else if (level === 1) {
    const regionKey = canonicalRegionName(featureName(props));
    const recordRegion = canonicalRegionName(
      record.region || record.settlement || record.birth_place
    );
    if (regionKey !== recordRegion) return false;
  }

  // 2. Check District Match
  if (level === 2) {
    const boundaryDistrict = baseName(featureName(props));
    const recordDistrict = baseName(record.district);
    if (boundaryDistrict !== recordDistrict) return false;
  } else if (level === 3 && parentDistrict) {
    const parentDistrictKey = baseName(featureName(parentDistrict));
    const recordDistrict = baseName(record.district);
    if (parentDistrictKey !== recordDistrict) return false;
  }

  // 3. Check Mahalla Match
  if (level === 3) {
    const boundaryMahalla = baseName(featureName(props));
    const recordMahalla = baseName(record.mahalla || record.settlement);
    if (
      boundaryMahalla !== recordMahalla &&
      !recordMahalla.includes(boundaryMahalla) &&
      !boundaryMahalla.includes(recordMahalla)
    ) {
      return false;
    }
  }

  return true;
};

const getBoundaryContext = (level, props, selectedPath, boundaryIndex) => {
  const parentDistrict =
    level === 3
      ? (boundaryIndex?.levels?.['2'] || []).find(
          (item) => String(item.id) === String(props.parent_id)
        )
      : null;
  const parentRegion =
    level === 1
      ? props
      : level === 2
        ? selectedPath.region ||
          (boundaryIndex?.levels?.['1'] || []).find(
            (item) => String(item.id) === String(props.parent_id)
          )
        : selectedPath.region ||
          (boundaryIndex?.levels?.['1'] || []).find(
            (item) => String(item.id) === String(parentDistrict?.parent_id)
          );
  return { parentRegion, parentDistrict };
};

const parseMaybeJson = (value) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

MAP_I18N.ky = {
  ...MAP_I18N.uz,
  country: 'Өзбекстан',
  title: 'Аймактык талдоо картасы',
  subtitle:
    'Облус, район жана махалла боюнча талдоолордун, админдердин жана изилдөөчүлөрдүн абалын көзөмөлдөңүз.',
  region: 'Облус',
  district: 'Район',
  mahalla: 'Махалла',
  analyticsLoading: 'Аналитика жүктөлүүдө',
  analyses: 'Талдоо',
  admin: 'Админ',
  admins: 'Админдер',
  researcher: 'Изилдөөчү',
  fieldAssistant: 'Талаа жардамчысы',
  nextLayer: 'Кийинки катмар',
  area: 'Аянт',
  riskSignal: 'Клиникалык коркунуч сигналы',
  scientificProfile: 'Илимий-клиникалык профиль',
  clinicalIndexProfile: 'Клиникалык индекстердин профили',
  clinicalIndexSub:
    'Нормалдаштырылган BMI, Z-score жана коркунуч көрсөткүчтөрү',
  bmiDistribution: 'BMI бөлүштүрүлүшү',
  regionSample: (count) => `Аймак боюнча n=${count}`,
  zBands: 'BMI Z-score тилкелери',
  zBandsSub: 'WHO LMS боюнча клиникалык топтоо',
  analyticalIndicators: 'Аналитикалык көрсөткүчтөр',
  activityStructure: 'Ишмердүүлүктүн түзүмү',
  operationalAnalysis: 'Операциялык талдоо',
  contact: 'Байланышуу',
  satelliteOn: 'Google спутник картасын күйгүзүү',
  satelliteOff: 'Кадимки аймактык картага кайтуу',
  layerLoading: 'Аймактык катмар жүктөлүүдө',
  patientExists: 'Бейтап бар',
  patientDataTooltip: (name, count) =>
    count > 0
      ? `${name}: ${count} бейтаптын маалыматы бар`
      : `${name}: бейтаптын маалыматы жок`,
  selectedBack: 'Тандалган аймакка кайтуу',
  coverageIndex: 'Камтуу индекси',
  contactPoints: 'Байланыш чекиттери',
  riskRecords: 'Коркунучтуу жазуулар',
  lowerLayer: 'Төмөнкү катмар',
  analysesShare: 'Талдоолордун үлүшү',
  adminActivity: 'Админдердин активдүүлүгү',
  researcherBase: 'Изилдөөчүлөрдүн базасы',
  regionalDensity: 'Аймактык тыгыздык',
  role: 'Ким',
  userId: 'Колдонуучу ID',
  roleField: 'Ролу',
  email: 'Email',
  phone: 'Телефон',
  location: 'Аймак',
  address: 'Так дарек',
  coordinate: 'Координата',
  status: 'Абалы',
  registered: 'Катталган',
  lastActivity: 'Акыркы активдүүлүк',
  todayEntries: 'Бүгүнкү жазуулар',
  monthEntries: 'Айлык жазуулар',
  totalEntries: 'Жалпы жазуулар',
  avgTime: 'Орточо убакыт',
  mostActiveTime: 'Эң активдүү убакыт',
  regionMatch: 'Аймактын дал келиши',
  matched: 'Дал келди',
  fallback: 'Резервдик чекит',
  notSpecified: 'Көрсөтүлгөн эмес',
  regionNotSpecified: 'Аймак көрсөтүлгөн эмес',
  sameAreaPin: 'Ушул аймактагы белги',
  chatError: 'Чат админдин же изилдөөчүнүн белгиси үчүн гана ачылат',
  chatOpened: (name) => `${name} менен чат ачылды`,
  chatPrompt: 'Чат терезеси аркылуу админге же изилдөөчүгө жаза аласыз',
  underweight: 'Салмак жетишсиздиги',
  normal: 'Норма',
  overweight: 'Ашыкча салмак',
  obese: 'Семирүү',
  coverage: 'Камтуу',
};
MAP_I18N.tg = {
  ...MAP_I18N.uz,
  country: 'Ӯзбекистон',
  title: 'Харитаи таҳлили ҳудудӣ',
  subtitle:
    'Ҳолати таҳлилҳо, админҳо ва таҳқиқгаронро аз рӯи вилоят, ноҳия ва маҳалла пайгирӣ кунед.',
  region: 'Вилоят',
  district: 'Ноҳия',
  mahalla: 'Маҳалла',
  analyticsLoading: 'Таҳлил бор шуда истодааст',
  analyses: 'Таҳлил',
  admin: 'Админ',
  admins: 'Админҳо',
  researcher: 'Таҳқиқгар',
  nextLayer: 'Қабати навбатӣ',
  area: 'Масоҳат',
  riskSignal: 'Сигнали хавфи клиникӣ',
  scientificProfile: 'Профили илмӣ-клиникӣ',
  clinicalIndexProfile: 'Профили индексҳои клиникӣ',
  clinicalIndexSub: 'Нишондиҳандаҳои нормализатсияшудаи BMI, Z-score ва хавф',
  bmiDistribution: 'Тақсимоти BMI',
  regionSample: (count) => `Аз рӯи ҳудуд n=${count}`,
  zBands: 'Бандҳои BMI Z-score',
  zBandsSub: 'Гурӯҳбандии клиникӣ аз рӯи WHO LMS',
  analyticalIndicators: 'Нишондиҳандаҳои таҳлилӣ',
  activityStructure: 'Сохтори фаъолият',
  operationalAnalysis: 'Таҳлили амалиётӣ',
  contact: 'Тамос',
  satelliteOn: 'Фаъол кардани харитаи Google satellite',
  satelliteOff: 'Бозгашт ба харитаи одии ҳудудӣ',
  layerLoading: 'Қабати ҳудудӣ бор шуда истодааст',
  patientExists: 'Бемор мавҷуд',
  selectedBack: 'Бозгашт ба ҳудуди интихобшуда',
  coverageIndex: 'Индекси фарогирӣ',
  contactPoints: 'Нуқтаҳои тамос',
  riskRecords: 'Сабтҳои хавф',
  lowerLayer: 'Қабати поёнӣ',
  analysesShare: 'Ҳиссаи таҳлилҳо',
  adminActivity: 'Фаъолияти админ',
  researcherBase: 'Пойгоҳи таҳқиқгарон',
  regionalDensity: 'Зичии ҳудудӣ',
  role: 'Кӣ будан',
  roleField: 'Нақш',
  phone: 'Телефон',
  location: 'Ҳудуд',
  address: 'Суроғаи дақиқ',
  coordinate: 'Координата',
  status: 'Ҳолат',
  registered: 'Сабт шудааст',
  lastActivity: 'Фаъолияти охирин',
  todayEntries: 'Сабтҳои имрӯза',
  monthEntries: 'Сабтҳои моҳона',
  totalEntries: 'Ҳамаи сабтҳо',
  avgTime: 'Вақти миёна',
  mostActiveTime: 'Вақти фаъолтарин',
  regionMatch: 'Мутобиқати ҳудуд',
  matched: 'Мутобиқ шуд',
  notSpecified: 'Ворид нашудааст',
  regionNotSpecified: 'Ҳудуд ворид нашудааст',
  sameAreaPin: 'Pin дар ҳамин ҳудуд',
  chatError: 'Chat танҳо барои pin-ҳои админ ё таҳқиқгар кушода мешавад',
  chatOpened: (name) => `Chat бо ${name} кушода шуд`,
  chatPrompt: 'Тавассути равзанаи chat метавонед ба админ ё таҳқиқгар нависед',
  underweight: 'Камвазнӣ',
  normal: 'Меъёр',
  overweight: 'Вазни зиёдатӣ',
  obese: 'Фарбеҳӣ',
  coverage: 'Фарогирӣ',
  totalPatients: 'Ҳамаи беморон',
  avgBmi: 'BMI миёна',
  riskCount: 'Сабтҳои хавфнок',
  noData: 'Маълумот нест',
  patients: 'Беморон',
  risk: 'Хавф',
};
MAP_I18N.tm = {
  ...MAP_I18N.uz,
  country: 'Ozbegistan',
  title: 'Sebitleyin analiz kartasy',
  subtitle:
    'Welayat, etrap we mahalla boyunca analizleri, adminleri we gozlegcileri yzarlap gorun.',
  region: 'Welayat',
  district: 'Etrap',
  mahalla: 'Mahalla',
  analyticsLoading: 'Analitika yuklenyar',
  analyses: 'Analiz',
  admin: 'Admin',
  admins: 'Admin',
  researcher: 'Gozlegci',
  nextLayer: 'Indiki gatlak',
  area: 'Meydan',
  riskSignal: 'Kliniki risk signaly',
  scientificProfile: 'Ylmy kliniki profil',
  clinicalIndexProfile: 'Kliniki indeks profili',
  clinicalIndexSub: 'Normalizirlenen BMI, Z-score we risk gorkezijileri',
  bmiDistribution: 'BMI paylanysy',
  regionSample: (count) => `Sebit boyunca n=${count}`,
  zBands: 'BMI Z-score aralyklary',
  zBandsSub: 'WHO LMS boyunca kliniki toparlama',
  analyticalIndicators: 'Analitik gorkezijiler',
  activityStructure: 'Isjenlik duzulisi',
  operationalAnalysis: 'Operasion analiz',
  contact: 'Habarlasmak',
  satelliteOn: 'Google satellite kartany ac',
  satelliteOff: 'Adaty sebitleyin karta dolan',
  layerLoading: 'Sebit gatlagy yuklenyar',
  patientExists: 'Patient bar',
  patientDataTooltip: (name, count) =>
    count > 0
      ? `${name}: ${count} patient maglumaty bar`
      : `${name}: patient maglumaty yok`,
  selectedBack: 'Saylanan sebite dolan',
  coverageIndex: 'Gursaw indeksi',
  contactPoints: 'Aragatnasyk nokatlary',
  riskRecords: 'Risk yazgylary',
  lowerLayer: 'Asaky gatlak',
  analysesShare: 'Analiz payy',
  adminActivity: 'Admin isjenligi',
  researcherBase: 'Gozlegci bazasy',
  regionalDensity: 'Sebitleyin dykyzlyk',
  role: 'Kimligi',
  userId: 'User ID',
  roleField: 'Rol',
  email: 'Email',
  phone: 'Telefon',
  location: 'Sebit',
  address: 'Takyk salgy',
  coordinate: 'Koordinata',
  status: 'Yagday',
  registered: 'Hasaba alnan',
  lastActivity: 'Songky isjenlik',
  todayEntries: 'Bugunki yazgylar',
  monthEntries: 'Aylyk yazgylar',
  totalEntries: 'Jemi yazgylar',
  avgTime: 'Orta wagt',
  mostActiveTime: 'In isjen wagty',
  regionMatch: 'Sebit gabat gelmesi',
  matched: 'Gabat geldi',
  fallback: 'Fallback nokady',
  notSpecified: 'Gorkezilmedik',
  regionNotSpecified: 'Sebit gorkezilmedik',
  sameAreaPin: 'Su sebitdaki pin',
  chatError: 'Chat dine admin ya-da gozlegci user pinleri ucin acylyar',
  chatOpened: (name) => `${name} bilen chat acyldy`,
  chatPrompt:
    'Chat penjiresi arkaly admin ya-da gozlegci bilen habarlashyp bilersiniz',
  underweight: 'Agram yetmezciligi',
  normal: 'Kada',
  overweight: 'Artyk agram',
  obese: 'Semizlik',
  coverage: 'Gursaw',
  totalPatients: 'Jemi patientler',
  avgBmi: 'Orta BMI',
  riskCount: 'Risk yazgylary',
  noData: 'Maglumat yok',
  patients: 'Patientler',
  risk: 'Risk',
};

MAP_I18N.tr = {
  ...MAP_I18N.uz,
  country: 'Türkiye',
  title: 'Bölgesel Analiz Haritası',
  subtitle:
    'İl, ilçe ve mahalle düzeyinde analizleri, yöneticileri ve araştırmacıları takip edin.',
  region: 'İl',
  district: 'İlçe',
  mahalla: 'Mahalle',
  analyticsLoading: 'Analitik yükleniyor',
  analyses: 'Analiz',
  admin: 'Yönetici',
  admins: 'Yöneticiler',
  researcher: 'Araştırmacı',
  nextLayer: 'Sonraki katman',
  area: 'Alan',
  riskSignal: 'Klinik risk sinyali',
  scientificProfile: 'Bilimsel klinik profil',
  clinicalIndexProfile: 'Klinik indeks profili',
  clinicalIndexSub: 'Normalleştirilmiş BMI, Z-skoru ve risk göstergeleri',
  bmiDistribution: 'BMI dağılımı',
  regionSample: (count) => `Bölgeye göre n=${count}`,
  zBands: 'BMI Z-skoru bantları',
  zBandsSub: "WHO LMS'ye göre klinik gruplandırma",
  analyticalIndicators: 'Analitik göstergeler',
  activityStructure: 'Aktivite yapısı',
  operationalAnalysis: 'Operasyonel analiz',
  contact: 'İletişim',
  satelliteOn: 'Google uydu haritasını aç',
  satelliteOff: 'Normal bölgesel haritaya dön',
  layerLoading: 'Bölgesel katman yükleniyor',
  patientExists: 'Hasta var',
  patientDataTooltip: (name, count) =>
    count > 0
      ? `${name}: ${count} hasta verisi var`
      : `${name}: hasta verisi yok`,
  selectedBack: 'Seçilen bölgeye dön',
  coverageIndex: 'Kapsama indeksi',
  contactPoints: 'İrtibat noktaları',
  riskRecords: 'Riskli kayıtlar',
  lowerLayer: 'Alt katman',
  analysesShare: 'Analiz oranı',
  adminActivity: 'Yönetici aktivitesi',
  researcherBase: 'Araştırmacı tabanı',
  regionalDensity: 'Bölgesel yoğunluk',
  role: 'Kimlik',
  userId: 'Kullanıcı ID',
  roleField: 'Rol',
  email: 'E-posta',
  phone: 'Telefon',
  location: 'Bölge',
  address: 'Açık adres',
  coordinate: 'Koordinat',
  status: 'Durum',
  registered: 'Kayıtlı',
  lastActivity: 'Son aktivite',
  todayEntries: 'Bugünkü kayıtlar',
  monthEntries: 'Aylık kayıtlar',
  totalEntries: 'Toplam kayıtlar',
  avgTime: 'Ortalama süre',
  mostActiveTime: 'En aktif zaman',
  regionMatch: 'Bölge eşleşmesi',
  matched: 'Eşleşti',
  fallback: 'Yedek nokta',
  notSpecified: 'Belirtilmemiş',
  regionNotSpecified: 'Bölge belirtilmemiş',
  sameAreaPin: 'Aynı bölgedeki pin',
  chatError:
    'Sohbet yalnızca yönetici veya araştırmacı pinleri için açılabilir',
  chatOpened: (name) => `${name} ile sohbet açıldı`,
  chatPrompt:
    'Sohbet penceresinden yönetici veya araştırmacı ile iletişime geçebilirsiniz',
  underweight: 'Zayıf',
  normal: 'Normal',
  overweight: 'Fazla Kilolu',
  obese: 'Obezite',
  coverage: 'Kapsama',
  totalPatients: 'Toplam hastalar',
  avgBmi: 'Ortalama BMI',
  riskCount: 'Riskli kayıtlar',
  noData: 'Veri yok',
  patients: 'Hastalar',
  risk: 'Risk',
};

Object.assign(MAP_I18N.ru, {
  metricLayer: 'Слой цвета',
  timeFilter: 'Фильтр времени',
  metricDefault: 'Стандартный',
  metricRisk: 'Риск',
  metricCoverage: 'Охват',
  metricAnalyses: 'Количество анализов',
  metricBmi: 'Средний BMI',
  metricZRisk: 'Z-score риск',
  metricActivity: 'Админ/исследователь',
  timeAll: 'Все',
  timeToday: 'Сегодня',
  time7d: '7 дней',
  time30d: '30 дней',
  timeYear: 'Год',
  timeCustom: 'Период',
  dateFrom: 'Начало',
  dateTo: 'Конец',
  trend: 'Тренд',
  trendUp: 'Риск вырос',
  trendDown: 'Риск снизился',
  trendFlat: 'Стабильно',
  qualityScore: 'Качество мониторинга',
  topProblemAreas: 'Проблемные территории',
  highestRisk: 'Самый высокий риск',
  lowestCoverage: 'Низкий охват',
  mostPatients: 'Больше пациентов',
  emptyMahallas: 'Пустые махалли',
  riskReasons: 'Причины риска',
  noPatientData: 'Нет данных пациентов',
  latestAnalysis: 'Последний анализ',
  avgBmi: 'Средний BMI',
  zRisk: 'Z-риск',
  patientCount: 'Пациенты',
  exportReport: 'Экспорт отчета',
  exportPdf: 'PDF',
  exportXls: 'XLS',
  exportSnapshot: 'Снимок',
  exportSuccess: 'Отчет готов',
  exportError: 'Ошибка экспорта',
  snapshotSuccess: 'Снимок готов',
  reportSection: 'Раздел',
  reportArea: 'Территория',
  reportRisk: 'Риск',
  reportQuality: 'Качество',
  highRisk: 'Высокий риск',
  watchRisk: 'Нужно наблюдение',
  lowRisk: 'Низкий риск',
  dominantClinicalGroup: 'Доминирующая клиническая группа',
  highZSignal: 'Записи с Z-score выше +2',
  operationalReadiness: 'На основе охвата и активных ролей',
  fieldAssistant: 'Полевой ассистент',
});

Object.assign(MAP_I18N.en, {
  metricLayer: 'Color layer',
  timeFilter: 'Time filter',
  metricDefault: 'Default',
  metricRisk: 'Risk',
  metricCoverage: 'Coverage',
  metricAnalyses: 'Analysis count',
  metricBmi: 'Average BMI',
  metricZRisk: 'Z-score risk',
  metricActivity: 'Admin/researcher',
  timeAll: 'All',
  timeToday: 'Today',
  time7d: '7 days',
  time30d: '30 days',
  timeYear: 'Year',
  timeCustom: 'Custom',
  dateFrom: 'Start',
  dateTo: 'End',
  trend: 'Trend',
  trendUp: 'Risk increased',
  trendDown: 'Risk decreased',
  trendFlat: 'Stable',
  qualityScore: 'Monitoring quality',
  topProblemAreas: 'Top problem areas',
  highestRisk: 'Highest risk',
  lowestCoverage: 'Low coverage',
  mostPatients: 'Most patients',
  emptyMahallas: 'Empty mahallas',
  riskReasons: 'Risk reasons',
  noPatientData: 'No patient data',
  latestAnalysis: 'Latest analysis',
  avgBmi: 'Average BMI',
  zRisk: 'Z-risk',
  patientCount: 'Patients',
  exportReport: 'Export report',
  exportPdf: 'PDF',
  exportXls: 'XLS',
  exportSnapshot: 'Snapshot',
  exportSuccess: 'Report ready',
  exportError: 'Export error',
  snapshotSuccess: 'Snapshot ready',
  reportSection: 'Section',
  reportArea: 'Area',
  reportRisk: 'Risk',
  reportQuality: 'Quality',
  highRisk: 'High risk',
  watchRisk: 'Watch needed',
  lowRisk: 'Low risk',
  dominantClinicalGroup: 'Dominant clinical group',
  highZSignal: 'Records with Z-score above +2',
  operationalReadiness: 'Based on coverage and active roles',
  fieldAssistant: 'Field assistant',
});

Object.assign(MAP_I18N.kz, {
  metricLayer: 'Tus qabaty',
  timeFilter: 'Uaqyt suzgisi',
  metricDefault: 'Standart',
  metricRisk: 'Qauip',
  metricCoverage: 'Qamtu',
  metricAnalyses: 'Talday sany',
  metricBmi: 'Ortasha BMI',
  metricZRisk: 'Z-score qaupi',
  metricActivity: 'Admin/zertteushi',
  timeAll: 'Barlygy',
  timeToday: 'Bugin',
  time7d: '7 kun',
  time30d: '30 kun',
  timeYear: 'Jyl',
  timeCustom: 'Arnaiy',
  dateFrom: 'Bastaluy',
  dateTo: 'Aiaqtaluy',
  trend: 'Trend',
  trendUp: 'Qauip osti',
  trendDown: 'Qauip tomendedi',
  trendFlat: 'Turaqty',
  qualityScore: 'Monitoring sapasy',
  topProblemAreas: 'Problemaly aimaqtar',
  highestRisk: 'En jogary qauip',
  lowestCoverage: 'Qamtu tomen',
  mostPatients: 'Patient kop',
  emptyMahallas: 'Bos mahallalar',
  riskReasons: 'Qauip sebepteri',
  noPatientData: 'Patient deregi joq',
  latestAnalysis: 'Songy taldau',
  avgBmi: 'Ortasha BMI',
  zRisk: 'Z-qauip',
  patientCount: 'Patientter',
  exportReport: 'Esepti eksporttau',
  exportPdf: 'PDF',
  exportXls: 'XLS',
  exportSnapshot: 'Suret',
  exportSuccess: 'Esep daiyin',
  exportError: 'Eksport qatesi',
  snapshotSuccess: 'Suret daiyin',
  reportSection: 'Bolim',
  reportArea: 'Aimaq',
  reportRisk: 'Qauip',
  reportQuality: 'Sapa',
  highRisk: 'Jogary qauip',
  watchRisk: 'Baqylau kerek',
  lowRisk: 'Tomen qauip',
  dominantClinicalGroup: 'Basym klinikalyq top',
  highZSignal: 'Z-score +2-den jogary jazbalar',
  operationalReadiness: 'Qamtu jane belsendi rolder negizinde',
  fieldAssistant: 'Dala assistenti',
});

Object.assign(MAP_I18N.ky, {
  metricLayer: 'Түстүү катмар',
  timeFilter: 'Убакыт чыпкасы',
  metricDefault: 'Стандарттуу',
  metricRisk: 'Коркунуч',
  metricCoverage: 'Камтуу',
  metricAnalyses: 'Талдоолордун саны',
  metricBmi: 'Орточо BMI',
  metricZRisk: 'Z-score коркунучу',
  metricActivity: 'Админ/изилдөөчү',
  timeAll: 'Баары',
  timeToday: 'Бүгүн',
  time7d: '7 күн',
  time30d: '30 күн',
  timeYear: 'Жыл',
  timeCustom: 'Ыңгайлаштырылган',
  dateFrom: 'Башталышы',
  dateTo: 'Аягы',
  trend: 'Тренд',
  trendUp: 'Коркунуч өстү',
  trendDown: 'Коркунуч азайды',
  trendFlat: 'Туруктуу',
  qualityScore: 'Мониторинг сапаты',
  topProblemAreas: 'Көйгөйлүү аймактар',
  highestRisk: 'Эң жогорку коркунуч',
  lowestCoverage: 'Камтуусу төмөн',
  mostPatients: 'Бейтаптары көп',
  emptyMahallas: 'Бош махаллалар',
  riskReasons: 'Коркунучтун себептери',
  noPatientData: 'Бейтап жөнүндө маалымат жок',
  latestAnalysis: 'Акыркы талдоо',
  avgBmi: 'Орточо BMI',
  zRisk: 'Z-коркунуч',
  patientCount: 'Бейтаптар',
  exportReport: 'Отчетту экспорттоо',
  exportPdf: 'PDF',
  exportXls: 'XLS',
  exportSnapshot: 'Сүрөт',
  exportSuccess: 'Отчет даяр',
  exportError: 'Экспорт катасы',
  snapshotSuccess: 'Сүрөт даяр',
  reportSection: 'Бөлүм',
  reportArea: 'Аймак',
  reportRisk: 'Коркунуч',
  reportQuality: 'Сапат',
  highRisk: 'Жогорку коркунуч',
  watchRisk: 'Көзөмөл керек',
  lowRisk: 'Төмөн коркунуч',
  dominantClinicalGroup: 'Басымдуу клиникалык топ',
  highZSignal: 'Z-score +2ден жогору жазуулар',
  operationalReadiness: 'Камтуу жана активдүү ролдордун негизинде',
  fieldAssistant: 'Талаа жардамчысы',
});

Object.assign(MAP_I18N.tg, {
  metricLayer: 'Qabati rang',
  timeFilter: 'Filtri vaqt',
  metricDefault: 'Standart',
  metricRisk: 'Khavf',
  metricCoverage: 'Farogiri',
  metricAnalyses: 'Shumorai tahlilho',
  metricBmi: 'BMI miyona',
  metricZRisk: 'Khavfi Z-score',
  metricActivity: 'Admin/tahqiqgar',
  timeAll: 'Hama',
  timeToday: 'Imruz',
  time7d: '7 ruz',
  time30d: '30 ruz',
  timeYear: 'Sol',
  timeCustom: 'Makhsus',
  dateFrom: 'Ogoz',
  dateTo: 'Anjom',
  trend: 'Tamoyul',
  trendUp: 'Khavf ziyod shud',
  trendDown: 'Khavf kam shud',
  trendFlat: 'Ustuvor',
  qualityScore: 'Sifati monitoring',
  topProblemAreas: 'Hududhoi mushkil',
  highestRisk: 'Khavfi balandtarin',
  lowestCoverage: 'Farogirii past',
  mostPatients: 'Bemoroni beshtar',
  emptyMahallas: 'Mahallahoi holi',
  riskReasons: 'Sababhoi khavf',
  noPatientData: 'Malumoti bemor nest',
  latestAnalysis: 'Tahlili okhirin',
  avgBmi: 'BMI miyona',
  zRisk: 'Z-khavf',
  patientCount: 'Bemoron',
  exportReport: 'Sodiroti hisobot',
  exportPdf: 'PDF',
  exportXls: 'XLS',
  exportSnapshot: 'Snapshot',
  exportSuccess: 'Hisobot tayyor',
  exportError: 'Sodirot khatosi',
  snapshotSuccess: 'Snapshot tayyor',
  reportSection: 'Bakhsh',
  reportArea: 'Hudud',
  reportRisk: 'Khavf',
  reportQuality: 'Sifat',
  highRisk: 'Khavfi baland',
  watchRisk: 'Nazorat lozim',
  lowRisk: 'Khavfi past',
  dominantClinicalGroup: 'Guruhi klinikii asosii',
  highZSignal: 'Sabthoi Z-score az +2 bolo',
  operationalReadiness: 'Bar asosii farogiri va naqshhoi faol',
  fieldAssistant: 'Yordamchii sahroi',
});

Object.assign(MAP_I18N.tm, {
  metricLayer: 'Renk gatlagy',
  timeFilter: 'Wagt filtri',
  metricDefault: 'Standart',
  metricRisk: 'Risk',
  metricCoverage: 'Gursaw',
  metricAnalyses: 'Analiz sany',
  metricBmi: 'Orta BMI',
  metricZRisk: 'Z-score riski',
  metricActivity: 'Admin/gozlegci',
  timeAll: 'Ahlisi',
  timeToday: 'Su gun',
  time7d: '7 gun',
  time30d: '30 gun',
  timeYear: 'Yyl',
  timeCustom: 'Yorite',
  dateFrom: 'Baslangyc',
  dateTo: 'Tamamlanma',
  trend: 'Trend',
  trendUp: 'Risk yokarlandy',
  trendDown: 'Risk peseldi',
  trendFlat: 'Durnukly',
  qualityScore: 'Monitoring hili',
  topProblemAreas: 'Meseleli sebitler',
  highestRisk: 'In yokary risk',
  lowestCoverage: 'Gursaw pes',
  mostPatients: 'Patient kop',
  emptyMahallas: 'Bos mahallalar',
  riskReasons: 'Risk sebapleri',
  noPatientData: 'Patient maglumaty yok',
  latestAnalysis: 'Sonky analiz',
  avgBmi: 'Orta BMI',
  zRisk: 'Z-risk',
  patientCount: 'Patientler',
  exportReport: 'Hasabat eksporty',
  exportPdf: 'PDF',
  exportXls: 'XLS',
  exportSnapshot: 'Snapshot',
  exportSuccess: 'Hasabat tayyar',
  exportError: 'Eksport yalnyslygy',
  snapshotSuccess: 'Snapshot tayyar',
  reportSection: 'Bolum',
  reportArea: 'Sebit',
  reportRisk: 'Risk',
  reportQuality: 'Hil',
  highRisk: 'Yokary risk',
  watchRisk: 'Gozegcilik gerek',
  lowRisk: 'Pes risk',
  dominantClinicalGroup: 'Esasy kliniki topar',
  highZSignal: 'Z-score +2-den yokary yazgylar',
  operationalReadiness: 'Gursaw we isjen rollar esasynda',
  fieldAssistant: 'Meydan komekcisi',
});

Object.assign(MAP_I18N.tr, {
  metricLayer: 'Renk katmani',
  timeFilter: 'Zaman filtresi',
  metricDefault: 'Standart',
  metricRisk: 'Risk',
  metricCoverage: 'Kapsama',
  metricAnalyses: 'Analiz sayisi',
  metricBmi: 'Ortalama BMI',
  metricZRisk: 'Z-score riski',
  metricActivity: 'Yonetici/arastirmaci',
  timeAll: 'Tumu',
  timeToday: 'Bugun',
  time7d: '7 gun',
  time30d: '30 gun',
  timeYear: 'Yil',
  timeCustom: 'Ozel',
  dateFrom: 'Baslangic',
  dateTo: 'Bitis',
  trend: 'Trend',
  trendUp: 'Risk artti',
  trendDown: 'Risk azaldi',
  trendFlat: 'Stabil',
  qualityScore: 'Izleme kalitesi',
  topProblemAreas: 'Sorunlu bolgeler',
  highestRisk: 'En yuksek risk',
  lowestCoverage: 'Dusuk kapsama',
  mostPatients: 'En cok hasta',
  emptyMahallas: 'Bos mahalleler',
  riskReasons: 'Risk nedenleri',
  noPatientData: 'Hasta verisi yok',
  latestAnalysis: 'Son analiz',
  avgBmi: 'Ortalama BMI',
  zRisk: 'Z-risk',
  patientCount: 'Hastalar',
  exportReport: 'Rapor disa aktar',
  exportPdf: 'PDF',
  exportXls: 'XLS',
  exportSnapshot: 'Anlik goruntu',
  exportSuccess: 'Rapor hazir',
  exportError: 'Disa aktarma hatasi',
  snapshotSuccess: 'Anlik goruntu hazir',
  reportSection: 'Bolum',
  reportArea: 'Bolge',
  reportRisk: 'Risk',
  reportQuality: 'Kalite',
  highRisk: 'Yuksek risk',
  watchRisk: 'Izlem gerekli',
  lowRisk: 'Dusuk risk',
  dominantClinicalGroup: 'Baskin klinik grup',
  highZSignal: 'Z-score +2 uzeri kayitlar',
  operationalReadiness: 'Kapsama ve aktif rollere gore',
  fieldAssistant: 'Saha asistani',
});

const localeByLang = {
  uz: 'uz-UZ',
  tg: 'tg-TJ',
  tm: 'tk-TM',
  ru: 'ru-RU',
  en: 'en-US',
  kz: 'kk-KZ',
  ky: 'ky-KG',
  tr: 'tr-TR',
};

const formatArea = (value, locale = 'uz-UZ') => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '-';
  const km2 = n / 1_000_000;
  const digits = km2 >= 100 ? 0 : km2 >= 10 ? 1 : 2;
  return `${km2.toLocaleString(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })} km²`;
};

const getBounds = (bbox) => {
  bbox = parseMaybeJson(bbox);
  if (!Array.isArray(bbox) || bbox.length !== 4) return null;
  const values = bbox.map(Number);
  if (!values.every(Number.isFinite)) return null;
  const [west, south, east, north] = values;
  if (west === east || south === north) return null;
  return [
    [Math.min(west, east), Math.min(south, north)],
    [Math.max(west, east), Math.max(south, north)],
  ];
};

const getGeometryBounds = (geometry) => {
  const points = [];
  const collectPoints = (coordinates) => {
    if (!Array.isArray(coordinates)) return;
    if (
      typeof coordinates[0] === 'number' &&
      typeof coordinates[1] === 'number'
    ) {
      points.push(coordinates);
      return;
    }
    coordinates.forEach(collectPoints);
  };
  collectPoints(geometry?.coordinates);
  if (!points.length) return null;
  return [
    Math.min(...points.map(([lng]) => lng)),
    Math.min(...points.map(([, lat]) => lat)),
    Math.max(...points.map(([lng]) => lng)),
    Math.max(...points.map(([, lat]) => lat)),
  ];
};

const getFeatureBounds = (feature) =>
  parseMaybeJson(feature?.bbox || feature?.properties?.bbox) ||
  getGeometryBounds(feature?.geometry);

const getCollectionBounds = (geoJson) => {
  const boxes = (geoJson?.features || [])
    .map(getFeatureBounds)
    .filter((bbox) => Array.isArray(bbox) && bbox.length === 4);
  if (!boxes.length) return null;
  return [
    Math.min(...boxes.map((bbox) => bbox[0])),
    Math.min(...boxes.map((bbox) => bbox[1])),
    Math.max(...boxes.map((bbox) => bbox[2])),
    Math.max(...boxes.map((bbox) => bbox[3])),
  ];
};

const EARTH_RADIUS_METERS = 6378137;
const MAX_MERCATOR = EARTH_RADIUS_METERS * Math.PI;
const MERCATOR_LAT_LIMIT = 85.05112878;

const clampLatitude = (lat) =>
  Math.min(Math.max(Number(lat), -MERCATOR_LAT_LIMIT), MERCATOR_LAT_LIMIT);

const lngLatToMercatorMeters = ([lng, lat] = []) => {
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  const safeLat = clampLatitude(lat);
  const x = (lng * MAX_MERCATOR) / 180;
  const y =
    Math.log(Math.tan(((90 + safeLat) * Math.PI) / 360)) *
    (EARTH_RADIUS_METERS || 1);
  return [x, y];
};

const mercatorMetersToLngLat = ([x, y] = []) => {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const lng = (x / MAX_MERCATOR) * 180;
  const lat =
    (Math.atan(Math.exp(y / EARTH_RADIUS_METERS)) * 360) / Math.PI - 90;
  return [lng, lat];
};

const isMercatorMeters = (x, y) =>
  Number.isFinite(x) &&
  Number.isFinite(y) &&
  Math.abs(x) <= MAX_MERCATOR &&
  Math.abs(y) <= MAX_MERCATOR;

const ringAreaSquareMeters = (ring = []) => {
  if (!Array.isArray(ring) || ring.length < 3) return 0;
  const first = ring[0];
  const last = ring[ring.length - 1];
  const points =
    first?.[0] === last?.[0] && first?.[1] === last?.[1]
      ? ring
      : [...ring, first];
  let area = 0;
  for (let index = 0; index < points.length - 1; index += 1) {
    const [lon1, lat1] = points[index] || [];
    const [lon2, lat2] = points[index + 1] || [];
    if (![lon1, lat1, lon2, lat2].every(Number.isFinite)) continue;
    area +=
      (((lon2 - lon1) * Math.PI) / 180) *
      (2 + Math.sin((lat1 * Math.PI) / 180) + Math.sin((lat2 * Math.PI) / 180));
  }
  return (area * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS) / 2;
};

const polygonAreaSquareMeters = (polygon = []) => {
  if (!Array.isArray(polygon) || !polygon.length) return 0;
  const [outerRing, ...holes] = polygon;
  return (
    Math.abs(ringAreaSquareMeters(outerRing)) -
    holes.reduce((sum, ring) => sum + Math.abs(ringAreaSquareMeters(ring)), 0)
  );
};

const geometryAreaSquareMeters = (geometry) => {
  if (!geometry) return 0;
  if (geometry.type === 'Polygon')
    return polygonAreaSquareMeters(geometry.coordinates);
  if (geometry.type === 'MultiPolygon') {
    return (geometry.coordinates || []).reduce(
      (sum, polygon) => sum + polygonAreaSquareMeters(polygon),
      0
    );
  }
  if (geometry.type === 'GeometryCollection') {
    return (geometry.geometries || []).reduce(
      (sum, item) => sum + geometryAreaSquareMeters(item),
      0
    );
  }
  return 0;
};

const WEB_MERCATOR_RADIUS = 6378137;
const WEB_MERCATOR_MAX_LAT = 85.05112878;

const clampWebMercatorLat = (lat) =>
  Math.max(
    -WEB_MERCATOR_MAX_LAT,
    Math.min(WEB_MERCATOR_MAX_LAT, Number(lat) || 0)
  );

const lngLatToWebMercator = ([lng, lat] = []) => {
  const safeLng = Number(lng) || 0;
  const safeLat = clampWebMercatorLat(lat);
  const x = (safeLng * Math.PI * WEB_MERCATOR_RADIUS) / 180;
  const y =
    WEB_MERCATOR_RADIUS *
    Math.log(Math.tan(Math.PI / 4 + (safeLat * Math.PI) / 360));
  return [x, y];
};

const webMercatorToLngLat = ([x, y] = []) => {
  const lng = ((Number(x) || 0) / WEB_MERCATOR_RADIUS) * (180 / Math.PI);
  const lat =
    (Math.atan(Math.exp((Number(y) || 0) / WEB_MERCATOR_RADIUS)) * 360) /
      Math.PI -
    90;
  return [lng, clampWebMercatorLat(lat)];
};

const bboxToWebMercator = (bbox) => {
  bbox = parseMaybeJson(bbox);
  if (!Array.isArray(bbox) || bbox.length !== 4) return null;
  const [minX, minY] = lngLatToWebMercator([bbox[0], bbox[1]]);
  const [maxX, maxY] = lngLatToWebMercator([bbox[2], bbox[3]]);
  return [
    Math.min(minX, maxX),
    Math.min(minY, maxY),
    Math.max(minX, maxX),
    Math.max(minY, maxY),
  ];
};

const bboxArea = (bbox) => {
  bbox = parseMaybeJson(bbox);
  if (!Array.isArray(bbox) || bbox.length !== 4) return Number.MAX_SAFE_INTEGER;
  const mercator = bboxToWebMercator(bbox);
  if (!mercator) return Number.MAX_SAFE_INTEGER;
  return Math.abs((mercator[2] - mercator[0]) * (mercator[3] - mercator[1]));
};

const createProjector = (
  bbox,
  width = SVG_WIDTH,
  height = SVG_HEIGHT,
  padding = 18
) => {
  const [minX, minY, maxX, maxY] =
    bboxToWebMercator(bbox) || bboxToWebMercator([55.9, 37.1, 73.3, 45.7]);
  const xSpan = Math.max(maxX - minX, 0.0001);
  const ySpan = Math.max(maxY - minY, 0.0001);
  const scale = Math.min(
    (width - padding * 2) / xSpan,
    (height - padding * 2) / ySpan
  );
  const xOffset = (width - xSpan * scale) / 2;
  const yOffset = (height - ySpan * scale) / 2;
  const project = ([lng, lat]) => {
    const [x, y] = lngLatToWebMercator([lng, lat]);
    return [
      xOffset + (x - minX) * scale,
      height - (yOffset + (y - minY) * scale),
    ];
  };
  project.unproject = ([x, y]) =>
    webMercatorToLngLat([
      (x - xOffset) / scale + minX,
      (height - y - yOffset) / scale + minY,
    ]);
  return project;
};

const ringToPath = (ring, project) => {
  if (!Array.isArray(ring) || ring.length === 0) return '';
  return ring
    .map((point, index) => {
      const [x, y] = project(point);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(4)} ${y.toFixed(4)}`;
    })
    .join(' ')
    .concat(' Z');
};

const geometryToPath = (geometry, project) => {
  if (!geometry) return '';
  if (geometry.type === 'Polygon') {
    return (geometry.coordinates || [])
      .map((ring) => ringToPath(ring, project))
      .join(' ');
  }
  if (geometry.type === 'MultiPolygon') {
    return (geometry.coordinates || [])
      .flatMap((polygon) => polygon || [])
      .map((ring) => ringToPath(ring, project))
      .join(' ');
  }
  return '';
};

const featureFromItem = (item) => {
  if (!item?.geometry) return null;
  return {
    type: 'Feature',
    id: item.boundary_id || `admin-${item.admin_leve}-${item.id}`,
    bbox: parseMaybeJson(item.bbox),
    geometry: item.geometry,
    properties: {
      ...item,
      bbox: parseMaybeJson(item.bbox),
      center: parseMaybeJson(item.center),
      boundary_id: item.boundary_id || `admin-${item.admin_leve}-${item.id}`,
    },
  };
};

const collectionFromFeatures = (features = []) => ({
  type: 'FeatureCollection',
  features: features.filter(Boolean),
});

const getNumericValue = (row, keys) => {
  for (const key of keys) {
    const value = key.split('.').reduce((acc, part) => acc?.[part], row);
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

const pct = (value, total) => Math.round((value / Math.max(total, 1)) * 100);

const getCenter = (item) => {
  const center = parseMaybeJson(item?.center);
  const bbox =
    parseMaybeJson(item?.bbox || item?.properties?.bbox) ||
    getGeometryBounds(item?.geometry || item?.properties?.geometry);
  if (Array.isArray(center) && center.length >= 2) return center;
  if (Array.isArray(bbox) && bbox.length === 4)
    return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
  return [64.5853, 41.3775];
};

const isUzbekistanLngLat = ([lng, lat] = []) =>
  Number.isFinite(lng) &&
  Number.isFinite(lat) &&
  lng >= 55 &&
  lng <= 74 &&
  lat >= 37 &&
  lat <= 46;

const normalizeLngLat = (lng, lat) => {
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  if (isUzbekistanLngLat([lng, lat])) return [lng, lat];
  if (isUzbekistanLngLat([lat, lng])) return [lat, lng];
  if (isMercatorMeters(lng, lat)) {
    const normalized = mercatorMetersToLngLat([lng, lat]);
    if (isUzbekistanLngLat(normalized)) return normalized;
  }
  if (isMercatorMeters(lat, lng)) {
    const normalized = mercatorMetersToLngLat([lat, lng]);
    if (isUzbekistanLngLat(normalized)) return normalized;
  }
  return null;
};

const coordinatesFromText = (value = '') => {
  const text = String(value || '');
  const match = text.match(
    /(-?\d{1,3}(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:[.,]\d+)?)/
  );
  if (!match) return null;
  const first = Number(match[1].replace(',', '.'));
  const second = Number(match[2].replace(',', '.'));
  return normalizeLngLat(first, second) || normalizeLngLat(second, first);
};

const spreadPoint = (center, index, total, distanceMeters = 160) => {
  if (total <= 1) return center;
  const projectedCenter = lngLatToMercatorMeters(center);
  if (!projectedCenter) return center;
  const ring = Math.floor(Math.sqrt(index));
  const angle = (index * 137.508 * Math.PI) / 180;
  const radius = distanceMeters * (0.6 + ring * 0.52 + (index % 3) * 0.12);
  return (
    mercatorMetersToLngLat([
      projectedCenter[0] + Math.cos(angle) * radius,
      projectedCenter[1] + Math.sin(angle) * radius * 0.72,
    ]) || center
  );
};

const stableHash = (value = '') => {
  let hash = 2166136261;
  const text = String(value);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const distributedPointInBoundary = (boundary, seed) => {
  const bbox = parseMaybeJson(boundary?.bbox || boundary?.properties?.bbox);
  if (!Array.isArray(bbox) || bbox.length !== 4) return getCenter(boundary);
  const hashA = stableHash(`${seed}:lng`);
  const hashB = stableHash(`${seed}:lat`);
  const padLng = Math.abs(bbox[2] - bbox[0]) * 0.18;
  const padLat = Math.abs(bbox[3] - bbox[1]) * 0.18;
  const minLng = bbox[0] + padLng;
  const maxLng = bbox[2] - padLng;
  const minLat = bbox[1] + padLat;
  const maxLat = bbox[3] - padLat;
  const lng = minLng + (hashA / 0xffffffff) * Math.max(maxLng - minLng, 0.0001);
  const lat = minLat + (hashB / 0xffffffff) * Math.max(maxLat - minLat, 0.0001);
  return [lng, lat];
};

const METRIC_LAYERS = [
  { key: 'default', labelKey: 'metricDefault' },
  { key: 'risk', labelKey: 'metricRisk' },
  { key: 'coverage', labelKey: 'metricCoverage' },
  { key: 'analyses', labelKey: 'metricAnalyses' },
  { key: 'avgBmi', labelKey: 'metricBmi' },
  { key: 'zRisk', labelKey: 'metricZRisk' },
  { key: 'activity', labelKey: 'metricActivity' },
];

const TIME_FILTERS = [
  { key: 'all', labelKey: 'timeAll', days: null },
  { key: 'today', labelKey: 'timeToday', days: 1 },
  { key: '7d', labelKey: 'time7d', days: 7 },
  { key: '30d', labelKey: 'time30d', days: 30 },
  { key: 'year', labelKey: 'timeYear', days: 365 },
  { key: 'custom', labelKey: 'timeCustom', days: null },
];

const dateKeys = [
  'created_at',
  'createdAt',
  'date',
  'analysis_date',
  'exam_date',
];

const getRecordDate = (row = {}) => {
  for (const key of dateKeys) {
    const value = row[key];
    if (!value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return null;
};

const getTimeWindowStart = (timeFilter) => {
  const option = TIME_FILTERS.find((item) => item.key === timeFilter);
  if (!option?.days) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (option.days > 1) start.setDate(start.getDate() - option.days + 1);
  return start;
};

const recordInTimeWindow = (
  row,
  timeFilter,
  customFrom = '',
  customTo = ''
) => {
  if (row.__source === 'user') return true;
  const date = getRecordDate(row);
  if (timeFilter === 'custom') {
    if (!date) return false;
    const from = customFrom ? new Date(`${customFrom}T00:00:00`) : null;
    const to = customTo ? new Date(`${customTo}T23:59:59`) : null;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return Boolean(from || to);
  }
  const start = getTimeWindowStart(timeFilter);
  if (!start) return true;
  return date ? date >= start : false;
};
const getBmiValue = (row) =>
  getNumericValue(row, ['bmi', 'analysis.bmi', 'result.bmi', 'metrics.bmi']);

const getZValue = (row) =>
  getNumericValue(row, [
    'z_score',
    'zScore',
    'bmi_z_score',
    'z_bmi',
    'analysis.z_score',
    'result.z_score',
  ]);

const getRiskReasons = (row) => {
  const bmi = getBmiValue(row);
  const z = getZValue(row);
  return {
    underweight: Number.isFinite(bmi) && bmi < 18.5,
    overweight: Number.isFinite(bmi) && bmi >= 25 && bmi < 30,
    obese: Number.isFinite(bmi) && bmi >= 30,
    zLow: Number.isFinite(z) && z < -2,
    zHigh: Number.isFinite(z) && z > 2,
  };
};

const isRiskRecord = (row) => Object.values(getRiskReasons(row)).some(Boolean);

const average = (values = []) => {
  const numeric = values.filter(Number.isFinite);
  return numeric.length
    ? numeric.reduce((sum, value) => sum + value, 0) / numeric.length
    : 0;
};

const formatMetricNumber = (value, digits = 1) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return '0';
  return n.toFixed(digits).replace(/\.0$/, '');
};

const metricScaleColor = (value, stops) => {
  const n = Number(value) || 0;
  for (const stop of stops) {
    if (n <= stop.max) return stop.color;
  }
  return stops[stops.length - 1]?.color || '#64748b';
};

const getMetricColor = (metricLayer, stats) => {
  if (metricLayer === 'risk') return getRiskColor(stats.riskRate);
  if (metricLayer === 'coverage') {
    return metricScaleColor(stats.coverageQuality, [
      { max: 0, color: '#94a3b8' },
      { max: 34, color: '#dc2626' },
      { max: 67, color: '#f59e0b' },
      { max: 100, color: '#16a34a' },
    ]);
  }
  if (metricLayer === 'analyses') {
    return metricScaleColor(stats.patientCount, [
      { max: 0, color: '#94a3b8' },
      { max: 4, color: '#93c5fd' },
      { max: 14, color: '#2563eb' },
      { max: Number.POSITIVE_INFINITY, color: '#1d4ed8' },
    ]);
  }
  if (metricLayer === 'avgBmi') {
    return metricScaleColor(stats.avgBmi, [
      { max: 0, color: '#94a3b8' },
      { max: 18.49, color: '#3b82f6' },
      { max: 24.99, color: '#16a34a' },
      { max: 29.99, color: '#f59e0b' },
      { max: Number.POSITIVE_INFINITY, color: '#dc2626' },
    ]);
  }
  if (metricLayer === 'zRisk') return getRiskColor(stats.zRiskRate);
  if (metricLayer === 'activity') {
    return metricScaleColor(stats.activityCount, [
      { max: 0, color: '#94a3b8' },
      { max: 1, color: '#a78bfa' },
      { max: 3, color: '#7c3aed' },
      { max: Number.POSITIVE_INFINITY, color: '#5b21b6' },
    ]);
  }
  return null;
};

const getTrendInfo = (records = []) => {
  const dated = records
    .map((record) => ({ record, date: getRecordDate(record) }))
    .filter((item) => item.date);
  if (dated.length < 4)
    return { direction: 'flat', delta: 0, currentRate: 0, previousRate: 0 };
  dated.sort((a, b) => a.date - b.date);
  const midpoint = Math.floor(dated.length / 2);
  const previous = dated.slice(0, midpoint).map((item) => item.record);
  const current = dated.slice(midpoint).map((item) => item.record);
  const previousRate = pct(
    previous.filter(isRiskRecord).length,
    previous.length
  );
  const currentRate = pct(current.filter(isRiskRecord).length, current.length);
  const delta = currentRate - previousRate;
  return {
    direction: delta > 3 ? 'up' : delta < -3 ? 'down' : 'flat',
    delta,
    currentRate,
    previousRate,
  };
};
const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

const escapeHtml = (value = '') =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const slugifyFilePart = (value = '') =>
  String(value || 'regional-map')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'regional-map';

const todayStamp = () => new Date().toISOString().slice(0, 10);
const getRiskColor = (riskRate) => {
  if (riskRate >= 45) return '#dc2626';
  if (riskRate >= 25) return '#f59e0b';
  if (riskRate > 0) return '#0f766e';
  return '#64748b';
};

const getBoundaryFillOpacityPaint = (level) => [
  'case',
  ['boolean', ['feature-state', 'selected'], false],
  level === 3 ? 0.42 : 0.36,
  ['boolean', ['feature-state', 'hover'], false],
  0.3,
  ['boolean', ['get', 'has_patient_data'], false],
  level === 1 ? 0.86 : level === 2 ? 0.58 : 0.46,
  level === 1 ? 0.74 : level === 2 ? 0.18 : 0.12,
];

const getBoundaryLineColorPaint = (level, isDark) => [
  'case',
  ['boolean', ['feature-state', 'selected'], false],
  LEVEL_META[level].selected,
  level === 1 ? '#ffffff' : isDark ? '#e2e8f0' : '#0f172a',
];

const getBoundaryLineWidthPaint = (level) => [
  'case',
  ['boolean', ['feature-state', 'selected'], false],
  level === 3 ? 2.2 : 2.8,
  level === 1 ? 1.25 : level === 2 ? 1.05 : 0.75,
];

const getFeaturePickArea = (feature) =>
  bboxArea(feature?.bbox || feature?.properties?.bbox);

const pickSmallestFeature = (features = []) =>
  [...features]
    .filter((feature) => feature?.properties)
    .sort((a, b) => getFeaturePickArea(a) - getFeaturePickArea(b))[0] || null;

const pickBestRenderedBoundary = (features = []) =>
  [...features]
    .filter((feature) => feature?.properties)
    .sort((a, b) => {
      const levelA = Number(a.properties?.admin_leve || 0);
      const levelB = Number(b.properties?.admin_leve || 0);
      if (levelA !== levelB) return levelB - levelA;
      return getFeaturePickArea(a) - getFeaturePickArea(b);
    })[0] || null;
const addBoundaryLayers = (map, level, beforeId, isDark) => {
  const meta = LEVEL_META[level];
  const beforeLayer = beforeId && map.getLayer(beforeId) ? beforeId : undefined;
  map.addSource(meta.source, {
    type: 'geojson',
    data: EMPTY_COLLECTION,
    promoteId: 'boundary_id',
  });
  map.addLayer(
    {
      id: meta.fill,
      type: 'fill',
      source: meta.source,
      paint: {
        'fill-color': [
          'case',
          ['boolean', ['feature-state', 'selected'], false],
          meta.selected,
          ['boolean', ['feature-state', 'hover'], false],
          meta.hover,
          ['!=', ['coalesce', ['get', 'metric_color'], ''], ''],
          ['get', 'metric_color'],
          ['boolean', ['get', 'has_patient_data'], false],
          PATIENT_BOUNDARY_COLOR,
          meta.color,
        ],
        'fill-opacity': getBoundaryFillOpacityPaint(level),
      },
    },
    beforeLayer
  );
  map.addLayer(
    {
      id: meta.line,
      type: 'line',
      source: meta.source,
      paint: {
        'line-color': getBoundaryLineColorPaint(level, isDark),
        'line-opacity': level === 1 ? 0.76 : level === 2 ? 0.64 : 0.5,
        'line-width': getBoundaryLineWidthPaint(level),
      },
    },
    beforeLayer
  );
};

const clearLayerSelection = (map, featureIdsByLevel, level) => {
  (featureIdsByLevel.current[level] || []).forEach((id) => {
    map.setFeatureState(
      { source: LEVEL_META[level].source, id },
      { selected: false, hover: false }
    );
  });
};

const normalizeListResponse = (value) =>
  Array.isArray(value?.items)
    ? value.items
    : Array.isArray(value?.data)
      ? value.data
      : Array.isArray(value)
        ? value
        : [];

const loadAllUsers = async () => {
  const pageSize = 200;
  const rows = [];
  for (let page = 1; page <= 100; page += 1) {
    const value = await AdminApi.users.list({
      page,
      page_size: pageSize,
      pageSize,
    });
    const items = normalizeListResponse(value);
    rows.push(...items);
    if (items.length < pageSize) break;
  }
  const unique = new Map();
  rows.forEach((row) => {
    unique.set(row.id || row.email || `${row.name}-${unique.size}`, row);
  });
  return [...unique.values()];
};

const StatPill = ({ label, value, color = 'primary.main' }) => (
  <Box
    sx={{
      px: 1.25,
      py: 0.5,
      borderRadius: 1.5,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
      minWidth: 90,
    }}
  >
    <Typography
      variant="caption"
      color="text.secondary"
      fontWeight={700}
      sx={{ fontSize: '0.68rem', display: 'block', mb: 0.1 }}
    >
      {label}
    </Typography>
    <Typography
      variant="body2"
      fontWeight={800}
      sx={{ color, lineHeight: 1.1 }}
    >
      {value}
    </Typography>
  </Box>
);

const RegionalMetricTile = ({ icon, label, value, detail, color }) => (
  <Box
    sx={{
      p: 1.45,
      minHeight: 124,
      borderRadius: 2.25,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: 1,
      boxShadow: '0 12px 30px rgba(15,23,42,0.08)',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        bgcolor: color,
      },
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        opacity: 0.1,
        background: `linear-gradient(135deg, ${color}22, transparent 62%)`,
        pointerEvents: 'none',
      }}
    />
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={1}
      sx={{ position: 'relative' }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={900}
        sx={{ lineHeight: 1.2, minWidth: 0 }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          color: '#fff',
          bgcolor: color,
          boxShadow: `0 12px 24px ${color}40`,
          flex: '0 0 auto',
        }}
      >
        {icon}
      </Box>
    </Stack>

    <Typography
      variant="h4"
      fontWeight={950}
      sx={{
        color,
        lineHeight: 0.95,
        letterSpacing: 0,
        position: 'relative',
        fontSize: '1.62rem',
        textAlign: 'center',
        py: 0.25,
      }}
    >
      {value}
    </Typography>

    {detail && (
      <Box
        sx={{
          px: 1,
          py: 0.55,
          borderRadius: 1.25,
          bgcolor: 'rgba(100,116,139,0.1)',
          border: '1px solid rgba(100,116,139,0.14)',
          position: 'relative',
          minHeight: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={800}
          sx={{
            lineHeight: 1.2,
            overflowWrap: 'anywhere',
            textAlign: 'center',
          }}
        >
          {detail}
        </Typography>
      </Box>
    )}
  </Box>
);

const RegionalInsightRow = ({ label, value, color, helper }) => (
  <Box
    sx={{
      p: 1.15,
      borderRadius: 1.5,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
    }}
  >
    <Stack direction="row" justifyContent="space-between" spacing={1} mb={0.35}>
      <Typography variant="caption" color="text.secondary" fontWeight={800}>
        {label}
      </Typography>
      <Typography variant="caption" fontWeight={900} sx={{ color }}>
        {value}
      </Typography>
    </Stack>
    {helper && (
      <Typography variant="caption" color="text.secondary" fontWeight={700}>
        {helper}
      </Typography>
    )}
  </Box>
);
const ScientificBarChart = ({ title, subtitle, rows, maxValue }) => (
  <Box
    sx={{
      p: 1.4,
      borderRadius: 1.5,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
    }}
  >
    <Typography variant="body2" fontWeight={700}>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="caption" color="text.secondary" fontWeight={700}>
        {subtitle}
      </Typography>
    )}
    <Stack spacing={0.9} mt={1.2}>
      {rows.map((row) => (
        <Box key={row.label}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={0.35}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
            >
              {row.label}
            </Typography>
            <Typography variant="caption" fontWeight={700}>
              {row.value}
            </Typography>
          </Stack>
          <Box
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'rgba(100,116,139,0.14)',
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: `${Math.max((row.value / Math.max(maxValue, 1)) * 100, row.value ? 7 : 0)}%`,
                borderRadius: 4,
                bgcolor: row.color,
              }}
            />
          </Box>
        </Box>
      ))}
    </Stack>
  </Box>
);

const ScientificIndexChart = ({ rows, title, subtitle }) => {
  const points = rows.map((row, index) => {
    const x = 22 + index * (156 / Math.max(rows.length - 1, 1));
    const y = 78 - Math.min(Math.max(row.value, 0), 100) * 0.56;
    return `${x},${y}`;
  });
  return (
    <Box
      sx={{
        p: 1.4,
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="body2" fontWeight={700}>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary" fontWeight={700}>
        {subtitle}
      </Typography>
      <Box
        component="svg"
        viewBox="0 0 200 92"
        sx={{ width: '100%', height: 110, mt: 1 }}
      >
        {[20, 40, 60, 80].map((tick) => (
          <line
            key={tick}
            x1="18"
            x2="184"
            y1={82 - tick * 0.56}
            y2={82 - tick * 0.56}
            stroke="rgba(100,116,139,0.18)"
            strokeWidth="1"
          />
        ))}
        <polyline
          fill="none"
          stroke="#2563eb"
          strokeWidth="2.4"
          points={points.join(' ')}
        />
        {rows.map((row, index) => {
          const [x, y] = points[index].split(',').map(Number);
          return (
            <g key={row.label}>
              <circle
                cx={x}
                cy={y}
                r="3.6"
                fill={row.color}
                stroke="#fff"
                strokeWidth="1.5"
              />
              <text
                x={x}
                y="90"
                textAnchor="middle"
                fontSize="8"
                fill="currentColor"
              >
                {row.short}
              </text>
            </g>
          );
        })}
      </Box>
    </Box>
  );
};

const SearchResultRow = ({ icon, title, detail, chip, onClick }) => (
  <Button
    fullWidth
    onClick={onClick}
    startIcon={icon}
    sx={{
      justifyContent: 'flex-start',
      textAlign: 'left',
      px: 1.25,
      py: 1,
      borderRadius: 2,
      color: 'text.primary',
      textTransform: 'none',
    }}
  >
    <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
      <Stack direction={'row'} spacing={0.75} alignItems={'center'}>
        <Typography variant={'body2'} fontWeight={750} noWrap>
          {title}
        </Typography>
        {chip && (
          <Chip
            size={'small'}
            label={chip}
            sx={{ height: 20, fontSize: 10, fontWeight: 800 }}
          />
        )}
      </Stack>
      <Typography variant={'caption'} color={'text.secondary'} noWrap>
        {detail}
      </Typography>
    </Box>
  </Button>
);

const SearchResultPanel = ({
  open,
  query,
  results,
  mt,
  getPinRoleLabel,
  onSelect,
}) => {
  if (!open || normalizeMapSearch(query).length < 2) return null;
  const empty = !results.locations.length && !results.people.length;
  return (
    <Paper
      elevation={10}
      sx={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: 'auto',
        right: 0,
        width: { xs: 280, sm: 360 },
        maxWidth: 'calc(100vw - 28px)',
        maxHeight: 430,
        overflowY: 'auto',
        borderRadius: 3,
        p: 1,
      }}
    >
      {!!results.locations.length && (
        <Typography
          variant={'overline'}
          color={'text.secondary'}
          sx={{ px: 1.25, fontWeight: 800 }}
        >
          Hududlar
        </Typography>
      )}
      {results.locations.map((result) => (
        <SearchResultRow
          key={`area-${result.level}-${result.item.id}`}
          icon={<LocationOn sx={{ color: '#0f766e' }} />}
          title={result.label}
          detail={
            result.detail ||
            `${{ 1: mt.region, 2: mt.district, 3: mt.mahalla }[result.level]}`
          }
          onClick={() => onSelect(result)}
        />
      ))}
      {!!results.locations.length && !!results.people.length && (
        <Divider sx={{ my: 0.75 }} />
      )}
      {!!results.people.length && (
        <Typography
          variant={'overline'}
          color={'text.secondary'}
          sx={{ px: 1.25, fontWeight: 800 }}
        >
          Adminlar, izlanuvchilar va assistantlar
        </Typography>
      )}
      {results.people.map((result, index) => (
        <SearchResultRow
          key={`person-${result.pin.id || result.pin.userId || index}`}
          icon={
            <Groups sx={{ color: PIN_COLORS[result.pin.type] || '#2563eb' }} />
          }
          title={result.pin.name || result.pin.email || '-'}
          chip={getPinRoleLabel(result.pin)}
          detail={[result.pin.district, result.pin.mahalla, result.pin.email]
            .filter(Boolean)
            .join(' · ')}
          onClick={() => onSelect(result)}
        />
      ))}
      {empty && (
        <Stack alignItems={'center'} spacing={0.75} sx={{ py: 3 }}>
          <Typography color={'text.disabled'} fontSize={24}>
            ⌕
          </Typography>
          <Typography variant={'body2'} fontWeight={700}>
            Natija topilmadi
          </Typography>
        </Stack>
      )}
    </Paper>
  );
};

const UnifiedMapSearch = (props) => (
  <Box
    onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) props.onClose();
    }}
    sx={{
      position: 'relative',
      zIndex: 20,
      width: { xs: 168, sm: 250 },
      maxWidth: 'calc(100vw - 86px)',
    }}
  >
    <TextField
      fullWidth
      value={props.query}
      onFocus={props.onOpen}
      onChange={(e) => props.onQueryChange(e.target.value)}
      placeholder={
        'Tuman, mahalla, admin, izlanuvchi yoki assistant qidiring...'
      }
      InputProps={{
        startAdornment: (
          <SearchIcon sx={{ mr: 0.75, color: 'primary.main', fontSize: 19 }} />
        ),
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          height: 40,
          borderRadius: 1.5,
          bgcolor: props.isDark ? 'rgba(15,23,42,.9)' : 'rgba(255,255,255,.94)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 24px rgba(15,23,42,.12)',
          fontSize: 13,
          '& fieldset': { borderColor: 'rgba(15,118,110,.3)' },
          '&.Mui-focused fieldset': {
            borderWidth: 2,
            borderColor: '#0f766e',
          },
        },
      }}
    />
    <SearchResultPanel {...props} />
  </Box>
);

export default function SuperAdminRegionalMap({
  stats,
  statsLoading,
  admins = [],
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { lang } = useLanguage();
  const mt = MAP_I18N[lang] || MAP_I18N.uz;
  const locale = localeByLang[lang] || 'uz-UZ';
  const mapContainerRef = useRef(null);
  const mapInteractionRef = useRef(null);
  const svgRef = useRef(null);
  const mapRef = useRef(null);
  const indexRef = useRef(null);
  const featureIdsByLevel = useRef({ 1: [], 2: [], 3: [] });
  const hoveredRef = useRef({ level: null, id: null });
  const hoveredSvgRef = useRef(null);
  const loadedFilesRef = useRef({});
  const level1GeoJsonRef = useRef(EMPTY_COLLECTION);
  const level3FeaturesRef = useRef([]);
  const panDragRef = useRef(null);
  const suppressSvgClickRef = useRef(false);
  const selectionRequestRef = useRef(0);

  const [mapMotion, setMapMotion] = useState({ type: 'idle', key: 0 });
  const [mapReady, setMapReady] = useState(false);
  const [boundaryIndex, setBoundaryIndex] = useState(null);
  const [visibleGeoJson, setVisibleGeoJson] = useState(EMPTY_COLLECTION);
  const [countryBbox, setCountryBbox] = useState(null);
  const [svgViewport, setSvgViewport] = useState({ scale: 1, x: 0, y: 0 });
  const [svgSelectedId, setSvgSelectedId] = useState('');
  const [svgHoveredId, setSvgHoveredId] = useState('');
  const [selected, setSelected] = useState(null);
  const [selectedPath, setSelectedPath] = useState({
    region: null,
    district: null,
    mahalla: null,
  });
  const [level3Features, setLevel3Features] = useState([]);
  const [userMahallaFeatures, setUserMahallaFeatures] = useState([]);
  const [selectedPin, setSelectedPin] = useState(null);
  const [pinPopupPosition, setPinPopupPosition] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [researchRecords, setResearchRecords] = useState([]);
  const [directoryUsers, setDirectoryUsers] = useState([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [loadingBoundary, setLoadingBoundary] = useState(false);
  const [mahallaSearchItems, setMahallaSearchItems] = useState([]);
  const [mahallaSearchLoaded, setMahallaSearchLoaded] = useState(false);
  const [satelliteEnabled, setSatelliteEnabled] = useState(false);
  const [metricLayer, setMetricLayer] = useState('risk');
  const [timeFilter, setTimeFilter] = useState('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [exportingMap, setExportingMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const userRows = directoryUsers.length ? directoryUsers : admins;

  const allRecords = useMemo(
    () => [
      ...userRows
        .filter((item) => item.role !== 'superadmin')
        .map((item) => ({
          ...item,
          __source: 'user',
          __type:
            item.role === 'researcher'
              ? 'researcher'
              : item.role === 'field_assistant'
                ? 'field_assistant'
                : 'admin',
        })),
      ...analyses.map((item) => ({
        ...item,
        __source: 'analysis',
        __type: 'analysis',
      })),
      ...researchRecords.map((item) => ({
        ...item,
        __source: 'research_record',
        __type: 'research_record',
      })),
    ],
    [analyses, researchRecords, userRows]
  );

  const filteredAllRecords = useMemo(
    () =>
      allRecords.filter((row) =>
        recordInTimeWindow(row, timeFilter, customDateFrom, customDateTo)
      ),
    [allRecords, customDateFrom, customDateTo, timeFilter]
  );

  useEffect(() => {
    level3FeaturesRef.current = level3Features;
  }, [level3Features]);

  const level1ByName = useMemo(() => {
    const map = new Map();
    (boundaryIndex?.levels?.['1'] || []).forEach((item) => {
      map.set(canonicalRegionName(featureName(item)), item);
    });
    return map;
  }, [boundaryIndex]);

  const level2ByRegionId = useMemo(() => {
    const map = new Map();
    (boundaryIndex?.levels?.['2'] || []).forEach((item) => {
      const key = String(item.parent_id);
      const current = map.get(key) || [];
      current.push(item);
      map.set(key, current);
    });
    return map;
  }, [boundaryIndex]);

  const resolveRegionBoundary = useCallback(
    (item, district = null) => {
      if (district) {
        return (
          (boundaryIndex?.levels?.['1'] || []).find(
            (feature) => String(feature.id) === String(district.parent_id)
          ) || null
        );
      }

      const directRegion =
        item.region &&
        (level1ByName.get(canonicalRegionName(item.region)) ||
          (boundaryIndex?.levels?.['1'] || []).find((feature) =>
            locationMatches(featureName(feature), item.region)
          ));
      if (directRegion) return directRegion;

      return findBestBoundaryMatch(
        boundaryIndex?.levels?.['1'] || [],
        item,
        850
      );
    },
    [boundaryIndex, level1ByName]
  );

  const resolveDistrictBoundary = useCallback(
    (item, region = null) => {
      const pool = region
        ? level2ByRegionId.get(String(region.id)) || []
        : boundaryIndex?.levels?.['2'] || [];

      const directDistrict =
        item.district &&
        (pool.find((feature) =>
          locationMatches(featureName(feature), item.district)
        ) ||
          (boundaryIndex?.levels?.['2'] || []).find((feature) =>
            locationMatches(featureName(feature), item.district)
          ));
      if (directDistrict) return directDistrict;

      return (
        findBestBoundaryMatch(pool, item, 900) ||
        (!region
          ? null
          : findBestBoundaryMatch(
              boundaryIndex?.levels?.['2'] || [],
              item,
              980
            ))
      );
    },
    [boundaryIndex, level2ByRegionId]
  );

  const resolveMahallaBoundary = useCallback(
    (item, district = null, mahallaFeatures = userMahallaFeatures) => {
      const pool = (mahallaFeatures || []).filter(
        (feature) =>
          !district ||
          String(feature.properties?.parent_id) === String(district.id)
      );
      if (!pool.length) return null;

      const directMahalla = item.mahalla
        ? pool.find((feature) =>
            locationMatches(
              featureName(feature.properties || feature),
              item.mahalla
            )
          )
        : null;
      if (directMahalla) return directMahalla;

      return findBestBoundaryMatch(pool, item, 980);
    },
    [userMahallaFeatures]
  );

  const loadBoundaryFile = useCallback(async (level, path) => {
    if (!path) return EMPTY_COLLECTION;
    const cacheKey = `${level}:${path}`;
    if (loadedFilesRef.current[cacheKey])
      return loadedFilesRef.current[cacheKey];
    setLoadingBoundary(true);
    try {
      const data = await fetch(`${BOUNDARY_BASE}/${path}`).then((response) =>
        response.json()
      );
      data.features = (data.features || []).map((feature) => {
        const bbox = getFeatureBounds(feature);
        return {
          ...feature,
          id: feature.properties?.boundary_id || feature.id,
          bbox,
          properties: {
            ...feature.properties,
            bbox,
            center:
              feature.properties?.center ||
              (bbox
                ? [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]
                : undefined),
          },
        };
      });
      loadedFilesRef.current[cacheKey] = data;
      return data;
    } finally {
      setLoadingBoundary(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    if (mahallaSearchLoaded || normalizeMapSearch(searchQuery).length < 2) {
      return undefined;
    }

    fetch(`${BOUNDARY_BASE}/level3-search-index.json`)
      .then((response) => response.json())
      .then((data) => {
        if (!mounted) return;
        setMahallaSearchItems(Array.isArray(data?.items) ? data.items : []);
        setMahallaSearchLoaded(true);
      })
      .catch((error) => {
        console.error('Mahalla search index error:', error);
        if (mounted) setMahallaSearchLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, [mahallaSearchLoaded, searchQuery]);
  useEffect(() => {
    let mounted = true;
    if (!boundaryIndex?.levels?.['2']?.length || !boundaryIndex?.files?.['3'])
      return undefined;

    const preloadMahallaFiles = async () => {
      const districtIds = [
        ...new Set(
          allRecords
            .filter(
              (item) =>
                item.__source === 'user' &&
                ['admin', 'researcher', 'field_assistant'].includes(
                  item.__type
                ) &&
                !normalizeLngLat(
                  Number(item.longitude ?? item.lon ?? item.lng),
                  Number(item.latitude ?? item.lat)
                )
            )
            .map((item) => {
              const locationItem = normalizeLocationItem(item);
              const district = resolveDistrictBoundary(
                locationItem,
                resolveRegionBoundary(locationItem)
              );
              return district?.id;
            })
            .filter(Boolean)
        ),
      ];

      if (!districtIds.length) {
        if (mounted) setUserMahallaFeatures([]);
        return;
      }

      const collections = await Promise.all(
        districtIds.map(async (districtId) => {
          const path =
            boundaryIndex.files?.['3']?.[String(districtId)] ||
            `level3/${districtId}.geojson`;
          return loadBoundaryFile(3, path);
        })
      );

      if (!mounted) return;
      setUserMahallaFeatures(
        collections.flatMap((collection) => collection?.features || [])
      );
    };

    preloadMahallaFiles();
    return () => {
      mounted = false;
    };
  }, [
    allRecords,
    boundaryIndex,
    loadBoundaryFile,
    resolveDistrictBoundary,
    resolveRegionBoundary,
  ]);

  const selectedRecords = useMemo(() => {
    if (!selected) return filteredAllRecords;
    const level = Number(selected.admin_leve || selected.admin_level || 1);
    const props = selected.properties || selected || {};
    const { parentRegion, parentDistrict } = getBoundaryContext(
      level,
      props,
      selectedPath,
      boundaryIndex
    );

    return filteredAllRecords.filter((record) =>
      recordMatchesBoundary(record, level, props, parentRegion, parentDistrict)
    );
  }, [filteredAllRecords, selected, selectedPath, boundaryIndex]);

  const calculateBoundaryStats = useCallback(
    (featureOrItem) => {
      const props = featureOrItem?.properties || featureOrItem || {};
      const level = Number(props.admin_leve || props.admin_level || 1);
      const { parentRegion, parentDistrict } = getBoundaryContext(
        level,
        props,
        selectedPath,
        boundaryIndex
      );
      const scopedRecords = filteredAllRecords.filter((record) =>
        recordMatchesBoundary(
          record,
          level,
          props,
          parentRegion,
          parentDistrict
        )
      );
      const clinicalRows = scopedRecords.filter(
        (record) =>
          record.__source === 'analysis' ||
          record.__source === 'research_record'
      );
      const bmiValues = clinicalRows.map(getBmiValue).filter(Number.isFinite);
      const zValues = clinicalRows.map(getZValue).filter(Number.isFinite);
      const riskRows = clinicalRows.filter(isRiskRecord);
      const reasonCounts = clinicalRows.reduce(
        (acc, row) => {
          const reasons = getRiskReasons(row);
          Object.entries(reasons).forEach(([key, active]) => {
            if (active) acc[key] += 1;
          });
          return acc;
        },
        { underweight: 0, overweight: 0, obese: 0, zLow: 0, zHigh: 0 }
      );
      const latestDate = clinicalRows
        .map(getRecordDate)
        .filter(Boolean)
        .sort((a, b) => b - a)[0];
      const recentStart = getTimeWindowStart('30d');
      const hasRecent =
        latestDate && recentStart ? latestDate >= recentStart : false;
      const adminCount = scopedRecords.filter(
        (record) => record.__type === 'admin'
      ).length;
      const researcherCount = scopedRecords.filter(
        (record) => record.__type === 'researcher'
      ).length;
      const zRiskCount = zValues.filter(
        (value) => value < -2 || value > 2
      ).length;
      const statsValue = {
        patientCount: clinicalRows.length,
        riskCount: riskRows.length,
        riskRate: pct(riskRows.length, clinicalRows.length),
        avgBmi: average(bmiValues),
        avgZ: average(zValues),
        zRiskCount,
        zRiskRate: pct(zRiskCount, zValues.length),
        adminCount,
        researcherCount,
        activityCount: adminCount + researcherCount,
        latestDate,
        hasRecent,
        reasonCounts,
      };
      statsValue.coverageQuality = Math.min(
        100,
        (statsValue.patientCount > 0 ? 40 : 0) +
          (statsValue.adminCount > 0 ? 20 : 0) +
          (statsValue.researcherCount > 0 ? 20 : 0) +
          (statsValue.hasRecent ? 20 : 0)
      );
      statsValue.metricColor = getMetricColor(metricLayer, statsValue);
      return statsValue;
    },
    [boundaryIndex, filteredAllRecords, metricLayer, selectedPath]
  );
  const selectedBoundaryStats = useMemo(() => {
    if (selected) return calculateBoundaryStats(selected);
    const clinicalRows = selectedRecords.filter(
      (row) => row.__source === 'analysis' || row.__source === 'research_record'
    );
    const bmiValues = clinicalRows.map(getBmiValue).filter(Number.isFinite);
    const zValues = clinicalRows.map(getZValue).filter(Number.isFinite);
    const riskRows = clinicalRows.filter(isRiskRecord);
    const reasonCounts = clinicalRows.reduce(
      (acc, row) => {
        const reasons = getRiskReasons(row);
        Object.entries(reasons).forEach(([key, active]) => {
          if (active) acc[key] += 1;
        });
        return acc;
      },
      { underweight: 0, overweight: 0, obese: 0, zLow: 0, zHigh: 0 }
    );
    const latestDate = clinicalRows
      .map(getRecordDate)
      .filter(Boolean)
      .sort((a, b) => b - a)[0];
    const recentStart = getTimeWindowStart('30d');
    const adminCount = selectedRecords.filter(
      (row) => row.__type === 'admin'
    ).length;
    const researcherCount = selectedRecords.filter(
      (row) => row.__type === 'researcher'
    ).length;
    const zRiskCount = zValues.filter(
      (value) => value < -2 || value > 2
    ).length;
    const statsValue = {
      patientCount: clinicalRows.length,
      riskCount: riskRows.length,
      riskRate: pct(riskRows.length, clinicalRows.length),
      avgBmi: average(bmiValues),
      avgZ: average(zValues),
      zRiskCount,
      zRiskRate: pct(zRiskCount, zValues.length),
      adminCount,
      researcherCount,
      activityCount: adminCount + researcherCount,
      latestDate,
      hasRecent: latestDate && recentStart ? latestDate >= recentStart : false,
      reasonCounts,
    };
    statsValue.coverageQuality = Math.min(
      100,
      (statsValue.patientCount > 0 ? 40 : 0) +
        (statsValue.adminCount > 0 ? 20 : 0) +
        (statsValue.researcherCount > 0 ? 20 : 0) +
        (statsValue.hasRecent ? 20 : 0)
    );
    statsValue.metricColor = getMetricColor(metricLayer, statsValue);
    return statsValue;
  }, [calculateBoundaryStats, metricLayer, selected, selectedRecords]);

  const selectedMetric = useMemo(() => {
    const analyses = selectedRecords.filter(
      (row) => row.__type === 'analysis'
    ).length;
    return {
      analyses,
      admins: selectedBoundaryStats.adminCount || 0,
      researchers: selectedBoundaryStats.researcherCount || 0,
      risk: selectedBoundaryStats.riskCount || 0,
      riskRate: selectedBoundaryStats.riskRate || 0,
    };
  }, [selectedBoundaryStats, selectedRecords]);

  const selectedAreaSquareMeters = useMemo(() => {
    if (!selected) return 0;
    const selectedId = String(
      selected.boundary_id || `admin-${selected.admin_leve}-${selected.id}`
    );
    const selectedRawId = String(selected.id);
    const collections = [
      visibleGeoJson,
      level1GeoJsonRef.current,
      ...Object.values(loadedFilesRef.current || {}),
    ];
    const matchedFeature = collections
      .flatMap((collection) => collection?.features || [])
      .find((feature) => {
        const props = feature.properties || {};
        return (
          String(props.boundary_id || feature.id) === selectedId ||
          String(props.id) === selectedRawId
        );
      });
    const areaFromGeometry =
      geometryAreaSquareMeters(selected.geometry) ||
      geometryAreaSquareMeters(matchedFeature?.geometry);
    if (areaFromGeometry > 0) return areaFromGeometry;
    const fallbackArea = Number(
      selected.total_area || selected.area || matchedFeature?.properties?.area
    );
    return Number.isFinite(fallbackArea) && fallbackArea > 0 ? fallbackArea : 0;
  }, [selected, visibleGeoJson]);

  const getBoundaryPatientCount = useCallback(
    (featureOrItem) => calculateBoundaryStats(featureOrItem).patientCount,
    [calculateBoundaryStats]
  );
  const enrichBoundaryPatientData = useCallback(
    (geoJson = EMPTY_COLLECTION) => ({
      ...geoJson,
      features: (geoJson.features || []).map((feature) => {
        const metricStats = calculateBoundaryStats(feature);
        const patientCount = getBoundaryPatientCount(feature);
        return {
          ...feature,
          properties: {
            ...feature.properties,
            patient_count: patientCount,
            has_patient_data: patientCount > 0,
            risk_count: metricStats.riskCount,
            risk_rate: metricStats.riskRate,
            avg_bmi: metricStats.avgBmi,
            avg_z: metricStats.avgZ,
            z_risk_count: metricStats.zRiskCount,
            z_risk_rate: metricStats.zRiskRate,
            admin_count: metricStats.adminCount,
            researcher_count: metricStats.researcherCount,
            coverage_quality: metricStats.coverageQuality,
            latest_analysis: metricStats.latestDate
              ? metricStats.latestDate.toISOString()
              : '',
            metric_color: metricStats.metricColor || '',
          },
        };
      }),
    }),
    [calculateBoundaryStats, getBoundaryPatientCount]
  );

  const enrichedVisibleGeoJson = useMemo(
    () => enrichBoundaryPatientData(visibleGeoJson),
    [enrichBoundaryPatientData, visibleGeoJson]
  );

  const pinFeatures = useMemo(() => {
    const counters = {};
    const rows = allRecords
      .filter(
        (item) =>
          item.__source === 'user' &&
          ['admin', 'researcher', 'field_assistant'].includes(item.__type)
      )
      .map((item) => {
        const locationItem = normalizeLocationItem(item);
        const district = resolveDistrictBoundary(
          locationItem,
          resolveRegionBoundary(locationItem)
        );
        const region = resolveRegionBoundary(locationItem, district);
        const mahallaFeature = resolveMahallaBoundary(locationItem, district);
        const mahalla = mahallaFeature
          ? {
              ...mahallaFeature.properties,
              bbox: mahallaFeature.bbox || mahallaFeature.properties?.bbox,
              geometry: mahallaFeature.geometry,
            }
          : null;
        const fallbackBoundary = mahalla || district || region;
        const fallbackCenter = fallbackBoundary
          ? mahalla || district
            ? getCenter(fallbackBoundary)
            : distributedPointInBoundary(
                fallbackBoundary,
                `${item.__type}-${item.id || item.email || item.name || locationItem.__locationText}`
              )
          : null;
        const rawLng = Number(item.longitude ?? item.lon ?? item.lng);
        const rawLat = Number(item.latitude ?? item.lat);
        const normalizedCoordinates =
          normalizeLngLat(rawLng, rawLat) ||
          coordinatesFromText(locationItem.__locationText);
        const hasCoordinates = Boolean(normalizedCoordinates);
        if (!hasCoordinates && !fallbackCenter) return null;
        const groupKey = hasCoordinates
          ? `${normalizedCoordinates[0].toFixed(4)}:${normalizedCoordinates[1].toFixed(4)}:${item.__type}`
          : `${fallbackBoundary?.boundary_id || fallbackBoundary?.id || 'unknown'}:${item.__type}`;
        return {
          item,
          region,
          district,
          mahalla,
          fallbackCenter,
          normalizedCoordinates,
          hasCoordinates,
          groupKey,
        };
      })
      .filter(Boolean);

    const groupTotals = rows.reduce((acc, row) => {
      acc[row.groupKey] = (acc[row.groupKey] || 0) + 1;
      return acc;
    }, {});

    return rows
      .map(
        ({
          item,
          region,
          district,
          mahalla,
          fallbackCenter,
          normalizedCoordinates,
          hasCoordinates,
          groupKey,
        }) => {
          counters[groupKey] = (counters[groupKey] || 0) + 1;
          const groupIndex = counters[groupKey] - 1;
          const groupTotal = groupTotals[groupKey] || 1;
          const coordinates = hasCoordinates
            ? spreadPoint(normalizedCoordinates, groupIndex, groupTotal, 35)
            : spreadPoint(fallbackCenter, groupIndex, groupTotal, 220);
          const avgEntryTime =
            item.avg_entry_time ??
            (item.total_entry_time_seconds && item.completed_entries_count
              ? Math.round(
                  item.total_entry_time_seconds / item.completed_entries_count
                )
              : '');
          return {
            type: 'Feature',
            geometry: { type: 'Point', coordinates },
            properties: {
              id: `${item.__type}-${item.id || item.email || counters[groupKey]}`,
              userId: item.__source === 'user' ? item.id : null,
              type: item.__type,
              name:
                item.name || item.full_name || item.id_code || mt.notSpecified,
              email: item.email || '',
              phone: item.phone || item.parents_phone || '',
              region:
                item.region ||
                (region
                  ? localizedFeatureName(region, lang)
                  : mt.regionNotSpecified),
              district:
                item.district ||
                (district ? localizedFeatureName(district, lang) : ''),
              mahalla:
                item.mahalla ||
                (mahalla ? localizedFeatureName(mahalla, lang) : ''),
              role: item.role || item.__type,
              address:
                item.address || item.settlement || item.school_name || '',
              status: item.status || '',
              lastActiveAt: item.last_active_at || item.lastActiveAt || '',
              createdAt: item.created_at || item.createdAt || '',
              statsToday: item.stats_today ?? '',
              statsMonth: item.stats_month ?? '',
              totalEntries:
                item.total_entries ?? item.completed_entries_count ?? '',
              avgEntryTime,
              mostActiveHour: item.most_active_hour || '',
              sourceRegionMatched: Boolean(region),
              groupIndex: groupIndex + 1,
              groupTotal,
              originalLatitude: hasCoordinates ? normalizedCoordinates[1] : '',
              originalLongitude: hasCoordinates ? normalizedCoordinates[0] : '',
              latitude: hasCoordinates
                ? normalizedCoordinates[1]
                : (fallbackCenter?.[1] ?? ''),
              longitude: hasCoordinates
                ? normalizedCoordinates[0]
                : (fallbackCenter?.[0] ?? ''),
              displayLatitude: coordinates[1],
              displayLongitude: coordinates[0],
            },
          };
        }
      )
      .filter(Boolean);
  }, [
    allRecords,
    lang,
    mt.notSpecified,
    mt.regionNotSpecified,
    resolveDistrictBoundary,
    resolveMahallaBoundary,
    resolveRegionBoundary,
  ]);

  const pinsGeoJson = useMemo(
    () => ({ type: 'FeatureCollection', features: pinFeatures }),
    [pinFeatures]
  );

  const searchResults = useMemo(() => {
    const query = normalizeMapSearch(searchQuery);
    if (query.length < 2) return { locations: [], people: [] };

    const level1ById = new Map(
      (boundaryIndex?.levels?.['1'] || []).map((item) => [
        String(item.id),
        item,
      ])
    );
    const level2ById = new Map(
      (boundaryIndex?.levels?.['2'] || []).map((item) => [
        String(item.id),
        item,
      ])
    );
    const getLocationResultDetail = (level, item) => {
      const levelLabel = { 1: mt.region, 2: mt.district, 3: mt.mahalla }[level];
      if (level === 1) return levelLabel;

      const district =
        level === 3 ? level2ById.get(String(item.parent_id)) : item;
      const region =
        level === 2
          ? level1ById.get(String(item.parent_id))
          : level1ById.get(String(district?.parent_id));
      const pathLabel = [region, level === 3 ? district : null]
        .filter(Boolean)
        .map((parent) => localizedFeatureName(parent, lang))
        .join(' / ');

      return [levelLabel, pathLabel].filter(Boolean).join(' - ');
    };

    const indexedLocations = [1, 2].flatMap((level) =>
      (boundaryIndex?.levels?.[String(level)] || []).map((item) => ({
        level,
        item,
        label: localizedFeatureName(item, lang),
        detail: getLocationResultDetail(level, item),
      }))
    );
    const mahallaLocations = mahallaSearchItems.map((item) => ({
      level: 3,
      item,
      label: localizedFeatureName(item, lang),
      detail: getLocationResultDetail(3, item),
    }));

    const locations = [...indexedLocations, ...mahallaLocations]
      .map((result) => ({
        ...result,
        haystack: normalizeMapSearch(
          [
            result.label,
            result.detail,
            result.item?.name_uz,
            result.item?.display_name,
            result.item?.name_ru,
            result.item?.name_cyril,
            result.item?.name_en,
          ].join(' ')
        ),
      }))
      .filter((result) => result.haystack.includes(query))
      .sort((a, b) => {
        const aName = normalizeMapSearch(a.label);
        const bName = normalizeMapSearch(b.label);
        return (
          Number(bName.startsWith(query)) - Number(aName.startsWith(query)) ||
          Number(b.haystack.startsWith(query)) -
            Number(a.haystack.startsWith(query)) ||
          a.level - b.level ||
          aName.localeCompare(bName)
        );
      })
      .slice(0, 8);
    const people = pinFeatures
      .map((pin) => {
        const props = pin.properties || {};
        const haystack = normalizeMapSearch(
          [
            props.name,
            props.email,
            props.phone,
            props.type,
            props.role,
            props.region,
            props.district,
            props.mahalla,
          ].join(' ')
        );
        return { pin: props, haystack };
      })
      .filter((result) => result.haystack.includes(query))
      .sort(
        (a, b) =>
          Number(b.haystack.startsWith(query)) -
          Number(a.haystack.startsWith(query))
      )
      .slice(0, 8);

    return { locations, people };
  }, [
    boundaryIndex,
    lang,
    mahallaSearchItems,
    mt.district,
    mt.mahalla,
    mt.region,
    pinFeatures,
    searchQuery,
  ]);

  const svgMap = useMemo(() => {
    const features = [...(enrichedVisibleGeoJson?.features || [])].sort(
      (a, b) =>
        bboxArea(b.bbox || b.properties?.bbox) -
        bboxArea(a.bbox || a.properties?.bbox)
    );
    // The selected boundary is the camera frame. Child files can be incomplete
    // or delayed, so using their aggregate bounds can leave a chosen city far away.
    const focusedBbox = selected
      ? parseMaybeJson(selected.bbox) || getGeometryBounds(selected.geometry)
      : null;
    const bbox =
      focusedBbox || countryBbox || getCollectionBounds(enrichedVisibleGeoJson);
    const project = createProjector(bbox);
    return { features, project };
  }, [countryBbox, enrichedVisibleGeoJson, selected]);

  const mapColors = useMemo(
    () => ({
      background: isDark ? '#0b1620' : '#eef3f0',
      label: isDark ? '#e7edf3' : '#21303f',
      labelHalo: isDark ? 'rgba(11,22,32,0.92)' : 'rgba(255,255,255,0.94)',
      region: isDark ? '#2d6f73' : '#6f9f8d',
      regionHover: isDark ? '#3e8a8f' : '#5a8d7b',
      district: isDark ? '#496f9b' : '#86a6c9',
      districtHover: isDark ? '#5c84b4' : '#6f92ba',
      mahalla: isDark ? '#8b7651' : '#c7ae78',
      mahallaHover: isDark ? '#a48e65' : '#b49a63',
      patient: PATIENT_BOUNDARY_COLOR,
      patientHover: PATIENT_BOUNDARY_HOVER,
      selected: isDark ? '#d86645' : '#d95f4a',
      stroke: isDark ? 'rgba(238,243,240,0.76)' : 'rgba(255,255,255,0.88)',
    }),
    [isDark]
  );

  const getSvgFill = useCallback(
    (level, active, hovered, patientCount = 0, metricColor = '') => {
      if (active) return mapColors.selected;
      if (metricColor) return hovered ? mapColors.selected : metricColor;
      if (patientCount > 0)
        return hovered ? mapColors.patientHover : mapColors.patient;
      if (level === 1)
        return hovered ? mapColors.regionHover : mapColors.region;
      if (level === 2)
        return hovered ? mapColors.districtHover : mapColors.district;
      return hovered ? mapColors.mahallaHover : mapColors.mahalla;
    },
    [mapColors]
  );

  const svgLabels = useMemo(() => {
    const scale = Math.max(svgViewport.scale || 1, 1);
    return svgMap.features
      .map((feature) => {
        const props = feature.properties || {};
        const level = Number(props.admin_leve || 1);
        const bbox = parseMaybeJson(props.bbox || feature.bbox);
        if (!Array.isArray(bbox) || bbox.length !== 4) return null;
        const center = parseMaybeJson(props.center) || getCenter({ bbox });
        if (!Array.isArray(center)) return null;
        const [x, y] = svgMap.project(center);
        const [x1, y1] = svgMap.project([bbox[0], bbox[1]]);
        const [x2, y2] = svgMap.project([bbox[2], bbox[3]]);
        const boxWidth = Math.abs(x2 - x1);
        const boxHeight = Math.abs(y2 - y1);
        const shortSide = Math.min(boxWidth, boxHeight);
        const active = (props.boundary_id || feature.id) === svgSelectedId;
        const rawLabel = localizedFeatureName(props, lang);
        const label =
          rawLabel.length > 22 ? `${rawLabel.slice(0, 21)}...` : rawLabel;
        const screenSize = active
          ? 13
          : level === 1
            ? 12
            : level === 2
              ? 10.5
              : 8.5;
        const maxByBox = Math.min(
          shortSide * 0.5,
          (boxWidth * 0.96) / Math.max(label.length * 0.52, 1)
        );
        const size = Math.min(screenSize / scale, maxByBox);
        const visualWidth = boxWidth * scale;
        const visualHeight = boxHeight * scale;
        const visualSize = size * scale;
        const minVisible = active
          ? 4.5
          : level === 1
            ? 4.2
            : level === 2
              ? 3.8
              : 3.2;
        if (visualSize < minVisible || visualWidth < 18 || visualHeight < 8)
          return null;
        return {
          id: props.boundary_id || feature.id,
          x,
          y,
          level,
          active,
          label,
          size,
        };
      })
      .filter(Boolean);
  }, [lang, svgMap, svgSelectedId, svgViewport.scale]);

  const mapLabelGeoJson = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: (enrichedVisibleGeoJson?.features || [])
        .map((feature) => {
          const props = feature.properties || {};
          const bbox = parseMaybeJson(props.bbox || feature.bbox);
          const center = parseMaybeJson(props.center) || getCenter({ bbox });
          if (!Array.isArray(center) || center.length < 2) return null;
          const level = Number(props.admin_leve || 1);
          const label = localizedFeatureName(props, lang);
          if (!label) return null;
          return {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: center },
            properties: {
              id: props.boundary_id || feature.id,
              label,
              level,
              active: (props.boundary_id || feature.id) === svgSelectedId,
            },
          };
        })
        .filter(Boolean),
    }),
    [enrichedVisibleGeoJson, lang, svgSelectedId]
  );

  const setSourceData = useCallback((level, geoJson, makeVisible = true) => {
    const map = mapRef.current;
    if (makeVisible && (level === 1 || level === 2 || level === 3)) {
      setVisibleGeoJson(geoJson || EMPTY_COLLECTION);
    }
    const source = map?.getSource(LEVEL_META[level].source);
    if (!source) {
      console.warn(`Map source is not ready for admin level ${level}`);
      return;
    }
    featureIdsByLevel.current[level] = (geoJson.features || []).map(
      (feature) => {
        const id = feature.properties?.boundary_id || feature.id;
        const bbox = getFeatureBounds(feature);
        feature.id = id;
        feature.bbox = bbox;
        feature.properties = {
          ...feature.properties,
          bbox,
          center:
            feature.properties?.center ||
            (bbox
              ? [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]
              : undefined),
        };
        return id;
      }
    );
    source.setData(geoJson);
    if (level === 1 && map.getLayer(LEVEL_META[1].fill)) {
      map.setLayoutProperty(LEVEL_META[1].fill, 'visibility', 'visible');
      map.setLayoutProperty(LEVEL_META[1].line, 'visibility', 'visible');
    }
  }, []);

  const fitToBoundary = useCallback((item, fallbackZoom) => {
    const map = mapRef.current;
    if (!map || !item) return;
    const bounds =
      getBounds(item.bbox) || getBounds(getGeometryBounds(item.geometry));
    map.stop();
    if (bounds) {
      map.fitBounds(bounds, {
        padding: { top: 46, bottom: 46, left: 46, right: 46 },
        duration: 1150,
        easing: MAP_CAMERA_EASING,
        essential: true,
        // Compact level-1 boundaries such as Tashkent city need a closer fit.
        maxZoom: Math.max(fallbackZoom, 12),
      });
    } else {
      map.easeTo({
        center: getCenter(item),
        zoom: fallbackZoom,
        duration: 1050,
        easing: MAP_CAMERA_EASING,
        essential: true,
      });
    }
  }, []);

  const selectBoundary = useCallback(
    async (item, level) => {
      if (!item || !indexRef.current) return;
      const requestId = ++selectionRequestRef.current;
      if (level === 3 && !item.geometry) {
        const path =
          item.file ||
          indexRef.current.files?.['3']?.[String(item.parent_id)] ||
          `level3/${item.parent_id}.geojson`;
        const geoJson = await loadBoundaryFile(3, path);
        if (requestId !== selectionRequestRef.current) return;
        const matchedFeature = (geoJson.features || []).find((feature) => {
          const props = feature.properties || {};
          return (
            String(props.boundary_id || feature.id) ===
              String(item.boundary_id || item.id) ||
            String(props.id) === String(item.id)
          );
        });
        if (matchedFeature) {
          const props = matchedFeature.properties || {};
          item = {
            ...props,
            id: Number(props.id ?? item.id),
            parent_id: Number(props.parent_id ?? item.parent_id),
            admin_leve: 3,
            boundary_id: props.boundary_id || matchedFeature.id,
            bbox: matchedFeature.bbox || props.bbox,
            center: props.center,
            geometry: matchedFeature.geometry,
            file: path,
          };
        }
      }
      setMapMotion({ type: 'in', key: Date.now() });
      const map = mapRef.current;
      if (map?.getSource(LEVEL_META[level].source)) {
        clearLayerSelection(map, featureIdsByLevel, 1);
        clearLayerSelection(map, featureIdsByLevel, 2);
        clearLayerSelection(map, featureIdsByLevel, 3);
      }

      const boundaryId = item.boundary_id || `admin-${level}-${item.id}`;
      setSvgSelectedId(boundaryId);
      if (map?.getSource(LEVEL_META[level].source)) {
        map.setFeatureState(
          { source: LEVEL_META[level].source, id: boundaryId },
          { selected: true }
        );
      }

      setSelected({ ...item, admin_leve: level, boundary_id: boundaryId });
      setSelectedPin(null);
      let focusItem = item;
      let focusLevel = level;

      if (level === 1) {
        setSelectedPath({ region: item, district: null, mahalla: null });
        setLevel3Features([]);
        setSourceData(3, EMPTY_COLLECTION, false);
        const path =
          indexRef.current.files?.['2']?.[String(item.id)] ||
          `level2/${item.id}.geojson`;
        const geoJson = await loadBoundaryFile(2, path);
        if (requestId !== selectionRequestRef.current) return;
        setSourceData(2, geoJson);
        setVisibleGeoJson(geoJson);
        setSvgViewport({ scale: 1, x: 0, y: 0 });
        setSvgHoveredId('');
      }

      if (level === 2) {
        const region = (indexRef.current.levels?.['1'] || []).find(
          (regionItem) => String(regionItem.id) === String(item.parent_id)
        );
        setSelectedPath({ region, district: item, mahalla: null });
        const path =
          indexRef.current.files?.['3']?.[String(item.id)] ||
          `level3/${item.id}.geojson`;
        const geoJson = await loadBoundaryFile(3, path);
        if (requestId !== selectionRequestRef.current) return;
        setLevel3Features(geoJson.features || []);
        setSourceData(3, geoJson);
        setVisibleGeoJson(geoJson);
        setSvgViewport({ scale: 1, x: 0, y: 0 });
      }

      if (level === 3) {
        const district = (indexRef.current.levels?.['2'] || []).find(
          (districtItem) => String(districtItem.id) === String(item.parent_id)
        );
        const region = (indexRef.current.levels?.['1'] || []).find(
          (regionItem) => String(regionItem.id) === String(district?.parent_id)
        );
        setSelectedPath({ region, district, mahalla: item });
        focusItem = item;
        focusLevel = 3;
        const selectedFeature = featureFromItem(item);
        if (selectedFeature) {
          setVisibleGeoJson(collectionFromFeatures([selectedFeature]));
        }
        setSvgViewport({ scale: 1, x: 0, y: 0 });
      }

      fitToBoundary(focusItem, LEVEL_META[focusLevel].zoom);
    },
    [fitToBoundary, loadBoundaryFile, setSourceData]
  );

  const handleSearchResult = useCallback(
    async (result) => {
      setSearchOpen(false);
      setSearchQuery(
        result.label || result.pin?.name || result.pin?.email || ''
      );

      if (result.item) {
        await selectBoundary(result.item, result.level);
        return;
      }

      const pin = result.pin;
      if (!pin) return;
      const region = resolveRegionBoundary(pin);
      const district = resolveDistrictBoundary(pin, region);
      const mahalla = resolveMahallaBoundary(
        pin,
        district,
        userMahallaFeatures
      );
      const boundary = mahalla || district || region;
      const level = mahalla ? 3 : district ? 2 : region ? 1 : 0;
      if (boundary && level) await selectBoundary(boundary, level);
      setSelectedPin(pin);
      setPinPopupPosition({ left: 290, top: 115 });
      if (!boundary && mapRef.current && pin.longitude && pin.latitude) {
        mapRef.current.easeTo({
          center: [Number(pin.longitude), Number(pin.latitude)],
          zoom: 12,
          duration: 1050,
          easing: MAP_CAMERA_EASING,
          essential: true,
        });
      }
    },
    [
      resolveDistrictBoundary,
      resolveMahallaBoundary,
      resolveRegionBoundary,
      selectBoundary,
      userMahallaFeatures,
    ]
  );

  const resetToCountry = useCallback(() => {
    selectionRequestRef.current += 1;
    setMapMotion({ type: 'out', key: Date.now() });
    setSelected(null);
    setSelectedPin(null);
    setPinPopupPosition(null);
    setSelectedPath({ region: null, district: null, mahalla: null });
    setSvgSelectedId('');
    setSvgHoveredId('');
    hoveredSvgRef.current = null;
    setLevel3Features([]);
    setSvgViewport({ scale: 1, x: 0, y: 0 });
    setSourceData(1, level1GeoJsonRef.current || EMPTY_COLLECTION);
    setSourceData(2, EMPTY_COLLECTION, false);
    setSourceData(3, EMPTY_COLLECTION, false);
    const fullBounds = getBounds(getCollectionBounds(level1GeoJsonRef.current));
    if (fullBounds && mapRef.current) {
      mapRef.current.stop();
      mapRef.current.fitBounds(fullBounds, {
        padding: 26,
        duration: 1100,
        easing: MAP_CAMERA_EASING,
        essential: true,
        maxZoom: 5.1,
      });
    } else {
      mapRef.current?.stop();
      mapRef.current?.easeTo({
        center: [64.5853, 41.3775],
        zoom: 4.65,
        duration: 1050,
        easing: MAP_CAMERA_EASING,
        essential: true,
      });
    }
  }, [setSourceData]);

  const loadRows = useCallback(async () => {
    setLoadingRows(true);
    try {
      const [analysisResult, researchResult, userResult] =
        await Promise.allSettled([
          AdminApi.analyses.list({ page: 1, page_size: 200, pageSize: 200 }),
          ResearchApi.list({ page: 1, page_size: 200, pageSize: 200 }),
          loadAllUsers(),
        ]);
      if (analysisResult.status === 'fulfilled') {
        setAnalyses(normalizeListResponse(analysisResult.value));
      }
      if (researchResult.status === 'fulfilled') {
        setResearchRecords(normalizeListResponse(researchResult.value));
      }
      if (userResult.status === 'fulfilled') {
        setDirectoryUsers(normalizeListResponse(userResult.value));
      }
    } catch (error) {
      console.error('Regional map rows error:', error);
    } finally {
      setLoadingRows(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    let mounted = true;
    const refreshUsers = async () => {
      try {
        const users = await loadAllUsers();
        if (mounted) setDirectoryUsers(normalizeListResponse(users));
      } catch {
        // Live user refresh is best-effort; keep the current map data.
      }
    };
    const intervalId = window.setInterval(refreshUsers, 20000);
    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch(`${BOUNDARY_BASE}/index.json`).then((response) => response.json()),
      fetch(`${BOUNDARY_BASE}/level1-preview.geojson`).then((response) =>
        response.json()
      ),
    ])
      .then(([index, level1]) => {
        if (!mounted) return;
        indexRef.current = index;
        level1GeoJsonRef.current = level1;
        setCountryBbox(getCollectionBounds(level1));
        setBoundaryIndex(index);
        setVisibleGeoJson(level1);
        setMapReady(true);
      })
      .catch((error) => {
        console.error('Boundary preview load error:', error);
        if (mounted) setMapReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      center: [64.5853, 41.3775],
      zoom: 4.65,
      minZoom: 4,
      maxZoom: SATELLITE_MAX_ZOOM,
      attributionControl: false,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          [GOOGLE_SATELLITE_SOURCE]: {
            type: 'raster',
            tiles: ['https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'],
            tileSize: 256,
            maxzoom: SATELLITE_MAX_ZOOM,
            attribution: 'Imagery © Google',
          },
        },
        layers: [
          {
            id: 'map-background',
            type: 'background',
            paint: {
              'background-color': mapColors.background,
            },
          },
          {
            id: GOOGLE_SATELLITE_LAYER,
            type: 'raster',
            source: GOOGLE_SATELLITE_SOURCE,
            layout: { visibility: 'none' },
            paint: { 'raster-opacity': 0.92 },
          },
        ],
      },
    });

    mapRef.current = map;
    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right'
    );

    map.on('load', async () => {
      map.addSource(PIN_SOURCE, { type: 'geojson', data: EMPTY_COLLECTION });
      map.addSource(MAP_LABEL_SOURCE, {
        type: 'geojson',
        data: EMPTY_COLLECTION,
      });
      addBoundaryLayers(map, 1, null, isDark);
      addBoundaryLayers(map, 2, null, isDark);
      addBoundaryLayers(map, 3, null, isDark);

      map.addLayer({
        id: MAP_LABEL_LAYER,
        type: 'symbol',
        source: MAP_LABEL_SOURCE,
        layout: {
          visibility: 'none',
          'symbol-placement': 'point',
          'text-field': ['get', 'label'],
          'text-font': ['Noto Sans Regular'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4,
            11,
            7,
            12.5,
            10,
            13.5,
            13,
            14.5,
          ],
          'text-max-width': 8,
          'text-variable-anchor': ['center', 'top', 'bottom', 'left', 'right'],
          'text-radial-offset': 0.25,
          'text-justify': 'auto',
          'text-allow-overlap': false,
          'text-ignore-placement': false,
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': 'rgba(2,6,23,0.96)',
          'text-halo-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4,
            2.2,
            10,
            3,
          ],
          'text-halo-blur': 0.2,
          'text-opacity': [
            'case',
            ['boolean', ['get', 'active'], false],
            1,
            ['==', ['get', 'level'], 1],
            0.98,
            ['==', ['get', 'level'], 2],
            0.95,
            0.9,
          ],
        },
      });

      map.addLayer({
        id: 'regional-pin-halo',
        type: 'circle',
        source: PIN_SOURCE,
        paint: {
          'circle-radius': 12,
          'circle-color': [
            'match',
            ['get', 'type'],
            'admin',
            PIN_COLORS.admin,
            'researcher',
            PIN_COLORS.researcher,
            'field_assistant',
            PIN_COLORS.field_assistant,
            '#2563eb',
          ],
          'circle-opacity': 0.18,
        },
      });
      map.addLayer({
        id: 'regional-pins',
        type: 'circle',
        source: PIN_SOURCE,
        paint: {
          'circle-radius': [
            'match',
            ['get', 'type'],
            'admin',
            6.5,
            'researcher',
            5.5,
            'field_assistant',
            6,
            4.5,
          ],
          'circle-color': [
            'match',
            ['get', 'type'],
            'admin',
            PIN_COLORS.admin,
            'researcher',
            PIN_COLORS.researcher,
            'field_assistant',
            PIN_COLORS.field_assistant,
            '#2563eb',
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.8,
          'circle-opacity': 0.94,
        },
      });

      [1, 2, 3].forEach((level) => {
        map.on('mousemove', LEVEL_META[level].fill, (event) => {
          map.getCanvas().style.cursor = 'pointer';
          const feature = pickSmallestFeature(event.features);
          const id = feature?.properties?.boundary_id || feature?.id;
          if (!id) return;
          if (hoveredRef.current.id && hoveredRef.current.id !== id) {
            map.setFeatureState(
              {
                source: LEVEL_META[hoveredRef.current.level].source,
                id: hoveredRef.current.id,
              },
              { hover: false }
            );
          }
          hoveredRef.current = { level, id };
          map.setFeatureState(
            { source: LEVEL_META[level].source, id },
            { hover: true }
          );
        });
        map.on('mouseleave', LEVEL_META[level].fill, () => {
          map.getCanvas().style.cursor = '';
          if (hoveredRef.current.id) {
            map.setFeatureState(
              {
                source: LEVEL_META[hoveredRef.current.level].source,
                id: hoveredRef.current.id,
              },
              { hover: false }
            );
          }
          hoveredRef.current = { level: null, id: null };
        });
        map.on('click', LEVEL_META[level].fill, (event) => {
          if (event.originalEvent.__regionalBoundaryHandled) return;
          if (
            map.getLayer('regional-pins') &&
            map.queryRenderedFeatures(event.point, {
              layers: ['regional-pins'],
            }).length
          ) {
            return;
          }
          event.originalEvent.__regionalBoundaryHandled = true;

          const layers = [1, 2, 3]
            .map((itemLevel) => LEVEL_META[itemLevel].fill)
            .filter((layerId) => map.getLayer(layerId));
          const feature = pickBestRenderedBoundary(
            map.queryRenderedFeatures(event.point, { layers })
          );
          const props = feature?.properties;
          const pickedLevel = Number(props?.admin_leve || level);
          if (!props || !LEVEL_META[pickedLevel]) return;

          const id = Number(props.id);
          const fromIndex =
            pickedLevel < 3
              ? (indexRef.current?.levels?.[String(pickedLevel)] || []).find(
                  (item) => Number(item.id) === id
                )
              : level3FeaturesRef.current.find(
                  (item) => Number(item.properties?.id) === id
                )?.properties;
          selectBoundary(
            fromIndex || {
              ...props,
              id,
              parent_id: Number(props.parent_id),
              admin_leve: pickedLevel,
              bbox: parseMaybeJson(props.bbox),
              center: parseMaybeJson(props.center),
              geometry: feature.geometry,
            },
            pickedLevel
          );
        });
      });
      map.on('click', 'regional-pins', (event) => {
        event.preventDefault();
        const props = event.features?.[0]?.properties;
        if (!props) return;
        setSelectedPin(props);
        setPinPopupPosition({ left: event.point.x, top: event.point.y });
        map.stop();
        map.easeTo({
          center: event.features[0].geometry.coordinates,
          zoom: Math.max(map.getZoom(), 10),
          duration: 950,
          easing: MAP_CAMERA_EASING,
          essential: true,
        });
      });

      const [index, level1] = await Promise.all([
        fetch(`${BOUNDARY_BASE}/index.json`).then((response) =>
          response.json()
        ),
        fetch(`${BOUNDARY_BASE}/level1-preview.geojson`).then((response) =>
          response.json()
        ),
      ]);
      indexRef.current = index;
      level1GeoJsonRef.current = level1;
      setCountryBbox(getCollectionBounds(level1));
      setBoundaryIndex(index);
      setSourceData(1, level1);
      setMapReady(true);
      const fullBounds = getBounds(getCollectionBounds(level1));
      if (fullBounds) {
        map.resize();
        map.fitBounds(fullBounds, { padding: 18, duration: 0, maxZoom: 5.1 });
      }
      setTimeout(() => map.resize(), 80);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // MapLibre instance is intentionally initialized once; live source data is updated below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const source = mapRef.current?.getSource(PIN_SOURCE);
    if (source) source.setData(pinsGeoJson);
  }, [pinsGeoJson]);

  useEffect(() => {
    const source = mapRef.current?.getSource(MAP_LABEL_SOURCE);
    if (source) source.setData(mapLabelGeoJson);
  }, [mapLabelGeoJson]);

  const activeBoundaryLevel = useMemo(() => {
    const firstFeature = visibleGeoJson.features?.[0];
    return Number(
      firstFeature?.properties?.admin_leve || selected?.admin_leve || 1
    );
  }, [selected?.admin_leve, visibleGeoJson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;

    const applyLayerMode = () => {
      if (!map.getLayer(GOOGLE_SATELLITE_LAYER)) return false;

      map.setLayoutProperty(
        GOOGLE_SATELLITE_LAYER,
        'visibility',
        satelliteEnabled ? 'visible' : 'none'
      );
      if (map.getLayer('map-background')) {
        map.setPaintProperty(
          'map-background',
          'background-color',
          satelliteEnabled ? '#0f172a' : mapColors.background
        );
      }
      if (map.getLayer(MAP_LABEL_LAYER)) {
        map.setLayoutProperty(
          MAP_LABEL_LAYER,
          'visibility',
          satelliteEnabled ? 'visible' : 'none'
        );
      }
      [1, 2, 3].forEach((level) => {
        const meta = LEVEL_META[level];
        const isActiveLayer = level === activeBoundaryLevel;
        const visibility =
          !satelliteEnabled || isActiveLayer ? 'visible' : 'none';
        if (map.getLayer(meta.fill)) {
          map.setLayoutProperty(meta.fill, 'visibility', visibility);
          map.setPaintProperty(
            meta.fill,
            'fill-opacity',
            satelliteEnabled && isActiveLayer
              ? 0.08
              : satelliteEnabled
                ? 0
                : getBoundaryFillOpacityPaint(level)
          );
        }
        if (map.getLayer(meta.line)) {
          map.setLayoutProperty(meta.line, 'visibility', visibility);
          map.setPaintProperty(
            meta.line,
            'line-color',
            satelliteEnabled
              ? '#facc15'
              : getBoundaryLineColorPaint(level, isDark)
          );
          map.setPaintProperty(
            meta.line,
            'line-opacity',
            satelliteEnabled && isActiveLayer
              ? 0.92
              : satelliteEnabled
                ? 0
                : level === 1
                  ? 0.76
                  : level === 2
                    ? 0.64
                    : 0.5
          );
          map.setPaintProperty(
            meta.line,
            'line-width',
            satelliteEnabled && isActiveLayer
              ? level === 1
                ? 3.8
                : level === 2
                  ? 3
                  : 2.4
              : getBoundaryLineWidthPaint(level)
          );
        }
      });
      return true;
    };

    if (applyLayerMode()) return undefined;

    const retryLayerMode = () => {
      applyLayerMode();
    };
    map.once('load', retryLayerMode);
    map.once('styledata', retryLayerMode);
    map.once('idle', retryLayerMode);
    return () => {
      map.off('load', retryLayerMode);
      map.off('styledata', retryLayerMode);
      map.off('idle', retryLayerMode);
    };
  }, [activeBoundaryLevel, isDark, mapColors.background, satelliteEnabled]);

  useEffect(() => {
    const firstFeature = enrichedVisibleGeoJson.features?.[0];
    const level = Number(firstFeature?.properties?.admin_leve || 0);
    const sourceId = LEVEL_META[level]?.source;
    const source = sourceId ? mapRef.current?.getSource(sourceId) : null;
    if (source) source.setData(enrichedVisibleGeoJson);
  }, [enrichedVisibleGeoJson]);

  const zoomToSelected = () => {
    if (selected) {
      fitToBoundary(selected, LEVEL_META[selected.admin_leve]?.zoom || 6);
      return;
    }
    resetToCountry();
  };

  const handleMapWheel = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    const svg = svgRef.current;
    if (!svg) return;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const cursor = point.matrixTransform(svg.getScreenCTM().inverse());
    const zoomFactor = event.deltaY < 0 ? 1.18 : 1 / 1.18;
    setSvgViewport((current) => {
      const currentScale = Math.max(current.scale || 1, 1);
      const nextScale = Math.min(Math.max(currentScale * zoomFactor, 1), 240);
      if (nextScale === 1) return { scale: 1, x: 0, y: 0 };
      const currentMinX = -current.x / currentScale;
      const currentMinY = -current.y / currentScale;
      const currentWidth = SVG_WIDTH / currentScale;
      const currentHeight = SVG_HEIGHT / currentScale;
      const nextWidth = SVG_WIDTH / nextScale;
      const nextHeight = SVG_HEIGHT / nextScale;
      const cursorRatioX = (cursor.x - currentMinX) / currentWidth;
      const cursorRatioY = (cursor.y - currentMinY) / currentHeight;
      const nextMinX = cursor.x - cursorRatioX * nextWidth;
      const nextMinY = cursor.y - cursorRatioY * nextHeight;
      return {
        scale: nextScale,
        x: -nextMinX * nextScale,
        y: -nextMinY * nextScale,
      };
    });
  }, []);

  const handleMapPointerDown = useCallback(
    (event) => {
      if (event.button !== 0) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const target = event.target.closest?.('[data-boundary-id]');
      panDragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        width: rect.width,
        height: rect.height,
        viewport: svgViewport,
        moved: false,
        boundaryId: target?.dataset?.boundaryId || '',
        level: Number(target?.dataset?.level || 0),
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [svgViewport]
  );

  const handleMapPointerMove = useCallback((event) => {
    const drag = panDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    setSvgViewport({
      ...drag.viewport,
      x: drag.viewport.x + (dx * SVG_WIDTH) / Math.max(drag.width, 1),
      y: drag.viewport.y + (dy * SVG_HEIGHT) / Math.max(drag.height, 1),
    });
  }, []);

  const handleMapPointerUp = useCallback(
    (event) => {
      const drag = panDragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      if (drag.moved) {
        suppressSvgClickRef.current = true;
        window.setTimeout(() => {
          suppressSvgClickRef.current = false;
        }, 0);
      } else if (drag.boundaryId && drag.level) {
        const feature = (visibleGeoJson?.features || []).find(
          (item) =>
            (item.properties?.boundary_id || item.id) === drag.boundaryId
        );
        const props = feature?.properties || {};
        if (feature) {
          selectBoundary(
            {
              ...props,
              id: Number(props.id),
              parent_id: Number(props.parent_id),
              admin_leve: drag.level,
              bbox: getFeatureBounds(feature),
              center: parseMaybeJson(props.center),
              boundary_id: drag.boundaryId,
              geometry: feature.geometry,
            },
            drag.level
          );
        }
      }
      panDragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [selectBoundary, visibleGeoJson]
  );

  const svgViewBox = useMemo(() => {
    const scale = Math.max(svgViewport.scale || 1, 1);
    return [
      -svgViewport.x / scale,
      -svgViewport.y / scale,
      SVG_WIDTH / scale,
      SVG_HEIGHT / scale,
    ].join(' ');
  }, [svgViewport]);

  const svgLngLatBounds = useMemo(() => {
    if (!svgMap.project?.unproject) return null;
    const scale = Math.max(svgViewport.scale || 1, 1);
    const minSvgX = -svgViewport.x / scale;
    const minSvgY = -svgViewport.y / scale;
    const maxSvgX = minSvgX + SVG_WIDTH / scale;
    const maxSvgY = minSvgY + SVG_HEIGHT / scale;
    const corners = [
      svgMap.project.unproject([minSvgX, minSvgY]),
      svgMap.project.unproject([maxSvgX, minSvgY]),
      svgMap.project.unproject([maxSvgX, maxSvgY]),
      svgMap.project.unproject([minSvgX, maxSvgY]),
    ];
    const lngs = corners.map(([lng]) => lng);
    const lats = corners.map(([, lat]) => lat);
    return [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];
  }, [svgMap, svgViewport]);

  const fitSatelliteToCurrentView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.resize();

    const selectedBounds = selected
      ? getBounds(selected.bbox) ||
        getBounds(getGeometryBounds(selected.geometry))
      : null;
    if (selectedBounds) {
      map.fitBounds(selectedBounds, {
        animate: false,
        duration: 0,
        padding: 22,
        maxZoom: Math.max(LEVEL_META[selected.admin_leve]?.zoom || 6, 12),
      });
      return;
    }

    if (svgLngLatBounds) {
      map.fitBounds(svgLngLatBounds, {
        animate: false,
        duration: 0,
        padding: 0,
      });
    }
  }, [selected, svgLngLatBounds]);

  const handleSatelliteToggle = useCallback(() => {
    const map = mapRef.current;
    if (!satelliteEnabled) {
      fitSatelliteToCurrentView();
    } else {
      map?.easeTo({
        pitch: 0,
        duration: 260,
        easing: MAP_CAMERA_EASING,
        essential: true,
      });
    }
    setSatelliteEnabled((value) => !value);
  }, [fitSatelliteToCurrentView, satelliteEnabled]);

  useEffect(() => {
    const node = mapContainerRef.current;
    if (!node || !satelliteEnabled || mapMotion.type === 'idle') return;
    node.style.animation = 'none';
    // Force a reflow so repeated region selections replay the same animation.
    void node.offsetWidth;
    node.style.animation =
      mapMotion.type === 'in'
        ? 'mapSelectZoomIn 620ms cubic-bezier(0.22, 1, 0.36, 1) both'
        : 'mapSelectZoomOut 700ms cubic-bezier(0.22, 1, 0.36, 1) both';
  }, [mapMotion, satelliteEnabled]);

  useEffect(() => {
    const node = mapInteractionRef.current;
    if (!node) return undefined;
    node.addEventListener('wheel', handleMapWheel, { passive: false });
    return () => {
      node.removeEventListener('wheel', handleMapWheel);
    };
  }, [handleMapWheel]);

  const breadcrumbItems = useMemo(
    () =>
      [
        { label: mt.country, onClick: resetToCountry, active: !selected },
        selectedPath.region && {
          label: localizedFeatureName(selectedPath.region, lang),
          onClick: () => selectBoundary(selectedPath.region, 1),
          active: selected?.admin_leve === 1,
        },
        selectedPath.district && {
          label: localizedFeatureName(selectedPath.district, lang),
          onClick: () => selectBoundary(selectedPath.district, 2),
          active: selected?.admin_leve === 2,
        },
        selectedPath.mahalla && {
          label: localizedFeatureName(selectedPath.mahalla, lang),
          onClick: () => selectBoundary(selectedPath.mahalla, 3),
          active: selected?.admin_leve === 3,
        },
      ].filter(Boolean),
    [lang, mt.country, resetToCountry, selectBoundary, selected, selectedPath]
  );

  const childCount = useMemo(() => {
    if (!selected) return boundaryIndex?.levels?.['1']?.length || 0;
    if (selected.admin_leve === 1)
      return (boundaryIndex?.levels?.['2'] || []).filter(
        (item) => String(item.parent_id) === String(selected.id)
      ).length;
    if (selected.admin_leve === 2) return level3Features.length;
    return 0;
  }, [boundaryIndex, level3Features, selected]);

  const chartRows = useMemo(
    () => [
      {
        label: mt.analyses,
        value: selectedMetric.analyses || 0,
        color: '#0f766e',
      },
      { label: mt.admin, value: selectedMetric.admins || 0, color: '#2563eb' },
      {
        label: mt.researcher,
        value: selectedMetric.researchers || 0,
        color: '#7c3aed',
      },
    ],
    [mt, selectedMetric]
  );

  const chartMax = Math.max(...chartRows.map((row) => row.value), 1);

  const clinicalChartData = useMemo(() => {
    const clinicalRows = selectedRecords.filter(
      (row) => row.__type !== 'admin'
    );
    const bmiValues = clinicalRows
      .map((row) =>
        getNumericValue(row, [
          'bmi',
          'analysis.bmi',
          'result.bmi',
          'metrics.bmi',
        ])
      )
      .filter((value) => value !== null);
    const zValues = clinicalRows
      .map((row) =>
        getNumericValue(row, [
          'z_score',
          'zScore',
          'bmi_z_score',
          'z_bmi',
          'analysis.z_score',
          'result.z_score',
        ])
      )
      .filter((value) => value !== null);

    const bmiRows = [
      {
        label: mt.underweight,
        value: bmiValues.filter((v) => v < 18.5).length,
        color: '#3b82f6',
      },
      {
        label: mt.normal,
        value: bmiValues.filter((v) => v >= 18.5 && v < 25).length,
        color: '#0f766e',
      },
      {
        label: mt.overweight,
        value: bmiValues.filter((v) => v >= 25 && v < 30).length,
        color: '#f59e0b',
      },
      {
        label: mt.obese,
        value: bmiValues.filter((v) => v >= 30).length,
        color: '#dc2626',
      },
    ];
    const zRows = [
      {
        label: 'Z < -2',
        value: zValues.filter((v) => v < -2).length,
        color: '#3b82f6',
      },
      {
        label: '-2 .. +1',
        value: zValues.filter((v) => v >= -2 && v <= 1).length,
        color: '#0f766e',
      },
      {
        label: '+1 .. +2',
        value: zValues.filter((v) => v > 1 && v <= 2).length,
        color: '#f59e0b',
      },
      {
        label: 'Z > +2',
        value: zValues.filter((v) => v > 2).length,
        color: '#dc2626',
      },
    ];
    const avgBmi = bmiValues.length
      ? bmiValues.reduce((sum, value) => sum + value, 0) / bmiValues.length
      : 0;
    const avgZ = zValues.length
      ? zValues.reduce((sum, value) => sum + value, 0) / zValues.length
      : 0;
    return {
      bmiRows,
      zRows,
      maxBmi: Math.max(...bmiRows.map((row) => row.value), 1),
      maxZ: Math.max(...zRows.map((row) => row.value), 1),
      indexRows: [
        {
          label: 'BMI',
          short: 'BMI',
          value: Math.min((avgBmi / 35) * 100, 100),
          color: '#2563eb',
        },
        {
          label: 'Z-score',
          short: 'Z',
          value: Math.min(((avgZ + 3) / 6) * 100, 100),
          color: '#7c3aed',
        },
        {
          label: 'Risk',
          short: 'Risk',
          value: Math.min(
            selectedMetric.riskRate ||
              pct(bmiRows[3].value + zRows[3].value, clinicalRows.length),
            100
          ),
          color: getRiskColor(selectedMetric.riskRate || 0),
        },
        {
          label: mt.coverage,
          short: mt.coverage,
          value: Math.min(
            pct(clinicalRows.length, Math.max(childCount, 1)),
            100
          ),
          color: '#0f766e',
        },
      ],
      sampleCount: clinicalRows.length,
    };
  }, [childCount, mt, selectedMetric.riskRate, selectedRecords]);

  const regionalPanelSummary = useMemo(() => {
    const totalRecords = selectedRecords.length || 0;
    const clinicalCount = clinicalChartData.sampleCount || 0;
    const coveragePct = Math.min(
      pct(clinicalCount, Math.max(childCount, 1)),
      100
    );
    const riskRate = selectedMetric.riskRate || 0;
    const riskColor = getRiskColor(riskRate);
    const dominantBmi = clinicalChartData.bmiRows.reduce(
      (best, row) => (row.value > best.value ? row : best),
      clinicalChartData.bmiRows[0]
    );
    const highZ = clinicalChartData.zRows
      .filter((row) => row.label.startsWith('Z >'))
      .reduce((sum, row) => sum + row.value, 0);
    const activeRoles = [
      selectedMetric.admins,
      selectedMetric.researchers,
    ].filter((value) => Number(value) > 0).length;
    const operationalScore = Math.min(
      100,
      Math.round(
        coveragePct * 0.42 +
          Math.min(
            pct(selectedMetric.analyses || 0, Math.max(totalRecords, 1)),
            100
          ) *
            0.28 +
          activeRoles * 15
      )
    );
    const riskLabel =
      riskRate >= 25
        ? mt.highRisk || MAP_I18N.uz.highRisk
        : riskRate >= 10
          ? mt.watchRisk || MAP_I18N.uz.watchRisk
          : mt.lowRisk || MAP_I18N.uz.lowRisk;

    return {
      coveragePct,
      riskColor,
      riskLabel,
      dominantBmi,
      highZ,
      operationalScore,
      totalRecords,
      clinicalCount,
    };
  }, [
    childCount,
    clinicalChartData,
    mt,
    selectedMetric,
    selectedRecords.length,
  ]);

  const panelMetricTiles = useMemo(
    () => [
      {
        label: mt.qualityScore || MAP_I18N.uz.qualityScore,
        value: `${selectedBoundaryStats.coverageQuality || 0}%`,
        detail: `${selectedBoundaryStats.patientCount || 0} ${mt.patientCount || MAP_I18N.uz.patientCount} / ${selectedBoundaryStats.adminCount || 0} ${mt.admin} / ${selectedBoundaryStats.researcherCount || 0} ${mt.researcher}`,
        color: '#0f766e',
        icon: <Speed sx={{ fontSize: 18 }} />,
      },
      {
        label: mt.riskSignal,
        value: `${selectedMetric.riskRate || 0}%`,
        detail: regionalPanelSummary.riskLabel,
        color: regionalPanelSummary.riskColor,
        icon: <HealthAndSafety sx={{ fontSize: 18 }} />,
      },
      {
        label: mt.activityStructure,
        value: selectedMetric.analyses || 0,
        detail: `${selectedMetric.admins || 0} ${mt.admin} / ${selectedMetric.researchers || 0} ${mt.researcher}`,
        color: '#2563eb',
        icon: <BarChart sx={{ fontSize: 18 }} />,
      },
      {
        label: mt.lowerLayer,
        value: childCount,
        detail: formatArea(selectedAreaSquareMeters, locale),
        color: '#f59e0b',
        icon: <Groups sx={{ fontSize: 18 }} />,
      },
    ],
    [
      childCount,
      locale,
      mt,
      regionalPanelSummary,
      selectedAreaSquareMeters,
      selectedBoundaryStats,
      selectedMetric,
    ]
  );

  const panelInsights = useMemo(
    () => [
      {
        label: mt.bmiDistribution,
        value: `${regionalPanelSummary.dominantBmi?.label || '-'} ${regionalPanelSummary.dominantBmi?.value || 0}`,
        helper: mt.dominantClinicalGroup || MAP_I18N.uz.dominantClinicalGroup,
        color: regionalPanelSummary.dominantBmi?.color || '#2563eb',
      },
      {
        label: mt.zBands,
        value: regionalPanelSummary.highZ,
        helper: mt.highZSignal || MAP_I18N.uz.highZSignal,
        color: regionalPanelSummary.highZ ? '#dc2626' : '#0f766e',
      },
      {
        label: mt.operationalAnalysis,
        value: `${regionalPanelSummary.operationalScore}%`,
        helper: mt.operationalReadiness || MAP_I18N.uz.operationalReadiness,
        color:
          regionalPanelSummary.operationalScore >= 70 ? '#0f766e' : '#f59e0b',
      },
    ],
    [mt, regionalPanelSummary]
  );
  const analyticsCards = useMemo(
    () => [
      {
        label: mt.coverageIndex,
        value: `${Math.min(
          Math.round(
            ((selectedRecords.length || 0) / Math.max(childCount, 1)) * 10
          ),
          100
        )}%`,
        color: '#0f766e',
      },
      {
        label: mt.contactPoints,
        value: pinFeatures.length,
        color: '#2563eb',
      },
      {
        label: mt.riskRecords,
        value: selectedMetric.risk || 0,
        color: getRiskColor(selectedMetric.riskRate || 0),
      },
      {
        label: mt.lowerLayer,
        value: childCount,
        color: '#f59e0b',
      },
    ],
    [childCount, mt, pinFeatures.length, selectedMetric, selectedRecords.length]
  );

  const analyticalRows = useMemo(
    () => [
      {
        label: mt.analysesShare,
        value: selectedMetric.analyses || 0,
        total: selectedRecords.length,
        color: '#0f766e',
      },
      {
        label: mt.adminActivity,
        value: selectedMetric.admins || 0,
        total: selectedRecords.length,
        color: '#2563eb',
      },
      {
        label: mt.researcherBase,
        value: selectedMetric.researchers || 0,
        total: selectedRecords.length,
        color: '#7c3aed',
      },
      {
        label: mt.regionalDensity,
        value: childCount,
        total: selected ? 120 : boundaryIndex?.counts?.['2'] || 206,
        color: '#f59e0b',
      },
    ],
    [
      boundaryIndex,
      childCount,
      mt,
      selected,
      selectedMetric,
      selectedRecords.length,
    ]
  );

  const metricLayerOptions = useMemo(
    () =>
      METRIC_LAYERS.map((option) => ({
        ...option,
        label:
          mt[option.labelKey] || MAP_I18N.uz[option.labelKey] || option.key,
      })),
    [mt]
  );

  const timeFilterOptions = useMemo(
    () =>
      TIME_FILTERS.map((option) => ({
        ...option,
        label:
          mt[option.labelKey] || MAP_I18N.uz[option.labelKey] || option.key,
      })),
    [mt]
  );

  const trendInfo = useMemo(
    () =>
      getTrendInfo(
        selectedRecords.filter(
          (row) =>
            row.__source === 'analysis' || row.__source === 'research_record'
        )
      ),
    [selectedRecords]
  );

  const trendLabel =
    trendInfo.direction === 'up'
      ? mt.trendUp || MAP_I18N.uz.trendUp
      : trendInfo.direction === 'down'
        ? mt.trendDown || MAP_I18N.uz.trendDown
        : mt.trendFlat || MAP_I18N.uz.trendFlat;

  const riskReasonRows = useMemo(
    () => [
      {
        label: mt.underweight,
        value: selectedBoundaryStats.reasonCounts?.underweight || 0,
        color: '#3b82f6',
      },
      {
        label: mt.overweight,
        value: selectedBoundaryStats.reasonCounts?.overweight || 0,
        color: '#f59e0b',
      },
      {
        label: mt.obese,
        value: selectedBoundaryStats.reasonCounts?.obese || 0,
        color: '#dc2626',
      },
      {
        label: 'Z < -2',
        value: selectedBoundaryStats.reasonCounts?.zLow || 0,
        color: '#2563eb',
      },
      {
        label: 'Z > +2',
        value: selectedBoundaryStats.reasonCounts?.zHigh || 0,
        color: '#b91c1c',
      },
    ],
    [mt, selectedBoundaryStats]
  );

  const visibleProblemRows = useMemo(
    () =>
      (enrichedVisibleGeoJson.features || []).map((feature) => {
        const props = feature.properties || {};
        return {
          feature,
          props,
          id: props.boundary_id || feature.id,
          level: Number(props.admin_leve || 1),
          name: localizedFeatureName(props, lang),
          patientCount: Number(props.patient_count || 0),
          riskRate: Number(props.risk_rate || 0),
          riskCount: Number(props.risk_count || 0),
          coverageQuality: Number(props.coverage_quality || 0),
          avgBmi: Number(props.avg_bmi || 0),
          zRiskRate: Number(props.z_risk_rate || 0),
        };
      }),
    [enrichedVisibleGeoJson, lang]
  );

  const topRiskAreas = useMemo(
    () =>
      visibleProblemRows
        .filter((row) => row.patientCount > 0)
        .sort((a, b) => b.riskRate - a.riskRate || b.riskCount - a.riskCount)
        .slice(0, 5),
    [visibleProblemRows]
  );

  const lowCoverageAreas = useMemo(
    () =>
      visibleProblemRows
        .sort(
          (a, b) =>
            a.coverageQuality - b.coverageQuality ||
            a.patientCount - b.patientCount
        )
        .slice(0, 5),
    [visibleProblemRows]
  );

  const highPatientAreas = useMemo(
    () =>
      visibleProblemRows
        .filter((row) => row.patientCount > 0)
        .sort((a, b) => b.patientCount - a.patientCount)
        .slice(0, 5),
    [visibleProblemRows]
  );

  const emptyMahallaCount = useMemo(
    () =>
      visibleProblemRows.filter(
        (row) => row.level === 3 && row.patientCount === 0
      ).length,
    [visibleProblemRows]
  );

  const handleProblemAreaClick = useCallback(
    (row) => {
      if (!row?.feature) return;
      const props = row.feature.properties || row.props || {};
      selectBoundary(
        {
          ...props,
          id: Number(props.id),
          parent_id: Number(props.parent_id),
          admin_leve: row.level,
          bbox: getFeatureBounds(row.feature),
          center: parseMaybeJson(props.center),
          boundary_id: props.boundary_id || row.feature.id,
          geometry: row.feature.geometry,
        },
        row.level
      );
    },
    [selectBoundary]
  );

  const getBoundaryTooltipText = useCallback(
    (featureOrProps) => {
      const props = featureOrProps?.properties || featureOrProps || {};
      const latest = props.latest_analysis
        ? new Date(props.latest_analysis)
        : null;
      const latestLabel =
        latest && !Number.isNaN(latest.getTime())
          ? latest.toLocaleDateString(locale)
          : mt.notSpecified;
      return [
        localizedFeatureName(props, lang),
        `n=${Number(props.patient_count || 0)}`,
        `${mt.riskSignal}: ${Number(props.risk_rate || 0)}%`,
        `${mt.avgBmi || MAP_I18N.uz.avgBmi}: ${formatMetricNumber(props.avg_bmi)}`,
        `${mt.zRisk || MAP_I18N.uz.zRisk}: ${Number(props.z_risk_rate || 0)}%`,
        `${mt.admin}: ${Number(props.admin_count || 0)} / ${mt.researcher}: ${Number(
          props.researcher_count || 0
        )}`,
        `${mt.latestAnalysis || MAP_I18N.uz.latestAnalysis}: ${latestLabel}`,
      ].join('\n');
    },
    [lang, locale, mt]
  );
  const selectedAreaName = useMemo(
    () => (selected ? localizedFeatureName(selected, lang) : mt.country),
    [lang, mt.country, selected]
  );

  const selectedPathLabel = useMemo(
    () =>
      [selectedPath.region, selectedPath.district, selectedPath.mahalla]
        .filter(Boolean)
        .map((item) => localizedFeatureName(item, lang))
        .join(' / ') || selectedAreaName,
    [lang, selectedAreaName, selectedPath]
  );

  const currentMetricLabel =
    metricLayerOptions.find((option) => option.key === metricLayer)?.label ||
    metricLayer;
  const currentTimeLabel =
    timeFilterOptions.find((option) => option.key === timeFilter)?.label ||
    timeFilter;

  const reportSummaryRows = useMemo(
    () => [
      [mt.location, selectedAreaName],
      [
        mt.lowerLayer,
        selected
          ? { 1: mt.region, 2: mt.district, 3: mt.mahalla }[selected.admin_leve]
          : mt.country,
      ],
      [mt.metricLayer || MAP_I18N.uz.metricLayer, currentMetricLabel],
      [
        mt.timeFilter || MAP_I18N.uz.timeFilter,
        timeFilter === 'custom'
          ? `${customDateFrom || '-'} / ${customDateTo || '-'}`
          : currentTimeLabel,
      ],
      [
        mt.patientCount || MAP_I18N.uz.patientCount,
        selectedBoundaryStats.patientCount,
      ],
      [mt.riskSignal, `${selectedBoundaryStats.riskRate || 0}%`],
      [mt.riskRecords, selectedBoundaryStats.riskCount],
      [
        mt.avgBmi || MAP_I18N.uz.avgBmi,
        formatMetricNumber(selectedBoundaryStats.avgBmi),
      ],
      [
        mt.zRisk || MAP_I18N.uz.zRisk,
        `${selectedBoundaryStats.zRiskRate || 0}%`,
      ],
      [mt.admin, selectedBoundaryStats.adminCount],
      [mt.researcher, selectedBoundaryStats.researcherCount],
      [
        mt.qualityScore || MAP_I18N.uz.qualityScore,
        `${selectedBoundaryStats.coverageQuality || 0}%`,
      ],
      [mt.trend || MAP_I18N.uz.trend, trendLabel],
      [
        mt.latestAnalysis || MAP_I18N.uz.latestAnalysis,
        selectedBoundaryStats.latestDate
          ? selectedBoundaryStats.latestDate.toLocaleString(locale)
          : mt.notSpecified,
      ],
    ],
    [
      currentMetricLabel,
      currentTimeLabel,
      customDateFrom,
      customDateTo,
      locale,
      mt,
      selected,
      selectedAreaName,
      selectedBoundaryStats,
      timeFilter,
      trendLabel,
    ]
  );

  const reportTopSections = useMemo(
    () => [
      [mt.highestRisk || MAP_I18N.uz.highestRisk, topRiskAreas],
      [mt.lowestCoverage || MAP_I18N.uz.lowestCoverage, lowCoverageAreas],
      [mt.mostPatients || MAP_I18N.uz.mostPatients, highPatientAreas],
    ],
    [highPatientAreas, lowCoverageAreas, mt, topRiskAreas]
  );
  const levelLabel = selected
    ? { 1: mt.region, 2: mt.district, 3: mt.mahalla }[selected.admin_leve]
    : mt.country;

  const getPinRoleLabel = useCallback(
    (pin) => {
      if (pin?.type === 'admin') return mt.admin;
      if (pin?.type === 'researcher') return mt.researcher;
      if (pin?.type === 'field_assistant')
        return mt.fieldAssistant || MAP_I18N.uz.fieldAssistant;
      return pin?.role || pin?.type || '-';
    },
    [mt]
  );

  const formatDateTime = useCallback(
    (value) => {
      if (!value) return '';
      const date = new Date(value);
      return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleString(locale);
    },
    [locale]
  );

  const reportFileBase = useMemo(
    () => `regional_${slugifyFilePart(selectedAreaName)}_${todayStamp()}`,
    [selectedAreaName]
  );

  const handleExportPdf = useCallback(() => {
    try {
      setExportingMap(true);
      const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 46;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(mt.title || MAP_I18N.uz.title, 40, y);
      y += 22;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(selectedPathLabel, 40, y, { maxWidth: pageWidth - 80 });
      y += 22;
      doc.setDrawColor(210, 214, 220);
      doc.line(40, y, pageWidth - 40, y);
      y += 20;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(
        mt.analyticalIndicators || MAP_I18N.uz.analyticalIndicators,
        40,
        y
      );
      y += 18;
      doc.setFontSize(9);
      reportSummaryRows.forEach(([label, value]) => {
        if (y > 760) {
          doc.addPage();
          y = 46;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(String(label), 46, y);
        doc.setFont('helvetica', 'normal');
        doc.text(String(value ?? '-'), 230, y, { maxWidth: pageWidth - 270 });
        y += 15;
      });

      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(mt.riskReasons || MAP_I18N.uz.riskReasons, 40, y);
      y += 18;
      doc.setFontSize(9);
      riskReasonRows.forEach((row) => {
        doc.setFont('helvetica', 'bold');
        doc.text(row.label, 46, y);
        doc.setFont('helvetica', 'normal');
        doc.text(String(row.value), 230, y);
        y += 15;
      });

      reportTopSections.forEach(([title, rows]) => {
        y += 10;
        if (y > 720) {
          doc.addPage();
          y = 46;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(title, 40, y);
        y += 18;
        doc.setFontSize(9);
        (rows.length
          ? rows
          : [{ name: '-', patientCount: 0, riskRate: 0, coverageQuality: 0 }]
        ).forEach((row) => {
          if (y > 760) {
            doc.addPage();
            y = 46;
          }
          doc.setFont('helvetica', 'normal');
          doc.text(
            `${row.name}: n=${row.patientCount}, ${mt.reportRisk || MAP_I18N.uz.reportRisk}=${row.riskRate || 0}%, ${mt.reportQuality || MAP_I18N.uz.reportQuality}=${row.coverageQuality || 0}%`,
            46,
            y,
            { maxWidth: pageWidth - 92 }
          );
          y += 14;
        });
      });

      doc.save(`${reportFileBase}.pdf`);
      toast.success(mt.exportSuccess || MAP_I18N.uz.exportSuccess);
    } catch (error) {
      toast.error(
        `${mt.exportError || MAP_I18N.uz.exportError}: ${error.message}`
      );
    } finally {
      setExportingMap(false);
    }
  }, [
    mt,
    reportFileBase,
    reportSummaryRows,
    reportTopSections,
    riskReasonRows,
    selectedPathLabel,
  ]);

  const handleExportXls = useCallback(() => {
    try {
      setExportingMap(true);
      const summaryRows = reportSummaryRows
        .map(
          ([label, value]) =>
            `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`
        )
        .join('');
      const riskRows = riskReasonRows
        .map(
          (row) =>
            `<tr><td>${escapeHtml(row.label)}</td><td>${escapeHtml(row.value)}</td></tr>`
        )
        .join('');
      const topRows = reportTopSections
        .flatMap(([title, rows]) =>
          (rows.length
            ? rows
            : [{ name: '-', patientCount: 0, riskRate: 0, coverageQuality: 0 }]
          ).map(
            (row) =>
              `<tr><td>${escapeHtml(title)}</td><td>${escapeHtml(row.name)}</td><td>${row.patientCount}</td><td>${row.riskRate || 0}%</td><td>${row.coverageQuality || 0}%</td></tr>`
          )
        )
        .join('');
      const html = `<!doctype html><html><head><meta charset="utf-8" /><style>body{font-family:Arial,sans-serif}table{border-collapse:collapse;margin-bottom:18px}th,td{border:1px solid #cbd5e1;padding:7px 10px;text-align:left}th{background:#e2e8f0}.title{font-size:18px;font-weight:700;margin-bottom:4px}.sub{color:#475569;margin-bottom:14px}</style></head><body><div class="title">${escapeHtml(mt.title || MAP_I18N.uz.title)}</div><div class="sub">${escapeHtml(selectedPathLabel)}</div><table>${summaryRows}</table><table><tr><th>${escapeHtml(mt.riskReasons || MAP_I18N.uz.riskReasons)}</th><th>n</th></tr>${riskRows}</table><table><tr><th>${escapeHtml(mt.reportSection || MAP_I18N.uz.reportSection)}</th><th>${escapeHtml(mt.reportArea || MAP_I18N.uz.reportArea)}</th><th>n</th><th>${escapeHtml(mt.reportRisk || MAP_I18N.uz.reportRisk)}</th><th>${escapeHtml(mt.reportQuality || MAP_I18N.uz.reportQuality)}</th></tr>${topRows}</table></body></html>`;
      downloadBlob(
        new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' }),
        `${reportFileBase}.xls`
      );
      toast.success(mt.exportSuccess || MAP_I18N.uz.exportSuccess);
    } catch (error) {
      toast.error(
        `${mt.exportError || MAP_I18N.uz.exportError}: ${error.message}`
      );
    } finally {
      setExportingMap(false);
    }
  }, [
    mt,
    reportFileBase,
    reportSummaryRows,
    reportTopSections,
    riskReasonRows,
    selectedPathLabel,
  ]);

  const handleExportSnapshot = useCallback(async () => {
    const node = mapInteractionRef.current;
    if (!node) return;
    try {
      setExportingMap(true);
      const canvas = await html2canvas(node, {
        backgroundColor: null,
        scale: Math.min(window.devicePixelRatio || 1, 2),
        useCORS: true,
        logging: false,
      });
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Snapshot blob is empty');
        downloadBlob(blob, `${reportFileBase}.png`);
        toast.success(mt.snapshotSuccess || MAP_I18N.uz.snapshotSuccess);
      }, 'image/png');
    } catch (error) {
      toast.error(
        `${mt.exportError || MAP_I18N.uz.exportError}: ${error.message}`
      );
    } finally {
      setExportingMap(false);
    }
  }, [mt, reportFileBase]);
  const selectedPinDetails = useMemo(() => {
    if (!selectedPin) return [];
    const rows = [
      [mt.role, getPinRoleLabel(selectedPin)],
      [mt.userId, selectedPin.userId],
      [mt.roleField, selectedPin.role],
      [mt.email, selectedPin.email],
      [mt.phone, selectedPin.phone],
      [
        mt.location,
        [
          getLocalizedLocationLabel(selectedPin.region, lang, 1),
          getLocalizedLocationLabel(selectedPin.district, lang, 2),
          getLocalizedLocationLabel(selectedPin.mahalla, lang, 3),
        ]
          .filter((part) => part && part !== '-')
          .join(' / '),
      ],
      [mt.address, selectedPin.address],
      [
        mt.coordinate,
        [
          selectedPin.originalLatitude || selectedPin.latitude,
          selectedPin.originalLongitude || selectedPin.longitude,
        ]
          .filter(
            (value) => value !== undefined && value !== null && value !== ''
          )
          .map((value) => Number(value).toFixed(6))
          .join(', '),
      ],
      [mt.status, selectedPin.status],
      [mt.registered, formatDateTime(selectedPin.createdAt)],
      [mt.lastActivity, formatDateTime(selectedPin.lastActiveAt)],
      [mt.todayEntries, selectedPin.statsToday],
      [mt.monthEntries, selectedPin.statsMonth],
      [mt.totalEntries, selectedPin.totalEntries],
      [
        mt.avgTime,
        selectedPin.avgEntryTime ? `${selectedPin.avgEntryTime} s` : '',
      ],
      [mt.mostActiveTime, selectedPin.mostActiveHour],
      [
        mt.regionMatch,
        selectedPin.sourceRegionMatched ? mt.matched : mt.fallback,
      ],
    ];
    return rows.filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    );
  }, [formatDateTime, getPinRoleLabel, lang, mt, selectedPin]);

  const handleChat = (pin = selectedPin) => {
    if (!pin?.userId) {
      toast.error(mt.chatError);
      return;
    }
    window.dispatchEvent(new CustomEvent('close-ai-chat'));
    window.dispatchEvent(
      new CustomEvent('open-main-chat', {
        detail: {
          user: {
            id: Number(pin.userId),
            name: pin.name,
            email: pin.email,
            role: pin.role || pin.type,
          },
        },
      })
    );
    toast.success(pin?.name ? mt.chatOpened(pin.name) : mt.chatPrompt);
  };

  const dataLoading = loadingRows || statsLoading;
  const showSatelliteCanvas = satelliteEnabled;
  const loading = !satelliteEnabled && (!mapReady || loadingBoundary);
  const satelliteBoundaryOpacity = showSatelliteCanvas ? 0 : 1;
  const mapLabelFill = satelliteEnabled ? '#ffffff' : mapColors.label;
  const mapLabelHalo = satelliteEnabled
    ? 'rgba(2,6,23,0.96)'
    : mapColors.labelHalo;
  const mapLabelShadow = satelliteEnabled
    ? '0 1px 2px rgba(0,0,0,0.42), 0 0 6px rgba(0,0,0,0.28)'
    : isDark
      ? '0 1px 1px rgba(0,0,0,0.22)'
      : '0 1px 1px rgba(255,255,255,0.28)';
  const mapPanelHeight = {
    xs: 'clamp(420px, 62dvh, 560px)',
    sm: 'clamp(500px, 66dvh, 640px)',
  };

  return (
    <Box
      sx={{
        height: { lg: '100%' },
        minHeight: 0,
        display: { lg: 'flex' },
        flexDirection: 'column',
        flex: { lg: 1 },
      }}
    >
      <Box
        sx={{
          mb: 1,
          p: 1.25,
          borderRadius: 2,
          border: '1px solid',
          borderColor: isDark
            ? 'rgba(148,163,184,0.18)'
            : 'rgba(15,118,110,0.16)',
          bgcolor: isDark ? 'rgba(15,23,42,0.78)' : 'rgba(255,255,255,0.96)',
        }}
      >
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', lg: 'center' }}
          spacing={1.5}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Public color="primary" sx={{ fontSize: 20 }} />
              <Typography
                variant="h6"
                fontWeight={800}
                sx={{ lineHeight: 1.2 }}
              >
                {mt.title}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {mt.subtitle}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <StatPill
              label={mt.region}
              value={boundaryIndex?.counts?.['1'] || 14}
              color="#0f766e"
            />
            <StatPill
              label={mt.district}
              value={boundaryIndex?.counts?.['2'] || 206}
              color="#f59e0b"
            />
            <StatPill
              label={mt.mahalla}
              value={boundaryIndex?.counts?.['3'] || 8991}
              color="#7c3aed"
            />
            {dataLoading && (
              <Chip
                label={mt.analyticsLoading}
                size="small"
                sx={{ fontWeight: 800 }}
              />
            )}
          </Stack>
        </Stack>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 390px' },
          gap: 2,
          alignItems: 'stretch',
          flex: { lg: '1 1 0' },
          minHeight: { lg: 0 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            position: 'relative',
            width: '100%',
            minWidth: 0,
            height: { ...mapPanelHeight, lg: '100%' },
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: mapColors.background,
          }}
        >
          <Box
            ref={mapContainerRef}
            sx={{
              position: 'absolute',
              inset: 0,
              opacity: showSatelliteCanvas ? 1 : 0.01,
              pointerEvents: satelliteEnabled ? 'auto' : 'none',
              transition: 'opacity 180ms ease',
            }}
          />
          <Box
            ref={mapInteractionRef}
            onPointerDown={handleMapPointerDown}
            onPointerMove={handleMapPointerMove}
            onPointerUp={handleMapPointerUp}
            onPointerCancel={handleMapPointerUp}
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 1,
              pointerEvents: satelliteEnabled ? 'none' : 'auto',
              bgcolor: showSatelliteCanvas
                ? 'transparent'
                : mapColors.background,
              overscrollBehavior: 'contain',
              touchAction: 'none',
              cursor: panDragRef.current ? 'grabbing' : 'grab',
              '@keyframes svgLayerFade': {
                '0%': { opacity: 0.42 },
                '100%': { opacity: 1 },
              },
              '@keyframes selectedBoundaryPulse': {
                '0%': { filter: 'drop-shadow(0 0 0 rgba(250,204,21,0))' },
                '38%': {
                  filter: 'drop-shadow(0 0 10px rgba(250,204,21,0.52))',
                },
                '100%': {
                  filter: 'drop-shadow(0 0 3px rgba(250,204,21,0.22))',
                },
              },
              '@keyframes boundaryLineSweep': {
                '0%': { opacity: 0.35 },
                '45%': { opacity: 1 },
                '100%': { opacity: 0.92 },
              },
              '@keyframes pinHaloPulse': {
                '0%, 100%': { opacity: 0.14 },
                '50%': { opacity: 0.32 },
              },
              '@keyframes popupLift': {
                '0%': {
                  opacity: 0,
                  transform: 'translate(-50%, 24px) scale(0.98)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translate(-50%, 16px) scale(1)',
                },
              },
              '@keyframes mapSelectZoomIn': {
                '0%': { opacity: 0.82, transform: 'scale(0.965)' },
                '58%': { opacity: 1, transform: 'scale(1.012)' },
                '100%': { opacity: 1, transform: 'scale(1)' },
              },
              '@keyframes mapSelectZoomOut': {
                '0%': { opacity: 0.86, transform: 'scale(1.045)' },
                '60%': { opacity: 1, transform: 'scale(0.992)' },
                '100%': { opacity: 1, transform: 'scale(1)' },
              },
            }}
          >
            <svg
              ref={svgRef}
              viewBox={svgViewBox}
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label={mt.title}
              key={'map-motion-' + mapMotion.type + '-' + mapMotion.key}
              style={{
                opacity: showSatelliteCanvas ? 0 : 1,
                shapeRendering: 'geometricPrecision',
                transformBox: 'fill-box',
                transformOrigin: 'center center',
                animation:
                  !satelliteEnabled && mapMotion.type === 'in'
                    ? 'mapSelectZoomIn 620ms cubic-bezier(0.22, 1, 0.36, 1) both'
                    : !satelliteEnabled && mapMotion.type === 'out'
                      ? 'mapSelectZoomOut 700ms cubic-bezier(0.22, 1, 0.36, 1) both'
                      : undefined,
                transition: 'opacity 160ms ease',
              }}
            >
              <rect
                width={SVG_WIDTH}
                height={SVG_HEIGHT}
                fill={
                  showSatelliteCanvas ? 'transparent' : mapColors.background
                }
              />
              <text
                x={SVG_WIDTH / 2}
                y={SVG_HEIGHT / 2}
                textAnchor="middle"
                fill={mapLabelFill}
                opacity={showSatelliteCanvas ? '0' : '0.12'}
                fontSize="20"
                fontWeight="800"
              >
                {mt.country.toUpperCase()}
              </text>
              <g>
                <g
                  key={`${svgMap.features.length}-${selected?.admin_leve || 0}-${svgSelectedId}`}
                  style={{ animation: 'svgLayerFade 260ms ease-out both' }}
                >
                  {svgMap.features.map((feature) => {
                    const props = feature.properties || {};
                    const level = Number(props.admin_leve || 1);
                    const boundaryId = props.boundary_id || feature.id;
                    const patientCount = Number(props.patient_count || 0);
                    const active = boundaryId === svgSelectedId;
                    const hovered = boundaryId === svgHoveredId;
                    const path = geometryToPath(
                      feature.geometry,
                      svgMap.project
                    );
                    if (!path) return null;
                    const item = {
                      ...props,
                      id: Number(props.id),
                      parent_id: Number(props.parent_id),
                      admin_leve: level,
                      bbox: parseMaybeJson(props.bbox || feature.bbox),
                      center: parseMaybeJson(props.center),
                      boundary_id: boundaryId,
                      geometry: feature.geometry,
                    };
                    return (
                      <path
                        key={boundaryId}
                        data-boundary-id={boundaryId}
                        data-level={level}
                        d={path}
                        fill={getSvgFill(
                          level,
                          active,
                          hovered,
                          patientCount,
                          props.metric_color
                        )}
                        fillOpacity={
                          (active
                            ? level === 1
                              ? 0.94
                              : 0.68
                            : patientCount > 0
                              ? level === 1
                                ? 0.88
                                : level === 2
                                  ? 0.62
                                  : 0.5
                              : level === 1
                                ? 0.78
                                : 0.4) * satelliteBoundaryOpacity
                        }
                        stroke={satelliteEnabled ? '#facc15' : mapColors.stroke}
                        strokeWidth={
                          satelliteEnabled
                            ? level === 1
                              ? 3.8
                              : level === 2
                                ? 3
                                : 2.4
                            : active
                              ? level === 1
                                ? 2.2
                                : 1.5
                              : level === 1
                                ? 1.15
                                : 0.85
                        }
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        shapeRendering="geometricPrecision"
                        paintOrder="fill stroke"
                        style={{
                          cursor: 'pointer',
                          animation: active
                            ? 'selectedBoundaryPulse 1250ms cubic-bezier(0.22, 1, 0.36, 1) both'
                            : undefined,
                          filter: active
                            ? 'drop-shadow(0 0 3px rgba(250,204,21,0.22))'
                            : undefined,
                          transition:
                            'fill 180ms ease, fill-opacity 180ms ease, stroke 180ms ease, stroke-width 180ms ease, filter 220ms ease',
                        }}
                        onMouseEnter={() => {
                          hoveredSvgRef.current = { item, level };
                          setSvgHoveredId(boundaryId);
                        }}
                        onMouseLeave={() => {
                          hoveredSvgRef.current = null;
                          setSvgHoveredId('');
                        }}
                        onClick={() => {
                          if (suppressSvgClickRef.current) return;
                          selectBoundary(item, level);
                        }}
                      >
                        <title>{getBoundaryTooltipText(item)}</title>
                      </path>
                    );
                  })}
                </g>
                <g pointerEvents="none">
                  {svgLabels.map((label) => (
                    <text
                      key={`label-${label.id}`}
                      x={label.x}
                      y={label.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={mapLabelFill}
                      stroke={mapLabelHalo}
                      strokeWidth={
                        satelliteEnabled
                          ? label.active
                            ? 3.2
                            : label.level === 1
                              ? 2.7
                              : 2.25
                          : label.active
                            ? 1.8
                            : 1.15
                      }
                      paintOrder="stroke fill"
                      fontSize={label.size}
                      fontWeight={
                        label.active ? 850 : label.level === 1 ? 780 : 700
                      }
                      opacity={
                        satelliteEnabled
                          ? label.active
                            ? 0.98
                            : label.level === 1
                              ? 0.94
                              : label.level === 2
                                ? 0.84
                                : 0.72
                          : label.active
                            ? 0.88
                            : label.level === 3
                              ? 0.42
                              : 0.56
                      }
                      style={{
                        fontFamily: 'Roboto, "Google Sans", Arial, sans-serif',
                        textShadow: mapLabelShadow,
                        userSelect: 'none',
                      }}
                    >
                      {label.label}
                    </text>
                  ))}
                </g>
                <g>
                  {pinFeatures.map((pin, index) => {
                    const props = pin.properties || {};
                    const [x, y] = svgMap.project(pin.geometry.coordinates);
                    const color = PIN_COLORS[props.type] || '#2563eb';
                    const markerScale = 1 / Math.max(svgViewport.scale || 1, 1);
                    const dotColor =
                      props.type === 'admin' ? '#ffffff' : '#f8fafc';
                    return (
                      <g
                        key={props.id || `pin-${index}`}
                        transform={`translate(${x} ${y}) scale(${markerScale})`}
                        role="button"
                        tabIndex={-1}
                        focusable="false"
                        style={{
                          cursor: 'pointer',
                          filter: 'drop-shadow(0 2px 5px rgba(15,23,42,0.28))',
                          outline: 'none',
                          transition: 'filter 180ms ease, opacity 180ms ease',
                        }}
                        onPointerDown={(event) => {
                          event.stopPropagation();
                          const rect =
                            mapInteractionRef.current?.getBoundingClientRect();
                          setSelectedPin(props);
                          setPinPopupPosition(
                            rect
                              ? {
                                  left: event.clientX - rect.left,
                                  top: event.clientY - rect.top,
                                }
                              : null
                          );
                        }}
                        onClick={(event) => {
                          event.stopPropagation();
                          suppressSvgClickRef.current = true;
                          setSelectedPin(props);
                          const rect =
                            mapInteractionRef.current?.getBoundingClientRect();
                          if (rect) {
                            setPinPopupPosition({
                              left: event.clientX - rect.left,
                              top: event.clientY - rect.top,
                            });
                          }
                          setTimeout(() => {
                            suppressSvgClickRef.current = false;
                          }, 0);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedPin(props);
                            setPinPopupPosition({ left: x, top: y });
                          }
                        }}
                      >
                        <circle
                          cy="-6"
                          r="17"
                          fill={color}
                          opacity="0.14"
                          style={{
                            animation:
                              'pinHaloPulse 1800ms ease-in-out infinite',
                          }}
                        />
                        <path
                          d="M0 18 C0 18 15 5.4 15 -6 C15 -14.3 8.3 -21 0 -21 C-8.3 -21 -15 -14.3 -15 -6 C-15 5.4 0 18 0 18Z"
                          fill={color}
                          stroke="#fff"
                          strokeWidth="2.2"
                          vectorEffect="non-scaling-stroke"
                        />
                        <circle
                          cy="-6"
                          r="5.2"
                          fill={dotColor}
                          opacity="0.96"
                        />
                        <title>
                          {props.name || props.email || props.type || 'Pin'}
                        </title>
                      </g>
                    );
                  })}
                </g>
                <g pointerEvents="none">
                  {svgMap.features.map((feature) => {
                    const props = feature.properties || {};
                    const level = Number(props.admin_leve || 1);
                    const boundaryId = props.boundary_id || feature.id;
                    const active = boundaryId === svgSelectedId;
                    const hovered = boundaryId === svgHoveredId;
                    const path = geometryToPath(
                      feature.geometry,
                      svgMap.project
                    );
                    if (!path) return null;
                    return (
                      <path
                        key={`line-${boundaryId}`}
                        d={path}
                        fill="none"
                        stroke={
                          active || hovered ? mapColors.label : mapColors.stroke
                        }
                        strokeOpacity={active ? 1 : hovered ? 0.92 : 0.78}
                        strokeWidth={
                          active
                            ? 2.35
                            : level === 1
                              ? 1.25
                              : level === 2
                                ? 1
                                : 0.78
                        }
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        shapeRendering="geometricPrecision"
                        style={{
                          animation: active
                            ? 'boundaryLineSweep 900ms cubic-bezier(0.22, 1, 0.36, 1) both'
                            : undefined,
                          filter: active
                            ? 'drop-shadow(0 0 5px rgba(255,255,255,0.38))'
                            : undefined,
                          transition:
                            'stroke 180ms ease, stroke-opacity 180ms ease, stroke-width 180ms ease',
                        }}
                      />
                    );
                  })}
                </g>
              </g>
            </svg>
            {selectedPin && pinPopupPosition && (
              <Paper
                elevation={6}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
                sx={{
                  pointerEvents: 'auto',
                  position: 'absolute',
                  left: `min(max(${pinPopupPosition.left}px, 156px), calc(100% - 156px))`,
                  top: `min(max(${pinPopupPosition.top}px, 16px), calc(100% - 240px))`,
                  transform: 'translate(-50%, 16px)',
                  animation:
                    'popupLift 220ms cubic-bezier(0.22, 1, 0.36, 1) both',
                  transformOrigin: 'top center',
                  zIndex: 6,
                  width: 280,
                  maxWidth: 'calc(100% - 28px)',
                  p: 1.4,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor:
                    selectedPin.type === 'researcher'
                      ? 'rgba(124,58,237,0.45)'
                      : selectedPin.type === 'field_assistant'
                        ? 'rgba(245,158,11,0.45)'
                        : 'rgba(37,99,235,0.45)',
                  bgcolor: isDark
                    ? 'rgba(15,23,42,0.96)'
                    : 'rgba(255,255,255,0.98)',
                  boxShadow: isDark
                    ? '0 18px 44px rgba(0,0,0,0.48)'
                    : '0 18px 44px rgba(15,23,42,0.18)',
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={800} noWrap>
                      {selectedPin.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={800}
                    >
                      {getPinRoleLabel(selectedPin)}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => setSelectedPin(null)}
                    sx={{ mt: -0.5 }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Stack>
                <Stack spacing={0.45} mt={1}>
                  {selectedPin.email && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ wordBreak: 'break-word' }}
                    >
                      Email: {selectedPin.email}
                    </Typography>
                  )}
                  {selectedPin.phone && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ wordBreak: 'break-word' }}
                    >
                      Tel: {selectedPin.phone}
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ wordBreak: 'break-word' }}
                  >
                    {mt.location}:{' '}
                    {[
                      selectedPin.region,
                      selectedPin.district,
                      selectedPin.mahalla,
                    ]
                      .filter(Boolean)
                      .join(' / ') || mt.notSpecified}
                  </Typography>
                  {selectedPin.groupTotal > 1 && (
                    <Typography variant="caption" color="text.secondary">
                      {mt.sameAreaPin}: {selectedPin.groupIndex}/
                      {selectedPin.groupTotal}
                    </Typography>
                  )}
                </Stack>
                <Button
                  fullWidth
                  size="small"
                  variant="contained"
                  startIcon={<ChatBubbleOutline />}
                  onClick={() => handleChat(selectedPin)}
                  disabled={!selectedPin.userId}
                  sx={{
                    mt: 1.1,
                    borderRadius: 1,
                    textTransform: 'none',
                    fontWeight: 700,
                  }}
                >
                  {mt.contact}
                </Button>
              </Paper>
            )}
          </Box>
          <Stack
            direction={'row'}
            spacing={0.75}
            alignItems={'flex-start'}
            sx={{
              position: 'absolute',
              top: 14,
              right: { xs: 12, sm: 64 },
              zIndex: 10,
              maxWidth: 'calc(100% - 24px)',
            }}
          >
            <UnifiedMapSearch
              query={searchQuery}
              open={searchOpen}
              results={searchResults}
              isDark={isDark}
              mt={mt}
              getPinRoleLabel={getPinRoleLabel}
              onQueryChange={(value) => {
                setSearchQuery(value);
                setSearchOpen(true);
              }}
              onOpen={() => setSearchOpen(true)}
              onClose={() => setSearchOpen(false)}
              onSelect={handleSearchResult}
            />
            <Tooltip
              title={satelliteEnabled ? mt.satelliteOff : mt.satelliteOn}
            >
              <Button
                variant={satelliteEnabled ? 'contained' : 'outlined'}
                size="small"
                startIcon={<SatelliteAlt />}
                onClick={handleSatelliteToggle}
                sx={{
                  minWidth: { xs: 40, sm: 104 },
                  height: 40,
                  px: { xs: 1, sm: 1.25 },
                  '& .MuiButton-startIcon': {
                    m: { xs: 0, sm: '0 8px 0 -4px' },
                  },
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 900,
                  bgcolor: satelliteEnabled
                    ? 'rgba(15,23,42,0.92)'
                    : isDark
                      ? 'rgba(15,23,42,0.88)'
                      : 'rgba(255,255,255,0.92)',
                  color: satelliteEnabled ? '#fff' : 'text.primary',
                  borderColor: satelliteEnabled
                    ? 'rgba(255,255,255,0.36)'
                    : 'divider',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    bgcolor: satelliteEnabled
                      ? 'rgba(15,23,42,0.98)'
                      : 'background.paper',
                  },
                }}
              >
                <Box
                  component={'span'}
                  sx={{ display: { xs: 'none', sm: 'inline' } }}
                >
                  Satellite
                </Box>
              </Button>
            </Tooltip>
          </Stack>
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: isDark
                  ? 'rgba(2,6,23,0.56)'
                  : 'rgba(248,250,252,0.48)',
                zIndex: 4,
              }}
            >
              <Stack alignItems="center" spacing={1}>
                <CircularProgress />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={700}
                >
                  {mt.layerLoading}
                </Typography>
              </Stack>
            </Box>
          )}

          <Paper
            elevation={0}
            sx={{
              position: 'absolute',
              left: 16,
              top: { xs: 66, sm: 16 },
              zIndex: 3,
              maxWidth: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 430px)' },
              p: 1,
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: isDark
                ? 'rgba(148,163,184,0.22)'
                : 'rgba(15,23,42,0.1)',
              bgcolor: isDark
                ? 'rgba(15,23,42,0.88)'
                : 'rgba(255,255,255,0.94)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Stack
              direction="row"
              spacing={0.75}
              useFlexGap
              flexWrap="wrap"
              alignItems="center"
            >
              {breadcrumbItems.map((item, index) => (
                <React.Fragment key={item.label}>
                  {index > 0 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={700}
                    >
                      /
                    </Typography>
                  )}
                  <Button
                    size="small"
                    onClick={item.onClick}
                    variant={item.active ? 'contained' : 'text'}
                    sx={{
                      minWidth: 0,
                      px: 1,
                      py: 0.35,
                      borderRadius: 1,
                      textTransform: 'none',
                      fontWeight: 900,
                      maxWidth: { xs: 140, sm: 220 },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </Button>
                </React.Fragment>
              ))}
            </Stack>
            <Stack
              direction="row"
              spacing={0.75}
              useFlexGap
              flexWrap="wrap"
              mt={0.75}
            >
              <Chip
                size="small"
                label={mt.region}
                sx={{
                  bgcolor: mapColors.region,
                  color: '#fff',
                  fontWeight: 800,
                }}
              />
              <Chip
                size="small"
                label={mt.district}
                sx={{
                  bgcolor: mapColors.district,
                  color: '#fff',
                  fontWeight: 800,
                }}
              />
              <Chip
                size="small"
                label={mt.mahalla}
                sx={{
                  bgcolor: mapColors.mahalla,
                  color: '#fff',
                  fontWeight: 800,
                }}
              />
              <Chip
                size="small"
                label={mt.patientExists}
                sx={{
                  bgcolor: mapColors.patient,
                  color: '#fff',
                  fontWeight: 800,
                }}
              />
              <Chip
                size="small"
                icon={<LocationOn />}
                label="Pin"
                sx={{ bgcolor: '#2563eb', color: '#fff', fontWeight: 800 }}
              />
            </Stack>
          </Paper>
          <Paper
            elevation={0}
            sx={{
              position: 'absolute',
              left: 16,
              bottom: 16,
              zIndex: 3,
              p: 1,
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: isDark
                ? 'rgba(148,163,184,0.24)'
                : 'rgba(15,23,42,0.12)',
              bgcolor: isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.94)',
              backdropFilter: 'blur(10px)',
              maxWidth: 'calc(100% - 88px)',
            }}
          >
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Select
                size="small"
                value={metricLayer}
                onChange={(event) => setMetricLayer(event.target.value)}
                sx={{
                  minWidth: 156,
                  fontWeight: 900,
                  bgcolor: 'background.paper',
                  '& .MuiSelect-select': { py: 0.75 },
                }}
              >
                {metricLayerOptions.map((option) => (
                  <MenuItem key={option.key} value={option.key}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              <Select
                size="small"
                value={timeFilter}
                onChange={(event) => setTimeFilter(event.target.value)}
                sx={{
                  minWidth: 112,
                  fontWeight: 900,
                  bgcolor: 'background.paper',
                  '& .MuiSelect-select': { py: 0.75 },
                }}
              >
                {timeFilterOptions.map((option) => (
                  <MenuItem key={option.key} value={option.key}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {timeFilter === 'custom' && (
                <>
                  <TextField
                    size="small"
                    type="date"
                    value={customDateFrom}
                    onChange={(event) => setCustomDateFrom(event.target.value)}
                    label={mt.dateFrom || MAP_I18N.uz.dateFrom}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 148, bgcolor: 'background.paper' }}
                  />
                  <TextField
                    size="small"
                    type="date"
                    value={customDateTo}
                    onChange={(event) => setCustomDateTo(event.target.value)}
                    label={mt.dateTo || MAP_I18N.uz.dateTo}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 148, bgcolor: 'background.paper' }}
                  />
                </>
              )}
            </Stack>
          </Paper>
          <Tooltip title={mt.selectedBack}>
            <IconButton
              onClick={zoomToSelected}
              sx={{
                position: 'absolute',
                right: 16,
                bottom: 16,
                zIndex: 3,
                bgcolor: 'background.paper',
                boxShadow: 3,
                '&:hover': { bgcolor: 'background.paper' },
              }}
            >
              <MyLocation />
            </IconButton>
          </Tooltip>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            minWidth: 0,
            height: { xs: 'auto', lg: '100%' },
            maxHeight: { lg: '100%' },
            overflow: 'hidden',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: isDark ? 'rgba(15,23,42,0.82)' : 'rgba(255,255,255,0.98)',
          }}
        >
          <Box sx={{ p: 2.25, height: '100%', overflowY: 'auto' }}>
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={1}
            >
              <Box>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  fontWeight={800}
                >
                  {levelLabel}
                </Typography>
                <Typography variant="h5" fontWeight={800}>
                  {selected ? localizedFeatureName(selected, lang) : mt.country}
                </Typography>
                {selectedPath.region && (
                  <Typography variant="caption" color="text.secondary">
                    {[
                      selectedPath.region,
                      selectedPath.district,
                      selectedPath.mahalla,
                    ]
                      .filter(Boolean)
                      .map((item) => localizedFeatureName(item, lang))
                      .join(' / ')}
                  </Typography>
                )}
              </Box>
              {selectedPin && (
                <IconButton size="small" onClick={() => setSelectedPin(null)}>
                  <Close fontSize="small" />
                </IconButton>
              )}
            </Stack>

            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: isDark
                  ? 'rgba(96,165,250,0.28)'
                  : 'rgba(37,99,235,0.18)',
                background: isDark
                  ? 'linear-gradient(135deg, rgba(37,99,235,0.18), rgba(15,23,42,0.86))'
                  : 'linear-gradient(135deg, rgba(239,246,255,0.98), rgba(240,253,250,0.98))',
                boxShadow: isDark
                  ? '0 18px 42px rgba(2,6,23,0.22)'
                  : '0 18px 42px rgba(15,23,42,0.08)',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.15}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 2,
                    display: 'grid',
                    placeItems: 'center',
                    color: '#fff',
                    bgcolor: regionalPanelSummary.riskColor,
                    boxShadow: `0 14px 30px ${regionalPanelSummary.riskColor}33`,
                    flex: '0 0 auto',
                  }}
                >
                  <Insights />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1}
                  >
                    <Typography variant="body2" fontWeight={900}>
                      {mt.riskSignal}
                    </Typography>
                    <Typography
                      variant="h6"
                      fontWeight={900}
                      sx={{
                        color: regionalPanelSummary.riskColor,
                        lineHeight: 1,
                      }}
                    >
                      {selectedMetric.riskRate || 0}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(selectedMetric.riskRate || 0, 100)}
                    sx={{
                      mt: 0.8,
                      height: 9,
                      borderRadius: 5,
                      bgcolor: 'rgba(100,116,139,0.16)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: regionalPanelSummary.riskColor,
                      },
                    }}
                  />
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent="space-between"
                    mt={0.75}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={800}
                    >
                      {regionalPanelSummary.riskLabel}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={800}
                    >
                      n={regionalPanelSummary.clinicalCount}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1,
                mt: 1.25,
              }}
            >
              {panelMetricTiles.map((tile) => (
                <RegionalMetricTile key={tile.label} {...tile} />
              ))}
            </Box>

            <Box mt={1.25}>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <Download sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="body2" fontWeight={900}>
                  {mt.exportReport || MAP_I18N.uz.exportReport}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Download />}
                  onClick={handleExportPdf}
                  disabled={exportingMap}
                  sx={{
                    borderRadius: 1.25,
                    textTransform: 'none',
                    fontWeight: 900,
                  }}
                >
                  {mt.exportPdf || MAP_I18N.uz.exportPdf}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<TableChart />}
                  onClick={handleExportXls}
                  disabled={exportingMap}
                  sx={{
                    borderRadius: 1.25,
                    textTransform: 'none',
                    fontWeight: 900,
                  }}
                >
                  {mt.exportXls || MAP_I18N.uz.exportXls}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<CameraAlt />}
                  onClick={handleExportSnapshot}
                  disabled={exportingMap}
                  sx={{
                    borderRadius: 1.25,
                    textTransform: 'none',
                    fontWeight: 900,
                  }}
                >
                  {mt.exportSnapshot || MAP_I18N.uz.exportSnapshot}
                </Button>
              </Stack>
            </Box>
            <Box mt={1.25}>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <TrendingUp sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="body2" fontWeight={900}>
                  {mt.analyticalIndicators}
                </Typography>
              </Stack>
              <Stack spacing={0.8}>
                {panelInsights.map((item) => (
                  <RegionalInsightRow key={item.label} {...item} />
                ))}
              </Stack>
            </Box>
            <Box mt={1.5}>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <Speed sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="body2" fontWeight={900}>
                  {mt.qualityScore || MAP_I18N.uz.qualityScore}
                </Typography>
              </Stack>
              <Stack spacing={0.9}>
                <Box>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    mb={0.45}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={800}
                    >
                      {mt.trend || MAP_I18N.uz.trend}
                    </Typography>
                    <Typography
                      variant="caption"
                      fontWeight={900}
                      sx={{
                        color:
                          trendInfo.direction === 'up'
                            ? '#dc2626'
                            : trendInfo.direction === 'down'
                              ? '#0f766e'
                              : 'text.secondary',
                      }}
                    >
                      {trendLabel}{' '}
                      {trendInfo.delta
                        ? `(${trendInfo.delta > 0 ? '+' : ''}${trendInfo.delta}%)`
                        : ''}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(
                      selectedBoundaryStats.coverageQuality || 0,
                      100
                    )}
                    sx={{
                      height: 9,
                      borderRadius: 5,
                      bgcolor: 'rgba(100,116,139,0.14)',
                      '& .MuiLinearProgress-bar': { bgcolor: '#0f766e' },
                    }}
                  />
                </Box>
                <Stack
                  direction="row"
                  spacing={0.75}
                  useFlexGap
                  flexWrap="wrap"
                >
                  {[
                    [mt.patientExists, selectedBoundaryStats.patientCount > 0],
                    [mt.admin, selectedBoundaryStats.adminCount > 0],
                    [mt.researcher, selectedBoundaryStats.researcherCount > 0],
                    [mt.lastActivity, selectedBoundaryStats.hasRecent],
                  ].map(([label, active]) => (
                    <Chip
                      key={label}
                      size="small"
                      label={label}
                      sx={{
                        fontWeight: 800,
                        bgcolor: active
                          ? 'rgba(15,118,110,0.14)'
                          : 'rgba(100,116,139,0.12)',
                        color: active ? '#0f766e' : 'text.secondary',
                      }}
                    />
                  ))}
                </Stack>
              </Stack>
            </Box>

            <Box mt={1.5}>
              <Typography variant="body2" fontWeight={900} mb={1}>
                {mt.riskReasons || MAP_I18N.uz.riskReasons}
              </Typography>
              <Stack spacing={0.75}>
                {riskReasonRows.map((row) => (
                  <Box key={row.label}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      mb={0.35}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={800}
                      >
                        {row.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        fontWeight={900}
                        sx={{ color: row.color }}
                      >
                        {row.value}
                      </Typography>
                    </Stack>
                    <Box
                      sx={{
                        height: 7,
                        borderRadius: 4,
                        bgcolor: 'rgba(100,116,139,0.14)',
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${Math.max((row.value / Math.max(selectedBoundaryStats.patientCount || 1, 1)) * 100, row.value ? 7 : 0)}%`,
                          borderRadius: 4,
                          bgcolor: row.color,
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>

            <Box mt={1.75}>
              <Typography variant="body2" fontWeight={900} mb={1}>
                {mt.topProblemAreas || MAP_I18N.uz.topProblemAreas}
              </Typography>
              {[
                [
                  mt.highestRisk || MAP_I18N.uz.highestRisk,
                  topRiskAreas,
                  (row) => `${row.riskRate}% / n=${row.patientCount}`,
                  '#dc2626',
                ],
                [
                  mt.lowestCoverage || MAP_I18N.uz.lowestCoverage,
                  lowCoverageAreas,
                  (row) => `${row.coverageQuality}% / n=${row.patientCount}`,
                  '#f59e0b',
                ],
                [
                  mt.mostPatients || MAP_I18N.uz.mostPatients,
                  highPatientAreas,
                  (row) => `n=${row.patientCount}`,
                  '#2563eb',
                ],
              ].map(([title, rows, valueFn, color]) => (
                <Box key={title} sx={{ mb: 1.1 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={0.5}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={900}
                    >
                      {title}
                    </Typography>
                    {title ===
                      (mt.lowestCoverage || MAP_I18N.uz.lowestCoverage) &&
                      emptyMahallaCount > 0 && (
                        <Chip
                          size="small"
                          label={`${mt.emptyMahallas || MAP_I18N.uz.emptyMahallas}: ${emptyMahallaCount}`}
                          sx={{ height: 22, fontWeight: 800 }}
                        />
                      )}
                  </Stack>
                  <Stack spacing={0.45}>
                    {rows.length ? (
                      rows.map((row) => (
                        <Button
                          key={`${title}-${row.id}`}
                          size="small"
                          onClick={() => handleProblemAreaClick(row)}
                          sx={{
                            justifyContent: 'space-between',
                            gap: 1,
                            borderRadius: 1,
                            px: 1,
                            py: 0.55,
                            textTransform: 'none',
                            bgcolor: 'rgba(100,116,139,0.08)',
                            color: 'text.primary',
                          }}
                        >
                          <Typography
                            variant="caption"
                            fontWeight={800}
                            noWrap
                            sx={{ maxWidth: 170 }}
                          >
                            {row.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            fontWeight={900}
                            sx={{ color }}
                          >
                            {valueFn(row)}
                          </Typography>
                        </Button>
                      ))
                    ) : (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={700}
                      >
                        {mt.noPatientData || MAP_I18N.uz.noPatientData}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              ))}
            </Box>
            {selectedPin && (
              <Box
                mt={2.5}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'primary.main',
                  bgcolor: isDark
                    ? 'rgba(37,99,235,0.14)'
                    : 'rgba(37,99,235,0.06)',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <LocationOn
                    sx={{ color: PIN_COLORS[selectedPin.type] || '#2563eb' }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h6" fontWeight={800} noWrap>
                      {selectedPin.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={800}
                    >
                      {getPinRoleLabel(selectedPin)}
                    </Typography>
                  </Box>
                </Stack>
                <Stack spacing={0.7} mt={1.25}>
                  {selectedPinDetails.map(([label, value]) => (
                    <Box
                      key={label}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '112px minmax(0, 1fr)',
                        gap: 1,
                        alignItems: 'start',
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={700}
                      >
                        {label}
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ wordBreak: 'break-word' }}
                      >
                        {value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<ChatBubbleOutline />}
                  onClick={() => handleChat(selectedPin)}
                  disabled={!selectedPin.userId}
                  sx={{
                    mt: 1.5,
                    borderRadius: 1.5,
                    textTransform: 'none',
                    fontWeight: 800,
                  }}
                >
                  {mt.contact}
                </Button>
              </Box>
            )}

            <Divider sx={{ my: 2.25 }} />

            <Typography variant="h6" fontWeight={800} mb={1.25}>
              {mt.scientificProfile}
            </Typography>
            <Stack spacing={1.2}>
              <ScientificIndexChart
                rows={clinicalChartData.indexRows}
                title={mt.clinicalIndexProfile}
                subtitle={mt.clinicalIndexSub}
              />
              <ScientificBarChart
                title={mt.bmiDistribution}
                subtitle={mt.regionSample(clinicalChartData.sampleCount)}
                rows={clinicalChartData.bmiRows}
                maxValue={clinicalChartData.maxBmi}
              />
              <ScientificBarChart
                title={mt.zBands}
                subtitle={mt.zBandsSub}
                rows={clinicalChartData.zRows}
                maxValue={clinicalChartData.maxZ}
              />
            </Stack>

            <Divider sx={{ my: 2.25 }} />

            <Typography variant="h6" fontWeight={800} mb={1.25}>
              {mt.analyticalIndicators}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1,
              }}
            >
              {analyticsCards.map((card) => (
                <Box
                  key={card.label}
                  sx={{
                    p: 1.4,
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: isDark
                      ? 'rgba(15,23,42,0.74)'
                      : 'rgba(248,250,252,0.92)',
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={700}
                  >
                    {card.label}
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    sx={{ color: card.color }}
                  >
                    {card.value}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box mt={2.25}>
              <Typography variant="h6" fontWeight={800} mb={1.25}>
                {mt.activityStructure}
              </Typography>
              <Stack spacing={1.2}>
                {chartRows.map((row) => (
                  <Box key={row.label}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      mb={0.5}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={700}
                      >
                        {row.label}
                      </Typography>
                      <Typography variant="caption" fontWeight={700}>
                        {row.value}
                      </Typography>
                    </Stack>
                    <Box
                      sx={{
                        height: 9,
                        borderRadius: 4.5,
                        bgcolor: 'rgba(100,116,139,0.14)',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${Math.max((row.value / chartMax) * 100, row.value ? 8 : 0)}%`,
                          bgcolor: row.color,
                          borderRadius: 4.5,
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>

            <Divider sx={{ my: 2.25 }} />

            <Typography variant="h6" fontWeight={800} mb={1.25}>
              {mt.operationalAnalysis}
            </Typography>
            <Stack spacing={1.35}>
              {analyticalRows.map((row) => {
                const percent = Math.min(
                  Math.round((row.value / Math.max(row.total, 1)) * 100),
                  100
                );
                return (
                  <Box key={row.label}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      mb={0.5}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight={700}
                      >
                        {row.label}
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {percent}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={percent}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: 'rgba(100,116,139,0.14)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: row.color,
                        },
                      }}
                    />
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  ChatBubbleOutline,
  Close,
  LocationOn,
  MyLocation,
  Public,
  SatelliteAlt,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { AdminApi, ResearchApi } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLocalizedLocationLabel } from '../../utils/locationI18n';

const BOUNDARY_BASE = '/maps/admin-boundaries';
const EMPTY_COLLECTION = { type: 'FeatureCollection', features: [] };
const PIN_SOURCE = 'regional-pins-source';
const GOOGLE_SATELLITE_SOURCE = 'google-satellite-source';
const GOOGLE_SATELLITE_LAYER = 'google-satellite-layer';
const SATELLITE_MAX_ZOOM = 21;
const SVG_WIDTH = 1000;
const SVG_HEIGHT = 760;

const PIN_COLORS = {
  admin: '#2563eb',
  researcher: '#7c3aed',
};

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
  title: 'Аймактык карта',
  subtitle: 'Аймактар боюнча бейтаптар, BMI жана коркунуч көрсөткүчтөрү',
  totalPatients: 'Жалпы бейтаптар',
  avgBmi: 'Орточо BMI',
  riskCount: 'Коркунучтагы жазуулар',
  noData: 'Маалымат жок',
  patients: 'Бейтаптар',
  analyses: 'Талдоолор',
  region: 'Аймак',
  district: 'Район',
  mahalla: 'Махалла',
  risk: 'Коркунуч',
  normal: 'Норма',
  overweight: 'Ашыкча салмак',
  obese: 'Семирүү',
  underweight: 'Салмак жетишсиздиги',
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

const localeByLang = {
  uz: 'uz-UZ',
  tg: 'tg-TJ',
  tm: 'tk-TM',
  ru: 'ru-RU',
  en: 'en-US',
  kz: 'kk-KZ',
  ky: 'ky-KG',
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
  if (!bbox || bbox.length !== 4) return null;
  return [
    [bbox[0], bbox[1]],
    [bbox[2], bbox[3]],
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

const createProjector = (bbox, width = 1000, height = 650, padding = 18) => {
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
  const pageSize = 500;
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
      px: 1.5,
      py: 1,
      borderRadius: 1.5,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
      minWidth: 100,
    }}
  >
    <Typography variant="caption" color="text.secondary" fontWeight={700}>
      {label}
    </Typography>
    <Typography variant="h6" fontWeight={800} sx={{ color, lineHeight: 1.1 }}>
      {value}
    </Typography>
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
  const [satelliteEnabled, setSatelliteEnabled] = useState(false);

  const userRows = directoryUsers.length ? directoryUsers : admins;

  const allRecords = useMemo(
    () => [
      ...userRows
        .filter((item) => item.role !== 'superadmin')
        .map((item) => ({
          ...item,
          __source: 'user',
          __type: item.role === 'researcher' ? 'researcher' : 'admin',
        })),
      ...analyses.map((item) => ({
        ...item,
        __source: 'analysis',
        __type: 'analysis',
      })),
      ...researchRecords.map((item) => ({
        ...item,
        __source: 'research_record',
        __type: 'researcher',
      })),
    ],
    [analyses, researchRecords, userRows]
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
    if (!boundaryIndex?.levels?.['2']?.length || !boundaryIndex?.files?.['3'])
      return undefined;

    const preloadMahallaFiles = async () => {
      const districtIds = [
        ...new Set(
          allRecords
            .filter(
              (item) =>
                item.__source === 'user' &&
                ['admin', 'researcher'].includes(item.__type) &&
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
    if (!selected) return allRecords;
    const regionKey = selectedPath.region
      ? canonicalRegionName(featureName(selectedPath.region))
      : '';
    const districtKey = selectedPath.district
      ? baseName(featureName(selectedPath.district))
      : '';
    const mahallaKey = selectedPath.mahalla
      ? baseName(featureName(selectedPath.mahalla))
      : '';

    return allRecords.filter((record) => {
      const text = normalizeText(
        [
          record.region,
          record.district,
          record.address,
          record.settlement,
          record.school_name,
          record.birth_place,
        ]
          .filter(Boolean)
          .join(' ')
      );
      if (regionKey && !text.includes(regionKey)) return false;
      if (districtKey && !text.includes(districtKey)) return false;
      if (mahallaKey && !text.includes(mahallaKey)) return false;
      return true;
    });
  }, [allRecords, selected, selectedPath]);

  const regionMetrics = useMemo(() => {
    const byRegion = new Map();
    (boundaryIndex?.levels?.['1'] || []).forEach((region) => {
      byRegion.set(region.id, {
        analyses: 0,
        admins: 0,
        researchers: 0,
        risk: 0,
        riskRate: 0,
      });
    });

    (stats?.by_region || []).forEach((row) => {
      const region = level1ByName.get(canonicalRegionName(row.region));
      const metric = region ? byRegion.get(region.id) : null;
      if (metric) metric.analyses = row.count || 0;
    });

    (stats?.top_risk_regions || []).forEach((row) => {
      const region = level1ByName.get(canonicalRegionName(row.region));
      const metric = region ? byRegion.get(region.id) : null;
      if (metric) {
        metric.risk = row.count || 0;
        metric.riskRate = Number(row.risk_rate || 0);
      }
    });

    allRecords.forEach((row) => {
      const region = level1ByName.get(
        canonicalRegionName(row.region || row.settlement || row.address)
      );
      const metric = region ? byRegion.get(region.id) : null;
      if (!metric) return;
      if (row.__type === 'admin') metric.admins += 1;
      if (row.__type === 'researcher') metric.researchers += 1;
    });

    return byRegion;
  }, [allRecords, boundaryIndex, level1ByName, stats]);

  const selectedMetric = useMemo(() => {
    const analyses = selectedRecords.filter(
      (row) => row.__type === 'analysis'
    ).length;
    const admins = selectedRecords.filter(
      (row) => row.__type === 'admin'
    ).length;
    const researchers = selectedRecords.filter(
      (row) => row.__type === 'researcher'
    ).length;
    const regionRisk =
      selected?.admin_leve === 1 ? regionMetrics.get(selected.id) || {} : {};
    return {
      analyses,
      admins,
      researchers,
      risk: regionRisk.risk || 0,
      riskRate: regionRisk.riskRate || 0,
    };
  }, [regionMetrics, selected, selectedRecords]);

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

  const getAnalysisLocationText = useCallback((record) => {
    return baseName(
      [
        record.region,
        record.district,
        record.mahalla,
        record.address,
        record.settlement,
        record.school_name,
        record.birth_place,
      ]
        .filter(Boolean)
        .join(' ')
    );
  }, []);

  const getBoundaryPatientCount = useCallback(
    (featureOrItem) => {
      const props = featureOrItem?.properties || featureOrItem || {};
      const level = Number(props.admin_leve || 1);
      const id = props.id;

      if (level === 1) {
        const fromStats =
          regionMetrics.get(id)?.analyses ||
          regionMetrics.get(Number(id))?.analyses;
        if (fromStats) return fromStats;
      }

      const boundaryKey =
        level === 1
          ? canonicalRegionName(featureName(props))
          : baseName(featureName(props));
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
      const regionKey = parentRegion
        ? canonicalRegionName(featureName(parentRegion))
        : '';
      const districtKey =
        level === 2
          ? baseName(featureName(props))
          : parentDistrict
            ? baseName(featureName(parentDistrict))
            : '';

      return analyses.filter((record) => {
        const text = getAnalysisLocationText(record);
        if (level === 1) return text.includes(boundaryKey);
        if (regionKey && !text.includes(regionKey)) return false;
        if (level === 2) return text.includes(boundaryKey);
        if (districtKey && !text.includes(districtKey)) return false;
        return text.includes(boundaryKey);
      }).length;
    },
    [
      analyses,
      boundaryIndex,
      getAnalysisLocationText,
      regionMetrics,
      selectedPath.region,
    ]
  );

  const enrichBoundaryPatientData = useCallback(
    (geoJson = EMPTY_COLLECTION) => ({
      ...geoJson,
      features: (geoJson.features || []).map((feature) => {
        const patientCount = getBoundaryPatientCount(feature);
        return {
          ...feature,
          properties: {
            ...feature.properties,
            patient_count: patientCount,
            has_patient_data: patientCount > 0,
          },
        };
      }),
    }),
    [getBoundaryPatientCount]
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
          ['admin', 'researcher'].includes(item.__type)
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

  const svgMap = useMemo(() => {
    const features = [...(enrichedVisibleGeoJson?.features || [])].sort(
      (a, b) =>
        bboxArea(b.bbox || b.properties?.bbox) -
        bboxArea(a.bbox || a.properties?.bbox)
    );
    const focusedBbox = selected
      ? getCollectionBounds(enrichedVisibleGeoJson)
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
    (level, active, hovered, patientCount = 0) => {
      if (active) return mapColors.selected;
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
    const bounds = getBounds(item.bbox);
    if (bounds) {
      map.fitBounds(bounds, {
        padding: 22,
        duration: 900,
        maxZoom: fallbackZoom,
      });
    } else {
      map.easeTo({
        center: getCenter(item),
        zoom: fallbackZoom,
        duration: 850,
      });
    }
  }, []);

  const selectBoundary = useCallback(
    async (item, level) => {
      if (!item || !indexRef.current) return;
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

  const resetToCountry = useCallback(() => {
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
      mapRef.current.fitBounds(fullBounds, {
        padding: 18,
        duration: 850,
        maxZoom: 5.1,
      });
    } else {
      mapRef.current?.easeTo({
        center: [64.5853, 41.3775],
        zoom: 4.65,
        duration: 800,
      });
    }
  }, [setSourceData]);

  const loadRows = useCallback(async () => {
    setLoadingRows(true);
    try {
      const [analysisResult, researchResult, userResult] =
        await Promise.allSettled([
          AdminApi.analyses.list({ page: 1, page_size: 500, pageSize: 500 }),
          ResearchApi.list({ page: 1, page_size: 500, pageSize: 500 }),
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
      addBoundaryLayers(map, 1, null, isDark);
      addBoundaryLayers(map, 2, null, isDark);
      addBoundaryLayers(map, 3, null, isDark);

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
            4.5,
          ],
          'circle-color': [
            'match',
            ['get', 'type'],
            'admin',
            PIN_COLORS.admin,
            'researcher',
            PIN_COLORS.researcher,
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
          const id =
            event.features?.[0]?.properties?.boundary_id ||
            event.features?.[0]?.id;
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
          const props = event.features?.[0]?.properties;
          if (!props) return;
          const id = Number(props.id);
          const fromIndex =
            level < 3
              ? (indexRef.current?.levels?.[String(level)] || []).find(
                  (item) => Number(item.id) === id
                )
              : level3FeaturesRef.current.find(
                  (feature) => Number(feature.properties?.id) === id
                )?.properties;
          selectBoundary(
            fromIndex || {
              ...props,
              id,
              parent_id: Number(props.parent_id),
              admin_leve: Number(props.admin_leve),
              bbox: parseMaybeJson(props.bbox),
              center: parseMaybeJson(props.center),
              geometry: event.features?.[0]?.geometry,
            },
            level
          );
        });
      });

      map.on('click', 'regional-pins', (event) => {
        event.preventDefault();
        const props = event.features?.[0]?.properties;
        if (!props) return;
        setSelectedPin(props);
        setPinPopupPosition({ left: event.point.x, top: event.point.y });
        map.easeTo({
          center: event.features[0].geometry.coordinates,
          zoom: Math.max(map.getZoom(), 10),
          duration: 700,
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
    const map = mapRef.current;
    if (!map?.getLayer(GOOGLE_SATELLITE_LAYER)) return;
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
    [1, 2, 3].forEach((level) => {
      const meta = LEVEL_META[level];
      if (map.getLayer(meta.fill)) {
        map.setPaintProperty(
          meta.fill,
          'fill-opacity',
          satelliteEnabled ? 0.08 : getBoundaryFillOpacityPaint(level)
        );
      }
      if (map.getLayer(meta.line)) {
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
          satelliteEnabled
            ? 0.92
            : level === 1
              ? 0.76
              : level === 2
                ? 0.64
                : 0.5
        );
        map.setPaintProperty(
          meta.line,
          'line-width',
          satelliteEnabled
            ? level === 1
              ? 3.8
              : level === 2
                ? 3
                : 2.4
            : getBoundaryLineWidthPaint(level)
        );
      }
    });
  }, [isDark, mapColors.background, satelliteEnabled]);

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

  useEffect(() => {
    const map = mapRef.current;
    if (!satelliteEnabled || !map || !svgLngLatBounds) return;
    map.fitBounds(svgLngLatBounds, {
      animate: false,
      duration: 0,
      padding: 0,
    });
  }, [satelliteEnabled, svgLngLatBounds]);

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

  const levelLabel = selected
    ? { 1: mt.region, 2: mt.district, 3: mt.mahalla }[selected.admin_leve]
    : mt.country;

  const getPinRoleLabel = useCallback(
    (pin) => {
      if (pin?.type === 'admin') return mt.admin;
      if (pin?.type === 'researcher') return mt.researcher;
      return pin?.role || pin?.type || '-';
    },
    [mt]
  );

  const formatDateTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleString(locale);
  };

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
  }, [getPinRoleLabel, lang, mt, selectedPin]);

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

  const loading = !mapReady || loadingBoundary;
  const dataLoading = loadingRows || statsLoading;
  const satelliteBoundaryOpacity = satelliteEnabled ? 0 : 1;

  return (
    <Box>
      <Box
        sx={{
          mb: 2,
          p: 2.5,
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
          spacing={2}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
              <Public color="primary" />
              <Typography variant="h4" fontWeight={900}>
                {mt.title}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
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
              <Chip label={mt.analyticsLoading} sx={{ fontWeight: 800 }} />
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
        }}
      >
        <Paper
          elevation={0}
          sx={{
            position: 'relative',
            height: { xs: 720, lg: 900 },
            minHeight: 680,
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
              opacity: satelliteEnabled ? 1 : 0.01,
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
              bgcolor: satelliteEnabled ? 'transparent' : mapColors.background,
              overscrollBehavior: 'contain',
              touchAction: 'none',
              cursor: panDragRef.current ? 'grabbing' : 'grab',
              '@keyframes svgLayerFade': {
                '0%': { opacity: 0.42 },
                '100%': { opacity: 1 },
              },
            }}
          >
            <svg
              ref={svgRef}
              viewBox={svgViewBox}
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid slice"
              role="img"
              aria-label={mt.title}
              style={{
                opacity: satelliteEnabled ? 0 : 1,
                shapeRendering: 'geometricPrecision',
                transition: 'opacity 160ms ease',
              }}
            >
              <rect
                width={SVG_WIDTH}
                height={SVG_HEIGHT}
                fill={satelliteEnabled ? 'transparent' : mapColors.background}
              />
              <text
                x={SVG_WIDTH / 2}
                y={SVG_HEIGHT / 2}
                textAnchor="middle"
                fill={mapColors.label}
                opacity={satelliteEnabled ? '0' : '0.12'}
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
                        fill={getSvgFill(level, active, hovered, patientCount)}
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
                          transition:
                            'fill 180ms ease, fill-opacity 180ms ease, stroke 180ms ease, stroke-width 180ms ease',
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
                        <title>
                          {(
                            mt.patientDataTooltip ||
                            MAP_I18N.uz.patientDataTooltip
                          )(localizedFeatureName(item, lang), patientCount)}
                        </title>
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
                      fill={mapColors.label}
                      stroke={mapColors.labelHalo}
                      strokeWidth={label.active ? 1.8 : 1.15}
                      paintOrder="stroke fill"
                      fontSize={label.size}
                      fontWeight={
                        label.active ? 850 : label.level === 1 ? 780 : 700
                      }
                      opacity={
                        label.active ? 0.88 : label.level === 3 ? 0.42 : 0.56
                      }
                      style={{
                        textShadow: isDark
                          ? '0 1px 1px rgba(0,0,0,0.22)'
                          : '0 1px 1px rgba(255,255,255,0.28)',
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
                        <circle cy="-6" r="17" fill={color} opacity="0.14" />
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
                        <title>{`${props.name} - ${props.role || props.type}`}</title>
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
                  zIndex: 6,
                  width: 280,
                  maxWidth: 'calc(100% - 28px)',
                  p: 1.4,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor:
                    selectedPin.type === 'researcher'
                      ? 'rgba(124,58,237,0.45)'
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
          <Tooltip title={satelliteEnabled ? mt.satelliteOff : mt.satelliteOn}>
            <Button
              variant={satelliteEnabled ? 'contained' : 'outlined'}
              size="small"
              startIcon={<SatelliteAlt />}
              onClick={() => setSatelliteEnabled((value) => !value)}
              sx={{
                position: 'absolute',
                top: 14,
                right: { xs: 14, sm: 64 },
                zIndex: 8,
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
              Satellite
            </Button>
          </Tooltip>
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
              top: 16,
              zIndex: 3,
              maxWidth: 'calc(100% - 96px)',
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
            height: { xs: 'auto', lg: 900 },
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

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              mt={2}
            >
              <StatPill
                label={mt.analyses}
                value={selectedMetric.analyses || 0}
                color="#0f766e"
              />
              <StatPill
                label={mt.admin}
                value={selectedMetric.admins || 0}
                color="#2563eb"
              />
              <StatPill
                label={mt.researcher}
                value={selectedMetric.researchers || 0}
                color="#7c3aed"
              />
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              mt={1}
            >
              <StatPill
                label={mt.nextLayer}
                value={childCount}
                color="#f59e0b"
              />
              <StatPill
                label={mt.area}
                value={formatArea(selectedAreaSquareMeters, locale)}
                color="text.primary"
              />
            </Stack>

            <Box mt={2.25}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={0.75}
              >
                <Typography variant="body2" fontWeight={700}>
                  {mt.riskSignal}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={900}
                  sx={{ color: getRiskColor(selectedMetric.riskRate || 0) }}
                >
                  {selectedMetric.riskRate || 0}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.min(selectedMetric.riskRate || 0, 100)}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: 'rgba(100,116,139,0.14)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: getRiskColor(selectedMetric.riskRate || 0),
                  },
                }}
              />
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

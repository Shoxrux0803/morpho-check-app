import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { AdminApi } from '../services/AdminApi';
import {
  generateConsentDocxById,
  generateDocx,
  generatePdf,
  generatePdfById,
  generateDocxById,
} from '../services/api';
import { LANGUAGES, useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

// Material UI importlari
import {
  Container,
  Grid,
  Typography,
  Paper,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Box,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Stack,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Delete,
  Download,
  FilterList,
  Close,
  Dashboard as DashboardIcon,
  List as ListIcon,
  Lock,
  Visibility,
  Assessment,
  BiotechOutlined,
  Logout,
  Refresh,
  ErrorOutline,
  CheckCircle,
} from '@mui/icons-material';
import LogoutConfirmDialog from '../components/LogoutConfirmDialog';
import { pageT } from '../utils/pageI18n';
import { getLocalizedLocationLabel } from '../utils/locationI18n';
import { normalizePreviewScript } from '../utils/scriptI18n';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import LoginExperience from '../components/Auth/LoginExperience';

// Modular Components
import AdminDashboard from '../components/Dashboard/AdminDashboard';
import AdminScientificAnalysis from '../components/Dashboard/AdminScientificAnalysis';
import AdminFilters from '../components/Admin/AdminFilters';
import AdminTable from '../components/Admin/AdminTable';
import InputForm from '../components/InputForm';
import ResearcherDataView from '../components/Admin/ResearcherDataView';
import DashboardFilters from '../components/Dashboard/DashboardFilters';
import { ConsentStatus } from '../components/Consent/PrivacyConsentPanel';
import {
  canUsePermission,
  getAdminPermissionLabels,
} from '../utils/adminPermissions';

/** ===== Helpers ===== */
const calcBMI = (wKg, hCm) => {
  const h = Number(hCm) / 100;
  if (!h || !wKg) return null;
  return Math.round((Number(wKg) / (h * h)) * 10) / 10;
};

const bmiStatus = (bmi, age) => {
  if (!bmi) return '-';
  if (age >= 20) {
    if (bmi < 18.5) return "Ozg'in";
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Ortiqcha';
    return 'Semizlik';
  }
  return bmi < 18.5 ? "Ozg'in" : bmi < 25 ? 'Normal' : 'Ortiqcha';
};

const normalize = (r) => {
  const bmiVal = r.bmi ?? calcBMI(r.weight, r.height);
  return {
    ...r,
    idCode: r.id_code || r.idCode,
    createdAt: r.created_at || r.createdAt,
    firstName: r.first_name || r.firstName,
    lastName: r.last_name || r.lastName,
    parentsPhone: r.parents_phone || r.parentsPhone || '',
    doctorNote: r.doctor_note || r.doctorNote || '',
    consentConfirmed: r.consent_confirmed ?? r.consentConfirmed ?? false,
    consentGuardianName: r.consent_guardian_name || r.consentGuardianName || '',
    consentGuardianRelationship:
      r.consent_guardian_relationship || r.consentGuardianRelationship || '',
    consentGuardianPhone:
      r.consent_guardian_phone || r.consentGuardianPhone || '',
    consentPolicyVersion:
      r.consent_policy_version || r.consentPolicyVersion || '',
    bmi: bmiVal,
    bmiStatus: r.bmi_status || bmiStatus(bmiVal, r.age),
  };
};

const normalizeImportError = (err, unknownError = 'Unknown error') => {
  if (typeof err === 'string') {
    const match = err.match(/Row\s+(\d+):\s*(.*)/i);
    return {
      row: match ? Number(match[1]) : '-',
      field: '-',
      message: match ? match[2] : err,
      value: '',
    };
  }

  return {
    row: err?.row ?? '-',
    field: err?.field || '-',
    message: err?.message || err?.detail || unknownError,
    value: err?.value ?? '',
  };
};

const horizontalScrollSx = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
  '&::-webkit-scrollbar': {
    height: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: (theme) =>
      theme.palette.mode === 'dark'
        ? 'rgba(255,255,255,0.14)'
        : 'rgba(99,102,241,0.22)',
    borderRadius: '10px',
  },
};

const PAGE_LABELS = {
  uz: { scientificAnalysis: 'Ilmiy Tahlil' },
  ru: { scientificAnalysis: 'Научный анализ' },
  en: { scientificAnalysis: 'Scientific Analysis' },
  tm: { scientificAnalysis: 'Ylmy analiz' },
  tg: { scientificAnalysis: 'Таҳлили илмӣ' },
  kz: { scientificAnalysis: 'Ғылыми талдау' },
  ky: { scientificAnalysis: 'Илимий талдоо' },
};

const REGION_LABELS_RU = {
  'toshkent shahri': 'г. Ташкент',
  toshkent: 'Ташкентская область',
  'toshkent viloyati': 'Ташкентская область',
  qoraqalpogiston: 'Республика Каракалпакстан',
  "qoraqalpog'iston": 'Республика Каракалпакстан',
  andijon: 'Андижанская область',
  buxoro: 'Бухарская область',
  fargona: 'Ферганская область',
  "farg'ona": 'Ферганская область',
  jizzax: 'Джизакская область',
  xorazm: 'Хорезмская область',
  namangan: 'Наманганская область',
  navoiy: 'Навоийская область',
  qashqadaryo: 'Кашкадарьинская область',
  samarqand: 'Самаркандская область',
  sirdaryo: 'Сырдарьинская область',
  surxondaryo: 'Сурхандарьинская область',
};

const getRegionLabel = (value, lang) => {
  if (lang !== 'ru') return value || '-';
  const key = String(value || '')
    .toLowerCase()
    .replace(/[‘’`ʻʼ]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return REGION_LABELS_RU[key] || value || '-';
};

const getDateLocale = (lang) => {
  if (lang === 'ru') return 'ru-RU';
  if (lang === 'kz') return 'kk-KZ';
  if (lang === 'en') return 'en-US';
  if (lang === 'tr') return 'tr-TR';
  return 'uz-UZ';
};

const XLSX_PREVIEW_COLUMNS = [
  { key: 'date', label: 'Sana' },
  { key: 'idCode', label: 'ID kod' },
  { key: 'fullName', label: 'F.I.SH.' },
  { key: 'gender', label: 'Jins' },
  { key: 'age', label: 'Yosh' },
  { key: 'region', label: 'Viloyat' },
  { key: 'district', label: 'Tuman' },
  { key: 'address', label: 'Manzil' },
  { key: 'admin', label: 'Kiritdi' },
  { key: 'height', label: "Bo'y (sm)" },
  { key: 'weight', label: 'Vazn (kg)' },
  { key: 'bmi', label: 'IAV' },
  { key: 'status', label: 'Holat' },
  { key: 'somatotype', label: 'Somatotip' },
  { key: 'idealWeight', label: 'Ideal Vazn (kg)' },
  { key: 'weightDiff', label: 'Farq (kg)' },
  { key: 'weightRange', label: "Vazn Oraliq'i" },
  { key: 'chest', label: "Ko'krak ayl." },
  { key: 'waist', label: 'Bel ayl.' },
  { key: 'head', label: 'Bosh ayl.' },
  { key: 'shoulderLength', label: 'Yelka uzunligi' },
  { key: 'shoulderBreadth', label: 'Elka keng.' },
  { key: 'shoulderCircumference', label: 'Yelka aylanasi' },
  { key: 'armElbowLength', label: 'Bilak uzunligi' },
  { key: 'handLength', label: 'Panja uzunligi' },
  { key: 'thighLength', label: 'Son uzunligi' },
  { key: 'thighCircumference', label: 'Son ayl.' },
  { key: 'calfLength', label: 'Boldir uzunligi' },
  { key: 'calfCircumference', label: 'Boldir aylanasi' },
  { key: 'footLength', label: 'Oyoq panja uzunligi' },
  { key: 'shoulderRatio', label: 'Elka prop.' },
  { key: 'thighRatio', label: 'Son prop.' },
  { key: 'hmai', label: 'HMAI' },
  { key: 'mii', label: 'MII' },
  { key: 'adi', label: 'ADI' },
  { key: 'tbwPercent', label: 'TBW (%)' },
  { key: 'fatPercent', label: "Yo'g' (%)" },
  { key: 'fatMass', label: "Yo'g' (kg)" },
  { key: 'muscleMass', label: 'Muscul (kg)' },
  { key: 'boneMass', label: 'Suyak (kg)' },
  { key: 'acmPercent', label: 'ACM (%)' },
  { key: 'visceralFat', label: "Visceral Yo'g'" },
  { key: 'bodyLength', label: 'Tana uzunligi (sm)' },
  { key: 'parentsPhone', label: 'Ota-ona telefon raqami' },
];

const XLSX_PERMISSION_COLUMN_MAP = {
  shoulderLength: 'shoulder_length',
  shoulderBreadth: 'shoulder_breadth',
  shoulderCircumference: 'shoulder_circumference',
  armElbowLength: 'arm_elbow_length',
  handLength: 'hand_length',
  thighLength: 'thigh_length',
  thighCircumference: 'thigh_circumference',
  calfLength: 'calf_length',
  calfCircumference: 'calf_circumference',
  footLength: 'foot_length',
  shoulderRatio: 'shoulder_breadth',
  thighRatio: 'thigh_circumference',
  tbwPercent: 'bioimpedance',
  fatPercent: 'bioimpedance',
  fatMass: 'bioimpedance',
  muscleMass: 'bioimpedance',
  boneMass: 'bioimpedance',
  acmPercent: 'bioimpedance',
  visceralFat: 'bioimpedance',
  bodyLength: 'bioimpedance',
};

const XLSX_ANTHROPOMETRY_PERMISSION_KEYS = [
  'shoulder_length',
  'shoulder_breadth',
  'shoulder_circumference',
  'arm_elbow_length',
  'hand_length',
  'thigh_length',
  'thigh_circumference',
  'calf_length',
  'calf_circumference',
  'foot_length',
];

const isXlsxPreviewColumnEnabled = (columnKey, permissions) => {
  if (['hmai', 'mii', 'adi'].includes(columnKey)) {
    return XLSX_ANTHROPOMETRY_PERMISSION_KEYS.some((key) =>
      canUsePermission(permissions, key)
    );
  }
  const permissionKey = XLSX_PERMISSION_COLUMN_MAP[columnKey];
  return permissionKey ? canUsePermission(permissions, permissionKey) : true;
};
const XLSX_MODAL_TEXT = {
  uz: {
    adminTitle: 'Umumiy XLSX report',
    adminSubtitle:
      "Yuklab olishdan oldin XLSX reportdagi ustunlar va ma'lumotlarni shu yerda ko'ring.",
    showing: "Ko'rsatilmoqda",
    previewLimit:
      "Preview birinchi 200 qatorni ko'rsatadi, XLSX to'liq yuklanadi.",
    downloading: 'Yuklanmoqda...',
    download: 'XLSX yuklab olish',
  },
  ru: {
    adminTitle: 'Общий XLSX отчет',
    adminSubtitle:
      'Перед скачиванием просмотрите столбцы и данные XLSX отчета.',
    showing: 'Показано',
    previewLimit:
      'Предпросмотр показывает первые 200 строк, XLSX будет скачан полностью.',
    downloading: 'Загрузка...',
    download: 'Скачать XLSX',
  },
  en: {
    adminTitle: 'General XLSX report',
    adminSubtitle:
      'Preview the XLSX report columns and data before downloading.',
    showing: 'Showing',
    previewLimit:
      'Preview shows the first 200 rows; the XLSX download includes all rows.',
    downloading: 'Downloading...',
    download: 'Download XLSX',
  },
  kz: {
    adminTitle: 'Жалпы XLSX есеп',
    adminSubtitle:
      'Жүктеп алудан бұрын XLSX есеп бағандары мен деректерін көріңіз.',
    showing: 'Көрсетілді',
    previewLimit:
      'Алдын ала көру алғашқы 200 жолды көрсетеді, XLSX толық жүктеледі.',
    downloading: 'Жүктелуде...',
    download: 'XLSX жүктеп алу',
  },
  ky: {
    adminTitle: 'Жалпы XLSX отчет',
    adminSubtitle:
      'Жүктөөдөн мурун XLSX отчеттун тилкелерин жана маалыматтарын көрүңүз.',
    showing: 'Көрсөтүлдү',
    previewLimit:
      'Алдын ала көрүү биринчи 200 сапты көрсөтөт, XLSX толук жүктөлөт.',
    downloading: 'Жүктөлүүдө...',
    download: 'XLSX жүктөө',
  },
  tg: {
    adminTitle: 'Ҳисоботи умумии XLSX',
    adminSubtitle:
      'Пеш аз боргирӣ сутунҳо ва маълумоти ҳисоботи XLSX-ро бинед.',
    showing: 'Намоиш дода шуд',
    previewLimit:
      'Пешнамоиш 200 сатри аввалро нишон медиҳад, XLSX пурра боргирӣ мешавад.',
    downloading: 'Боргирӣ...',
    download: 'Боргирии XLSX',
  },
  tm: {
    adminTitle: 'Umumy XLSX hasabat',
    adminSubtitle:
      'Yuklemezden öň XLSX hasabatynyň sütünlerini we maglumatlaryny görüň.',
    showing: 'Görkezilýär',
    previewLimit:
      'Öňünden syn ilkinji 200 setiri görkezýär, XLSX doly ýüklenýär.',
    downloading: 'Ýüklenýär...',
    download: 'XLSX ýükle',
  },
  tr: {
    adminTitle: 'Genel XLSX raporu',
    adminSubtitle:
      'İndirmeden önce XLSX raporundaki sütunları ve verileri görüntüleyin.',
    showing: 'Gösteriliyor',
    previewLimit: 'Önizleme ilk 200 satırı gösterir, XLSX tamamen indirilir.',
    downloading: 'İndiriliyor...',
    download: 'XLSX indir',
  },
};

const ADMIN_XLSX_COLUMN_LABELS = {
  uz: {
    date: 'Sana',
    idCode: 'ID kod',
    fullName: 'F.I.SH.',
    gender: 'Jins',
    age: 'Yosh',
    region: 'Viloyat',
    district: 'Tuman',
    address: 'Manzil',
    admin: 'Kiritdi',
    height: "Bo'y (sm)",
    weight: 'Vazn (kg)',
    bmi: 'IAV',
    status: 'Holat',
    somatotype: 'Somatotip',
    idealWeight: 'Ideal vazn (kg)',
    weightDiff: 'Farq (kg)',
    weightRange: "Vazn oralig'i",
    chest: "Ko'krak ayl.",
    waist: 'Bel ayl.',
    head: 'Bosh ayl.',
    shoulderBreadth: 'Yelka keng.',
    shoulderRatio: 'Yelka prop.',
    thighCircumference: 'Son ayl.',
    thighRatio: 'Son prop.',
    hmai: 'HMAI',
    mii: 'MII',
    adi: 'ADI',
    tbwPercent: 'TBW (%)',
    fatPercent: "Yog' (%)",
    fatMass: "Yog' (kg)",
    muscleMass: 'Muskul (kg)',
    boneMass: 'Suyak (kg)',
    acmPercent: 'ACM (%)',
    visceralFat: "Visceral yog'",
    bodyLength: 'Tana uzunligi (sm)',
    parentsPhone: 'Ota-ona telefon raqami',
  },
  ru: {
    date: 'Дата',
    idCode: 'ID код',
    fullName: 'Ф.И.О.',
    gender: 'Пол',
    age: 'Возраст',
    region: 'Область',
    district: 'Район',
    address: 'Адрес',
    admin: 'Ввел',
    height: 'Рост (см)',
    weight: 'Вес (кг)',
    bmi: 'ИМТ',
    status: 'Статус',
    somatotype: 'Соматотип',
    idealWeight: 'Идеальный вес (кг)',
    weightDiff: 'Разница (кг)',
    weightRange: 'Диапазон веса',
    chest: 'Окр. груди',
    waist: 'Окр. талии',
    head: 'Окр. головы',
    shoulderBreadth: 'Ширина плеч',
    shoulderRatio: 'Проп. плеч',
    thighCircumference: 'Окр. бедра',
    thighRatio: 'Проп. бедра',
    hmai: 'HMAI',
    mii: 'MII',
    adi: 'ADI',
    tbwPercent: 'TBW (%)',
    fatPercent: 'Жир (%)',
    fatMass: 'Жир (кг)',
    muscleMass: 'Мышцы (кг)',
    boneMass: 'Кость (кг)',
    acmPercent: 'ACM (%)',
    visceralFat: 'Висцеральный жир',
    bodyLength: 'Длина тела (см)',
    parentsPhone: 'Телефон родителей',
  },
  en: {
    date: 'Date',
    idCode: 'ID code',
    fullName: 'Full name',
    gender: 'Gender',
    age: 'Age',
    region: 'Region',
    district: 'District',
    address: 'Address',
    admin: 'Entered by',
    height: 'Height (cm)',
    weight: 'Weight (kg)',
    bmi: 'BMI',
    status: 'Status',
    somatotype: 'Somatotype',
    idealWeight: 'Ideal weight (kg)',
    weightDiff: 'Difference (kg)',
    weightRange: 'Weight range',
    chest: 'Chest circ.',
    waist: 'Waist circ.',
    head: 'Head circ.',
    shoulderBreadth: 'Shoulder breadth',
    shoulderRatio: 'Shoulder prop.',
    thighCircumference: 'Thigh circ.',
    thighRatio: 'Thigh prop.',
    hmai: 'HMAI',
    mii: 'MII',
    adi: 'ADI',
    tbwPercent: 'TBW (%)',
    fatPercent: 'Fat (%)',
    fatMass: 'Fat (kg)',
    muscleMass: 'Muscle (kg)',
    boneMass: 'Bone (kg)',
    acmPercent: 'ACM (%)',
    visceralFat: 'Visceral fat',
    bodyLength: 'Body length (cm)',
    parentsPhone: 'Parent phone number',
  },
};

ADMIN_XLSX_COLUMN_LABELS.kz = {
  date: 'Күні',
  idCode: 'ID коды',
  fullName: 'Аты-жөні',
  gender: 'Жынысы',
  age: 'Жасы',
  region: 'Өңір',
  district: 'Аудан',
  address: 'Мекенжай',
  admin: 'Енгізді',
  height: 'Бойы (см)',
  weight: 'Салмағы (кг)',
  bmi: 'BMI',
  status: 'Күйі',
  somatotype: 'Соматотип',
  idealWeight: 'Идеал салмақ (кг)',
  weightDiff: 'Айырма (кг)',
  weightRange: 'Салмақ аралығы',
  chest: 'Кеуде айн.',
  waist: 'Бел айн.',
  head: 'Бас айн.',
  shoulderBreadth: 'Иық ені',
  shoulderRatio: 'Иық проп.',
  thighCircumference: 'Сан айн.',
  thighRatio: 'Сан проп.',
  hmai: 'HMAI',
  mii: 'MII',
  adi: 'ADI',
  tbwPercent: 'TBW (%)',
  fatPercent: 'Май (%)',
  fatMass: 'Май (кг)',
  muscleMass: 'Бұлшықет (кг)',
  boneMass: 'Сүйек (кг)',
  acmPercent: 'ACM (%)',
  visceralFat: 'Висцералды май',
  bodyLength: 'Дене ұзындығы (см)',
  parentsPhone: 'Ата-ана телефоны',
};
ADMIN_XLSX_COLUMN_LABELS.ky = {
  date: 'Күнү',
  idCode: 'ID коду',
  fullName: 'Аты-жөнү',
  gender: 'Жынысы',
  age: 'Жашы',
  region: 'Аймак',
  district: 'Район',
  address: 'Дарек',
  admin: 'Киргизди',
  height: 'Бою (см)',
  weight: 'Салмагы (кг)',
  bmi: 'BMI',
  status: 'Абалы',
  somatotype: 'Соматотип',
  idealWeight: 'Идеал салмак (кг)',
  weightDiff: 'Айырма (кг)',
  weightRange: 'Салмак аралыгы',
  chest: 'Көкүрөк айл.',
  waist: 'Бел айл.',
  head: 'Баш айл.',
  shoulderBreadth: 'Ийин кеңдиги',
  shoulderRatio: 'Ийин проп.',
  thighCircumference: 'Сан айл.',
  thighRatio: 'Сан проп.',
  hmai: 'HMAI',
  mii: 'MII',
  adi: 'ADI',
  tbwPercent: 'TBW (%)',
  fatPercent: 'Май (%)',
  fatMass: 'Май (кг)',
  muscleMass: 'Булчуң (кг)',
  boneMass: 'Сөөк (кг)',
  acmPercent: 'ACM (%)',
  visceralFat: 'Висцералдык май',
  bodyLength: 'Дене узундугу (см)',
  parentsPhone: 'Ата-эне телефону',
};
ADMIN_XLSX_COLUMN_LABELS.tg = {
  date: 'Сана',
  idCode: 'ID код',
  fullName: 'Ному насаб',
  gender: 'Ҷинс',
  age: 'Синну сол',
  region: 'Вилоят',
  district: 'Ноҳия',
  address: 'Суроға',
  admin: 'Ворид кард',
  height: 'Қад (см)',
  weight: 'Вазн (кг)',
  bmi: 'BMI',
  status: 'Ҳолат',
  somatotype: 'Соматотип',
  idealWeight: 'Вазни идеалӣ (кг)',
  weightDiff: 'Фарқ (кг)',
  weightRange: 'Фосилаи вазн',
  chest: 'Даври сина',
  waist: 'Даври миён',
  head: 'Даври сар',
  shoulderBreadth: 'Паҳнои китф',
  shoulderRatio: 'Проп. китф',
  thighCircumference: 'Даври рон',
  thighRatio: 'Проп. рон',
  hmai: 'HMAI',
  mii: 'MII',
  adi: 'ADI',
  tbwPercent: 'TBW (%)',
  fatPercent: 'Равған (%)',
  fatMass: 'Равған (кг)',
  muscleMass: 'Мушак (кг)',
  boneMass: 'Устухон (кг)',
  acmPercent: 'ACM (%)',
  visceralFat: 'Равғани висцералӣ',
  bodyLength: 'Дарозии бадан (см)',
  parentsPhone: 'Телефони волидон',
};
ADMIN_XLSX_COLUMN_LABELS.tm = {
  date: 'Sene',
  idCode: 'ID kod',
  fullName: 'Doly ady',
  gender: 'Jyns',
  age: 'Ýaş',
  region: 'Welaýat',
  district: 'Etrap',
  address: 'Salgysy',
  admin: 'Girizen',
  height: 'Boý (sm)',
  weight: 'Agram (kg)',
  bmi: 'BMI',
  status: 'Ýagdaý',
  somatotype: 'Somatotip',
  idealWeight: 'Ideal agram (kg)',
  weightDiff: 'Tapawut (kg)',
  weightRange: 'Agram aralygy',
  chest: 'Döş aýl.',
  waist: 'Bil aýl.',
  head: 'Baş aýl.',
  shoulderBreadth: 'Egin giňligi',
  shoulderRatio: 'Egin prop.',
  thighCircumference: 'But aýl.',
  thighRatio: 'But prop.',
  hmai: 'HMAI',
  mii: 'MII',
  adi: 'ADI',
  tbwPercent: 'TBW (%)',
  fatPercent: 'Ýag (%)',
  fatMass: 'Ýag (kg)',
  muscleMass: 'Myşsa (kg)',
  boneMass: 'Süňk (kg)',
  acmPercent: 'ACM (%)',
  visceralFat: 'Wisseral ýag',
  bodyLength: 'Beden uzynlygy (sm)',
  parentsPhone: 'Ene-ata telefony',
};
ADMIN_XLSX_COLUMN_LABELS.tr = {
  date: 'Tarih',
  idCode: 'ID kodu',
  fullName: 'Ad Soyad',
  gender: 'Cinsiyet',
  age: 'Yaş',
  region: 'Bölge',
  district: 'İlçe',
  address: 'Adres',
  admin: 'Giren',
  height: 'Boy (cm)',
  weight: 'Kilo (kg)',
  bmi: 'BMI',
  status: 'Durum',
  somatotype: 'Somatotip',
  idealWeight: 'İdeal kilo (kg)',
  weightDiff: 'Fark (kg)',
  weightRange: 'Kilo aralığı',
  chest: 'Göğüs çev.',
  waist: 'Bel çev.',
  head: 'Baş çev.',
  shoulderBreadth: 'Omuz geniş.',
  shoulderRatio: 'Omuz prop.',
  thighCircumference: 'Uyluk çev.',
  thighRatio: 'Uyluk prop.',
  hmai: 'HMAI',
  mii: 'MII',
  adi: 'ADI',
  tbwPercent: 'TBW (%)',
  fatPercent: 'Yağ (%)',
  fatMass: 'Yağ (kg)',
  muscleMass: 'Kas (kg)',
  boneMass: 'Kemik (kg)',
  acmPercent: 'ACM (%)',
  visceralFat: 'Visseral yağ',
  bodyLength: 'Vücut uzunluğu (cm)',
  parentsPhone: 'Ebeveyn telefonu',
};

Object.assign(ADMIN_XLSX_COLUMN_LABELS.uz, {
  shoulderLength: 'Yelka uzunligi (sm)',
  shoulderBreadth: 'Yelka kengligi (sm)',
  shoulderCircumference: 'Yelka aylanasi (sm)',
  armElbowLength: 'Bilak uzunligi (sm)',
  handLength: 'Panja uzunligi (sm)',
  thighLength: 'Son uzunligi (sm)',
  thighCircumference: 'Son aylanasi (sm)',
  calfLength: 'Boldir uzunligi (sm)',
  calfCircumference: 'Boldir aylanasi (sm)',
  footLength: 'Oyoq panja uzunligi (sm)',
});
Object.assign(ADMIN_XLSX_COLUMN_LABELS.ru, {
  shoulderLength: 'Длина плеча (см)',
  shoulderBreadth: 'Ширина плеч (см)',
  shoulderCircumference: 'Окружность плеча (см)',
  armElbowLength: 'Длина предплечья (см)',
  handLength: 'Длина кисти (см)',
  thighLength: 'Длина бедра (см)',
  thighCircumference: 'Окружность бедра (см)',
  calfLength: 'Длина голени (см)',
  calfCircumference: 'Окружность голени (см)',
  footLength: 'Длина стопы (см)',
});
Object.assign(ADMIN_XLSX_COLUMN_LABELS.en, {
  shoulderLength: 'Shoulder length (cm)',
  shoulderBreadth: 'Shoulder breadth (cm)',
  shoulderCircumference: 'Shoulder circumference (cm)',
  armElbowLength: 'Forearm length (cm)',
  handLength: 'Hand length (cm)',
  thighLength: 'Thigh length (cm)',
  thighCircumference: 'Thigh circumference (cm)',
  calfLength: 'Calf length (cm)',
  calfCircumference: 'Calf circumference (cm)',
  footLength: 'Foot length (cm)',
});
Object.assign(ADMIN_XLSX_COLUMN_LABELS.kz, {
  shoulderLength: 'Иық ұзындығы (см)',
  shoulderBreadth: 'Иық ені (см)',
  shoulderCircumference: 'Иық айналымы (см)',
  armElbowLength: 'Білек ұзындығы (см)',
  handLength: 'Қол басы ұзындығы (см)',
  thighLength: 'Сан ұзындығы (см)',
  thighCircumference: 'Сан айналымы (см)',
  calfLength: 'Балтыр ұзындығы (см)',
  calfCircumference: 'Балтыр айналымы (см)',
  footLength: 'Аяқ басы ұзындығы (см)',
});
Object.assign(ADMIN_XLSX_COLUMN_LABELS.ky, {
  shoulderLength: 'Ийин узундугу (см)',
  shoulderBreadth: 'Ийин кеңдиги (см)',
  shoulderCircumference: 'Ийин айланасы (см)',
  armElbowLength: 'Билек узундугу (см)',
  handLength: 'Кол манжа узундугу (см)',
  thighLength: 'Сан узундугу (см)',
  thighCircumference: 'Сан айланасы (см)',
  calfLength: 'Балтыр узундугу (см)',
  calfCircumference: 'Балтыр айланасы (см)',
  footLength: 'Бут манжа узундугу (см)',
});
Object.assign(ADMIN_XLSX_COLUMN_LABELS.tg, {
  shoulderLength: 'Дарозии китф (см)',
  shoulderBreadth: 'Паҳнои китф (см)',
  shoulderCircumference: 'Даври китф (см)',
  armElbowLength: 'Дарозии соид (см)',
  handLength: 'Дарозии панҷаи даст (см)',
  thighLength: 'Дарозии рон (см)',
  thighCircumference: 'Даври рон (см)',
  calfLength: 'Дарозии соқ (см)',
  calfCircumference: 'Даври соқ (см)',
  footLength: 'Дарозии панҷаи пой (см)',
});
Object.assign(ADMIN_XLSX_COLUMN_LABELS.tm, {
  shoulderLength: 'Yelka uzynlygy (sm)',
  shoulderBreadth: 'Yelka inligi (sm)',
  shoulderCircumference: 'Yelka aylawy (sm)',
  armElbowLength: 'Bilek uzynlygy (sm)',
  handLength: 'Penje uzynlygy (sm)',
  thighLength: 'Son uzynlygy (sm)',
  thighCircumference: 'Son aylawy (sm)',
  calfLength: 'Boldur uzynlygy (sm)',
  calfCircumference: 'Boldur aylawy (sm)',
  footLength: 'Ayak dabanynyn uzynlygy (sm)',
});
Object.assign(ADMIN_XLSX_COLUMN_LABELS.tr, {
  shoulderLength: 'Omuz uzunluğu (cm)',
  shoulderBreadth: 'Omuz genişliği (cm)',
  shoulderCircumference: 'Omuz çevresi (cm)',
  armElbowLength: 'Önkol uzunluğu (cm)',
  handLength: 'El uzunluğu (cm)',
  thighLength: 'Uyluk uzunluğu (cm)',
  thighCircumference: 'Uyluk çevresi (cm)',
  calfLength: 'Baldır uzunluğu (cm)',
  calfCircumference: 'Baldır çevresi (cm)',
  footLength: 'Ayak uzunluğu (cm)',
});
const getXlsxText = (lang) => XLSX_MODAL_TEXT[lang] || XLSX_MODAL_TEXT.uz;
const XLSX_PERMISSION_LABEL_BY_COLUMN = {
  shoulderLength: 'shoulder_length',
  shoulderBreadth: 'shoulder_breadth',
  shoulderCircumference: 'shoulder_circumference',
  armElbowLength: 'arm_elbow_length',
  handLength: 'hand_length',
  thighLength: 'thigh_length',
  thighCircumference: 'thigh_circumference',
  calfLength: 'calf_length',
  calfCircumference: 'calf_circumference',
  footLength: 'foot_length',
};

const getAdminXlsxColumnLabel = (key, lang) => {
  const directLabel = (ADMIN_XLSX_COLUMN_LABELS[lang] ||
    ADMIN_XLSX_COLUMN_LABELS.uz)[key];
  if (directLabel) return directLabel;
  const permissionKey = XLSX_PERMISSION_LABEL_BY_COLUMN[key];
  if (permissionKey) {
    return `${getAdminPermissionLabels(lang)[permissionKey]} (cm)`;
  }
  return key;
};

const normalizePreviewText = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[’‘`ʼʻ]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const ADMIN_VALUE_TRANSLATIONS = {
  gender: [
    {
      match: ['erkak', 'male', 'm', 'boy', "o'g'il bola", 'ўғил бола'],
      key: 'male',
    },
    {
      match: ['ayol', 'female', 'f', 'girl', 'qiz bola', 'қиз бола'],
      key: 'female',
    },
  ],
  bmiStatus: [
    { match: ['normal', 'norma', "me'yor", 'меъёр', 'норма'], key: 'normal' },
    {
      match: ['ortiqcha', 'overweight', 'избыточ', 'артық', 'ашыкча'],
      key: 'overweight',
    },
    { match: ['semizlik', 'obese', 'ожир', 'семіз', 'семир'], key: 'obese' },
    {
      match: ["ozg'in", 'underweight', 'камвазн', 'недостат', 'арык'],
      key: 'underweight',
    },
  ],
};

const localizeAdminPreviewValue = (key, value, lang, pt) => {
  if (value === undefined || value === null || value === '') return '-';
  const normalized = normalizePreviewText(value);
  const group =
    key === 'gender'
      ? ADMIN_VALUE_TRANSLATIONS.gender
      : key === 'status'
        ? ADMIN_VALUE_TRANSLATIONS.bmiStatus
        : null;
  const matched = group?.find((item) =>
    item.match.some((pattern) => normalized.includes(pattern))
  );
  const localized = matched ? pt(matched.key) : value;
  return normalizePreviewScript(key, localized, lang);
};

const translateBmiStatus = (value, lang) => {
  if (lang !== 'ru') return value || '-';
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('normal')) return 'Норма';
  if (normalized.includes('semizlik') || normalized.includes('obese'))
    return 'Ожирение';
  if (normalized.includes('ozg') || normalized.includes('underweight'))
    return 'Недостаточный вес';
  if (normalized.includes('ortiqcha') || normalized.includes('overweight'))
    return 'Избыточный вес';
  return value || '-';
};

function CustomModal({
  children,
  onClose,
  title,
  onDownloadDocx,
  isDownloading,
  onDownloadPdf,
  isPdfDownloading,
  pdfLang,
  setPdfLang,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { lang } = useLanguage();
  const pt = useCallback((key) => pageT(lang, key), [lang]);

  return (
    <Dialog
      open={true}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight="bold">
            {title}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      <DialogActions
        sx={{ p: 2, justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}
      >
        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
          <Button
            variant="contained"
            color="secondary"
            startIcon={
              isDownloading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Download />
              )
            }
            onClick={onDownloadDocx}
            disabled={isDownloading || isPdfDownloading}
            sx={{ borderRadius: 2 }}
          >
            {pt('downloadWord')}
          </Button>
          <FormControl size="small" sx={{ minWidth: 90 }}>
            <InputLabel>{pt('pdfLang')}</InputLabel>
            <Select
              value={pdfLang}
              label={pt('pdfLang')}
              onChange={(e) => setPdfLang(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <MenuItem key={l.code} value={l.code}>
                  {l.flag} {l.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            startIcon={
              isPdfDownloading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Download />
              )
            }
            onClick={onDownloadPdf}
            disabled={isDownloading || isPdfDownloading}
            sx={{ borderRadius: 2 }}
          >
            {pt('downloadPdf')}
          </Button>
        </Box>
        <Button variant="outlined" onClick={onClose} sx={{ borderRadius: 2 }}>
          {pt('close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ===== ASOSIY ADMIN PAGE =====
export default function AdminPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login: authLogin, loading: authLoading, logout } = useAuth();
  const isAssistant = user?.role === 'field_assistant';
  const { lang } = useLanguage();
  const pageLabels = PAGE_LABELS[lang] || PAGE_LABELS.uz;
  const pt = useCallback((key) => pageT(lang, key), [lang]);
  const xlsxText = getXlsxText(lang);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [activeTab, setActiveTab] = useState(0);
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // States for downloads
  const [viewRow, setViewRow] = useState(null);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingConsentDocx, setDownloadingConsentDocx] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfLang, setPdfLang] = useState(lang);

  // Filters
  // Unified Filters for both Table and Dashboard
  const [dashFilters, setDashFilters] = useState({
    q: '',
    gender: '',
    age_min: 0,
    age_max: 100,
    bmi_min: 10,
    bmi_max: 50,
    region: '',
    somatotype: '',
    date_from: '',
    date_to: '',
  });
  const [sort, setSort] = useState({ key: 'createdAt', dir: 'desc' });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [checked, setChecked] = useState(new Set());

  // Login state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    verification_code: '',
  });
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [xlsxPreviewOpen, setXlsxPreviewOpen] = useState(false);
  const [xlsxPreviewRows, setXlsxPreviewRows] = useState([]);
  const [xlsxPreviewLoading, setXlsxPreviewLoading] = useState(false);
  const [xlsxPreviewTotal, setXlsxPreviewTotal] = useState(0);
  const visibleXlsxPreviewColumns = useMemo(
    () =>
      XLSX_PREVIEW_COLUMNS.filter((column) =>
        isXlsxPreviewColumnEnabled(column.key, user?.admin_permissions)
      ),
    [user?.admin_permissions]
  );
  const [importingXlsx, setImportingXlsx] = useState(false);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);

  // Edit state
  const [editRow, setEditRow] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Deletion state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false);

  // Load Data - Paginated
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const resp = await AdminApi.analyses.list({
        q: dashFilters.q,
        gender: dashFilters.gender,
        ageMin: dashFilters.age_min,
        ageMax: dashFilters.age_max,
        dateFrom: dashFilters.date_from,
        dateTo: dashFilters.date_to,
        region: dashFilters.region,
        somatotype: dashFilters.somatotype,
        sortKey: sort.key === 'createdAt' ? 'created_at' : sort.key,
        sortDir: sort.dir,
        page: page + 1,
        pageSize: rowsPerPage,
      });
      setRaw((resp.items || []).map(normalize));
      setTotalCount(resp.total || 0);
    } catch (e) {
      console.error('Load failed:', e);
    } finally {
      setLoading(false);
    }
  }, [user, dashFilters, sort, page, rowsPerPage]);

  const fetchDashboardStats = useCallback(
    async (filters = dashFilters) => {
      if (!user) return;
      setStatsLoading(true);
      try {
        const data = await AdminApi.stats(filters);
        setStats(data);
      } catch (e) {
        console.error('Failed to fetch admin stats:', e);
      } finally {
        setStatsLoading(false);
      }
    },
    [user, dashFilters]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (activeTab === 0) {
      fetchDashboardStats();
    }
  }, [activeTab, fetchDashboardStats]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const analysisId = params.get('analysis_id');
    if (!user || !analysisId || Number.isNaN(Number(analysisId))) return;

    AdminApi.analyses
      .get(Number(analysisId))
      .then((row) => {
        setViewRow(normalize(row));
        setActiveTab(1);
      })
      .catch(() => {
        toast.error(pt('recordNotFound'));
      });
  }, [location.search, pt, user]);

  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();
      setLoginError('');
      setLoginInProgress(true);
      try {
        const profile = await authLogin(loginForm);
        if (profile.requires_verification) {
          setRequiresVerification(true);
          setLoginError(
            profile.message || 'Emailga yuborilgan tasdiqlash kodini kiriting.'
          );
          return;
        }
        if (profile.role === 'researcher') {
          navigate('/researcher', { replace: true });
        } else if (profile.role !== 'admin' && profile.role !== 'superadmin') {
          navigate('/');
        }
      } catch (err) {
        setLoginError(err.message || pt('errorPrefix'));
      } finally {
        setLoginInProgress(false);
      }
    },
    [authLogin, loginForm, navigate, pt]
  );

  const handleUpdateAnalysis = useCallback(
    async (e) => {
      e?.preventDefault();
      if (!editRow) return;
      setUpdating(true);
      try {
        await AdminApi.analyses.update(editRow.id, editRow);
        toast.success(pt('updated'));
        setEditRow(null);
        load();
      } catch (err) {
        toast.error(`${pt('errorPrefix')} ${err.message}`);
      } finally {
        setUpdating(false);
      }
    },
    [editRow, load, pt]
  );

  const handleEditInputChange = useCallback((e) => {
    const { name, value } = e.target;
    const numericFields = [
      'age',
      'age_months',
      'age_days',
      'height',
      'weight',
      'chest',
      'waist',
      'head',
      'father_height',
      'mother_height',
      'shoulder_length',
      'shoulder_breadth',
      'shoulder_circumference',
      'arm_elbow_length',
      'hand_length',
      'thigh_length',
      'thigh_circumference',
      'calf_length',
      'calf_circumference',
      'foot_length',
      'body_length',
      'total_body_water',
      'fat_percent',
      'fat_mass',
      'muscle_mass',
      'bone_mass',
      'acm',
      'visceral_fat',
    ];

    let v = value;
    if (
      numericFields.includes(name) ||
      numericFields
        .map((f) => {
          const camel = f
            .split('_')
            .map((x, i) =>
              i === 0 ? x : x.charAt(0).toUpperCase() + x.slice(1)
            )
            .join('');
          return camel;
        })
        .includes(name)
    ) {
      v = value === '' ? '' : Number(value);
    }

    setEditRow((prev) => ({ ...prev, [name]: v }));
  }, []);

  const handleBulkUpdateEdit = useCallback((data) => {
    setEditRow((prev) => ({ ...prev, ...data }));
  }, []);

  const toggleAll = useCallback(() => {
    const next = new Set(checked);
    const allChecked = raw.length > 0 && raw.every((r) => checked.has(r.id));
    if (allChecked) raw.forEach((r) => next.delete(r.id));
    else raw.forEach((r) => next.add(r.id));
    setChecked(next);
  }, [checked, raw]);

  const toggleOne = useCallback(
    (id) => {
      const next = new Set(checked);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setChecked(next);
    },
    [checked]
  );

  const handleDeleteConfirm = useCallback(
    async (mode) => {
      setDeleteConfirmLoading(true);
      try {
        if (mode === 'hard') {
          await AdminApi.analyses.hardDelete(Array.from(checked));
          toast.success(pt('hardDeleted'));
        } else {
          await AdminApi.analyses.removeMany(Array.from(checked));
          toast.success(pt('movedTrashNotice'));
        }
        setChecked(new Set());
        setDeleteConfirmOpen(false);
        load();
      } catch (e) {
        toast.error(`${pt('deleteError')} ${e.message}`);
      } finally {
        setDeleteConfirmLoading(false);
      }
    },
    [checked, load, pt]
  );

  const onDeleteSelected = useCallback(async () => {
    if (!checked.size) return;
    setDeleteConfirmOpen(true);
  }, [checked.size]);

  // Keyboard shortcut for deletion
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.code === 'Delete' || e.key === 'Backspace') {
        // Don't trigger if user is typing in a text input or textarea
        const el = document.activeElement;
        const tag = el.tagName.toUpperCase();
        const isTextInput =
          (tag === 'INPUT' &&
            !['checkbox', 'radio', 'range', 'button', 'submit'].includes(
              el.type
            )) ||
          tag === 'TEXTAREA' ||
          el.isContentEditable;

        if (isTextInput) return;

        if (checked.size > 0 && activeTab === 1) {
          onDeleteSelected();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [checked.size, activeTab, onDeleteSelected]);

  const handleDownloadPdf = useCallback(async () => {
    if (!viewRow) return;
    setDownloadingPdf(true);
    try {
      const blob = await generatePdfById(viewRow.id, pdfLang);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${viewRow.idCode}_${pdfLang}.pdf`;
      a.click();
    } catch (e) {
      toast.error(`PDF: ${e.message}`);
    } finally {
      setDownloadingPdf(false);
    }
  }, [viewRow, pdfLang]);

  const handleDownloadDocx = useCallback(async () => {
    if (!viewRow) return;
    setDownloadingDocx(true);
    try {
      const blob = await generateDocxById(viewRow.id, pdfLang);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anketa_${viewRow.idCode}_${pdfLang}.docx`;
      a.click();
    } catch (e) {
      toast.error(`Word: ${e.message}`);
    } finally {
      setDownloadingDocx(false);
    }
  }, [handleDownloadPdf, viewRow, pdfLang]);

  const handleDownloadConsentDocx = useCallback(async () => {
    if (!viewRow) return;
    setDownloadingConsentDocx(true);
    try {
      const blob = await generateConsentDocxById(viewRow.id, pdfLang);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consent_${viewRow.idCode || viewRow.id}_${pdfLang}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(`${pt('errorPrefix')} ${e.message}`);
    } finally {
      setDownloadingConsentDocx(false);
    }
  }, [pdfLang, pt, viewRow]);

  const mapXlsxPreviewRow = useCallback(
    (row) => {
      const ageParts = [
        row.age ? `${row.age} ${pt('yearShort')}` : '',
        row.age_months !== undefined &&
        row.age_months !== null &&
        row.age_days !== undefined &&
        row.age_days !== null
          ? `${row.age_months} ${pt('monthShort')}, ${row.age_days} ${pt('dayShort')}`
          : '',
      ].filter(Boolean);
      const value = (...keys) => {
        for (const key of keys) {
          const current = row[key];
          if (current !== undefined && current !== null && current !== '') {
            return current;
          }
        }
        return '-';
      };

      const rowValues = {
        date: row.createdAt
          ? new Date(row.createdAt).toLocaleDateString(getDateLocale(lang))
          : '-',
        idCode: row.idCode || '-',
        fullName:
          row.name ||
          [row.lastName, row.firstName].filter(Boolean).join(' ') ||
          '-',
        gender: localizeAdminPreviewValue('gender', row.gender, lang, pt),
        age: ageParts.join(' / ') || '-',
        region: row.region
          ? getLocalizedLocationLabel(row.region, lang, 1)
          : '-',
        district: row.district
          ? getLocalizedLocationLabel(row.district, lang, 2)
          : '-',
        address: row.address || '-',
        admin: row.created_by_name || pt('unknown'),
        height: value('height'),
        weight: value('weight'),
        bmi: value('bmi'),
        status: localizeAdminPreviewValue('status', row.bmiStatus, lang, pt),
        somatotype: value('somatotype'),
        idealWeight: value('ideal_weight', 'idealWeight'),
        weightDiff: value('weight_diff', 'weightDiff'),
        weightRange: value('ideal_weight_range', 'weightRange'),
        chest: value('chest'),
        waist: value('waist'),
        head: value('head'),
        shoulderLength: value('shoulder_length', 'shoulderLength'),
        shoulderBreadth: value('shoulder_breadth', 'shoulderBreadth'),
        shoulderCircumference: value(
          'shoulder_circumference',
          'shoulderCircumference'
        ),
        armElbowLength: value('arm_elbow_length', 'armElbowLength'),
        handLength: value('hand_length', 'handLength'),
        thighLength: value('thigh_length', 'thighLength'),
        thighCircumference: value('thigh_circumference', 'thighCircumference'),
        calfLength: value('calf_length', 'calfLength'),
        calfCircumference: value('calf_circumference', 'calfCircumference'),
        footLength: value('foot_length', 'footLength'),
        shoulderRatio: value('shoulder_ratio', 'shoulderRatio'),
        thighRatio: value('thigh_ratio', 'thighRatio'),
        hmai: value('hmai'),
        mii: value('mii'),
        adi: value('adi'),
        tbwPercent: value('tbw_percent', 'total_body_water', 'totalBodyWater'),
        fatPercent: value('fat_percent', 'fatPercent'),
        fatMass: value('fat_mass', 'fatMass'),
        muscleMass: value('muscle_mass', 'muscleMass'),
        boneMass: value('bone_mass', 'boneMass'),
        acmPercent: value('acm_percent', 'acm'),
        visceralFat: value('visceral_fat', 'visceralFat'),
        bodyLength: value('body_length', 'bodyLength'),
        parentsPhone: row.parentsPhone || row.parents_phone || '-',
      };
      return Object.fromEntries(
        Object.entries(rowValues).map(([key, current]) => [
          key,
          normalizePreviewScript(key, current, lang),
        ])
      );
    },
    [lang, pt]
  );

  const openXlsxPreview = useCallback(async () => {
    setXlsxPreviewOpen(true);
    setXlsxPreviewLoading(true);
    try {
      const resp = await AdminApi.analyses.list({
        q: dashFilters.q,
        gender: dashFilters.gender,
        ageMin: dashFilters.age_min,
        ageMax: dashFilters.age_max,
        dateFrom: dashFilters.date_from,
        dateTo: dashFilters.date_to,
        region: dashFilters.region,
        somatotype: dashFilters.somatotype,
        sortKey: sort.key === 'createdAt' ? 'created_at' : sort.key,
        sortDir: sort.dir,
        page: 1,
        pageSize: 200,
      });
      const rows = (resp.items || []).map(normalize);
      setXlsxPreviewRows(rows.map(mapXlsxPreviewRow));
      setXlsxPreviewTotal(resp.total || rows.length);
    } catch (e) {
      toast.error(`${pt('excelError')} ${e.message}`);
      setXlsxPreviewRows(raw.map(mapXlsxPreviewRow));
      setXlsxPreviewTotal(totalCount || raw.length);
    } finally {
      setXlsxPreviewLoading(false);
    }
  }, [dashFilters, mapXlsxPreviewRow, pt, raw, sort, totalCount]);

  const handleExportXlsx = useCallback(async () => {
    setExportingXlsx(true);
    try {
      const blob = await AdminApi.analyses.exportXlsx({
        ...dashFilters,
        lang,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analyses_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      toast.success(pt('excelLoaded'));
    } catch (e) {
      toast.error(`${pt('excelError')} ${e.message}`);
    } finally {
      setExportingXlsx(false);
    }
  }, [dashFilters, lang, pt]);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const blob = await AdminApi.analyses.exportTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `morphocheck_template.xlsx`;
      a.click();
      toast.success(pt('templateLoaded'));
    } catch (e) {
      toast.error(`${pt('templateError')} ${e.message}`);
    }
  }, [pt]);

  const handleImportXlsx = useCallback(async () => {
    if (!importFile) return;
    setImportingXlsx(true);
    setImportResult(null);
    try {
      const res = await AdminApi.analyses.importXlsx(importFile);
      setImportResult(res);
      const errorCount = res?.errors?.length || 0;
      const skippedCount = res?.skipped || errorCount || 0;
      toast.success(
        `${pt('ready')} ${res.imported} ${pt('newCount')}, ${res.updated} ${pt('updatedCount')}${
          skippedCount ? `, ${skippedCount} ${pt('skippedCount')}` : ''
        }`
      );
      if (!res.errors || res.errors.length === 0) setImportConfirmOpen(false);
      load();
    } catch (e) {
      toast.error(`${pt('importError')} ${e.message}`);
    } finally {
      setImportingXlsx(false);
    }
  }, [importFile, load, pt]);

  const availableTabs = useMemo(() => {
    const allTabs = [
      {
        id: 0,
        label: pt('dashboard'),
        icon: <DashboardIcon />,
        roles: ['admin', 'superadmin'],
        content: (
          <AdminDashboard
            data={raw}
            loading={loading}
            stats={stats}
            statsLoading={statsLoading}
            totalCount={totalCount}
            userName={user?.name}
            filters={dashFilters}
          />
        ),
      },
      {
        id: 1,
        label: pt('data'),
        icon: <ListIcon />,
        roles: ['admin', 'superadmin'],
        content: (
          <Box sx={{ py: 2 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              flexDirection={{ xs: 'column', md: 'row' }}
              gap={2}
              mb={3}
            >
              <Typography variant="h5" fontWeight="bold">
                {pt('dataListTitle')}
              </Typography>
              {!isAssistant && (
                <Box display="flex" gap={1.5} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleDownloadTemplate}
                    startIcon={<Download />}
                  >
                    {pt('template')}
                  </Button>
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={() => setImportConfirmOpen(true)}
                    startIcon={
                      importingXlsx ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Visibility />
                      )
                    }
                  >
                    {pt('import')}
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={
                      exportingXlsx ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Download />
                      )
                    }
                    onClick={openXlsxPreview}
                    disabled={exportingXlsx || xlsxPreviewLoading}
                  >
                    {pt('export')}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={onDeleteSelected}
                    disabled={!checked.size}
                  >
                    {pt('delete')} ({checked.size})
                  </Button>
                </Box>
              )}
            </Box>

            <Paper
              sx={{
                mt: 3,
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {loading && <LinearProgress />}
              <AdminTable
                rows={raw}
                checked={checked}
                toggleAll={toggleAll}
                toggleOne={toggleOne}
                allChecked={
                  raw.length > 0 && raw.every((r) => checked.has(r.id))
                }
                setViewRow={setViewRow}
                onEdit={(r) => setEditRow(r)}
                formatDate={(d) =>
                  new Date(d).toLocaleDateString(getDateLocale(lang))
                }
                user={user}
              />
              <TablePagination
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, p) => setPage(p)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </Paper>
          </Box>
        ),
      },

      {
        id: 2,
        label: pageLabels.scientificAnalysis,
        icon: <BiotechOutlined />,
        roles: ['admin', 'superadmin'],
        content: (
          <AdminScientificAnalysis
            data={raw}
            loading={loading}
            totalCount={totalCount}
            filters={dashFilters}
          />
        ),
      },

      {
        id: 3,
        label: pt('researcherData'),
        icon: <Assessment />,
        roles: ['superadmin'],
        content: (
          <ResearcherDataView isSuperAdmin={user?.role === 'superadmin'} />
        ),
      },
    ];
    return allTabs.filter((tab) => tab.roles.includes(user?.role));
  }, [
    user,
    raw,
    loading,
    stats,
    statsLoading,
    totalCount,
    handleDownloadTemplate,
    setImportConfirmOpen,
    importingXlsx,
    exportingXlsx,
    openXlsxPreview,
    xlsxPreviewLoading,
    onDeleteSelected,
    pt,
    checked,
    dashFilters,
    pageLabels,
    lang,
    setDashFilters,
    toggleAll,
    toggleOne,
    setViewRow,
    rowsPerPage,
    page,
    setPage,
    setRowsPerPage,
  ]);

  if (authLoading)
    return (
      <Box display="flex" justifyContent="center" py={10}>
        <CircularProgress />
      </Box>
    );

  // LOGIN SCREEN
  if (!user) {
    return (
      <LoginExperience
        lang={lang}
        title={pt('adminPanelTitle')}
        subtitle={pt('loginSubtitle')}
        loginLabel={pt('login')}
        emailLabel={pt('emailOrLogin')}
        passwordLabel={pt('password')}
        form={loginForm}
        setForm={setLoginForm}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        requiresVerification={requiresVerification}
        error={loginError}
        loading={loginInProgress}
        onSubmit={handleLogin}
      />
    );
  }

  // Check role for authenticated users
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Typography variant="h5" textAlign="center">
          {pt('accessDenied')}
        </Typography>
        <Button
          fullWidth
          variant="contained"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          {pt('home')}
        </Button>
      </Container>
    );
  }

  const renderContent = () => {
    const currentTab =
      availableTabs.find((t) => t.id === activeTab) || availableTabs[0];
    return currentTab?.content || null;
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 10 }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: isDark
            ? 'rgba(23, 26, 33, 0.85)'
            : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{
              gap: { xs: 1, md: 2 },
              minWidth: 0,
              flexWrap: { xs: 'wrap', md: 'nowrap' },
            }}
          >
            <Typography
              variant="h6"
              fontWeight="900"
              sx={{
                flexGrow: { xs: 0, md: 1 },
                color: 'primary.main',
                minWidth: { xs: 'calc(100% - 56px)', md: 180 },
                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                whiteSpace: 'nowrap',
              }}
            >
              MORPHO CHECK{' '}
              <Box
                component="span"
                sx={{ color: 'text.primary', fontWeight: 400 }}
              >
                PRO
              </Box>
            </Typography>
            <Box
              sx={{
                flex: '1 1 auto',
                minWidth: 0,
                maxWidth: '100%',
                overflowX: 'auto',
                order: { xs: 3, md: 0 },
                flexBasis: { xs: '100%', md: 'auto' },
                pb: { xs: 0.5, md: 0 },
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
                scrollbarWidth: 'none',
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: 0,
                  '& .MuiTabs-flexContainer': {
                    gap: { xs: 0.75, sm: 1, md: 1.25 },
                    alignItems: 'center',
                  },
                  '& .MuiTabs-indicator': { display: 'none' },
                  '& .MuiTabs-scrollButtons': {
                    color: 'primary.main',
                  },
                  '& .MuiTab-root': {
                    position: 'relative',
                    overflow: 'hidden',
                    isolation: 'isolate',
                    minWidth: { xs: 'max-content', sm: 132 },
                    maxWidth: { xs: 'none', md: 220 },
                    minHeight: { xs: 40, sm: 44 },
                    px: { xs: 1.35, sm: 1.8, md: 2.35 },
                    py: { xs: 0.82, sm: 1 },
                    borderRadius: 999,
                    textTransform: 'none',
                    fontWeight: 800,
                    fontSize: { xs: '0.76rem', sm: '0.82rem', md: '0.88rem' },
                    letterSpacing: 0,
                    whiteSpace: 'nowrap',
                    color: isDark
                      ? 'rgba(226, 232, 240, 0.72)'
                      : 'rgba(51, 65, 85, 0.78)',
                    border: '1px solid',
                    borderColor: isDark
                      ? 'rgba(148, 163, 184, 0.18)'
                      : 'rgba(15, 118, 110, 0.12)',
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.42), rgba(30, 41, 59, 0.22))'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.54), rgba(240, 253, 250, 0.28))',
                    boxShadow: isDark
                      ? 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 20px rgba(0,0,0,0.18)'
                      : 'inset 0 1px 0 rgba(255,255,255,0.65), 0 8px 20px rgba(15,23,42,0.06)',
                    backdropFilter: 'blur(18px) saturate(170%)',
                    WebkitBackdropFilter: 'blur(18px) saturate(170%)',
                    transition:
                      'transform 0.22s ease, color 0.22s ease, border-color 0.22s ease, background 0.22s ease, box-shadow 0.22s ease',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      zIndex: -1,
                      borderRadius: 'inherit',
                      background:
                        'linear-gradient(135deg, rgba(255,255,255,0.48), rgba(255,255,255,0.05) 45%, rgba(94,234,212,0.14))',
                      opacity: 0,
                      transition: 'opacity 0.22s ease',
                    },
                    '& .MuiTab-iconWrapper': {
                      mr: { xs: 0.65, sm: 1 },
                      fontSize: { xs: 18, sm: 20 },
                      color: 'inherit',
                      filter: 'drop-shadow(0 2px 8px rgba(45, 212, 191, 0.18))',
                    },
                    '&.Mui-selected': {
                      color: '#ecfeff',
                      borderColor: isDark
                        ? 'rgba(94, 234, 212, 0.46)'
                        : 'rgba(20, 184, 166, 0.42)',
                      background:
                        'linear-gradient(135deg, rgba(20,184,166,0.95), rgba(37,99,235,0.88) 52%, rgba(139,92,246,0.88))',
                      boxShadow:
                        'inset 0 1px 0 rgba(255,255,255,0.42), 0 12px 30px rgba(20,184,166,0.22), 0 6px 18px rgba(37,99,235,0.18)',
                      transform: 'translateY(-1px)',
                      '&::before': {
                        opacity: 1,
                      },
                    },
                    '&:hover': {
                      color: isDark ? '#f8fafc' : 'primary.main',
                      borderColor: isDark
                        ? 'rgba(94, 234, 212, 0.32)'
                        : 'rgba(20, 184, 166, 0.28)',
                      transform: 'translateY(-1px)',
                      boxShadow: isDark
                        ? 'inset 0 1px 0 rgba(255,255,255,0.12), 0 12px 26px rgba(0,0,0,0.24)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.72), 0 12px 26px rgba(15,23,42,0.10)',
                      '&::before': {
                        opacity: 0.75,
                      },
                    },
                  },
                }}
              >
                {availableTabs.map((tab) => (
                  <Tab
                    key={tab.id}
                    icon={tab.icon}
                    iconPosition="start"
                    label={tab.label}
                    value={tab.id}
                  />
                ))}
              </Tabs>
            </Box>
            <Box sx={{ ml: 2 }}>
              <Tooltip title={pt('logout')}>
                <IconButton
                  onClick={() => setLogoutDialogOpen(true)}
                  color="error"
                  size="small"
                >
                  <Logout />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Container
        maxWidth="xl"
        sx={{ mt: 4, px: { xs: 1.5, sm: 3 }, maxWidth: '100%' }}
      >
        {/* PERSISTENT FILTERS FOR RELEVANT TABS */}
        {(activeTab === 0 || activeTab === 1 || activeTab === 2) && (
          <Box mb={4}>
            <DashboardFilters
              filters={dashFilters}
              onFilterChange={setDashFilters}
              onReset={() =>
                setDashFilters({
                  q: '',
                  gender: '',
                  region: '',
                  age_min: 0,
                  age_max: 100,
                  bmi_min: 10,
                  bmi_max: 50,
                  somatotype: '',
                  date_from: '',
                  date_to: '',
                })
              }
            />
          </Box>
        )}
        <Box sx={horizontalScrollSx}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Box
                sx={{
                  minWidth: {
                    xs: activeTab === 0 || activeTab === 2 ? 720 : 0,
                    md: 0,
                  },
                }}
              >
                {renderContent()}
              </Box>
            </motion.div>
          </AnimatePresence>
        </Box>
      </Container>

      {viewRow && (
        <CustomModal
          title={pt('detailsTitle')}
          onClose={() => setViewRow(null)}
          onDownloadDocx={handleDownloadDocx}
          isDownloading={downloadingDocx}
          onDownloadPdf={handleDownloadPdf}
          isPdfDownloading={downloadingPdf}
          pdfLang={pdfLang}
          setPdfLang={setPdfLang}
        >
          <ConsentStatus
            record={viewRow}
            lang={lang}
            downloading={downloadingConsentDocx}
            onDownloadDocx={handleDownloadConsentDocx}
          />
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>
                  <strong>{viewRow.idCode}</strong>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{pt('fullName')}</TableCell>
                <TableCell>
                  {viewRow.lastName} {viewRow.firstName}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{pt('date')}</TableCell>
                <TableCell>
                  {new Date(viewRow.createdAt).toLocaleString(
                    getDateLocale(lang)
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{pt('region')}</TableCell>
                <TableCell>{getRegionLabel(viewRow.region, lang)}</TableCell>
              </TableRow>
              {viewRow.parentsPhone && (
                <TableRow>
                  <TableCell>{pt('parentPhone')}</TableCell>
                  <TableCell>{viewRow.parentsPhone}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell>BMI</TableCell>
                <TableCell>
                  <strong>{viewRow.bmi}</strong> (
                  {translateBmiStatus(viewRow.bmiStatus, lang)})
                </TableCell>
              </TableRow>
              {viewRow.doctorNote && (
                <TableRow>
                  <TableCell>{pt('doctorNote')}</TableCell>
                  <TableCell>{viewRow.doctorNote}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CustomModal>
      )}

      {editRow && (
        <Dialog
          open={true}
          onClose={() => setEditRow(null)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              bgcolor: 'background.paper',
              boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
              overflow: 'hidden',
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: 4,
              pt: 3,
              pb: 2,
            }}
          >
            <Typography variant="h5" fontWeight={800}>
              {pt('editData')}
            </Typography>
            <IconButton onClick={() => setEditRow(null)}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2, md: 4 }, py: 0 }}>
            <InputForm
              formData={editRow}
              handleInputChange={handleEditInputChange}
              onBulkUpdate={handleBulkUpdateEdit}
              handleSubmit={handleUpdateAnalysis}
              loading={updating}
              isAdminView={true}
              submitLabel={pt('save')}
            />
          </DialogContent>
          <DialogActions sx={{ p: 4, pt: 2 }}>
            <Button
              onClick={() => setEditRow(null)}
              color="inherit"
              sx={{ mr: 2 }}
            >
              {pt('cancel')}
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={handleUpdateAnalysis}
              disabled={updating}
              sx={{ borderRadius: 3, px: 4 }}
            >
              {updating ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                pt('save')
              )}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Dialog
        open={xlsxPreviewOpen}
        onClose={() => !exportingXlsx && setXlsxPreviewOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '88vh',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box
            display="flex"
            alignItems="flex-start"
            justifyContent="space-between"
            gap={2}
          >
            <Box>
              <Typography variant="h6" fontWeight={900}>
                {xlsxText.adminTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {xlsxText.adminSubtitle}
              </Typography>
            </Box>
            <IconButton
              onClick={() => setXlsxPreviewOpen(false)}
              disabled={exportingXlsx}
              size="small"
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={1.5}
            >
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Alert severity="info" sx={{ py: 0, borderRadius: 2 }}>
                  {xlsxText.showing}: {xlsxPreviewRows.length} /{' '}
                  {xlsxPreviewTotal}
                </Alert>
                {xlsxPreviewTotal > xlsxPreviewRows.length && (
                  <Alert severity="warning" sx={{ py: 0, borderRadius: 2 }}>
                    {xlsxText.previewLimit}
                  </Alert>
                )}
              </Stack>
              <Button
                variant="contained"
                startIcon={
                  exportingXlsx ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <Download />
                  )
                }
                onClick={handleExportXlsx}
                disabled={exportingXlsx || xlsxPreviewLoading}
                sx={{ borderRadius: 2 }}
              >
                {exportingXlsx ? xlsxText.downloading : xlsxText.download}
              </Button>
            </Stack>

            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ borderRadius: 2, maxHeight: 560 }}
            >
              <Table
                stickyHeader
                size="small"
                sx={{
                  minWidth: Math.max(
                    1200,
                    visibleXlsxPreviewColumns.length * 92
                  ),
                  '& .MuiTableCell-root': {
                    borderColor: 'divider',
                    px: 0.75,
                    py: 0.5,
                    fontSize: '0.72rem',
                  },
                  '& .MuiTableHead-root .MuiTableCell-root': {
                    bgcolor: '#3498DB',
                    color: '#fff',
                    fontWeight: 900,
                    whiteSpace: 'nowrap',
                  },
                  '& .MuiTableBody-root .MuiTableRow-root:nth-of-type(even)': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    {visibleXlsxPreviewColumns.map((column) => (
                      <TableCell key={column.key} sx={{ fontWeight: 800 }}>
                        {getAdminXlsxColumnLabel(column.key, lang)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {xlsxPreviewLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={visibleXlsxPreviewColumns.length}
                        align="center"
                        sx={{ py: 8 }}
                      >
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : xlsxPreviewRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={visibleXlsxPreviewColumns.length}
                        align="center"
                        sx={{ py: 8 }}
                      >
                        {pt('noData')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    xlsxPreviewRows.map((row, idx) => (
                      <TableRow
                        key={`${row.fullName}-${row.date}-${idx}`}
                        hover
                      >
                        {visibleXlsxPreviewColumns.map((column) => (
                          <TableCell
                            key={column.key}
                            sx={{
                              whiteSpace: 'nowrap',
                              maxWidth:
                                column.key === 'parentsPhone' ? 180 : 150,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {row[column.key]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setXlsxPreviewOpen(false)}
            color="inherit"
            disabled={exportingXlsx}
          >
            {pt('close')}
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExportXlsx}
            disabled={exportingXlsx || xlsxPreviewLoading}
          >
            {xlsxText.download}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog for Super Admin */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {pt('confirmDelete')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {pt('selectedRowsNotice').replace('{count}', checked.size)}{' '}
            {user.role === 'superadmin' ? pt('deleteHow') : pt('deleteSure')}
          </Typography>
          {user.role === 'superadmin' && (
            <Box
              sx={{
                bgcolor: 'error.lighter',
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'error.light',
              }}
            >
              <Typography
                variant="caption"
                color="error.dark"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Lock fontSize="small" /> {pt('hardDeleteNote')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">
            {pt('cancel')}
          </Button>
          <Button
            variant={user.role === 'superadmin' ? 'outlined' : 'contained'}
            color="error"
            onClick={() => handleDeleteConfirm('soft')}
            disabled={deleteConfirmLoading}
          >
            {user.role === 'superadmin' ? pt('moveTrash') : pt('delete')}
          </Button>
          {user.role === 'superadmin' && (
            <Button
              variant="contained"
              color="error"
              onClick={() => handleDeleteConfirm('hard')}
              disabled={deleteConfirmLoading}
            >
              {pt('hardDelete')}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Import XLSX Dialog */}
      <Dialog
        open={importConfirmOpen}
        onClose={() => !importingXlsx && setImportConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>{pt('importTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            {pt('importHelp')}
          </Typography>

          <Box
            sx={{
              mt: 2,
              p: 4,
              border: '2px dashed',
              borderColor: importFile ? 'primary.main' : 'divider',
              borderRadius: 3,
              textAlign: 'center',
              bgcolor: 'background.default',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' },
            }}
            onClick={() => document.getElementById('xlsx-input').click()}
          >
            <input
              type="file"
              id="xlsx-input"
              hidden
              accept=".xlsx"
              onChange={(e) => setImportFile(e.target.files[0])}
            />
            <Typography
              variant="h6"
              color={importFile ? 'primary.main' : 'text.disabled'}
            >
              {importFile ? importFile.name : pt('chooseXlsx')}
            </Typography>
          </Box>

          {importResult && (
            <Box sx={{ mt: 3 }}>
              <Alert
                severity={importResult.errors?.length ? 'warning' : 'success'}
                icon={
                  importResult.errors?.length ? (
                    <ErrorOutline />
                  ) : (
                    <CheckCircle />
                  )
                }
                sx={{ mb: 2, borderRadius: 2 }}
              >
                <Typography variant="body2" fontWeight={700}>
                  {pt('importSummary')} {importResult.imported || 0}{' '}
                  {pt('newCount')}, {importResult.updated || 0}{' '}
                  {pt('updatedCount')},{' '}
                  {importResult.skipped || importResult.errors?.length || 0}{' '}
                  {pt('error')}.
                </Typography>
              </Alert>

              {importResult.errors && importResult.errors.length > 0 && (
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ maxHeight: 260, borderRadius: 2 }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>
                          {pt('row')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>
                          {pt('column')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>
                          {pt('error')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>
                          {pt('value')}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {importResult.errors.map((err, idx) => {
                        const item = normalizeImportError(err, pt('unknown'));
                        return (
                          <TableRow
                            key={`${item.row}-${item.field}-${idx}`}
                            hover
                          >
                            <TableCell>{item.row}</TableCell>
                            <TableCell>{item.field}</TableCell>
                            <TableCell>
                              <Typography
                                variant="caption"
                                color="error.main"
                                fontWeight={600}
                              >
                                {item.message}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {item.value === '' || item.value == null
                                  ? '-'
                                  : String(item.value)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setImportConfirmOpen(false)}
            disabled={importingXlsx}
            color="inherit"
          >
            {pt('cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleImportXlsx}
            disabled={!importFile || importingXlsx}
            startIcon={
              importingXlsx ? (
                <CircularProgress size={20} color="inherit" />
              ) : null
            }
          >
            {pt('uploadImport')}
          </Button>
        </DialogActions>
      </Dialog>
      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={() => {
          setLogoutDialogOpen(false);
          logout();
        }}
      />
    </Box>
  );
}

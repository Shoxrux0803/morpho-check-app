import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Avatar,
  Stack,
  IconButton,
  Tooltip,
  InputAdornment,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  useTheme,
  useMediaQuery,
  Checkbox,
  Switch,
  FormControlLabel,
  Drawer,
  Divider,
  TablePagination,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import {
  Lock,
  Person,
  Logout,
  Dashboard,
  People,
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Security,
  History,
  Storage,
  RestoreFromTrash,
  AutoGraph,
  SettingsSuggest,
  Refresh,
  CloudUpload,
  Download,
  DeleteForever,
  Place,
  Close,
  MyLocation,
  Search,
  FilterList,
  Clear,
  Info,
  ChevronRight,
  ContentCopy,
  Public,
  GetApp,
  WarningAmber,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { pageT } from '../utils/pageI18n';
import { getLocalizedLocationLabel } from '../utils/locationI18n';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminApi, ResearchApi } from '../services/api';
import { toast } from 'react-hot-toast';
import { UZB_LOCATIONS } from '../data/uzbLocations';
import {
  getAdminPermissionLabels,
  getAdminPermissionText,
  normalizeAdminPermissions,
} from '../utils/adminPermissions';
import LogoutConfirmDialog from '../components/LogoutConfirmDialog';

// Components
import SuperAdminDashboard from '../components/Dashboard/SuperAdminDashboard';
import SuperAdminRegionalMap from '../components/Dashboard/SuperAdminRegionalMap';
import ScientificAnalysis from '../components/Dashboard/ScientificAnalysis';
import ClinicalCMS from '../components/Admin/ClinicalCMS';
import AdminActivity from '../components/Admin/AdminActivity';
import RoleSettingsCMS from '../components/Admin/RoleSettingsCMS';
import DashboardFilters from '../components/Dashboard/DashboardFilters';

const PAGE_LABELS = {
  uz: { scientificAnalysis: 'Ilmiy Tahlil' },
  ru: { scientificAnalysis: 'Научный анализ' },
  en: { scientificAnalysis: 'Scientific Analysis' },
  tr: { scientificAnalysis: 'Bilimsel Analiz' },
  tm: { scientificAnalysis: 'Ylmy analiz' },
  tg: { scientificAnalysis: 'Таҳлили илмӣ' },
  kz: { scientificAnalysis: 'Ғылыми талдау' },
  ky: { scientificAnalysis: 'Илимий талдоо' },
};

const RESEARCH_TYPE_OPTIONS = ['PhD', 'DSc', 'Magistrlik', 'Grant loyihasi'];

const ADMIN_REPORT_LABELS = {
  uz: {
    title: 'Admin va izlanuvchilar umumiy reporti',
    subtitle: "XLSX reportni ko'rish uchun tayyor vizual jadval",
    preview: "Reportni ko'rish",
    download: 'XLSX yuklab olish',
    downloading: 'Yuklanmoqda...',
    total: 'Jami',
    admins: 'Adminlar',
    researchers: 'Izlanuvchilar',
    superadmins: 'Superadminlar',
    generatedAt: 'Tayyorlangan vaqt',
    noRows: "Report uchun ma'lumot topilmadi",
    downloaded: 'Report yuklab olindi',
    downloadError: 'Report yuklashda xatolik:',
    columns: {
      index: '#',
      name: 'Ism Familiya',
      email: 'Email',
      role: 'Rol',
      phone: 'Telefon',
      region: 'Hudud',
      district: 'Tuman/Shahar',
      mahalla: 'Mahalla',
      researchTopic: 'Ilmiy ish mavzusi',
      researchType: 'Tadqiqot turi',
      researchArea: 'Tadqiqot hududi',
      supervisor: 'Ilmiy rahbar',
      createdAt: 'Yaratilgan vaqt',
    },
  },
  en: {
    title: 'Admins and researchers report',
    subtitle: 'A visual preview of the XLSX report',
    preview: 'View report',
    download: 'Download XLSX',
    downloading: 'Downloading...',
    total: 'Total',
    admins: 'Admins',
    researchers: 'Researchers',
    superadmins: 'Superadmins',
    generatedAt: 'Generated at',
    noRows: 'No rows found for this report',
    downloaded: 'Report downloaded',
    downloadError: 'Report download error:',
    columns: {
      index: '#',
      name: 'Full name',
      email: 'Email',
      role: 'Role',
      phone: 'Phone',
      region: 'Region',
      district: 'District/City',
      mahalla: 'Mahalla',
      researchTopic: 'Research topic',
      researchType: 'Research type',
      researchArea: 'Research area',
      supervisor: 'Scientific supervisor',
      createdAt: 'Created at',
    },
  },
  ru: {
    title: 'Общий отчет админов и исследователей',
    subtitle: 'Визуальный предпросмотр XLSX отчета',
    preview: 'Посмотреть отчет',
    download: 'Скачать XLSX',
    downloading: 'Загрузка...',
    total: 'Всего',
    admins: 'Админы',
    researchers: 'Исследователи',
    superadmins: 'Суперадмины',
    generatedAt: 'Сформировано',
    noRows: 'Данные для отчета не найдены',
    downloaded: 'Отчет скачан',
    downloadError: 'Ошибка загрузки отчета:',
    columns: {
      index: '#',
      name: 'ФИО',
      email: 'Email',
      role: 'Роль',
      phone: 'Телефон',
      region: 'Регион',
      district: 'Район/город',
      mahalla: 'Махалля',
      researchTopic: 'Тема исследования',
      researchType: 'Тип исследования',
      researchArea: 'Регион исследования',
      supervisor: 'Научный руководитель',
      createdAt: 'Создано',
    },
  },
};

const ADMIN_REPORT_COLUMN_KEYS = [
  'index',
  'name',
  'email',
  'role',
  'phone',
  'region',
  'district',
  'mahalla',
  'researchTopic',
  'researchType',
  'researchArea',
  'supervisor',
  'createdAt',
];

const AUDIT_ACTION_LABELS = {
  uz: {
    create: 'Yaratish',
    created: 'Yaratildi',
    update: 'Tahrirlash',
    updated: 'Tahrirlandi',
    delete: 'O‘chirish',
    deleted: 'O‘chirildi',
    restore: 'Tiklash',
    restored: 'Tiklandi',
    login: 'Kirish',
    logout: 'Chiqish',
    backup: 'Zaxira nusxasi',
    clear: 'Tozalash',
    hard_delete: 'Butunlay o‘chirish',
    soft_delete: 'Chivintiqqa tashlash',
    delete_hard: 'Butunlay o‘chirish',
    delete_soft: 'Chivintiqqa tashlash',
    download: 'Yuklab olish',
    downloaded: 'Yuklab olindi',
    export: 'Eksport',
    exported: 'Eksport qilindi',
  },
  en: {
    create: 'Create',
    created: 'Created',
    update: 'Update',
    updated: 'Updated',
    delete: 'Delete',
    deleted: 'Deleted',
    restore: 'Restore',
    restored: 'Restored',
    login: 'Login',
    logout: 'Logout',
    backup: 'Backup',
    clear: 'Clear',
    hard_delete: 'Permanent delete',
    soft_delete: 'Move to trash',
    delete_hard: 'Permanent delete',
    delete_soft: 'Move to trash',
    download: 'Download',
    downloaded: 'Downloaded',
    export: 'Export',
    exported: 'Exported',
  },
  tr: {
    create: 'Olustur',
    created: 'Olusturuldu',
    update: 'Guncelle',
    updated: 'Guncellendi',
    delete: 'Sil',
    deleted: 'Silindi',
    restore: 'Geri yukle',
    restored: 'Geri yuklendi',
    login: 'Giris',
    logout: 'Cikis',
    backup: 'Yedek',
    clear: 'Temizle',
    hard_delete: 'Kalici silme',
    soft_delete: 'Cope tasima',
    delete_hard: 'Kalici silme',
    delete_soft: 'Cope tasima',
    download: 'Indirme',
    downloaded: 'Indirildi',
    export: 'Disa aktar',
    exported: 'Disa aktarildi',
  },
  ru: {
    create: 'Создание',
    created: 'Создано',
    update: 'Обновление',
    updated: 'Обновлено',
    delete: 'Удаление',
    deleted: 'Удалено',
    restore: 'Восстановление',
    restored: 'Восстановлено',
    login: 'Вход',
    logout: 'Выход',
    backup: 'Резервная копия',
    clear: 'Очистка',
    hard_delete: 'Полное удаление',
    soft_delete: 'Перемещение в корзину',
    delete_hard: 'Полное удаление',
    delete_soft: 'Перемещение в корзину',
    download: 'Скачивание',
    downloaded: 'Скачано',
    export: 'Экспорт',
    exported: 'Экспортировано',
  },
  kz: {
    create: 'Құру',
    created: 'Құрылды',
    update: 'Жаңарту',
    updated: 'Жаңартылды',
    delete: 'Жою',
    deleted: 'Жойылды',
    restore: 'Қалпына келтіру',
    restored: 'Қалпына келтірілді',
    login: 'Кіру',
    logout: 'Шығу',
    backup: 'Сақтық көшірме',
    clear: 'Тазалау',
    hard_delete: 'Толық жою',
    soft_delete: 'Себетке жіберу',
    delete_hard: 'Толық жою',
    delete_soft: 'Себетке жіберу',
    download: 'Жүктеп алу',
    downloaded: 'Жүктелді',
    export: 'Экспорт',
    exported: 'Экспортталды',
  },
  ky: {
    create: 'Түзүү',
    created: 'Түзүлдү',
    update: 'Жаңыртуу',
    updated: 'Жаңыртылды',
    delete: 'Өчүрүү',
    deleted: 'Өчүрүлдү',
    restore: 'Калыбына келтирүү',
    restored: 'Калыбына келтирилди',
    login: 'Кирүү',
    logout: 'Чыгуу',
    backup: 'Камдык көчүрмө',
    clear: 'Тазалоо',
    hard_delete: 'Толук өчүрүү',
    soft_delete: 'Себетке жөнөтүү',
    delete_hard: 'Толук өчүрүү',
    delete_soft: 'Себетке жөнөтүү',
    download: 'Жүктөө',
    downloaded: 'Жүктөлдү',
    export: 'Экспорт',
    exported: 'Экспорттолду',
};

const CONFIRM_MESSAGES = {
  uz: {
    adminDeleteConfirm: "Haqiqatan ham bu adminni o'chirmoqchimisiz?",
    hardDeleteDataConfirm: "Ushbu ma'lumotni butunlay o'chirib tashlamoqchimisiz? Uni qayta tiklab bo'lmaydi!",
    backupRestoreConfirm: "Haqiqatan ham '{filename}' zaxira nusxasini tiklamoqchimisiz? Joriy ma'lumotlar almashtirilishi mumkin.",
    deleteBackupConfirm: "Haqiqatan ham '{filename}' zaxira faylini o'chirmoqchimisiz?",
    clearAuditConfirm: "Barcha jurnallarni tozalamoqchimisiz?"
  },
  ru: {
    adminDeleteConfirm: "Вы действительно хотите удалить этого админа?",
    hardDeleteDataConfirm: "Вы действительно хотите безвозвратно удалить эти данные? Это действие нельзя отменить!",
    backupRestoreConfirm: "Вы действительно хотите восстановить резервную копию '{filename}'? Текущие данные могут быть перезаписаны.",
    deleteBackupConfirm: "Вы действительно хотите удалить файл резервной копии '{filename}'?",
    clearAuditConfirm: "Очистить все записи журнала?"
  },
  en: {
    adminDeleteConfirm: "Do you really want to delete this admin?",
    hardDeleteDataConfirm: "Do you really want to permanently delete this data? This action cannot be undone!",
    backupRestoreConfirm: "Do you really want to restore the backup '{filename}'? Current data might be overwritten.",
    deleteBackupConfirm: "Do you really want to delete the backup file '{filename}'?",
    clearAuditConfirm: "Clear all audit log entries?"
  },
  tr: {
    adminDeleteConfirm: "Bu yöneticiyi gerçekten silmek istiyor musunuz?",
    hardDeleteDataConfirm: "Bu verileri kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!",
    backupRestoreConfirm: "'{filename}' yedeklemesini gerçekten geri yüklemek istiyor musunuz? Mevcut verilerin üzerine yazılabilir.",
    deleteBackupConfirm: "'{filename}' yedekleme dosyasını gerçekten silmek istiyor musunuz?",
    clearAuditConfirm: "Tüm günlük kayıtlarını temizlemek istiyor musunuz?"
  },
  tm: {
    adminDeleteConfirm: "Bu admini pozmak isleýärsinizmi?",
    hardDeleteDataConfirm: "Bu maglumaty hemişelik pozmak isleýärsinizmi? Bu hereketi yza alyp bolmaz!",
    backupRestoreConfirm: "'{filename}' ätiýaçlyk nusgasyny dikeltmek isleýärsinizmi? Häzirki maglumatlar täzelenip biler.",
    deleteBackupConfirm: "'{filename}' ätiýaçlyk faýlyny pozmak isleýärsinizmi?",
    clearAuditConfirm: "Ähli žurnal ýazgylaryny arassalamak isleýärsinizmi?"
  },
  tg: {
    adminDeleteConfirm: "Оё шумо дар ҳақиқат мехоҳед ин админро нест кунед?",
    hardDeleteDataConfirm: "Оё шумо дар ҳақиқат мехоҳед ин маълумотро ба таври ҳамешагӣ нест кунед? Ин амалро бекор карда намешавад!",
    backupRestoreConfirm: "Оё шумо дар ҳақиқат мехоҳед нусхаи эҳтиётии '{filename}'-ро барқарор кунед? Маалумоти ҷорӣ метавонад иваз карда шавад.",
    deleteBackupConfirm: "Оё шумо дар ҳақиқат мехоҳед файли нусхаи эҳтиётии '{filename}'-ро нест кунед?",
    clearAuditConfirm: "Оё шумо мехоҳед ҳамаи журналҳоро тоза кунед?"
  },
  kz: {
    adminDeleteConfirm: "Бұл админді шынымен жойғыңыз келе ме?",
    hardDeleteDataConfirm: "Бұл мәліметтерді біржола жойғыңыз келе ме? Бұл әрекетті қайтару мүмкін емес!",
    backupRestoreConfirm: "'{filename}' сақтық көшірмесін шынымен қалпына келтіргіңіз келе ме? Ағымдағы мәліметтер ауыстырылуы мүмкін.",
    deleteBackupConfirm: "'{filename}' сақтық көшірме файлын шынымен жойғыңыз келе ме?",
    clearAuditConfirm: "Барлық журнал жазбаларын тазалайсыз ба?"
  },
  ky: {
    adminDeleteConfirm: "Бул админди чын эле өчүрөсүзбү?",
    hardDeleteDataConfirm: "Бул маалыматты биротоло өчүрүүнү каалайсызбы? Бул аракетти жокко чыгаруу мүмкүн эмес!",
    backupRestoreConfirm: "'{filename}' камдык көчүрмөсүн чын эле калыбына келтиргиңиз келеби? Учурдагы маалыматтар алмаштырылышы мүмкүн.",
    deleteBackupConfirm: "'{filename}' камдык көчүрмө файлын чын эле өчүрөсүзбү?",
    clearAuditConfirm: "Аудит журналын тазалоону ырастайсызбы?"
  }
};

const AUDIT_TARGET_LABELS_RU = {
  Analysis: 'Анализ',
  PatientAnalysis: 'Анализ пациента',
  User: 'Пользователь',
  AuditLog: 'Журнал аудита',
  Backup: 'Резервная копия',
  PDF: 'PDF-отчет',
  DOCX: 'DOCX-документ',
  ResearchRecord: 'Запись исследования',
};

const AUDIT_TARGET_LABELS_EN = {
  Analysis: 'Analysis',
  PatientAnalysis: 'Patient analysis',
  User: 'User',
  AuditLog: 'Audit log',
  Backup: 'Backup',
  PDF: 'PDF report',
  DOCX: 'DOCX document',
  ResearchRecord: 'Research record',
};

const AUDIT_TARGET_LABELS_TR = {
  Analysis: 'Analiz',
  PatientAnalysis: 'Hasta analizi',
  User: 'Kullanici',
  AuditLog: 'Denetim gunlugu',
  Backup: 'Yedek',
  PDF: 'PDF raporu',
  DOCX: 'DOCX belgesi',
  ResearchRecord: 'Araştırma kaydı',
};

const AUDIT_TARGET_LABELS_KZ = {
  Analysis: 'Талдау',
  PatientAnalysis: 'Пациент талдауы',
  User: 'Пайдаланушы',
  AuditLog: 'Аудит журналы',
  Backup: 'Сақтық көшірме',
  PDF: 'PDF есеп',
  DOCX: 'DOCX құжат',
  ResearchRecord: 'Зерттеу жазбасы',
};

const AUDIT_TARGET_LABELS_KY = {
  Analysis: 'Талдоо',
  PatientAnalysis: 'Бейтап талдоосу',
  User: 'Колдонуучу',
  AuditLog: 'Аудит журналы',
  Backup: 'Камдык көчүрмө',
  PDF: 'PDF отчет',
  DOCX: 'DOCX документ',
  ResearchRecord: 'Изилдөө жазуусу',
};
const AUDIT_JSON_KEY_LABELS_RU = {
  action: 'Действие',
  target_type: 'Тип объекта',
  target_id: 'ID объекта',
  details: 'Описание',
  user_id: 'ID пользователя',
  user_name: 'Пользователь',
  user_email: 'Email пользователя',
  name: 'Имя',
  role: 'Роль',
  email: 'Email',
  old: 'Было',
  new: 'Стало',
  changes: 'Изменения',
  ids: 'ID',
  count: 'Количество',
};

const AUDIT_JSON_KEY_LABELS_EN = {
  action: 'Action',
  target_type: 'Record type',
  target_id: 'Record ID',
  details: 'Details',
  user_id: 'User ID',
  user_name: 'User',
  user_email: 'User email',
  name: 'Name',
  role: 'Role',
  email: 'Email',
  old: 'Old',
  new: 'New',
  changes: 'Changes',
  ids: 'ID',
  count: 'Count',
};

const AUDIT_JSON_KEY_LABELS_TR = {
  action: 'Islem',
  target_type: 'Nesne turu',
  target_id: 'Nesne ID',
  details: 'Ayrintilar',
  user_id: 'Kullanici ID',
  user_name: 'Kullanici',
  user_email: 'Kullanici email',
  name: 'Ad',
  role: 'Rol',
  email: 'Email',
  old: 'Eski',
  new: 'Yeni',
  changes: 'Degisiklikler',
  ids: 'ID',
  count: 'Sayi',
};

const AUDIT_JSON_KEY_LABELS_KZ = {
  action: 'Әрекет',
  target_type: 'Объект түрі',
  target_id: 'Объект ID',
  details: 'Сипаттама',
  user_id: 'Пайдаланушы ID',
  user_name: 'Пайдаланушы',
  user_email: 'Пайдаланушы email',
  name: 'Аты',
  role: 'Рөл',
  email: 'Email',
  old: 'Бұрын',
  new: 'Кейін',
  changes: 'Өзгерістер',
  ids: 'ID',
  count: 'Саны',
};

const AUDIT_JSON_KEY_LABELS_KY = {
  action: 'Аракет',
  target_type: 'Объект түрү',
  target_id: 'Объект ID',
  details: 'Тавсиф',
  user_id: 'Колдонуучу ID',
  user_name: 'Колдонуучу',
  user_email: 'Колдонуучу email',
  name: 'Аты',
  role: 'Роль',
  email: 'Email',
  old: 'Мурун',
  new: 'Кийин',
  changes: 'Өзгөрүүлөр',
  ids: 'ID',
  count: 'Саны',
};
const AUDIT_DETAIL_PATTERNS_RU = [
  [
    /^Yangi tahlil (yaratildi|created|создано):\s*(.*)$/i,
    'Новый анализ создан: $2',
  ],
  [/^Yangi foydalanuvchi yaratildi:\s*(.*)$/i, 'Новый пользователь создан: $1'],
  [
    /^Foydalanuvchi ma'?lumotlari yangilandi:\s*(.*)$/i,
    'Данные пользователя обновлены: $1',
  ],
  [/^Foydalanuvchi o'?chirildi:\s*(.*)$/i, 'Пользователь удален: $1'],
  [/^Foydalanuvchi tiklandi:\s*(.*)$/i, 'Пользователь восстановлен: $1'],
  [
    /^Foydalanuvchi tizimga kirdi:\s*(.*)$/i,
    'Пользователь вошел в систему: $1',
  ],
  [
    /^(\d+)\s*ta tahlil savatga yuborildi:\s*(.*)$/i,
    '$1 анализ(ов) перемещено в корзину: $2',
  ],
  [
    /^(\d+)\s*ta tahlil butunlay o'?chirildi \(IDlar:\s*(.*)\)$/i,
    '$1 анализ(ов) удалено навсегда (ID: $2)',
  ],
  [
    /^(\d+)\s*ta tahlil savatdan tiklandi \(IDlar:\s*(.*)\)$/i,
    '$1 анализ(ов) восстановлено из корзины (ID: $2)',
  ],
  [
    /^Tahlil yangilandi:\s*(.*?)\.\s*O'?zgarishlar:\s*(.*)$/i,
    'Анализ обновлен: $1. Изменения: $2',
  ],
  [
    /^Audit jurnali tozalandi:\s*Barchasi\s*\((\d+)\s*ta yozuv\)$/i,
    'Журнал аудита очищен: все ($1 записей)',
  ],
  [
    /^Audit jurnali tozalandi:\s*(.*?)\s*\((\d+)\s*ta yozuv\)$/i,
    'Журнал аудита очищен: $1 ($2 записей)',
  ],
  [/^Zaxira nusxasi yaratildi:\s*(.*)$/i, 'Резервная копия создана: $1'],
  [
    /^Zaxira to'?liq tiklandi \(Almashtirish\):\s*(.*)$/i,
    'Резервная копия полностью восстановлена (замена): $1',
  ],
  [/^Zaxira nusxasi o'?chirildi:\s*(.*)$/i, 'Резервная копия удалена: $1'],
  [
    /^Bemor hisoboti \(PDF\) yuklab olindi:\s*(.*)$/i,
    'Отчет пациента (PDF) скачан: $1',
  ],
  [
    /^Bemor anketasi \(DOCX\) yuklab olindi:\s*(.*)$/i,
    'Анкета пациента (DOCX) скачана: $1',
  ],
  [
    /^(.+?) roli uchun Chat holati o'?zgartirildi:\s*AI=(True|False),\s*Ichki=(True|False)$/i,
    'Статус чата для роли $1 изменен: ИИ=$2, Внутренний=$3',
  ],
];

const AUDIT_DETAIL_REPLACEMENTS_RU = [
  [/\bYangi\b/gi, 'Новый'],
  [/\bfoydalanuvchi\b/gi, 'пользователь'],
  [/\bFoydalanuvchi\b/g, 'Пользователь'],
  [/\bma'?lumotlari\b/gi, 'данные'],
  [/\bMa'?lumotlar\b/g, 'Данные'],
  [/\bMa'?lumot\b/g, 'Данные'],
  [/\bma'?lumotlar\b/gi, 'данные'],
  [/\bma'?lumot\b/gi, 'данные'],
  [/\btahlil\b/gi, 'анализ'],
  [/\bTahlil\b/g, 'Анализ'],
  [/\bBemor hisoboti\b/g, 'Отчет пациента'],
  [/\bbemor hisoboti\b/gi, 'отчет пациента'],
  [/\bBemor anketasi\b/g, 'Анкета пациента'],
  [/\bbemor anketasi\b/gi, 'анкета пациента'],
  [/\bBemor\b/g, 'Пациент'],
  [/\bbemor\b/gi, 'пациент'],
  [/\bAdmin\b/g, 'Админ'],
  [/\badmin\b/gi, 'админ'],
  [/\bIzlanuvchi\b/g, 'Исследователь'],
  [/\bizlanuvchi\b/gi, 'исследователь'],
  [/\bResearcher\b/g, 'Исследователь'],
  [/\bresearcher\b/gi, 'исследователь'],
  [/\bAnalysis\b/g, 'Анализ'],
  [/\banalysis\b/gi, 'анализ'],
  [/\bUser\b/g, 'Пользователь'],
  [/\buser\b/gi, 'пользователь'],
  [/\byaratildi\b/gi, 'создано'],
  [/\byangilandi\b/gi, 'обновлено'],
  [/\btiklandi\b/gi, 'восстановлено'],
  [/\bo'?chirildi\b/gi, 'удалено'],
  [/\bcreated\b/gi, 'создано'],
  [/\bupdated\b/gi, 'обновлено'],
  [/\bdeleted\b/gi, 'удалено'],
  [/\brestored\b/gi, 'восстановлено'],
  [/\byuklab olindi\b/gi, 'скачано'],
  [/\byuklandi\b/gi, 'загружено'],
  [/\bolindi\b/gi, 'получено'],
  [/\bsavatga yuborildi\b/gi, 'перемещено в корзину'],
  [/\bsavatdan\b/gi, 'из корзины'],
  [/\bbutunlay\b/gi, 'навсегда'],
  [/\bIDlar\b/g, 'ID'],
  [/\bBarchasi\b/g, 'Все'],
  [/\bta yozuv\b/gi, 'записей'],
  [/\bta\b/g, 'шт'],
  [/\bZaxira nusxasi\b/g, 'Резервная копия'],
  [/\bzaxira nusxasi\b/gi, 'резервная копия'],
  [/\bZaxira\b/g, 'Резервная копия'],
  [/\bzaxira\b/gi, 'резервная копия'],
  [/\bfayl\b/gi, 'файл'],
  [/\bO'?zgarishlar\b/gi, 'Изменения'],
  [/\bAlmashtirish\b/gi, 'замена'],
  [/\btizimga kirdi\b/gi, 'вошел в систему'],
];

const AUDIT_DETAIL_CLEANUPS_RU = [
  [/Новый анализ создано/gi, 'Новый анализ создан'],
  [/Новый Анализ создано/gi, 'Новый анализ создан'],
  [/Анкета пациента \(DOCX\) скачано/gi, 'Анкета пациента (DOCX) скачана'],
  [/Анкета пациента скачано/gi, 'Анкета пациента скачана'],
  [/Отчет пациента \(PDF\) скачано/gi, 'Отчет пациента (PDF) скачан'],
  [/DOCX-отчет скачано/gi, 'DOCX-отчет скачан'],
  [/\s+:/g, ':'],
];

const AUDIT_DETAIL_PATTERNS_EN = [
  [
    /^Yangi tahlil (yaratildi|created|создано):\s*(.*)$/i,
    'New analysis created: $2',
  ],
  [/^Yangi foydalanuvchi yaratildi:\s*(.*)$/i, 'New user created: $1'],
  [
    /^Foydalanuvchi ma'?lumotlari yangilandi:\s*(.*)$/i,
    'User data updated: $1',
  ],
  [/^Foydalanuvchi o'?chirildi:\s*(.*)$/i, 'User deleted: $1'],
  [/^Foydalanuvchi tiklandi:\s*(.*)$/i, 'User restored: $1'],
  [/^Foydalanuvchi tizimga kirdi:\s*(.*)$/i, 'User logged in: $1'],
  [
    /^(\d+)\s*ta tahlil savatga yuborildi:\s*(.*)$/i,
    '$1 analyses moved to trash: $2',
  ],
  [
    /^(\d+)\s*ta tahlil butunlay o'?chirildi \(IDlar:\s*(.*)\)$/i,
    '$1 analyses permanently deleted (ID: $2)',
  ],
  [
    /^(\d+)\s*ta tahlil savatdan tiklandi \(IDlar:\s*(.*)\)$/i,
    '$1 analyses restored from trash (ID: $2)',
  ],
  [
    /^Tahlil yangilandi:\s*(.*?)\.\s*O'?zgarishlar:\s*(.*)$/i,
    'Analysis updated: $1. Changes: $2',
  ],
  [
    /^Audit jurnali tozalandi:\s*Barchasi\s*\((\d+)\s*ta yozuv\)$/i,
    'Audit log cleared: all ($1 records)',
  ],
  [
    /^Audit jurnali tozalandi:\s*(.*?)\s*\((\d+)\s*ta yozuv\)$/i,
    'Audit log cleared: $1 ($2 records)',
  ],
  [/^Zaxira nusxasi yaratildi:\s*(.*)$/i, 'Backup created: $1'],
  [
    /^Zaxira to'?liq tiklandi \(Almashtirish\):\s*(.*)$/i,
    'Backup fully restored (replace): $1',
  ],
  [/^Zaxira nusxasi o'?chirildi:\s*(.*)$/i, 'Backup deleted: $1'],
  [
    /^Bemor hisoboti \(PDF\) yuklab olindi:\s*(.*)$/i,
    'Patient report (PDF) downloaded: $1',
  ],
  [
    /^Bemor anketasi \(DOCX\) yuklab olindi:\s*(.*)$/i,
    'Patient questionnaire (DOCX) downloaded: $1',
  ],
  [
    /^(.+?) roli uchun Chat holati o'?zgartirildi:\s*AI=(True|False),\s*Ichki=(True|False)$/i,
    'Chat status for $1 role changed: AI=$2, Internal=$3',
  ],
];

const AUDIT_DETAIL_REPLACEMENTS_EN = [
  [/\bYangi\b/gi, 'New'],
  [/\bfoydalanuvchi\b/gi, 'user'],
  [/\bFoydalanuvchi\b/g, 'User'],
  [/\bma'?lumotlari\b/gi, 'data'],
  [/\bMa'?lumotlar\b/g, 'Data'],
  [/\bMa'?lumot\b/g, 'Data'],
  [/\bma'?lumotlar\b/gi, 'data'],
  [/\bma'?lumot\b/gi, 'data'],
  [/\btahlil\b/gi, 'analysis'],
  [/\bTahlil\b/g, 'Analysis'],
  [/\bBemor hisoboti\b/g, 'Patient report'],
  [/\bbemor hisoboti\b/gi, 'patient report'],
  [/\bBemor anketasi\b/g, 'Patient form'],
  [/\bbemor anketasi\b/gi, 'patient form'],
  [/\bBemor\b/g, 'Patient'],
  [/\bbemor\b/gi, 'patient'],
  [/\bAdmin\b/g, 'Admin'],
  [/\badmin\b/gi, 'admin'],
  [/\bIzlanuvchi\b/g, 'Researcher'],
  [/\bizlanuvchi\b/gi, 'researcher'],
  [/\bResearcher\b/g, 'Researcher'],
  [/\bresearcher\b/gi, 'researcher'],
  [/\bAnalysis\b/g, 'Analysis'],
  [/\banalysis\b/gi, 'analysis'],
  [/\bUser\b/g, 'User'],
  [/\buser\b/gi, 'user'],
  [/\byaratildi\b/gi, 'created'],
  [/\byangilandi\b/gi, 'updated'],
  [/\btiklandi\b/gi, 'restored'],
  [/\bo'?chirildi\b/gi, 'deleted'],
  [/\bcreated\b/gi, 'created'],
  [/\bupdated\b/gi, 'updated'],
  [/\bdeleted\b/gi, 'deleted'],
  [/\brestored\b/gi, 'restored'],
  [/\byuklab olindi\b/gi, 'downloaded'],
  [/\byuklandi\b/gi, 'uploaded'],
  [/\bolindi\b/gi, 'received'],
  [/\bsavatga yuborildi\b/gi, 'moved to trash'],
  [/\bsavatdan\b/gi, 'from trash'],
  [/\bbutunlay\b/gi, 'permanently'],
  [/\bIDlar\b/g, 'ID'],
  [/\bBarchasi\b/g, 'All'],
  [/\bta yozuv\b/gi, 'records'],
  [/\bta\b/g, 'items'],
  [/\bZaxira nusxasi\b/g, 'Backup'],
  [/\bzaxira nusxasi\b/gi, 'backup'],
  [/\bZaxira\b/g, 'Backup'],
  [/\bzaxira\b/gi, 'backup'],
  [/\bfayl\b/gi, 'file'],
  [/\bO'?zgarishlar\b/gi, 'Changes'],
  [/\bAlmashtirish\b/gi, 'replace'],
  [/\btizimga kirdi\b/gi, 'logged in'],
];

const AUDIT_DETAIL_CLEANUPS_EN = [
  [/New analysis created/gi, 'New analysis created'],
  [/Patient form \(DOCX\) downloaded/gi, 'Patient form (DOCX) downloaded'],
  [/Patient report \(PDF\) downloaded/gi, 'Patient report (PDF) downloaded'],
  [/\s+:/g, ':'],
];

const AUDIT_DETAIL_PATTERNS_TR = [
  [
    /^Yangi tahlil (yaratildi|created|создано):\s*(.*)$/i,
    'Yeni analiz olusturuldu: $2',
  ],
  [
    /^Yangi foydalanuvchi yaratildi:\s*(.*)$/i,
    'Yeni kullanici olusturuldu: $1',
  ],
  [
    /^Foydalanuvchi ma'?lumotlari yangilandi:\s*(.*)$/i,
    'Kullanici verileri guncellendi: $1',
  ],
  [/^Foydalanuvchi o'?chirildi:\s*(.*)$/i, 'Kullanici silindi: $1'],
  [/^Foydalanuvchi tiklandi:\s*(.*)$/i, 'Kullanici geri yuklendi: $1'],
  [/^Foydalanuvchi tizimga kirdi:\s*(.*)$/i, 'Kullanici sisteme girdi: $1'],
  [
    /^(\d+)\s*ta tahlil savatga yuborildi:\s*(.*)$/i,
    '$1 analiz cope tasindi: $2',
  ],
  [
    /^(\d+)\s*ta tahlil butunlay o'?chirildi \(IDlar:\s*(.*)\)$/i,
    '$1 analiz kalici silindi (ID: $2)',
  ],
  [
    /^(\d+)\s*ta tahlil savatdan tiklandi \(IDlar:\s*(.*)\)$/i,
    '$1 analiz copten geri yuklendi (ID: $2)',
  ],
  [
    /^Tahlil yangilandi:\s*(.*?)\.\s*O'?zgarishlar:\s*(.*)$/i,
    'Analiz guncellendi: $1. Degisiklikler: $2',
  ],
  [
    /^Audit jurnali tozalandi:\s*Barchasi\s*\((\d+)\s*ta yozuv\)$/i,
    'Denetim gunlugu temizlendi: tumu ($1 kayit)',
  ],
  [
    /^Audit jurnali tozalandi:\s*(.*?)\s*\((\d+)\s*ta yozuv\)$/i,
    'Denetim gunlugu temizlendi: $1 ($2 kayit)',
  ],
  [/^Zaxira nusxasi yaratildi:\s*(.*)$/i, 'Yedek olusturuldu: $1'],
  [
    /^Zaxira to'?liq tiklandi \(Almashtirish\):\s*(.*)$/i,
    'Yedek tamamen geri yuklendi (degistir): $1',
  ],
  [/^Zaxira nusxasi o'?chirildi:\s*(.*)$/i, 'Yedek silindi: $1'],
  [
    /^Bemor hisoboti \(PDF\) yuklab olindi:\s*(.*)$/i,
    'Hasta raporu (PDF) indirildi: $1',
  ],
  [
    /^Bemor anketasi \(DOCX\) yuklab olindi:\s*(.*)$/i,
    'Hasta anketi (DOCX) indirildi: $1',
  ],
  [
    /^(.+?) roli uchun Chat holati o'?zgartirildi:\s*AI=(True|False),\s*Ichki=(True|False)$/i,
    '$1 rolü için Sohbet durumu değiştirildi: AI=$2, Dahili=$3',
  ],
];

const AUDIT_DETAIL_REPLACEMENTS_TR = [
  [/\bYangi\b/gi, 'Yeni'],
  [/\bfoydalanuvchi\b/gi, 'kullanici'],
  [/\bFoydalanuvchi\b/g, 'Kullanici'],
  [/\bma'?lumotlari\b/gi, 'verileri'],
  [/\bMa'?lumotlar\b/g, 'Veriler'],
  [/\bMa'?lumot\b/g, 'Veri'],
  [/\bma'?lumotlar\b/gi, 'veriler'],
  [/\bma'?lumot\b/gi, 'veri'],
  [/\btahlil\b/gi, 'analiz'],
  [/\bTahlil\b/g, 'Analiz'],
  [/\bBemor hisoboti\b/g, 'Hasta raporu'],
  [/\bbemor hisoboti\b/gi, 'hasta raporu'],
  [/\bBemor anketasi\b/g, 'Hasta formu'],
  [/\bbemor anketasi\b/gi, 'hasta formu'],
  [/\bBemor\b/g, 'Hasta'],
  [/\bbemor\b/gi, 'hasta'],
  [/\bAdmin\b/g, 'Admin'],
  [/\badmin\b/gi, 'admin'],
  [/\bIzlanuvchi\b/g, 'Arastirmaci'],
  [/\bizlanuvchi\b/gi, 'arastirmaci'],
  [/\bResearcher\b/g, 'Arastirmaci'],
  [/\bresearcher\b/gi, 'arastirmaci'],
  [/\bAnalysis\b/g, 'Analiz'],
  [/\banalysis\b/gi, 'analiz'],
  [/\bUser\b/g, 'Kullanici'],
  [/\buser\b/gi, 'kullanici'],
  [/\byaratildi\b/gi, 'olusturuldu'],
  [/\byangilandi\b/gi, 'guncellendi'],
  [/\btiklandi\b/gi, 'geri yuklendi'],
  [/\bo'?chirildi\b/gi, 'silindi'],
  [/\bcreated\b/gi, 'olusturuldu'],
  [/\bupdated\b/gi, 'guncellendi'],
  [/\bdeleted\b/gi, 'silindi'],
  [/\brestored\b/gi, 'geri yuklendi'],
  [/\byuklab olindi\b/gi, 'indirildi'],
  [/\byuklandi\b/gi, 'yuklendi'],
  [/\bolindi\b/gi, 'alindi'],
  [/\bsavatga yuborildi\b/gi, 'cope tasindi'],
  [/\bsavatdan\b/gi, 'copten'],
  [/\bbutunlay\b/gi, 'kalici olarak'],
  [/\bIDlar\b/g, 'ID'],
  [/\bBarchasi\b/g, 'Tumu'],
  [/\bta yozuv\b/gi, 'kayit'],
  [/\bta\b/g, 'adet'],
  [/\bZaxira nusxasi\b/g, 'Yedek'],
  [/\bzaxira nusxasi\b/gi, 'yedek'],
  [/\bZaxira\b/g, 'Yedek'],
  [/\bzaxira\b/gi, 'yedek'],
  [/\bfayl\b/gi, 'dosya'],
  [/\bO'?zgarishlar\b/gi, 'Degisiklikler'],
  [/\bAlmashtirish\b/gi, 'degistir'],
  [/\btizimga kirdi\b/gi, 'sisteme girdi'],
];

const AUDIT_DETAIL_CLEANUPS_TR = [
  [/Yeni analiz olusturuldu/gi, 'Yeni analiz olusturuldu'],
  [/Hasta formu \(DOCX\) indirildi/gi, 'Hasta formu (DOCX) indirildi'],
  [/Hasta raporu \(PDF\) indirildi/gi, 'Hasta raporu (PDF) indirildi'],
  [/\s+:/g, ':'],
];

const AUDIT_DETAIL_PATTERNS_KZ = [
  [
    /^Yangi tahlil (yaratildi|created|создано):\s*(.*)$/i,
    'Жаңа талдау құрылды: $2',
  ],
  [/^Yangi foydalanuvchi yaratildi:\s*(.*)$/i, 'Жаңа пайдаланушы құрылды: $1'],
  [
    /^Foydalanuvchi ma'?lumotlari yangilandi:\s*(.*)$/i,
    'Пайдаланушы деректері жаңартылды: $1',
  ],
  [/^Foydalanuvchi o'?chirildi:\s*(.*)$/i, 'Пайдаланушы жойылды: $1'],
  [/^Foydalanuvchi tiklandi:\s*(.*)$/i, 'Пайдаланушы қалпына келтірілді: $1'],
  [/^Foydalanuvchi tizimga kirdi:\s*(.*)$/i, 'Пайдаланушы жүйеге кірді: $1'],
  [
    /^(\d+)\s*ta tahlil savatga yuborildi:\s*(.*)$/i,
    '$1 талдау себетке жіберілді: $2',
  ],
  [
    /^(\d+)\s*ta tahlil butunlay o'?chirildi \(IDlar:\s*(.*)\)$/i,
    '$1 талдау толық жойылды (ID: $2)',
  ],
  [
    /^(\d+)\s*ta tahlil savatdan tiklandi \(IDlar:\s*(.*)\)$/i,
    '$1 талдау себеттен қалпына келтірілді (ID: $2)',
  ],
  [
    /^Tahlil yangilandi:\s*(.*?)\.\s*O'?zgarishlar:\s*(.*)$/i,
    'Талдау жаңартылды: $1. Өзгерістер: $2',
  ],
  [
    /^Audit jurnali tozalandi:\s*Barchasi\s*\((\d+)\s*ta yozuv\)$/i,
    'Аудит журналы тазаланды: барлығы ($1 жазба)',
  ],
  [
    /^Audit jurnali tozalandi:\s*(.*?)\s*\((\d+)\s*ta yozuv\)$/i,
    'Аудит журналы тазаланды: $1 ($2 жазба)',
  ],
  [/^Zaxira nusxasi yaratildi:\s*(.*)$/i, 'Сақтық көшірме құрылды: $1'],
  [
    /^Zaxira to'?liq tiklandi \(Almashtirish\):\s*(.*)$/i,
    'Сақтық көшірме толық қалпына келтірілді (ауыстыру): $1',
  ],
  [/^Zaxira nusxasi o'?chirildi:\s*(.*)$/i, 'Сақтық көшірме жойылды: $1'],
  [
    /^Bemor hisoboti \(PDF\) yuklab olindi:\s*(.*)$/i,
    'Пациент есебі (PDF) жүктеп алынды: $1',
  ],
  [
    /^Bemor anketasi \(DOCX\) yuklab olindi:\s*(.*)$/i,
    'Пациент анкетасы (DOCX) жүктеп алынды: $1',
  ],
];

const AUDIT_DETAIL_REPLACEMENTS_KZ = [
  [/\bYangi\b/gi, 'Жаңа'],
  [/\bfoydalanuvchi\b/gi, 'пайдаланушы'],
  [/\bFoydalanuvchi\b/g, 'Пайдаланушы'],
  [/\bma'?lumotlari\b/gi, 'деректері'],
  [/\bMa'?lumotlar\b/g, 'Деректер'],
  [/\bMa'?lumot\b/g, 'Дерек'],
  [/\bma'?lumotlar\b/gi, 'деректер'],
  [/\bma'?lumot\b/gi, 'дерек'],
  [/\btahlil\b/gi, 'талдау'],
  [/\bTahlil\b/g, 'Талдау'],
  [/\bBemor hisoboti\b/g, 'Пациент есебі'],
  [/\bbemor hisoboti\b/gi, 'пациент есебі'],
  [/\bBemor anketasi\b/g, 'Пациент анкетасы'],
  [/\bbemor anketasi\b/gi, 'пациент анкетасы'],
  [/\bBemor\b/g, 'Пациент'],
  [/\bbemor\b/gi, 'пациент'],
  [/\bAdmin\b/g, 'Админ'],
  [/\badmin\b/gi, 'админ'],
  [/\bIzlanuvchi\b/g, 'Зерттеуші'],
  [/\bizlanuvchi\b/gi, 'зерттеуші'],
  [/\bResearcher\b/g, 'Зерттеуші'],
  [/\bresearcher\b/gi, 'зерттеуші'],
  [/\bAnalysis\b/g, 'Талдау'],
  [/\banalysis\b/gi, 'талдау'],
  [/\bUser\b/g, 'Пайдаланушы'],
  [/\buser\b/gi, 'пайдаланушы'],
  [/\byaratildi\b/gi, 'құрылды'],
  [/\byangilandi\b/gi, 'жаңартылды'],
  [/\btiklandi\b/gi, 'қалпына келтірілді'],
  [/\bo'?chirildi\b/gi, 'жойылды'],
  [/\bcreated\b/gi, 'құрылды'],
  [/\bupdated\b/gi, 'жаңартылды'],
  [/\bdeleted\b/gi, 'жойылды'],
  [/\brestored\b/gi, 'қалпына келтірілді'],
  [/\byuklab olindi\b/gi, 'жүктеп алынды'],
  [/\byuklandi\b/gi, 'жүктелді'],
  [/\bolindi\b/gi, 'алынды'],
  [/\bsavatga yuborildi\b/gi, 'себетке жіберілді'],
  [/\bsavatdan\b/gi, 'себеттен'],
  [/\bbutunlay\b/gi, 'толық'],
  [/\bIDlar\b/g, 'ID'],
  [/\bBarchasi\b/g, 'Барлығы'],
  [/\bta yozuv\b/gi, 'жазба'],
  [/\bta\b/g, 'дана'],
  [/\bZaxira nusxasi\b/g, 'Сақтық көшірме'],
  [/\bzaxira nusxasi\b/gi, 'сақтық көшірме'],
  [/\bZaxira\b/g, 'Сақтық көшірме'],
  [/\bzaxira\b/gi, 'сақтық көшірме'],
  [/\bfayl\b/gi, 'файл'],
  [/\bO'?zgarishlar\b/gi, 'Өзгерістер'],
  [/\bAlmashtirish\b/gi, 'ауыстыру'],
  [/\btizimga kirdi\b/gi, 'жүйеге кірді'],
];

const AUDIT_DETAIL_CLEANUPS_KZ = [
  [/Жаңа талдау құрылды/gi, 'Жаңа талдау құрылды'],
  [
    /Пациент анкетасы \(DOCX\) жүктеп алынды/gi,
    'Пациент анкетасы (DOCX) жүктеп алынды',
  ],
  [
    /Пациент есебі \(PDF\) жүктеп алынды/gi,
    'Пациент есебі (PDF) жүктеп алынды',
  ],
  [/\s+:/g, ':'],
];

const AUDIT_DETAIL_PATTERNS_KY = [
  [
    /^Yangi tahlil (yaratildi|created|создано):\s*(.*)$/i,
    'Жаңы талдоо түзүлдү: $2',
  ],
  [/^Yangi foydalanuvchi yaratildi:\s*(.*)$/i, 'Жаңы колдонуучу түзүлдү: $1'],
  [
    /^Foydalanuvchi ma'?lumotlari yangilandi:\s*(.*)$/i,
    'Колдонуучунун маалыматы жаңыртылды: $1',
  ],
  [/^Foydalanuvchi o'?chirildi:\s*(.*)$/i, 'Колдонуучу өчүрүлдү: $1'],
  [/^Foydalanuvchi tiklandi:\s*(.*)$/i, 'Колдонуучу калыбына келтирилди: $1'],
  [/^Foydalanuvchi tizimga kirdi:\s*(.*)$/i, 'Колдонуучу системага кирди: $1'],
  [
    /^(\d+)\s*ta tahlil savatga yuborildi:\s*(.*)$/i,
    '$1 талдоо себетке жөнөтүлдү: $2',
  ],
  [
    /^Audit jurnali tozalandi:\s*Barchasi\s*\((\d+)\s*ta yozuv\)$/i,
    'Аудит журналы тазаланды: баары ($1 жазуу)',
  ],
  [
    /^Audit jurnali tozalandi:\s*(.*?)\s*\((\d+)\s*ta yozuv\)$/i,
    'Аудит журналы тазаланды: $1 ($2 жазуу)',
  ],
  [/^Zaxira nusxasi yaratildi:\s*(.*)$/i, 'Камдык көчүрмө түзүлдү: $1'],
  [
    /^Zaxira to'?liq tiklandi \(Almashtirish\):\s*(.*)$/i,
    'Камдык көчүрмө толук калыбына келтирилди (алмаштыруу): $1',
  ],
  [/^Zaxira nusxasi o'?chirildi:\s*(.*)$/i, 'Камдык көчүрмө өчүрүлдү: $1'],
  [
    /^Bemor hisoboti \(PDF\) yuklab olindi:\s*(.*)$/i,
    'Бейтап отчету (PDF) жүктөлдү: $1',
  ],
  [
    /^Bemor anketasi \(DOCX\) yuklab olindi:\s*(.*)$/i,
    'Бейтап анкетасы (DOCX) жүктөлдү: $1',
  ],
  [
    /^(.+?) roli uchun Chat holati o'?zgartirildi:\s*AI=(True|False),\s*Ichki=(True|False)$/i,
    '$1 ролу үчүн Чат абалы өзгөртүлдү: AI=$2, Ички=$3',
  ],
];

const AUDIT_DETAIL_REPLACEMENTS_KY = [
  [/\bYangi\b/gi, 'Жаңы'],
  [/\bfoydalanuvchi\b/gi, 'колдонуучу'],
  [/\bFoydalanuvchi\b/g, 'Колдонуучу'],
  [/\bma'?lumotlari\b/gi, 'маалыматы'],
  [/\bma'?lumotlar\b/gi, 'маалыматтар'],
  [/\btahlil\b/gi, 'талдоо'],
  [/\bTahlil\b/g, 'Талдоо'],
  [/\bBemor hisoboti\b/g, 'Бейтап отчету'],
  [/\bBemor anketasi\b/g, 'Бейтап анкетасы'],
  [/\bBemor\b/g, 'Бейтап'],
  [/\bAdmin\b/g, 'Админ'],
  [/\bIzlanuvchi\b/g, 'Изилдөөчү'],
  [/\bResearcher\b/g, 'Изилдөөчү'],
  [/\byaratildi\b/gi, 'түзүлдү'],
  [/\byangilandi\b/gi, 'жаңыртылды'],
  [/\btiklandi\b/gi, 'калыбына келтирилди'],
  [/\bo'?chirildi\b/gi, 'өчүрүлдү'],
  [/\byuklab olindi\b/gi, 'жүктөлдү'],
  [/\bsavatga yuborildi\b/gi, 'себетке жөнөтүлдү'],
  [/\bsavatdan\b/gi, 'себеттен'],
  [/\bbutunlay\b/gi, 'толук'],
  [/\bBarchasi\b/g, 'Баары'],
  [/\bta yozuv\b/gi, 'жазуу'],
  [/\bZaxira nusxasi\b/g, 'Камдык көчүрмө'],
  [/\bzaxira nusxasi\b/gi, 'камдык көчүрмө'],
  [/\bZaxira\b/g, 'Камдык көчүрмө'],
  [/\bzaxira\b/gi, 'камдык көчүрмө'],
  [/\bfayl\b/gi, 'файл'],
  [/\bO'?zgarishlar\b/gi, 'Өзгөрүүлөр'],
  [/\bAlmashtirish\b/gi, 'алмаштыруу'],
  [/\btizimga kirdi\b/gi, 'системага кирди'],
];

const AUDIT_DETAIL_CLEANUPS_KY = [[/\s+:/g, ':']];
const formatAuditAction = (action, lang) => {
  const value = String(action || '-');
  const labels = AUDIT_ACTION_LABELS[lang];
  if (!labels) return value;
  const key = value.toLowerCase().trim().replaceAll('-', '_');
  return labels[key] || value;
};

const formatAuditTarget = (targetType, lang) => {
  if (!targetType) return '';
  const value = String(targetType);
  if (lang === 'uz') {
    const AUDIT_TARGET_LABELS_UZ = {
      User: 'Foydalanuvchi',
      PatientAnalysis: 'Bemor tahlili',
      Payment: 'To‘lov',
      Backup: 'Zaxira nusxasi',
      ClinicalData: 'Klinik ma’lumotlar',
      AuditLog: 'Audit jurnali',
    };
    return AUDIT_TARGET_LABELS_UZ[value] || value;
  }
  if (lang === 'en')
    return AUDIT_TARGET_LABELS_EN[value] || translateAuditText(value, lang);
  if (lang === 'tr')
    return AUDIT_TARGET_LABELS_TR[value] || translateAuditText(value, lang);
  if (lang === 'ru')
    return AUDIT_TARGET_LABELS_RU[value] || translateAuditText(value, lang);
  if (lang === 'kz')
    return AUDIT_TARGET_LABELS_KZ[value] || translateAuditText(value, lang);
  if (lang === 'ky')
    return AUDIT_TARGET_LABELS_KY[value] || translateAuditText(value, lang);
  return value;
};

const formatAuditJsonValue = (value, lang) => {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value))
    return value.map((item) => formatAuditJsonValue(item, lang)).join(', ');
  if (typeof value === 'object') return formatAuditDetails(value, lang);
  const text = String(value);
  return lang === 'en' ||
    lang === 'tr' ||
    lang === 'ru' ||
    lang === 'kz' ||
    lang === 'ky'
    ? translateAuditText(text, lang)
    : text;
};

const translateAuditText = (text, lang) => {
  const patterns =
    lang === 'en'
      ? AUDIT_DETAIL_PATTERNS_EN
      : lang === 'tr'
        ? AUDIT_DETAIL_PATTERNS_TR
        : lang === 'ky'
          ? AUDIT_DETAIL_PATTERNS_KY
          : lang === 'kz'
            ? AUDIT_DETAIL_PATTERNS_KZ
            : AUDIT_DETAIL_PATTERNS_RU;
  const replacements =
    lang === 'en'
      ? AUDIT_DETAIL_REPLACEMENTS_EN
      : lang === 'tr'
        ? AUDIT_DETAIL_REPLACEMENTS_TR
        : lang === 'ky'
          ? AUDIT_DETAIL_REPLACEMENTS_KY
          : lang === 'kz'
            ? AUDIT_DETAIL_REPLACEMENTS_KZ
            : AUDIT_DETAIL_REPLACEMENTS_RU;
  const cleanups =
    lang === 'en'
      ? AUDIT_DETAIL_CLEANUPS_EN
      : lang === 'tr'
        ? AUDIT_DETAIL_CLEANUPS_TR
        : lang === 'ky'
          ? AUDIT_DETAIL_CLEANUPS_KY
          : lang === 'kz'
            ? AUDIT_DETAIL_CLEANUPS_KZ
            : AUDIT_DETAIL_CLEANUPS_RU;

  const patternMatch = patterns.find(([pattern]) => pattern.test(text));
  if (patternMatch) return text.replace(patternMatch[0], patternMatch[1]);
  const translated = replacements.reduce(
    (result, [pattern, to]) => result.replace(pattern, to),
    text
  );
  return cleanups.reduce(
    (result, [pattern, to]) => result.replace(pattern, to),
    translated
  );
};

const formatAuditDetails = (details, lang) => {
  if (details === null || details === undefined || details === '') return '-';
  let text =
    typeof details === 'string' ? details : JSON.stringify(details, null, 2);

  try {
    const parsed = typeof details === 'string' ? JSON.parse(details) : details;
    if (parsed && typeof parsed === 'object') {
      text = Object.entries(parsed)
        .map(([key, value]) => {
          const label =
            lang === 'uz'
              ? {
                  email: 'Email',
                  role: 'Rol',
                  name: 'Ism',
                  status: 'Holat',
                  permissions: 'Ruxsatlar',
                  action: 'Harakat',
                  details: 'Tafsilotlar',
                  backup_file: 'Zaxira fayli',
                  backup_size: 'Zaxira hajmi',
                }[key] || key
              : lang === 'en'
                ? AUDIT_JSON_KEY_LABELS_EN[key] || translateAuditText(key, lang)
                : lang === 'tr'
                  ? AUDIT_JSON_KEY_LABELS_TR[key] || translateAuditText(key, lang)
                  : lang === 'ru'
                    ? AUDIT_JSON_KEY_LABELS_RU[key] ||
                      translateAuditText(key, lang)
                    : lang === 'kz'
                      ? AUDIT_JSON_KEY_LABELS_KZ[key] ||
                        translateAuditText(key, lang)
                      : lang === 'ky'
                        ? AUDIT_JSON_KEY_LABELS_KY[key] ||
                          translateAuditText(key, lang)
                        : key;
          return `${label}: ${formatAuditJsonValue(value, lang)}`;
        })
        .join('; ');
    }
  } catch {
    // Plain text audit details are expected too.
  }

  if (
    lang !== 'en' &&
    lang !== 'tr' &&
    lang !== 'ru' &&
    lang !== 'kz' &&
    lang !== 'ky'
  )
    return text;
  return translateAuditText(text, lang);
};

const GlassPaper = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      background: (theme) =>
        theme.palette.mode === 'dark'
          ? 'rgba(30,30,40,0.7)'
          : 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(20px)',
      borderRadius: 4,
      border: '1px solid',
      borderColor: (theme) =>
        theme.palette.mode === 'dark'
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(0,0,0,0.05)',
      overflow: 'auto',
      '&::-webkit-scrollbar': {
        height: '6px',
        width: '6px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(0,0,0,0.1)',
        borderRadius: '10px',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.2)'
            : 'rgba(0,0,0,0.2)',
      },
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const scrollableContentSx = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  overflowX: 'auto',
  overflowY: 'visible',
  WebkitOverflowScrolling: 'touch',
  pb: 1,
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

const blurActiveElement = () => {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
};

const formatReportDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
};

const escapeExcelCell = (value) =>
  String(value ?? '-')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

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

const SuperAdminPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user, login: authLogin, logout, loading: authLoading } = useAuth();
  const { lang, t } = useLanguage();
  const pageLabels = PAGE_LABELS[lang] || PAGE_LABELS.uz;
  const adminPermissionLabels = getAdminPermissionLabels(lang);
  const apt = useCallback((key) => getAdminPermissionText(lang, key), [lang]);
  const pt = useCallback((key) => pageT(lang, key), [lang]);
  const reportLabels = ADMIN_REPORT_LABELS[lang] || ADMIN_REPORT_LABELS.uz;
  const [activeTab, setActiveTab] = useState(0);
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

  // Admin Management State
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminReportOpen, setAdminReportOpen] = useState(false);
  const [adminReportDownloading, setAdminReportDownloading] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminDialogStep, setAdminDialogStep] = useState(0);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
    phone: '',
    region: '',
    district: '',
    mahalla: '',
    address: '',
    latitude: '',
    longitude: '',
    research_topic: '',
    research_type: '',
    research_area: '',
    scientific_supervisor: '',
    supervisor_id: '',
    admin_permissions: normalizeAdminPermissions(),
  });
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showCurrentAdminPassword, setShowCurrentAdminPassword] =
    useState(false);
  const [boundaryIndex, setBoundaryIndex] = useState(null);
  const [mahallaOptions, setMahallaOptions] = useState([]);
  const [mahallaLoading, setMahallaLoading] = useState(false);
  const adminMahallaValue = adminForm.mahalla || '';
  const hasSelectedAdminMahallaOption =
    !adminMahallaValue ||
    mahallaOptions.some((mahalla) => mahalla.label === adminMahallaValue);

  useEffect(() => {
    if (adminDialogOpen) setAdminDialogStep(0);
  }, [adminDialogOpen]);

  const normalizeAdminForm = (admin = {}) => ({
    name: admin.name || '',
    email: admin.email || '',
    password: '',
    confirmPassword: '',
    role: admin.role || 'admin',
    phone: admin.phone || '',
    region: admin.region || '',
    district: admin.district || '',
    mahalla: admin.mahalla || '',
    address: admin.address || '',
    latitude: admin.latitude ?? '',
    longitude: admin.longitude ?? '',
    research_topic: admin.research_topic || '',
    research_type: admin.research_type || '',
    research_area: admin.research_area || '',
    scientific_supervisor: admin.scientific_supervisor || '',
    supervisor_id: admin.supervisor_id || '',
    admin_permissions: normalizeAdminPermissions(admin.admin_permissions),
  });

  // Deleted Data State
  const [deletedData, setDeletedData] = useState([]);
  const [deletedAdmins, setDeletedAdmins] = useState([]);
  const [deletedLoading, setDeletedLoading] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(25);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [auditUserFilter, setAuditUserFilter] = useState('');
  const [auditTargetFilter, setAuditTargetFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    isDestructive: false,
  });

  const showConfirm = (message, onConfirm, isDestructive = false, title = '') => {
    setConfirmDialog({
      open: true,
      title: title,
      message: message,
      onConfirm: onConfirm,
      isDestructive: isDestructive,
    });
  };

  // Dashboard Stats State
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [dashFilters, setDashFilters] = useState({
    gender: '',
    region: '',
    age_min: 0,
    age_max: 100,
    bmi_min: 10,
    bmi_max: 50,
    somatotype: '',
    date_from: '',
    date_to: '',
  });
  const [viewRow, setViewRow] = useState(null);

  // Backup State
  const [backups, setBackups] = useState([]);
  const [backupLoading, setBackupLoading] = useState(false);

  const [checked, setChecked] = useState(new Set());
  const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false);
  const getDeletedRowKey = (row) =>
    row.__rowKey || `${row.__deletedSource || 'analysis'}:${row.id}`;
  const getDeletedRowCode = (row) =>
    row.id_code || (row.id ? `#${row.id}` : '-');
  const getDeletedRowPatientName = (row) =>
    row.full_name ||
    row.name ||
    [row.last_name, row.first_name].filter(Boolean).join(' ') ||
    '-';
  const getDeletedByName = (row) =>
    row.deleted_by_name ||
    row.deleted_by?.name ||
    row.deleted_by_email ||
    pt('unknown');
  const getDeletedDate = (row) => {
    if (!row.deleted_at) return '-';
    const date = new Date(row.deleted_at);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
  };
  const normalizeLocationName = useCallback(
    (value = '') =>
      String(value)
        .toLowerCase()
        .replace(/[‘’`ʻʼ]/g, "'")
        .replace(/\s+/g, ' ')
        .replace(' respublikasi', '')
        .replace(' viloyati', '')
        .replace(' tumani', '')
        .replace(' shahri', '')
        .replace(' mahallasi', '')
        .replace(/[‘’ʻʼ']/g, '')
        .replace(/\bsergeli\b/g, 'sirgali')
        .trim(),
    []
  );
  const featureLabel = useCallback(
    (item) =>
      item?.name_uz ||
      item?.display_name ||
      item?.name_en ||
      item?.name_ru ||
      '',
    []
  );
  const canonicalRegionName = useCallback(
    (value = '') => {
      const raw = String(value).toLowerCase();
      if (raw.includes('toshkent')) {
        if (
          raw.includes('shah') ||
          raw.includes('city') ||
          raw.includes('город')
        ) {
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
      return normalizeLocationName(value);
    },
    [normalizeLocationName]
  );
  const locationTokens = useCallback(
    (value = '') =>
      normalizeLocationName(value)
        .split(' ')
        .filter((part) => part && part.length > 1),
    [normalizeLocationName]
  );
  const locationMatches = useCallback(
    (left = '', right = '') => {
      const a = normalizeLocationName(left);
      const b = normalizeLocationName(right);
      if (!a || !b) return false;
      if (a === b || a.includes(b) || b.includes(a)) return true;
      const aTokens = locationTokens(a);
      const bTokens = locationTokens(b);
      return (
        aTokens.length > 0 && aTokens.every((token) => bTokens.includes(token))
      );
    },
    [locationTokens, normalizeLocationName]
  );
  const findBoundaryRegion = useCallback(
    (regionName) => {
      const key = canonicalRegionName(regionName);
      return (boundaryIndex?.levels?.['1'] || []).find(
        (item) => canonicalRegionName(featureLabel(item)) === key
      );
    },
    [boundaryIndex, canonicalRegionName, featureLabel]
  );
  const findBoundaryDistrict = useCallback(
    (districtName, regionName = adminForm.region) => {
      const region = findBoundaryRegion(regionName);
      const sameRegionDistricts = (boundaryIndex?.levels?.['2'] || []).filter(
        (item) => !region || String(item.parent_id) === String(region.id)
      );
      return (
        sameRegionDistricts.find((item) =>
          locationMatches(featureLabel(item), districtName)
        ) ||
        (boundaryIndex?.levels?.['2'] || []).find((item) =>
          locationMatches(featureLabel(item), districtName)
        )
      );
    },
    [
      adminForm.region,
      boundaryIndex,
      featureLabel,
      findBoundaryRegion,
      locationMatches,
    ]
  );
  const parseMaybeJson = (value) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
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
  const getLocationCenter = (item) => {
    const center = parseMaybeJson(item?.center);
    const bbox =
      parseMaybeJson(item?.bbox) || getGeometryBounds(item?.geometry);
    if (Array.isArray(center) && center.length >= 2) return center;
    if (Array.isArray(bbox) && bbox.length === 4) {
      return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
    }
    return null;
  };
  const MAX_MERCATOR = 20037508.342789244;
  const normalizeCoordinatePair = useCallback((latitude, longitude) => {
    const rawLat = Number(latitude);
    const rawLng = Number(longitude);
    const isLngLatUzbekistan = (lng, lat) =>
      Number.isFinite(lng) &&
      Number.isFinite(lat) &&
      lng >= 55 &&
      lng <= 74 &&
      lat >= 37 &&
      lat <= 46;
    const mercatorToLngLat = (x, y) => {
      const lng = (x / MAX_MERCATOR) * 180;
      const lat = (Math.atan(Math.exp(y / 6378137)) * 360) / Math.PI - 90;
      return [lng, lat];
    };
    const isMercator = (x, y) =>
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      Math.abs(x) <= MAX_MERCATOR &&
      Math.abs(y) <= MAX_MERCATOR;

    if (isLngLatUzbekistan(rawLng, rawLat))
      return { latitude: rawLat, longitude: rawLng };
    if (isLngLatUzbekistan(rawLat, rawLng))
      return { latitude: rawLng, longitude: rawLat };

    if (isMercator(rawLng, rawLat)) {
      const [lng, lat] = mercatorToLngLat(rawLng, rawLat);
      if (isLngLatUzbekistan(lng, lat))
        return { latitude: lat, longitude: lng };
    }
    if (isMercator(rawLat, rawLng)) {
      const [lng, lat] = mercatorToLngLat(rawLat, rawLng);
      if (isLngLatUzbekistan(lng, lat))
        return { latitude: lat, longitude: lng };
    }

    return null;
  }, []);
  const getGenderLabel = (gender) => {
    if (!gender) return '-';
    const normalized = String(gender).toLowerCase();
    if (['male', 'erkak', 'boy'].includes(normalized)) return 'Erkak';
    if (['female', 'ayol', 'girl'].includes(normalized)) return 'Ayol';
    return gender;
  };
  const getDeletedRowBmiText = (row) => {
    const bmi =
      row.bmi ??
      (row.weight && row.chest_standing_height
        ? (row.weight / Math.pow(row.chest_standing_height / 100, 2)).toFixed(1)
        : null);
    if (!bmi) return '-';
    return row.bmi_status ? `${bmi} (${row.bmi_status})` : String(bmi);
  };

  const toggleAll = useCallback(
    (rows) => {
      const next = new Set(checked);
      const allChecked =
        rows.length > 0 && rows.every((r) => checked.has(getDeletedRowKey(r)));
      if (allChecked) rows.forEach((r) => next.delete(getDeletedRowKey(r)));
      else rows.forEach((r) => next.add(getDeletedRowKey(r)));
      setChecked(next);
    },
    [checked]
  );

  const toggleOne = useCallback(
    (id) => {
      const next = new Set(checked);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setChecked(next);
    },
    [checked]
  );

  const handleBulkRestore = async () => {
    if (checked.size === 0) return;
    try {
      const selectedRows = deletedData.filter((row) =>
        checked.has(getDeletedRowKey(row))
      );
      const analysisIds = selectedRows
        .filter((row) => row.__deletedSource !== 'research')
        .map((row) => row.id);
      const researchIds = selectedRows
        .filter((row) => row.__deletedSource === 'research')
        .map((row) => row.id);

      if (analysisIds.length) await AdminApi.analyses.restore(analysisIds);
      for (const id of researchIds) await ResearchApi.restore(id);

      toast.success(pt('restoredMany'));
      setChecked(new Set());
      fetchDeletedAnalyses();
    } catch (err) {
      toast.error('Xatolik: ' + err.message);
    }
  };

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleBulkHardDelete = useCallback(async () => {
    if (checked.size === 0) return;
    blurActiveElement();
    setDeleteConfirmOpen(true);
  }, [checked.size]);

  // Keyboard shortcut for deletion
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.code === 'Delete' || e.key === 'Backspace') {
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

        if (checked.size > 0 && activeTab === 4) {
          handleBulkHardDelete();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [checked.size, activeTab, handleBulkHardDelete]);

  useEffect(() => {
    let mounted = true;
    fetch('/maps/admin-boundaries/index.json')
      .then((response) => response.json())
      .then((data) => {
        if (mounted) setBoundaryIndex(data);
      })
      .catch((error) => console.warn('Boundary index load error:', error));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const districtName = adminForm.district;
    setMahallaOptions([]);
    setMahallaLoading(false);
    if (!districtName || !boundaryIndex?.levels?.['2']) return undefined;
    const district = findBoundaryDistrict(districtName, adminForm.region);
    const path =
      district &&
      (boundaryIndex.files?.['3']?.[String(district.id)] ||
        `level3/${district.id}.geojson`);
    if (!path) return undefined;
    setMahallaLoading(true);
    fetch(`/maps/admin-boundaries/${path}`)
      .then((response) => response.json())
      .then((geoJson) => {
        if (!mounted) return;
        setMahallaOptions(
          (geoJson.features || [])
            .map((feature) => ({
              ...feature.properties,
              geometry: feature.geometry,
              bbox: parseMaybeJson(feature.bbox || feature.properties?.bbox),
              center: parseMaybeJson(feature.properties?.center),
              label: featureLabel(feature.properties),
            }))
            .filter((item) => item.label)
            .sort((a, b) =>
              a.label.localeCompare(b.label, lang === 'kz' ? 'kk' : lang)
            )
        );
      })
      .catch((error) => console.warn('Mahalla layer load error:', error))
      .finally(() => {
        if (mounted) setMahallaLoading(false);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    adminForm.district,
    adminForm.region,
    boundaryIndex,
    featureLabel,
    findBoundaryDistrict,
  ]);

  useEffect(() => {
    if (user?.role === 'superadmin') {
      if (activeTab === 0 || activeTab === 1) {
        fetchDashboardStats(dashFilters);
        fetchAdmins();
      }
      if (activeTab === 2) {
        fetchDashboardStats(dashFilters);
        fetchAdmins();
      }
      if (activeTab === 3) fetchAdmins();
      if (activeTab === 4) {
        fetchDeletedAnalyses();
        fetchDeletedAdmins();
      }
      if (activeTab === 7) fetchBackups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab, dashFilters]);

  // Dedicated useEffect for Audit Logs with debounced search
  useEffect(() => {
    if (activeTab === 6 && user?.role === 'superadmin') {
      if (!admins || admins.length === 0) {
        fetchAdmins();
      }
      const delayDebounceFn = setTimeout(() => {
        fetchAuditLogs();
      }, 250);
      return () => clearTimeout(delayDebounceFn);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    user,
    auditPage,
    auditPageSize,
    auditActionFilter,
    auditUserFilter,
    auditTargetFilter,
    auditSearch,
  ]);

  const getAdminReportRows = useCallback(
    () =>
      (admins || []).map((admin, index) => ({
        index: index + 1,
        name: admin.name || '-',
        email: admin.email || '-',
        role: admin.role || '-',
        phone: admin.phone || '-',
        region: admin.region
          ? getLocalizedLocationLabel(admin.region, lang, 1)
          : '-',
        district: admin.district
          ? getLocalizedLocationLabel(admin.district, lang, 2)
          : '-',
        mahalla: admin.mahalla
          ? getLocalizedLocationLabel(admin.mahalla, lang, 3)
          : '-',
        researchTopic: admin.research_topic || '-',
        researchType: admin.research_type || '-',
        researchArea: admin.research_area || '-',
        supervisor: admin.scientific_supervisor || '-',
        createdAt: formatReportDate(admin.created_at),
      })),
    [admins, lang]
  );

  const createAdminReportFallbackBlob = useCallback(() => {
    const rows = getAdminReportRows();
    const columns = reportLabels.columns;
    const header = ADMIN_REPORT_COLUMN_KEYS.map(
      (key) => `<th>${escapeExcelCell(columns[key] || key)}</th>`
    ).join('');
    const body = rows
      .map(
        (row) =>
          `<tr>${ADMIN_REPORT_COLUMN_KEYS.map(
            (key) => `<td>${escapeExcelCell(row[key])}</td>`
          ).join('')}</tr>`
      )
      .join('');
    const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><h2>${escapeExcelCell(
      reportLabels.title
    )}</h2><p>${escapeExcelCell(reportLabels.generatedAt)}: ${escapeExcelCell(
      new Date().toLocaleString()
    )}</p><table border="1"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></body></html>`;

    return new Blob([html], {
      type: 'application/vnd.ms-excel;charset=utf-8',
    });
  }, [getAdminReportRows, reportLabels]);

  const handleOpenAdminReport = () => {
    blurActiveElement();
    setAdminReportOpen(true);
    if (!admins.length && !adminsLoading) fetchAdmins();
  };

  const handleDownloadAdminReport = async () => {
    setAdminReportDownloading(true);
    try {
      let blob;
      let filename = `admin_researchers_report_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;

      try {
        blob = await AdminApi.users.exportXlsx({ include_researchers: true });
      } catch {
        blob = createAdminReportFallbackBlob();
        filename = filename.replace(/\.xlsx$/i, '.xls');
      }

      downloadBlob(blob, filename);
      toast.success(reportLabels.downloaded);
    } catch (err) {
      toast.error(`${reportLabels.downloadError} ${err.message}`);
    } finally {
      setAdminReportDownloading(false);
    }
  };

  const fetchDashboardStats = async (filters = dashFilters) => {
    setStatsLoading(true);
    try {
      const data = await AdminApi.stats(filters);
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const setAdminPinFromBoundary = () => {
    const center = resolveAdminBoundaryCenter();
    if (!center) {
      toast.error(pt('locationNotFound'));
      return;
    }
    setAdminForm((current) => ({
      ...current,
      longitude: Number(center[0]).toFixed(6),
      latitude: Number(center[1]).toFixed(6),
    }));
    toast.success(pt('pinSelectedCenter'));
  };

  const setAdminFormWithBoundaryCenter = (patch, options = {}) => {
    const nextForm = { ...adminForm, ...patch };
    const selectedMahalla = mahallaOptions.find(
      (item) => item.label === nextForm.mahalla
    );
    const selectedDistrict = findBoundaryDistrict(
      nextForm.district,
      nextForm.region
    );
    const selectedRegion = findBoundaryRegion(nextForm.region);
    const preferredBoundary =
      options.preferMahalla && selectedMahalla
        ? selectedMahalla
        : options.preferDistrict && selectedDistrict
          ? selectedDistrict
          : null;
    const center =
      getLocationCenter(preferredBoundary) ||
      (options.fillFallbackCenter
        ? getLocationCenter(selectedMahalla) ||
          getLocationCenter(selectedDistrict) ||
          getLocationCenter(selectedRegion)
        : null);

    setAdminForm({
      ...nextForm,
      ...(center
        ? {
            longitude: Number(center[0]).toFixed(6),
            latitude: Number(center[1]).toFixed(6),
          }
        : {}),
    });
  };

  const resolveAdminBoundaryCenter = () => {
    const selectedMahalla = mahallaOptions.find(
      (item) => item.label === adminForm.mahalla
    );
    const selectedDistrict = findBoundaryDistrict(
      adminForm.district,
      adminForm.region
    );
    const selectedRegion = findBoundaryRegion(adminForm.region);
    return (
      getLocationCenter(selectedMahalla) ||
      getLocationCenter(selectedDistrict) ||
      getLocationCenter(selectedRegion)
    );
  };

  const useCurrentLocationForAdmin = () => {
    if (!navigator.geolocation) {
      toast.error(pt('geolocationUnsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAdminForm((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        toast.success(pt('currentLocationFetched'));
      },
      () => toast.error(pt('geolocationDenied')),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const fetchAdmins = async () => {
    setAdminsLoading(true);
    try {
      const data = await AdminApi.users.list();
      setAdmins(data);
    } catch (err) {
      console.error('Failed to fetch admins:', err);
    } finally {
      setAdminsLoading(false);
    }
  };

  const fetchDeletedAnalyses = async () => {
    setDeletedLoading(true);
    try {
      const [analysisResult, researchResult] = await Promise.allSettled([
        AdminApi.analyses.deletedList({ page_size: 500 }),
        ResearchApi.deletedList({ page_size: 500 }),
      ]);

      if (analysisResult.status === 'rejected') {
        console.error(
          'Failed to fetch deleted analyses:',
          analysisResult.reason
        );
      }
      if (researchResult.status === 'rejected') {
        console.error(
          'Failed to fetch deleted research records:',
          researchResult.reason
        );
      }

      const analysisRows =
        analysisResult.status === 'fulfilled'
          ? (analysisResult.value.items || [])
              .filter((i) => i.is_deleted)
              .map((i) => ({
                ...i,
                deleted_by_name: getDeletedByName(i),
                __deletedSource: 'analysis',
                __rowKey: `analysis:${i.id}`,
              }))
          : [];
      const researchRows =
        researchResult.status === 'fulfilled'
          ? (researchResult.value || [])
              .filter((i) => i.is_deleted)
              .map((i) => ({
                ...i,
                deleted_by_name: getDeletedByName(i),
                __deletedSource: 'research',
                __rowKey: `research:${i.id}`,
              }))
          : [];

      setDeletedData(
        [...analysisRows, ...researchRows].sort(
          (a, b) => new Date(b.deleted_at || 0) - new Date(a.deleted_at || 0)
        )
      );
    } catch (err) {
      console.error('Failed to fetch deleted analyses:', err);
    } finally {
      setDeletedLoading(false);
    }
  };
  const fetchDeletedAdmins = async () => {
    setDeletedLoading(true);
    try {
      const data = await AdminApi.users.deletedList();
      setDeletedAdmins((data || []).filter((u) => u.is_deleted));
    } catch (err) {
      console.error('Failed to fetch deleted admins:', err);
    } finally {
      setDeletedLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const data = await AdminApi.auditLogs.list({
        page: auditPage,
        page_size: auditPageSize,
        action: auditActionFilter,
        user_id: auditUserFilter,
        target_type: auditTargetFilter,
        search: auditSearch,
      });
      setAuditLogs(data.items || []);
      setAuditTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const fetchBackups = async () => {
    setBackupLoading(true);
    try {
      const data = await AdminApi.backup.list();
      setBackups(data.items || []);
    } catch (err) {
      console.error('Failed to fetch backups:', err);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleLogin = async (e) => {
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
      } else if (profile.role !== 'superadmin' && profile.role !== 'admin') {
        navigate('/');
      }
    } catch (err) {
      setLoginError(err.message || pt('errorPrefix'));
    } finally {
      setLoginInProgress(false);
    }
  };

  const handleAdminAction = async () => {
    // Validation
    if (adminForm.password) {
      if (adminForm.password !== adminForm.confirmPassword) {
        toast.error(pt('passwordsNoMatch'));
        return;
      }
      if (adminForm.password.length < 6) {
        toast.error(`${pt('password')} 6+`);
        return;
      }
    } else if (!currentAdmin) {
      // New admin must have a password
      toast.error(pt('password'));
      return;
    }

    if (adminForm.role === 'field_assistant' && !adminForm.supervisor_id) {
      toast.error('Iltimos, assistent uchun kuratorni tanlang');
      return;
    }

    try {
      const { confirmPassword, ...payload } = adminForm;
      payload.admin_permissions = normalizeAdminPermissions(
        payload.admin_permissions
      );
      if (payload.role === 'field_assistant') {
        payload.supervisor_id = Number(payload.supervisor_id);
      } else {
        payload.supervisor_id = null;
      }
      if (payload.role !== 'admin') {
        payload.admin_permissions = normalizeAdminPermissions();
      }
      [
        'research_topic',
        'research_type',
        'research_area',
        'scientific_supervisor',
      ].forEach((key) => {
        if (payload[key]) payload[key] = payload[key].trim();
        if (payload[key] === '') payload[key] = null;
      });
      const latMissing =
        payload.latitude === '' ||
        payload.latitude === null ||
        payload.latitude === undefined;
      const lngMissing =
        payload.longitude === '' ||
        payload.longitude === null ||
        payload.longitude === undefined;
      if (latMissing !== lngMissing) {
        toast.error(
          'Aniq pin uchun latitude va longitude ikkisi ham kiritilishi kerak'
        );
        return;
      }
      const normalizedPair =
        payload.latitude !== '' &&
        payload.latitude !== null &&
        payload.latitude !== undefined &&
        payload.longitude !== '' &&
        payload.longitude !== null &&
        payload.longitude !== undefined
          ? normalizeCoordinatePair(payload.latitude, payload.longitude)
          : null;
      if (normalizedPair) {
        payload.latitude = normalizedPair.latitude;
        payload.longitude = normalizedPair.longitude;
      }
      ['latitude', 'longitude'].forEach((key) => {
        if (
          payload[key] === '' ||
          payload[key] === null ||
          payload[key] === undefined
        ) {
          delete payload[key];
        } else {
          payload[key] = Number(payload[key]);
        }
      });

      if (currentAdmin) {
        // UserUpdate doesn't have password_confirm
        if (!payload.password) delete payload.password;

        await AdminApi.users.update(currentAdmin.id, payload);
        toast.success(pt('updated'));
      } else {
        // UserCreate needs password_confirm
        payload.password_confirm = confirmPassword;
        await AdminApi.users.create(payload);
        toast.success(pt('newAdmin'));
      }
      setAdminDialogOpen(false);
      fetchAdmins();
    } catch (err) {
      toast.error('Xatolik: ' + err.message);
    }
  };

  const handleDeleteAdmin = async (id) => {
    const msg = CONFIRM_MESSAGES[lang]?.adminDeleteConfirm || CONFIRM_MESSAGES['en'].adminDeleteConfirm;
    showConfirm(msg, async () => {
      try {
        const deleteUser = AdminApi.users.delete || AdminApi.users.remove;
        await deleteUser(id);
        fetchAdmins();
        fetchDeletedAdmins();
        toast.success(pt('adminDeleted'));
      } catch (err) {
        toast.error('Xatolik: ' + err.message);
      }
    }, true);
  };

  const handleRestoreAnalysis = async (rowOrId) => {
    const row =
      typeof rowOrId === 'object'
        ? rowOrId
        : deletedData.find(
            (item) => item.id === rowOrId || getDeletedRowKey(item) === rowOrId
          );
    if (!row) return;

    try {
      if (row.__deletedSource === 'research') {
        await ResearchApi.restore(row.id);
      } else {
        await AdminApi.analyses.restore([row.id]);
      }
      toast.success(pt('dataRestored'));
      fetchDeletedAnalyses();
    } catch (err) {
      toast.error('Xatolik: ' + err.message);
    }
  };

  const handleRestoreAdmin = async (id) => {
    try {
      await AdminApi.users.restore(id);
      toast.success(pt('adminRestored'));
      fetchDeletedAdmins();
      fetchAdmins();
    } catch (err) {
      toast.error('Xatolik: ' + err.message);
    }
  };

  const handleHardDeleteAnalysis = async (rowOrId) => {
    const row =
      typeof rowOrId === 'object'
        ? rowOrId
        : deletedData.find(
            (item) => item.id === rowOrId || getDeletedRowKey(item) === rowOrId
          );
    if (!row) return;

    const msg = CONFIRM_MESSAGES[lang]?.hardDeleteDataConfirm || CONFIRM_MESSAGES['en'].hardDeleteDataConfirm;
    showConfirm(msg, async () => {
      try {
        if (row.__deletedSource === 'research') {
          await ResearchApi.hardDelete(row.id);
        } else {
          await AdminApi.analyses.hardDelete([row.id]);
        }
        toast.success(pt('hardDeleted'));
        fetchDeletedAnalyses();
      } catch (err) {
        toast.error('Xatolik: ' + err.message);
      }
    }, true);
  };

  const handleCreateBackup = async () => {
    setBackupLoading(true);
    try {
      await AdminApi.backup.create();
      toast.success(pt('createBackup'));
      fetchBackups();
    } catch (err) {
      toast.error('Xatolik: ' + err.message);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreBackup = async (filename) => {
    const msg = (CONFIRM_MESSAGES[lang]?.backupRestoreConfirm || CONFIRM_MESSAGES['en'].backupRestoreConfirm).replace('{filename}', filename);
    showConfirm(msg, async () => {
      setBackupLoading(true);
      try {
        await AdminApi.backup.restore(filename);
        toast.success(pt('restoredSuccessfully'));
      } catch (err) {
        toast.error('Xatolik: ' + err.message);
      } finally {
        setBackupLoading(false);
      }
    }, false);
  };

  const handleDeleteBackup = async (filename) => {
    const msg = (CONFIRM_MESSAGES[lang]?.deleteBackupConfirm || CONFIRM_MESSAGES['en'].deleteBackupConfirm).replace('{filename}', filename);
    showConfirm(msg, async () => {
      try {
        await AdminApi.backup.delete(filename);
        toast.success(pt('fileDeleted'));
        fetchBackups();
      } catch (err) {
        toast.error('Xatolik: ' + err.message);
      }
    }, true);
  };

  const handleClearAudit = async () => {
    const msg = CONFIRM_MESSAGES[lang]?.clearAuditConfirm || CONFIRM_MESSAGES['en'].clearAuditConfirm;
    showConfirm(msg, async () => {
      try {
        await AdminApi.auditLogs.clear();
        toast.success(pt('auditCleared'));
        fetchAuditLogs();
      } catch (err) {
        toast.error('Xatolik: ' + err.message);
      }
    }, true);
  };

  if (authLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // LOGIN SCREEN
  if (!user || user.role !== 'superadmin') {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassPaper sx={{ p: 4, position: 'relative', overflow: 'visible' }}>
            <Box
              sx={{
                position: 'absolute',
                top: -40,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0f766e 0%, #2563eb 100%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 8px 32px rgba(15, 118, 110, 0.24)',
              }}
            >
              <Lock sx={{ color: 'white', fontSize: 40 }} />
            </Box>

            <Box textAlign="center" mt={4} mb={4}>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                Super Admin
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pt('superLoginSubtitle')}
              </Typography>
            </Box>

            {loginError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {loginError}
              </Alert>
            )}

            <Box component="form" onSubmit={handleLogin}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label={pt('emailOrLogin')}
                  variant="outlined"
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, email: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label={pt('password')}
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, password: e.target.value })
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                {requiresVerification && (
                  <TextField
                    fullWidth
                    label="Tasdiqlash kodi"
                    variant="outlined"
                    value={loginForm.verification_code}
                    onChange={(e) =>
                      setLoginForm({
                        ...loginForm,
                        verification_code: e.target.value,
                      })
                    }
                    inputProps={{ inputMode: 'numeric', maxLength: 6 }}
                  />
                )}
                <Button
                  fullWidth
                  size="large"
                  type="submit"
                  variant="contained"
                  disabled={loginInProgress}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    boxShadow: '0 8px 16px rgba(15, 118, 110, 0.22)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    textTransform: 'none',
                  }}
                >
                  {loginInProgress ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    pt('login')
                  )}
                </Button>
              </Stack>
            </Box>
          </GlassPaper>
        </motion.div>
      </Container>
    );
  }

  // MAIN CONTENT RENDERER
  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <Box>
            <DashboardFilters
              filters={dashFilters}
              onFilterChange={setDashFilters}
              onReset={() =>
                setDashFilters({
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
            <SuperAdminDashboard
              stats={stats}
              statsLoading={statsLoading}
              admins={admins}
            />
          </Box>
        );
      case 1:
        return (
          <Box>
            <DashboardFilters
              filters={dashFilters}
              onFilterChange={setDashFilters}
              onReset={() =>
                setDashFilters({
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
            <ScientificAnalysis stats={stats} loading={statsLoading} />
          </Box>
        );

      case 2:
        return (
          <SuperAdminRegionalMap
            stats={stats}
            statsLoading={statsLoading}
            admins={admins}
          />
        );

      case 3:
        return (
          <Stack spacing={3}>
            <Box
              display="flex"
              flexDirection={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              gap={2}
            >
              <Typography variant="h4" fontWeight={800}>
                {pt('adminManagement')}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<Visibility />}
                  onClick={handleOpenAdminReport}
                  disabled={adminsLoading}
                  sx={{ borderRadius: 2 }}
                >
                  {reportLabels.preview}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    blurActiveElement();
                    setCurrentAdmin(null);
                    setAdminForm(normalizeAdminForm());
                    setShowAdminPassword(false);
                    setShowCurrentAdminPassword(false);
                    setAdminDialogOpen(true);
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  {pt('newAdmin')}
                </Button>
              </Stack>
            </Box>

            <TableContainer
              component={GlassPaper}
              sx={{ mt: 2, overflow: 'auto' }}
            >
              <Table
                size="small"
                sx={{ minWidth: { xs: 300, sm: 500, md: 800 } }}
              >
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>{pt('name')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{pt('role')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {pt('phone')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      {pt('actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {adminsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : (
                    admins.map((admin) => (
                      <TableRow key={admin.id} hover>
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                          >
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: 'primary.light',
                              }}
                            >
                              {admin.name.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" fontWeight={600}>
                              {admin.name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={admin.role.toUpperCase()}
                            size="small"
                            color={
                              admin.role === 'superadmin' ? 'error' : 'primary'
                            }
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{admin.phone || '-'}</TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                          >
                            <IconButton
                              size="small"
                              onClick={() => {
                                blurActiveElement();
                                setCurrentAdmin(admin);
                                const normalizedPair = normalizeCoordinatePair(
                                  admin.latitude,
                                  admin.longitude
                                );
                                setAdminForm({
                                  ...normalizeAdminForm(admin),
                                  latitude:
                                    normalizedPair?.latitude ??
                                    admin.latitude ??
                                    '',
                                  longitude:
                                    normalizedPair?.longitude ??
                                    admin.longitude ??
                                    '',
                                });
                                setShowAdminPassword(false);
                                setShowCurrentAdminPassword(false);
                                setAdminDialogOpen(true);
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteAdmin(admin.id)}
                              disabled={admin.id === user.id}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        );
      case 4:
        return (
          <Stack spacing={3}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h4" fontWeight={800}>
                {pt('deletedData')}
              </Typography>
              {checked.size > 0 && (
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<Refresh />}
                    onClick={handleBulkRestore}
                  >
                    {pt('restore')} ({checked.size})
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteForever />}
                    onClick={handleBulkHardDelete}
                  >
                    {pt('hardDelete')} ({checked.size})
                  </Button>
                </Stack>
              )}
            </Box>
            <TableContainer
              component={GlassPaper}
              sx={{ mt: 2, overflow: 'auto' }}
            >
              <Table
                size="small"
                sx={{ minWidth: { xs: 300, sm: 500, md: 700, lg: 1000 } }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 40 }}>
                      <Checkbox
                        size="small"
                        indeterminate={
                          checked.size > 0 && checked.size < deletedData.length
                        }
                        checked={
                          deletedData.length > 0 &&
                          deletedData.every((r) =>
                            checked.has(getDeletedRowKey(r))
                          )
                        }
                        onChange={() => toggleAll(deletedData)}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>ID Kod</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {pt('patient')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {pt('deletedBy')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {pt('deletedAt')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      {pt('actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deletedLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : deletedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        {pt('empty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    deletedData.map((item) => (
                      <TableRow
                        key={getDeletedRowKey(item)}
                        hover
                        onClick={() => toggleOne(getDeletedRowKey(item))}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: checked.has(getDeletedRowKey(item))
                            ? 'rgba(15,118,110,0.08)'
                            : 'inherit',
                        }}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            size="small"
                            checked={checked.has(getDeletedRowKey(item))}
                            onChange={() => toggleOne(getDeletedRowKey(item))}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                          {getDeletedRowCode(item)}
                        </TableCell>
                        <TableCell>{getDeletedRowPatientName(item)}</TableCell>
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Avatar
                              sx={{
                                width: 24,
                                height: 24,
                                fontSize: 10,
                                bgcolor: 'error.main',
                              }}
                            >
                              {getDeletedByName(item).charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="caption" fontWeight={600}>
                              {getDeletedByName(item)}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{getDeletedDate(item)}</TableCell>
                        <TableCell
                          align="right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                          >
                            <Tooltip title={pt('detailsTitle')}>
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => {
                                  blurActiveElement();
                                  setViewRow(item);
                                }}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={pt('restore')}>
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleRestoreAnalysis(item)}
                              >
                                <Refresh />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={pt('hardDelete')}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleHardDeleteAnalysis(item)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h5" fontWeight={700} sx={{ mt: 4, mb: 2 }}>
              {pt('deletedAdminsResearchers')}
            </Typography>
            <TableContainer
              component={GlassPaper}
              sx={{ mt: 2, overflow: 'auto' }}
            >
              <Table
                size="small"
                sx={{ minWidth: { xs: 300, sm: 500, md: 800 } }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>{pt('name')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{pt('role')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {pt('deletedAt')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      {pt('actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deletedLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : deletedAdmins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                        {pt('empty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    deletedAdmins.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                          >
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: 'warning.light',
                              }}
                            >
                              {item.name.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" fontWeight={600}>
                              {item.name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{item.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.role.toUpperCase()}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {item.deleted_at
                            ? new Date(item.deleted_at).toLocaleString()
                            : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title={pt('restore')}>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleRestoreAdmin(item.id)}
                            >
                              <Refresh />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        );
      case 5:
        return (
          <Stack spacing={3}>
            <Typography variant="h4" fontWeight={800}>
              {pt('security')}
            </Typography>
            <GlassPaper
              sx={{ p: { xs: 2, md: 4 }, maxWidth: 600, width: '100%' }}
            >
              <Typography variant="h6" gutterBottom>
                {pt('changePassword')}
              </Typography>
              <TextField
                fullWidth
                label={pt('currentPassword')}
                type="password"
                margin="normal"
              />
              <TextField
                fullWidth
                label={pt('newPassword')}
                type="password"
                margin="normal"
              />
              <TextField
                fullWidth
                label={pt('confirmNewPassword')}
                type="password"
                margin="normal"
              />
              <Button
                variant="contained"
                sx={{
                  mt: 3,
                  borderRadius: 2,
                  width: { xs: '100%', sm: 'auto' },
                }}
              >
                {pt('update')}
              </Button>
            </GlassPaper>
          </Stack>
        );
      case 6: {
        const AUDIT_TRANSLATIONS = {
          uz: {
            description: 'Tizimdagi barcha amallar va hodisalar xavfsizlik jurnali',
            export: 'Eksport',
            totalEvents: 'Jami hodisalar',
            activeOperators: 'Faol operatorlar',
            securityEvents: 'Xavfsizlik',
            frequentAction: 'Koʻp amal',
            searchPlaceholder: 'IP, obʼyekt yoki matn boʻyicha qidirish...',
            action: 'Harakat',
            operator: 'Operator',
            allOperators: 'Barcha operatorlar',
            object: 'Obʼyekt',
            resetFilters: 'Filtrni tozalash',
            noEvents: 'Hech qanday hodisa topilmadi',
            rowsPerPage: 'Qatarlar soni:',
            eventDetails: 'Hodisa tafsilotlari',
            systemTime: 'Tizim vaqti:',
            performedAction: 'Bajarilgan amal:',
            systemObject: 'Tizim obʼyekti:',
            operatorInfo: 'Operator maʼlumotlari',
            ipAddress: 'IP Manzil:',
            detailsTitle: 'Tafsilotlar',
            formattedData: 'FORMATLANGAN MAʼLUMOT',
            rawJson: 'ASL JSON MAʼLUMOTI',
            noDataExport: 'Eksport qilish uchun maʼlumot yoʻq',
            exportSuccess: 'Eksport muvaffaqiyatli bajarildi',
            copied: 'Nusxalandi',
            detailsCol: 'Batafsil',
          },
          ru: {
            description: 'Журнал безопасности всех действий и событий в системе',
            export: 'Экспорт',
            totalEvents: 'Всего событий',
            activeOperators: 'Активные операторы',
            securityEvents: 'Безопасность',
            frequentAction: 'Частое действие',
            searchPlaceholder: 'Поиск по IP, объекту или тексту...',
            action: 'Действие',
            operator: 'Оператор',
            allOperators: 'Все операторы',
            object: 'Объект',
            resetFilters: 'Сбросить фильтры',
            noEvents: 'Событий не найдено',
            rowsPerPage: 'Строк на странице:',
            eventDetails: 'Детали события',
            systemTime: 'Системное время:',
            performedAction: 'Выполненное действие:',
            systemObject: 'Объект системы:',
            operatorInfo: 'Информация об операторе',
            ipAddress: 'IP-адрес:',
            detailsTitle: 'Детали',
            formattedData: 'ФОРМАТИРОВАННЫЕ ДАННЫЕ',
            rawJson: 'ИСХОДНЫЕ ДАННЫЕ JSON',
            noDataExport: 'Нет данных для экспорта',
            exportSuccess: 'Экспорт успешно выполнен',
            copied: 'Скопировано',
            detailsCol: 'Подробнее',
          },
          en: {
            description: 'Security log of all actions and events in the system',
            export: 'Export',
            totalEvents: 'Total Events',
            activeOperators: 'Active Operators',
            securityEvents: 'Security',
            frequentAction: 'Frequent Action',
            searchPlaceholder: 'Search by IP, object or text...',
            action: 'Action',
            operator: 'Operator',
            allOperators: 'All Operators',
            object: 'Object',
            resetFilters: 'Reset Filters',
            noEvents: 'No events found',
            rowsPerPage: 'Rows per page:',
            eventDetails: 'Event Details',
            systemTime: 'System Time:',
            performedAction: 'Performed Action:',
            systemObject: 'System Object:',
            operatorInfo: 'Operator Information',
            ipAddress: 'IP Address:',
            detailsTitle: 'Details',
            formattedData: 'FORMATTED DATA',
            rawJson: 'RAW JSON DATA',
            noDataExport: 'No data to export',
            exportSuccess: 'Export completed successfully',
            copied: 'Copied',
            detailsCol: 'Details',
          },
          tr: {
            description: 'Sistemdeki tüm eylemlerin ve olayların güvenlik günlüğü',
            export: 'Dışa Aktar',
            totalEvents: 'Toplam Olay',
            activeOperators: 'Aktif Operatörler',
            securityEvents: 'Güvenlik',
            frequentAction: 'Sık Yapılan Eylem',
            searchPlaceholder: 'IP, nesne veya metne göre ara...',
            action: 'Eylem',
            operator: 'Operatör',
            allOperators: 'Tüm Operatörler',
            object: 'Nesne',
            resetFilters: 'Filtreleri Temizle',
            noEvents: 'Olay bulunamadı',
            rowsPerPage: 'Sayfa başına satır:',
            eventDetails: 'Olay Detayları',
            systemTime: 'Sistem Zamanı:',
            performedAction: 'Gerçekleştirilen Eylem:',
            systemObject: 'Sistem Nesnesi:',
            operatorInfo: 'Operatör Bilgileri',
            ipAddress: 'IP Adresi:',
            detailsTitle: 'Detaylar',
            formattedData: 'BİÇİMLENDİRİLMİŞ VERİ',
            rawJson: 'HAM JSON VERİSİ',
            noDataExport: 'Dışa aktarılacak veri yok',
            exportSuccess: 'Dışa aktarma başarıyla tamamlandı',
            copied: 'Kopyalandı',
            detailsCol: 'Detaylar',
          },
          tm: {
            description: 'Ulgamdaky ähli hereketleriň we wakalaryň howpsuzlyk žurnaly',
            export: 'Eksport',
            totalEvents: 'Jami wakalar',
            activeOperators: 'Aktiw operatorlar',
            securityEvents: 'Howpsuzlyk',
            frequentAction: 'Köp ýerine ýetirilýän hereket',
            searchPlaceholder: 'IP, obýekt ýa-da tekst boýunça gözleg...',
            action: 'Hereket',
            operator: 'Operator',
            allOperators: 'Ähli operatorlar',
            object: 'Obýekt',
            resetFilters: 'Süzgüji arassala',
            noEvents: 'Waka tapylmady',
            rowsPerPage: 'Setirleriň sany:',
            eventDetails: 'Waka jikme-jikleri',
            systemTime: 'Ulgam wagty:',
            performedAction: 'Ýerine ýetirilen hereket:',
            systemObject: 'Ulgam obýekti:',
            operatorInfo: 'Operator maglumatlary',
            ipAddress: 'IP salgysy:',
            detailsTitle: 'Jikme-jiklikler',
            formattedData: 'FORMATLANAN MAGLUMAT',
            rawJson: 'ASYL JSON MAGLUMATY',
            noDataExport: 'Eksport etmek üçin maglumat ýok',
            exportSuccess: 'Eksport üstünlikli tamamlandy',
            copied: 'Nusgalandy',
            detailsCol: 'Jikme-jik',
          },
          tg: {
            description: 'Журнали амниятӣ барои ҳамаи амалҳо ва рӯйдодҳо дар система',
            export: 'Экспорт',
            totalEvents: 'Ҳамаи рӯйдодҳо',
            activeOperators: 'Операторони фаъол',
            securityEvents: 'Амният',
            frequentAction: 'Амали бештар иҷрошуда',
            searchPlaceholder: 'Ҷустуҷӯ аз рӯи IP, объект ё матн...',
            action: 'Амал',
            operator: 'Оператор',
            allOperators: 'Ҳамаи операторон',
            object: 'Объект',
            resetFilters: 'Тоза кардани филтрҳо',
            noEvents: 'Рӯйдодҳо ёфт нашуданд',
            rowsPerPage: 'Шумораи сатрҳо:',
            eventDetails: 'Тафсилоти рӯйдод',
            systemTime: 'Вақти система:',
            performedAction: 'Амали иҷрошуда:',
            systemObject: 'Объекти система:',
            operatorInfo: 'Маълумоти оператор',
            ipAddress: 'Суроғаи IP:',
            detailsTitle: 'Тафсилот',
            formattedData: 'МАЪЛУМОТИ ФОРМАТШУДА',
            rawJson: 'МАЪЛУМОТИ АСЛИИ JSON',
            noDataExport: 'Маълумот барои экспорт мавҷуд нест',
            exportSuccess: 'Экспорт бомуваффақият иҷро шуд',
            copied: 'Нусхабардорӣ шуд',
            detailsCol: 'Тафсилот',
          },
          kz: {
            description: 'Жүйедегі барлық әрекеттер мен оқиғалардың қауіпсіздік журналы',
            export: 'Экспорт',
            totalEvents: 'Барлық оқиғалар',
            activeOperators: 'Белсенді операторлар',
            securityEvents: 'Қауіпсіздік',
            frequentAction: 'Жиі жасалатын әрекет',
            searchPlaceholder: 'IP, объект немесе мәтін бойынша іздеу...',
            action: 'Әрекет',
            operator: 'Оператор',
            allOperators: 'Барлық операторлар',
            object: 'Объект',
            resetFilters: 'Сүзгіні тазалау',
            noEvents: 'Оқиғалар табылмады',
            rowsPerPage: 'Жолдар саны:',
            eventDetails: 'Оқиға егжей-тегжейі',
            systemTime: 'Жүйе уақыты:',
            performedAction: 'Орындалған әрекет:',
            systemObject: 'Жүйе объектісі:',
            operatorInfo: 'Оператор мәліметтері',
            ipAddress: 'IP мекенжайы:',
            detailsTitle: 'Толық мәліметтер',
            formattedData: 'ПІШІМДЕЛГЕН МӘЛІМЕТТЕР',
            rawJson: 'БАСТАПҚЫ JSON МӘЛІМЕТІ',
            noDataExport: 'Экспорттау үшін мәлімет жоқ',
            exportSuccess: 'Экспорт сәтті аяқталды',
            copied: 'Көшірілді',
            detailsCol: 'Толығырақ',
          },
          ky: {
            description: 'Системадагы бардык аракеттердин жана окуялардын коопсуздук журналы',
            export: 'Экспорт',
            totalEvents: 'Бардык окуялар',
            activeOperators: 'Активдүү операторлор',
            securityEvents: 'Коопсуздук',
            frequentAction: 'Көп аткарылган аракет',
            searchPlaceholder: 'IP, объект же текст боюнча издөө...',
            action: 'Аракет',
            operator: 'Operator',
            allOperators: 'Бардык операторлор',
            object: 'Объект',
            resetFilters: 'Чыпканы тазалоо',
            noEvents: 'Окуялар табылган жок',
            rowsPerPage: 'Саптардын саны:',
            eventDetails: 'Окуянын чоо-жайы',
            systemTime: 'Система убактысы:',
            performedAction: 'Аткарылган аракет:',
            systemObject: 'Система объектиси:',
            operatorInfo: 'Оператордун маалыматы',
            ipAddress: 'IP дареги:',
            detailsTitle: 'Чоо-жайы',
            formattedData: 'ФОРМАТТАЛГАН МААЛЫМАТ',
            rawJson: 'БАСТАПКЫ JSON МААЛЫМАТЫ',
            noDataExport: 'Экспорттоо үчүн маалымат жок',
            exportSuccess: 'Экспорт ийгиликтүү аяктады',
            copied: 'Көчүрүлдү',
            detailsCol: 'Чоо-жайы',
          }
        };

        const t = (key) => {
          const langKey = AUDIT_TRANSLATIONS[lang] ? lang : 'en';
          return AUDIT_TRANSLATIONS[langKey][key] || AUDIT_TRANSLATIONS['en'][key] || key;
        };

        const getAuditStats = () => {
          const total = auditTotal;
          const uniqueUsers = new Set(auditLogs.map(log => log.user_id).filter(Boolean)).size;
          const securityEvents = auditLogs.filter(log => ['LOGIN', 'DELETE', 'CLEAR'].includes(log.action)).length;
          
          const actionCounts = {};
          auditLogs.forEach(log => {
            actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
          });
          let mostFrequentAction = '-';
          let maxCount = 0;
          Object.entries(actionCounts).forEach(([action, count]) => {
            if (count > maxCount) {
              maxCount = count;
              mostFrequentAction = action;
            }
          });

          return { total, uniqueUsers, securityEvents, mostFrequentAction };
        };

        const auditStats = getAuditStats();

        const getActionChipProps = (action) => {
          switch (action) {
            case 'CREATE':
              return {
                sx: {
                  background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(76, 175, 80, 0.15) 100%)',
                  color: '#2e7d32',
                  border: '1px solid rgba(76, 175, 80, 0.25)',
                  fontWeight: 600,
                  borderRadius: '6px',
                }
              };
            case 'UPDATE':
              return {
                sx: {
                  background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.08) 0%, rgba(255, 152, 0, 0.15) 100%)',
                  color: '#b26a00',
                  border: '1px solid rgba(255, 152, 0, 0.25)',
                  fontWeight: 600,
                  borderRadius: '6px',
                }
              };
            case 'DELETE':
            case 'CLEAR':
              return {
                sx: {
                  background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.08) 0%, rgba(244, 67, 54, 0.15) 100%)',
                  color: '#d32f2f',
                  border: '1px solid rgba(244, 67, 54, 0.25)',
                  fontWeight: 600,
                  borderRadius: '6px',
                }
              };
            case 'LOGIN':
              return {
                sx: {
                  background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(33, 150, 243, 0.15) 100%)',
                  color: '#1565c0',
                  border: '1px solid rgba(33, 150, 243, 0.25)',
                  fontWeight: 600,
                  borderRadius: '6px',
                }
              };
            case 'RESTORE':
              return {
                sx: {
                  background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.08) 0%, rgba(156, 39, 176, 0.15) 100%)',
                  color: '#7b1fa2',
                  border: '1px solid rgba(156, 39, 176, 0.25)',
                  fontWeight: 600,
                  borderRadius: '6px',
                }
              };
            default:
              return {
                sx: {
                  background: 'linear-gradient(135deg, rgba(158, 158, 158, 0.08) 0%, rgba(158, 158, 158, 0.15) 100%)',
                  color: '#616161',
                  border: '1px solid rgba(158, 158, 158, 0.25)',
                  fontWeight: 600,
                  borderRadius: '6px',
                }
              };
          }
        };

        const handleExportCSV = () => {
          if (!auditLogs.length) {
            toast.error(t('noDataExport'));
            return;
          }
          
          const headers = [t('time'), t('operator'), 'Email', t('action'), t('object'), 'ID', t('detailsTitle'), 'IP'];
          
          const rows = auditLogs.map(log => [
            new Date(log.created_at).toLocaleString(),
            log.user_name || 'System',
            log.user_email || '-',
            log.action,
            log.target_type || '-',
            log.target_id || '-',
            log.details || '',
            log.ip_address || '-'
          ]);
          
          const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
            + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
            
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success(t('exportSuccess'));
        };

        return (
          <Stack spacing={3}>
            {/* Title & Action buttons */}
            <Box
              display="flex"
              flexDirection={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              gap={2}
            >
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -0.5 }}>
                  {pt('auditLog')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {t('description')}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1.5} width={{ xs: '100%', sm: 'auto' }}>
                <Button
                  startIcon={<GetApp />}
                  variant="outlined"
                  onClick={handleExportCSV}
                  sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600 }}
                  fullWidth={{ xs: true, sm: false }}
                >
                  {t('export')}
                </Button>
                <Button
                  startIcon={<Delete />}
                  color="error"
                  variant="contained"
                  onClick={handleClearAudit}
                  sx={{
                    borderRadius: 2.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(244, 67, 54, 0.2)',
                    '&:hover': {
                      boxShadow: '0 6px 16px rgba(244, 67, 54, 0.3)',
                    }
                  }}
                  fullWidth={{ xs: true, sm: false }}
                >
                  {pt('clear')}
                </Button>
              </Stack>
            </Box>

            {/* Overview Stats Cards */}
            <Grid container spacing={2}>
              {[
                {
                  title: t('totalEvents'),
                  value: auditTotal,
                  icon: <History sx={{ fontSize: 20 }} />,
                  gradient: 'linear-gradient(135deg, rgba(33, 150, 243, 0.03) 0%, rgba(33, 150, 243, 0.07) 100%)',
                  border: '1px solid rgba(33, 150, 243, 0.12)',
                  color: '#2196f3'
                },
                {
                  title: t('activeOperators'),
                  value: auditStats.uniqueUsers,
                  icon: <People sx={{ fontSize: 20 }} />,
                  gradient: 'linear-gradient(135deg, rgba(76, 175, 80, 0.03) 0%, rgba(76, 175, 80, 0.07) 100%)',
                  border: '1px solid rgba(76, 175, 80, 0.12)',
                  color: '#4caf50'
                },
                {
                  title: t('securityEvents'),
                  value: auditStats.securityEvents,
                  icon: <Security sx={{ fontSize: 20 }} />,
                  gradient: 'linear-gradient(135deg, rgba(244, 67, 54, 0.03) 0%, rgba(244, 67, 54, 0.07) 100%)',
                  border: '1px solid rgba(244, 67, 54, 0.12)',
                  color: '#f44336'
                },
                {
                  title: t('frequentAction'),
                  value: formatAuditAction(auditStats.mostFrequentAction, lang),
                  icon: <AutoGraph sx={{ fontSize: 20 }} />,
                  gradient: 'linear-gradient(135deg, rgba(156, 39, 176, 0.03) 0%, rgba(156, 39, 176, 0.07) 100%)',
                  border: '1px solid rgba(156, 39, 176, 0.12)',
                  color: '#9c27b0'
                }
              ].map((card, i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        background: card.gradient,
                        border: card.border,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        width: '100%',
                        boxSizing: 'border-box',
                        backdropFilter: 'blur(20px)',
                      }}
                    >
                      <Box sx={{
                        p: 1.25,
                        borderRadius: '8px',
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
                        display: 'flex',
                        color: card.color,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        flexShrink: 0
                      }}>
                        {card.icon}
                      </Box>
                      <Box minWidth={0} sx={{ flexGrow: 1 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>
                          {card.title}
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ color: card.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mt: 0.25 }}>
                          {card.value}
                        </Typography>
                      </Box>
                    </Paper>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {/* Advanced Filters Panel - Two Rows for better spacing */}
            {/* Advanced Filters Panel - Structured with Boxes to prevent squeezing */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '12px',
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(30, 30, 40, 0.65)'
                    : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid',
                borderColor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
              }}
            >
              {/* Row 1: Search */}
              <Box width="100%">
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t('searchPlaceholder')}
                  value={auditSearch}
                  onChange={(e) => { setAuditSearch(e.target.value); setAuditPage(1); }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: auditSearch && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => { setAuditSearch(''); setAuditPage(1); }}>
                          <Clear sx={{ fontSize: 16 }} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Box>

              {/* Row 2: Select Filters */}
              <Box
                display="flex"
                flexDirection={{ xs: 'column', md: 'row' }}
                gap={2}
                alignItems="center"
                width="100%"
              >
                <FormControl size="small" sx={{ flex: 1, minWidth: 120, width: '100%' }}>
                  <InputLabel>{t('action')}</InputLabel>
                  <Select
                    value={auditActionFilter}
                    label={t('action')}
                    onChange={(e) => { setAuditActionFilter(e.target.value); setAuditPage(1); }}
                  >
                    <MenuItem value="ALL">{pt('all')}</MenuItem>
                    <MenuItem value="LOGIN">LOGIN</MenuItem>
                    <MenuItem value="CREATE">CREATE</MenuItem>
                    <MenuItem value="UPDATE">UPDATE</MenuItem>
                    <MenuItem value="DELETE">DELETE</MenuItem>
                    <MenuItem value="RESTORE">RESTORE</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ flex: 1.2, minWidth: 160, width: '100%' }}>
                  <InputLabel>{t('operator')}</InputLabel>
                  <Select
                    value={auditUserFilter}
                    label={t('operator')}
                    onChange={(e) => { setAuditUserFilter(e.target.value); setAuditPage(1); }}
                  >
                    <MenuItem value="">{t('allOperators')}</MenuItem>
                    {admins.map(u => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.name || u.email}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ flex: 1, minWidth: 120, width: '100%' }}>
                  <InputLabel>{t('object')}</InputLabel>
                  <Select
                    value={auditTargetFilter}
                    label={t('object')}
                    onChange={(e) => { setAuditTargetFilter(e.target.value); setAuditPage(1); }}
                  >
                    <MenuItem value="ALL">{pt('all')}</MenuItem>
                    <MenuItem value="User">User</MenuItem>
                    <MenuItem value="PatientAnalysis">PatientAnalysis</MenuItem>
                    <MenuItem value="Payment">Payment</MenuItem>
                    <MenuItem value="Backup">Backup</MenuItem>
                    <MenuItem value="ClinicalData">ClinicalData</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="outlined"
                  onClick={() => {
                    setAuditActionFilter('ALL');
                    setAuditUserFilter('');
                    setAuditTargetFilter('ALL');
                    setAuditSearch('');
                    setAuditPage(1);
                  }}
                  startIcon={<FilterList />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    height: 40,
                    whiteSpace: 'nowrap',
                    px: 3,
                    width: { xs: '100%', md: 'auto' }
                  }}
                >
                  {t('resetFilters')}
                </Button>
              </Box>
            </Paper>

            {/* Table */}
            <TableContainer
              component={GlassPaper}
              sx={{ overflow: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
            >
              <Table
                size="medium"
                sx={{ minWidth: { xs: 300, sm: 500, md: 700, lg: 850 } }}
              >
                <TableHead sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: '180px' }}>{pt('time')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('operator')}</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '120px' }}>{pt('action')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{pt('object')}</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '150px' }}>{t('ipAddress').replace(':', '')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, width: '100px' }}>{t('detailsCol')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 12 }}>
                        <CircularProgress size={40} thickness={4} />
                      </TableCell>
                    </TableRow>
                  ) : auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                        {t('noEvents')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    <AnimatePresence>
                      {auditLogs.map((log, index) => (
                        <TableRow
                          key={log.id}
                          hover
                          component={motion.tr}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03) !important' : 'rgba(0,0,0,0.01) !important',
                            }
                          }}
                          onClick={() => { setSelectedAuditLog(log); setIsAuditDrawerOpen(true); }}
                        >
                          <TableCell sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.9rem', fontWeight: 600 }}>
                                {log.user_name ? log.user_name.charAt(0).toUpperCase() : 'S'}
                              </Avatar>
                              <Box minWidth={0}>
                                <Typography variant="body2" fontWeight={700} noWrap>
                                  {log.user_name || 'System'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap display="block">
                                  {log.user_email || 'system@morphocheck.uz'}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={formatAuditAction(log.action, lang)}
                              size="small"
                              {...getActionChipProps(log.action)}
                            />
                          </TableCell>
                          <TableCell sx={{ wordBreak: 'break-word' }}>
                            <Stack spacing={0.5}>
                              {log.target_type && (
                                <Typography
                                  variant="caption"
                                  color="primary"
                                  fontWeight={600}
                                >
                                  {formatAuditTarget(log.target_type, lang)}
                                  {log.target_id ? ` #${log.target_id}` : ''}
                                </Typography>
                              )}
                              <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 280, textOverflow: 'ellipsis' }}>
                                {formatAuditDetails(log.details, lang)}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                              <Public sx={{ fontSize: 16 }} />
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {log.ip_address || '127.0.0.1'}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => { setSelectedAuditLog(log); setIsAuditDrawerOpen(true); }}
                            >
                              <ChevronRight />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </AnimatePresence>
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={auditTotal}
                rowsPerPage={auditPageSize}
                page={auditPage - 1}
                onPageChange={(e, newPage) => setAuditPage(newPage + 1)}
                onRowsPerPageChange={(e) => {
                  setAuditPageSize(parseInt(e.target.value, 10));
                  setAuditPage(1);
                }}
                labelRowsPerPage={t('rowsPerPage')}
              />
            </TableContainer>

            {/* Details Drawer */}
            <Drawer
              anchor="right"
              open={isAuditDrawerOpen}
              onClose={() => setIsAuditDrawerOpen(false)}
              sx={{ zIndex: 1500 }}
              PaperProps={{
                sx: {
                  width: { xs: '100%', sm: 460, md: 520 },
                  p: 3,
                  background: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 30, 40, 0.95)' : 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
                  borderLeft: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`
                }
              }}
            >
              {selectedAuditLog && (
                <Stack spacing={3} sx={{ height: '100%' }}>
                  {/* Drawer Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight={800} display="flex" alignItems="center" gap={1}>
                      <Info color="primary" /> {t('eventDetails')}
                    </Typography>
                    <IconButton onClick={() => setIsAuditDrawerOpen(false)}>
                      <Close />
                    </IconButton>
                  </Box>

                  <Divider />

                  {/* Event Meta */}
                  <Stack spacing={1.5}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">{t('systemTime')}</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {new Date(selectedAuditLog.created_at).toLocaleString()}
                      </Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">{t('performedAction')}</Typography>
                      <Chip
                        label={formatAuditAction(selectedAuditLog.action, lang)}
                        size="small"
                        {...getActionChipProps(selectedAuditLog.action)}
                      />
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">{t('systemObject')}</Typography>
                      <Typography variant="body2" fontWeight={700} color="primary">
                        {formatAuditTarget(selectedAuditLog.target_type, lang)} {selectedAuditLog.target_id ? `#${selectedAuditLog.target_id}` : ''}
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider />

                  {/* Operator Info */}
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {t('operatorInfo')}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                        {selectedAuditLog.user_name ? selectedAuditLog.user_name.charAt(0).toUpperCase() : 'S'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {selectedAuditLog.user_name || 'System'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {selectedAuditLog.user_email || 'system@morphocheck.uz'}
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                      <Public sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {t('ipAddress')} <span style={{ fontWeight: 600, fontFamily: 'monospace', color: (theme) => theme.palette.text.primary }}>{selectedAuditLog.ip_address || '127.0.0.1'}</span>
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider />

                  {/* Event Details Content */}
                  <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {t('detailsTitle')}
                      </Typography>
                      <Tooltip title={t('copied')}>
                        <IconButton size="small" onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(selectedAuditLog, null, 2));
                          toast.success(t('copied'));
                        }}>
                          <ContentCopy sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {/* Formatted View */}
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} gutterBottom display="block">
                        {t('formattedData')}
                      </Typography>
                      <Paper
                        variant="outlined"
                        sx={{ p: 1.5, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)', borderRadius: 2 }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                          {formatAuditDetails(selectedAuditLog.details, lang)}
                        </Typography>
                      </Paper>
                    </Box>

                    {/* Raw JSON - Only show if details is actually a JSON object/array */}
                    {(() => {
                      try {
                        const parsed = JSON.parse(selectedAuditLog.details);
                        if (parsed && typeof parsed === 'object') {
                          return (
                            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 150 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={700} gutterBottom display="block">
                                {t('rawJson')}
                              </Typography>
                              <Paper
                                variant="outlined"
                                sx={{
                                  p: 1.5,
                                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                                  fontFamily: 'monospace',
                                  fontSize: '0.8rem',
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-all',
                                  overflow: 'auto',
                                  borderRadius: 2,
                                  flexGrow: 1,
                                  maxHeight: '240px'
                                }}
                              >
                                {JSON.stringify(parsed, null, 2)}
                              </Paper>
                            </Box>
                          );
                        }
                      } catch (e) {
                        // Not a JSON, do not render raw box
                      }
                      return null;
                    })()}
                  </Box>
                </Stack>
              )}
            </Drawer>
          </Stack>
        );
      }
      case 7:
        return (
          <Stack spacing={3}>
            <Box
              display="flex"
              flexDirection={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              gap={2}
            >
              <Typography variant="h4" fontWeight={800}>
                {pt('backupsTitle')}
              </Typography>
              <Button
                startIcon={<CloudUpload />}
                variant="contained"
                onClick={handleCreateBackup}
                disabled={backupLoading}
              >
                {pt('createBackup')}
              </Button>
            </Box>
            <TableContainer
              component={GlassPaper}
              sx={{ mt: 2, overflow: 'auto' }}
            >
              <Table
                size="small"
                sx={{ minWidth: { xs: 300, sm: 500, md: 700 } }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>
                      {pt('filename')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{pt('size')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{pt('time')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">
                      {pt('actions')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {backupLoading && backups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : (
                    Array.isArray(backups) &&
                    backups.map((b) => (
                      <TableRow key={b.filename} hover>
                        <TableCell fontWeight="bold">{b.filename}</TableCell>
                        <TableCell>
                          {(
                            (b.size_bytes || b.size || 0) /
                            1024 /
                            1024
                          ).toFixed(2)}{' '}
                          MB
                        </TableCell>
                        <TableCell>
                          {new Date(b.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                          >
                            <Tooltip title={pt('restore')}>
                              <IconButton
                                color="primary"
                                onClick={() => handleRestoreBackup(b.filename)}
                              >
                                <Refresh />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={pt('delete')}>
                              <IconButton
                                color="error"
                                onClick={() => handleDeleteBackup(b.filename)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        );
      case 8:
        return <ClinicalCMS />;
      case 9:
        return <AdminActivity />;
      case 10:
        return <RoleSettingsCMS />;
      default:
        return null;
    }
  };

  const isDark = theme.palette.mode === 'dark';
  const adminReportRows = getAdminReportRows();
  const adminReportSummary = {
    total: admins.length,
    admins: admins.filter((item) => item.role === 'admin').length,
    researchers: admins.filter((item) => item.role === 'researcher').length,
    superadmins: admins.filter((item) => item.role === 'superadmin').length,
  };

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        minHeight: activeTab === 2 ? 'calc(100dvh - 80px)' : '100vh',
        pb: activeTab === 2 ? 0 : 10,
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          py: { xs: 2, md: 4 },
          pr: { xs: 1.5, sm: 2, md: 4 },
          pl: { xs: 1.5, sm: 2, md: '324px' },
          maxWidth: '100%',
        }}
      >
        <Stack direction="column" spacing={3} alignItems="stretch">
          {/* Sidebar Tabs */}
          <Box
            sx={{
              width: { xs: '100%', md: 276 },
              minWidth: { md: 276 },
              maxWidth: { md: 276 },
              flexShrink: 0,
              position: { md: 'fixed' },
              top: { md: 88 },
              left: { md: 24 },
              zIndex: { md: 10 },
              height: { md: 'calc(100vh - 104px)' },
            }}
          >
            <GlassPaper
              sx={{
                p: { xs: 1, sm: 1.35, md: 1.5 },
                display: { md: 'flex' },
                flexDirection: { md: 'column' },
                height: { md: '100%' },
                overflow: { xs: 'hidden', md: 'hidden' },
                border: '1px solid',
                borderColor: isDark
                  ? 'rgba(255,255,255,0.10)'
                  : 'rgba(100,116,139,0.12)',
                boxShadow: isDark
                  ? '0 18px 48px rgba(0,0,0,0.34)'
                  : '0 18px 48px rgba(100,116,139,0.09)',
              }}
            >
              <Box
                sx={{
                  p: { xs: 1, md: 1.2 },
                  mb: { xs: 1, md: 1.1 },
                  textAlign: { xs: 'left', md: 'center' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: { xs: 'flex-start', md: 'center' },
                  gap: { xs: 1.25, md: 0 },
                  flexDirection: { xs: 'row', md: 'column' },
                }}
              >
                <Avatar
                  sx={{
                    width: { xs: 44, md: 54 },
                    height: { xs: 44, md: 54 },
                    margin: { xs: 0, md: '0 auto 12px' },
                    bgcolor: 'primary.main',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    fontSize: { xs: '0.9rem', md: '1.08rem' },
                  }}
                >
                  SA
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    noWrap
                    sx={{ fontSize: { xs: '0.98rem', md: '1.08rem' } }}
                  >
                    {user.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    sx={{ display: 'block' }}
                  >
                    {pt('adminManagement')}
                  </Typography>
                </Box>
              </Box>

              <Tabs
                orientation={isMobile ? 'horizontal' : 'vertical'}
                variant={isMobile ? 'scrollable' : 'standard'}
                scrollButtons={isMobile ? 'auto' : false}
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                sx={{
                  flex: { md: '1 1 auto' },
                  minHeight: { md: 0 },
                  overflow: { md: 'hidden' },
                  '& .MuiTabs-scroller': {
                    overflowY: { md: 'hidden !important' },
                    overflowX: { xs: 'auto', md: 'hidden' },
                    pr: { md: 0 },
                    '&::-webkit-scrollbar': {
                      display: 'none',
                    },
                    scrollbarWidth: 'none',
                  },
                  '& .MuiTabs-flexContainer': {
                    gap: { xs: 0.75, md: 0 },
                  },
                  '& .MuiTabs-indicator': { display: 'none' },
                  '& .MuiTab-root': {
                    position: 'relative',
                    overflow: 'hidden',
                    isolation: 'isolate',
                    borderRadius: 999,
                    mb: { xs: 0, md: 0.65 },
                    mr: { xs: 0, md: 0 },
                    minWidth: { xs: 'max-content', md: '100%' },
                    maxWidth: { xs: 'none', md: '100%' },
                    px: { xs: 1.35, sm: 1.7, md: 1.65 },
                    py: { xs: 0.82, sm: 1, md: 0.78 },
                    alignItems: 'center',
                    justifyContent: { xs: 'center', md: 'flex-start' },
                    textAlign: { xs: 'center', md: 'left' },
                    minHeight: { xs: 40, sm: 44, md: 40 },
                    textTransform: 'none',
                    fontWeight: 800,
                    fontSize: { xs: '0.76rem', sm: '0.82rem', md: '0.8rem' },
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
                      ? 'inset 0 1px 0 rgba(255,255,255,0.07), 0 6px 16px rgba(0,0,0,0.14)'
                      : 'inset 0 1px 0 rgba(255,255,255,0.62), 0 6px 16px rgba(15,23,42,0.05)',
                    backdropFilter: 'blur(14px) saturate(160%)',
                    WebkitBackdropFilter: 'blur(14px) saturate(160%)',
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
                      mr: { xs: 0.65, sm: 0.85, md: 0.95 },
                      fontSize: { xs: 18, sm: 19, md: 18 },
                      color: 'inherit',
                      filter: 'drop-shadow(0 2px 6px rgba(45, 212, 191, 0.14))',
                    },
                    '&.Mui-selected': {
                      color: '#ecfeff',
                      borderColor: isDark
                        ? 'rgba(94, 234, 212, 0.46)'
                        : 'rgba(20, 184, 166, 0.42)',
                      background:
                        'linear-gradient(135deg, rgba(20,184,166,0.95), rgba(37,99,235,0.88) 52%, rgba(139,92,246,0.88))',
                      boxShadow:
                        'inset 0 1px 0 rgba(255,255,255,0.38), 0 9px 22px rgba(20,184,166,0.18), 0 4px 14px rgba(37,99,235,0.14)',
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
                        ? 'inset 0 1px 0 rgba(255,255,255,0.10), 0 9px 20px rgba(0,0,0,0.20)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.70), 0 9px 20px rgba(15,23,42,0.08)',
                      '&::before': {
                        opacity: 0.75,
                      },
                    },
                  },
                }}
              >
                <Tab
                  icon={<Dashboard />}
                  iconPosition="start"
                  label={pt('dashboard')}
                />
                <Tab
                  icon={<AutoGraph />}
                  iconPosition="start"
                  label={pageLabels.scientificAnalysis}
                />
                <Tab
                  icon={<Place />}
                  iconPosition="start"
                  label={pt('regionalMap')}
                />
                <Tab
                  icon={<People />}
                  iconPosition="start"
                  label={pt('admins')}
                />
                <Tab
                  icon={<RestoreFromTrash />}
                  iconPosition="start"
                  label={pt('deleted')}
                />
                <Tab
                  icon={<Security />}
                  iconPosition="start"
                  label={pt('security')}
                />
                <Tab
                  icon={<History />}
                  iconPosition="start"
                  label={pt('auditLog')}
                />
                <Tab
                  icon={<Storage />}
                  iconPosition="start"
                  label={pt('backup')}
                />
                <Tab
                  icon={<SettingsSuggest />}
                  iconPosition="start"
                  label={pt('clinicalCms')}
                />
                <Tab
                  icon={<AutoGraph />}
                  iconPosition="start"
                  label={pt('topChart')}
                />
                <Tab
                  icon={<SettingsSuggest />}
                  iconPosition="start"
                  label={t('chatSettingsTitle')}
                />
              </Tabs>

              <Box
                mt="auto"
                pt={1.2}
                borderTop={
                  isDark
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid rgba(0,0,0,0.05)'
                }
              >
                <Button
                  fullWidth
                  color="error"
                  startIcon={<Logout />}
                  onClick={() => {
                    blurActiveElement();
                    setLogoutDialogOpen(true);
                  }}
                  sx={{
                    minHeight: 42,
                    borderRadius: 999,
                    justifyContent: 'flex-start',
                    px: 1.6,
                    fontSize: '0.8rem',
                  }}
                >
                  {pt('logout')}
                </Button>
              </Box>
            </GlassPaper>
          </Box>

          {/* Main Content Area */}
          <Box
            sx={{
              ...scrollableContentSx,
              width: '100%',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Box
                  sx={{
                    minWidth: {
                      xs: activeTab === 0 || activeTab === 1 ? 720 : 0,
                      md: 0,
                    },
                  }}
                >
                  {renderTabContent()}
                </Box>
              </motion.div>
            </AnimatePresence>
          </Box>
        </Stack>

        <Dialog
          open={adminDialogOpen}
          onClose={() => setAdminDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 800 }}>
            {currentAdmin ? pt('adminEdit') : pt('addAdmin')}
          </DialogTitle>
          <DialogContent>
            <Tabs
              value={adminDialogStep}
              onChange={(_, nextStep) => setAdminDialogStep(nextStep)}
              sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Tab label={apt('profile')} />
              <Tab label={apt('adminRights')} />
            </Tabs>
            {adminDialogStep === 0 && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label={pt('fullName')}
                  fullWidth
                  value={adminForm.name}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, name: e.target.value })
                  }
                />
                <TextField
                  label="Email"
                  fullWidth
                  value={adminForm.email}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, email: e.target.value })
                  }
                />

                {currentAdmin && (
                  <TextField
                    label="Joriy parol"
                    type={showCurrentAdminPassword ? 'text' : 'password'}
                    fullWidth
                    value={currentAdmin.plain_password || 'Parol mavjud emas'}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              setShowCurrentAdminPassword(
                                !showCurrentAdminPassword
                              )
                            }
                            edge="end"
                          >
                            {showCurrentAdminPassword ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}

                <TextField
                  label={
                    currentAdmin
                      ? `${pt('newPassword')} (${pt('optional')})`
                      : pt('password')
                  }
                  type={showAdminPassword ? 'text' : 'password'}
                  fullWidth
                  autoComplete="new-password"
                  value={adminForm.password}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, password: e.target.value })
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowAdminPassword(!showAdminPassword)
                          }
                          edge="end"
                        >
                          {showAdminPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label={pt('confirmPassword')}
                  type={showAdminPassword ? 'text' : 'password'}
                  fullWidth
                  autoComplete="new-password"
                  value={adminForm.confirmPassword}
                  onChange={(e) =>
                    setAdminForm({
                      ...adminForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  error={
                    adminForm.password !== adminForm.confirmPassword &&
                    adminForm.confirmPassword !== ''
                  }
                  helperText={
                    adminForm.password !== adminForm.confirmPassword &&
                    adminForm.confirmPassword !== ''
                      ? pt('passwordsNoMatch')
                      : ''
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowAdminPassword(!showAdminPassword)
                          }
                          edge="end"
                        >
                          {showAdminPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <FormControl fullWidth>
                  <InputLabel>{pt('role')}</InputLabel>
                  <Select
                    value={adminForm.role}
                    label={pt('role')}
                    onChange={(e) => {
                      const nextRole = e.target.value;
                      setAdminForm({
                        ...adminForm,
                        role: nextRole,
                        supervisor_id:
                          nextRole === 'field_assistant'
                            ? adminForm.supervisor_id
                            : '',
                      });
                    }}
                  >
                    <MenuItem value="admin">Administrator</MenuItem>
                    <MenuItem value="superadmin">Super Administrator</MenuItem>
                    <MenuItem value="researcher">{pt('researcher')}</MenuItem>
                    <MenuItem value="field_assistant">Field Assistant</MenuItem>
                  </Select>
                </FormControl>
                {adminForm.role === 'field_assistant' && (
                  <FormControl fullWidth sx={{ mt: 1 }}>
                    <InputLabel>Kurator (Admin / Izlanuvchi)</InputLabel>
                    <Select
                      value={adminForm.supervisor_id || ''}
                      label="Kurator (Admin / Izlanuvchi)"
                      onChange={(e) =>
                        setAdminForm({
                          ...adminForm,
                          supervisor_id: e.target.value,
                        })
                      }
                    >
                      <MenuItem value="">
                        <em>Tanlanmagan</em>
                      </MenuItem>
                      {admins
                        .filter(
                          (item) =>
                            (item.role === 'admin' ||
                              item.role === 'researcher') &&
                            !item.is_deleted
                        )
                        .map((c) => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.name} (
                            {c.role === 'admin' ? 'Admin' : pt('researcher')})
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                )}
                {adminForm.role === 'researcher' && (
                  <Stack spacing={2}>
                    <TextField
                      label={pt('researchTopic')}
                      fullWidth
                      multiline
                      minRows={2}
                      value={adminForm.research_topic || ''}
                      onChange={(e) =>
                        setAdminForm({
                          ...adminForm,
                          research_topic: e.target.value,
                        })
                      }
                    />
                    <TextField
                      label={pt('scientificSupervisor')}
                      fullWidth
                      value={adminForm.scientific_supervisor || ''}
                      onChange={(e) =>
                        setAdminForm({
                          ...adminForm,
                          scientific_supervisor: e.target.value,
                        })
                      }
                    />
                    <FormControl fullWidth>
                      <InputLabel>{pt('researchType')}</InputLabel>
                      <Select
                        value={adminForm.research_type || ''}
                        label={pt('researchType')}
                        onChange={(e) =>
                          setAdminForm({
                            ...adminForm,
                            research_type: e.target.value,
                          })
                        }
                      >
                        <MenuItem value="">{pt('notSelected')}</MenuItem>
                        {RESEARCH_TYPE_OPTIONS.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel>{pt('researchArea')}</InputLabel>
                      <Select
                        value={adminForm.research_area || ''}
                        label={pt('researchArea')}
                        onChange={(e) =>
                          setAdminForm({
                            ...adminForm,
                            research_area: e.target.value,
                          })
                        }
                      >
                        <MenuItem value="">{pt('notSelected')}</MenuItem>
                        {adminForm.research_area &&
                          !Object.keys(UZB_LOCATIONS).includes(
                            adminForm.research_area
                          ) && (
                            <MenuItem value={adminForm.research_area}>
                              {adminForm.research_area}
                            </MenuItem>
                          )}
                        {Object.keys(UZB_LOCATIONS).map((region) => (
                          <MenuItem key={region} value={region}>
                            {region}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                )}
                <TextField
                  label={pt('phone')}
                  fullWidth
                  value={adminForm.phone || ''}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, phone: e.target.value })
                  }
                />
                <FormControl fullWidth>
                  <InputLabel>{pt('region')}</InputLabel>
                  <Select
                    value={adminForm.region || ''}
                    label={pt('region')}
                    onChange={(e) =>
                      setAdminForm({
                        ...adminForm,
                        region: e.target.value,
                        district: '',
                        mahalla: '',
                      })
                    }
                  >
                    <MenuItem value="">{pt('allGlobal')}</MenuItem>
                    {Object.keys(UZB_LOCATIONS).map((r) => (
                      <MenuItem key={r} value={r}>
                        {getLocalizedLocationLabel(r, lang, 1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth disabled={!adminForm.region}>
                  <InputLabel>{pt('districtCity')}</InputLabel>
                  <Select
                    value={adminForm.district || ''}
                    label={pt('districtCity')}
                    onChange={(e) =>
                      setAdminFormWithBoundaryCenter(
                        { district: e.target.value, mahalla: '' },
                        { preferDistrict: true }
                      )
                    }
                  >
                    {!adminForm.region && (
                      <MenuItem value="">{pt('chooseRegionFirst')}</MenuItem>
                    )}
                    {(UZB_LOCATIONS[adminForm.region] || []).map((district) => (
                      <MenuItem key={district} value={district}>
                        {getLocalizedLocationLabel(district, lang, 2)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl
                  fullWidth
                  disabled={!adminForm.district || mahallaLoading}
                >
                  <InputLabel>{pt('mahalla')}</InputLabel>
                  <Select
                    value={adminMahallaValue}
                    label={pt('mahalla')}
                    onChange={(e) =>
                      setAdminFormWithBoundaryCenter(
                        { mahalla: e.target.value },
                        { preferMahalla: true, fillFallbackCenter: true }
                      )
                    }
                  >
                    {mahallaLoading && (
                      <MenuItem value="">{pt('mahallasLoading')}</MenuItem>
                    )}
                    {!mahallaLoading && mahallaOptions.length === 0 && (
                      <MenuItem value="">{pt('mahallaNotFound')}</MenuItem>
                    )}
                    {!hasSelectedAdminMahallaOption && (
                      <MenuItem value={adminMahallaValue}>
                        {getLocalizedLocationLabel(adminMahallaValue, lang, 3)}
                      </MenuItem>
                    )}
                    {mahallaOptions.map((mahalla) => (
                      <MenuItem
                        key={mahalla.boundary_id || mahalla.id}
                        value={mahalla.label}
                      >
                        {getLocalizedLocationLabel(mahalla.label, lang, 3)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label={pt('address')}
                  fullWidth
                  value={adminForm.address || ''}
                  onChange={(e) =>
                    setAdminForm({ ...adminForm, address: e.target.value })
                  }
                  helperText={pt('addressCoordinateHelp')}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    label="Latitude"
                    type="number"
                    fullWidth
                    value={adminForm.latitude ?? ''}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, latitude: e.target.value })
                    }
                  />
                  <TextField
                    label="Longitude"
                    type="number"
                    fullWidth
                    value={adminForm.longitude ?? ''}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, longitude: e.target.value })
                    }
                  />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<Place />}
                    onClick={setAdminPinFromBoundary}
                    disabled={!adminForm.region}
                    sx={{
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontWeight: 800,
                    }}
                  >
                    {pt('pinRegionCenter')}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<MyLocation />}
                    onClick={useCurrentLocationForAdmin}
                    sx={{
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontWeight: 800,
                    }}
                  >
                    {pt('getCurrentLocation')}
                  </Button>
                </Stack>
              </Stack>
            )}
            {adminDialogStep === 1 && (
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                <Alert severity="info">{apt('inheritanceInfo')}</Alert>
                {adminForm.role !== 'admin' && (
                  <Alert severity="warning">{apt('adminOnlyWarning')}</Alert>
                )}
                <Grid container spacing={1.5}>
                  {Object.entries(adminPermissionLabels).map(([key, label]) => (
                    <Grid item xs={12} sm={6} key={key}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: 1.5 }}
                      >
                        <FormControlLabel
                          sx={{
                            m: 0,
                            width: '100%',
                            justifyContent: 'space-between',
                          }}
                          label={
                            <Typography fontWeight={700}>{label}</Typography>
                          }
                          labelPlacement="start"
                          control={
                            <Switch
                              checked={
                                normalizeAdminPermissions(
                                  adminForm.admin_permissions
                                )[key]
                              }
                              disabled={adminForm.role !== 'admin'}
                              onChange={(e) =>
                                setAdminForm({
                                  ...adminForm,
                                  admin_permissions: {
                                    ...normalizeAdminPermissions(
                                      adminForm.admin_permissions
                                    ),
                                    [key]: e.target.checked,
                                  },
                                })
                              }
                            />
                          }
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setAdminDialogOpen(false)}>
              {pt('cancel')}
            </Button>
            <Button variant="contained" onClick={handleAdminAction}>
              {pt('save')}
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

        <Dialog
          open={adminReportOpen}
          onClose={() => setAdminReportOpen(false)}
          maxWidth="lg"
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
                  {reportLabels.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {reportLabels.subtitle}
                </Typography>
              </Box>
              <IconButton
                onClick={() => setAdminReportOpen(false)}
                size="small"
              >
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
            <Stack spacing={2.5}>
              <Grid container spacing={1.5}>
                {[
                  [reportLabels.total, adminReportSummary.total, 'primary'],
                  [reportLabels.admins, adminReportSummary.admins, 'info'],
                  [
                    reportLabels.researchers,
                    adminReportSummary.researchers,
                    'success',
                  ],
                  [
                    reportLabels.superadmins,
                    adminReportSummary.superadmins,
                    'error',
                  ],
                ].map(([label, value, color]) => (
                  <Grid item xs={6} md={3} key={label}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'action.hover',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {label}
                      </Typography>
                      <Typography
                        variant="h5"
                        fontWeight={900}
                        color={`${color}.main`}
                      >
                        {value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1}
              >
                <Chip
                  variant="outlined"
                  label={`${reportLabels.generatedAt}: ${new Date().toLocaleString()}`}
                />
                <Button
                  variant="contained"
                  startIcon={
                    adminReportDownloading ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <Download />
                    )
                  }
                  onClick={handleDownloadAdminReport}
                  disabled={adminReportDownloading || adminsLoading}
                  sx={{ borderRadius: 2 }}
                >
                  {adminReportDownloading
                    ? reportLabels.downloading
                    : reportLabels.download}
                </Button>
              </Stack>

              <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  maxHeight: 520,
                }}
              >
                <Table stickyHeader size="small" sx={{ minWidth: 1180 }}>
                  <TableHead>
                    <TableRow>
                      {ADMIN_REPORT_COLUMN_KEYS.map((key) => (
                        <TableCell key={key} sx={{ fontWeight: 800 }}>
                          {reportLabels.columns[key] || key}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {adminsLoading ? (
                      <TableRow>
                        <TableCell
                          colSpan={ADMIN_REPORT_COLUMN_KEYS.length}
                          align="center"
                          sx={{ py: 6 }}
                        >
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : adminReportRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={ADMIN_REPORT_COLUMN_KEYS.length}
                          align="center"
                          sx={{ py: 6 }}
                        >
                          {reportLabels.noRows}
                        </TableCell>
                      </TableRow>
                    ) : (
                      adminReportRows.map((row) => (
                        <TableRow key={`${row.email}-${row.index}`} hover>
                          {ADMIN_REPORT_COLUMN_KEYS.map((key) => (
                            <TableCell
                              key={key}
                              sx={{
                                whiteSpace:
                                  key === 'researchTopic' ? 'normal' : 'nowrap',
                                maxWidth:
                                  key === 'researchTopic' ? 260 : undefined,
                              }}
                            >
                              {row[key]}
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
            <Button onClick={() => setAdminReportOpen(false)} color="inherit">
              {pt('close')}
            </Button>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleDownloadAdminReport}
              disabled={adminReportDownloading || adminsLoading}
            >
              {reportLabels.download}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>{pt('hardDelete')}</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {pt('selectedPermanentDelete').replace('{count}', checked.size)}
            </Typography>
            <Box
              sx={{
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(211, 47, 47, 0.15)'
                    : 'rgba(211, 47, 47, 0.05)',
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
                <DeleteForever fontSize="small" /> {pt('irreversibleWarning')}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">
              {pt('cancel')}
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={async () => {
                setDeleteConfirmLoading(true);
                try {
                  const selectedRows = deletedData.filter((row) =>
                    checked.has(getDeletedRowKey(row))
                  );
                  const analysisIds = selectedRows
                    .filter((row) => row.__deletedSource !== 'research')
                    .map((row) => row.id);
                  const researchIds = selectedRows
                    .filter((row) => row.__deletedSource === 'research')
                    .map((row) => row.id);

                  if (analysisIds.length)
                    await AdminApi.analyses.hardDelete(analysisIds);
                  for (const id of researchIds)
                    await ResearchApi.hardDelete(id);

                  toast.success(pt('selectedDataDeleted'));
                  setChecked(new Set());
                  setDeleteConfirmOpen(false);
                  fetchDeletedAnalyses();
                } catch (e) {
                  toast.error(e.message);
                } finally {
                  setDeleteConfirmLoading(false);
                }
              }}
              disabled={deleteConfirmLoading}
            >
              {deleteConfirmLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                pt('yesHardDelete')
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {viewRow && (
          <Dialog
            open={true}
            onClose={() => setViewRow(null)}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
          >
            <DialogTitle>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="h6" fontWeight="bold">
                  {pt('deletedDetails')}
                </Typography>
                <IconButton onClick={() => setViewRow(null)} size="small">
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      ID Kod
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {getDeletedRowCode(viewRow)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {pt('patient')}
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {getDeletedRowPatientName(viewRow)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {pt('ageGender')}
                    </Typography>
                    <Typography variant="body1">
                      {viewRow.age ? `${viewRow.age} yosh` : '-'} /{' '}
                      {getGenderLabel(viewRow.gender)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      BMI
                    </Typography>
                    <Typography variant="body1">
                      {getDeletedRowBmiText(viewRow)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(211, 47, 47, 0.1)'
                          : 'rgba(211, 47, 47, 0.05)',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'error.light',
                    }}
                  >
                    <Typography variant="caption" color="error.dark">
                      {pt('deletedBy')}
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {getDeletedByName(viewRow)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(211, 47, 47, 0.1)'
                          : 'rgba(211, 47, 47, 0.05)',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'error.light',
                    }}
                  >
                    <Typography variant="caption" color="error.dark">
                      {pt('deletedAt')}
                    </Typography>
                    <Typography variant="body1">
                      {getDeletedDate(viewRow)}
                    </Typography>
                  </Box>
                </Grid>
                {(viewRow.region ||
                  viewRow.settlement ||
                  viewRow.school_name) && (
                  <Grid item xs={12}>
                    <Box
                      sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {pt('locationInstitution')}
                      </Typography>
                      <Typography variant="body1">
                        {[
                          viewRow.region || viewRow.settlement,
                          viewRow.school_name,
                        ]
                          .filter(Boolean)
                          .join(' / ')}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<Refresh />}
                onClick={() => {
                  handleRestoreAnalysis(viewRow);
                  setViewRow(null);
                }}
              >
                {pt('restore')}
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteForever />}
                onClick={() => {
                  handleHardDeleteAnalysis(viewRow);
                  setViewRow(null);
                }}
              >
                {pt('hardDelete')}
              </Button>
              <Button onClick={() => setViewRow(null)} color="inherit">
                {pt('close')}
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </Container>

      {/* Custom Confirmation Dialog */}
      {(() => {
        const CONFIRM_TRANSLATIONS = {
          uz: { title: 'Tasdiqlash', cancel: 'Bekor qilish', confirm: 'Ha, tasdiqlayman' },
          ru: { title: 'Подтверждение', cancel: 'Отмена', confirm: 'Да, подтверждаю' },
          en: { title: 'Confirmation', cancel: 'Cancel', confirm: 'Yes, confirm' },
          tr: { title: 'Onay', cancel: 'İptal', confirm: 'Evet, onayla' },
          tm: { title: 'Tassyklamak', cancel: 'Bes et', confirm: 'Hawa, tassykla' },
          tg: { title: 'Тасдиқкунӣ', cancel: 'Рад кардан', confirm: 'Бале, тасдиқ мекунам' },
          kz: { title: 'Растау', cancel: 'Бас тарту', confirm: 'Иә, растаймын' },
          ky: { title: 'Ырастоо', cancel: 'Жокко чыгаруу', confirm: 'Ооба, ырастайм' }
        };
        const getConfirmText = (key) => {
          const trans = CONFIRM_TRANSLATIONS[lang] || CONFIRM_TRANSLATIONS['en'];
          return trans[key] || CONFIRM_TRANSLATIONS['en'][key];
        };
        return (
          <Dialog
            open={confirmDialog.open}
            onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
            PaperProps={{
              sx: {
                background: (theme) => theme.palette.mode === 'dark' ? 'rgba(30, 30, 40, 0.95)' : 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                border: '1px solid',
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                p: 1,
                minWidth: 320,
                maxWidth: 440,
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                zIndex: 1600
              }
            }}
          >
            <DialogTitle sx={{ fontWeight: 800, pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <WarningAmber color={confirmDialog.isDestructive ? "error" : "primary"} sx={{ fontSize: 28 }} />
              {confirmDialog.title || getConfirmText('title')}
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ color: 'text.primary', fontWeight: 500, fontSize: '0.95rem', lineHeight: 1.5 }}>
                {confirmDialog.message}
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, pt: 1.5, gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                {getConfirmText('cancel')}
              </Button>
              <Button
                variant="contained"
                color={confirmDialog.isDestructive ? "error" : "primary"}
                onClick={async () => {
                  if (confirmDialog.onConfirm) {
                    await confirmDialog.onConfirm();
                  }
                  setConfirmDialog(prev => ({ ...prev, open: false }));
                }}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: confirmDialog.isDestructive
                    ? '0 4px 12px rgba(244, 67, 54, 0.2)'
                    : '0 4px 12px rgba(33, 150, 243, 0.2)'
                }}
                autoFocus
              >
                {getConfirmText('confirm')}
              </Button>
            </DialogActions>
          </Dialog>
        );
      })()}
    </Box>
  );
};

export default SuperAdminPage;

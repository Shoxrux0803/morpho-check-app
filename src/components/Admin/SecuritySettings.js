import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  Stack,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  CircularProgress,
  Chip,
  Alert,
  Checkbox,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Lock from '@mui/icons-material/Lock';
import LockOutlined from '@mui/icons-material/LockOutlined';
import CheckCircle from '@mui/icons-material/CheckCircle';
import RadioButtonUnchecked from '@mui/icons-material/RadioButtonUnchecked';
import VpnKey from '@mui/icons-material/VpnKey';
import Info from '@mui/icons-material/Info';
import AdminPanelSettings from '@mui/icons-material/AdminPanelSettings';
import Person from '@mui/icons-material/Person';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminApi, changePassword } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { pageT } from '../../utils/pageI18n';
import { toast } from 'react-hot-toast';

const LOCAL_TRANSLATIONS = {
  uz: {
    ipBlocked: 'IP BLOKLANGAN',
    noIpAddressesToBlock: 'Tanlangan xabarlarda IP manzil mavjud emas',
    passwordStrength: 'Parol murakkabligi',
    weak: 'Zaif',
    medium: 'Oʻrtacha',
    strong: 'Kuchli',
    requirements: 'Parolga qoʻyiladigan talablar',
    reqLength: 'Kamida 8 ta belgi',
    reqUpper: 'Kamida 1 ta bosh harf (A-Z)',
    reqLower: 'Kamida 1 ta kichik harf (a-z)',
    reqNumber: 'Kamida 1 ta raqam (0-9)',
    match: 'Parollar mos keladi',
    mismatch: 'Parollar mos kelmaydi',
    sessionInfo: 'Xavfsizlik holati va seksiya',
    userRole: 'Foydalanuvchi roli',
    lastActive: 'Oxirgi faollik',
    securityTip: 'Xavfsizlik boʻyicha tavsiya',
    securityTipText:
      'Hisobingiz xavfsizligini taʼminlash uchun parolingizni har 3 oyda oʻzgartirib turishni va boshqa saytlarda ishlatilmagan noyob paroldan foydalanishni tavsiya etamiz.',
    successMessage: 'Parol muvaffaqiyatli oʻzgartirildi!',
    errorMessage: 'Xatolik yuz berdi',
    securityEvents: 'Xavfsizlik xabarlari',
    securityEventsLoadError: 'Xavfsizlik xabarlari yuklanmadi',
    securityEventsMarkedRead: "Xavfsizlik xabarlari o'qildi deb belgilandi",
    securityEventsUpdateError: "Xavfsizlik xabarlarini yangilab bo'lmadi",
    loginAttemptsAndBlocked: "Kirish urinishlari va bloklangan so'rovlar",
    newCount: 'yangi',
    criticalEventAlert:
      'Critical xavfsizlik hodisasi bor. IP, email va vaqtni tekshiring.',
    noSuspiciousLoginAttempts: "Hozircha shubhali kirish urinishlari yo'q.",
    selectAll: 'Barchasini tanlash',
    riskScore: 'Risk balli',
    threatType: 'Tahdid turi',
    actionTaken: 'Amal',
    signals: 'Signallar',
    falsePositive: 'Xato signal',
    unblockIp: 'IP blokdan chiqarish',
    falsePositiveSuccess: 'Xato signal deb belgilandi',
    unblockSuccess: 'IP blokdan chiqarildi',
    THREAT_DETECTED: 'Tahdid aniqlandi',
    MALICIOUS_UPLOAD_DETECTED: 'Zararli fayl yuklash aniqlandi',
    threatDetectedDetails: 'Security Shield tahdidni blokladi',
    maliciousUploadDetails: 'Security Shield zararli yuklashni blokladi',
    markAllRead: "Barchasini o'qilgan deb belgilash",
    attempt: 'Urinish',
    location: 'Joylashuv',
    device: 'Qurilma',
    app: 'Dastur',
    LOGIN_FAILED_UNKNOWN_USER: "Noma'lum email bilan kirish urinishi",
    LOGIN_FAILED_BAD_PASSWORD: "Noto'g'ri parol bilan kirish urinishi",
    SUPERADMIN_NEW_DEVICE: 'Superadmin yangi qurilmadan kirishga urindi',
    SUPERADMIN_VERIFICATION_FAILED: 'Superadmin tasdiqlash kodi xato kiritildi',
    RATE_LIMIT_EXCEEDED: "Juda ko'p so'rov yuborildi",
    updatePasswordBtn: 'Parolni yangilash',
    blockSelectedIps: 'Tanlangan IP larni bloklash',
    blockIp: 'IP ni bloklash',
    ipsBlockedSuccess: 'IP manzillar muvaffaqiyatli bloklandi',
    blockFailed: 'Bloklashda xatolik yuz berdi',
  },
  ru: {
    ipBlocked: 'IP ЗАБЛОКИРОВАН',
    noIpAddressesToBlock: 'Нет IP-адресов для блокировки',
    passwordStrength: 'Сложность пароля',
    weak: 'Слабый',
    medium: 'Средний',
    strong: 'Сильный',
    requirements: 'Требования к паролю',
    reqLength: 'Минимум 8 символов',
    reqUpper: 'Минимум 1 заглавная буква (A-Z)',
    reqLower: 'Минимум 1 строчная буква (a-z)',
    reqNumber: 'Минимум 1 цифра (0-9)',
    match: 'Пароли совпадают',
    mismatch: 'Пароли не совпадают',
    sessionInfo: 'Статус безопасности и сессия',
    userRole: 'Роль пользователя',
    lastActive: 'Последняя активность',
    securityTip: 'Рекомендация по безопасности',
    securityTipText:
      'Для обеспечения безопасности вашей учетной записи мы рекомендуем менять пароль каждые 3 месяца и использовать уникальный пароль, который не используется на других сайтах.',
    successMessage: 'Пароль успешно изменен!',
    errorMessage: 'Произошла ошибка',
    securityEvents: 'Сообщения безопасности',
    securityEventsLoadError: 'Не удалось загрузить сообщения безопасности',
    securityEventsMarkedRead: 'Сообщения безопасности отмечены как прочитанные',
    securityEventsUpdateError: 'Не удалось обновить сообщения безопасности',
    loginAttemptsAndBlocked: 'Попытки входа и заблокированные запросы',
    newCount: 'новые',
    criticalEventAlert:
      'Критическое событие безопасности. Проверьте IP, email и время.',
    noSuspiciousLoginAttempts: 'Пока нет подозрительных попыток входа.',
    selectAll: 'Выбрать все',
    riskScore: 'Оценка риска',
    threatType: 'Тип угрозы',
    actionTaken: 'Действие',
    signals: 'Сигналы',
    falsePositive: 'Ложная тревога',
    unblockIp: 'Разблокировать IP',
    falsePositiveSuccess: 'Отмечено как ложная тревога',
    unblockSuccess: 'IP разблокирован',
    THREAT_DETECTED: 'Обнаружена угроза',
    MALICIOUS_UPLOAD_DETECTED: 'Обнаружена вредоносная загрузка',
    threatDetectedDetails: 'Security Shield заблокировал угрозу',
    maliciousUploadDetails: 'Security Shield заблокировал вредоносную загрузку',
    markAllRead: 'Отметить все как прочитанные',
    attempt: 'Попытка',
    LOGIN_FAILED_UNKNOWN_USER: 'Попытка входа с неизвестным email',
    LOGIN_FAILED_BAD_PASSWORD: 'Попытка входа с неверным паролем',
    SUPERADMIN_NEW_DEVICE: 'Суперадмин попытался войти с нового устройства',
    SUPERADMIN_VERIFICATION_FAILED: 'Неверный код подтверждения суперадмина',
    RATE_LIMIT_EXCEEDED: 'Слишком много запросов',
    updatePasswordBtn: 'Обновить пароль',
    blockSelectedIps: 'Блокировать выбранные IP',
    blockIp: 'Блокировать IP',
    ipsBlockedSuccess: 'IP-адреса успешно заблокированы',
    blockFailed: 'Ошибка при блокировке',
  },
  en: {
    ipBlocked: 'IP BLOCKED',
    noIpAddressesToBlock: 'No IP addresses to block',
    passwordStrength: 'Password Strength',
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
    requirements: 'Password Requirements',
    reqLength: 'At least 8 characters',
    reqUpper: 'At least 1 uppercase letter (A-Z)',
    reqLower: 'At least 1 lowercase letter (a-z)',
    reqNumber: 'At least 1 number (0-9)',
    match: 'Passwords match',
    mismatch: 'Passwords do not match',
    sessionInfo: 'Security Status & Session',
    userRole: 'User Role',
    lastActive: 'Last Active',
    securityTip: 'Security Tip',
    securityTipText:
      'To keep your account secure, we recommend changing your password every 3 months and using a unique password not used on other sites.',
    successMessage: 'Password changed successfully!',
    errorMessage: 'An error occurred',
    securityEvents: 'Security Messages',
    securityEventsLoadError: 'Failed to load security messages',
    securityEventsMarkedRead: 'Security messages marked as read',
    securityEventsUpdateError: 'Failed to update security messages',
    loginAttemptsAndBlocked: 'Login attempts and blocked requests',
    newCount: 'new',
    criticalEventAlert: 'Critical security event. Check IP, email, and time.',
    noSuspiciousLoginAttempts: 'No suspicious login attempts yet.',
    selectAll: 'Select all',
    riskScore: 'Risk score',
    threatType: 'Threat type',
    actionTaken: 'Action',
    signals: 'Signals',
    falsePositive: 'False positive',
    unblockIp: 'Unblock IP',
    falsePositiveSuccess: 'Marked as false positive',
    unblockSuccess: 'IP unblocked',
    THREAT_DETECTED: 'Threat detected',
    MALICIOUS_UPLOAD_DETECTED: 'Malicious upload detected',
    threatDetectedDetails: 'Security Shield blocked a threat',
    maliciousUploadDetails: 'Security Shield blocked a malicious upload',
    markAllRead: 'Mark all as read',
    attempt: 'Attempt',
    location: 'Location',
    device: 'Device',
    app: 'App',
    LOGIN_FAILED_UNKNOWN_USER: 'Login attempt with unknown email',
    LOGIN_FAILED_BAD_PASSWORD: 'Login attempt with incorrect password',
    SUPERADMIN_NEW_DEVICE: 'Superadmin attempted to login from a new device',
    SUPERADMIN_VERIFICATION_FAILED:
      'Superadmin verification code entered incorrectly',
    RATE_LIMIT_EXCEEDED: 'Too many requests',
    updatePasswordBtn: 'Update Password',
    blockSelectedIps: 'Block Selected IPs',
    blockIp: 'Block IP',
    ipsBlockedSuccess: 'IP addresses successfully blocked',
    blockFailed: 'Failed to block IPs',
  },
  tr: {
    ipBlocked: 'IP ENGELLENDİ',
    noIpAddressesToBlock: 'Engellenecek IP adresi yok',
    passwordStrength: 'Şifre Zorluğu',
    weak: 'Zayıf',
    medium: 'Orta',
    strong: 'Güçlü',
    requirements: 'Şifre Gereksinimleri',
    reqLength: 'En az 8 karakter',
    reqUpper: 'En az 1 büyük harf (A-Z)',
    reqLower: 'En az 1 küçük harf (a-z)',
    reqNumber: 'En az 1 rakam (0-9)',
    match: 'Şifreler eşleşiyor',
    mismatch: 'Şifreler eşleşmiyor',
    sessionInfo: 'Güvenlik Durumu ve Oturum',
    userRole: 'Kullanıcı Rolü',
    lastActive: 'Son Aktif',
    securityTip: 'Güvenlik İpucu',
    securityTipText:
      'Hesabınızı güvende tutmak için şifrenizi her 3 ayda bir değiştirmenizi ve başka sitelerde kullanılmayan benzersiz bir şifre kullanmanızı öneririz.',
    successMessage: 'Şifre başarıyla değiştirildi!',
    errorMessage: 'Bir hata oluştu',
    securityEvents: 'Güvenlik Mesajları',
    securityEventsLoadError: 'Güvenlik mesajları yüklenemedi',
    securityEventsMarkedRead: 'Güvenlik mesajları okundu olarak işaretlendi',
    securityEventsUpdateError: 'Güvenlik mesajları güncellenemedi',
    loginAttemptsAndBlocked: 'Giriş denemeleri ve engellenen istekler',
    newCount: 'yeni',
    criticalEventAlert:
      'Kritik güvenlik olayı. IP, e-posta ve saati kontrol edin.',
    noSuspiciousLoginAttempts: 'Henüz şüpheli giriş denemesi yok.',
    selectAll: 'Tümünü seç',
    riskScore: 'Risk puanı',
    threatType: 'Tehdit türü',
    actionTaken: 'İşlem',
    signals: 'Sinyaller',
    falsePositive: 'Yanlış alarm',
    unblockIp: 'IP engelini kaldır',
    falsePositiveSuccess: 'Yanlış alarm olarak işaretlendi',
    unblockSuccess: 'IP engeli kaldırıldı',
    THREAT_DETECTED: 'Tehdit algılandı',
    MALICIOUS_UPLOAD_DETECTED: 'Zararlı yükleme algılandı',
    threatDetectedDetails: 'Security Shield tehdidi engelledi',
    maliciousUploadDetails: 'Security Shield zararlı yüklemeyi engelledi',
    markAllRead: 'Tümünü okundu olarak işaretle',
    attempt: 'Deneme',
    location: 'Konum',
    device: 'Cihaz',
    app: 'Uygulama',
    LOGIN_FAILED_UNKNOWN_USER: 'Bilinmeyen e-posta ile giriş denemesi',
    LOGIN_FAILED_BAD_PASSWORD: 'Yanlış şifre ile giriş denemesi',
    SUPERADMIN_NEW_DEVICE:
      'Süper admin yeni bir cihazdan giriş yapmaya çalıştı',
    SUPERADMIN_VERIFICATION_FAILED: 'Süper admin doğrulama kodu yanlış girildi',
    RATE_LIMIT_EXCEEDED: 'Çok fazla istek',
    updatePasswordBtn: 'Şifreyi Güncelle',
    blockSelectedIps: 'Seçili IP leri Engelle',
    blockIp: 'IP yi Engelle',
    ipsBlockedSuccess: 'IP adresleri başarıyla engellendi',
    blockFailed: 'Engelleme sırasında hata oluştu',
  },
  tg: {
    ipBlocked: 'IP БЛОК КАРДА ШУД',
    noIpAddressesToBlock: 'Суроғаҳои IP барои масдуд кардан вуҷуд надоранд',
    passwordStrength: 'Қуввати парол',
    weak: 'Заиф',
    medium: 'Миёна',
    strong: 'Қавӣ',
    requirements: 'Талабот ба парол',
    reqLength: 'Камаш 8 аломат',
    reqUpper: 'Камаш 1 ҳарфи калон (A-Z)',
    reqLower: 'Камаш 1 ҳарфи хурд (a-z)',
    reqNumber: 'Камаш 1 рақам (0-9)',
    match: 'Паролҳо мувофиқанд',
    mismatch: 'Паролҳо мувофиқат намекунанд',
    sessionInfo: 'Статуси амният ва сессия',
    userRole: 'Нақши корбар',
    lastActive: 'Фаъолияти охирин',
    securityTip: 'Маслиҳати амниятӣ',
    securityTipText:
      'Барои бехатарии ҳисоби худ, тавсия медиҳем, ки пароли худро ҳар 3 моҳ иваз кунед ва пароли беҳамтоеро истифода баред, ки дар сайтҳои дигар истифода намешавад.',
    successMessage: 'Парол бо муваффақият иваз карда шуд!',
    errorMessage: 'Хатогӣ рух дод',
    securityEvents: 'Паёмҳои амниятӣ',
    securityEventsLoadError: 'Боркунии паёмҳои амниятӣ ноком шуд',
    securityEventsMarkedRead:
      'Паёмҳои амниятӣ ҳамчун хондашуда қайд карда шуданд',
    securityEventsUpdateError: 'Навсозии паёмҳои амниятӣ ноком шуд',
    loginAttemptsAndBlocked: 'Кӯшишҳои воридшавӣ ва дархостҳои басташуда',
    newCount: 'нав',
    criticalEventAlert:
      'Ҳодисаи муҳими амниятӣ. IP, почтаи электронӣ ва вақтро тафтиш кунед.',
    noSuspiciousLoginAttempts: 'Ҳоло кӯшишҳои шубҳаноки воридшавӣ нест.',
    selectAll: 'Ҳамаро интихоб кунед',
    riskScore: 'Холи хавф',
    threatType: 'Навъи таҳдид',
    actionTaken: 'Амал',
    signals: 'Сигналҳо',
    falsePositive: 'Огоҳии хато',
    unblockIp: 'IP-ро кушодан',
    falsePositiveSuccess: 'Ҳамчун огоҳии хато қайд шуд',
    unblockSuccess: 'IP кушода шуд',
    THREAT_DETECTED: 'Таҳдид ошкор шуд',
    MALICIOUS_UPLOAD_DETECTED: 'Боркунии зараровар ошкор шуд',
    threatDetectedDetails: 'Security Shield таҳдидро баст',
    maliciousUploadDetails: 'Security Shield боркунии зарароварро баст',
    markAllRead: 'Ҳамаро ҳамчун хондашуда қайд кунед',
    attempt: 'Кӯшиш',
    LOGIN_FAILED_UNKNOWN_USER: 'Кӯшиши воридшавӣ бо почтаи электронии номаълум',
    LOGIN_FAILED_BAD_PASSWORD: 'Кӯшиши воридшавӣ бо пароли нодуруст',
    SUPERADMIN_NEW_DEVICE: 'Суперадмин аз дастгоҳи нав ворид шуданӣ шуд',
    SUPERADMIN_VERIFICATION_FAILED:
      'Рамзи тасдиқи суперадмин нодуруст ворид карда шуд',
    RATE_LIMIT_EXCEEDED: 'Дархостҳои аз ҳад зиёд',
    updatePasswordBtn: 'Навсозии парол',
    blockSelectedIps: 'Манъи IP-ҳои интихобшуда',
    blockIp: 'Манъи IP',
    ipsBlockedSuccess: 'IP-ҳо бо муваффақият манъ карда шуданд',
    blockFailed: 'Хатогӣ ҳангоми манъ',
  },
  kz: {
    ipBlocked: 'IP БҰҒАТТАЛДЫ',
    noIpAddressesToBlock: 'Бұғаттайтын IP мекенжайлары жоқ',
    passwordStrength: 'Құпия сөз күрделілігі',
    weak: 'Әлсіз',
    medium: 'Орташа',
    strong: 'Күшті',
    requirements: 'Құпия сөзге қойылатын талаптар',
    reqLength: 'Кемінде 8 таңба',
    reqUpper: 'Кемінде 1 бас әріп (A-Z)',
    reqLower: 'Кемінде 1 кіші әріп (a-z)',
    reqNumber: 'Кемінде 1 сан (0-9)',
    match: 'Құпия сөздер сәйкес келеді',
    mismatch: 'Құпия сөздер сәйкес келмейді',
    sessionInfo: 'Қауіпсіздік мәртебесі және сессия',
    userRole: 'Пайдаланушы рөлі',
    lastActive: 'Соңғы белсенділік',
    securityTip: 'Қауіпсіздік кеңесі',
    securityTipText:
      'Тіркелгіңіздің қауіпсіздігін қамтамасыз ету үшін құпия сөзді әр 3 ай сайын өзгертуді және басқа сайттарда қолданылмайтын бірегей құпия сөзді пайдалануды ұсынамыз.',
    successMessage: 'Құпия сөз сәтті өзгертілді!',
    errorMessage: 'Қате орын алды',
    securityEvents: 'Қауіпсіздік хабарламалары',
    securityEventsLoadError: 'Қауіпсіздік хабарламалары жүктелмеді',
    securityEventsMarkedRead: 'Қауіпсіздік хабарламалары оқылды деп белгіленді',
    securityEventsUpdateError:
      'Қауіпсіздік хабарламаларын жаңарту мүмкін болмады',
    loginAttemptsAndBlocked: 'Кіру әрекеттері және бұғатталған сұраулар',
    newCount: 'жаңа',
    criticalEventAlert:
      'Маңызды қауіпсіздік оқиғасы. IP, электрондық пошта және уақытты тексеріңіз.',
    noSuspiciousLoginAttempts: 'Әзірге күдікті кіру әрекеттері жоқ.',
    selectAll: 'Барлығын таңдау',
    riskScore: 'Қауіп ұпайы',
    threatType: 'Қауіп түрі',
    actionTaken: 'Әрекет',
    signals: 'Сигналдар',
    falsePositive: 'Жалған дабыл',
    unblockIp: 'IP бұғатын ашу',
    falsePositiveSuccess: 'Жалған дабыл деп белгіленді',
    unblockSuccess: 'IP бұғаты ашылды',
    THREAT_DETECTED: 'Қауіп анықталды',
    MALICIOUS_UPLOAD_DETECTED: 'Зиянды жүктеу анықталды',
    threatDetectedDetails: 'Security Shield қауіпті бұғаттады',
    maliciousUploadDetails: 'Security Shield зиянды жүктеуді бұғаттады',
    markAllRead: 'Барлығын оқылды деп белгілеу',
    attempt: 'Әрекет',
    LOGIN_FAILED_UNKNOWN_USER: 'Белгісіз электрондық поштамен кіру әрекеті',
    LOGIN_FAILED_BAD_PASSWORD: 'Қате құпия сөзбен кіру әрекеті',
    SUPERADMIN_NEW_DEVICE: 'Суперадмин жаңа құрылғыдан кіруге әрекет жасады',
    SUPERADMIN_VERIFICATION_FAILED: 'Суперадмин растау коды қате енгізілді',
    RATE_LIMIT_EXCEEDED: 'Тым көп сұрау',
    updatePasswordBtn: 'Құпиясөзді жаңарту',
    blockSelectedIps: 'Таңдалған IP-лерді бұғаттау',
    blockIp: 'IP-ді бұғаттау',
    ipsBlockedSuccess: 'IP мекенжайлары сәтті бұғатталды',
    blockFailed: 'Бұғаттау кезінде қате пайда болды',
  },
  ky: {
    ipBlocked: 'IP БӨГӨТТӨЛДҮ',
    noIpAddressesToBlock: 'Бөгөттөй турган IP даректер жок',
    passwordStrength: 'Сөз айкаштын татаалдыгы',
    weak: 'Алсыз',
    medium: 'Орточо',
    strong: 'Күчтүү',
    requirements: 'Сөз айкашына коюлган талаптар',
    reqLength: 'Кем дегенде 8 белги',
    reqUpper: 'Кем дегенде 1 баш тамга (A-Z)',
    reqLower: 'Кем дегенде 1 кичине тамга (a-z)',
    reqNumber: 'Кем дегенде 1 сан (0-9)',
    match: 'Сөз айкаштары дал келет',
    mismatch: 'Сөз айкаштары дал келбейт',
    sessionInfo: 'Коопсуздуктун абалы жана сессия',
    userRole: 'Колдонуучунун ролу',
    lastActive: 'Акыркы активдүүлүк',
    securityTip: 'Коопсуздук кеңеши',
    securityTipText:
      'Аккаунтуңуздун коопсуздугун камсыз кылуу үчүн сөз айкашыңызды ар 3 ай сайын өзгөртүп турууну жана башка сайттарда колдонулбаган уникалдуу сөз айкашын колдонууну сунуштайбыз.',
    successMessage: 'Сөз айкашы ийгиликтүү өзгөртүлдү!',
    errorMessage: 'Ката кетти',
    securityEvents: 'Коопсуздук билдирүүлөрү',
    securityEventsLoadError: 'Коопсуздук билдирүүлөрүн жүктөө ишке ашкан жок',
    securityEventsMarkedRead: 'Коопсуздук билдирүүлөрү окулду деп белгиленди',
    securityEventsUpdateError: 'Коопсуздук билдирүүлөрүн жаңыртуу мүмкүн эмес',
    loginAttemptsAndBlocked: 'Кирүү аракеттері жана бөгөттөлгөн сурамдар',
    newCount: 'жаңы',
    criticalEventAlert:
      'Критикалык коопсуздук окуясы. IP, электрондук почта жана убакытты текшериңиз.',
    noSuspiciousLoginAttempts: 'Азырынча шектүү кирүү аракеттери жок.',
    selectAll: 'Баарын тандоо',
    riskScore: 'Коркунуч упайы',
    threatType: 'Коркунуч түрү',
    actionTaken: 'Аракет',
    signals: 'Сигналдар',
    falsePositive: 'Жалган белги',
    unblockIp: 'IP бөгөтүн ачуу',
    falsePositiveSuccess: 'Жалган белги деп белгиленди',
    unblockSuccess: 'IP бөгөтү ачылды',
    THREAT_DETECTED: 'Коркунуч аныкталды',
    MALICIOUS_UPLOAD_DETECTED: 'Зыяндуу жүктөө аныкталды',
    threatDetectedDetails: 'Security Shield коркунучту бөгөттөдү',
    maliciousUploadDetails: 'Security Shield зыяндуу жүктөөнү бөгөттөдү',
    markAllRead: 'Баарын окулду деп белгилөө',
    attempt: 'Аракет',
    location: 'Жайгашкан жер',
    device: 'Түзмөк',
    app: 'Колдонмо',
    LOGIN_FAILED_UNKNOWN_USER: 'Белгисиз электрондук почта менен кирүү аракети',
    LOGIN_FAILED_BAD_PASSWORD: 'Туура эмес сырсөз менен кирүү аракети',
    SUPERADMIN_NEW_DEVICE: 'Суперадмин жаңы түзмөктөн кирүүгө аракет кылды',
    SUPERADMIN_VERIFICATION_FAILED:
      'Суперадминдин тастыктоо коду туура эмес киргизилди',
    RATE_LIMIT_EXCEEDED: 'Өтө көп сурам',
    updatePasswordBtn: 'Сырсөздү жаңыртуу',
    blockSelectedIps: 'Тандалган IP-лерди бөгөттөө',
    blockIp: 'IP ни бөгөттөө',
    ipsBlockedSuccess: 'IP даректер ийгиликтүү бөгөттөлдү',
    blockFailed: 'Бөгөттөөдө ката кетти',
  },
  tm: {
    ipBlocked: 'IP BEKLEDI',
    noIpAddressesToBlock: 'Beklemek üçin IP salgylar ýok',
    passwordStrength: 'Paroluň kynlygy',
    weak: 'Gowşak',
    medium: 'Ortaça',
    strong: 'Güýçli',
    requirements: 'Parol talaplary',
    reqLength: 'Iň az 8 simwol',
    reqUpper: 'Iň az 1 baş harp (A-Z)',
    reqLower: 'Iň az 1 setir harp (a-z)',
    reqNumber: 'Iň az 1 san (0-9)',
    match: 'Parollar gabat gelýär',
    mismatch: 'Parollar gabat gelmeýär',
    sessionInfo: 'Howpsuzlyk ýagdaýy we sessiýa',
    userRole: 'Ulanyjy roly',
    lastActive: 'Soňky işjeňlik',
    securityTip: 'Howpsuzlyk maslahaty',
    securityTipText:
      'Hasabyňyzyň howpsuzlygyny üpjün etmek üçin paroluňyzy her 3 aýdan bir gezek üýtgetmegi we başga saýtlarda ulanylmadyk üýtgeşik paroly ulanmagy maslahat berýäris.',
    successMessage: 'Parol üstünlikli üýtgedildi!',
    errorMessage: 'Ýalňyşlyk ýüze çykdy',
    securityEvents: 'Howpsuzlyk habarlary',
    securityEventsLoadError: 'Howpsuzlyk habarlary ýüklendi',
    securityEventsMarkedRead: 'Howpsuzlyk habarlary okaldy diýip bellendi',
    securityEventsUpdateError: 'Howpsuzlyk habarlaryny täzeläp bolmady',
    loginAttemptsAndBlocked: 'Giriş synanyşyklary we beklenen islegler',
    newCount: 'täze',
    criticalEventAlert:
      'Möhüm howpsuzlyk wakasy. IP, e-poçta we wagty barlap görüň.',
    noSuspiciousLoginAttempts: 'Häzirlikçe şübheli giriş synanyşygy ýok.',
    selectAll: 'Hemmesini saýla',
    riskScore: 'Risk baly',
    threatType: 'Howp görnüşi',
    actionTaken: 'Hereket',
    signals: 'Signallar',
    falsePositive: 'Ýalňyş duýduryş',
    unblockIp: 'IP-ni açmak',
    falsePositiveSuccess: 'Ýalňyş duýduryş hökmünde bellendi',
    unblockSuccess: 'IP açyldy',
    THREAT_DETECTED: 'Howp ýüze çykaryldy',
    MALICIOUS_UPLOAD_DETECTED: 'Zyýanly ýükleme ýüze çykaryldy',
    threatDetectedDetails: 'Security Shield howpy bekledi',
    maliciousUploadDetails: 'Security Shield zyýanly ýüklemäni bekledi',
    markAllRead: 'Hemmesini okaldy diýip bellemek',
    attempt: 'Synanyşyk',
    LOGIN_FAILED_UNKNOWN_USER: 'Näbelli e-poçta bilen giriş synanyşygy',
    LOGIN_FAILED_BAD_PASSWORD: 'Nädogry parol bilen giriş synanyşygy',
    SUPERADMIN_NEW_DEVICE: 'Superadmin täze enjamdan girmäge synanyşdy',
    SUPERADMIN_VERIFICATION_FAILED:
      'Superadmin tassyklama kody nädogry girizildi',
    RATE_LIMIT_EXCEEDED: 'Aşa köp isleg',
    updatePasswordBtn: 'Paroly täzelemek',
    blockSelectedIps: 'Saýlanan IP-leri beklemek',
    blockIp: 'IP beklemek',
    ipsBlockedSuccess: 'IP salgylary üstünlikli beklendi',
    blockFailed: 'Beklemekde ýalňyşlyk',
  },
};

const SECURITY_VALUE_LABELS = {
  uz: {
    criticalCount: 'kritik',
    blockedIps: 'bloklangan IP',
    highRiskEvents: 'yuqori risk',
    low: 'past',
    medium: "o'rtacha",
    high: 'yuqori',
    critical: 'kritik',
    sql_injection: 'SQL inyeksiya',
    xss: 'XSS hujum',
    path_traversal: "Yo'lni aylanib o'tish",
    scanner_bot: 'Skaner bot',
    suspicious_client: 'Shubhali mijoz',
    scanner_probe: 'Skaner tekshiruvi',
    large_payload: 'Katta payload',
    malicious_file: 'Zararli fayl',
    archive_risk: 'Xavfli arxiv',
    malware_signature: 'Malware belgisi',
    file_spoofing: 'Fayl niqoblash',
    xss_file: 'XSS fayl',
    clean: 'toza',
    block_request: "So'rov bloklandi",
    auto_block_ip: 'IP avtomatik bloklandi',
    monitor: 'Kuzatuv',
    allow: 'Ruxsat',
    marked_false_positive: 'Xato signal deb belgilandi',
  },
  ru: {
    criticalCount: 'критические',
    blockedIps: 'заблокированные IP',
    highRiskEvents: 'высокий риск',
    low: 'низкий',
    medium: 'средний',
    high: 'высокий',
    critical: 'критический',
    sql_injection: 'SQL-инъекция',
    xss: 'XSS-атака',
    path_traversal: 'Обход пути',
    scanner_bot: 'Сканер-бот',
    suspicious_client: 'Подозрительный клиент',
    scanner_probe: 'Проверка сканером',
    large_payload: 'Большая нагрузка',
    malicious_file: 'Вредоносный файл',
    archive_risk: 'Рискованный архив',
    malware_signature: 'Сигнатура malware',
    file_spoofing: 'Подмена файла',
    xss_file: 'XSS-файл',
    clean: 'чисто',
    block_request: 'Запрос заблокирован',
    auto_block_ip: 'IP заблокирован автоматически',
    monitor: 'Наблюдение',
    allow: 'Разрешено',
    marked_false_positive: 'Отмечено как ложная тревога',
  },
  en: {
    criticalCount: 'critical',
    blockedIps: 'blocked IP',
    highRiskEvents: 'high risk',
    low: 'low',
    medium: 'medium',
    high: 'high',
    critical: 'critical',
    sql_injection: 'SQL injection',
    xss: 'XSS attack',
    path_traversal: 'Path traversal',
    scanner_bot: 'Scanner bot',
    suspicious_client: 'Suspicious client',
    scanner_probe: 'Scanner probe',
    large_payload: 'Large payload',
    malicious_file: 'Malicious file',
    archive_risk: 'Archive risk',
    malware_signature: 'Malware signature',
    file_spoofing: 'File spoofing',
    xss_file: 'XSS file',
    clean: 'clean',
    block_request: 'Request blocked',
    auto_block_ip: 'IP auto-blocked',
    monitor: 'Monitor',
    allow: 'Allowed',
    marked_false_positive: 'Marked false positive',
  },
  tr: {
    criticalCount: 'kritik',
    blockedIps: 'engellenen IP',
    highRiskEvents: 'yüksek risk',
    low: 'düşük',
    medium: 'orta',
    high: 'yüksek',
    critical: 'kritik',
    sql_injection: 'SQL enjeksiyonu',
    xss: 'XSS saldırısı',
    path_traversal: 'Yol aşımı',
    scanner_bot: 'Tarayıcı bot',
    suspicious_client: 'Şüpheli istemci',
    scanner_probe: 'Tarayıcı kontrolü',
    large_payload: 'Büyük yük',
    malicious_file: 'Zararlı dosya',
    archive_risk: 'Arşiv riski',
    malware_signature: 'Zararlı imza',
    file_spoofing: 'Dosya sahteciliği',
    xss_file: 'XSS dosyası',
    clean: 'temiz',
    block_request: 'İstek engellendi',
    auto_block_ip: 'IP otomatik engellendi',
    monitor: 'İzleme',
    allow: 'İzin verildi',
    marked_false_positive: 'Yanlış alarm işaretlendi',
  },
  tg: {
    criticalCount: 'муҳим',
    blockedIps: 'IP-ҳои баста',
    highRiskEvents: 'хавфи баланд',
    low: 'паст',
    medium: 'миёна',
    high: 'баланд',
    critical: 'муҳим',
    sql_injection: 'SQL-инъексия',
    xss: 'Ҳамлаи XSS',
    path_traversal: 'Гузариши роҳ',
    scanner_bot: 'Боти сканер',
    suspicious_client: 'Мизоҷи шубҳанок',
    scanner_probe: 'Санҷиши сканер',
    large_payload: 'Payload калон',
    malicious_file: 'Файли зараровар',
    archive_risk: 'Хавфи архив',
    malware_signature: 'Имзои malware',
    file_spoofing: 'Ниқобкунии файл',
    xss_file: 'Файли XSS',
    clean: 'тоза',
    block_request: 'Дархост баста шуд',
    auto_block_ip: 'IP худкор баста шуд',
    monitor: 'Назорат',
    allow: 'Иҷозат',
    marked_false_positive: 'Огоҳии хато қайд шуд',
  },
  kz: {
    criticalCount: 'критикалық',
    blockedIps: 'бұғатталған IP',
    highRiskEvents: 'жоғары қауіп',
    low: 'төмен',
    medium: 'орташа',
    high: 'жоғары',
    critical: 'критикалық',
    sql_injection: 'SQL инъекция',
    xss: 'XSS шабуыл',
    path_traversal: 'Жолды айналып өту',
    scanner_bot: 'Сканер бот',
    suspicious_client: 'Күдікті клиент',
    scanner_probe: 'Сканер тексеруі',
    large_payload: 'Үлкен payload',
    malicious_file: 'Зиянды файл',
    archive_risk: 'Архив қаупі',
    malware_signature: 'Malware белгісі',
    file_spoofing: 'Файлды бүркемелеу',
    xss_file: 'XSS файл',
    clean: 'таза',
    block_request: 'Сұрау бұғатталды',
    auto_block_ip: 'IP автоматты бұғатталды',
    monitor: 'Бақылау',
    allow: 'Рұқсат',
    marked_false_positive: 'Жалған дабыл деп белгіленді',
  },
  ky: {
    criticalCount: 'критикалык',
    blockedIps: 'бөгөттөлгөн IP',
    highRiskEvents: 'жогорку коркунуч',
    low: 'төмөн',
    medium: 'орточо',
    high: 'жогорку',
    critical: 'критикалык',
    sql_injection: 'SQL инъекция',
    xss: 'XSS чабуул',
    path_traversal: 'Жолду айланып өтүү',
    scanner_bot: 'Сканер бот',
    suspicious_client: 'Шектүү кардар',
    scanner_probe: 'Сканер текшерүүсү',
    large_payload: 'Чоң payload',
    malicious_file: 'Зыяндуу файл',
    archive_risk: 'Архив коркунучу',
    malware_signature: 'Malware белгиси',
    file_spoofing: 'Файлды жашыруу',
    xss_file: 'XSS файл',
    clean: 'таза',
    block_request: 'Сурам бөгөттөлдү',
    auto_block_ip: 'IP автоматтык бөгөттөлдү',
    monitor: 'Көзөмөл',
    allow: 'Уруксат',
    marked_false_positive: 'Жалган белги деп белгиленди',
  },
  tm: {
    criticalCount: 'möhüm',
    blockedIps: 'beklenen IP',
    highRiskEvents: 'ýokary risk',
    low: 'pes',
    medium: 'ortaça',
    high: 'ýokary',
    critical: 'möhüm',
    sql_injection: 'SQL sanjymy',
    xss: 'XSS hüjümi',
    path_traversal: 'Ýol aýlawy',
    scanner_bot: 'Skaner bot',
    suspicious_client: 'Şübheli müşderi',
    scanner_probe: 'Skaner barlagy',
    large_payload: 'Uly payload',
    malicious_file: 'Zyýanly faýl',
    archive_risk: 'Arhiw riski',
    malware_signature: 'Malware belgisi',
    file_spoofing: 'Faýl gizlemek',
    xss_file: 'XSS faýl',
    clean: 'arassa',
    block_request: 'Isleg beklenildi',
    auto_block_ip: 'IP awtomatik beklenildi',
    monitor: 'Gözegçilik',
    allow: 'Rugsat',
    marked_false_positive: 'Ýalňyş duýduryş diýlip bellendi',
  },
};

const GlassPaper = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      background: (theme) =>
        theme.palette.mode === 'dark'
          ? 'rgba(22, 22, 33, 0.6)'
          : 'rgba(255, 255, 255, 0.75)',
      backdropFilter: 'blur(20px)',
      borderRadius: 4,
      border: '1px solid',
      borderColor: (theme) =>
        theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.06)'
          : 'rgba(0, 0, 0, 0.05)',
      p: { xs: 2.5, md: 4 },
      overflow: 'hidden',
      transition:
        'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
      boxShadow: (theme) =>
        theme.palette.mode === 'dark'
          ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
          : '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const severityColors = {
  low: 'default',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

const formatSecurityDate = (value) => {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
};
const getSecurityMetaLabel = (translate, key, fallback) => {
  const value = translate(key);
  return value === key ? fallback : value;
};

const detectProgramFromUserAgent = (userAgent) => {
  const ua = (userAgent || '').toLowerCase();
  if (!ua) return 'Unknown app';
  if (ua.includes('edg/')) return 'Microsoft Edge';
  if (ua.includes('opr/') || ua.includes('opera')) return 'Opera';
  if (ua.includes('samsungbrowser')) return 'Samsung Internet';
  if (ua.includes('firefox/')) return 'Firefox';
  if (ua.includes('chrome/') || ua.includes('crios/')) return 'Chrome';
  if (ua.includes('safari/')) return 'Safari';
  if (ua.includes('postmanruntime')) return 'Postman';
  if (ua.includes('curl/')) return 'curl';
  if (ua.includes('python-requests')) return 'Python requests';
  return 'Unknown app';
};

const detectDeviceFromUserAgent = (userAgent) => {
  const ua = (userAgent || '').toLowerCase();
  if (!ua) return 'Unknown device';
  const os = ua.includes('windows')
    ? 'Windows'
    : ua.includes('android')
      ? 'Android'
      : ua.includes('iphone') || ua.includes('ipad')
        ? 'iOS'
        : ua.includes('mac os') || ua.includes('macintosh')
          ? 'macOS'
          : ua.includes('linux')
            ? 'Linux'
            : 'Unknown';
  const type =
    ua.includes('ipad') || ua.includes('tablet')
      ? 'tablet'
      : ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')
        ? 'phone'
        : 'desktop';
  return `${os} ${type}`;
};

const getSecurityLocationLabel = (event) =>
  event?.ip_location?.label || 'Unknown location';
const getSecurityDeviceLabel = (event) =>
  event?.client_info?.device || detectDeviceFromUserAgent(event?.user_agent);
const getSecurityProgramLabel = (event) =>
  event?.client_info?.program || detectProgramFromUserAgent(event?.user_agent);
const visibilityButtonSx = {
  width: 36,
  height: 36,
  flex: '0 0 36px',
  '& .MuiSvgIcon-root': {
    fontSize: 22,
  },
};

const passwordFieldSx = (masked, extraRootSx = {}) => ({
  '& .MuiOutlinedInput-root': {
    minHeight: 56,
    borderRadius: 3,
    transition: 'background-color 0.2s, border-color 0.2s, box-shadow 0.2s',
    backgroundColor: (theme) =>
      theme.palette.mode === 'dark'
        ? 'rgba(255,255,255,0.02)'
        : 'rgba(0,0,0,0.01)',
    '&.Mui-focused': {
      '& fieldset': {
        borderColor: 'primary.main',
        borderWidth: '2px',
        boxShadow: '0 0 12px rgba(33, 150, 243, 0.25)',
      },
    },
    ...extraRootSx,
  },
  '& .MuiInputBase-input': {
    fontFamily: 'inherit',
    height: '1.4375em',
    WebkitTextSecurity: masked ? 'disc' : 'none',
  },
  '& .MuiInputAdornment-positionEnd': {
    width: 40,
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: 1,
  },
  '& .MuiInputAdornment-positionStart': {
    flexShrink: 0,
  },
  '& .MuiInputLabel-root': {
    transform: 'translate(42px, 16px) scale(1)',
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(14px, -9px) scale(0.75)',
  },
  '& .MuiFormHelperText-root': {
    minHeight: 20,
    marginTop: 0.5,
  },
});

export default function SecuritySettings() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const pt = (key) => pageT(lang, key);
  const lt = useCallback(
    (key) =>
      LOCAL_TRANSLATIONS[lang]?.[key] || LOCAL_TRANSLATIONS['ru'][key] || key,
    [lang]
  );
  const sl = useCallback(
    (key) =>
      SECURITY_VALUE_LABELS[lang]?.[key] ||
      SECURITY_VALUE_LABELS.en[key] ||
      String(key || '-').replace(/_/g, ' '),
    [lang]
  );
  const formatSecurityEventDetails = useCallback(
    (event) => {
      if (!event) return '';

      const requestTarget = [event.method, event.path]
        .filter(Boolean)
        .join(' ');
      if (event.event_type === 'THREAT_DETECTED') {
        return [
          lt('threatDetectedDetails'),
          sl(event.threat_type),
          requestTarget,
        ]
          .filter(Boolean)
          .join(' - ');
      }
      if (event.event_type === 'MALICIOUS_UPLOAD_DETECTED') {
        return [
          lt('maliciousUploadDetails'),
          sl(event.threat_type),
          requestTarget,
        ]
          .filter(Boolean)
          .join(' - ');
      }

      return event.details || '';
    },
    [lt, sl]
  );

  // States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [securitySummary, setSecuritySummary] = useState({
    total: 0,
    unread: 0,
    critical: 0,
    blocked: 0,
    highRisk: 0,
    threatSummary: [],
  });
  const [securityLoading, setSecurityLoading] = useState(false);
  const [activeSecurityView, setActiveSecurityView] = useState('password');
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [blockingLoading, setBlockingLoading] = useState(false);

  const loadSecurityEvents = useCallback(async () => {
    if (user?.role !== 'superadmin') return;
    setSecurityLoading(true);
    try {
      const data = await AdminApi.securityEvents.list({
        page: 1,
        page_size: 6,
      });
      setSecurityEvents(data.items || []);
      setSecuritySummary({
        total: data.total || 0,
        unread: data.unread || 0,
        critical: data.critical || 0,
        blocked: data.blocked || 0,
        highRisk: data.high_risk || 0,
        threatSummary: data.threat_summary || [],
      });
    } catch (err) {
      toast.error(err.message || lt('securityEventsLoadError'));
    } finally {
      setSecurityLoading(false);
    }
  }, [lt, user?.role]);

  useEffect(() => {
    loadSecurityEvents();
    const timer = setInterval(loadSecurityEvents, 30000);
    return () => clearInterval(timer);
  }, [loadSecurityEvents]);

  const handleMarkSecurityRead = async () => {
    setSecurityLoading(true);
    try {
      await AdminApi.securityEvents.markRead();
      await loadSecurityEvents();
      toast.success(lt('securityEventsMarkedRead'));
    } catch (err) {
      toast.error(err.message || lt('securityEventsUpdateError'));
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleSelectEvent = (id) => {
    setSelectedEvents((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllEvents = () => {
    const unblockedEvents = securityEvents.filter((e) => !e.is_blocked);
    if (unblockedEvents.length === 0) return;

    if (selectedEvents.length === unblockedEvents.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(unblockedEvents.map((e) => e.id));
    }
  };

  const handleBlockSelectedIps = async () => {
    if (selectedEvents.length === 0) return;

    // Collect unique IPs from selected events
    const ipsToBlock = Array.from(
      new Set(
        securityEvents
          .filter((e) => selectedEvents.includes(e.id) && e.ip_address)
          .map((e) => e.ip_address)
      )
    );

    if (ipsToBlock.length === 0) {
      toast.error(
        lt('noIpAddressesToBlock') ||
          'Tanlangan xabarlarda IP manzil mavjud emas.'
      );
      return;
    }

    setBlockingLoading(true);
    try {
      await AdminApi.securityEvents.blockIps(ipsToBlock);
      toast.success(lt('ipsBlockedSuccess'));
      setSelectedEvents([]);
      await loadSecurityEvents();
    } catch (err) {
      toast.error(err.message || lt('blockFailed'));
    } finally {
      setBlockingLoading(false);
    }
  };

  const handleUnblockEventIp = async (event) => {
    if (!event?.ip_address) return;
    setBlockingLoading(true);
    try {
      await AdminApi.securityEvents.unblockIps([event.ip_address]);
      toast.success(lt('unblockSuccess'));
      await loadSecurityEvents();
    } catch (err) {
      toast.error(err.message || lt('blockFailed'));
    } finally {
      setBlockingLoading(false);
    }
  };

  const handleFalsePositive = async (event) => {
    if (!event?.id) return;
    setBlockingLoading(true);
    try {
      await AdminApi.securityEvents.markFalsePositive(event.id);
      toast.success(lt('falsePositiveSuccess'));
      await loadSecurityEvents();
    } catch (err) {
      toast.error(err.message || lt('securityEventsUpdateError'));
    } finally {
      setBlockingLoading(false);
    }
  };
  // Password Validation Checks
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);

  // Calculate Strength Score
  const getStrengthScore = () => {
    if (!newPassword) return 0;
    let score = 0;
    if (hasMinLength) score += 1;
    if (hasUpper) score += 1;
    if (hasLower) score += 1;
    if (hasDigit) score += 1;
    return score;
  };

  const score = getStrengthScore();
  const isFormValid =
    currentPassword &&
    newPassword &&
    confirmPassword &&
    hasMinLength &&
    hasUpper &&
    hasLower &&
    hasDigit &&
    newPassword === confirmPassword;

  // Colors based on password strength
  const getStrengthColor = () => {
    if (score <= 1) return '#ef5350'; // Red
    if (score <= 3) return '#ff9800'; // Orange
    return '#4caf50'; // Green
  };

  const getStrengthText = () => {
    if (!newPassword) return '';
    if (score <= 1) return lt('weak');
    if (score <= 3) return lt('medium');
    return lt('strong');
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success(lt('successMessage'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || lt('errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  const requirementList = [
    { label: lt('reqLength'), met: hasMinLength },
    { label: lt('reqUpper'), met: hasUpper },
    { label: lt('reqLower'), met: hasLower },
    { label: lt('reqNumber'), met: hasDigit },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          mb: 3,
          p: 0.75,
          borderRadius: 3,
          width: 'fit-content',
          maxWidth: '100%',
          bgcolor: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(0,0,0,0.04)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Button
          variant={activeSecurityView === 'password' ? 'contained' : 'text'}
          startIcon={<Lock />}
          onClick={() => setActiveSecurityView('password')}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800 }}
        >
          {lt('updatePasswordBtn')}
        </Button>
        {user?.role === 'superadmin' && (
          <Button
            variant={activeSecurityView === 'alerts' ? 'contained' : 'text'}
            color={securitySummary.critical > 0 ? 'error' : 'primary'}
            startIcon={<AdminPanelSettings />}
            onClick={() => setActiveSecurityView('alerts')}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800 }}
          >
            {lt('securityEvents')}
            {securitySummary.unread > 0 ? ` (${securitySummary.unread})` : ''}
          </Button>
        )}
      </Box>

      <Grid container spacing={4}>
        <AnimatePresence mode="wait">
          {/* Left Column: The Form */}
          {activeSecurityView === 'password' && (
            <Grid
              item
              xs={12}
              lg={7}
              component={motion.div}
              key="password-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GlassPaper>
                <Box display="flex" alignItems="center" mb={4}>
                  <Box
                    sx={{
                      p: 1.2,
                      borderRadius: 2.5,
                      background:
                        'linear-gradient(135deg, #3f51b5 0%, #2196f3 100%)',
                      color: 'white',
                      display: 'flex',
                      mr: 2,
                      boxShadow: '0 4px 20px 0 rgba(33, 150, 243, 0.3)',
                    }}
                  >
                    <Lock />
                  </Box>
                  <Typography
                    variant="h5"
                    fontWeight={850}
                    letterSpacing="-0.5px"
                  >
                    {pt('changePassword')}
                  </Typography>
                </Box>

                <form onSubmit={handleUpdatePassword}>
                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label={pt('currentPassword')}
                      type="text"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      variant="outlined"
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <VpnKey sx={{ color: 'primary.main', mr: 0.5 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              type="button"
                              onClick={() => setShowCurrent(!showCurrent)}
                              onMouseDown={(e) => e.preventDefault()}
                              edge="end"
                              size="small"
                              sx={visibilityButtonSx}
                            >
                              {showCurrent ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={passwordFieldSx(!showCurrent)}
                    />

                    <TextField
                      fullWidth
                      label={pt('newPassword')}
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      variant="outlined"
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlined
                              sx={{ color: 'primary.main', mr: 0.5 }}
                            />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              type="button"
                              onClick={() => setShowNew(!showNew)}
                              onMouseDown={(e) => e.preventDefault()}
                              edge="end"
                              size="small"
                              sx={visibilityButtonSx}
                            >
                              {showNew ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={passwordFieldSx(!showNew)}
                    />

                    <TextField
                      fullWidth
                      label={pt('confirmNewPassword')}
                      type="text"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      variant="outlined"
                      required
                      error={Boolean(
                        confirmPassword && newPassword !== confirmPassword
                      )}
                      helperText={
                        confirmPassword && newPassword !== confirmPassword
                          ? lt('mismatch')
                          : confirmPassword && newPassword === confirmPassword
                            ? lt('match')
                            : ''
                      }
                      FormHelperTextProps={{
                        sx: {
                          fontWeight: 600,
                          color:
                            confirmPassword && newPassword === confirmPassword
                              ? '#4caf50 !important'
                              : undefined,
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlined
                              sx={{ color: 'primary.main', mr: 0.5 }}
                            />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              type="button"
                              onClick={() => setShowConfirm(!showConfirm)}
                              onMouseDown={(e) => e.preventDefault()}
                              edge="end"
                              size="small"
                              sx={visibilityButtonSx}
                            >
                              {showConfirm ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={passwordFieldSx(!showConfirm, {
                        '&.Mui-focused': {
                          '& fieldset': {
                            borderColor: (theme) =>
                              confirmPassword && newPassword !== confirmPassword
                                ? theme.palette.error.main
                                : 'primary.main',
                            borderWidth: '2px',
                            boxShadow: '0 0 12px rgba(33, 150, 243, 0.25)',
                          },
                        },
                      })}
                    />

                    <Box sx={{ mt: 1.5 }}>
                      <Button
                        fullWidth
                        size="large"
                        type="submit"
                        disabled={!isFormValid || loading}
                        sx={{
                          py: 2,
                          borderRadius: 3.5,
                          fontWeight: 750,
                          textTransform: 'none',
                          fontSize: '1.05rem',
                          color: 'white !important',
                          background: isFormValid
                            ? 'linear-gradient(135deg, #3f51b5 0%, #2196f3 100%)'
                            : 'rgba(255, 255, 255, 0.12)',
                          boxShadow: isFormValid
                            ? '0 6px 20px 0 rgba(33, 150, 243, 0.35)'
                            : 'none',
                          transition: 'all 0.3s ease',
                          '&.Mui-disabled': {
                            color: 'rgba(255, 255, 255, 0.3) !important',
                            background: (theme) =>
                              theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.05)'
                                : 'rgba(0, 0, 0, 0.05)',
                          },
                          '&:hover': {
                            background: isFormValid
                              ? 'linear-gradient(135deg, #303f9f 0%, #1976d2 100%)'
                              : undefined,
                            boxShadow: isFormValid
                              ? '0 8px 25px 0 rgba(33, 150, 243, 0.45)'
                              : undefined,
                            transform: isFormValid
                              ? 'translateY(-1.5px)'
                              : 'none',
                          },
                          '&:active': {
                            transform: 'none',
                          },
                        }}
                      >
                        {loading ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          pt('update')
                        )}
                      </Button>
                    </Box>
                  </Stack>
                </form>
              </GlassPaper>
            </Grid>
          )}
        </AnimatePresence>

        {/* Right Column: Live requirements checklist & Session info */}
        <Grid
          item
          xs={12}
          md={activeSecurityView === 'alerts' ? 12 : 5}
          lg={activeSecurityView === 'alerts' ? 12 : 5}
          xl={activeSecurityView === 'alerts' ? 12 : 5}
          sx={{
            transition: 'all 0.3s ease',
            ...(activeSecurityView === 'alerts' && {
              flexBasis: '100% !important',
              maxWidth: '100% !important',
              width: '100% !important',
            }),
          }}
        >
          <Stack spacing={4}>
            <AnimatePresence mode="wait">
              {user?.role === 'superadmin' &&
                activeSecurityView === 'alerts' && (
                  <motion.div
                    key="alerts-view"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <GlassPaper
                      sx={{
                        borderColor:
                          securitySummary.critical > 0
                            ? 'rgba(244, 67, 54, 0.45)'
                            : securitySummary.unread > 0
                              ? 'rgba(255, 152, 0, 0.35)'
                              : undefined,
                      }}
                    >
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        gap={2}
                        mb={2.5}
                      >
                        <Box>
                          <Typography variant="h6" fontWeight={850}>
                            {lt('securityEvents')}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={600}
                          >
                            {lt('loginAttemptsAndBlocked')}
                          </Typography>
                        </Box>
                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          <Chip
                            size="small"
                            color={
                              securitySummary.unread ? 'warning' : 'success'
                            }
                            label={`${securitySummary.unread} ${lt('newCount')}`}
                            sx={{ fontWeight: 800 }}
                          />
                          {securitySummary.critical > 0 && (
                            <Chip
                              size="small"
                              color="error"
                              label={`${securitySummary.critical} ${sl('criticalCount')}`}
                              sx={{ fontWeight: 800 }}
                            />
                          )}
                          <Chip
                            size="small"
                            color="error"
                            variant="outlined"
                            label={`${securitySummary.blocked || 0} ${sl('blockedIps')}`}
                            sx={{ fontWeight: 800 }}
                          />
                          <Chip
                            size="small"
                            color={
                              securitySummary.highRisk || 0
                                ? 'error'
                                : 'success'
                            }
                            variant="outlined"
                            label={`${securitySummary.highRisk || 0} ${sl('highRiskEvents')}`}
                            sx={{ fontWeight: 800 }}
                          />
                        </Stack>
                      </Box>

                      {securitySummary.threatSummary?.length > 0 && (
                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                          sx={{ mb: 2 }}
                        >
                          {securitySummary.threatSummary.map((item) => (
                            <Chip
                              key={item.threat_type}
                              size="small"
                              label={`${sl(item.threat_type)}: ${item.count}`}
                              sx={{ fontWeight: 800 }}
                            />
                          ))}
                        </Stack>
                      )}
                      {securitySummary.critical > 0 && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                          {lt('criticalEventAlert')}
                        </Alert>
                      )}

                      {securityLoading ? (
                        <Box display="flex" justifyContent="center" py={3}>
                          <CircularProgress size={26} />
                        </Box>
                      ) : securityEvents.length ? (
                        <Stack spacing={1.5}>
                          <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{
                              px: 1,
                              pb: 1,
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            <Box display="flex" alignItems="center">
                              <Checkbox
                                size="small"
                                checked={
                                  securityEvents.filter((e) => !e.is_blocked)
                                    .length > 0 &&
                                  selectedEvents.length ===
                                    securityEvents.filter((e) => !e.is_blocked)
                                      .length
                                }
                                indeterminate={
                                  selectedEvents.length > 0 &&
                                  selectedEvents.length <
                                    securityEvents.filter((e) => !e.is_blocked)
                                      .length
                                }
                                onChange={handleSelectAllEvents}
                              />
                              <Typography
                                variant="caption"
                                fontWeight={600}
                                color="text.secondary"
                              >
                                {lt('selectAll')}
                              </Typography>
                            </Box>
                            {selectedEvents.length > 0 && (
                              <Button
                                size="small"
                                color="error"
                                variant="contained"
                                disabled={blockingLoading}
                                onClick={handleBlockSelectedIps}
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 800,
                                  borderRadius: 2,
                                }}
                              >
                                {blockingLoading ? (
                                  <CircularProgress size={16} color="inherit" />
                                ) : (
                                  lt('blockSelectedIps')
                                )}
                              </Button>
                            )}
                          </Box>
                          {securityEvents.map((event) => (
                            <Box
                              key={event.id}
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor:
                                  event.status === 'new'
                                    ? 'rgba(255, 152, 0, 0.28)'
                                    : 'divider',
                                bgcolor: (theme) =>
                                  theme.palette.mode === 'dark'
                                    ? 'rgba(255,255,255,0.035)'
                                    : 'rgba(0,0,0,0.025)',
                              }}
                            >
                              <Box
                                display="flex"
                                alignItems="flex-start"
                                gap={1}
                              >
                                <Checkbox
                                  size="medium"
                                  color="primary"
                                  checked={
                                    selectedEvents.includes(event.id) ||
                                    event.is_blocked
                                  }
                                  disabled={event.is_blocked}
                                  onChange={() => handleSelectEvent(event.id)}
                                  sx={{ mt: -0.5, ml: -1 }}
                                />
                                <Box flex={1}>
                                  <Box
                                    display="flex"
                                    justifyContent="space-between"
                                    gap={1}
                                  >
                                    <Typography
                                      variant="body2"
                                      fontWeight={800}
                                    >
                                      {lt(event.event_type)}
                                    </Typography>
                                    <Box display="flex" gap={1}>
                                      {event.is_blocked && (
                                        <Chip
                                          size="small"
                                          color="error"
                                          variant="outlined"
                                          label={lt('ipBlocked')}
                                          sx={{ height: 22, fontWeight: 800 }}
                                        />
                                      )}
                                      <Chip
                                        size="small"
                                        color={
                                          severityColors[event.severity] ||
                                          'default'
                                        }
                                        label={sl(event.severity)}
                                        sx={{ height: 22, fontWeight: 800 }}
                                      />
                                      <Chip
                                        size="small"
                                        color={
                                          (event.risk_score || 0) >= 75
                                            ? 'error'
                                            : (event.risk_score || 0) >= 45
                                              ? 'warning'
                                              : 'success'
                                        }
                                        variant="outlined"
                                        label={`${lt('riskScore')}: ${event.risk_score || 0}`}
                                        sx={{ height: 22, fontWeight: 800 }}
                                      />
                                    </Box>
                                  </Box>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                  >
                                    {formatSecurityDate(event.created_at)} - IP:{' '}
                                    {event.ip_address || '-'} - {lt('attempt')}:{' '}
                                    {event.attempts || 1}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                  >
                                    {getSecurityMetaLabel(
                                      lt,
                                      'location',
                                      'Location'
                                    )}
                                    : {getSecurityLocationLabel(event)}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                  >
                                    {getSecurityMetaLabel(
                                      lt,
                                      'device',
                                      'Device'
                                    )}
                                    : {getSecurityDeviceLabel(event)} -{' '}
                                    {getSecurityMetaLabel(lt, 'app', 'App')}:{' '}
                                    {getSecurityProgramLabel(event)}
                                  </Typography>
                                  {(event.threat_type ||
                                    event.action_taken) && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      {lt('threatType')}:{' '}
                                      {sl(event.threat_type)} -{' '}
                                      {lt('actionTaken')}:{' '}
                                      {sl(event.action_taken)}
                                    </Typography>
                                  )}
                                  {event.matched_signals && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                      sx={{ wordBreak: 'break-word' }}
                                    >
                                      {lt('signals')}: {event.matched_signals}
                                    </Typography>
                                  )}
                                  {event.email && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Email: {event.email}
                                    </Typography>
                                  )}
                                  {formatSecurityEventDetails(event) && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      {formatSecurityEventDetails(event)}
                                    </Typography>
                                  )}
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    flexWrap="wrap"
                                    useFlexGap
                                    sx={{ mt: 1 }}
                                  >
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      disabled={
                                        blockingLoading ||
                                        event.status === 'false_positive'
                                      }
                                      onClick={() => handleFalsePositive(event)}
                                      sx={{
                                        textTransform: 'none',
                                        fontWeight: 800,
                                      }}
                                    >
                                      {lt('falsePositive')}
                                    </Button>
                                    {event.is_blocked && event.ip_address && (
                                      <Button
                                        size="small"
                                        color="warning"
                                        variant="outlined"
                                        disabled={blockingLoading}
                                        onClick={() =>
                                          handleUnblockEventIp(event)
                                        }
                                        sx={{
                                          textTransform: 'none',
                                          fontWeight: 800,
                                        }}
                                      >
                                        {lt('unblockIp')}
                                      </Button>
                                    )}
                                  </Stack>
                                </Box>
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <Alert severity="success" sx={{ borderRadius: 2 }}>
                          {lt('noSuspiciousLoginAttempts')}
                        </Alert>
                      )}

                      <Button
                        fullWidth
                        variant="outlined"
                        disabled={!securitySummary.unread || securityLoading}
                        onClick={handleMarkSecurityRead}
                        sx={{
                          mt: 2,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 800,
                        }}
                      >
                        {lt('markAllRead')}
                      </Button>
                    </GlassPaper>
                  </motion.div>
                )}

              {activeSecurityView === 'password' && (
                <motion.div
                  key="password-reqs"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Requirements Card */}
                  <GlassPaper>
                    <Typography variant="h6" fontWeight={800} mb={2.5}>
                      {lt('requirements')}
                    </Typography>

                    {/* Password Strength indicator */}
                    {newPassword && (
                      <Box mb={3.5}>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          mb={1.2}
                        >
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            fontWeight={600}
                          >
                            {lt('passwordStrength')}:
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={800}
                            sx={{ color: getStrengthColor() }}
                          >
                            {getStrengthText()}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(score / 4) * 100}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: (theme) =>
                              theme.palette.mode === 'dark'
                                ? 'rgba(255,255,255,0.06)'
                                : 'rgba(0,0,0,0.06)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              backgroundColor: getStrengthColor(),
                              transition:
                                'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            },
                          }}
                        />
                      </Box>
                    )}

                    <Stack spacing={2}>
                      {requirementList.map((req, idx) => (
                        <Box
                          key={idx}
                          display="flex"
                          alignItems="center"
                          sx={{
                            transition: 'all 0.3s ease',
                            opacity: req.met ? 1 : 0.65,
                          }}
                        >
                          <Box
                            sx={{
                              mr: 1.8,
                              display: 'flex',
                              color: req.met ? '#4caf50' : 'text.secondary',
                              transition: 'color 0.3s ease',
                              transform: req.met ? 'scale(1.1)' : 'scale(1)',
                            }}
                          >
                            {req.met ? (
                              <CheckCircle fontSize="small" />
                            ) : (
                              <RadioButtonUnchecked fontSize="small" />
                            )}
                          </Box>
                          <Typography
                            variant="body2"
                            fontWeight={req.met ? 700 : 500}
                            sx={{
                              color: req.met
                                ? 'text.primary'
                                : 'text.secondary',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            {req.label}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </GlassPaper>

                  {/* Session Info Card */}
                  <GlassPaper>
                    <Typography variant="h6" fontWeight={800} mb={2.5}>
                      {lt('sessionInfo')}
                    </Typography>

                    <Stack spacing={2.5}>
                      <Box display="flex" alignItems="center">
                        <Box
                          sx={{
                            p: 1.2,
                            borderRadius: 2.5,
                            backgroundColor: (theme) =>
                              theme.palette.mode === 'dark'
                                ? 'rgba(255,255,255,0.04)'
                                : 'rgba(0,0,0,0.03)',
                            color: 'primary.main',
                            display: 'flex',
                            mr: 2,
                          }}
                        >
                          <Person fontSize="small" />
                        </Box>
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={500}
                          >
                            User
                          </Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {user?.name || 'Super Admin'}
                          </Typography>
                        </Box>
                      </Box>

                      <Box display="flex" alignItems="center">
                        <Box
                          sx={{
                            p: 1.2,
                            borderRadius: 2.5,
                            backgroundColor: (theme) =>
                              theme.palette.mode === 'dark'
                                ? 'rgba(255,255,255,0.04)'
                                : 'rgba(0,0,0,0.03)',
                            color: 'primary.main',
                            display: 'flex',
                            mr: 2,
                          }}
                        >
                          <AdminPanelSettings fontSize="small" />
                        </Box>
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontWeight={500}
                          >
                            {lt('userRole')}
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{
                              textTransform: 'uppercase',
                              fontSize: '0.8rem',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {user?.role || 'superadmin'}
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>

                    <Box
                      sx={{
                        mt: 3.5,
                        p: 2,
                        borderRadius: 3,
                        backgroundColor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(33, 150, 243, 0.06)'
                            : 'rgba(33, 150, 243, 0.03)',
                        border: '1px solid',
                        borderColor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(33, 150, 243, 0.15)'
                            : 'rgba(33, 150, 243, 0.08)',
                        display: 'flex',
                        alignItems: 'flex-start',
                      }}
                    >
                      <Info
                        fontSize="small"
                        sx={{
                          color: '#2196f3',
                          mr: 1.5,
                          mt: 0.2,
                        }}
                      />
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={800}
                          color="#2196f3"
                          mb={0.5}
                        >
                          {lt('securityTip')}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ lineHeight: 1.45, fontWeight: 500 }}
                        >
                          {lt('securityTipText')}
                        </Typography>
                      </Box>
                    </Box>
                  </GlassPaper>
                </motion.div>
              )}
            </AnimatePresence>
          </Stack>
        </Grid>
      </Grid>
    </motion.div>
  );
}

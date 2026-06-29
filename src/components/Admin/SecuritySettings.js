import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
  LockOutlined,
  CheckCircle,
  RadioButtonUnchecked,
  VpnKey,
  Info,
  AdminPanelSettings,
  Person,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { changePassword } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { pageT } from '../../utils/pageI18n';
import { toast } from 'react-hot-toast';

const LOCAL_TRANSLATIONS = {
  uz: {
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
  },
  ru: {
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
  },
  en: {
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
  },
  tr: {
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
  },
  tg: {
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
  },
  kz: {
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
  },
  ky: {
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
  },
  tm: {
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
  const lt = (key) =>
    LOCAL_TRANSLATIONS[lang]?.[key] || LOCAL_TRANSLATIONS['ru'][key] || key;

  // States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

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
      <Grid container spacing={4}>
        {/* Left Column: The Form */}
        <Grid item xs={12} lg={7}>
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
              <Typography variant="h5" fontWeight={850} letterSpacing="-0.5px">
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
                        <LockOutlined sx={{ color: 'primary.main', mr: 0.5 }} />
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
                        <LockOutlined sx={{ color: 'primary.main', mr: 0.5 }} />
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
                        transform: isFormValid ? 'translateY(-1.5px)' : 'none',
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

        {/* Right Column: Live requirements checklist & Session info */}
        <Grid item xs={12} lg={5}>
          <Stack spacing={4}>
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
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
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
                        color: req.met ? 'text.primary' : 'text.secondary',
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
          </Stack>
        </Grid>
      </Grid>
    </motion.div>
  );
}

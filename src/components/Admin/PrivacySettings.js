import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import {
  AdminPanelSettingsOutlined,
  BiotechOutlined,
  SecurityOutlined,
  SupportAgentOutlined,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { AdminApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const ROLES = [
  { key: 'superadmin', color: 'error', Icon: SecurityOutlined },
  { key: 'admin', color: 'primary', Icon: AdminPanelSettingsOutlined },
  { key: 'field_assistant', color: 'warning', Icon: SupportAgentOutlined },
  { key: 'researcher', color: 'success', Icon: BiotechOutlined },
];

const PRIVACY_COPY = {
  uz: {
    title: 'Maxfiylik sozlamalari',
    subtitle: "Shaxsiy maydonlarning rollar bo'yicha ko'rinishini boshqarish",
    hiddenCount: (count) => `${count} ta rolda maxfiy`,
    saved: 'Maxfiylik sozlamasi saqlandi',
    currentRole: 'Joriy rolingiz',
    hidden: 'Maxfiy',
    visible: "Ko'rinadi",
    hide: 'Yashirish',
    aria: (label) => `${label} maxfiyligi`,
    roles: {
      superadmin: {
        label: 'Superadmin',
        description: "Superadmin tizimga kirganda ko'radigan ma'lumotlar",
      },
      admin: {
        label: 'Admin',
        description: "Admin tizimga kirganda ko'radigan ma'lumotlar",
      },
      field_assistant: {
        label: 'Assistant',
        description: "Assistant tizimga kirganda ko'radigan ma'lumotlar",
      },
      researcher: {
        label: 'Izlanuvchi',
        description: "Izlanuvchi tizimga kirganda ko'radigan ma'lumotlar",
      },
    },
  },
  ru: {
    title: 'Nastroyki konfidentsialnosti',
    subtitle: 'Upravlenie vidimostyu personalnyh poley po rolyam',
    hiddenCount: (count) => `Skryto dlya roley: ${count}`,
    saved: 'Nastroyka konfidentsialnosti sohranena',
    currentRole: 'Vasha tekushchaya rol',
    hidden: 'Skryto',
    visible: 'Vidno',
    hide: 'Skryvat',
    aria: (label) => `Konfidentsialnost roli ${label}`,
    roles: {
      superadmin: {
        label: 'Superadmin',
        description: 'Dannye, kotorye vidit superadmin pri vhode v sistemu',
      },
      admin: {
        label: 'Admin',
        description: 'Dannye, kotorye vidit admin pri vhode v sistemu',
      },
      field_assistant: {
        label: 'Assistant',
        description: 'Dannye, kotorye vidit assistant pri vhode v sistemu',
      },
      researcher: {
        label: 'Issledovatel',
        description: 'Dannye, kotorye vidit issledovatel pri vhode v sistemu',
      },
    },
  },
  en: {
    title: 'Privacy Settings',
    subtitle: 'Control personal-field visibility by role',
    hiddenCount: (count) => `${count} roles hidden`,
    saved: 'Privacy setting saved',
    currentRole: 'Current role',
    hidden: 'Private',
    visible: 'Visible',
    hide: 'Hide',
    aria: (label) => `${label} privacy`,
    roles: {
      superadmin: {
        label: 'Superadmin',
        description: 'Data visible when a superadmin signs in',
      },
      admin: {
        label: 'Admin',
        description: 'Data visible when an admin signs in',
      },
      field_assistant: {
        label: 'Assistant',
        description: 'Data visible when an assistant signs in',
      },
      researcher: {
        label: 'Researcher',
        description: 'Data visible when a researcher signs in',
      },
    },
  },
  kz: {
    title: 'Құпиялық параметрлері',
    subtitle: 'Жеке өрістердің рөлдер бойынша көрінуін басқару',
    hiddenCount: (count) => `${count} рөлде құпия`,
    saved: 'Құпиялық параметрі сақталды',
    currentRole: 'Ағымдағы рөліңіз',
    hidden: 'Құпия',
    visible: 'Көрінеді',
    hide: 'Жасыру',
    aria: (label) => `${label} құпиялығы`,
    roles: {
      superadmin: {
        label: 'Суперадмин',
        description: 'Суперадмин жүйеге кіргенде көретін деректер',
      },
      admin: {
        label: 'Админ',
        description: 'Админ жүйеге кіргенде көретін деректер',
      },
      field_assistant: {
        label: 'Ассистент',
        description: 'Ассистент жүйеге кіргенде көретін деректер',
      },
      researcher: {
        label: 'Зерттеуші',
        description: 'Зерттеуші жүйеге кіргенде көретін деректер',
      },
    },
  },
  ky: {
    title: 'Купуялык жөндөөлөрү',
    subtitle: 'Жеке талаалардын ролдор боюнча көрүнүшүн башкаруу',
    hiddenCount: (count) => `${count} ролдо купуя`,
    saved: 'Купуялык жөндөөсү сакталды',
    currentRole: 'Учурдагы ролуңуз',
    hidden: 'Купуя',
    visible: 'Көрүнөт',
    hide: 'Жашыруу',
    aria: (label) => `${label} купуялыгы`,
    roles: {
      superadmin: {
        label: 'Суперадмин',
        description: 'Суперадмин системага киргенде көрө турган маалыматтар',
      },
      admin: {
        label: 'Админ',
        description: 'Админ системага киргенде көрө турган маалыматтар',
      },
      field_assistant: {
        label: 'Ассистент',
        description: 'Ассистент системага киргенде көрө турган маалыматтар',
      },
      researcher: {
        label: 'Изилдөөчү',
        description: 'Изилдөөчү системага киргенде көрө турган маалыматтар',
      },
    },
  },
  tg: {
    title: 'Tanzimoti mahfiyat',
    subtitle: 'Idorakunii namoishi maydonhoi shahsi az ruyi naqshho',
    hiddenCount: (count) => `${count} naqsh mahfi`,
    saved: 'Tanzimi mahfiyat nigoh doshta shud',
    currentRole: 'Naqshi jorii shumo',
    hidden: 'Mahfi',
    visible: 'Namoyon',
    hide: 'Pinhon kardan',
    aria: (label) => `Mahfiyati ${label}`,
    roles: {
      superadmin: {
        label: 'Superadmin',
        description: 'Malumote, ki superadmin hangomi voridshavi mebinad',
      },
      admin: {
        label: 'Admin',
        description: 'Malumote, ki admin hangomi voridshavi mebinad',
      },
      field_assistant: {
        label: 'Assistant',
        description: 'Malumote, ki assistant hangomi voridshavi mebinad',
      },
      researcher: {
        label: 'Muhakkik',
        description: 'Malumote, ki muhakkik hangomi voridshavi mebinad',
      },
    },
  },
  tm: {
    title: 'Gizlinlik sazlamalary',
    subtitle: 'Shahsy meydanlaryn rollar boyuncha gorunmegini dolandyrmak',
    hiddenCount: (count) => `${count} rolda gizlin`,
    saved: 'Gizlinlik sazlamasy saklandy',
    currentRole: 'Hazirki rolunuz',
    hidden: 'Gizlin',
    visible: 'Gorunyar',
    hide: 'Gizle',
    aria: (label) => `${label} gizlinligi`,
    roles: {
      superadmin: {
        label: 'Superadmin',
        description: 'Superadmin ulgama girende goryan maglumatlary',
      },
      admin: {
        label: 'Admin',
        description: 'Admin ulgama girende goryan maglumatlary',
      },
      field_assistant: {
        label: 'Assistent',
        description: 'Assistent ulgama girende goryan maglumatlary',
      },
      researcher: {
        label: 'Gozlegchi',
        description: 'Gozlegchi ulgama girende goryan maglumatlary',
      },
    },
  },
  tr: {
    title: 'Gizlilik Ayarlari',
    subtitle: 'Kisisel alanlarin rollere gore gorunurlugunu yonetin',
    hiddenCount: (count) => `${count} rolde gizli`,
    saved: 'Gizlilik ayari kaydedildi',
    currentRole: 'Gecerli rolunuz',
    hidden: 'Gizli',
    visible: 'Gorunur',
    hide: 'Gizle',
    aria: (label) => `${label} gizliligi`,
    roles: {
      superadmin: {
        label: 'Super yonetici',
        description: 'Super yonetici giris yaptiginda gorunen veriler',
      },
      admin: {
        label: 'Yonetici',
        description: 'Yonetici giris yaptiginda gorunen veriler',
      },
      field_assistant: {
        label: 'Asistan',
        description: 'Asistan giris yaptiginda gorunen veriler',
      },
      researcher: {
        label: 'Arastirmaci',
        description: 'Arastirmaci giris yaptiginda gorunen veriler',
      },
    },
  },
};

const getPrivacyCopy = (lang) => PRIVACY_COPY[lang] || PRIVACY_COPY.uz;

export default function PrivacySettings() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const copy = getPrivacyCopy(lang);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingRole, setSavingRole] = useState('');
  const [error, setError] = useState('');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await AdminApi.privacySettings.list();
      setSettings(
        Object.fromEntries(
          data.map((item) => [
            item.role_name,
            Boolean(item.child_data_privacy_enabled),
          ])
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = async (roleName, enabled) => {
    const previous = settings[roleName];
    setSettings((current) => ({ ...current, [roleName]: enabled }));
    setSavingRole(roleName);
    try {
      await AdminApi.privacySettings.update(roleName, enabled);
      toast.success(copy.saved);
    } catch (err) {
      setSettings((current) => ({ ...current, [roleName]: previous }));
      toast.error(err.message);
    } finally {
      setSavingRole('');
    }
  };

  const hiddenRoleCount = ROLES.filter(({ key }) => settings[key]).length;

  return (
    <Box sx={{ width: '100%', maxWidth: 980 }}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2.25, sm: 2.75 },
          mb: 2.25,
          borderRadius: 3.5,
          position: 'relative',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          borderColor: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(148, 163, 184, 0.24)'
              : 'rgba(15, 118, 110, 0.14)',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(17, 24, 39, 0.74) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(236,253,245,0.78) 100%)',
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 18px 45px rgba(0,0,0,0.26)'
              : '0 18px 45px rgba(15, 118, 110, 0.08)',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 'auto -80px -120px auto',
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'rgba(45, 212, 191, 0.18)',
            filter: 'blur(18px)',
            pointerEvents: 'none',
          },
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          gap={2}
        >
          <Stack direction="row" alignItems="center" spacing={1.75}>
            <Box
              sx={{
                width: 48,
                height: 48,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 3,
                background: 'linear-gradient(135deg, #2dd4bf 0%, #38bdf8 100%)',
                color: '#06111f',
                flexShrink: 0,
                boxShadow: '0 12px 28px rgba(45, 212, 191, 0.25)',
              }}
            >
              <SecurityOutlined />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800}>
                {copy.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {copy.subtitle}
              </Typography>
            </Box>
          </Stack>
          <Chip
            icon={<VisibilityOffOutlined />}
            label={copy.hiddenCount(hiddenRoleCount)}
            color={hiddenRoleCount ? 'primary' : 'default'}
            variant={hiddenRoleCount ? 'filled' : 'outlined'}
            sx={{
              height: 30,
              px: 0.75,
              fontWeight: 800,
              borderRadius: 999,
              position: 'relative',
              zIndex: 1,
              '& .MuiChip-icon': { fontSize: 18 },
            }}
          />
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress size={30} />
        </Box>
      ) : (
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 1, sm: 1.25 },
            borderRadius: 3.5,
            overflow: 'visible',
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(15, 23, 42, 0.58)'
                : 'rgba(255, 255, 255, 0.78)',
            borderColor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(148, 163, 184, 0.18)'
                : 'rgba(15, 118, 110, 0.12)',
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0 20px 50px rgba(0,0,0,0.22)'
                : '0 20px 50px rgba(15, 23, 42, 0.06)',
          }}
        >
          {ROLES.map(({ key, color, Icon }, index) => {
            const roleCopy = copy.roles[key] || PRIVACY_COPY.uz.roles[key];
            const { label, description } = roleCopy;
            const enabled = Boolean(settings[key]);
            const isCurrentRole = user?.role === key;
            return (
              <React.Fragment key={key}>
                {index > 0 && <Divider sx={{ my: 1, opacity: 0 }} />}
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={2}
                  sx={{
                    px: { xs: 2, sm: 2.5 },
                    py: { xs: 2, sm: 2.25 },
                    borderRadius: 2.75,
                    border: '1px solid',
                    borderColor: enabled
                      ? color + '.main'
                      : (theme) =>
                          theme.palette.mode === 'dark'
                            ? 'rgba(148, 163, 184, 0.14)'
                            : 'rgba(15, 23, 42, 0.08)',
                    borderLeftWidth: 4,
                    bgcolor: enabled ? 'action.hover' : 'background.paper',
                    boxShadow: enabled
                      ? '0 12px 28px rgba(15, 23, 42, 0.10)'
                      : '0 8px 22px rgba(15, 23, 42, 0.04)',
                    transition:
                      'background-color 160ms ease, border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 16px 32px rgba(15, 23, 42, 0.12)',
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    minWidth={0}
                  >
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 2.5,
                        bgcolor: color + '.main',
                        color: color + '.contrastText',
                        flexShrink: 0,
                        boxShadow: '0 10px 22px rgba(15, 23, 42, 0.14)',
                      }}
                    >
                      <Icon fontSize="small" />
                    </Box>
                    <Box minWidth={0}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Typography fontWeight={750}>{label}</Typography>
                        {isCurrentRole && (
                          <Chip
                            size="small"
                            label={copy.currentRole}
                            color="success"
                            variant="outlined"
                            sx={{
                              height: 24,
                              fontWeight: 800,
                              borderRadius: 999,
                            }}
                          />
                        )}
                        <Chip
                          size="small"
                          icon={
                            enabled ? (
                              <VisibilityOffOutlined />
                            ) : (
                              <VisibilityOutlined />
                            )
                          }
                          label={enabled ? copy.hidden : copy.visible}
                          color={enabled ? 'primary' : 'default'}
                          variant={enabled ? 'filled' : 'outlined'}
                          sx={{
                            height: 24,
                            fontWeight: 800,
                            borderRadius: 999,
                          }}
                        />
                      </Stack>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        mt={0.25}
                      >
                        {description}
                      </Typography>
                    </Box>
                  </Stack>
                  <Box display="flex" alignItems="center" minWidth={48}>
                    {savingRole === key ? (
                      <CircularProgress size={22} />
                    ) : (
                      <Stack alignItems="center" spacing={0.25}>
                        <Switch
                          checked={enabled}
                          color="primary"
                          onChange={(event) =>
                            handleChange(key, event.target.checked)
                          }
                          inputProps={{ 'aria-label': copy.aria(label) }}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#2dd4bf',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                              {
                                backgroundColor: '#2dd4bf',
                                opacity: 0.45,
                              },
                            '& .MuiSwitch-track': {
                              opacity: 0.28,
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ whiteSpace: 'nowrap' }}
                        >
                          {copy.hide}
                        </Typography>
                      </Stack>
                    )}
                  </Box>
                </Stack>
              </React.Fragment>
            );
          })}
        </Paper>
      )}
    </Box>
  );
}

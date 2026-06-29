import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Stack,
  Fade,
  Avatar,
  useTheme,
} from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
import {
  AdminPanelSettings,
  Science,
  Person,
  PersonOutline,
  SupportAgent,
  SmartToy,
  Forum,
  SettingsSuggest,
} from '@mui/icons-material';
import { AdminApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 24,
  background:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(145deg, rgba(15,23,42,1) 0%, rgba(11,15,25,1) 100%)'
      : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.05)'
      : '0 20px 40px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,0.5)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3, 2),
    borderRadius: 18,
  },
}));

const RoleCard = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2.5, 3),
  borderRadius: 16,
  background:
    theme.palette.mode === 'dark'
      ? 'rgba(255,255,255,0.02)'
      : 'rgba(0,0,0,0.02)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background:
      theme.palette.mode === 'dark'
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(0,0,0,0.04)',
    transform: 'translateY(-2px)',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 8px 24px rgba(0,0,0,0.2)'
        : '0 8px 24px rgba(0,0,0,0.06)',
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
  },
  [theme.breakpoints.down('md')]: {
    alignItems: 'stretch',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    borderRadius: 14,
    '&:hover': {
      transform: 'none',
    },
  },
}));

const IconWrapper = styled(Avatar)(({ theme, customcolor }) => ({
  backgroundColor: alpha(customcolor, 0.15),
  color: customcolor,
  width: 48,
  height: 48,
  borderRadius: 12,
  marginRight: theme.spacing(2),
  transition: 'all 0.3s ease',
  '.role-card:hover &': {
    transform: 'scale(1.1) rotate(5deg)',
    backgroundColor: alpha(customcolor, 0.25),
  },
  [theme.breakpoints.down('sm')]: {
    width: 42,
    height: 42,
    marginRight: theme.spacing(1.5),
  },
}));

const StyledSwitch = styled(Switch)(({ theme }) => ({
  width: 46,
  height: 26,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 1,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(20px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        opacity: 1,
        border: 0,
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
    '&.Mui-focusVisible .MuiSwitch-thumb': {
      border: '6px solid #fff',
    },
    '&.Mui-disabled .MuiSwitch-thumb': {
      color:
        theme.palette.mode === 'light'
          ? theme.palette.grey[100]
          : theme.palette.grey[600],
    },
    '&.Mui-disabled + .MuiSwitch-track': {
      opacity: theme.palette.mode === 'light' ? 0.7 : 0.3,
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 20,
    height: 20,
  },
  '& .MuiSwitch-track': {
    borderRadius: 26 / 2,
    backgroundColor: theme.palette.mode === 'light' ? '#E9E9EA' : '#39393D',
    opacity: 1,
    transition: theme.transitions.create(['background-color'], {
      duration: 500,
    }),
  },
}));

const AIChatSwitch = styled(StyledSwitch)(({ theme }) => ({
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    background: 'linear-gradient(45deg, #3B82F6, #60A5FA)',
  },
  '& .MuiSwitch-switchBase.Mui-checked .MuiSwitch-thumb': {
    color: '#fff',
  },
}));

const InternalChatSwitch = styled(StyledSwitch)(({ theme }) => ({
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    background: 'linear-gradient(45deg, #8B5CF6, #A78BFA)',
  },
  '& .MuiSwitch-switchBase.Mui-checked .MuiSwitch-thumb': {
    color: '#fff',
  },
}));

const RoleSettingsCMS = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();
  const theme = useTheme();

  const roleConfigs = {
    admin: {
      label: t('roleAdminExt'),
      icon: AdminPanelSettings,
      color: '#EF4444',
    },
    researcher: { label: t('roleResearcher'), icon: Science, color: '#3B82F6' },
    user: { label: t('roleUser'), icon: Person, color: '#10B981' },
    field_assistant: {
      label: t('roleFieldAssistant'),
      icon: SupportAgent,
      color: '#8B5CF6',
    },
    guest: { label: t('roleGuest'), icon: PersonOutline, color: '#F59E0B' },
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await AdminApi.roleSettings.list();
      setSettings(data);
      setError('');
    } catch (err) {
      setError(err.message || t('settingError'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (role_name, fieldName, currentValue) => {
    try {
      const updated = await AdminApi.roleSettings.update(role_name, {
        [fieldName]: !currentValue,
      });
      setSettings((prev) =>
        prev.map((s) => (s.role_name === role_name ? updated : s))
      );
      toast.success(
        `${roleConfigs[role_name]?.label || role_name} ${t('settingUpdated')}`
      );
    } catch (err) {
      toast.error(err.message || t('settingError'));
    }
  };

  if (loading) {
    return (
      <Box
        p={4}
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress size={48} thickness={4} sx={{ color: '#3B82F6' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Fade in={true}>
        <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Fade>
    );
  }

  const targetRoles = [
    'admin',
    'researcher',
    'user',
    'guest',
    'field_assistant',
  ];

  return (
    <Fade in={true} timeout={800}>
      <StyledPaper>
        <Box
          display="flex"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          gap={2}
          mb={1}
        >
          <Avatar
            sx={{
              bgcolor: alpha('#3B82F6', 0.1),
              color: '#3B82F6',
              width: { xs: 44, sm: 48 },
              height: { xs: 44, sm: 48 },
              borderRadius: 2,
              flexShrink: 0,
            }}
          >
            <SettingsSuggest fontSize="medium" />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h5"
              fontWeight={800}
              color={theme.palette.mode === 'dark' ? '#fff' : '#0f172a'}
              sx={{ fontSize: { xs: '1.15rem', sm: '1.5rem' } }}
            >
              {t('chatSettingsTitle')}
            </Typography>
            <Typography
              variant="body2"
              color={
                theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.6)'
                  : 'rgba(0,0,0,0.6)'
              }
              sx={{ lineHeight: 1.55 }}
            >
              {t('chatSettingsDesc')}
            </Typography>
          </Box>
        </Box>

        <Stack spacing={2} mt={{ xs: 3, sm: 5 }}>
          {settings
            .filter((s) => targetRoles.includes(s.role_name))
            .map((setting, index) => {
              const config = roleConfigs[setting.role_name] || {
                icon: Person,
                color: '#94a3b8',
                label: setting.role_name,
              };
              const RoleIcon = config.icon;

              return (
                <Fade
                  in={true}
                  timeout={500 + index * 150}
                  key={setting.role_name}
                >
                  <RoleCard className="role-card">
                    <Box display="flex" alignItems="center" minWidth={0}>
                      <IconWrapper customcolor={config.color}>
                        <RoleIcon />
                      </IconWrapper>
                      <Box>
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          color={
                            theme.palette.mode === 'dark'
                              ? '#f8fafc'
                              : '#1e293b'
                          }
                          sx={{
                            overflowWrap: 'anywhere',
                            lineHeight: 1.35,
                          }}
                        >
                          {config.label}
                        </Typography>
                        <Typography
                          variant="caption"
                          color={
                            theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.5)'
                              : 'rgba(0,0,0,0.5)'
                          }
                        >
                          {setting.role_name.replace('_', ' ').toUpperCase()}
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      display="flex"
                      gap={4}
                      alignItems="center"
                      flexWrap="wrap"
                      sx={{
                        justifyContent: { xs: 'stretch', md: 'flex-end' },
                        gap: { xs: 1.25, sm: 2, md: 4 },
                        width: { xs: '100%', md: 'auto' },
                      }}
                    >
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        sx={{
                          p: 1,
                          pr: 2,
                          borderRadius: 2,
                          flex: {
                            xs: '1 1 100%',
                            sm: '1 1 230px',
                            md: '0 0 auto',
                          },
                          minWidth: 0,
                          justifyContent: 'space-between',
                          bgcolor:
                            theme.palette.mode === 'dark'
                              ? 'rgba(0,0,0,0.2)'
                              : 'rgba(0,0,0,0.02)',
                        }}
                      >
                        <SmartToy
                          sx={{ fontSize: 20, color: '#3B82F6', ml: 1 }}
                        />
                        <FormControlLabel
                          sx={{ m: 0 }}
                          control={
                            <AIChatSwitch
                              checked={setting.ai_chat_enabled ?? true}
                              onChange={() =>
                                handleToggle(
                                  setting.role_name,
                                  'ai_chat_enabled',
                                  setting.ai_chat_enabled ?? true
                                )
                              }
                              sx={{ mr: 1, ml: 1 }}
                            />
                          }
                          label={
                            <Typography variant="body2" fontWeight={600}>
                              {t('aiChatLabel')}
                            </Typography>
                          }
                        />
                      </Box>

                      <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        sx={{
                          p: 1,
                          pr: 2,
                          borderRadius: 2,
                          flex: {
                            xs: '1 1 100%',
                            sm: '1 1 230px',
                            md: '0 0 auto',
                          },
                          minWidth: 0,
                          justifyContent: 'space-between',
                          bgcolor:
                            theme.palette.mode === 'dark'
                              ? 'rgba(0,0,0,0.2)'
                              : 'rgba(0,0,0,0.02)',
                        }}
                      >
                        <Forum sx={{ fontSize: 20, color: '#8B5CF6', ml: 1 }} />
                        <FormControlLabel
                          sx={{ m: 0 }}
                          control={
                            <InternalChatSwitch
                              checked={setting.internal_chat_enabled ?? true}
                              onChange={() =>
                                handleToggle(
                                  setting.role_name,
                                  'internal_chat_enabled',
                                  setting.internal_chat_enabled ?? true
                                )
                              }
                              sx={{ mr: 1, ml: 1 }}
                            />
                          }
                          label={
                            <Typography variant="body2" fontWeight={600}>
                              {t('internalChatLabel')}
                            </Typography>
                          }
                        />
                      </Box>
                    </Box>
                  </RoleCard>
                </Fade>
              );
            })}
        </Stack>
      </StyledPaper>
    </Fade>
  );
};

export default RoleSettingsCMS;

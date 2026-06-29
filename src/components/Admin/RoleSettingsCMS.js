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
  Divider,
} from '@mui/material';
import { AdminApi } from '../../services/api';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';

const RoleSettingsCMS = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  const roleLabels = {
    admin: t('roleAdminExt'),
    researcher: t('roleResearcher'),
    user: t('roleUser'),
    field_assistant: t('roleFieldAssistant'),
    guest: t('roleGuest'),
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
      toast.success(`${roleLabels[role_name] || role_name} ${t('settingUpdated')}`);
    } catch (err) {
      toast.error(err.message || t('settingError'));
    }
  };

  if (loading) {
    return (
      <Box p={4} textAlign="center">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Faqat bizga kerakli rollar
  const targetRoles = ['admin', 'researcher', 'user', 'guest', 'field_assistant'];

  return (
    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}>
      <Typography variant="h5" fontWeight={800} mb={1}>
        {t('chatSettingsTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        {t('chatSettingsDesc')}
      </Typography>

      <Stack spacing={3} divider={<Divider />}>
        {settings
          .filter((s) => targetRoles.includes(s.role_name))
          .map((setting) => (
            <Box
              key={setting.role_name}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {roleLabels[setting.role_name] || setting.role_name}
                </Typography>
              </Box>
              <Box display="flex" gap={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={setting.ai_chat_enabled ?? true}
                      onChange={() => handleToggle(setting.role_name, 'ai_chat_enabled', setting.ai_chat_enabled ?? true)}
                      color="primary"
                    />
                  }
                  label={t('aiChatLabel')}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={setting.internal_chat_enabled ?? true}
                      onChange={() => handleToggle(setting.role_name, 'internal_chat_enabled', setting.internal_chat_enabled ?? true)}
                      color="secondary"
                    />
                  }
                  label={t('internalChatLabel')}
                />
              </Box>
            </Box>
          ))}
      </Stack>
    </Paper>
  );
};

export default RoleSettingsCMS;

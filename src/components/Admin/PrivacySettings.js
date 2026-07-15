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

const ROLES = [
  {
    key: 'superadmin',
    label: 'Superadmin',
    description: "Superadmin tizimga kirganda ko'radigan ma'lumotlar",
    color: 'error',
    Icon: SecurityOutlined,
  },
  {
    key: 'admin',
    label: 'Admin',
    description: "Admin tizimga kirganda ko'radigan ma'lumotlar",
    color: 'primary',
    Icon: AdminPanelSettingsOutlined,
  },
  {
    key: 'field_assistant',
    label: 'Assistant',
    description: "Assistant tizimga kirganda ko'radigan ma'lumotlar",
    color: 'warning',
    Icon: SupportAgentOutlined,
  },
  {
    key: 'researcher',
    label: 'Researcher',
    description: "Researcher tizimga kirganda ko'radigan ma'lumotlar",
    color: 'success',
    Icon: BiotechOutlined,
  },
];

export default function PrivacySettings() {
  const { user } = useAuth();
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
      toast.success('Maxfiylik sozlamasi saqlandi');
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
          p: { xs: 2, sm: 2.5 },
          mb: 2,
          borderRadius: 2,
          bgcolor: 'background.paper',
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
                width: 46,
                height: 46,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                flexShrink: 0,
              }}
            >
              <SecurityOutlined />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800}>
                Maxfiylik sozlamalari
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Shaxsiy maydonlarning rollar bo'yicha ko'rinishini boshqarish
              </Typography>
            </Box>
          </Stack>
          <Chip
            icon={<VisibilityOffOutlined />}
            label={hiddenRoleCount + ' ta rolda maxfiy'}
            color={hiddenRoleCount ? 'primary' : 'default'}
            variant={hiddenRoleCount ? 'filled' : 'outlined'}
            sx={{ fontWeight: 700 }}
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
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'background.paper',
          }}
        >
          {ROLES.map(({ key, label, description, color, Icon }, index) => {
            const enabled = Boolean(settings[key]);
            const isCurrentRole = user?.role === key;
            return (
              <React.Fragment key={key}>
                {index > 0 && <Divider />}
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={2}
                  sx={{
                    px: { xs: 2, sm: 2.5 },
                    py: { xs: 2, sm: 2.25 },
                    bgcolor: enabled ? 'action.hover' : 'transparent',
                    transition: 'background-color 160ms ease',
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
                        width: 40,
                        height: 40,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 2,
                        bgcolor: color + '.main',
                        color: color + '.contrastText',
                        flexShrink: 0,
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
                            label="Joriy rolingiz"
                            color="success"
                            variant="outlined"
                            sx={{ height: 24, fontWeight: 700 }}
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
                          label={enabled ? 'Maxfiy' : "Ko'rinadi"}
                          color={enabled ? 'primary' : 'default'}
                          variant={enabled ? 'filled' : 'outlined'}
                          sx={{ height: 24, fontWeight: 700 }}
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
                          inputProps={{ 'aria-label': label + ' maxfiyligi' }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ whiteSpace: 'nowrap' }}
                        >
                          Yashirish
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

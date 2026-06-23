import React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ArrowForwardRounded,
  Lock,
  Person,
  ScienceOutlined,
  ShieldOutlined,
  Timeline,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import logo from '../../assets/morphocheck-logo.svg';
import { getLoginExperienceCopy } from '../../utils/loginExperienceI18n';

const features = [
  [ScienceOutlined, 'science'],
  [Timeline, 'analytics'],
  [ShieldOutlined, 'secure'],
];

export default function LoginExperience({
  lang,
  title,
  subtitle,
  loginLabel,
  emailLabel,
  passwordLabel,
  form,
  setForm,
  showPassword,
  setShowPassword,
  requiresVerification,
  error,
  loading,
  onSubmit,
}) {
  const theme = useTheme();
  const dark = theme.palette.mode === 'dark';
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 3 } };
  const localized = getLoginExperienceCopy(lang);

  return (
    <Box
      sx={{
        minHeight: { xs: 'calc(100vh - 64px)', md: 'calc(100vh - 72px)' },
        display: 'grid',
        placeItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        px: { xs: 2, sm: 3 },
        py: 4,
        background: dark
          ? 'radial-gradient(circle at 15% 20%,rgba(20,184,166,.15),transparent 35%),radial-gradient(circle at 85% 75%,rgba(37,99,235,.16),transparent 35%)'
          : 'radial-gradient(circle at 15% 20%,rgba(45,212,191,.18),transparent 35%),radial-gradient(circle at 85% 75%,rgba(96,165,250,.18),transparent 35%)',
      }}
    >
      {[0, 1].map((i) => (
        <Box
          key={i}
          component={motion.div}
          aria-hidden="true"
          animate={
            reduced
              ? undefined
              : { y: [0, i ? 24 : -20, 0], x: [0, i ? -14 : 16, 0] }
          }
          transition={{
            duration: 10 + i * 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          sx={{
            position: 'absolute',
            width: { xs: 230, md: 370 },
            height: { xs: 230, md: 370 },
            borderRadius: '50%',
            opacity: dark ? 0.16 : 0.25,
            background: i
              ? 'linear-gradient(135deg,#38bdf8,#2563eb)'
              : 'linear-gradient(135deg,#5eead4,#0f766e)',
            top: i ? '68%' : '-12%',
            left: i ? '78%' : '-8%',
          }}
        />
      ))}
      <Box
        component={motion.div}
        initial={reduced ? false : { opacity: 0, y: 24, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        sx={{ width: '100%', maxWidth: 1040, zIndex: 1 }}
      >
        <Paper
          elevation={0}
          sx={{
            overflow: 'hidden',
            borderRadius: { xs: 4, md: 6 },
            bgcolor: dark ? 'rgba(12,20,34,.85)' : 'rgba(255,255,255,.85)',
            backdropFilter: 'blur(28px) saturate(160%)',
            border: `1px solid ${dark ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.82)'}`,
            boxShadow: dark
              ? '0 36px 100px rgba(0,0,0,.42)'
              : '0 36px 100px rgba(15,50,70,.18)',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.08fr .92fr' },
              minHeight: { md: 610 },
            }}
          >
            <Box
              sx={{
                position: 'relative',
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                justifyContent: 'space-between',
                p: 6,
                color: '#fff',
                overflow: 'hidden',
                background:
                  'linear-gradient(145deg,#063c46 0%,#0f766e 48%,#1767a8 100%)',
              }}
            >
              <Box
                component={motion.div}
                animate={reduced ? undefined : { rotate: 360 }}
                transition={{ duration: 34, repeat: Infinity, ease: 'linear' }}
                sx={{
                  position: 'absolute',
                  width: 390,
                  height: 390,
                  border: '1px solid #ffffff2e',
                  borderRadius: '50%',
                  right: -115,
                  top: 72,
                  '&::before,&::after': {
                    content: '""',
                    position: 'absolute',
                    borderRadius: '50%',
                    background: '#5eead4',
                    boxShadow: '0 0 24px #5eead4cc',
                  },
                  '&::before': { width: 12, height: 12, top: 32, left: 72 },
                  '&::after': { width: 8, height: 8, bottom: 54, right: 38 },
                }}
              />
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ zIndex: 1 }}
              >
                <Box
                  component="img"
                  src={logo}
                  alt="MorphoCheck"
                  sx={{
                    width: 52,
                    filter: 'drop-shadow(0 8px 16px #003c4670)',
                  }}
                />
                <Box>
                  <Typography fontSize={20} fontWeight={850}>
                    MorphoCheck Pro
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: '#ffffffa8', letterSpacing: '.12em' }}
                  >
                    {localized.intelligence}
                  </Typography>
                </Box>
              </Stack>
              <Box sx={{ zIndex: 1, maxWidth: 390 }}>
                <Typography
                  variant="overline"
                  sx={{
                    color: '#99f6e4',
                    fontWeight: 800,
                    letterSpacing: '.18em',
                  }}
                >
                  {localized.eyebrow}
                </Typography>
                <Typography
                  sx={{
                    mt: 1.5,
                    fontSize: 40,
                    lineHeight: 1.08,
                    fontWeight: 850,
                    letterSpacing: '-.04em',
                  }}
                >
                  {localized.headline}
                </Typography>
                <Typography sx={{ mt: 2, color: '#ffffffb3', lineHeight: 1.7 }}>
                  {localized.description}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1.5} sx={{ zIndex: 1 }}>
                {features.map(([Icon, text]) => (
                  <Stack
                    key={text}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{
                      px: 1.5,
                      py: 1,
                      borderRadius: 3,
                      bgcolor: '#ffffff17',
                      border: '1px solid #ffffff1f',
                    }}
                  >
                    <Icon sx={{ fontSize: 17, color: '#99f6e4' }} />
                    <Typography variant="caption" fontWeight={700}>
                      {text}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
            <Box
              sx={{
                p: { xs: 3, sm: 5, md: 6 },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.3}
                sx={{ display: { md: 'none' }, mb: 4 }}
              >
                <Box
                  component="img"
                  src={logo}
                  alt="MorphoCheck"
                  sx={{ width: 44 }}
                />
                <Typography fontSize={19} fontWeight={850}>
                  MorphoCheck Pro
                </Typography>
              </Stack>
              <Box mb={4}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    mb: 2.5,
                    borderRadius: 3,
                    display: 'grid',
                    placeItems: 'center',
                    color: 'primary.main',
                    bgcolor: 'primary.lighter',
                  }}
                >
                  <Lock />
                </Box>
                <Typography variant="h4" fontWeight={850} gutterBottom>
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              </Box>
              <AnimatePresence>
                {error && (
                  <Box
                    component={motion.div}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
                      {error}
                    </Alert>
                  </Box>
                )}
              </AnimatePresence>
              <Box component="form" onSubmit={onSubmit}>
                <Stack spacing={2.5}>
                  <TextField
                    fullWidth
                    label={emailLabel}
                    value={form.email}
                    autoComplete="username"
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={fieldSx}
                  />
                  <TextField
                    fullWidth
                    label={passwordLabel}
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    autoComplete="current-password"
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
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
                            aria-label={localized.showPassword}
                            onClick={() => {
                              const next = !showPassword;
                              setShowPassword(next);
                              window.dispatchEvent(
                                new CustomEvent('robot-password-toggle', { detail: { visible: next } })
                              );
                            }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={fieldSx}
                  />
                  {requiresVerification && (
                    <TextField
                      fullWidth
                      label={localized.verification}
                      value={form.verification_code}
                      onChange={(e) =>
                        setForm({ ...form, verification_code: e.target.value })
                      }
                      inputProps={{ inputMode: 'numeric', maxLength: 6 }}
                      sx={fieldSx}
                    />
                  )}
                  <Button
                    fullWidth
                    size="large"
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    endIcon={!loading ? <ArrowForwardRounded /> : null}
                    sx={{
                      mt: 1,
                      py: 1.55,
                      borderRadius: 3,
                      background:
                        'linear-gradient(100deg,#0f766e,#167f9f,#2563eb)',
                      backgroundSize: '180%',
                      boxShadow: '0 12px 28px #0f766e3d',
                      fontSize: '1rem',
                      fontWeight: 700,
                      transition: '.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        backgroundPosition: '100%',
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      loginLabel
                    )}
                  </Button>
                  <Stack direction="row" justifyContent="center" spacing={0.8}>
                    <ShieldOutlined
                      sx={{ fontSize: 15, color: 'text.secondary' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {localized.protected}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

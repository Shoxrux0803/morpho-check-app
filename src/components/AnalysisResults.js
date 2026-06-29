// src/components/AnalysisResults.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Chip,
  Stack,
  Divider,
  Alert,
  Button,
  Paper,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import MonitorWeightOutlinedIcon from '@mui/icons-material/MonitorWeightOutlined';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import PsychologyAltOutlinedIcon from '@mui/icons-material/PsychologyAltOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import RestaurantMenuOutlinedIcon from '@mui/icons-material/RestaurantMenuOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import SportsSoccerOutlinedIcon from '@mui/icons-material/SportsSoccerOutlined';
import Face6Icon from '@mui/icons-material/Face6';
import GrowthChart from './Charts/GrowthChart';
import PersonOutline from '@mui/icons-material/PersonOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useLanguage, LANGUAGES } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useGrowthAnalytics } from '../hooks/useGrowthAnalytics';
import aiService from '../services/aiService';
import {
  canUsePermission,
  normalizeAdminPermissions,
} from '../utils/adminPermissions';
import { getPlayPreschoolAdvice } from '../utils/playPreschoolAdvice';
import { getPlayPreschoolText } from '../utils/playPreschoolI18n';

export default function AnalysisResults({
  formData,
  results,
  generatePDF,
  onContinue,
}) {
  const { t, lang } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const adminPermissions = normalizeAdminPermissions(user?.admin_permissions);
  const canShowShoulderRatio = canUsePermission(
    adminPermissions,
    'shoulder_breadth'
  );
  const canShowThighRatio = canUsePermission(
    adminPermissions,
    'thigh_circumference'
  );
  const canShowBioimpedance = canUsePermission(
    adminPermissions,
    'bioimpedance'
  );
  const canShowActivityAdvice = canUsePermission(
    adminPermissions,
    'activity_advice'
  );
  const canShowSportAdvice = canUsePermission(adminPermissions, 'sport_advice');
  const canShowPlayPreschoolAdvice = canUsePermission(
    adminPermissions,
    'play_preschool_engagement'
  );
  const canShowDetailedIndices = [
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
  ].some((key) => canUsePermission(adminPermissions, key));
  const [pdfLang, setPdfLang] = useState(lang);
  const [chartType, setChartType] = useState('height');
  const analytics = useGrowthAnalytics(formData);
  const [aiTips, setAiTips] = useState([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [assistantMode, setAssistantMode] = useState(null);
  const [assistantReplies, setAssistantReplies] = useState({});
  const [assistantLoading, setAssistantLoading] = useState(false);

  // 2) Tuzilmani normallashtirish
  const root =
    results?.data?.data ?? results?.data ?? results?.result ?? results;

  const analysis = root?.analysis ?? null;
  const advices = root?.advices ?? null;
  const playPreschoolAdvice = getPlayPreschoolAdvice(lang);
  const measurements = root?.measurements ?? null;
  const patientInfo = root?.patient_info ?? null;
  const riskFlags = root?.risk_flags ?? root?.growth_standards?.metrics ?? null;
  const progressTracking = root?.progress_tracking ?? null;

  // 3) Kerakli qiymatlar
  const zScore = analysis?.z_score;
  const bmi = analysis?.bmi;
  const idealWeight = analysis?.ideal_weight;
  const weightDiff = analysis?.weight_diff;
  const somatotype = analysis?.somatotype;
  const shoulderRatio = analysis?.shoulder_ratio;
  const thighRatio = analysis?.thigh_ratio;

  const showNum = (n, digits = 2) =>
    n == null || n === '' ? '—' : Number(Number(n).toFixed(digits));

  const cleanAdviceText = (text) => {
    if (typeof text !== 'string') return text;

    return text
      .replace(/^(?:[\u{1F300}-\u{1FAFF}\u2600-\u27BF]\uFE0F?|\u200D|\s)+/u, '')
      .replace(
        /^(?:(?:рџ|СЂСџ|РЎР‚РЎСџ|РЎСџ|Р РЏ|Р РЉ|РІР‚|вЂ|РЃ|Р†|РЉ|С—|С™|Сћ|Сџ|РЏ|Тђ|В|В|В|В|Џ|Ѓ|Њ|ў|•|‘|™|⚕|️)\S*\s*)+/,
        ''
      )
      .trim();
  };

  // BMI kategoriyasi
  let bmiCategory = null;
  let bmiChipColor = 'default';
  if (bmi != null && !Number.isNaN(Number(bmi))) {
    const v = Number(bmi);
    if (v < 18.5) {
      bmiCategory = t('bmi_underweight');
      bmiChipColor = 'warning';
    } else if (v < 25) {
      bmiCategory = t('bmi_normal');
      bmiChipColor = 'success';
    } else if (v < 30) {
      bmiCategory = t('bmi_overweight');
      bmiChipColor = 'warning';
    } else {
      bmiCategory = t('bmi_obese');
      bmiChipColor = 'error';
    }
  }

  const zScoreColor =
    zScore == null
      ? 'default'
      : Math.abs(Number(zScore)) > 1.5
        ? 'error'
        : 'success';
  const diffColor =
    weightDiff == null
      ? 'default'
      : Number(weightDiff) > 0
        ? 'error'
        : 'success';

  const fullName =
    `${patientInfo?.first_name ?? formData.firstName ?? ''} ${patientInfo?.last_name ?? formData.lastName ?? ''}`.trim();
  const regionText = formData?.region || patientInfo?.region || '';
  const districtText = formData?.district || patientInfo?.district || '';
  const mahallaText = formData?.mahalla || patientInfo?.mahalla || '';
  const ageText = patientInfo?.age ?? formData?.age ?? '—';
  const genderValue = patientInfo?.gender ?? formData?.gender;
  const age = patientInfo?.age ?? formData?.age;
  const gender = genderValue;
  const genderText =
    genderValue === 'erkak'
      ? t('male')
      : genderValue === 'ayol'
        ? t('female')
        : genderValue || '—';

  const usedHeight = measurements?.height ?? formData.height;
  const usedWeight = measurements?.weight ?? formData.weight;
  const usedChest = measurements?.chest ?? formData.chest;
  const usedHead = measurements?.head ?? formData.head;

  const noAnalysisData = !analysis && !advices;

  const riskColorMap = {
    green: {
      main: '#16a34a',
      bg: 'rgba(22, 163, 74, 0.08)',
      border: '#86efac',
    },
    yellow: {
      main: '#d97706',
      bg: 'rgba(217, 119, 6, 0.1)',
      border: '#fcd34d',
    },
    red: { main: '#dc2626', bg: 'rgba(220, 38, 38, 0.08)', border: '#fca5a5' },
    gray: {
      main: '#64748b',
      bg: 'rgba(100, 116, 139, 0.08)',
      border: '#cbd5e1',
    },
  };

  const riskEntries = riskFlags
    ? ['height', 'weight', 'bmi', 'head', 'chest']
        .map((key) => [key, riskFlags[key]])
        .filter(([, item]) => item)
    : [];

  // PDF yuklab olish — tanlangan pdfLang bilan
  const handlePdfDownload = () => {
    if (typeof generatePDF === 'function') {
      generatePDF(pdfLang);
    }
  };

  const assistantActions = [
    {
      key: 'parent',
      label: t('forParents'),
      icon: <PsychologyAltOutlinedIcon />,
      prompt:
        'Analiz natijasiga asoslanib, ota-ona uchun oddiy tilda, vahima qilmaydigan 4-5 ta aniq maslahat yozing. Tibbiy terminlarni qisqa tushuntiring.',
    },
    {
      key: 'doctor',
      label: t('clinicalNotes'),
      icon: <MedicalServicesOutlinedIcon />,
      prompt:
        'Shifokor uchun klinik izoh tayyorlang: asosiy antropometrik topilmalar, BMI/Z-score talqini, xavf omillari va kuzatuv taktikasi. Qisqa, professional formatda yozing.',
    },
    {
      key: 'nutrition',
      label: t('nutritionPlan'),
      icon: <RestaurantMenuOutlinedIcon />,
      prompt:
        "Bolaning yoshi, jinsi, BMI, Z-score va tavsiyalarga mos 7 kunlik amaliy nutrition plan tuzing. Nonushta, tushlik, kechki ovqat va foydali tamaddi g'oyalarini bering.",
    },
    {
      key: 'checkups',
      label: t('checkups'),
      icon: <FactCheckOutlinedIcon />,
      prompt:
        "Keyingi tekshiruvlar ro'yxatini tuzing: qaysi mutaxassis, qaysi laborator/instrumental tekshiruv va qachon qayta ko'rik kerakligini prioritet bo'yicha yozing.",
    },
  ];

  const buildAssistantContext = () => ({
    patient: {
      full_name: fullName,
      age,
      gender,
      region: regionText,
      district: districtText,
      mahalla: mahallaText,
      height: usedHeight,
      weight: usedWeight,
      chest: usedChest,
      head: usedHead,
    },
    analysis,
    advices,
    risk_flags: riskFlags,
    ai_predictions: root?.ai_predictions,
    progress_tracking: progressTracking,
  });

  const handleAssistantAction = async (action) => {
    setAssistantMode(action.key);
    if (assistantReplies[action.key]) return;

    setAssistantLoading(true);
    try {
      const res = await aiService.chat(
        action.prompt,
        'analysis_results',
        [],
        buildAssistantContext()
      );
      setAssistantReplies((prev) => ({
        ...prev,
        [action.key]: res?.reply || t('aiNoResponse'),
      }));
    } catch (err) {
      console.error('AI assistant action error:', err);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        t('networkError');
      setAssistantReplies((prev) => ({
        ...prev,
        [action.key]: `${t('aiAssistantError')} ${detail}`,
      }));
    } finally {
      setAssistantLoading(false);
    }
  };

  useEffect(() => {
    // Agar backenddan tayyor maslahatlar kelgan bo'lsa, ularni ishlatamiz
    if (
      root?.ai_parent_tips &&
      root.ai_parent_tips.length > 0 &&
      aiTips.length === 0
    ) {
      setAiTips(root.ai_parent_tips);
      return;
    }

    // Aks holda (masalan, eski ma'lumotlar), yangidan generatsiya qilamiz
    if (root?.ai_predictions && aiTips.length === 0) {
      const fetchTips = async () => {
        setTipsLoading(true);
        try {
          const res = await aiService.generateParentTips(
            {
              age: patientInfo?.age ?? formData?.age,
              gender: patientInfo?.gender ?? formData?.gender,
              bmi: analysis?.bmi,
              z_score: analysis?.z_score,
            },
            root.ai_predictions,
            lang
          );
          if (res?.tips && res.tips.length > 0) {
            setAiTips(res.tips);
          }
        } catch (err) {
          console.error('AI Tips error:', err);
        } finally {
          setTipsLoading(false);
        }
      };
      fetchTips();
    }
  }, [root, lang, aiTips.length]);

  // 1) Natija yo'q — moved down after hooks
  if (!results) {
    return <Alert severity="info">{t('noResult')}</Alert>;
  }

  return (
    <Box className="mc-surface-reveal" sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Profil sarlavhasi + PDF */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          justifyContent="space-between"
          flexWrap="wrap"
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <PersonOutline fontSize="large" />
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {fullName || t('userLabel')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {ageText} {t('yearsOld')}, {genderText}
                {[regionText, districtText, mahallaText].filter(Boolean).length
                  ? ` | ${[regionText, districtText, mahallaText].filter(Boolean).join(' / ')}`
                  : ''}
              </Typography>
              {(patientInfo?.birth_date || patientInfo?.examination_date) && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  {patientInfo?.birth_date &&
                    `${t('birthDateLabel')}: ${new Date(patientInfo.birth_date).toLocaleDateString(lang)}`}
                  {patientInfo?.birth_date &&
                    patientInfo?.examination_date &&
                    ' | '}
                  {patientInfo?.examination_date &&
                    `${t('examDateLabel')}: ${new Date(patientInfo.examination_date).toLocaleDateString(lang)}`}
                </Typography>
              )}
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            <FormControl size="small" sx={{ minWidth: { xs: 80, sm: 100 } }}>
              <InputLabel>{t('selectPdfLang')}</InputLabel>
              <Select
                value={pdfLang}
                label={t('selectPdfLang')}
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
              onClick={handlePdfDownload}
              variant="outlined"
              startIcon={<DownloadOutlinedIcon />}
              sx={{ borderRadius: 2 }}
            >
              {t('downloadPdf')}
            </Button>

            {onContinue && (
              <Button
                onClick={onContinue}
                variant="contained"
                startIcon={<ArrowForwardIcon />}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  fontWeight: 700,
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(90deg, #3f51b5, #00acc1)'
                      : 'linear-gradient(90deg, #1976d2, #00bcd4)',
                }}
              >
                {t('continueBtn')}
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {noAnalysisData ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t('noAnalysis')}
        </Alert>
      ) : (
        <>
          {/* Tahlil natijalari */}
          <Card
            className="mc-surface-reveal"
            elevation={2}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            <CardHeader
              avatar={<AnalyticsOutlinedIcon color="success" />}
              title={
                <Typography variant="h6" fontWeight={700}>
                  {t('analyzingResults')}
                </Typography>
              }
              sx={(theme) => ({
                background: theme.palette.success.main,
                color: theme.palette.getContrastText(
                  theme.palette.success.main
                ),
                '& .MuiCardHeader-avatar': { color: 'inherit' },
              })}
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid xs={12} md={6}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      height: '100%',
                      borderLeft: analytics?.bmi
                        ? `4px solid ${analytics.bmi.status.color}`
                        : 'none',
                    }}
                  >
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('bmiLabel')}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="h3" sx={{ lineHeight: 1.1 }}>
                          {showNum(bmi)}
                        </Typography>
                        {analytics?.bmi ? (
                          <Chip
                            label={t('status_' + analytics.bmi.status.code)}
                            sx={{
                              bgcolor: analytics.bmi.status.color,
                              color: '#fff',
                            }}
                            size="small"
                          />
                        ) : (
                          bmiCategory && (
                            <Chip
                              label={bmiCategory}
                              color={bmiChipColor}
                              size="small"
                            />
                          )
                        )}
                      </Stack>
                      {analytics?.bmi && (
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color="text.secondary"
                        >
                          Z-Score: {analytics.bmi.zScore > 0 ? '+' : ''}
                          {analytics.bmi.zScore}
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                </Grid>

                <Grid xs={12} md={6}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 2, height: '100%' }}
                  >
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('somatotypeLabel')}
                      </Typography>
                      <Typography
                        variant="h3"
                        sx={{ lineHeight: 1.1, color: 'primary.main' }}
                      >
                        {somatotype ?? '—'}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        {somatotype ? (
                          <Chip
                            size="small"
                            label={t('detected')}
                            color="primary"
                          />
                        ) : (
                          <Chip size="small" label={t('notAvailable')} />
                        )}
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              {riskEntries.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <InsightsOutlinedIcon color="error" />
                    {t('clinicalRiskSystem')}
                  </Typography>
                  <Grid container spacing={2}>
                    {riskEntries.map(([key, item]) => {
                      const palette =
                        riskColorMap[item?.risk?.level] || riskColorMap.gray;
                      return (
                        <Grid
                          key={key}
                          xs={12}
                          sm={6}
                          md={key === 'bmi' ? 4 : 2}
                        >
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 2,
                              height: '100%',
                              borderRadius: 2,
                              bgcolor: palette.bg,
                              borderColor: palette.border,
                              borderLeft: `5px solid ${palette.main}`,
                            }}
                          >
                            <Stack spacing={1}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                fontWeight={700}
                              >
                                {item.label}
                              </Typography>
                              <Typography variant="h6" fontWeight={800}>
                                {showNum(item.value, 1)}
                                {item.unit ? ` ${item.unit}` : ''}
                              </Typography>
                              <Chip
                                label={item.risk?.label || t('unknown')}
                                size="small"
                                sx={{
                                  bgcolor: palette.main,
                                  color: '#fff',
                                  fontWeight: 700,
                                }}
                              />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Z: {item.z_score ?? '—'} | P:{' '}
                                {item.percentile ?? '—'}
                              </Typography>
                              <Typography variant="caption">
                                {item.risk?.message}
                              </Typography>
                            </Stack>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              )}

              {progressTracking && (
                <Box sx={{ mt: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <ShowChartIcon color="primary" />
                    {t('progressTrackingLabel')}
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor:
                        progressTracking.trend_level === 'yellow'
                          ? 'rgba(217, 119, 6, 0.08)'
                          : 'rgba(22, 163, 74, 0.06)',
                    }}
                  >
                    {progressTracking.has_history ? (
                      <Stack spacing={2}>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={1}
                          alignItems={{ xs: 'flex-start', sm: 'center' }}
                          justifyContent="space-between"
                        >
                          <Typography variant="body1" fontWeight={700}>
                            {progressTracking.period_months
                              ? `${progressTracking.period_months} ${t('changeInMonths')}`
                              : t('compareWithPrevious')}
                          </Typography>
                          <Chip
                            label={progressTracking.trend}
                            color={
                              progressTracking.trend_level === 'yellow'
                                ? 'warning'
                                : 'success'
                            }
                            variant="outlined"
                          />
                        </Stack>
                        <Grid container spacing={2}>
                          {['height', 'weight', 'bmi', 'head', 'chest'].map(
                            (key) => {
                              const change = progressTracking.changes?.[key];
                              if (!change) return null;
                              const labels = {
                                height: t('heightLabel'),
                                weight: t('weightLabel'),
                                bmi: t('bmiLabel'),
                                head: t('headLabel'),
                                chest: t('chestLabel'),
                              };
                              return (
                                <Grid key={key} xs={6} md={2.4}>
                                  <Paper
                                    variant="outlined"
                                    sx={{ p: 1.5, borderRadius: 2 }}
                                  >
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {labels[key]}
                                    </Typography>
                                    <Typography
                                      variant="h6"
                                      fontWeight={800}
                                      color={
                                        Number(change.delta) < 0
                                          ? 'error.main'
                                          : 'success.main'
                                      }
                                    >
                                      {Number(change.delta) > 0 ? '+' : ''}
                                      {showNum(change.delta, 1)}
                                      {change.unit ? ` ${change.unit}` : ''}
                                    </Typography>
                                    {change.monthly_delta != null && (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                      >
                                        {Number(change.monthly_delta) > 0
                                          ? '+'
                                          : ''}
                                        {change.monthly_delta}/oy
                                      </Typography>
                                    )}
                                  </Paper>
                                </Grid>
                              );
                            }
                          )}
                        </Grid>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {t('noPreviousMeasurement')}
                      </Typography>
                    )}
                  </Paper>
                </Box>
              )}

              {/* Расширенный научный анализ Z-Score */}
              {analytics && (
                <Box sx={{ mt: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <InsightsOutlinedIcon color="primary" />
                    {t('whoScientificAnalysis')}
                  </Typography>
                  <Grid container spacing={2}>
                    {analytics.height && (
                      <Grid xs={12} md={4}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: `${analytics.height.status.color}05`,
                          }}
                        >
                          <Tooltip title={t('hazDesc')} arrow>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              fontWeight={700}
                              sx={{
                                cursor: 'help',
                                borderBottom: '1px dashed',
                                borderColor: 'text.disabled',
                              }}
                            >
                              {t('heightForAge')}
                            </Typography>
                          </Tooltip>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mt={1}
                          >
                            <Box>
                              <Typography variant="h5" fontWeight={800}>
                                {analytics.height.zScore > 0 ? '+' : ''}
                                {analytics.height.zScore}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: analytics.height.status.color,
                                  fontWeight: 700,
                                }}
                              >
                                {t('status_' + analytics.height.status.code)}
                              </Typography>
                            </Box>
                            <Chip
                              label={`${analytics.height.percentile}-p`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(
                              100,
                              Math.max(0, (analytics.height.zScore + 4) * 12.5)
                            )}
                            sx={{
                              mt: 1.5,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: 'rgba(0,0,0,0.05)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: analytics.height.status.color,
                              },
                            }}
                          />
                        </Paper>
                      </Grid>
                    )}
                    {analytics.weight && (
                      <Grid xs={12} md={4}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: `${analytics.weight.status.color}05`,
                          }}
                        >
                          <Tooltip title={t('wazDesc')} arrow>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              fontWeight={700}
                              sx={{
                                cursor: 'help',
                                borderBottom: '1px dashed',
                                borderColor: 'text.disabled',
                              }}
                            >
                              {t('weightForAge')}
                            </Typography>
                          </Tooltip>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mt={1}
                          >
                            <Box>
                              <Typography variant="h5" fontWeight={800}>
                                {analytics.weight.zScore > 0 ? '+' : ''}
                                {analytics.weight.zScore}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: analytics.weight.status.color,
                                  fontWeight: 700,
                                }}
                              >
                                {t('status_' + analytics.weight.status.code)}
                              </Typography>
                            </Box>
                            <Chip
                              label={`${analytics.weight.percentile}-p`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(
                              100,
                              Math.max(0, (analytics.weight.zScore + 4) * 12.5)
                            )}
                            sx={{
                              mt: 1.5,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: 'rgba(0,0,0,0.05)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: analytics.weight.status.color,
                              },
                            }}
                          />
                        </Paper>
                      </Grid>
                    )}
                    {analytics.bmi && (
                      <Grid xs={12} md={4}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: `${analytics.bmi.status.color}05`,
                          }}
                        >
                          <Tooltip title={t('bazDesc')} arrow>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              fontWeight={700}
                              sx={{
                                cursor: 'help',
                                borderBottom: '1px dashed',
                                borderColor: 'text.disabled',
                              }}
                            >
                              {t('bmiForAge')}
                            </Typography>
                          </Tooltip>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mt={1}
                          >
                            <Box>
                              <Typography variant="h5" fontWeight={800}>
                                {analytics.bmi.zScore > 0 ? '+' : ''}
                                {analytics.bmi.zScore}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: analytics.bmi.status.color,
                                  fontWeight: 700,
                                }}
                              >
                                {t('status_' + analytics.bmi.status.code)}
                              </Typography>
                            </Box>
                            <Chip
                              label={`${analytics.bmi.percentile}-p`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(
                              100,
                              Math.max(0, (analytics.bmi.zScore + 4) * 12.5)
                            )}
                            sx={{
                              mt: 1.5,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: 'rgba(0,0,0,0.05)',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: analytics.bmi.status.color,
                              },
                            }}
                          />
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid xs={12} md={6}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 2, height: '100%' }}
                  >
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('idealWeight')}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <MonitorWeightOutlinedIcon />
                        <Typography variant="h4">
                          {idealWeight == null
                            ? '—'
                            : `${showNum(idealWeight)} kg`}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid xs={12} md={6}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 2, height: '100%' }}
                  >
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {t('weightDiff')}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <InsightsOutlinedIcon
                          color={
                            diffColor === 'error'
                              ? 'error'
                              : diffColor === 'success'
                                ? 'success'
                                : 'inherit'
                          }
                        />
                        <Typography
                          variant="h4"
                          color={
                            diffColor === 'error'
                              ? 'error.main'
                              : diffColor === 'success'
                                ? 'success.main'
                                : 'text.primary'
                          }
                        >
                          {weightDiff == null
                            ? '—'
                            : `${Number(weightDiff) > 0 ? '+' : ''}${showNum(weightDiff)} kg`}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              {(canShowShoulderRatio || canShowThighRatio) && (
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  {canShowShoulderRatio && (
                    <Grid xs={12} md={6}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 2, borderRadius: 2, height: '100%' }}
                      >
                        <Stack spacing={0.5}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            {t('shoulderRatio')}
                          </Typography>
                          <Typography variant="h4">
                            {shoulderRatio ? `${shoulderRatio}%` : '???'}
                          </Typography>
                        </Stack>
                      </Paper>
                    </Grid>
                  )}
                  {canShowThighRatio && (
                    <Grid xs={12} md={6}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 2, borderRadius: 2, height: '100%' }}
                      >
                        <Stack spacing={0.5}>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            {t('thighRatio')}
                          </Typography>
                          <Typography variant="h4">
                            {thighRatio ? `${thighRatio}%` : '???'}
                          </Typography>
                        </Stack>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              )}

              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('heightLabel')}: {usedHeight ?? '—'} |{' '}
                  {t('bodyLengthLabel')}:{' '}
                  {analysis?.indices?.body_length ?? '—'} | {t('weightLabel')}:{' '}
                  {usedWeight ?? '—'} | {t('chestLabel')}: {usedChest ?? '—'} |{' '}
                  {t('headLabel')}: {usedHead ?? '—'} | {t('calfLength')}:{' '}
                  {formData.calfLength || '—'} | {t('calfCircumference')}:{' '}
                  {formData.calfCircumference || '—'} | {t('footLength')}:{' '}
                  {formData.footLength || '—'}
                </Typography>
                {canShowBioimpedance &&
                  analysis?.indices?.z_body_length != null && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {t('bodyLengthZScore')}:{' '}
                        <b>{analysis.indices.z_body_length}</b>
                      </Typography>
                    </Box>
                  )}
                {(formData.fatherHeight ||
                  formData.motherHeight ||
                  patientInfo?.father_height ||
                  patientInfo?.mother_height) && (
                  <Box
                    sx={{
                      mt: 1.5,
                      pt: 1.5,
                      borderTop: '1px dashed',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={700}
                      display="block"
                      sx={{ mb: 0.5 }}
                    >
                      {t('territorialData')} (Parents):
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      {(formData.fatherHeight ||
                        patientInfo?.father_height) && (
                        <Typography variant="caption" color="text.secondary">
                          {t('fatherHeightLabel')}:{' '}
                          <b>
                            {formData.fatherHeight ||
                              patientInfo?.father_height}{' '}
                            sm
                          </b>
                        </Typography>
                      )}
                      {(formData.motherHeight ||
                        patientInfo?.mother_height) && (
                        <Typography variant="caption" color="text.secondary">
                          {t('motherHeightLabel')}:{' '}
                          <b>
                            {formData.motherHeight ||
                              patientInfo?.mother_height}{' '}
                            sm
                          </b>
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                )}
              </Box>

              {/* Detal ko'rsatkichlar (HMAI, MII, ADI) - Faqat ro'yxatdan o'tgan mutaxassislar uchun */}
              {isAuthenticated && canShowDetailedIndices && (
                <>
                  <Typography
                    variant="h6"
                    sx={{
                      mt: 4,
                      mb: 2,
                      fontWeight: 700,
                      color: 'primary.main',
                    }}
                  >
                    {t('detailedIndices')}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid xs={12} sm={4}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          height: '100%',
                          borderLeft: '4px solid #3f51b5',
                        }}
                      >
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('hmai')}
                        </Typography>
                        <Typography variant="h5" fontWeight={700}>
                          {analysis?.indices?.hmai ?? '—'}
                        </Typography>
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{ mt: 1, fontStyle: 'italic', lineHeight: 1.2 }}
                        >
                          {analysis?.indices?.hmai_desc ?? '—'}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid xs={12} sm={4}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          height: '100%',
                          borderLeft: '4px solid #4caf50',
                        }}
                      >
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('mii')}
                        </Typography>
                        <Typography variant="h5" fontWeight={700}>
                          {analysis?.indices?.mii ?? '—'}
                        </Typography>
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{ mt: 1, fontStyle: 'italic', lineHeight: 1.2 }}
                        >
                          {analysis?.indices?.mii_desc ?? '—'}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid xs={12} sm={4}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          height: '100%',
                          borderLeft: '4px solid #ff9800',
                        }}
                      >
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('adi')}
                        </Typography>
                        <Typography variant="h5" fontWeight={700}>
                          {analysis?.indices?.adi ?? '—'}
                        </Typography>
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{ mt: 1, fontStyle: 'italic', lineHeight: 1.2 }}
                        >
                          {analysis?.indices?.adi_desc ?? '—'}
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid xs={6} md={4}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: 2 }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {t('morphologicalType')}
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {analysis?.indices?.morphological_type ?? '—'}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid xs={6} md={4}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: 2 }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {t('biologicalAgeStatus')}
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {analysis?.indices?.biological_age_status ?? '—'}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid xs={12} md={4}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 1.5, borderRadius: 2 }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {t('secularTrend')}
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {analysis?.indices?.secular_trend ?? '—'}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </>
              )}

              {/* WHO Growth Charts section */}
              {age >= 5 && age <= 19 && (
                <Box sx={{ mt: 4 }}>
                  <Divider sx={{ mb: 3 }}>
                    <Chip
                      icon={<ShowChartIcon />}
                      label={t('growthChartsTitle')}
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 700, px: 2 }}
                    />
                  </Divider>

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mb: 2, justifyContent: 'center' }}
                  >
                    <Button
                      variant={
                        chartType === 'height' ? 'contained' : 'outlined'
                      }
                      onClick={() => setChartType('height')}
                      size="small"
                      sx={{ borderRadius: 5 }}
                    >
                      {t('showHeightChart')}
                    </Button>
                    <Button
                      variant={
                        chartType === 'weight' ? 'contained' : 'outlined'
                      }
                      onClick={() => setChartType('weight')}
                      size="small"
                      sx={{ borderRadius: 5 }}
                    >
                      Vazn grafigi
                    </Button>
                    <Button
                      variant={chartType === 'bmi' ? 'contained' : 'outlined'}
                      onClick={() => setChartType('bmi')}
                      size="small"
                      sx={{ borderRadius: 5 }}
                    >
                      {t('showBmiChart')}
                    </Button>
                  </Stack>

                  <Paper
                    variant="outlined"
                    sx={{
                      p: { xs: 1, md: 3 },
                      borderRadius: 4,
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.02)'
                          : 'rgba(0,0,0,0.03)',
                      borderStyle: 'dashed',
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      align="center"
                      fontWeight={600}
                      gutterBottom
                    >
                      {chartType === 'height'
                        ? t('heightForAgeChart')
                        : chartType === 'weight'
                          ? "Vazn o'sishi grafigi (Weight-for-age)"
                          : t('bmiForAgeChart')}
                    </Typography>

                    <GrowthChart
                      gender={gender}
                      age={age}
                      type={chartType}
                      value={
                        chartType === 'height'
                          ? usedHeight
                          : chartType === 'weight'
                            ? usedWeight
                            : bmi
                      }
                    />

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        mt: 2,
                        display: 'block',
                        px: 2,
                        textAlign: 'center',
                      }}
                    >
                      {chartType === 'height'
                        ? "Ushbu grafik balandlikning yoshga nisbatan me'yorlarini (SDS) ko'rsatadi. Yashil chiziq - median (o'rtacha)."
                        : chartType === 'weight'
                          ? "Vazn grafigi WHO bo'y va BMI egri chiziqlaridan chiqarilgan taxminiy norma koridorlarini ko'rsatadi."
                          : "BMI grafigi tana vazni indeksining yoshga nisbatan o'zgarishini ko'rsatadi."}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* AI Prognostik Tahlil */}
          {root?.ai_predictions && (
            <Card
              className="mc-surface-reveal"
              elevation={2}
              sx={{
                '--mc-delay': '90ms',
                mb: 3,
                borderRadius: 2,
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(145deg, #1e1e1e, #2d2d2d)'
                    : 'linear-gradient(145deg, #f8f9fa, #ffffff)',
              }}
            >
              <CardHeader
                avatar={<InsightsOutlinedIcon />}
                title={
                  <Typography variant="h6" fontWeight={700}>
                    {t('aiPrognosticTitle')}
                  </Typography>
                }
                sx={{
                  background: 'linear-gradient(90deg, #6a1b9a, #8e24aa)',
                  color: '#fff',
                  '& .MuiCardHeader-avatar': { color: 'inherit' },
                }}
              />
              <CardContent>
                <Grid container spacing={3}>
                  {age < 18 && (
                    <Grid item xs={12} md={4}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 3,
                          borderRadius: 3,
                          height: '100%',
                          textAlign: 'center',
                          borderColor: '#8e24aa',
                          borderWidth: 2,
                          boxShadow: '0 4px 15px rgba(142,36,170,0.1)',
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          sx={{
                            mb: 1,
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                          }}
                        >
                          {t('estimatedAdultHeight')}
                        </Typography>
                        <Typography
                          variant="h2"
                          sx={{ color: '#8e24aa', fontWeight: 800, mb: 1 }}
                        >
                          {root.ai_predictions.adult_height_prediction}{' '}
                          <Typography component="span" variant="h5">
                            sm
                          </Typography>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t('estimatedAdultHeightDesc')}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}

                  <Grid item xs={12} md={age < 18 ? 8 : 12}>
                    <Paper
                      variant="outlined"
                      sx={{ p: 3, borderRadius: 3, height: '100%' }}
                    >
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                        {t('healthRiskTitle')}
                      </Typography>

                      <Box sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="body2" fontWeight={600}>
                            {t('obesityRisk')}
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={800}
                            color={
                              root.ai_predictions.risks.obesity_risk > 50
                                ? 'error.main'
                                : 'text.primary'
                            }
                          >
                            {root.ai_predictions.risks.obesity_risk}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={root.ai_predictions.risks.obesity_risk}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'rgba(0,0,0,0.05)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor:
                                root.ai_predictions.risks.obesity_risk > 50
                                  ? '#e53935'
                                  : root.ai_predictions.risks.obesity_risk > 25
                                    ? '#ff9800'
                                    : '#43a047',
                            },
                          }}
                        />
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="body2" fontWeight={600}>
                            {t('metabolicRisk')}
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={800}
                            color={
                              root.ai_predictions.risks
                                .metabolic_syndrome_risk > 50
                                ? 'error.main'
                                : 'text.primary'
                            }
                          >
                            {root.ai_predictions.risks.metabolic_syndrome_risk}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={
                            root.ai_predictions.risks.metabolic_syndrome_risk
                          }
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'rgba(0,0,0,0.05)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor:
                                root.ai_predictions.risks
                                  .metabolic_syndrome_risk > 50
                                  ? '#e53935'
                                  : root.ai_predictions.risks
                                        .metabolic_syndrome_risk > 25
                                    ? '#ff9800'
                                    : '#43a047',
                            },
                          }}
                        />
                      </Box>

                      <Box>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="body2" fontWeight={600}>
                            {t('musculoskeletalRisk')}
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight={800}
                            color={
                              root.ai_predictions.risks.musculoskeletal_risk >
                              50
                                ? 'error.main'
                                : 'text.primary'
                            }
                          >
                            {root.ai_predictions.risks.musculoskeletal_risk}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={root.ai_predictions.risks.musculoskeletal_risk}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'rgba(0,0,0,0.05)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor:
                                root.ai_predictions.risks.musculoskeletal_risk >
                                50
                                  ? '#e53935'
                                  : root.ai_predictions.risks
                                        .musculoskeletal_risk > 25
                                    ? '#ff9800'
                                    : '#43a047',
                            },
                          }}
                        />
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Analysis-linked AI Assistant */}
          <Card
            className="mc-surface-reveal"
            elevation={2}
            sx={{
              '--mc-delay': '120ms',
              mb: 3,
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <CardHeader
              avatar={<PsychologyAltOutlinedIcon sx={{ color: '#5b21b6' }} />}
              title={
                <Typography variant="h6" fontWeight={700}>
                  AI doctor assistant
                </Typography>
              }
              subheader="Analiz natijasiga bog'langan klinik yordamchi"
              sx={{
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(91,33,182,0.18)'
                    : '#f5f3ff',
              }}
            />
            <CardContent>
              <Grid container spacing={1.5}>
                {assistantActions.map((action) => (
                  <Grid item xs={12} sm={6} md={3} key={action.key}>
                    <Button
                      fullWidth
                      variant={
                        assistantMode === action.key ? 'contained' : 'outlined'
                      }
                      startIcon={action.icon}
                      onClick={() => handleAssistantAction(action)}
                      disabled={assistantLoading}
                      sx={{
                        justifyContent: 'flex-start',
                        minHeight: 44,
                        borderRadius: 2,
                      }}
                    >
                      {action.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>

              {(assistantMode || assistantLoading) && (
                <Paper
                  variant="outlined"
                  sx={{
                    mt: 2,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.03)'
                        : '#fbfbff',
                  }}
                >
                  {assistantLoading && !assistantReplies[assistantMode] ? (
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        AI analiz natijasini o'qiyapti...
                      </Typography>
                      <LinearProgress />
                    </Box>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: 'pre-line', lineHeight: 1.75 }}
                    >
                      {assistantReplies[assistantMode]}
                    </Typography>
                  )}
                </Paper>
              )}
            </CardContent>
          </Card>

          {/* AI Parent Tips */}
          {(tipsLoading || aiTips.length > 0) && (
            <Card
              className="mc-surface-reveal"
              elevation={2}
              sx={{
                '--mc-delay': '150ms',
                mb: 3,
                borderRadius: 2,
                border: '1px solid #e0f2f1',
                overflow: 'hidden',
              }}
            >
              <CardHeader
                avatar={
                  <TipsAndUpdatesOutlinedIcon sx={{ color: '#00897b' }} />
                }
                title={
                  <Typography variant="h6" fontWeight={700} color="#004d40">
                    {t('parentTipsTitle')}
                  </Typography>
                }
                sx={{ bgcolor: '#e0f2f1' }}
              />
              <CardContent>
                {tipsLoading ? (
                  <LinearProgress
                    sx={{
                      my: 2,
                      borderRadius: 1,
                      bgcolor: '#b2dfdb',
                      '& .MuiLinearProgress-bar': { bgcolor: '#00897b' },
                    }}
                  />
                ) : (
                  <Stack spacing={2}>
                    {aiTips.map((tip, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 2,
                          borderRadius: 3,
                          bgcolor: (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(0,137,123,0.1)'
                              : '#f1f8f7',
                          border: '1px solid rgba(0,137,123,0.1)',
                        }}
                      >
                        <Box
                          sx={{
                            minWidth: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: '#00897b',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem',
                            fontWeight: 900,
                            boxShadow: '0 2px 8px rgba(0,137,123,0.3)',
                          }}
                        >
                          {idx + 1}
                        </Box>
                        <Typography
                          variant="body1"
                          fontWeight={600}
                          color="text.primary"
                        >
                          {tip}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tavsiyalar */}
          <Card
            className="mc-surface-reveal"
            elevation={2}
            sx={{ '--mc-delay': '180ms', mb: 3, borderRadius: 2 }}
          >
            <CardHeader
              avatar={<TipsAndUpdatesOutlinedIcon />}
              title={
                <Typography variant="h6" fontWeight={700}>
                  {t('advices')}
                </Typography>
              }
              sx={(theme) => ({
                background: theme.palette.primary.main,
                color: theme.palette.getContrastText(
                  theme.palette.primary.main
                ),
                '& .MuiCardHeader-avatar': { color: 'inherit' },
              })}
            />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('generalAdvice')}
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5 }}>
                  {cleanAdviceText(advices?.general) || '—'}
                </Typography>
              </Box>

              {canShowPlayPreschoolAdvice && advices?.play_preschool && (
                <Box
                  sx={(theme) => ({
                    mb: 3,
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: 3,
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid',
                    borderColor:
                      theme.palette.mode === 'dark'
                        ? 'rgba(94, 234, 212, 0.26)'
                        : 'rgba(13, 148, 136, 0.22)',
                    background:
                      theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(15, 118, 110, 0.34), rgba(30, 41, 59, 0.6))'
                        : 'linear-gradient(135deg, #ecfeff 0%, #f0fdf4 52%, #eff6ff 100%)',
                  })}
                >
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box
                      sx={{
                        display: 'grid',
                        placeItems: 'center',
                        width: 42,
                        height: 42,
                        borderRadius: 2.5,
                        color: '#fff',
                        background: 'linear-gradient(135deg, #0f766e, #0284c7)',
                        boxShadow: '0 8px 18px rgba(14, 116, 144, 0.24)',
                      }}
                    >
                      <Face6Icon />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={800}>
                        {getPlayPreschoolText(lang, 'title')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {playPreschoolAdvice.plan}
                      </Typography>
                    </Box>
                  </Stack>

                  <Typography variant="body2" sx={{ mt: 2, lineHeight: 1.65 }}>
                    {cleanAdviceText(advices?.play_preschool)}
                  </Typography>

                  <Divider
                    sx={{ my: 2, borderColor: 'rgba(13, 148, 136, 0.18)' }}
                  />

                  <Grid container spacing={1.25}>
                    {playPreschoolAdvice.tips.map((tip, index) => (
                      <Grid key={tip} item xs={12} md={6}>
                        <Stack
                          direction="row"
                          spacing={1.25}
                          alignItems="flex-start"
                          sx={{
                            height: '100%',
                            p: 1.25,
                            borderRadius: 2,
                            bgcolor: (theme) =>
                              theme.palette.mode === 'dark'
                                ? 'rgba(255,255,255,0.055)'
                                : 'rgba(255,255,255,0.72)',
                          }}
                        >
                          <Box
                            sx={{
                              flex: '0 0 auto',
                              width: 25,
                              height: 25,
                              borderRadius: '50%',
                              display: 'grid',
                              placeItems: 'center',
                              mt: 0.1,
                              color: '#0f766e',
                              bgcolor: 'rgba(20, 184, 166, 0.14)',
                              fontSize: 12,
                              fontWeight: 800,
                            }}
                          >
                            {index + 1}
                          </Box>
                          <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
                            {tip}
                          </Typography>
                        </Stack>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              <Grid container spacing={3}>
                {[
                  {
                    key: 'sport',
                    title: t('sportAdvice'),
                    icon: <SportsSoccerOutlinedIcon />,
                  },
                  { key: 'specialist', title: t('specialist') },
                  { key: 'nutrition', title: t('nutrition') },
                  { key: 'activity', title: t('activity') },
                  { key: 'checkups', title: t('checkups') },
                ]
                  .filter(({ key }) => {
                    if (key === 'activity') return canShowActivityAdvice;
                    if (key === 'sport') return canShowSportAdvice;
                    return true;
                  })
                  .map(({ key, title, icon }) => (
                    <Grid key={key} item xs={12} md={6}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 2, borderRadius: 2, height: '100%' }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ mb: 1 }}
                        >
                          {icon}
                          <Typography variant="subtitle1" fontWeight={600}>
                            {title}
                          </Typography>
                        </Stack>
                        <Typography variant="body2">
                          {cleanAdviceText(advices?.[key]) || '—'}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
              </Grid>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ mt: 4, alignItems: { xs: 'stretch', sm: 'center' } }}
              >
                <FormControl
                  size="small"
                  sx={{ minWidth: { xs: 80, sm: 100 } }}
                >
                  <InputLabel>{t('selectPdfLang')}</InputLabel>
                  <Select
                    value={pdfLang}
                    label={t('selectPdfLang')}
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
                  onClick={handlePdfDownload}
                  variant="outlined"
                  startIcon={<DownloadOutlinedIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  {t('downloadPdf')}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {onContinue && (
            <Box
              sx={{ mt: 4, mb: 6, display: 'flex', justifyContent: 'center' }}
            >
              <Button
                onClick={onContinue}
                variant="contained"
                size="large"
                startIcon={<ArrowForwardIcon />}
                sx={{
                  borderRadius: 4,
                  px: 8,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.info.main} 100%)`,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
                  },
                }}
              >
                {t('continueBtn')}
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

// src/components/AnalysisResults.jsx
import React, { useState } from "react";
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
  Rating,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import MonitorWeightOutlinedIcon from "@mui/icons-material/MonitorWeightOutlined";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";
import ShowChartIcon from '@mui/icons-material/ShowChart';
import GrowthChart from "./Charts/GrowthChart";
import PersonOutline from "@mui/icons-material/PersonOutline";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useLanguage, LANGUAGES } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useGrowthAnalytics } from "../hooks/useGrowthAnalytics";

export default function AnalysisResults({
  formData,
  results,
  generatePDF,
  onContinue,
}) {
  const { t, lang } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [pdfLang, setPdfLang] = useState(lang);
  const [chartType, setChartType] = useState('height');
  const analytics = useGrowthAnalytics(formData);

  // 1) Natija yo'q
  if (!results) {
    return <Alert severity="info">{t("noResult")}</Alert>;
  }

  // 2) Tuzilmani normallashtirish
  const root =
    results?.data?.data ??
    results?.data ??
    results?.result ??
    results;

  const analysis = root?.analysis ?? null;
  const advices = root?.advices ?? null;
  const measurements = root?.measurements ?? null;
  const patientInfo = root?.patient_info ?? null;

  // 3) Kerakli qiymatlar
  const zScore = analysis?.z_score;
  const bmi = analysis?.bmi;
  const idealWeight = analysis?.ideal_weight;
  const weightDiff = analysis?.weight_diff;
  const somatotype = analysis?.somatotype;
  const shoulderRatio = analysis?.shoulder_ratio;
  const thighRatio = analysis?.thigh_ratio;

  const showNum = (n, digits = 2) =>
    n == null || n === "" ? "—" : Number(Number(n).toFixed(digits));

  // BMI kategoriyasi
  let bmiCategory = null;
  let bmiChipColor = "default";
  if (bmi != null && !Number.isNaN(Number(bmi))) {
    const v = Number(bmi);
    if (v < 18.5) { bmiCategory = t("bmi_underweight"); bmiChipColor = "warning"; }
    else if (v < 25) { bmiCategory = t("bmi_normal"); bmiChipColor = "success"; }
    else if (v < 30) { bmiCategory = t("bmi_overweight"); bmiChipColor = "warning"; }
    else { bmiCategory = t("bmi_obese"); bmiChipColor = "error"; }
  }

  const zScoreColor = zScore == null ? "default" : Math.abs(Number(zScore)) > 1.5 ? "error" : "success";
  const diffColor = weightDiff == null ? "default" : Number(weightDiff) > 0 ? "error" : "success";

  const fullName = `${patientInfo?.first_name ?? formData.firstName ?? ""} ${patientInfo?.last_name ?? formData.lastName ?? ""}`.trim();
  const regionText = formData?.region || patientInfo?.region || "";
  const ageText = patientInfo?.age ?? formData?.age ?? "—";
  const genderValue = patientInfo?.gender ?? formData?.gender;
  const age = patientInfo?.age ?? formData?.age;
  const gender = genderValue;
  const genderText = genderValue === "erkak" ? t("male") : genderValue === "ayol" ? t("female") : (genderValue || "—");

  const usedHeight = measurements?.height ?? formData.height;
  const usedWeight = measurements?.weight ?? formData.weight;
  const usedChest = measurements?.chest ?? formData.chest;
  const usedHead = measurements?.head ?? formData.head;

  const noAnalysisData = !analysis && !advices;

  // PDF yuklab olish — tanlangan pdfLang bilan
  const handlePdfDownload = () => {
    if (typeof generatePDF === "function") {
      generatePDF(pdfLang);
    }
  };



  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
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
                {fullName || t("userLabel")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {ageText} {t("yearsOld")}, {genderText}
                {regionText ? ` | ${regionText}` : ""}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>{t("selectPdfLang")}</InputLabel>
              <Select
                value={pdfLang}
                label={t("selectPdfLang")}
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
              {t("downloadPdf")}
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
                  background: theme => theme.palette.mode === 'dark' ? 'linear-gradient(90deg, #3f51b5, #00acc1)' : 'linear-gradient(90deg, #1976d2, #00bcd4)'
                }}
              >
                {t("continueBtn")}
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {noAnalysisData ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t("noAnalysis")}
        </Alert>
      ) : (
        <>
          {/* Tahlil natijalari */}
          <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
            <CardHeader
              avatar={<AnalyticsOutlinedIcon color="success" />}
              title={<Typography variant="h6" fontWeight={700}>{t("analyzingResults")}</Typography>}
              sx={(theme) => ({
                background: theme.palette.success.main,
                color: theme.palette.getContrastText(theme.palette.success.main),
                "& .MuiCardHeader-avatar": { color: "inherit" },
              })}
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%", borderLeft: analytics?.bmi ? `4px solid ${analytics.bmi.status.color}` : 'none' }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" color="text.secondary">{t("bmiLabel")}</Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="h3" sx={{ lineHeight: 1.1 }}>{showNum(bmi)}</Typography>
                        {analytics?.bmi ? (
                          <Chip label={t("status_" + analytics.bmi.status.code)} sx={{ bgcolor: analytics.bmi.status.color, color: "#fff" }} size="small" />
                        ) : (
                          bmiCategory && <Chip label={bmiCategory} color={bmiChipColor} size="small" />
                        )}
                      </Stack>
                      {analytics?.bmi && (
                        <Typography variant="caption" fontWeight={700} color="text.secondary">
                          Z-Score: {analytics.bmi.zScore > 0 ? '+' : ''}{analytics.bmi.zScore}
                        </Typography>
                      )}
                    </Stack>
                  </Paper>
                </Grid>

                <Grid xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" color="text.secondary">{t("somatotypeLabel")}</Typography>
                      <Typography variant="h3" sx={{ lineHeight: 1.1, color: "primary.main" }}>
                        {somatotype ?? "—"}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        {somatotype ? (
                          <Chip size="small" label={t("detected")} color="primary" />
                        ) : (
                          <Chip size="small" label={t("notAvailable")} />
                        )}
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              {/* Расширенный научный анализ Z-Score */}
              {analytics && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InsightsOutlinedIcon color="primary" />
                    {t("whoScientificAnalysis")}
                  </Typography>
                  <Grid container spacing={2}>
                    {analytics.height && (
                      <Grid xs={12} md={4}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: `${analytics.height.status.color}05` }}>
                          <Tooltip title={t("hazDesc")} arrow>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ cursor: 'help', borderBottom: '1px dashed', borderColor: 'text.disabled' }}>
                              {t("heightForAge")}
                            </Typography>
                          </Tooltip>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                            <Box>
                              <Typography variant="h5" fontWeight={800}>{analytics.height.zScore > 0 ? '+' : ''}{analytics.height.zScore}</Typography>
                              <Typography variant="caption" sx={{ color: analytics.height.status.color, fontWeight: 700 }}>
                                {t("status_" + analytics.height.status.code)}
                              </Typography>
                            </Box>
                            <Chip label={`${analytics.height.percentile}-p`} size="small" variant="outlined" />
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min(100, Math.max(0, (analytics.height.zScore + 4) * 12.5))} 
                            sx={{ mt: 1.5, height: 6, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.05)', "& .MuiLinearProgress-bar": { bgcolor: analytics.height.status.color } }}
                          />
                        </Paper>
                      </Grid>
                    )}
                    {analytics.weight && (
                      <Grid xs={12} md={4}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: `${analytics.weight.status.color}05` }}>
                          <Tooltip title={t("wazDesc")} arrow>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ cursor: 'help', borderBottom: '1px dashed', borderColor: 'text.disabled' }}>
                              {t("weightForAge")}
                            </Typography>
                          </Tooltip>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                            <Box>
                              <Typography variant="h5" fontWeight={800}>{analytics.weight.zScore > 0 ? '+' : ''}{analytics.weight.zScore}</Typography>
                              <Typography variant="caption" sx={{ color: analytics.weight.status.color, fontWeight: 700 }}>
                                {t("status_" + analytics.weight.status.code)}
                              </Typography>
                            </Box>
                            <Chip label={`${analytics.weight.percentile}-p`} size="small" variant="outlined" />
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min(100, Math.max(0, (analytics.weight.zScore + 4) * 12.5))} 
                            sx={{ mt: 1.5, height: 6, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.05)', "& .MuiLinearProgress-bar": { bgcolor: analytics.weight.status.color } }}
                          />
                        </Paper>
                      </Grid>
                    )}
                    {analytics.bmi && (
                      <Grid xs={12} md={4}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: `${analytics.bmi.status.color}05` }}>
                          <Tooltip title={t("bazDesc")} arrow>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ cursor: 'help', borderBottom: '1px dashed', borderColor: 'text.disabled' }}>
                              {t("bmiForAge")}
                            </Typography>
                          </Tooltip>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                            <Box>
                              <Typography variant="h5" fontWeight={800}>{analytics.bmi.zScore > 0 ? '+' : ''}{analytics.bmi.zScore}</Typography>
                              <Typography variant="caption" sx={{ color: analytics.bmi.status.color, fontWeight: 700 }}>
                                {t("status_" + analytics.bmi.status.code)}
                              </Typography>
                            </Box>
                            <Chip label={`${analytics.bmi.percentile}-p`} size="small" variant="outlined" />
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min(100, Math.max(0, (analytics.bmi.zScore + 4) * 12.5))} 
                            sx={{ mt: 1.5, height: 6, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.05)', "& .MuiLinearProgress-bar": { bgcolor: analytics.bmi.status.color } }}
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
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2" color="text.secondary">{t("idealWeight")}</Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <MonitorWeightOutlinedIcon />
                        <Typography variant="h4">
                          {idealWeight == null ? "—" : `${showNum(idealWeight)} kg`}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2" color="text.secondary">{t("weightDiff")}</Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <InsightsOutlinedIcon
                          color={diffColor === "error" ? "error" : diffColor === "success" ? "success" : "inherit"}
                        />
                        <Typography
                          variant="h4"
                          color={diffColor === "error" ? "error.main" : diffColor === "success" ? "success.main" : "text.primary"}
                        >
                          {weightDiff == null ? "—" : `${Number(weightDiff) > 0 ? "+" : ""}${showNum(weightDiff)} kg`}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2" color="text.secondary">{t("shoulderRatio")}</Typography>
                      <Typography variant="h4">{shoulderRatio ? `${shoulderRatio}%` : "—"}</Typography>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2" color="text.secondary">{t("thighRatio")}</Typography>
                      <Typography variant="h4">{thighRatio ? `${thighRatio}%` : "—"}</Typography>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  {t("heightLabel")}: {usedHeight ?? "—"} | {t("bodyLengthLabel")}: {analysis?.indices?.body_length ?? "—"} | {t("weightLabel")}: {usedWeight ?? "—"} | {t("chestLabel")}:{" "}
                  {usedChest ?? "—"} | {t("headLabel")}: {usedHead ?? "—"} | {t("calfLength")}: {formData.calfLength || "—"} | {t("calfCircumference")}: {formData.calfCircumference || "—"} | {t("footLength")}: {formData.footLength || "—"}
                </Typography>
                {analysis?.indices?.z_body_length != null && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t("bodyLengthZScore")}: <b>{analysis.indices.z_body_length}</b>
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Detal ko'rsatkichlar (HMAI, MII, ADI) - Faqat ro'yxatdan o'tgan mutaxassislar uchun */}
              {isAuthenticated && (
                <>
                  <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 700, color: 'primary.main' }}>
                    {t("detailedIndices")}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid xs={12} sm={4}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%", borderLeft: '4px solid #3f51b5' }}>
                        <Typography variant="subtitle2" color="text.secondary">{t("hmai")}</Typography>
                        <Typography variant="h5" fontWeight={700}>{analysis?.indices?.hmai ?? "—"}</Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic', lineHeight: 1.2 }}>
                          {analysis?.indices?.hmai_desc ?? "—"}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid xs={12} sm={4}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%", borderLeft: '4px solid #4caf50' }}>
                        <Typography variant="subtitle2" color="text.secondary">{t("mii")}</Typography>
                        <Typography variant="h5" fontWeight={700}>{analysis?.indices?.mii ?? "—"}</Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic', lineHeight: 1.2 }}>
                          {analysis?.indices?.mii_desc ?? "—"}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid xs={12} sm={4}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%", borderLeft: '4px solid #ff9800' }}>
                        <Typography variant="subtitle2" color="text.secondary">{t("adi")}</Typography>
                        <Typography variant="h5" fontWeight={700}>{analysis?.indices?.adi ?? "—"}</Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic', lineHeight: 1.2 }}>
                          {analysis?.indices?.adi_desc ?? "—"}
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid xs={6} md={4}>
                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block">{t("morphologicalType")}</Typography>
                        <Typography variant="body2" fontWeight={600}>{analysis?.indices?.morphological_type ?? "—"}</Typography>
                      </Paper>
                    </Grid>
                    <Grid xs={6} md={4}>
                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block">{t("biologicalAgeStatus")}</Typography>
                        <Typography variant="body2" fontWeight={600}>{analysis?.indices?.biological_age_status ?? "—"}</Typography>
                      </Paper>
                    </Grid>
                    <Grid xs={12} md={4}>
                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block">{t("secularTrend")}</Typography>
                        <Typography variant="body2" fontWeight={600}>{analysis?.indices?.secular_trend ?? "—"}</Typography>
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
                      label={t("growthChartsTitle")} 
                      color="primary" 
                      variant="outlined" 
                      sx={{ fontWeight: 700, px: 2 }}
                    />
                  </Divider>

                  <Stack direction="row" spacing={1} sx={{ mb: 2, justifyContent: 'center' }}>
                    <Button 
                      variant={chartType === 'height' ? 'contained' : 'outlined'} 
                      onClick={() => setChartType('height')}
                      size="small"
                      sx={{ borderRadius: 5 }}
                    >
                      {t("showHeightChart")}
                    </Button>
                    <Button 
                      variant={chartType === 'bmi' ? 'contained' : 'outlined'} 
                      onClick={() => setChartType('bmi')}
                      size="small"
                      sx={{ borderRadius: 5 }}
                    >
                      {t("showBmiChart")}
                    </Button>
                  </Stack>

                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: { xs: 1, md: 3 }, 
                      borderRadius: 4, 
                      bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)',
                      borderStyle: 'dashed'
                    }}
                  >
                    <Typography variant="subtitle1" align="center" fontWeight={600} gutterBottom>
                      {chartType === 'height' ? t("heightForAgeChart") : t("bmiForAgeChart")}
                    </Typography>
                    
                    <GrowthChart 
                      gender={gender} 
                      age={age} 
                      type={chartType} 
                      value={chartType === 'height' ? usedHeight : bmi} 
                    />

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', px: 2, textAlign: 'center' }}>
                      {chartType === 'height' ? (
                        "Ushbu grafik balandlikning yoshga nisbatan me'yorlarini (SDS) ko'rsatadi. Yashil chiziq - median (o'rtacha)."
                      ) : (
                        "BMI grafigi tana vazni indeksining yoshga nisbatan o'zgarishini ko'rsatadi."
                      )}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>


          {/* Tavsiyalar */}
          <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
            <CardHeader
              avatar={<TipsAndUpdatesOutlinedIcon />}
              title={<Typography variant="h6" fontWeight={700}>{t("advices")}</Typography>}
              sx={(theme) => ({
                background: theme.palette.primary.main,
                color: theme.palette.getContrastText(theme.palette.primary.main),
                "& .MuiCardHeader-avatar": { color: "inherit" },
              })}
            />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">{t("generalAdvice")}</Typography>
                <Typography variant="body1" sx={{ mt: 0.5 }}>{advices?.general ?? "—"}</Typography>
              </Box>

              <Grid container spacing={3}>
                {[
                  { key: "specialist", title: t("specialist") },
                  { key: "nutrition", title: t("nutrition") },
                  { key: "activity", title: t("activity") },
                  { key: "checkups", title: t("checkups") },
                ].map(({ key, title }) => (
                  <Grid key={key} item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>{title}</Typography>
                      <Typography variant="body2">{advices?.[key] ?? "—"}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 4, alignItems: "center" }}>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>{t("selectPdfLang")}</InputLabel>
                  <Select
                    value={pdfLang}
                    label={t("selectPdfLang")}
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
                  {t("downloadPdf")}
                </Button>


              </Stack>
            </CardContent>
          </Card>

          {onContinue && (
            <Box sx={{ mt: 4, mb: 6, display: 'flex', justifyContent: 'center' }}>
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
                  background: theme => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.info.main} 100%)`,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
                  }
                }}
              >
                {t("continueBtn")}
              </Button>
            </Box>
          )}
        </>
      )}

    </Box>
  );
}

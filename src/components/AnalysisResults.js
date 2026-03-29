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
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import MonitorWeightOutlinedIcon from "@mui/icons-material/MonitorWeightOutlined";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";
import PersonOutline from "@mui/icons-material/PersonOutline";
import { useLanguage, LANGUAGES } from "../contexts/LanguageContext";

export default function AnalysisResults({
  formData,
  results,
  generatePDF,
}) {
  const { t, lang } = useLanguage();
  const [pdfLang, setPdfLang] = useState(lang);

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
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" color="text.secondary">Z-score</Typography>
                      <Typography variant="h3" sx={{ lineHeight: 1.1 }}>{showNum(zScore)}</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip
                          size="small"
                          label={zScore == null ? "—" : Math.abs(Number(zScore)) > 1.5 ? t("outOfNorm") : t("inNorm")}
                          color={zScoreColor}
                          variant="filled"
                        />
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
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

                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" color="text.secondary">{t("bmiLabel")}</Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="h3" sx={{ lineHeight: 1.1 }}>{showNum(bmi)}</Typography>
                        {bmiCategory && <Chip label={bmiCategory} color={bmiChipColor} size="small" />}
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
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

                <Grid item xs={12} md={6}>
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
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2" color="text.secondary">{t("shoulderRatio")}</Typography>
                      <Typography variant="h4">{shoulderRatio ? `${shoulderRatio}%` : "—"}</Typography>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
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
                  {usedChest ?? "—"} | {t("headLabel")}: {usedHead ?? "—"}
                </Typography>
                {analysis?.indices?.z_body_length != null && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {t("bodyLengthZScore")}: <b>{analysis.indices.z_body_length}</b>
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Detal ko'rsatkichlar (HMAI, MII, ADI) */}
              <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 700, color: 'primary.main' }}>
                {t("detailedIndices")}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%", borderLeft: '4px solid #3f51b5' }}>
                    <Typography variant="subtitle2" color="text.secondary">{t("hmai")}</Typography>
                    <Typography variant="h5" fontWeight={700}>{analysis?.indices?.hmai ?? "—"}</Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic', lineHeight: 1.2 }}>
                      {analysis?.indices?.hmai_desc ?? "—"}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%", borderLeft: '4px solid #4caf50' }}>
                    <Typography variant="subtitle2" color="text.secondary">{t("mii")}</Typography>
                    <Typography variant="h5" fontWeight={700}>{analysis?.indices?.mii ?? "—"}</Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic', lineHeight: 1.2 }}>
                      {analysis?.indices?.mii_desc ?? "—"}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%", borderLeft: '4px solid #ff9800' }}>
                    <Typography variant="subtitle2" color="text.secondary">{t("adi")}</Typography>
                    <Typography variant="h5" fontWeight={700}>{analysis?.indices?.adi ?? "—"}</Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic', lineHeight: 1.2 }}>
                      {analysis?.indices?.adi_desc ?? "—"}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6} md={4}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">{t("morphologicalType")}</Typography>
                    <Typography variant="body2" fontWeight={600}>{analysis?.indices?.morphological_type ?? "—"}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={4}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">{t("biologicalAgeStatus")}</Typography>
                    <Typography variant="body2" fontWeight={600}>{analysis?.indices?.biological_age_status ?? "—"}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">{t("secularTrend")}</Typography>
                    <Typography variant="body2" fontWeight={600}>{analysis?.indices?.secular_trend ?? "—"}</Typography>
                  </Paper>
                </Grid>
              </Grid>
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
        </>
      )}

    </Box>
  );
}

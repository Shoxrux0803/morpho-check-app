// src/components/AnalysisResults.jsx
import React from "react";
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
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import MonitorWeightOutlinedIcon from "@mui/icons-material/MonitorWeightOutlined";
import TipsAndUpdatesOutlinedIcon from "@mui/icons-material/TipsAndUpdatesOutlined";
import PersonOutline from "@mui/icons-material/PersonOutline";

export default function AnalysisResults({
  formData,
  results,
  generatePDF,
  rating,
  setRating,
  feedback,
  setFeedback,
  submitRating,
}) {
  // 1) Hali natija yo‘q — erta chiqamiz (hooks yo‘q hali)
  if (!results) {
    return <Alert severity="info">Natija topilmadi yoki hali tahlil qilinmagan.</Alert>;
  }

  // 2) Root strukturasini normallashtiramiz (hook emas — oddiy const)
  const root =
    results?.data?.data ?? // { data: { data: {...} } }
    results?.data ?? // { data: {...} }
    results?.result ?? // { result: {...} }
    results; // bevosita {...}

  const analysis = root?.analysis ?? null;
  const advices = root?.advices ?? null;
  const measurements = root?.measurements ?? null;
  const patientInfo = root?.patient_info ?? null;

  // 3) Derivatsiyalar (hook emas — oddiy const)
  const zScore = analysis?.z_score;
  const bmi = analysis?.bmi;
  const idealWeight = analysis?.ideal_weight;
  const weightDiff = analysis?.weight_diff;
  const somatotype = analysis?.somatotype;
  const shoulderRatio = analysis?.shoulder_ratio;
  const thighRatio = analysis?.thigh_ratio;

  const showNum = (n, digits = 2) =>
    n == null || n === "" ? "—" : Number(Number(n).toFixed(digits));

  // BMI kategoriyasi va ranglari (hook emas)
  let bmiCategory = null;
  let bmiChipColor = "default";
  if (bmi != null && !Number.isNaN(Number(bmi))) {
    const v = Number(bmi);
    if (v < 18.5) {
      bmiCategory = "Ozib ketgan";
      bmiChipColor = "warning";
    } else if (v < 25) {
      bmiCategory = "Meʼyorda";
      bmiChipColor = "success";
    } else if (v < 30) {
      bmiCategory = "Ortiqcha vazn";
      bmiChipColor = "warning";
    } else {
      bmiCategory = "Semirib ketgan";
      bmiChipColor = "error";
    }
  }

  const zScoreColor =
    zScore == null ? "default" : Math.abs(Number(zScore)) > 1.5 ? "error" : "success";
  const diffColor = weightDiff == null ? "default" : Number(weightDiff) > 0 ? "error" : "success";

  const fullName =
    `${patientInfo?.first_name ?? formData.firstName ?? ""} ${patientInfo?.last_name ?? formData.lastName ?? ""}`.trim();
  const regionText = formData?.region || patientInfo?.region || "";
  const ageText = patientInfo?.age ?? formData?.age ?? "—";
  const genderText = (patientInfo?.gender ?? formData?.gender) === "erkak" ? "erkak" : "ayol";

  const usedHeight = measurements?.height ?? formData.height;
  const usedWeight = measurements?.weight ?? formData.weight;
  const usedChest = measurements?.chest ?? formData.chest;
  const usedHead = measurements?.head ?? formData.head;

  // 4) Agar analysis ham, advices ham yo‘q bo‘lsa — endi xabar chiqaramiz (hookslar allaqachon "yo‘q")
  const noAnalysisData = !analysis && !advices;

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      {/* Profil sarlavhasi va PDF tugmasi */}
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
                {fullName || "Foydalanuvchi"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {ageText} yosh, {genderText}
                {regionText ? ` | ${regionText}` : ""}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              onClick={generatePDF}
              variant="outlined"
              startIcon={<DownloadOutlinedIcon />}
              sx={{ borderRadius: 2 }}
            >
              PDF yuklab olish
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {noAnalysisData ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Tahlil ma’lumotlari topilmadi. Iltimos, Network → Response’da backend javob kalitlarini
          tekshiring (masalan: <code>analysis</code>, <code>advices</code>).
        </Alert>
      ) : (
        <>
          {/* Tahlil natijalari */}
          <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
            <CardHeader
              avatar={<AnalyticsOutlinedIcon color="success" />}
              title={
                <Typography variant="h6" fontWeight={700}>
                  Tahlil natijalari
                </Typography>
              }
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
                      <Typography variant="subtitle2" color="text.secondary">
                        Z-score
                      </Typography>
                      <Typography variant="h3" sx={{ lineHeight: 1.1 }}>
                        {showNum(zScore)}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip
                          size="small"
                          label={
                            zScore == null
                              ? "—"
                              : Math.abs(Number(zScore)) > 1.5
                                ? "Chegaradan tashqarida"
                                : "Me’yor atrofida"
                          }
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
                      <Typography variant="subtitle2" color="text.secondary">
                        Somatotip
                      </Typography>
                      <Typography variant="h3" sx={{ lineHeight: 1.1, color: "primary.main" }}>
                        {somatotype ?? "—"}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        {somatotype ? (
                          <Chip size="small" label="Aniqlandi" color="primary" />
                        ) : (
                          <Chip size="small" label="Mavjud emas" />
                        )}
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" color="text.secondary">
                        BMI
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="h3" sx={{ lineHeight: 1.1 }}>
                          {showNum(bmi)}
                        </Typography>
                        {bmiCategory && (
                          <Chip label={bmiCategory} color={bmiChipColor} size="small" />
                        )}
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
                      <Typography variant="subtitle2" color="text.secondary">
                        Ideal vazn
                      </Typography>
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
                      <Typography variant="subtitle2" color="text.secondary">
                        Farq
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <InsightsOutlinedIcon
                          color={
                            diffColor === "error"
                              ? "error"
                              : diffColor === "success"
                                ? "success"
                                : "inherit"
                          }
                        />
                        <Typography
                          variant="h4"
                          color={
                            diffColor === "error"
                              ? "error.main"
                              : diffColor === "success"
                                ? "success.main"
                                : "text.primary"
                          }
                        >
                          {weightDiff == null
                            ? "—"
                            : `${Number(weightDiff) > 0 ? "+" : ""}${showNum(weightDiff)} kg`}
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
                      <Typography variant="subtitle2" color="text.secondary">
                        Yelka proporsiyasi (Bo'yga nisbatan)
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="h4">
                          {shoulderRatio ? `${shoulderRatio}%` : "—"}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Son proporsiyasi (Bo'yga nisbatan)
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="h4">
                          {thighRatio ? `${thighRatio}%` : "—"}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Bo‘y: {usedHeight ?? "—"} | Vazn: {usedWeight ?? "—"} | Ko‘krak:{" "}
                  {usedChest ?? "—"} | Bosh: {usedHead ?? "—"}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Maslahatlar */}
          <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
            <CardHeader
              avatar={<TipsAndUpdatesOutlinedIcon />}
              title={
                <Typography variant="h6" fontWeight={700}>
                  Maslahatlar
                </Typography>
              }
              sx={(theme) => ({
                background: theme.palette.primary.main,
                color: theme.palette.getContrastText(theme.palette.primary.main),
                "& .MuiCardHeader-avatar": { color: "inherit" },
              })}
            />
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Umumiy tavsiya
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5 }}>
                  {advices?.general ?? "—"}
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {[
                  { key: "specialist", title: "👨‍⚕️ Mutaxassis" },
                  { key: "nutrition", title: "🍎 Oziqlanish" },
                  { key: "activity", title: "🏃 Faollik" },
                  { key: "checkups", title: "🏥 Tekshiruvlar" },
                ].map(({ key, title }) => (
                  <Grid key={key} item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                        {title}
                      </Typography>
                      <Typography variant="body2">{advices?.[key] ?? "—"}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 4 }}>
                <Button
                  onClick={generatePDF}
                  variant="outlined"
                  startIcon={<DownloadOutlinedIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  PDF yuklab olish
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </>
      )}

      {/* Reyting va fikr */}
      {typeof rating !== "undefined" &&
        typeof setRating === "function" &&
        typeof submitRating === "function" && (
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardHeader
              title={
                <Typography variant="h6" fontWeight={700}>
                  Fikr bildiring
                </Typography>
              }
              sx={(theme) => ({
                background: theme.palette.warning.main,
                color: theme.palette.getContrastText(theme.palette.warning.main),
              })}
            />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Baholash
                  </Typography>
                  <Rating
                    name="service-rating"
                    value={Number(rating) || 0}
                    onChange={(_, val) => setRating(val || 0)}
                    precision={1}
                    size="large"
                  />
                </Grid>
                <Grid item xs={12} md={8}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Izoh (ixtiyoriy)
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Qisqacha fikringizni yozing…"
                  />
                </Grid>
              </Grid>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3 }}>
                <Button
                  onClick={submitRating}
                  variant="contained"
                  color="warning"
                  sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                  Fikrni yuborish
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}
    </Box>
  );
}

// src/components/InputForm.jsx
import React, { useCallback, useRef } from "react";
import {
  Box,
  Grid,
  Button,
  Alert,
  MenuItem,
  InputAdornment,
  Paper,
  Divider,
  Typography,
} from "@mui/material";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import PersonOutline from "@mui/icons-material/PersonOutline";
import BadgeOutlined from "@mui/icons-material/BadgeOutlined";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import WcIcon from "@mui/icons-material/Wc";
import HeightIcon from "@mui/icons-material/Height";
import MonitorWeightIcon from "@mui/icons-material/MonitorWeight";
import StraightenIcon from "@mui/icons-material/Straighten";
import Face6Icon from "@mui/icons-material/Face6";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import PanToolIcon from "@mui/icons-material/PanTool";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import WaterIcon from "@mui/icons-material/Water";
import ShutterSpeedIcon from "@mui/icons-material/ShutterSpeed";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import SelfImprovementIcon from "@mui/icons-material/SelfImprovement";
import ScienceIcon from "@mui/icons-material/Science";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";

import { MCTextField as Field, MCSelect } from "./ui/MCField";
import { UZB_LOCATIONS } from "../data/uzbLocations";

/* ===== Helpers (validatsiya mantiqi) ===== */
const round1 = (x) => Math.round(x * 10) / 10;

function getAgeBands(age) {
  if (age >= 20)
    return {
      height: [130, 220],
      weight: [30, 250],
      head: [52, 64],
      chest: [75, 140],
      bmi: [14, 60],
    };
  if (age >= 15)
    return {
      height: [145, 200],
      weight: [35, 120],
      head: [52, 61],
      chest: [70, 110],
      bmi: [12, 38],
    };
  if (age >= 10)
    return { height: [125, 175], weight: [24, 70], head: [50, 58], chest: [58, 90], bmi: [12, 38] };
  if (age >= 5)
    return { height: [100, 145], weight: [14, 40], head: [48, 55], chest: [52, 72], bmi: [12, 38] };
  return { height: [85, 115], weight: [10, 22], head: [46, 52], chest: [48, 62], bmi: [12, 38] };
}

function validateAnthro(form) {
  const errs = [];
  const age = Number(form.age);
  const h = Number(form.height);
  const w = Number(form.weight);
  const chest = Number(form.chest);
  const head = Number(form.head);

  if (isNaN(age) || age < 3 || age > 70) errs.push("Yosh 3–70 oralig‘ida bo‘lishi kerak.");

  let bmi = null;
  if (h > 0 && w > 0) {
    bmi = w / Math.pow(h / 100, 2);
    form.__bmi = round1(bmi);
  }

  if (!isNaN(age)) {
    const band = getAgeBands(age);

    if (isNaN(h) || h < band.height[0] || h > band.height[1])
      errs.push(`Bo‘y yoshga mos emas: ${band.height[0]}–${band.height[1]} sm.`);
    if (isNaN(w) || w < band.weight[0] || w > band.weight[1])
      errs.push(`Vazn yoshga mos emas: ${band.weight[0]}–${band.weight[1]} kg.`);

    if (isNaN(chest) || chest < band.chest[0] || chest > band.chest[1])
      errs.push(`Ko‘krak aylanasi yoshga mos emas: ${band.chest[0]}–${band.chest[1]} sm.`);

    if (bmi === null || isNaN(bmi) || bmi < band.bmi[0] || bmi > band.bmi[1])
      errs.push(
        `BMI mantiqan mos emas: ${band.bmi[0]}–${band.bmi[1]}${form.__bmi ? ` (joriy: ${form.__bmi})` : ""}.`,
      );

    if (!isNaN(h) && h > 0) {
      const chestMin = Math.round(h * 0.45);
      const chestMax = Math.round(h * 0.9);
      if (!isNaN(chest) && (chest < chestMin || chest > chestMax))
        errs.push(
          `Ko‘krak aylanasi bo‘yga nisbatan mos emas: taxminiy ${chestMin}–${chestMax} sm.`,
        );
      if (age >= 20) {
        if (!isNaN(head) && (head < 52 || head > 64))
          errs.push("Kattalarda bosh aylanasi odatda 52–64 sm oralig‘ida bo‘ladi.");
      } else {
        const headMin = Math.round(h * 0.27);
        const headMax = Math.round(h * 0.4);
        if (!isNaN(head) && (head < headMin || head > headMax))
          errs.push(`Bosh aylanasi bo‘yga mos emas: taxminiy ${headMin}–${headMax} sm.`);
      }
    }
  }
  return errs;
}

/* ===== Component ===== */
export default function InputForm({
  formData,
  handleInputChange,
  handleSubmit,
  loading,
  error,
  scrollTargetId,
  scrollTargetRef,
}) {
  const btnRef = useRef(null);

  const smoothScrollToResults = useCallback(() => {
    if (scrollTargetId) {
      const el = document.getElementById(scrollTargetId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (scrollTargetRef?.current) {
      scrollTargetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [scrollTargetId, scrollTargetRef]);

  const handleLocalSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const errs = validateAnthro({ ...formData });
      if (errs.length) {
        alert("Ma’lumotlarda xatolik:\n\n• " + errs.join("\n• "));
        return;
      }

      if (btnRef.current) {
        btnRef.current.classList.remove("pulse-once");
        // eslint-disable-next-line no-unused-expressions
        btnRef.current.offsetHeight;
        btnRef.current.classList.add("pulse-once");
      }

      const maybe = handleSubmit?.(e);
      if (maybe && typeof maybe.then === "function") {
        try {
          await maybe;
        } finally {
          smoothScrollToResults();
        }
      } else {
        smoothScrollToResults();
      }
    },
    [formData, handleSubmit, smoothScrollToResults],
  );

  const adorn = (icon) => ({
    notched: false,
    startAdornment: icon ? <InputAdornment position="start">{icon}</InputAdornment> : null,
  });

  // ---- Region/District options from UZB_LOCATIONS
  const REGIONS = Object.keys(UZB_LOCATIONS);
  const region = formData.region || "";
  const districtOptions = region ? UZB_LOCATIONS[region] || [] : [];

  const onRegionChange = (e) => {
    // viloyat o‘zgarganda tumanni tozalash
    handleInputChange(e);
    if (formData.district) {
      handleInputChange({ target: { name: "district", value: "" } });
    }
  };

  // --- umumiy input sizing (uzun/keng va katta)
  const inputSx = {
    "& .MuiInputBase-input": { py: 2.4, fontSize: 17 },
    "& .MuiOutlinedInput-root": { borderRadius: 2 },
  };

  return (
    <Box
      component="form"
      onSubmit={handleLocalSubmit}
      sx={{ display: "flex", justifyContent: "center" }}
    >
      <Box sx={{ width: "100%", maxWidth: 1200 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* ===== 1. Shaxsiy ma'lumotlar ===== */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
            1) Shaxsiy ma’lumotlar
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <Field
                fullWidth
                label="Ism *"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                InputProps={adorn(<PersonOutline />)}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Field
                fullWidth
                label="Familiya *"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                InputProps={adorn(<BadgeOutlined />)}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Field
                fullWidth
                label="Tug'ilgan sanasi"
                name="birthDate"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.birthDate || ""}
                onChange={handleInputChange}
                InputProps={adorn(<CalendarMonth />)}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Field
                fullWidth
                label="Tekshiruv sanasi"
                name="examinationDate"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formData.examinationDate || ""}
                onChange={handleInputChange}
                InputProps={adorn(<CalendarMonth />)}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Field
                fullWidth
                label="Yosh (avto-hisoblangan) *"
                name="age"
                value={
                  formData.age !== ""
                    ? `${formData.age} yil, ${formData.ageMonths || 0} oy, ${formData.ageDays || 0} kun`
                    : ""
                }
                InputProps={{ ...adorn(<CalendarMonth />), readOnly: true }}
                required
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <MCSelect
                select
                fullWidth
                label="Jins"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                InputProps={adorn(<WcIcon />)}
                sx={inputSx}
              >
                <MenuItem value="erkak">Erkak</MenuItem>
                <MenuItem value="ayol">Ayol</MenuItem>
              </MCSelect>
            </Grid>
            <Grid item xs={12}>
              <Field
                fullWidth
                label="Maktab / Maktabgacha ta'lim muassasasi"
                name="preschoolInstitution"
                value={formData.preschoolInstitution || ""}
                onChange={handleInputChange}
                InputProps={adorn(<PersonOutline />)}
                sx={inputSx}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* ===== 2. Hududiy ma'lumotlar ===== */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
            2) Hududiy ma’lumotlar
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2.5}>
            {/* VILOYAT — FULL WIDTH */}
            <Grid item xs={12} md={12}>
              <MCSelect
                select
                fullWidth
                label="Viloyat *"
                name="region"
                value={region}
                onChange={onRegionChange}
                InputProps={adorn(null)}
                sx={{
                  "& .MuiInputBase-input": { py: 2.4, fontSize: 17 },
                  "& .MuiOutlinedInput-root": { borderRadius: 2 },
                }}
              >
                <MenuItem value="">Tanlang</MenuItem>
                {REGIONS.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </MCSelect>
            </Grid>

            {/* TUMAN/SHАHAR — FULL WIDTH */}
            <Grid item xs={12} md={12}>
              <MCSelect
                select
                fullWidth
                label="Tuman/Shahar"
                name="district"
                value={formData.district || ""}
                onChange={handleInputChange}
                InputProps={adorn(null)}
                disabled={!region}
                sx={{
                  "& .MuiInputBase-input": { py: 2.4, fontSize: 17 },
                  "& .MuiOutlinedInput-root": { borderRadius: 2 },
                }}
              >
                {!region && <MenuItem value="">Avval viloyatni tanla</MenuItem>}
                {region && districtOptions.length === 0 && (
                  <MenuItem value="">(Ro‘yxat yo‘q — majburiy emas)</MenuItem>
                )}
                {districtOptions.map((d) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))}
              </MCSelect>
            </Grid>

            {/* MANZIL — FULL WIDTH (o‘zgarmagan) */}
            <Grid item xs={12}>
              <Field
                fullWidth
                label="Manzil (ixtiyoriy)"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Ko‘cha, uy (xohlasangiz to‘ldiring)"
                InputProps={{ notched: false }}
                sx={{
                  "& .MuiInputBase-input": { py: 2.4, fontSize: 17 },
                  "& .MuiOutlinedInput-root": { borderRadius: 2 },
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* ===== 3. Antropometrik o‘lchovlar ===== */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
            3) Antropometrik o‘lchovlar
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <Field
                fullWidth
                label="Bo'y (sm) *"
                name="height"
                type="number"
                value={formData.height}
                onChange={handleInputChange}
                inputProps={{ min: 50, max: 250, step: 0.1 }}
                required
                InputProps={adorn(<HeightIcon />)}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Field
                fullWidth
                label="Vazn (kg) *"
                name="weight"
                type="number"
                value={formData.weight}
                onChange={handleInputChange}
                inputProps={{ min: 3, max: 300, step: 0.1 }}
                required
                InputProps={adorn(<MonitorWeightIcon />)}
                sx={inputSx}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Field
                fullWidth
                label="Ko'krak aylanasi (sm) *"
                name="chest"
                type="number"
                value={formData.chest}
                onChange={handleInputChange}
                inputProps={{ min: 40, max: 200, step: 0.1 }}
                required
                InputProps={adorn(<StraightenIcon />)}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Field
                fullWidth
                label="Bel aylanasi (sm) *"
                name="waist"
                type="number"
                value={formData.waist}
                onChange={handleInputChange}
                inputProps={{ min: 30, max: 150, step: 0.1 }}
                required
                InputProps={adorn(<StraightenIcon />)}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Field
                fullWidth
                label="Bosh aylanasi (sm) *"
                name="head"
                type="number"
                value={formData.head}
                onChange={handleInputChange}
                inputProps={{ min: 40, max: 70, step: 0.1 }}
                required
                InputProps={adorn(<Face6Icon />)}
                sx={inputSx}
              />
            </Grid>
            {/* Yangi O'lchov Parametrlari (Majburiy) */}
            <Grid item xs={12} md={4}>
              <Field fullWidth label="Yelka uzunligi (sm) *" name="shoulderLength" type="number" required inputProps={{ min: 5, max: 100, step: 0.1 }} value={formData.shoulderLength || ""} onChange={handleInputChange} InputProps={adorn(<AccessibilityNewIcon />)} sx={inputSx} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Field fullWidth label="Yelka kengligi (sm) *" name="shoulderBreadth" type="number" required inputProps={{ min: 5, max: 100, step: 0.1 }} value={formData.shoulderBreadth || ""} onChange={handleInputChange} InputProps={adorn(<AccessibilityNewIcon />)} sx={inputSx} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Field fullWidth label="Yelka aylanasi (sm) *" name="shoulderCircumference" type="number" required inputProps={{ min: 5, max: 100, step: 0.1 }} value={formData.shoulderCircumference || ""} onChange={handleInputChange} InputProps={adorn(<AccessibilityNewIcon />)} sx={inputSx} />
            </Grid>

            <Grid item xs={12} md={6}>
              <Field fullWidth label="Bilak/tirsak uzunligi (sm) *" name="armElbowLength" type="number" required inputProps={{ min: 5, max: 100, step: 0.1 }} value={formData.armElbowLength || ""} onChange={handleInputChange} InputProps={adorn(<PanToolIcon />)} sx={inputSx} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Field fullWidth label="Qo'l panja uzunligi (sm) *" name="handLength" type="number" required inputProps={{ min: 5, max: 50, step: 0.1 }} value={formData.handLength || ""} onChange={handleInputChange} InputProps={adorn(<PanToolIcon />)} sx={inputSx} />
            </Grid>

            <Grid item xs={12} md={6}>
              <Field fullWidth label="Son uzunligi (sm) *" name="thighLength" type="number" required inputProps={{ min: 10, max: 150, step: 0.1 }} value={formData.thighLength || ""} onChange={handleInputChange} InputProps={adorn(<DirectionsWalkIcon />)} sx={inputSx} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Field fullWidth label="Son aylanasi (sm) *" name="thighCircumference" type="number" required inputProps={{ min: 10, max: 150, step: 0.1 }} value={formData.thighCircumference || ""} onChange={handleInputChange} InputProps={adorn(<DirectionsWalkIcon />)} sx={inputSx} />
            </Grid>

            <Grid item xs={12} md={4}>
              <Field fullWidth label="Boldir uzunligi (sm) *" name="calfLength" type="number" required inputProps={{ min: 10, max: 150, step: 0.1 }} value={formData.calfLength || ""} onChange={handleInputChange} InputProps={adorn(<DirectionsWalkIcon />)} sx={inputSx} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Field fullWidth label="Boldir aylanasi (sm) *" name="calfCircumference" type="number" required inputProps={{ min: 10, max: 150, step: 0.1 }} value={formData.calfCircumference || ""} onChange={handleInputChange} InputProps={adorn(<DirectionsWalkIcon />)} sx={inputSx} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Field fullWidth label="Oyoq panja uzunligi (sm) *" name="footLength" type="number" required inputProps={{ min: 5, max: 50, step: 0.1 }} value={formData.footLength || ""} onChange={handleInputChange} InputProps={adorn(<DirectionsWalkIcon />)} sx={inputSx} />
            </Grid>
          </Grid>
        </Paper>

        {/* ===== 4. Bioimpedans tahlili ===== */}
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontStyle="italic" sx={{ fontWeight: 700, mb: 1.5 }}>
            4) Bioimpedans tahlili (ixtiyoriy)
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <Field
                fullWidth
                label="TBW (Tananing umumiy suvi, l)"
                name="totalBodyWater"
                type="number"
                value={formData.totalBodyWater || ""}
                onChange={handleInputChange}
                inputProps={{ min: 5, max: 100, step: 0.1 }}
                InputProps={adorn(<WaterIcon />)}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Field
                fullWidth
                label="Yog' to'qumasi (%)"
                name="fatPercent"
                type="number"
                value={formData.fatPercent || ""}
                onChange={handleInputChange}
                inputProps={{ min: 1, max: 70, step: 0.1 }}
                InputProps={adorn(<ShutterSpeedIcon />)}
                sx={inputSx}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Field
                fullWidth
                label="Yog' massasi (kg)"
                name="fatMass"
                type="number"
                value={formData.fatMass || ""}
                onChange={handleInputChange}
                inputProps={{ min: 1, max: 100, step: 0.1 }}
                InputProps={adorn(<MonitorWeightIcon />)}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Field
                fullWidth
                label="Mushak massasi (kg)"
                name="muscleMass"
                type="number"
                value={formData.muscleMass || ""}
                onChange={handleInputChange}
                inputProps={{ min: 5, max: 150, step: 0.1 }}
                InputProps={adorn(<FitnessCenterIcon />)}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Field
                fullWidth
                label="Suyak mineral massasi (kg)"
                name="boneMass"
                type="number"
                value={formData.boneMass || ""}
                onChange={handleInputChange}
                inputProps={{ min: 0.5, max: 20, step: 0.1 }}
                InputProps={adorn(<SelfImprovementIcon />)}
                sx={inputSx}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Field
                fullWidth
                label="ACM (Faol hujayra massasi, kg)"
                name="acm"
                type="number"
                value={formData.acm || ""}
                onChange={handleInputChange}
                inputProps={{ min: 5, max: 100, step: 0.1 }}
                InputProps={adorn(<ScienceIcon />)}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Field
                fullWidth
                label="Visceral yog' darajasi"
                name="visceralFat"
                type="number"
                value={formData.visceralFat || ""}
                onChange={handleInputChange}
                inputProps={{ min: 1, max: 30, step: 1 }}
                InputProps={adorn(<HealthAndSafetyIcon />)}
                sx={inputSx}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* ===== 4. Amal tugmasi ===== */}
        <Box sx={{ position: "sticky", bottom: 0, zIndex: 1, pt: 1 }}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              borderRadius: 2,
              display: "flex",
              gap: 2,
              justifyContent: "center",
              maxWidth: 1200,
              mx: "auto",
              backdropFilter: "blur(6px)",
            }}
          >
            <Button
              ref={btnRef}
              type="submit"
              size="large"
              fullWidth
              disabled={loading}
              startIcon={<AnalyticsIcon />}
              className="btn-analyze"
              sx={(theme) => ({
                borderRadius: 2,
                py: 1.8,
                fontWeight: 700,
                color: "#fff",
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                boxShadow:
                  theme.palette.mode === "light"
                    ? "0 10px 22px rgba(108,92,231,.25)"
                    : "0 10px 22px rgba(0,0,0,.45)",
                "&:hover": { filter: "brightness(1.05)" },
              })}
            >
              {loading ? "Tahlil qilinmoqda..." : "Tahlil qilish"}
            </Button>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

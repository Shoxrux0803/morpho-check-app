// src/components/InputForm.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  Stack,
  Collapse,
  CircularProgress,
} from "@mui/material";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import PersonOutline from "@mui/icons-material/PersonOutline";
import BadgeOutlined from "@mui/icons-material/BadgeOutlined";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import WcIcon from "@mui/icons-material/Wc";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import HeightIcon from "@mui/icons-material/Height";
import MonitorWeightIcon from "@mui/icons-material/MonitorWeight";
import StraightenIcon from "@mui/icons-material/Straighten";
import Face6Icon from "@mui/icons-material/Face6";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import PanToolIcon from "@mui/icons-material/PanTool";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import WaterIcon from "@mui/icons-material/Water";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepConnector, { stepConnectorClasses } from "@mui/material/StepConnector";
import { styled } from "@mui/material/styles";
import Check from "@mui/icons-material/Check";

import ShutterSpeedIcon from "@mui/icons-material/ShutterSpeed";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import SelfImprovementIcon from "@mui/icons-material/SelfImprovement";
import ScienceIcon from "@mui/icons-material/Science";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import NotesIcon from "@mui/icons-material/Notes";
import aiService from "../services/aiService";

import { MCTextField as Field, MCSelect } from "./ui/MCField";
import { UZB_LOCATIONS } from "../data/uzbLocations";
import { useGrowthAnalytics } from "../hooks/useGrowthAnalytics";

/* ===== Helpers (validatsiya mantiqi) ===== */
const round1 = (x) => Math.round(x * 10) / 10;

//getAgeBands funksiyasi olib tashlandi, endi faqat absolute (mantiqli) chegaralar qoldi.

/* ===== Component ===== */
export default function InputForm({
  formData,
  handleInputChange,
  handleSubmit,
  loading,
  error,
  scrollTargetId,
  scrollTargetRef,
  isAdminView,
  submitLabel,
  onBulkUpdate,
}) {
  const { lang, t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const btnRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  const [predictLoading, setPredictLoading] = useState(false);
  const [boundaryIndex, setBoundaryIndex] = useState(null);
  const [mahallaOptions, setMahallaOptions] = useState([]);
  const [mahallaLoading, setMahallaLoading] = useState(false);

  // Admin modini aniqlash: prop berilgan bo'lsa shuni, aks holda login holatini oladi
  const showAdvanced = isAdminView !== undefined ? isAdminView : isAuthenticated;

  const validateAnthro = (form) => {
    const errs = [];
    const age = Number(form.age);
    const h = Number(form.height);
    const w = Number(form.weight);
    // const chest = Number(form.chest);
    // const head = Number(form.head);

    // 1. Yosh chegarasi (2 dan 120 gacha)
    if (isNaN(age) || age < 2 || age > 120) {
      errs.push(t("errAge"));
    }

    // BMI hisoblash (agar o'lchovlar bor bo'lsa)
    if (h > 0 && w > 0) {
      form.__bmi = round1(w / Math.pow(h / 100, 2));
    }

    // 2. Mantiqsiz o'lchovlar (juda past yoki juda yuqori)
    // Bo'y (50-250 sm)
    if (h > 0 && (h < 50 || h > 250)) {
      errs.push(`${t("heightLabel")}: 50–250 sm.`);
    }
    // Vazn (3-300 kg)
    if (w > 0 && (w < 2 || w > 350)) {
      errs.push(`${t("weightLabel")}: 2–350 kg.`);
    }
    // BMI (5-80) - juda ekstremal holatlar
    if (form.__bmi && (form.__bmi < 5 || form.__bmi > 80)) {
      errs.push(`BMI: 5–80.`);
    }

    return errs;
  };

  const analytics = useGrowthAnalytics(formData);

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
        toast.error(
          <div style={{ textAlign: "left" }}>
            <b>{t("errInValues")}:</b>
            <ul style={{ margin: "10px 0 0 0", paddingLeft: "15px" }}>
              {errs.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>,
          { duration: 6000 },
        );
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
  const district = formData.district || "";
  const districtOptions = region ? UZB_LOCATIONS[region] || [] : [];
  const mahallaValue = formData.mahalla || "";
  const hasSelectedMahallaOption =
    !mahallaValue || mahallaOptions.some((mahalla) => mahalla.label === mahallaValue);

  const normalizeLocationName = useCallback((value = "") => {
    const normalized = String(value)
      .toLowerCase()
      .replace(/[‘’`ʻʼ']/g, "")
      .replace(/\s+/g, " ")
      .replace(" respublikasi", "")
      .replace(" viloyati", "")
      .replace(" tumani", "")
      .replace(" shahri", "")
      .replace(" mahallasi", "")
      .trim();

    return normalized.replace(/\bsergeli\b/g, "sirgali");
  }, []);

  const featureLabel = useCallback(
    (item) => item?.name_uz || item?.display_name || item?.name_en || item?.name_ru || "",
    [],
  );

  const locationMatches = useCallback(
    (left = "", right = "") => {
      const a = normalizeLocationName(left);
      const b = normalizeLocationName(right);
      if (!a || !b) return false;
      if (a === b || a.includes(b) || b.includes(a)) return true;
      const aTokens = a.split(" ").filter((part) => part && part.length > 1);
      const bTokens = b.split(" ").filter((part) => part && part.length > 1);
      return aTokens.length > 0 && aTokens.every((token) => bTokens.includes(token));
    },
    [normalizeLocationName],
  );

  const findBoundaryRegion = useCallback(
    (regionName) =>
      (boundaryIndex?.levels?.["1"] || []).find((item) =>
        locationMatches(featureLabel(item), regionName),
      ),
    [boundaryIndex, featureLabel, locationMatches],
  );

  const findBoundaryDistrict = useCallback(
    (districtName, regionName = region) => {
      const selectedRegion = findBoundaryRegion(regionName);
      const sameRegionDistricts = (boundaryIndex?.levels?.["2"] || []).filter(
        (item) => !selectedRegion || String(item.parent_id) === String(selectedRegion.id),
      );
      return (
        sameRegionDistricts.find((item) => locationMatches(featureLabel(item), districtName)) ||
        (boundaryIndex?.levels?.["2"] || []).find((item) =>
          locationMatches(featureLabel(item), districtName),
        )
      );
    },
    [boundaryIndex, featureLabel, findBoundaryRegion, locationMatches, region],
  );

  const parseMaybeJson = (value) => {
    if (typeof value !== "string") return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  useEffect(() => {
    let mounted = true;
    fetch("/maps/admin-boundaries/index.json")
      .then((response) => response.json())
      .then((data) => {
        if (mounted) setBoundaryIndex(data);
      })
      .catch((error) => console.warn("Boundary index load error:", error));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setMahallaOptions([]);
    setMahallaLoading(false);
    if (!district || !boundaryIndex?.levels?.["2"]) return undefined;

    const selectedDistrict = findBoundaryDistrict(district, region);
    const path =
      selectedDistrict &&
      (boundaryIndex.files?.["3"]?.[String(selectedDistrict.id)] ||
        `level3/${selectedDistrict.id}.geojson`);
    if (!path) return undefined;

    setMahallaLoading(true);
    fetch(`/maps/admin-boundaries/${path}`)
      .then((response) => response.json())
      .then((geoJson) => {
        if (!mounted) return;
        setMahallaOptions(
          (geoJson.features || [])
            .map((feature) => ({
              ...feature.properties,
              bbox: parseMaybeJson(feature.bbox || feature.properties?.bbox),
              center: parseMaybeJson(feature.properties?.center),
              label: featureLabel(feature.properties),
            }))
            .filter((item) => item.label)
            .sort((a, b) => a.label.localeCompare(b.label, lang === "kz" ? "kk" : lang)),
        );
      })
      .catch((error) => console.warn("Mahalla layer load error:", error))
      .finally(() => {
        if (mounted) setMahallaLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [boundaryIndex, district, featureLabel, findBoundaryDistrict, region]);

  const onRegionChange = (e) => {
    handleInputChange(e);
    if (formData.district) {
      handleInputChange({ target: { name: "district", value: "" } });
    }
    if (formData.mahalla) {
      handleInputChange({ target: { name: "mahalla", value: "" } });
    }
  };

  const onDistrictChange = (e) => {
    handleInputChange(e);
    if (formData.mahalla) {
      handleInputChange({ target: { name: "mahalla", value: "" } });
    }
  };

  const nextStep = () => setActiveStep((prev) => prev + 1);
  const prevStep = () => setActiveStep((prev) => prev - 1);

  const handleAiPredict = async () => {
    if (!formData.age || !formData.gender) {
      toast.error("Iltimos, avval yosh va jinsni kiriting!");
      return;
    }

    setPredictLoading(true);
    try {
      const res = await aiService.predictParams(formData.age, formData.gender, "analysis");
      if (res.params && onBulkUpdate) {
        onBulkUpdate(res.params);
        toast.success("Gemini: Normativ ko'rsatkichlar muvaffaqiyatli yuklandi!", { icon: "🤖" });
      }
    } catch (err) {
      toast.error("AI tahlilda xatolik yuz berdi");
    } finally {
      setPredictLoading(false);
    }
  };

  const inputSx = {
    minHeight: 88,
    "& .MuiInputBase-root": { minHeight: 58 },
    "& .MuiInputBase-input": { py: 2.2, fontSize: 16 },
    "& .MuiSelect-select": {
      minHeight: "24px !important",
      display: "flex",
      alignItems: "center",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    "& .MuiOutlinedInput-root": {
      borderRadius: 3,
      transition: "box-shadow 0.2s, border-color 0.2s",
    },
    "& .MuiOutlinedInput-root:hover": {
      bgcolor: (theme) =>
        theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
    },
  };

  const selectDisplayProps = (placeholder = t("selectLabel")) => ({
    displayEmpty: true,
    renderValue: (selected) =>
      selected ? (
        selected
      ) : (
        <Typography component="span" sx={{ color: "text.disabled" }}>
          {placeholder}
        </Typography>
      ),
    MenuProps: {
      PaperProps: {
        sx: { maxHeight: 360 },
      },
    },
  });

  const steps = [t("personalInfo"), t("anthroMeasurements"), t("bioimpedanceAnalysis")];

  // Custom step connector
  const QontoConnector = styled(StepConnector)(({ theme }) => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: {
      top: 10,
      left: "calc(-50% + 16px)",
      right: "calc(50% + 16px)",
    },
    [`&.${stepConnectorClasses.active}`]: {
      [`& .${stepConnectorClasses.line}`]: {
        borderColor: theme.palette.primary.main,
      },
    },
    [`&.${stepConnectorClasses.completed}`]: {
      [`& .${stepConnectorClasses.line}`]: {
        borderColor: theme.palette.primary.main,
      },
    },
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
      borderTopWidth: 3,
      borderRadius: 1,
    },
  }));

  const containerVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3, ease: "easeIn" } },
  };

  return (
    <Box
      component="form"
      onSubmit={handleLocalSubmit}
      sx={{ display: "flex", justifyContent: "center", pb: 5 }}
    >
      <Box sx={{ width: "100%", maxWidth: 1000, px: { xs: 1, sm: 2, md: 0 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, fontSize: { xs: 0.85, sm: 1 } }}>
            {error}
          </Alert>
        )}

        {/* Stepper UI */}
        <Box sx={{ mb: 6, mt: 2, overflowX: { xs: "auto", sm: "visible" } }}>
          <Stepper
            alternativeLabel
            activeStep={activeStep}
            connector={<QontoConnector />}
            sx={{ minWidth: { xs: 280, sm: "auto" } }}
          >
            {steps.map((label, index) => {
              if (index === 2 && !showAdvanced) return null;
              return (
                <Step key={label}>
                  <StepLabel
                    StepIconComponent={({ active, completed }) => (
                      <Box
                        sx={(theme) => ({
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor:
                            active || completed
                              ? "primary.main"
                              : theme.palette.mode === "dark"
                                ? "rgba(255,255,255,0.1)"
                                : "rgba(0,0,0,0.05)",
                          color: active || completed ? "#fff" : "text.disabled",
                          zIndex: 1,
                          border: active ? `2px solid ${theme.palette.primary.main}` : "none",
                          boxShadow: active ? `0 0 15px ${theme.palette.primary.main}44` : "none",
                        })}
                      >
                        {completed ? (
                          <Check sx={{ fontSize: 18 }} />
                        ) : (
                          <Typography variant="caption" sx={{ fontWeight: 800 }}>
                            {index + 1}
                          </Typography>
                        )}
                      </Box>
                    )}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: activeStep === index ? 700 : 500,
                        color: activeStep === index ? "primary.main" : "text.secondary",
                      }}
                    >
                      {label}
                    </Typography>
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </Box>

        <AnimatePresence mode="wait">
          {activeStep === 0 && (
            <motion.div
              key="step0"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* ===== 1. Shaxsiy ma'lumotlar ===== */}
              <Paper
                className="mc-surface-reveal"
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 4 },
                  mb: 3,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      bgcolor: "primary.main",
                      color: "#fff",
                      p: 1,
                      borderRadius: 2,
                      display: "flex",
                    }}
                  >
                    <PersonOutline />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {t("personalInfo")}
                  </Typography>
                </Stack>

                <Grid container spacing={3}>
                  <Grid xs={12} md={6}>
                    <Field
                      fullWidth
                      label={`${t("firstNameLabel")} *`}
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      InputProps={adorn(<PersonOutline />)}
                      sx={inputSx}
                    />
                  </Grid>
                  <Grid item xs={12} md={12} lg={6}>
                    <Field
                      fullWidth
                      label={`${t("lastNameLabel")} *`}
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
                      label={t("birthDateLabel")}
                      name="birthDate"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={formData.birthDate || ""}
                      onChange={handleInputChange}
                      InputProps={adorn(<CalendarMonth />)}
                      inputProps={{ max: new Date().toISOString().split("T")[0] }}
                      sx={inputSx}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Field
                      fullWidth
                      label={t("examDateLabel")}
                      name="examinationDate"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={formData.examinationDate || ""}
                      onChange={handleInputChange}
                      InputProps={adorn(<CalendarMonth />)}
                      inputProps={{ max: new Date().toISOString().split("T")[0] }}
                      sx={inputSx}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Field
                      fullWidth
                      label={`${t("ageLabel")} (${t("autoCalcLabel")}) *`}
                      name="age"
                      value={
                        formData.age !== ""
                          ? `${formData.age} ${t("yearsShort")}, ${formData.ageMonths || 0} ${t("months")}, ${formData.ageDays || 0} ${t("days")}`
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
                      label={t("genderLabel")}
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      InputProps={adorn(<WcIcon />)}
                      sx={inputSx}
                    >
                      <MenuItem value="erkak">
                        {Number(formData.age) >= 18 ? t("male") : t("boy")}
                      </MenuItem>
                      <MenuItem value="ayol">
                        {Number(formData.age) >= 18 ? t("female") : t("girl")}
                      </MenuItem>
                    </MCSelect>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Field
                      fullWidth
                      label={`${t("parentsPhoneLabel")} (${t("optionalLabel")})`}
                      name="parentsPhone"
                      type="tel"
                      value={formData.parentsPhone || ""}
                      onChange={handleInputChange}
                      InputProps={adorn(<PhoneOutlinedIcon />)}
                      sx={inputSx}
                      placeholder="+998"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Collapse
                      in={Number(formData.age) > 0 && Number(formData.age) < 18}
                      timeout={600}
                    >
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Field
                            fullWidth
                            label={`${t("fatherHeightLabel")} (sm)`}
                            name="fatherHeight"
                            type="number"
                            value={formData.fatherHeight || ""}
                            onChange={handleInputChange}
                            InputProps={adorn(<HeightIcon />)}
                            sx={inputSx}
                            placeholder={t("optionalLabel")}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Field
                            fullWidth
                            label={`${t("motherHeightLabel")} (sm)`}
                            name="motherHeight"
                            type="number"
                            value={formData.motherHeight || ""}
                            onChange={handleInputChange}
                            InputProps={adorn(<HeightIcon />)}
                            sx={inputSx}
                            placeholder={t("optionalLabel")}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Field
                            fullWidth
                            label={`${t("parentsPhoneLabel")} (${t("optionalLabel")})`}
                            name="parentsPhone"
                            type="tel"
                            value={formData.parentsPhone || ""}
                            onChange={handleInputChange}
                            InputProps={adorn(<LocalPhoneIcon />)}
                            sx={inputSx}
                            placeholder="+998"
                          />
                        </Grid>
                      </Grid>
                    </Collapse>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 4, mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    {t("territorialData")}
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                </Box>

                <Grid container spacing={3}>
                  <Grid xs={12} md={6}>
                    <MCSelect
                      select
                      fullWidth
                      label={`${t("regionLabel")} *`}
                      name="region"
                      value={region}
                      onChange={onRegionChange}
                      InputProps={adorn(null)}
                      SelectProps={selectDisplayProps()}
                      sx={inputSx}
                    >
                      <MenuItem value="">{t("selectLabel")}</MenuItem>
                      {REGIONS.map((r) => (
                        <MenuItem key={r} value={r}>
                          {r}
                        </MenuItem>
                      ))}
                    </MCSelect>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <MCSelect
                      select
                      fullWidth
                      label={t("districtLabel")}
                      name="district"
                      value={district}
                      onChange={onDistrictChange}
                      InputProps={adorn(null)}
                      disabled={!region}
                      SelectProps={selectDisplayProps(t("selectLabel"))}
                      sx={inputSx}
                    >
                      {!region && <MenuItem value="">{t("errSelectRegionFirst")}</MenuItem>}
                      {region && districtOptions.length === 0 && (
                        <MenuItem value="">({t("emptyQueueOptional")})</MenuItem>
                      )}
                      {districtOptions.map((d) => (
                        <MenuItem key={d} value={d}>
                          {d}
                        </MenuItem>
                      ))}
                    </MCSelect>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <MCSelect
                      select
                      fullWidth
                      label={t("mahallaLabel") || "Mahalla"}
                      name="mahalla"
                      value={mahallaValue}
                      onChange={handleInputChange}
                      InputProps={adorn(null)}
                      disabled={!district || mahallaLoading}
                      SelectProps={selectDisplayProps(t("selectLabel"))}
                      sx={inputSx}
                    >
                      {!district && <MenuItem value="">{t("errSelectDistrictFirst")}</MenuItem>}
                      {district && mahallaLoading && (
                        <MenuItem value="">{t("mahallasLoading")}</MenuItem>
                      )}
                      {district && !mahallaLoading && mahallaOptions.length === 0 && (
                        <MenuItem value="">{t("mahallaListNotFound")}</MenuItem>
                      )}
                      {!hasSelectedMahallaOption && (
                        <MenuItem value={mahallaValue}>{mahallaValue}</MenuItem>
                      )}
                      {mahallaOptions.map((mahalla) => (
                        <MenuItem key={mahalla.boundary_id || mahalla.id} value={mahalla.label}>
                          {mahalla.label}
                        </MenuItem>
                      ))}
                    </MCSelect>
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      fullWidth
                      label={`${t("fullAddressLabel")} (${t("optionalLabel")})`}
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder={t("addressPlaceholder")}
                      sx={inputSx}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      fullWidth
                      multiline
                      minRows={3}
                      label="Doctor note"
                      name="doctorNote"
                      value={formData.doctorNote || ""}
                      onChange={handleInputChange}
                      InputProps={adorn(<NotesIcon />)}
                      sx={inputSx}
                      placeholder="Shifokor uchun qisqa izoh yoki kuzatuv"
                    />
                  </Grid>
                </Grid>

                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
                  <Button
                    variant="contained"
                    onClick={nextStep}
                    endIcon={<ArrowForwardIcon />}
                    size="large"
                    disabled={
                      !formData.firstName || !formData.lastName || !formData.age || !formData.region
                    }
                    sx={{ borderRadius: 3, px: 4 }}
                  >
                    {t("details")}
                  </Button>
                </Box>
              </Paper>
            </motion.div>
          )}

          {activeStep === 1 && (
            <motion.div
              key="step1"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* ===== 2. O'lchovlar ===== */}
              <Paper
                className="mc-surface-reveal"
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 4 },
                  mb: 3,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      bgcolor: "secondary.main",
                      color: "#fff",
                      p: 1,
                      borderRadius: 2,
                      display: "flex",
                    }}
                  >
                    <StraightenIcon />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {t("anthroMeasurements")}
                  </Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={
                      predictLoading ? <CircularProgress size={20} /> : <AutoAwesomeIcon />
                    }
                    onClick={handleAiPredict}
                    disabled={predictLoading}
                    sx={{ borderRadius: 2, textTransform: "none" }}
                  >
                    {predictLoading ? "AI..." : "AI Predict"}
                  </Button>
                </Stack>

                <Grid container spacing={2.5}>
                  <Grid xs={12} md={6}>
                    <Field
                      fullWidth
                      label={`${t("heightLabel")} (sm) *`}
                      name="height"
                      type="number"
                      value={formData.height}
                      onChange={handleInputChange}
                      required
                      InputProps={adorn(<HeightIcon />)}
                      sx={{
                        ...inputSx,
                        "& .MuiOutlinedInput-notchedOutline": analytics?.height
                          ? {
                              borderColor: analytics.height.status.color,
                              borderWidth: 2,
                            }
                          : {},
                      }}
                      helperText={
                        analytics?.height
                          ? `${t("zScoreLabel")}: ${analytics.height.zScore > 0 ? "+" : ""}${analytics.height.zScore} (${analytics.height.percentile}-p)`
                          : ""
                      }
                      FormHelperTextProps={{
                        sx: { color: analytics?.height?.status.color, fontWeight: 700 },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Field
                      fullWidth
                      label={`${t("bodyLengthLabel")} (sm) *`}
                      name="bodyLength"
                      type="number"
                      value={formData.bodyLength}
                      onChange={handleInputChange}
                      required
                      InputProps={adorn(<HeightIcon />)}
                      sx={inputSx}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      fullWidth
                      label={`${t("weightLabel")} (kg) *`}
                      name="weight"
                      type="number"
                      value={formData.weight}
                      onChange={handleInputChange}
                      required
                      InputProps={adorn(<MonitorWeightIcon />)}
                      sx={{
                        ...inputSx,
                        "& .MuiOutlinedInput-notchedOutline": analytics?.weight
                          ? {
                              borderColor: analytics.weight.status.color,
                              borderWidth: 2,
                            }
                          : {},
                      }}
                      helperText={
                        analytics?.weight
                          ? `${t("zScoreLabel")}: ${analytics.weight.zScore > 0 ? "+" : ""}${analytics.weight.zScore} (${analytics.weight.percentile}-p)`
                          : ""
                      }
                      FormHelperTextProps={{
                        sx: { color: analytics?.weight?.status.color, fontWeight: 700 },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      fullWidth
                      label={`${t("chestLabel")} (sm) *`}
                      name="chest"
                      type="number"
                      value={formData.chest}
                      onChange={handleInputChange}
                      required
                      InputProps={adorn(<StraightenIcon />)}
                      sx={inputSx}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      fullWidth
                      label={`${t("waistLabel")} (sm) *`}
                      name="waist"
                      type="number"
                      value={formData.waist}
                      onChange={handleInputChange}
                      required
                      InputProps={adorn(<StraightenIcon />)}
                      sx={inputSx}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      fullWidth
                      label={`${t("headLabel")} (sm) *`}
                      name="head"
                      type="number"
                      value={formData.head}
                      onChange={handleInputChange}
                      required
                      InputProps={adorn(<Face6Icon />)}
                      sx={inputSx}
                    />
                  </Grid>

                  {analytics?.bmi && (
                    <Grid item xs={12}>
                      <Alert
                        icon={<AnalyticsIcon sx={{ color: analytics.bmi.status.color }} />}
                        sx={{
                          borderRadius: 3,
                          bgcolor: `${analytics.bmi.status.color}11`,
                          border: `1px solid ${analytics.bmi.status.color}33`,
                          "& .MuiAlert-message": { width: "100%" },
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" fontWeight={700}>
                            {t("bmiAnalysis")}:{" "}
                            <span style={{ color: analytics.bmi.status.color }}>
                              {analytics.bmi.value} kg/m²
                            </span>
                          </Typography>
                          <Typography
                            variant="caption"
                            fontWeight={800}
                            sx={{
                              bgcolor: analytics.bmi.status.color,
                              color: "#fff",
                              px: 1,
                              py: 0.2,
                              borderRadius: 1,
                            }}
                          >
                            {t("zScoreLabel")}: {analytics.bmi.zScore > 0 ? "+" : ""}
                            {analytics.bmi.zScore}
                          </Typography>
                        </Box>
                      </Alert>
                    </Grid>
                  )}

                  {showAdvanced && (
                    <>
                      <Grid item xs={12} md={4}>
                        <Field
                          fullWidth
                          label={`${t("shoulderLength")} (sm) *`}
                          name="shoulderLength"
                          type="number"
                          required
                          value={formData.shoulderLength || ""}
                          onChange={handleInputChange}
                          InputProps={adorn(<AccessibilityNewIcon />)}
                          sx={inputSx}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Field
                          fullWidth
                          label={`${t("shoulderBreadth")} (sm) *`}
                          name="shoulderBreadth"
                          type="number"
                          required
                          value={formData.shoulderBreadth || ""}
                          onChange={handleInputChange}
                          InputProps={adorn(<AccessibilityNewIcon />)}
                          sx={inputSx}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Field
                          fullWidth
                          label={`${t("shoulderCircumference")} (sm) *`}
                          name="shoulderCircumference"
                          type="number"
                          required
                          value={formData.shoulderCircumference || ""}
                          onChange={handleInputChange}
                          InputProps={adorn(<AccessibilityNewIcon />)}
                          sx={inputSx}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Field
                          fullWidth
                          label={`${t("armElbowLength")} (sm) *`}
                          name="armElbowLength"
                          type="number"
                          required
                          value={formData.armElbowLength || ""}
                          onChange={handleInputChange}
                          InputProps={adorn(<PanToolIcon />)}
                          sx={inputSx}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Field
                          fullWidth
                          label={`${t("handLength")} (sm) *`}
                          name="handLength"
                          type="number"
                          required
                          value={formData.handLength || ""}
                          onChange={handleInputChange}
                          InputProps={adorn(<PanToolIcon />)}
                          sx={inputSx}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Field
                          fullWidth
                          label={`${t("thighLength")} (sm) *`}
                          name="thighLength"
                          type="number"
                          required
                          value={formData.thighLength || ""}
                          onChange={handleInputChange}
                          InputProps={adorn(<DirectionsWalkIcon />)}
                          sx={inputSx}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Field
                          fullWidth
                          label={`${t("thighCircumference")} (sm) *`}
                          name="thighCircumference"
                          type="number"
                          required
                          value={formData.thighCircumference || ""}
                          onChange={handleInputChange}
                          InputProps={adorn(<DirectionsWalkIcon />)}
                          sx={inputSx}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Field
                          fullWidth
                          label={`${t("calfLength")} (sm) *`}
                          name="calfLength"
                          type="number"
                          required
                          value={formData.calfLength || ""}
                          onChange={handleInputChange}
                          InputProps={adorn(<DirectionsWalkIcon />)}
                          sx={inputSx}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Field
                          fullWidth
                          label={`${t("calfCircumference")} (sm) *`}
                          name="calfCircumference"
                          type="number"
                          required
                          value={formData.calfCircumference || ""}
                          onChange={handleInputChange}
                          InputProps={adorn(<DirectionsWalkIcon />)}
                          sx={inputSx}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Field
                          fullWidth
                          label={`${t("footLength")} (sm) *`}
                          name="footLength"
                          type="number"
                          required
                          value={formData.footLength || ""}
                          onChange={handleInputChange}
                          InputProps={adorn(<DirectionsWalkIcon />)}
                          sx={inputSx}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>

                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
                  <Button onClick={prevStep} startIcon={<ArrowBackIcon />} sx={{ borderRadius: 3 }}>
                    {t("backBtn")}
                  </Button>
                  {showAdvanced ? (
                    <Stack direction="row" spacing={2}>
                      <Button
                        onClick={handleLocalSubmit}
                        variant="outlined"
                        color="primary"
                        startIcon={<AnalyticsIcon />}
                        size="large"
                        disabled={loading || !formData.height || !formData.weight}
                        sx={{
                          borderRadius: 3,
                          px: 3,
                          fontWeight: 700,
                          borderWidth: 2,
                          "&:hover": { borderWidth: 2 },
                        }}
                      >
                        {loading ? t("analyzing") : t("analyze")}
                      </Button>
                      <Button
                        variant="contained"
                        onClick={nextStep}
                        endIcon={<ArrowForwardIcon />}
                        size="large"
                        sx={{ borderRadius: 3, px: 4 }}
                      >
                        {t("details")}
                      </Button>
                    </Stack>
                  ) : (
                    <Button
                      onClick={handleLocalSubmit}
                      variant="contained"
                      color="primary"
                      startIcon={<AnalyticsIcon />}
                      size="large"
                      disabled={loading || !formData.height || !formData.weight}
                      sx={{ borderRadius: 3, px: 6, fontWeight: 700 }}
                    >
                      {loading ? t("analyzing") : submitLabel || t("analyze")}
                    </Button>
                  )}
                </Box>
              </Paper>
            </motion.div>
          )}

          {activeStep === 2 && showAdvanced && (
            <motion.div
              key="step2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* ===== 4. Bioimpedans tahlili ===== */}
              <Paper
                className="mc-surface-reveal"
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 4 },
                  mb: 3,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      bgcolor: "info.main",
                      color: "#fff",
                      p: 1,
                      borderRadius: 2,
                      display: "flex",
                    }}
                  >
                    <ScienceIcon />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {t("bioimpedanceAnalysis")}
                  </Typography>
                </Stack>

                <Grid container spacing={2.5}>
                  <Grid xs={12} md={6}>
                    <Field
                      fullWidth
                      label={`${t("tbwLabel")} (l) (${t("optionalLabel")})`}
                      name="totalBodyWater"
                      type="number"
                      value={formData.totalBodyWater || ""}
                      onChange={handleInputChange}
                      InputProps={adorn(<WaterIcon />)}
                      sx={inputSx}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Field
                      fullWidth
                      label={`${t("fatPercentLabel")} (%) (${t("optionalLabel")})`}
                      name="fatPercent"
                      type="number"
                      value={formData.fatPercent || ""}
                      onChange={handleInputChange}
                      InputProps={adorn(<ShutterSpeedIcon />)}
                      sx={inputSx}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      fullWidth
                      label={`${t("fatMassLabel")} (kg) (${t("optionalLabel")})`}
                      name="fatMass"
                      type="number"
                      value={formData.fatMass || ""}
                      onChange={handleInputChange}
                      InputProps={adorn(<MonitorWeightIcon />)}
                      sx={inputSx}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      fullWidth
                      label={`${t("muscleMassLabel")} (kg) (${t("optionalLabel")})`}
                      name="muscleMass"
                      type="number"
                      value={formData.muscleMass || ""}
                      onChange={handleInputChange}
                      InputProps={adorn(<FitnessCenterIcon />)}
                      sx={inputSx}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Field
                      fullWidth
                      label={`${t("boneMassLabel")} (kg) (${t("optionalLabel")})`}
                      name="boneMass"
                      type="number"
                      value={formData.boneMass || ""}
                      onChange={handleInputChange}
                      InputProps={adorn(<SelfImprovementIcon />)}
                      sx={inputSx}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Field
                      fullWidth
                      label={`${t("acmLabel")} (${t("optionalLabel")})`}
                      name="acm"
                      type="number"
                      value={formData.acm || ""}
                      onChange={handleInputChange}
                      InputProps={adorn(<ScienceIcon />)}
                      sx={inputSx}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Field
                      fullWidth
                      label={`${t("visceralFatLabel")} (${t("optionalLabel")})`}
                      name="visceralFat"
                      type="number"
                      value={formData.visceralFat || ""}
                      onChange={handleInputChange}
                      InputProps={adorn(<HealthAndSafetyIcon />)}
                      sx={inputSx}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
                  <Button onClick={prevStep} startIcon={<ArrowBackIcon />} sx={{ borderRadius: 3 }}>
                    {t("backBtn")}
                  </Button>
                  <Button
                    onClick={handleLocalSubmit}
                    variant="contained"
                    color="primary"
                    startIcon={<AnalyticsIcon />}
                    size="large"
                    disabled={loading}
                    sx={{
                      borderRadius: 3,
                      px: 6,
                      fontWeight: 700,
                      background: (theme) =>
                        `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    }}
                  >
                    {loading ? t("analyzing") : submitLabel || t("analyze")}
                  </Button>
                </Box>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
}

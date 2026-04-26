import React, { useState } from "react";
import {
  Box, Grid, TextField, Button, Typography, Stack,
  CircularProgress, Paper, MenuItem, Stepper, Step, StepLabel
} from "@mui/material";
import {
  Add, ArrowForward, ArrowBack, Save, CheckCircle
} from "@mui/icons-material";
import { ResearchApi } from "../../services/api";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import aiService from "../../services/aiService";

/* ════════════════════════════════════════════════════
   Utility Component: GlassPaper
════════════════════════════════════════════════════ */
const GlassPaper = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      background: (theme) =>
        theme.palette.mode === "dark" ? "rgba(30,30,40,0.7)" : "rgba(255,255,255,0.85)",
      backdropFilter: "blur(20px)",
      borderRadius: 4,
      border: "1px solid",
      borderColor: (theme) =>
        theme.palette.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(100, 116, 139, 0.12)",
      overflow: "hidden",
      boxShadow: (theme) => 
        theme.palette.mode === "dark"
          ? "0 8px 32px rgba(0,0,0,0.4)"
          : "0 8px 32px rgba(100,116,139,0.08)",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

/* ════════════════════════════════════════════════════
   MAIN COMPONENT: ResearcherForm
════════════════════════════════════════════════════ */
const ResearcherForm = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [predictLoading, setPredictLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const emptyForm = {
    full_name: "", school_name: "", settlement: "", birth_place: "", birth_date: "",
    father_nationality: "", mother_nationality: "", living_since: "", enrolled_date: "",
    living_conditions: "", labor_regime: "", past_illnesses: "", children_count: "",
    child_order: "", feeding_type: "", parents_marriage: "", mother_health_status: "",
    parents_phone: "",
    father_height: "", mother_height: "",
    examination_date: "",
    lower_leg_total: "", lower_leg_spina_iliaca: "", lower_leg_symphysion: "", lower_leg_length: "", tibiale_height: "",
    pelvic_width: "", thigh_length: "", thigh_circumference: "", calf_length: "",
    calf_circumference: "", foot_length: "", teeth_count: "", menstruation_start: "",
    skull_longitudinal: "", skull_transverse: "", head_circumference: "",
    forehead_transverse: "", skull_height: "",
    skull_base_length: "", skull_base_width: "",
    face_bizygomatic: "", face_bigonial: "", face_morphological_height: "",
    face_physiognomic_height: "", nose_height: "", nose_width: "", outer_canthal_width: "",
    inner_canthal_width: "", lips_mucosa_height: "", mouth_width: "",
    chest_standing_height: "", chest_sitting_height: "", weight: "", trunk_length: "",
    torso_length: "", chest_circumference_pause: "", chest_circumference_inhale: "",
    chest_circumference_exhale: "", waist_circumference: "", abdomen_circumference: "",
    upper_segment_length: "", chest_transverse_diameter: "", chest_anteroposterior_diameter: "",
    chest_height: "",
    arm_length: "", shoulder_length: "", shoulder_width: "", arm_circumference_total: "", shoulder_circumference_rest: "",
    shoulder_circumference_flexed: "", forearm_length: "", hand_length: "", dynamometry: "",
    fat_triceps: "", fat_biceps: "", fat_subscapular: "", fat_iliac: "", fat_popliteal: "",
    gender: ""
  };
  const [formData, setFormData] = useState(emptyForm);

  const steps = ["Shaxsiy ma'lumotlar", "Barcha o'lchovlar"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ["father_height", "mother_height", "children_count", "child_order", "teeth_count"];
    const v = numericFields.includes(name) && value !== "" ? Number(value) : value;
    setFormData({ ...formData, [name]: v });
  };

  const validateStep1 = () => {
    if (!formData.full_name) {
      toast.error("F.I.SH kiritilishi shart");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (validateStep1()) setActiveStep(1);
    }
  };

  const handleBack = () => setActiveStep(activeStep - 1);

  const calculateAge = (birthDate, examDate) => {
    if (!birthDate) return null;
    const bDate = new Date(birthDate);
    const eDate = examDate ? new Date(examDate) : new Date();
    let age = eDate.getFullYear() - bDate.getFullYear();
    const m = eDate.getMonth() - bDate.getMonth();
    if (m < 0 || (m === 0 && eDate.getDate() < bDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleAiPredict = async () => {
    const age = calculateAge(formData.birth_date, formData.examination_date);
    if (age === null || !formData.gender) {
      toast.error("Iltimos, avval tug'ilgan sana va jinsni kiriting!");
      return;
    }
    
    setPredictLoading(true);
    try {
      const res = await aiService.predictParams(age, formData.gender, "research");
      if (res.params) {
        setFormData(prev => ({ ...prev, ...res.params }));
        toast.success("Gemini: Normativ ko'rsatkichlar yuklandi!", { icon: "🤖" });
      }
    } catch (err) {
      toast.error("AI tahlilda xatolik yuz berdi");
    } finally {
      setPredictLoading(false);
    }
  };

  const ageForLabels = calculateAge(formData.birth_date, formData.examination_date);
  const isAdult = ageForLabels !== null && ageForLabels >= 18;

  const genderOptions = isAdult 
    ? [
        { value: "erkak", label: "Erkak (Мужчина)" },
        { value: "ayol", label: "Ayol (Женщина)" }
      ]
    : [
        { value: "Boy", label: "O'g'il bola (Мальчик)" },
        { value: "Girl", label: "Qiz bola (Девочка)" }
      ];

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const cleanData = {};
      Object.keys(formData).forEach((k) => {
        if (formData[k] !== "") cleanData[k] = formData[k];
      });
      await ResearchApi.create(cleanData);
      
      // Trigger success animation
      setShowSuccess(true);
      toast.success("Ma'lumot muvaffaqiyatli saqlandi");
      
      // Reset form after delay
      setTimeout(() => {
        setFormData(emptyForm);
        setActiveStep(0);
        setShowSuccess(false);
        onSuccess();
      }, 2000);
    } catch (err) {
      toast.error("Xatolik: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const SL = (title) => (
    <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 1.5, color: "primary.main", display: "flex", alignItems: "center", gap: 1 }}>
      <Box sx={{ width: 4, height: 20, bgcolor: "primary.main", borderRadius: 1 }} />
      {title}
    </Typography>
  );

  const I = (name, label, type = "number", options = null) => (
    <TextField fullWidth margin="dense" size="small" type={type === "select" ? undefined : type}
      select={type === "select"}
      name={name} label={label} value={formData[name]} onChange={handleChange}
      variant="outlined"
      sx={{ 
        "& .MuiOutlinedInput-root": { borderRadius: 2 },
        minWidth: type === "select" ? 200 : "auto"
      }}
      InputLabelProps={type === "date" || type === "select" ? { shrink: true } : undefined}
    >
      {type === "select" && options?.map(opt => (
        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
      ))}
    </TextField>
  );

  return (
    <GlassPaper sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h5" fontWeight="900" mb={3} textAlign="center">
        Yangi Tadqiqot Yozuvi
      </Typography>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(6px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.5, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.5, y: 50, opacity: 0 }}
              style={{
                background: "white",
                padding: "48px",
                borderRadius: "32px",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                textAlign: "center",
                maxWidth: "90%",
                width: "420px",
                border: "1px solid rgba(255,255,255,0.1)"
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <CheckCircle sx={{ fontSize: 80, color: "success.main", mb: 3 }} />
              </motion.div>
              <Typography variant="h4" fontWeight={900} color="success.dark" gutterBottom>
                Saqlandi!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.8 }}>
                Ma'lumotlar bazaga muvaffaqiyatli qo'shildi.
                <br />
                Yangi yozuvga o'tilmoqda...
              </Typography>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel sx={{ "& .MuiStepLabel-label": { fontWeight: 600, fontSize: "0.85rem" } }}>
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeStep === 0 ? (
            <Box>
              {SL("I. Pasport / Umumiy Ma'lumotlar")}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>{I("full_name", "F.I.SH", "text")}</Grid>
                <Grid item xs={12} sm={6} md={4}>{I("school_name", "Maktab/Bog'cha", "text")}</Grid>
                <Grid item xs={12} sm={6} md={4}>{I("settlement", "Aholi punkti", "text")}</Grid>
                <Grid item xs={12} sm={6} md={4}>{I("birth_place", "Tug'ilgan joyi", "text")}</Grid>
                <Grid item xs={12} sm={6} md={4}>{I("birth_date", "Tug'ilgan sana", "date")}</Grid>
                <Grid item xs={12} sm={6} md={4}>{I("examination_date", "Tekshiruv sanasi", "date")}</Grid>
                <Grid item xs={12} sm={6} md={4}>{I("gender", "Jinsi (Пол)", "select", genderOptions)}</Grid>
                <Grid item xs={12} sm={6} md={4}>{I("father_nationality", "Ota millati", "text")}</Grid>
                <Grid item xs={12} sm={6} md={4}>{I("mother_nationality", "Ona millati", "text")}</Grid>
                <Grid item xs={12} sm={6} md={4}>{I("living_since", "Yashashni boshlagan", "text")}</Grid>
                <Grid item xs={12} sm={6} md={4}>{I("enrolled_date", "Muassasaga qabul", "text")}</Grid>
                <Grid item xs={12} sm={6} md={4}>{I("living_conditions", "Maishiy sharoit", "text")}</Grid>
                <Grid item xs={12} sm={6} md={4}>{I("labor_regime", "Mehnat rejimi", "text")}</Grid>
                <Grid item xs={12} sm={6} md={4}>{I("past_illnesses", "O'tkir kasalliklar", "text")}</Grid>
                <Grid item xs={12} sm={6} md={4}>{I("children_count", "Farzandlar soni")}</Grid>
                <Grid item xs={12} sm={6} md={4}>{I("child_order", "Nechanchi farzand")}</Grid>
                <Grid item xs={12} sm={6} md={6}>{I("feeding_type", "Oziqlanish turi", "select", [
                  { value: "Tabiiy (естественном вскармливании)", label: "Tabiiy (естественном вскармливании)" },
                  { value: "Sun'iy (искусственном вскармливании)", label: "Sun'iy (искусственном вскармливании)" }
                ])}</Grid>
                <Grid item xs={12} sm={6} md={6}>{I("parents_marriage", "Ota-ona qarindoshligi", "select", [
                  { value: "Yaqin qarindosh (близкородственный)", label: "Yaqin qarindosh (близкородственный)" },
                  { value: "Uzoq qarindosh (дальнородственный)", label: "Uzoq qarindosh (дальнородственный)" },
                  { value: "Qarindosh emas (неродственный)", label: "Qarindosh emas (неродственный)" }
                ])}</Grid>
                <Grid item xs={12} sm={6} md={4}>{I("mother_health_status", "Ona sog'ligi", "text")}</Grid>
                <Grid item xs={12} sm={6} md={4}>{I("parents_phone", "Ota-ona tel. raqami", "text")}</Grid>
                <Grid item xs={12} sm={6} md={4}>{I("father_height", "Otasi bo'yi (sm)")}</Grid>
                <Grid item xs={12} sm={6} md={4}>{I("mother_height", "Onasi bo'yi (sm)")}</Grid>
              </Grid>
            </Box>
          ) : (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2, mb: 1.5 }}>
                {SL("II. Jismoniy Rivojlanish (Oyoqlar)")}
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={predictLoading ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
                  onClick={handleAiPredict}
                  disabled={predictLoading}
                  sx={{ borderRadius: 2 }}
                >
                  {predictLoading ? "AI..." : "AI Predict"}
                </Button>
              </Stack>
                  <Grid container spacing={2}>
                    {[
                      ["lower_leg_total","Pastki oyoq-qo'l"],
                      ["lower_leg_spina_iliaca","Spina iliaca"],["lower_leg_symphysion","Symphysion"],
                      ["lower_leg_length","Pastki oyoq-qo'l uzunligi"],
                      ["tibiale_height","Tibiale balandligi"],["pelvic_width","Chanoq kengligi"],
                      ["thigh_length","Son uzunligi"],["thigh_circumference","Son aylanasi"],
                      ["calf_length","Boldir uzunligi"],["calf_circumference","Boldir aylanasi"],
                      ["foot_length","Oyoq panja uzunligi"],["teeth_count","Tishlar soni"],
                    ].map(([name, label, t]) => (
                      <Grid item xs={12} sm={6} md={4} key={name}>{I(name, label, t || "number")}</Grid>
                    ))}
                    {formData.gender && (formData.gender.toLowerCase() === "ayol" || formData.gender.toLowerCase() === "girl") && (
                      <Grid item xs={12} sm={6} md={4}>{I("menstruation_start", "Hayz ko'rishning boshlanishi", "text")}</Grid>
                    )}
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  {SL("III. Bosh suyagi va shakli")}
                  <Grid container spacing={2}>
                    {[
                      ["skull_longitudinal","Uzunasiga diametr"],["skull_transverse","Ko'ndalang diametr"],
                      ["head_circumference","Bosh aylanasi"],["forehead_transverse","Peshona ko'ndalang"],
                      ["skull_height","Bosh balandligi"],["skull_base_length","Asos uzunligi"],
                      ["skull_base_width","Asos kengligi"],
                    ].map(([n, l]) => <Grid item xs={12} sm={6} md={4} key={n}>{I(n, l)}</Grid>)}
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  {SL("IV. Yuz o'lchamlari")}
                  <Grid container spacing={2}>
                    {[
                      ["face_bizygomatic","Yanoq diametri"],["face_bigonial","Pastki jag' diametri"],
                      ["face_morphological_height","Morfologik balandlik"],
                      ["face_physiognomic_height","Fizionomik balandlik"],
                      ["nose_height","Burun balandligi"],["nose_width","Burun kengligi"],
                      ["outer_canthal_width","Tashqi ko'z kengligi"],
                      ["inner_canthal_width","Ichki ko'z kengligi"],
                      ["lips_mucosa_height","Lab qalinligi"],["mouth_width","Og'iz kengligi"],
                    ].map(([n, l]) => <Grid item xs={12} sm={6} md={4} key={n}>{I(n, l)}</Grid>)}
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  {SL("V. Ko'krak qafasi va gavda")}
                  <Grid container spacing={2}>
                    {[
                      ["chest_standing_height","Bo'y (tik)"],["chest_sitting_height","Bo'y (o'tirgan)"],
                      ["weight","Vazn (kg)"],["trunk_length","Tana uzunligi"],["torso_length","Korpus uzunligi"],
                      ["chest_circumference_pause","Ko'krak aylanasi (pauza)"],
                      ["chest_circumference_inhale","Nafas olganda"],["chest_circumference_exhale","Nafas chiqarganda"],
                      ["waist_circumference","Bel aylanasi"],["abdomen_circumference","Qorin aylanasi"],
                      ["upper_segment_length","Yuqori segment"],["chest_transverse_diameter","Ko'ndalang diametr"],
                      ["chest_anteroposterior_diameter","Old-orqa diametr"],["chest_height","Ko'krak balandligi"],
                    ].map(([n, l]) => <Grid item xs={12} sm={6} md={4} key={n}>{I(n, l)}</Grid>)}
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  {SL("VI. Qo'l va Yog' qatlami")}
                  <Grid container spacing={2}>
                    {[
                      ["arm_length","Qo'l uzunligi"],["shoulder_length","Yelka uzunligi"],
                      ["shoulder_width","Yelka kengligi"],["arm_circumference_total","Yelka aylanasi"],
                      ["shoulder_circumference_rest","Yelka aylanasi (tinch)"],
                      ["shoulder_circumference_flexed","Yelka aylanasi (tarang)"],["forearm_length","Bilak uzunligi"],
                      ["hand_length","Panja uzunligi"],["dynamometry","Dinamometriya"],
                      ["fat_triceps","Triseps yog'i"],["fat_biceps","Biseps yog'i"],
                      ["fat_subscapular","Kurak osti yog'i"],["fat_iliac","Yonbosh yog'i"],
                      ["fat_popliteal","Tizza orqa yog'i"],
                    ].map(([n, l]) => <Grid item xs={12} sm={6} md={4} key={n}>{I(n, l)}</Grid>)}
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          )}
        </motion.div>
      </AnimatePresence>

      <Box mt={4} display="flex" justifyContent="space-between">
        <Button
          disabled={activeStep === 0 || loading}
          onClick={handleBack}
          startIcon={<ArrowBack />}
          variant="outlined"
          sx={{ px: 4, borderRadius: 2 }}
        >
          Orqaga
        </Button>
        {activeStep === 0 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<ArrowForward />}
            sx={{ px: 4, borderRadius: 2 }}
          >
            Keyingi
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
            sx={{ px: 5, borderRadius: 2 }}
          >
            Saqlash
          </Button>
        )}
      </Box>
    </GlassPaper>
  );
};

export default ResearcherForm;

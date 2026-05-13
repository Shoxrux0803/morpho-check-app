import React, { useState } from "react";
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Stack,
  CircularProgress,
  Paper,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import { ArrowForward, ArrowBack, Save, CheckCircle } from "@mui/icons-material";
import { ResearchApi } from "../../services/api";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import aiService from "../../services/aiService";
import { useLanguage } from "../../contexts/LanguageContext";
import { researcherT } from "../../utils/researcherI18n";

/* в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ
   Utility Component: GlassPaper
в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ */
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

/* в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ
   MAIN COMPONENT: ResearcherForm
в•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђв•ђ */
const ResearcherForm = ({ onSuccess }) => {
  const { lang } = useLanguage();
  const tr = (key) => researcherT(lang, key);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [predictLoading, setPredictLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const emptyForm = {
    full_name: "",
    school_name: "",
    settlement: "",
    birth_place: "",
    birth_date: "",
    father_nationality: "",
    mother_nationality: "",
    living_since: "",
    enrolled_date: "",
    living_conditions: "",
    labor_regime: "",
    past_illnesses: "",
    children_count: "",
    child_order: "",
    feeding_type: "",
    parents_marriage: "",
    mother_health_status: "",
    parents_phone: "",
    father_height: "",
    mother_height: "",
    examination_date: "",
    lower_leg_total: "",
    lower_leg_spina_iliaca: "",
    lower_leg_symphysion: "",
    lower_leg_length: "",
    tibiale_height: "",
    pelvic_width: "",
    thigh_length: "",
    thigh_circumference: "",
    calf_length: "",
    calf_circumference: "",
    foot_length: "",
    teeth_count: "",
    menstruation_start: "",
    skull_longitudinal: "",
    skull_transverse: "",
    head_circumference: "",
    forehead_transverse: "",
    skull_height: "",
    skull_base_length: "",
    skull_base_width: "",
    face_bizygomatic: "",
    face_bigonial: "",
    face_morphological_height: "",
    face_physiognomic_height: "",
    nose_height: "",
    nose_width: "",
    outer_canthal_width: "",
    inner_canthal_width: "",
    lips_mucosa_height: "",
    mouth_width: "",
    chest_standing_height: "",
    chest_sitting_height: "",
    weight: "",
    trunk_length: "",
    torso_length: "",
    chest_circumference_pause: "",
    chest_circumference_inhale: "",
    chest_circumference_exhale: "",
    waist_circumference: "",
    abdomen_circumference: "",
    upper_segment_length: "",
    chest_transverse_diameter: "",
    chest_anteroposterior_diameter: "",
    chest_height: "",
    arm_length: "",
    shoulder_length: "",
    shoulder_width: "",
    arm_circumference_total: "",
    shoulder_circumference_rest: "",
    shoulder_circumference_flexed: "",
    forearm_length: "",
    hand_length: "",
    dynamometry: "",
    fat_triceps: "",
    fat_biceps: "",
    fat_subscapular: "",
    fat_iliac: "",
    fat_popliteal: "",
    gender: "",
  };
  const [formData, setFormData] = useState(emptyForm);

  const steps = [tr("stepPersonal"), tr("stepMeasurements")];

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = [
      "father_height",
      "mother_height",
      "children_count",
      "child_order",
      "teeth_count",
    ];
    const v = numericFields.includes(name) && value !== "" ? Number(value) : value;
    setFormData({ ...formData, [name]: v });
  };

  const validateStep1 = () => {
    if (!formData.full_name) {
      toast.error(tr("requiredFullName"));
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
      toast.error(tr("enterBirthAndGender"));
      return;
    }

    setPredictLoading(true);
    try {
      const res = await aiService.predictParams(age, formData.gender, "research");
      if (res.params) {
        setFormData((prev) => ({ ...prev, ...res.params }));
        toast.success(tr("aiLoaded"), { icon: "AI" });
      }
    } catch (err) {
      toast.error(tr("aiError"));
    } finally {
      setPredictLoading(false);
    }
  };

  const ageForLabels = calculateAge(formData.birth_date, formData.examination_date);
  const isAdult = ageForLabels !== null && ageForLabels >= 18;

  const genderOptions = isAdult
    ? [
        { value: "erkak", label: tr("male") },
        { value: "ayol", label: tr("female") },
      ]
    : [
        { value: "Boy", label: tr("boy") },
        { value: "Girl", label: tr("girl") },
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
      toast.success(tr("savedToast"));

      // Reset form after delay
      setTimeout(() => {
        setFormData(emptyForm);
        setActiveStep(0);
        setShowSuccess(false);
        onSuccess();
      }, 2000);
    } catch (err) {
      toast.error(`${tr("error")}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const SL = (title) => (
    <Typography
      variant="subtitle1"
      fontWeight="bold"
      sx={{ mt: 2, mb: 1.5, color: "primary.main", display: "flex", alignItems: "center", gap: 1 }}
    >
      <Box sx={{ width: 4, height: 20, bgcolor: "primary.main", borderRadius: 1 }} />
      {title}
    </Typography>
  );

  const I = (name, label, type = "number", options = null) => (
    <TextField
      fullWidth
      margin="dense"
      size="small"
      type={type === "select" ? undefined : type}
      select={type === "select"}
      name={name}
      label={label}
      value={formData[name]}
      onChange={handleChange}
      variant="outlined"
      sx={{
        "& .MuiOutlinedInput-root": { borderRadius: 2 },
        minWidth: type === "select" ? { xs: 120, sm: 200 } : "auto",
      }}
      InputLabelProps={type === "date" || type === "select" ? { shrink: true } : undefined}
    >
      {type === "select" &&
        options?.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
    </TextField>
  );

  return (
    <GlassPaper sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h5" fontWeight="900" mb={3} textAlign="center">
        {tr("newResearchRecord")}
      </Typography>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
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
                border: "1px solid rgba(255,255,255,0.1)",
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
                {tr("saved")}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.8 }}>
                {tr("savedDesc")}
                <br />
                {tr("movingToNew")}
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
              {SL(tr("sectionPassport"))}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  {I("full_name", tr("fullName"), "text")}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  {I("school_name", tr("schoolKindergarten"), "text")}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  {I("settlement", tr("settlement"), "text")}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  {I("birth_place", tr("birthPlace"), "text")}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  {I("birth_date", tr("birthDate"), "date")}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  {I("examination_date", tr("examDate"), "date")}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  {I("gender", tr("gender"), "select", genderOptions)}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  {I("father_nationality", tr("fatherNationality"), "text")}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  {I("mother_nationality", tr("motherNationality"), "text")}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  {I("living_since", tr("livingSince"), "text")}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  {I("enrolled_date", tr("enrolledDate"), "text")}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  {I("living_conditions", tr("livingConditions"), "text")}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  {I("labor_regime", tr("laborRegime"), "text")}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  {I("past_illnesses", tr("pastIllnesses"), "text")}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  {I("children_count", tr("childrenCount"))}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  {I("child_order", tr("childOrder"))}
                </Grid>
                <Grid item xs={12} sm={6} md={6}>
                  {I("feeding_type", tr("feedingType"), "select", [
                    {
                      value: tr("natural"),
                      label: tr("natural"),
                    },
                    {
                      value: tr("artificial"),
                      label: tr("artificial"),
                    },
                  ])}
                </Grid>
                <Grid item xs={12} sm={6} md={6}>
                  {I("parents_marriage", tr("parentsMarriage"), "select", [
                    {
                      value: tr("closeRelative"),
                      label: tr("closeRelative"),
                    },
                    {
                      value: tr("distantRelative"),
                      label: tr("distantRelative"),
                    },
                    {
                      value: tr("notRelative"),
                      label: tr("notRelative"),
                    },
                  ])}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  {I("mother_health_status", tr("motherHealth"), "text")}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  {I("parents_phone", tr("parentsPhone"), "text")}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  {I("father_height", tr("fatherHeight"))}
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  {I("mother_height", tr("motherHeight"))}
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mt: 2, mb: 1.5 }}
                  >
                    {SL(tr("sectionLegs"))}
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={
                        predictLoading ? <CircularProgress size={16} /> : <AutoAwesomeIcon />
                      }
                      onClick={handleAiPredict}
                      disabled={predictLoading}
                      sx={{ borderRadius: 2 }}
                    >
                      {predictLoading ? "AI..." : "AI Predict"}
                    </Button>
                  </Stack>
                  <Grid container spacing={2}>
                    {[
                      ["lower_leg_total", tr("lowerLegTotal")],
                      ["lower_leg_spina_iliaca", "Spina iliaca"],
                      ["lower_leg_symphysion", "Symphysion"],
                      ["lower_leg_length", tr("lowerLegLength")],
                      ["tibiale_height", tr("tibialeHeight")],
                      ["pelvic_width", tr("pelvicWidth")],
                      ["thigh_length", tr("thighLength")],
                      ["thigh_circumference", tr("thighCircumference")],
                      ["calf_length", tr("calfLength")],
                      ["calf_circumference", tr("calfCircumference")],
                      ["foot_length", tr("footLength")],
                      ["teeth_count", tr("teethCount")],
                    ].map(([name, label, t]) => (
                      <Grid item xs={12} sm={6} md={4} key={name}>
                        {I(name, label, t || "number")}
                      </Grid>
                    ))}
                    {formData.gender &&
                      (formData.gender.toLowerCase() === "ayol" ||
                        formData.gender.toLowerCase() === "girl") && (
                        <Grid item xs={12} sm={6} md={4}>
                          {I("menstruation_start", tr("menstruationStart"), "text")}
                        </Grid>
                      )}
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  {SL(tr("sectionSkull"))}
                  <Grid container spacing={2}>
                    {[
                      ["skull_longitudinal", tr("skullLongitudinal")],
                      ["skull_transverse", tr("skullTransverse")],
                      ["head_circumference", tr("headCircumference")],
                      ["forehead_transverse", tr("foreheadTransverse")],
                      ["skull_height", tr("skullHeight")],
                      ["skull_base_length", tr("skullBaseLength")],
                      ["skull_base_width", tr("skullBaseWidth")],
                    ].map(([n, l]) => (
                      <Grid item xs={12} sm={6} md={4} key={n}>
                        {I(n, l)}
                      </Grid>
                    ))}
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  {SL(tr("sectionFace"))}
                  <Grid container spacing={2}>
                    {[
                      ["face_bizygomatic", tr("faceBizygomatic")],
                      ["face_bigonial", tr("faceBigonial")],
                      ["face_morphological_height", tr("faceMorphologicalHeight")],
                      ["face_physiognomic_height", tr("facePhysiognomicHeight")],
                      ["nose_height", tr("noseHeight")],
                      ["nose_width", tr("noseWidth")],
                      ["outer_canthal_width", tr("outerCanthalWidth")],
                      ["inner_canthal_width", tr("innerCanthalWidth")],
                      ["lips_mucosa_height", tr("lipsMucosaHeight")],
                      ["mouth_width", tr("mouthWidth")],
                    ].map(([n, l]) => (
                      <Grid item xs={12} sm={6} md={4} key={n}>
                        {I(n, l)}
                      </Grid>
                    ))}
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  {SL(tr("sectionChest"))}
                  <Grid container spacing={2}>
                    {[
                      ["chest_standing_height", tr("standingHeight")],
                      ["chest_sitting_height", tr("sittingHeight")],
                      ["weight", tr("weight")],
                      ["trunk_length", tr("trunkLength")],
                      ["torso_length", tr("torsoLength")],
                      ["chest_circumference_pause", tr("chestPause")],
                      ["chest_circumference_inhale", tr("chestInhale")],
                      ["chest_circumference_exhale", tr("chestExhale")],
                      ["waist_circumference", tr("waistCircumference")],
                      ["abdomen_circumference", tr("abdomenCircumference")],
                      ["upper_segment_length", tr("upperSegmentLength")],
                      ["chest_transverse_diameter", tr("chestTransverseDiameter")],
                      ["chest_anteroposterior_diameter", tr("chestAnteroposteriorDiameter")],
                      ["chest_height", tr("chestHeight")],
                    ].map(([n, l]) => (
                      <Grid item xs={12} sm={6} md={4} key={n}>
                        {I(n, l)}
                      </Grid>
                    ))}
                  </Grid>
                </Grid>

                <Grid item xs={12}>
                  {SL(tr("sectionArmFat"))}
                  <Grid container spacing={2}>
                    {[
                      ["arm_length", tr("armLength")],
                      ["shoulder_length", tr("shoulderLength")],
                      ["shoulder_width", tr("shoulderWidth")],
                      ["arm_circumference_total", tr("armCircumferenceTotal")],
                      ["shoulder_circumference_rest", tr("shoulderCircumferenceRest")],
                      ["shoulder_circumference_flexed", tr("shoulderCircumferenceFlexed")],
                      ["forearm_length", tr("forearmLength")],
                      ["hand_length", tr("handLength")],
                      ["dynamometry", tr("dynamometry")],
                      ["fat_triceps", tr("fatTriceps")],
                      ["fat_biceps", tr("fatBiceps")],
                      ["fat_subscapular", tr("fatSubscapular")],
                      ["fat_iliac", tr("fatIliac")],
                      ["fat_popliteal", tr("fatPopliteal")],
                    ].map(([n, l]) => (
                      <Grid item xs={12} sm={6} md={4} key={n}>
                        {I(n, l)}
                      </Grid>
                    ))}
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
          {tr("back")}
        </Button>
        {activeStep === 0 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<ArrowForward />}
            sx={{ px: 4, borderRadius: 2 }}
          >
            {tr("next")}
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
            {tr("save")}
          </Button>
        )}
      </Box>
    </GlassPaper>
  );
};

export default ResearcherForm;

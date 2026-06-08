import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Avatar,
  Stack,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip,
  Grid,
  Alert,
  MenuItem,
  useTheme,
} from "@mui/material";
import {
  Description,
  Download,
  Add,
  Dashboard,
  Edit,
  Delete,
  DeleteForever,
  Close,
  Visibility,
  InfoOutlined,
  Person,
  Place,
  Science,
  FitnessCenter,
  Refresh,
  Analytics,
  CheckCircle,
  Assessment,
  TrendingUp,
  People,
  FactCheck,
  Timeline,
  WarningAmber,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ResearchApi } from "../services/api";
import CloudUpload from "@mui/icons-material/CloudUpload";
import ResearcherForm from "../components/Research/ResearcherForm";
import { toast } from "react-hot-toast";
import AdvancedResearchFilter from "../components/Research/AdvancedResearchFilter";
import { ResearchStatisticsPanel } from "../components/Admin/ResearcherDataView";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  ComposedChart,
  Line,
} from "recharts";
import LogoutConfirmDialog from "../components/LogoutConfirmDialog";
import DashboardFilters from "../components/Dashboard/DashboardFilters";
import { useLanguage } from "../contexts/LanguageContext";
import { researcherT } from "../utils/researcherI18n";
import { pageT } from "../utils/pageI18n";
import { useLocation, useNavigate } from "react-router-dom";
import { ConsentStatus } from "../components/Consent/PrivacyConsentPanel";

/* ════════════════════════════════════════════════════
   Utility Components
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
      overflow: "auto",
      "&::-webkit-scrollbar": {
        height: "6px",
        width: "6px",
      },
      "&::-webkit-scrollbar-track": {
        background: "transparent",
      },
      "&::-webkit-scrollbar-thumb": {
        background: (theme) =>
          theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
        borderRadius: "10px",
      },
      "&::-webkit-scrollbar-thumb:hover": {
        background: (theme) =>
          theme.palette.mode === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
      },
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

const SectionTitle = ({ icon: Icon, title }) => (
  <Box display="flex" alignItems="center" gap={1} mb={2} mt={3}>
    <Icon color="primary" sx={{ fontSize: 20 }} />
    <Typography variant="subtitle1" fontWeight={700} color="primary">
      {title}
    </Typography>
    <Divider sx={{ flex: 1 }} />
  </Box>
);

const getDateLocale = (lang) => {
  if (lang === "ru") return "ru-RU";
  if (lang === "kz") return "kk-KZ";
  if (lang === "tg") return "tg-TJ";
  if (lang === "en") return "en-US";
  return "uz-UZ";
};

/* ════════════════════════════════════════════════════
   DETAIL MODAL
════════════════════════════════════════════════════ */
const DetailModal = ({ record, open, onClose, onEdit, onDelete, isSuperAdmin }) => {
  const { lang } = useLanguage();
  const tr = useCallback((key) => researcherT(lang, key), [lang]);
  const dateLocale = getDateLocale(lang);

  if (!record) return null;

  const Section = ({ title, Icon, fields }) => (
    <>
      <SectionTitle icon={Icon} title={title} />
      <Grid container spacing={2}>
        {fields.map(([label, key]) =>
          record[key] !== null && record[key] !== undefined && record[key] !== "" ? (
            <Grid xs={12} sm={6} md={4} key={key}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  background: "rgba(15,118,110,0.04)",
                  border: "1px solid rgba(15,118,110,0.08)",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {key === "gender"
                    ? record[key]?.toLowerCase() === "boy" || record[key]?.toLowerCase() === "erkak"
                      ? tr("boy")
                      : tr("girl")
                    : record[key]}
                </Typography>
              </Box>
            </Grid>
          ) : null,
        )}
      </Grid>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: (theme) =>
            theme.palette.mode === "dark" ? "rgba(23, 26, 33, 0.95)" : "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          border: (theme) =>
            theme.palette.mode === "dark"
              ? "1px solid rgba(255,255,255,0.12)"
              : "1px solid rgba(100,116,139,0.15)",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 24px 48px rgba(0,0,0,0.5)"
              : "0 24px 48px rgba(100,116,139,0.15)",
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {record.full_name || tr("unknown")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ID: {record.id} | {tr("date")}: {record.examination_date || "-"} |{" "}
              {new Date(record.created_at).toLocaleDateString(dateLocale)}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <ConsentStatus
          record={record}
          lang={lang}
          onDownloadDocx={() => ResearchApi.downloadConsentDocx(record.id, lang)}
        />
        <Section
          title={tr("sectionPassport")}
          Icon={Person}
          fields={[
            [tr("fullName"), "full_name"],
            [tr("schoolKindergarten"), "school_name"],
            [tr("settlement"), "settlement"],
            [tr("birthPlace"), "birth_place"],
            [tr("birthDate"), "birth_date"],
            [tr("gender"), "gender"],
            [tr("fatherNationality"), "father_nationality"],
            [tr("motherNationality"), "mother_nationality"],
            [tr("livingSince"), "living_since"],
            [tr("enrolledDate"), "enrolled_date"],
            [tr("livingConditions"), "living_conditions"],
            [tr("laborRegime"), "labor_regime"],
            [tr("pastIllnesses"), "past_illnesses"],
            [tr("childrenCount"), "children_count"],
            [tr("childOrder"), "child_order"],
            [tr("feedingType"), "feeding_type"],
            [tr("parentsMarriage"), "parents_marriage"],
            [tr("motherHealth"), "mother_health_status"],
            [tr("examDate"), "examination_date"],
          ]}
        />
        <Section
          title={tr("sectionLegs")}
          Icon={Place}
          fields={[
            [tr("lowerLegTotal"), "lower_leg_total"],
            [tr("lowerLegLength"), "lower_leg_length"],
            ["Spina iliaca", "lower_leg_spina_iliaca"],
            ["Symphysion", "lower_leg_symphysion"],
            [tr("tibialeHeight"), "tibiale_height"],
            [tr("pelvicWidth"), "pelvic_width"],
            [tr("thighLength"), "thigh_length"],
            [tr("thighCircumference"), "thigh_circumference"],
            [tr("calfLength"), "calf_length"],
            [tr("calfCircumference"), "calf_circumference"],
            [tr("footLength"), "foot_length"],
            [tr("teethCount"), "teeth_count"],
            [tr("menstruationStart"), "menstruation_start"],
          ]}
        />
        <Section
          title={tr("sectionSkull")}
          Icon={Science}
          fields={[
            [tr("skullLongitudinal"), "skull_longitudinal"],
            [tr("skullTransverse"), "skull_transverse"],
            [tr("headCircumference"), "head_circumference"],
            [tr("foreheadTransverse"), "forehead_transverse"],
            [tr("skullHeight"), "skull_height"],
            [tr("skullBaseLength"), "skull_base_length"],
            [tr("skullBaseWidth"), "skull_base_width"],
          ]}
        />
        <Section
          title={tr("sectionFace")}
          Icon={Person}
          fields={[
            [tr("faceBizygomatic"), "face_bizygomatic"],
            [tr("faceBigonial"), "face_bigonial"],
            [tr("faceMorphologicalHeight"), "face_morphological_height"],
            [tr("facePhysiognomicHeight"), "face_physiognomic_height"],
            [tr("noseHeight"), "nose_height"],
            [tr("noseWidth"), "nose_width"],
            [tr("outerCanthalWidth"), "outer_canthal_width"],
            [tr("innerCanthalWidth"), "inner_canthal_width"],
            [tr("lipsMucosaHeight"), "lips_mucosa_height"],
            [tr("mouthWidth"), "mouth_width"],
          ]}
        />
        <Section
          title={tr("sectionChest")}
          Icon={FitnessCenter}
          fields={[
            [tr("standingHeight"), "chest_standing_height"],
            [tr("sittingHeight"), "chest_sitting_height"],
            [tr("weight"), "weight"],
            [tr("trunkLength"), "trunk_length"],
            [tr("torsoLength"), "torso_length"],
            [tr("chestPause"), "chest_circumference_pause"],
            [tr("chestInhale"), "chest_circumference_inhale"],
            [tr("chestExhale"), "chest_circumference_exhale"],
            [tr("waistCircumference"), "waist_circumference"],
            [tr("abdomenCircumference"), "abdomen_circumference"],
            [tr("upperSegmentLength"), "upper_segment_length"],
            [tr("chestTransverseDiameter"), "chest_transverse_diameter"],
            [tr("chestAnteroposteriorDiameter"), "chest_anteroposterior_diameter"],
            [tr("chestHeight"), "chest_height"],
          ]}
        />
        <Section
          title={tr("sectionArmFat")}
          Icon={FitnessCenter}
          fields={[
            [tr("armLength"), "arm_length"],
            [tr("shoulderLength"), "shoulder_length"],
            [tr("shoulderWidth"), "shoulder_width"],
            [tr("armCircumferenceTotal"), "arm_circumference_total"],
            [tr("shoulderCircumferenceRest"), "shoulder_circumference_rest"],
            [tr("shoulderCircumferenceFlexed"), "shoulder_circumference_flexed"],
            [tr("forearmLength"), "forearm_length"],
            [tr("handLength"), "hand_length"],
            [tr("dynamometry"), "dynamometry"],
            [tr("fatTriceps"), "fat_triceps"],
            [tr("fatBiceps"), "fat_biceps"],
            [tr("fatSubscapular"), "fat_subscapular"],
            [tr("fatIliac"), "fat_iliac"],
            [tr("fatPopliteal"), "fat_popliteal"],
          ]}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            startIcon={<Description />}
            onClick={() => ResearchApi.downloadDocx(record.id, lang)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            DOCX ({lang.toUpperCase()})
          </Button>
          <Button
            size="small"
            startIcon={<Description />}
            onClick={() => ResearchApi.downloadConsentDocx(record.id, lang)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Consent DOCX
          </Button>
        </Stack>
        <Box flex={1} />
        <Button startIcon={<Edit />} variant="contained" onClick={() => onEdit(record)}>
          {tr("edit")}
        </Button>
        {isSuperAdmin && (
          <Button
            startIcon={<DeleteForever />}
            color="error"
            variant="outlined"
            onClick={() => onDelete(record.id, "hard")}
          >
            {tr("hardDelete")}
          </Button>
        )}
        <Button
          startIcon={<Delete />}
          color="warning"
          variant="outlined"
          onClick={() => onDelete(record.id, "soft")}
        >
          {tr("delete")}
        </Button>
        <Button onClick={onClose} variant="text">
          {tr("close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ════════════════════════════════════════════════════
   EDIT MODAL — simplified (key fields only)
════════════════════════════════════════════════════ */
const EditModal = ({ record, open, onClose, onSaved }) => {
  const { lang } = useLanguage();
  const tr = (key) => researcherT(lang, key);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record) setForm({ ...record });
  }, [record]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { id, created_at, created_by_id, is_deleted, deleted_at, ...payload } = form;
      await ResearchApi.update(id, payload);
      toast.success(tr("savedToast"));
      onSaved();
      onClose();
    } catch (err) {
      toast.error(`${tr("error")}: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const F = ({ label, k, type = "text", options }) => (
    <TextField
      select={type === "select"}
      label={label}
      size="small"
      fullWidth
      type={type === "select" ? undefined : type}
      value={form[k] ?? ""}
      onChange={set(k)}
      InputLabelProps={type === "date" || type === "select" ? { shrink: true } : undefined}
      sx={{ minWidth: type === "select" ? 200 : "auto" }}
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: (theme) =>
            theme.palette.mode === "dark" ? "rgba(23, 26, 33, 0.95)" : "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          border: (theme) =>
            theme.palette.mode === "dark"
              ? "1px solid rgba(255,255,255,0.12)"
              : "1px solid rgba(100,116,139,0.15)",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 24px 48px rgba(0,0,0,0.5)"
              : "0 24px 48px rgba(100,116,139,0.15)",
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>
        {tr("edit")}
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 12, top: 12 }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* Section I: Demographic */}
        <SectionTitle icon={Person} title={tr("sectionPassport")} />
        <Grid container spacing={2} pt={1}>
          {[
            [tr("fullName"), "full_name", "text"],
            [tr("schoolKindergarten"), "school_name", "text"],
            [tr("settlement"), "settlement", "text"],
            [tr("birthPlace"), "birth_place", "text"],
            [tr("birthDate"), "birth_date", "date"],
            [
              tr("gender"),
              "gender",
              "select",
              (() => {
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
                const age = calculateAge(form.birth_date, form.examination_date);
                return age !== null && age >= 18
                  ? [
                      { value: "erkak", label: tr("male") },
                      { value: "ayol", label: tr("female") },
                    ]
                  : [
                      { value: "Boy", label: tr("boy") },
                      { value: "Girl", label: tr("girl") },
                    ];
              })(),
            ],
            [tr("fatherNationality"), "father_nationality", "text"],
            [tr("motherNationality"), "mother_nationality", "text"],
            [tr("livingSince"), "living_since", "text"],
            [tr("enrolledDate"), "enrolled_date", "text"],
            [tr("livingConditions"), "living_conditions", "text"],
            [tr("laborRegime"), "labor_regime", "text"],
            [tr("pastIllnesses"), "past_illnesses", "text"],
            [tr("childrenCount"), "children_count", "number"],
            [tr("childOrder"), "child_order", "number"],
            [
              tr("feedingType"),
              "feeding_type",
              "select",
              [
                {
                  value: tr("natural"),
                  label: tr("natural"),
                },
                {
                  value: tr("artificial"),
                  label: tr("artificial"),
                },
              ],
            ],
            [
              tr("parentsMarriage"),
              "parents_marriage",
              "select",
              [
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
              ],
            ],
            [tr("motherHealth"), "mother_health_status", "text"],
            [tr("examDate"), "examination_date", "date"],
          ].map(([label, k, type, options]) => (
            <Grid
              xs={12}
              sm={6}
              md={k === "feeding_type" || k === "parents_marriage" ? 6 : 4}
              key={k}
            >
              <F label={label} k={k} type={type} options={options} />
            </Grid>
          ))}
        </Grid>

        {/* Section II: Lower Leg */}
        <SectionTitle icon={Place} title={tr("sectionLegs")} />
        <Grid container spacing={2} pt={1}>
          {[
            [tr("lowerLegTotal"), "lower_leg_total"],
            [tr("lowerLegLength"), "lower_leg_length"],
            ["Spina iliaca", "lower_leg_spina_iliaca"],
            ["Symphysion", "lower_leg_symphysion"],
            [tr("tibialeHeight"), "tibiale_height"],
            [tr("pelvicWidth"), "pelvic_width"],
            [tr("thighLength"), "thigh_length"],
            [tr("thighCircumference"), "thigh_circumference"],
            [tr("calfLength"), "calf_length"],
            [tr("calfCircumference"), "calf_circumference"],
            [tr("footLength"), "foot_length"],
            [tr("teethCount"), "teeth_count"],
          ].map(([label, k, type]) => (
            <Grid xs={12} sm={6} md={4} key={k}>
              <F label={label} k={k} type={type || "number"} />
            </Grid>
          ))}
        </Grid>

        {/* Section III: Skull */}
        <SectionTitle icon={Science} title={tr("sectionSkull")} />
        <Grid container spacing={2} pt={1}>
          {[
            [tr("skullLongitudinal"), "skull_longitudinal"],
            [tr("skullTransverse"), "skull_transverse"],
            [tr("headCircumference"), "head_circumference"],
            [tr("foreheadTransverse"), "forehead_transverse"],
            [tr("skullHeight"), "skull_height"],
            [tr("skullBaseLength"), "skull_base_length"],
            [tr("skullBaseWidth"), "skull_base_width"],
          ].map(([label, k]) => (
            <Grid xs={12} sm={6} md={4} key={k}>
              <F label={label} k={k} type="number" />
            </Grid>
          ))}
        </Grid>

        {/* Section IV: Face */}
        <SectionTitle icon={Person} title={tr("sectionFace")} />
        <Grid container spacing={2} pt={1}>
          {[
            [tr("faceBizygomatic"), "face_bizygomatic"],
            [tr("faceBigonial"), "face_bigonial"],
            [tr("faceMorphologicalHeight"), "face_morphological_height"],
            [tr("facePhysiognomicHeight"), "face_physiognomic_height"],
            [tr("noseHeight"), "nose_height"],
            [tr("noseWidth"), "nose_width"],
            [tr("outerCanthalWidth"), "outer_canthal_width"],
            [tr("innerCanthalWidth"), "inner_canthal_width"],
            [tr("lipsMucosaHeight"), "lips_mucosa_height"],
            [tr("mouthWidth"), "mouth_width"],
          ].map(([label, k]) => (
            <Grid xs={12} sm={6} md={4} key={k}>
              <F label={label} k={k} type="number" />
            </Grid>
          ))}
        </Grid>

        {/* Section V: Chest */}
        <SectionTitle icon={FitnessCenter} title={tr("sectionChest")} />
        <Grid container spacing={2} pt={1}>
          {[
            [tr("standingHeight"), "chest_standing_height"],
            [tr("sittingHeight"), "chest_sitting_height"],
            [tr("weight"), "weight"],
            [tr("trunkLength"), "trunk_length"],
            [tr("torsoLength"), "torso_length"],
            [tr("chestPause"), "chest_circumference_pause"],
            [tr("chestInhale"), "chest_circumference_inhale"],
            [tr("chestExhale"), "chest_circumference_exhale"],
            [tr("waistCircumference"), "waist_circumference"],
            [tr("abdomenCircumference"), "abdomen_circumference"],
            [tr("upperSegmentLength"), "upper_segment_length"],
            [tr("chestTransverseDiameter"), "chest_transverse_diameter"],
            [tr("chestAnteroposteriorDiameter"), "chest_anteroposterior_diameter"],
            [tr("chestHeight"), "chest_height"],
          ].map(([label, k]) => (
            <Grid xs={12} sm={6} md={4} key={k}>
              <F label={label} k={k} type="number" />
            </Grid>
          ))}
        </Grid>

        {/* Section VI: Arms and Fat */}
        <SectionTitle icon={FitnessCenter} title={tr("sectionArmFat")} />
        <Grid container spacing={2} pt={1}>
          {[
            [tr("armLength"), "arm_length"],
            [tr("shoulderLength"), "shoulder_length"],
            [tr("shoulderWidth"), "shoulder_width"],
            [tr("armCircumferenceTotal"), "arm_circumference_total"],
            [tr("shoulderCircumferenceRest"), "shoulder_circumference_rest"],
            [tr("shoulderCircumferenceFlexed"), "shoulder_circumference_flexed"],
            [tr("forearmLength"), "forearm_length"],
            [tr("handLength"), "hand_length"],
            [tr("dynamometry"), "dynamometry"],
            [tr("fatTriceps"), "fat_triceps"],
            [tr("fatBiceps"), "fat_biceps"],
            [tr("fatSubscapular"), "fat_subscapular"],
            [tr("fatIliac"), "fat_iliac"],
            [tr("fatPopliteal"), "fat_popliteal"],
          ].map(([label, k]) => (
            <Grid xs={12} sm={6} md={4} key={k}>
              <F label={label} k={k} type="number" />
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>{tr("cancel")}</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={20} /> : tr("save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ════════════════════════════════════════════════════
   RECORDS TABLE  (shared between tabs)
════════════════════════════════════════════════════ */
const RecordsTable = ({
  rows,
  loading,
  onView,
  onEdit,
  onDelete,
  isSuperAdmin,
  checked,
  toggleAll,
  toggleOne,
  showDeleted = false,
  tr = (key) => key,
  lang = "uz",
}) => {
  const dateLocale = getDateLocale(lang);

  return (
    <TableContainer component={GlassPaper}>
      <Table size="small">
        <TableHead
          sx={{
            background: (theme) =>
              theme.palette.mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(15,118,110,0.05)",
          }}
        >
          <TableRow>
            <TableCell sx={{ width: 40, p: 1 }}>
              <IconButton size="small" onClick={toggleAll} color="primary">
                {rows.length > 0 && rows.every((r) => checked?.has(r.id)) ? (
                  <CheckCircle fontSize="small" />
                ) : (
                  <InfoOutlined fontSize="small" />
                )}
              </IconButton>
            </TableCell>
            <TableCell sx={{ fontWeight: 700, width: 50 }}>#</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>{tr("fullName")}</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>{tr("schoolKindergarten")}</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>{tr("exam")}</TableCell>
            {!showDeleted && <TableCell sx={{ fontWeight: 700 }}>{tr("heightWeight")}</TableCell>}
            {showDeleted && (
              <TableCell sx={{ fontWeight: 700, color: "error.main" }}>
                {tr("deletedDate")}
              </TableCell>
            )}
            <TableCell sx={{ fontWeight: 700 }} align="right">
              {tr("actions")}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
                {tr("noData")}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => (
              <TableRow
                key={row.id}
                hover
                sx={{
                  cursor: "pointer",
                  "&:hover": { background: "rgba(15,118,110,0.04)" },
                  bgcolor: checked?.has(row.id) ? "rgba(15,118,110,0.08)" : "inherit",
                }}
                onClick={() => onView(row)}
              >
                <TableCell
                  sx={{ p: 1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOne(row.id);
                  }}
                >
                  <IconButton size="small" color={checked?.has(row.id) ? "primary" : "default"}>
                    {checked?.has(row.id) ? (
                      <CheckCircle fontSize="small" />
                    ) : (
                      <Box
                        sx={{
                          width: 18,
                          height: 18,
                          border: "2px solid",
                          borderColor: "divider",
                          borderRadius: "4px",
                        }}
                      />
                    )}
                  </IconButton>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {idx + 1}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ width: 30, height: 30, fontSize: 12, bgcolor: "primary.light" }}>
                      {(row.full_name || "?").charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" fontWeight={600}>
                      {row.full_name || "—"}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{row.school_name || "—"}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.settlement || ""}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={row.examination_date || "—"}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: 11 }}
                  />
                </TableCell>
                {!showDeleted && (
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {row.chest_standing_height ? `${row.chest_standing_height} sm` : "—"} /
                      {row.weight ? ` ${row.weight} kg` : " —"}
                    </Typography>
                  </TableCell>
                )}
                {showDeleted && (
                  <TableCell>
                    <Typography variant="caption" color="error">
                      {row.deleted_at
                        ? new Date(row.deleted_at).toLocaleDateString(dateLocale)
                        : "—"}
                    </Typography>
                  </TableCell>
                )}
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title={tr("viewDetails")}>
                      <IconButton size="small" color="info" onClick={() => onView(row)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {!showDeleted && (
                      <>
                        <Tooltip title={tr("edit")}>
                          <IconButton size="small" color="primary" onClick={() => onEdit(row)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={tr("softDelete")}>
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => onDelete(row.id, "soft")}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {isSuperAdmin && (
                          <Tooltip title={tr("hardDelete")}>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onDelete(row.id, "hard")}
                            >
                              <DeleteForever fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/* ════════════════════════════════════════════════════
   FILTER BAR
════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════
   RESEARCH ANALYTICS (Professional Dashboard)
════════════════════════════════════════════════════ */
const ResearchAnalytics = ({ data, isDark }) => {
  const { lang } = useLanguage();
  const tr = useCallback((key) => researcherT(lang, key), [lang]);
  const [timeRange] = useState("all"); // "all" or "30d"

  // 1. Data Aggregation
  const stats = useMemo(() => {
    let filteredData = data;
    if (timeRange === "30d") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filteredData = data.filter((r) => new Date(r.created_at) >= thirtyDaysAgo);
    }

    const total = filteredData.length;
    const boys = filteredData.filter((r) => {
      const g = (r.gender || "").toLowerCase();
      return (
        g === "boy" ||
        g === "m" ||
        g === "male" ||
        g === "erkak" ||
        g.includes("o'g'il") ||
        g.includes("о'ғил")
      );
    }).length;
    const girls = filteredData.filter((r) => {
      const g = (r.gender || "").toLowerCase();
      return (
        g === "girl" ||
        g === "f" ||
        g === "female" ||
        g === "ayol" ||
        g.includes("qiz") ||
        g.includes("қиз")
      );
    }).length;

    // Average BMI Calculation
    const bmis = filteredData
      .map((r) =>
        r.weight && r.chest_standing_height
          ? r.weight / Math.pow(r.chest_standing_height / 100, 2)
          : null,
      )
      .filter((v) => v);
    const avgBmi = bmis.length ? (bmis.reduce((a, b) => a + b, 0) / bmis.length).toFixed(1) : "0";

    // Settlement Distribution
    const citiesMap = filteredData.reduce((acc, r) => {
      const city = r.settlement || tr("unknown");
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});
    const citiesData = Object.entries(citiesMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Gender Data
    const genderData = [
      { name: tr("boysCount"), value: boys, color: "#2563eb" },
      { name: tr("girlsCount"), value: girls, color: "#f50057" },
      { name: tr("unknown"), value: total - boys - girls, color: "#9e9e9e" },
    ].filter((g) => g.value > 0);

    // Age distribution metrics (Avg W/H by Age)
    const ageMap = filteredData.reduce((acc, r) => {
      if (!r.birth_date) return acc;
      const bDate = new Date(r.birth_date);
      const eDate = r.examination_date ? new Date(r.examination_date) : new Date();
      const age = Math.floor((eDate - bDate) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 0 || age > 20) return acc;

      if (!acc[age]) acc[age] = { age, weight: [], height: [], count: 0 };
      if (r.weight) acc[age].weight.push(r.weight);
      if (r.chest_standing_height) acc[age].height.push(r.chest_standing_height);
      acc[age].count++;
      return acc;
    }, {});

    const ageData = Object.values(ageMap)
      .map((a) => ({
        age: `${a.age} ${tr("ageYearsSuffix")}`,
        vazn: a.weight.length
          ? (a.weight.reduce((v1, v2) => v1 + v2, 0) / a.weight.length).toFixed(1)
          : 0,
        "bo'y": a.height.length
          ? (a.height.reduce((h1, h2) => h1 + h2, 0) / a.height.length).toFixed(1)
          : 0,
      }))
      .sort((a, b) => parseInt(a.age) - parseInt(b.age));

    // Progress Over Time
    const timelineMap = filteredData.reduce((acc, r) => {
      const date = new Date(r.created_at).toISOString().slice(0, 10);
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    const timelineData = Object.entries(timelineMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { total, boys, girls, avgBmi, genderData, citiesData, ageData, timelineData };
  }, [data, timeRange, tr]);

  return (
    <Stack spacing={4}>
      {/* ── Analytics Header ── */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight={900}>
            {tr("analytics")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tr("autoStatsSubtitle")}
          </Typography>
        </Box>
      </Box>

      {/* ── Key Metrics Cards ── */}
      <Grid container spacing={3}>
        {[
          { label: tr("totalRecords"), value: stats.total, icon: <People />, color: "#0f766e" },
          { label: tr("boysCount"), value: stats.boys, icon: <TrendingUp />, color: "#0ea5e9" },
          { label: tr("girlsCount"), value: stats.girls, icon: <TrendingUp />, color: "#ec4899" },
          { label: tr("avgBmi"), value: stats.avgBmi, icon: <Assessment />, color: "#10b981" },
        ].map((card, i) => (
          <Grid xs={12} sm={6} md={3} key={i}>
            <GlassPaper
              sx={{
                p: 3,
                textAlign: "center",
                border: "1px solid",
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: `${card.color}15`,
                  color: card.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 2,
                }}
              >
                {card.icon}
              </Box>
              <Typography variant="h4" fontWeight={900} sx={{ color: card.color }}>
                {card.value}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {card.label}
              </Typography>
            </GlassPaper>
          </Grid>
        ))}
      </Grid>

      {/* ── Charts Section ── */}
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <GlassPaper sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={800} mb={3}>
              {tr("genderDistribution")}
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.genderData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </GlassPaper>
        </Grid>

        <Grid xs={12} md={8}>
          <GlassPaper sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={800} mb={3}>
              {tr("topRegions")}
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.citiesData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 12, fontWeight: 600, fill: isDark ? "#eee" : "#555" }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip cursor={{ fill: "transparent" }} />
                <Bar dataKey="value" fill="#0f766e" radius={[0, 4, 4, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </GlassPaper>
        </Grid>

        <Grid xs={12}>
          <GlassPaper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={800} mb={3}>
              {tr("dataCollectionDynamics")}
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={stats.timelineData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "text.secondary" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "text.secondary" }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#0f766e"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </GlassPaper>
        </Grid>

        <Grid xs={12}>
          <GlassPaper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={800} mb={3}>
              {tr("ageAnthroIndicators")}
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={stats.ageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="age" />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="#0f766e"
                  label={{ value: tr("weight"), angle: -90, position: "insideLeft" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#f50057"
                  label={{ value: tr("standingHeight"), angle: 90, position: "insideRight" }}
                />
                <RechartsTooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="vazn"
                  fill="#0f766e"
                  radius={[4, 4, 0, 0]}
                  opacity={0.6}
                  name={tr("averageWeightKg")}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="bo'y"
                  stroke="#f50057"
                  strokeWidth={4}
                  dot={{ r: 6 }}
                  name={tr("averageHeightCm")}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </GlassPaper>
        </Grid>
      </Grid>

      <GlassPaper
        sx={{
          p: 4,
          textAlign: "center",
          background: isDark
            ? "linear-gradient(135deg, rgba(15,118,110,0.15) 0%, rgba(37,99,235,0.02) 100%)"
            : "linear-gradient(135deg, rgba(15,118,110,0.06) 0%, rgba(255,255,255,0.62) 100%)",
        }}
      >
        <Typography variant="h5" fontWeight={800} mb={1}>
          {tr("researchReportTitle")}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          {tr("researchReportSubtitle")}
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
          <Button
            variant="contained"
            size="large"
            onClick={async () => {
              try {
                const blob = await ResearchApi.exportDataset({});
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `full_analysis_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                toast.success(tr("downloadDone"));
              } catch (err) {
                toast.error(`${tr("error")}: ${err.message}`);
              }
            }}
            startIcon={<Download />}
            sx={{
              borderRadius: 3,
              px: 5,
              py: 2,
              fontWeight: 800,
              background: "linear-gradient(135deg, #0f766e 0%, #2563eb 100%)",
            }}
          >
            {tr("datasetXlsx")}
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={async () => {
              try {
                const blob = await ResearchApi.exportSummaryDocx({ lang });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `scientific_summary_${new Date().toISOString().slice(0, 10)}.docx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                toast.success(tr("docxReady"));
              } catch (err) {
                toast.error(`${tr("error")}: ${err.message}`);
              }
            }}
            startIcon={<Description />}
            sx={{ borderRadius: 3, px: 5, py: 2, fontWeight: 800 }}
          >
            {tr("docxReport")}
          </Button>
        </Stack>
      </GlassPaper>
    </Stack>
  );
};

/* ════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════ */
const EnhancedResearchAnalytics = ({ data, isDark }) => {
  const [timeRange, setTimeRange] = useState("all");

  const stats = useMemo(() => {
    const rows = Array.isArray(data) ? data : [];
    const toNumber = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };
    const avg = (values) => {
      const clean = values.map(toNumber).filter((value) => value !== null && value > 0);
      return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : 0;
    };
    const pct = (value, base) => (base ? Math.round((value / base) * 100) : 0);
    const getAge = (record) => {
      if (!record.birth_date) return null;
      const birthDate = new Date(record.birth_date);
      const examinationDate = record.examination_date
        ? new Date(record.examination_date)
        : new Date();
      if (Number.isNaN(birthDate.getTime()) || Number.isNaN(examinationDate.getTime())) return null;
      const age = Math.floor((examinationDate - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
      return age >= 0 && age <= 20 ? age : null;
    };
    const normalizeGender = (gender) => {
      const g = (gender || "").toLowerCase();
      if (g === "boy" || g === "m" || g === "male" || g === "erkak" || g.includes("o'g'il"))
        return "boy";
      if (g === "girl" || g === "f" || g === "female" || g === "ayol" || g.includes("qiz"))
        return "girl";
      return "unknown";
    };

    const filteredRows =
      timeRange === "30d"
        ? rows.filter((record) => {
            const createdAt = new Date(record.created_at);
            return (
              !Number.isNaN(createdAt.getTime()) && Date.now() - createdAt.getTime() < 30 * 86400000
            );
          })
        : rows;

    const total = filteredRows.length;
    const boys = filteredRows.filter((record) => normalizeGender(record.gender) === "boy").length;
    const girls = filteredRows.filter((record) => normalizeGender(record.gender) === "girl").length;
    const unknownGender = Math.max(total - boys - girls, 0);
    const bmiRows = filteredRows
      .map((record) => {
        const weight = toNumber(record.weight);
        const height = toNumber(record.chest_standing_height);
        if (!weight || !height) return null;
        return { ...record, weight, height, bmi: weight / Math.pow(height / 100, 2) };
      })
      .filter(Boolean);

    const fieldCounts = filteredRows.reduce(
      (acc, record) => {
        if (record.weight) acc.weight += 1;
        if (record.chest_standing_height) acc.height += 1;
        if (record.birth_date) acc.age += 1;
        if (record.settlement) acc.settlement += 1;
        if (record.school_name) acc.school += 1;
        return acc;
      },
      { weight: 0, height: 0, age: 0, settlement: 0, school: 0 },
    );
    const completeness = total
      ? Math.round(
          ((fieldCounts.weight +
            fieldCounts.height +
            fieldCounts.age +
            fieldCounts.settlement +
            fieldCounts.school) /
            (total * 5)) *
            100,
        )
      : 0;

    const topList = (key) =>
      Object.entries(
        filteredRows.reduce((acc, record) => {
          const name = record[key] || "Noma'lum";
          acc[name] = (acc[name] || 0) + 1;
          return acc;
        }, {}),
      )
        .map(([name, value]) => ({ name, value, percent: pct(value, total) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    const ageBuckets = filteredRows.reduce(
      (acc, record) => {
        const age = getAge(record);
        if (age === null) acc.unknown += 1;
        else if (age <= 6) acc.preschool += 1;
        else if (age <= 10) acc.primary += 1;
        else if (age <= 14) acc.middle += 1;
        else acc.teen += 1;
        return acc;
      },
      { preschool: 0, primary: 0, middle: 0, teen: 0, unknown: 0 },
    );

    const ageMap = filteredRows.reduce((acc, record) => {
      const age = getAge(record);
      if (age === null) return acc;
      if (!acc[age]) acc[age] = { age, count: 0, weight: [], height: [], bmi: [] };
      const weight = toNumber(record.weight);
      const height = toNumber(record.chest_standing_height);
      if (weight) acc[age].weight.push(weight);
      if (height) acc[age].height.push(height);
      if (weight && height) acc[age].bmi.push(weight / Math.pow(height / 100, 2));
      acc[age].count += 1;
      return acc;
    }, {});

    const timelineMap = filteredRows.reduce((acc, record) => {
      const createdAt = record.created_at ? new Date(record.created_at) : new Date();
      if (Number.isNaN(createdAt.getTime())) return acc;
      const date = createdAt.toISOString().slice(0, 10);
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    let cumulative = 0;
    const highBmi = bmiRows.filter((record) => record.bmi >= 25).length;
    const lowBmi = bmiRows.filter((record) => record.bmi < 18.5).length;
    const cityData = topList("settlement");
    const schoolData = topList("school_name");

    return {
      total,
      boys,
      girls,
      avgBmi: avg(bmiRows.map((record) => record.bmi)).toFixed(1),
      avgHeight: avg(filteredRows.map((record) => record.chest_standing_height)).toFixed(1),
      avgWeight: avg(filteredRows.map((record) => record.weight)).toFixed(1),
      bmiCoverage: pct(bmiRows.length, total),
      bmiRecords: bmiRows.length,
      completeness,
      quality: completeness >= 85 ? "Yuqori" : completeness >= 60 ? "O'rtacha" : "E'tibor kerak",
      genderBalance: total ? 100 - Math.abs(pct(boys, total) - pct(girls, total)) : 0,
      highBmiPercent: pct(highBmi, bmiRows.length),
      lowBmiPercent: pct(lowBmi, bmiRows.length),
      risk:
        bmiRows.length === 0
          ? "Ma'lumot yo'q"
          : pct(highBmi + lowBmi, bmiRows.length) >= 35
            ? "Kengaytirilgan kuzatuv"
            : "Barqaror kuzatuv",
      topCity: cityData[0],
      topSchool: schoolData[0],
      genderData: [
        { name: "O'g'il bolalar", value: boys, color: "#2563eb" },
        { name: "Qiz bolalar", value: girls, color: "#ec4899" },
        { name: "Noma'lum", value: unknownGender, color: "#94a3b8" },
      ].filter((item) => item.value > 0),
      bmiData: [
        { name: "BMI < 18.5", value: lowBmi, color: "#f59e0b" },
        {
          name: "18.5-24.9",
          value: bmiRows.filter((record) => record.bmi >= 18.5 && record.bmi < 25).length,
          color: "#10b981",
        },
        {
          name: "25-29.9",
          value: bmiRows.filter((record) => record.bmi >= 25 && record.bmi < 30).length,
          color: "#0ea5e9",
        },
        {
          name: "BMI >= 30",
          value: bmiRows.filter((record) => record.bmi >= 30).length,
          color: "#ef4444",
        },
      ].filter((item) => item.value > 0),
      ageGroupData: [
        { name: "0-6", value: ageBuckets.preschool, color: "#14b8a6" },
        { name: "7-10", value: ageBuckets.primary, color: "#2563eb" },
        { name: "11-14", value: ageBuckets.middle, color: "#8b5cf6" },
        { name: "15-20", value: ageBuckets.teen, color: "#f97316" },
        { name: "Noma'lum", value: ageBuckets.unknown, color: "#94a3b8" },
      ].filter((item) => item.value > 0),
      cityData,
      schoolData,
      ageData: Object.values(ageMap)
        .map((item) => ({
          age: `${item.age} yosh`,
          count: item.count,
          vazn: Number(avg(item.weight).toFixed(1)),
          "bo'y": Number(avg(item.height).toFixed(1)),
          bmi: Number(avg(item.bmi).toFixed(1)),
        }))
        .sort((a, b) => parseInt(a.age) - parseInt(b.age)),
      timelineData: Object.entries(timelineMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((item) => {
          cumulative += item.count;
          return { ...item, cumulative };
        }),
    };
  }, [data, timeRange]);

  const chartGrid = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.08)";
  const axisTick = isDark ? "#cbd5e1" : "#475569";
  const panelBg = isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.94)";

  return (
    <Stack spacing={4}>
      <GlassPaper
        sx={{
          p: { xs: 2.5, md: 3.5 },
          background: isDark
            ? "linear-gradient(135deg, rgba(15,23,42,0.88), rgba(20,83,45,0.32))"
            : "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(236,253,245,0.78))",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={3} justifyContent="space-between">
          <Box>
            <Chip
              icon={<Timeline fontSize="small" />}
              label="Real vaqtli tadqiqot paneli"
              sx={{ mb: 2, fontWeight: 900, color: "#047857", bgcolor: "rgba(16,185,129,0.12)" }}
            />
            <Typography variant="h4" fontWeight={950}>
              Analitika Markazi
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 780 }}>
              Tadqiqot ma'lumotlarining qamrovi, demografik tarkibi, antropometrik ko'rsatkichlari
              va ma'lumot sifati bo'yicha professional tahlil.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            {[
              { value: "all", label: "Barchasi" },
              { value: "30d", label: "30 kun" },
            ].map((option) => (
              <Button
                key={option.value}
                variant={timeRange === option.value ? "contained" : "outlined"}
                size="small"
                onClick={() => setTimeRange(option.value)}
                sx={{ borderRadius: 2.5, fontWeight: 900, textTransform: "none" }}
              >
                {option.label}
              </Button>
            ))}
          </Stack>
        </Stack>
      </GlassPaper>

      <Grid container spacing={3}>
        {[
          {
            label: "Jami yozuvlar",
            value: stats.total,
            helper: `${stats.boys} o'g'il / ${stats.girls} qiz`,
            icon: <People />,
            color: "#2563eb",
          },
          {
            label: "O'rtacha BMI",
            value: stats.avgBmi,
            helper: `${stats.bmiCoverage}% yozuvda BMI`,
            icon: <Assessment />,
            color: "#10b981",
          },
          {
            label: "Ma'lumot to'liqligi",
            value: `${stats.completeness}%`,
            helper: stats.quality,
            icon: <FactCheck />,
            color: "#f59e0b",
          },
          {
            label: "Jins balansi",
            value: `${stats.genderBalance}%`,
            helper: "Taqsimot muvozanati",
            icon: <TrendingUp />,
            color: "#8b5cf6",
          },
        ].map((card) => (
          <Grid xs={12} sm={6} md={3} key={card.label}>
            <GlassPaper sx={{ p: 2.5, height: "100%", background: panelBg }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 2,
                    bgcolor: `${card.color}16`,
                    color: card.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {card.icon}
                </Box>
                <Box>
                  <Typography
                    variant="h4"
                    fontWeight={950}
                    sx={{ color: card.color, lineHeight: 1 }}
                  >
                    {card.value}
                  </Typography>
                  <Typography variant="body2" fontWeight={900} sx={{ mt: 0.6 }}>
                    {card.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {card.helper}
                  </Typography>
                </Box>
              </Stack>
            </GlassPaper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {[
          {
            title: "Antropometrik profil",
            rows: [
              ["O'rtacha bo'y", `${stats.avgHeight} sm`],
              ["O'rtacha vazn", `${stats.avgWeight} kg`],
              ["BMI yozuvlari", `${stats.bmiRecords} ta`],
            ],
          },
          {
            title: "Kuzatuv xulosasi",
            rows: [
              ["Status", stats.risk],
              ["Yuqori BMI ulushi", `${stats.highBmiPercent}%`],
              ["Past BMI ulushi", `${stats.lowBmiPercent}%`],
            ],
          },
          {
            title: "Hududiy qamrov",
            rows: [
              ["Yetakchi hudud", stats.topCity?.name || "-"],
              ["Hudud ulushi", stats.topCity ? `${stats.topCity.percent}%` : "-"],
              ["Yetakchi muassasa", stats.topSchool?.name || "-"],
            ],
          },
        ].map((block) => (
          <Grid xs={12} md={4} key={block.title}>
            <GlassPaper
              sx={{
                p: 2.5,
                height: "100%",
                background: isDark ? "rgba(15,23,42,0.58)" : "rgba(248,250,252,0.92)",
              }}
            >
              <Stack direction="row" spacing={1.2} alignItems="center" mb={2}>
                <WarningAmber sx={{ color: "#f59e0b" }} />
                <Typography variant="subtitle1" fontWeight={950}>
                  {block.title}
                </Typography>
              </Stack>
              <Stack spacing={1.2}>
                {block.rows.map(([label, value]) => (
                  <Box
                    key={label}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                      p: 1.2,
                      borderRadius: 2,
                      bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.82)",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" fontWeight={700}>
                      {label}
                    </Typography>
                    <Typography variant="body2" fontWeight={950} textAlign="right">
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </GlassPaper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {[
          ["Jinsi bo'yicha taqsimot", stats.genderData],
          ["BMI segmentlari", stats.bmiData],
        ].map(([title, chartData]) => (
          <Grid xs={12} md={4} key={title}>
            <GlassPaper sx={{ p: 3, height: "100%" }}>
              <Typography variant="subtitle1" fontWeight={900} mb={3}>
                {title}
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={58}
                    outerRadius={84}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`${title}-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </GlassPaper>
          </Grid>
        ))}
        <Grid xs={12} md={4}>
          <GlassPaper sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={900} mb={3}>
              Yosh guruhlari
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.ageGroupData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: axisTick }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: axisTick }} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: "transparent" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={34}>
                  {stats.ageGroupData.map((entry, index) => (
                    <Cell key={`age-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassPaper>
        </Grid>

        <Grid xs={12} md={7}>
          <GlassPaper sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={900} mb={3}>
              Top 5 hududlar
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.cityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartGrid} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={110}
                  tick={{ fontSize: 12, fontWeight: 700, fill: axisTick }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip cursor={{ fill: "transparent" }} />
                <Bar dataKey="value" fill="#2563eb" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </GlassPaper>
        </Grid>
        <Grid xs={12} md={5}>
          <GlassPaper sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={900} mb={3}>
              Top muassasalar
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.schoolData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartGrid} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={125}
                  tick={{ fontSize: 11, fontWeight: 700, fill: axisTick }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip cursor={{ fill: "transparent" }} />
                <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </GlassPaper>
        </Grid>

        <Grid xs={12}>
          <GlassPaper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={900} mb={3}>
              Ma'lumotlar yig'ish dinamikasi
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={stats.timelineData}>
                <defs>
                  <linearGradient id="enhancedColorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: axisTick }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 10, fill: axisTick }} axisLine={false} tickLine={false} />
                <RechartsTooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#enhancedColorCount)"
                  name="Kunlik yozuv"
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={false}
                  name="Jami yig'indi"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </GlassPaper>
        </Grid>

        <Grid xs={12}>
          <GlassPaper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={900} mb={3}>
              Yosh bo'yicha antropometrik ko'rsatkichlar
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={stats.ageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid} />
                <XAxis dataKey="age" tick={{ fill: axisTick, fontSize: 12 }} />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="#2563eb"
                  label={{ value: "Vazn / BMI", angle: -90, position: "insideLeft" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#ec4899"
                  label={{ value: "Bo'y (sm)", angle: 90, position: "insideRight" }}
                />
                <RechartsTooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="vazn"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                  opacity={0.58}
                  name="O'rtacha vazn (kg)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="bo'y"
                  stroke="#ec4899"
                  strokeWidth={4}
                  dot={{ r: 5 }}
                  name="O'rtacha bo'y (sm)"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="bmi"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="O'rtacha BMI"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </GlassPaper>
        </Grid>
      </Grid>

      <GlassPaper
        sx={{
          p: 4,
          textAlign: "center",
          background: isDark
            ? "linear-gradient(135deg, rgba(16,185,129,0.16) 0%, rgba(37,99,235,0.08) 100%)"
            : "linear-gradient(135deg, rgba(236,253,245,0.94) 0%, rgba(239,246,255,0.8) 100%)",
        }}
      >
        <Typography variant="h5" fontWeight={950} mb={1}>
          Tadqiqot Hisoboti
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          Barcha to'plangan ma'lumotlarni tahliliy formatda (.xlsx) yuklab oling
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={async () => {
            try {
              const blob = await ResearchApi.exportDataset({});
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `full_analysis_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
              toast.success("Yuklab olish yakunlandi");
            } catch (err) {
              toast.error("Xatolik: " + err.message);
            }
          }}
          startIcon={<Download />}
          sx={{
            borderRadius: 3,
            px: { xs: 3, sm: 8 },
            py: 2,
            fontWeight: 900,
            background: "linear-gradient(135deg, #059669 0%, #2563eb 100%)",
          }}
        >
          To'liq bazani eksport qilish
        </Button>
      </GlassPaper>
    </Stack>
  );
};

const ResearcherPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { lang } = useLanguage();
  const tr = useCallback((key) => researcherT(lang, key), [lang]);
  const pt = useCallback((key, fallback) => pageT(lang, key, fallback), [lang]);
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(0); // 0 = Asosiy
  const [data, setData] = useState([]);
  const [deletedData, setDeletedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [checked, setChecked] = useState(new Set());
  const [filter, setFilter] = useState({
    search: "",
    full_name: "",
    school_name: "",
    settlement: "",
    feeding_type: "",
    parents_marriage: "",
    weight_min: "",
    weight_max: "",
    height_min: "",
    height_max: "",
    date_from: "",
    date_to: "",
  });

  // Modals
  const [detailRecord, setDetailRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef(null);
  const sectionToTab = useMemo(
    () => ({
      home: 0,
      analyze: 1,
      panel: 2,
      deleted: 3,
    }),
    [],
  );
  const showLocalResearcherNav = false;

  useEffect(() => {
    const section = new URLSearchParams(location.search).get("section") || "home";
    const nextTab = sectionToTab[section] ?? 0;
    setActiveTab(!isSuperAdmin && nextTab === 3 ? 0 : nextTab);
    setChecked(new Set());
  }, [isSuperAdmin, location.search, sectionToTab]);

  const toggleAll = useCallback(() => {
    const rows = activeTab === 3 ? deletedData : data;
    const next = new Set(checked);
    const allChecked = rows.length > 0 && rows.every((r) => checked.has(r.id));
    if (allChecked) rows.forEach((r) => next.delete(r.id));
    else rows.forEach((r) => next.add(r.id));
    setChecked(next);
  }, [checked, data, deletedData, activeTab]);

  const toggleOne = useCallback(
    (id) => {
      const next = new Set(checked);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setChecked(next);
    },
    [checked],
  );

  // Keyboard shortcut for deletion
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Delete" || e.code === "Delete" || e.key === "Backspace") {
        const el = document.activeElement;
        const tag = el.tagName.toUpperCase();
        const isTextInput =
          (tag === "INPUT" &&
            !["checkbox", "radio", "range", "button", "submit"].includes(el.type)) ||
          tag === "TEXTAREA" ||
          el.isContentEditable;

        if (isTextInput) return;

        if (checked.size > 0 && (activeTab === 2 || activeTab === 3)) {
          setDeleteConfirmOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [checked.size, activeTab]);

  const fetchData = useCallback(
    async (filterParams = filter) => {
      setLoading(true);
      try {
        const result = await ResearchApi.list(filterParams);
        setData(result);
      } catch (err) {
        console.error(err);
        toast.error(tr("loadError"));
      } finally {
        setLoading(false);
      }
    },
    [filter, tr],
  );

  const fetchDeleted = useCallback(async () => {
    if (!isSuperAdmin) return;
    setDeletedLoading(true);
    try {
      const result = await ResearchApi.deletedList();
      setDeletedData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletedLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (activeTab === 0 || activeTab === 2) fetchData();
    if (activeTab === 3 && isSuperAdmin) fetchDeleted();
  }, [activeTab, fetchData, fetchDeleted, isSuperAdmin]);

  const handleSearch = () => fetchData(filter);

  const handleExport = async () => {
    try {
      const blob = await ResearchApi.exportXlsx({ ...filter, lang });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `research_data_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(`${tr("exportError")}: ${err.message}`);
    }
  };

  const handleExportSummaryDocx = async () => {
    try {
      const blob = await ResearchApi.exportSummaryDocx({ ...filter, lang });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scientific_summary_${new Date().toISOString().slice(0, 10)}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(tr("docxReady"));
    } catch (err) {
      toast.error(`${tr("exportError")}: ${err.message}`);
    }
  };

  const handleDownloadImportTemplate = async () => {
    try {
      const blob = await ResearchApi.downloadImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "research_import_template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(`${tr("templateError")} ${err.message}`);
    }
  };

  const handleImportXlsx = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImporting(true);
    try {
      const result = await ResearchApi.importXlsx(file);
      toast.success(
        `${result.imported || 0} ta yozuv import qilindi${
          result.skipped ? `, ${result.skipped} ta bo'sh satr o'tkazib yuborildi` : ""
        }`,
      );
      fetchData();
    } catch (err) {
      toast.error(`Import xatoligi: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (idOrIds, type) => {
    const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    if (ids.length === 0) return;

    setDeleteConfirmLoading(true);
    try {
      if (type === "hard") {
        for (const id of ids) await ResearchApi.hardDelete(id);
        toast.success(ids.length > 1 ? tr("hardDeletedMany") : tr("hardDeletedOne"));
      } else if (type === "restore") {
        for (const id of ids) await ResearchApi.restore(id);
        toast.success(ids.length > 1 ? tr("restoredMany") : tr("restoredOne"));
      } else {
        for (const id of ids) await ResearchApi.softDelete(id);
        toast.success(ids.length > 1 ? tr("movedTrashMany") : tr("movedTrashOne"));
      }

      setChecked(new Set());
      setDeleteConfirmOpen(false);
      fetchData();
      if (isSuperAdmin) fetchDeleted();
    } catch (err) {
      toast.error(`${tr("error")}: ${err.message}`);
    } finally {
      setDeleteConfirmLoading(false);
    }
  };

  const TABS = [
    { label: pt("homeTab"), icon: <Dashboard />, color: "#0f766e" },
    { label: pt("analyzeTab"), icon: <Add />, color: "#00c853" },
    { label: pt("researcherPanelTab"), icon: <Assessment />, color: "#673ab7" },
    ...(isSuperAdmin ? [{ label: tr("deleted"), icon: <Delete />, color: "#f44336" }] : []),
  ];

  const Stats = () => (
    <Grid container spacing={2} mb={3}>
      {[
        { label: tr("totalRecords"), value: data.length, color: "#0f766e", icon: <Analytics /> },
        {
          label: tr("last30Days"),
          value: data.filter((r) => {
            const d = new Date(r.created_at);
            return Date.now() - d.getTime() < 30 * 86400000;
          }).length,
          color: "#00c853",
          icon: <Refresh />,
        },
        ...(isSuperAdmin
          ? [
              {
                label: tr("deletedRecords"),
                value: deletedData.length,
                color: "#f44336",
                icon: <DeleteForever />,
              },
            ]
          : []),
      ].map(({ label, value, color, icon }) => (
        <Grid xs={12} sm={isSuperAdmin ? 4 : 6} key={label}>
          <GlassPaper
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
              border: "1px solid",
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
            }}
          >
            <Box
              sx={{ p: 1.5, borderRadius: 3, bgcolor: isDark ? `${color}15` : `${color}08`, color }}
            >
              {icon}
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ color }}>
                {value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
            </Box>
          </GlassPaper>
        </Grid>
      ))}
    </Grid>
  );

  const ResearcherHome = () => {
    const recentCount = data.filter((r) => {
      const d = new Date(r.created_at);
      return Date.now() - d.getTime() < 30 * 86400000;
    }).length;

    const reportMetrics = [
      {
        label: tr("totalRecords"),
        value: data.length,
        helper: pt("researchBase"),
        color: "#0891b2",
      },
      { label: "30 kun", value: recentCount, helper: pt("newlyEntered"), color: "#16a34a" },
      {
        label: pt("featureReportsTitle"),
        value: "DOCX",
        helper: pt("exportReady"),
        color: "#ca8a04",
      },
    ];

    const featureCards = [
      {
        title: pt("analyzeTab"),
        text: pt("featureAnalyzeText"),
        icon: <Science />,
        color: "#0891b2",
      },
      {
        title: pt("researcherPanelTab"),
        text: pt("featurePanelText"),
        icon: <People />,
        color: "#16a34a",
      },
      {
        title: pt("featureStatsTitle"),
        text: pt("featureStatsText"),
        icon: <TrendingUp />,
        color: "#2563eb",
      },
      {
        title: pt("featureReportsTitle"),
        text: pt("featureReportsText"),
        icon: <Description />,
        color: "#ca8a04",
      },
    ];
    const researcherProfileItems = [
      {
        label: pt("researchTopic"),
        value: user?.research_topic,
        icon: <Science fontSize="small" />,
        color: "#0891b2",
      },
      {
        label: pt("researchType"),
        value: user?.research_type,
        icon: <Assessment fontSize="small" />,
        color: "#2563eb",
      },
      {
        label: pt("researchArea"),
        value: user?.research_area,
        icon: <Place fontSize="small" />,
        color: "#ca8a04",
      },
      {
        label: pt("scientificSupervisor"),
        value: user?.scientific_supervisor,
        icon: <Person fontSize="small" />,
        color: "#16a34a",
      },
    ];

    return (
      <Box sx={{ minHeight: { xs: "auto", md: "calc(100vh - 120px)" }, position: "relative" }}>
        <Grid container spacing={{ xs: 4, md: 7 }} alignItems="center">
          <Grid xs={12} md={6} lg={7}>
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  px: 2,
                  py: 0.9,
                  mb: 3,
                  borderRadius: 999,
                  color: "primary.main",
                  bgcolor: isDark ? "rgba(45, 212, 191, 0.10)" : "rgba(8, 145, 178, 0.09)",
                  border: "1px solid",
                  borderColor: isDark ? "rgba(94, 234, 212, 0.22)" : "rgba(8, 145, 178, 0.18)",
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                <CheckCircle fontSize="small" />
                {pt("researcherHeroBadge", "Izlanuvchi uchun raqamli antropometriya")}
              </Box>

              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "2.55rem", sm: "3.75rem", md: "5.1rem", lg: "5.8rem" },
                  fontWeight: 800,
                  lineHeight: 1.02,
                  letterSpacing: 0,
                  mb: 3,
                  color: "text.primary",
                }}
              >
                {pt("researcherHeroTitle1", "Raqamli")}
                <Box
                  component="span"
                  sx={{
                    display: { xs: "inline", sm: "block" },
                    background: "linear-gradient(90deg, #0f766e 0%, #0891b2 45%, #2563eb 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {" "}
                  {pt("researcherHeroTitle2")}
                </Box>
              </Typography>

              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ maxWidth: 760, lineHeight: 1.7, fontWeight: 500 }}
              >
                {pt(
                  "researcherHeroDesc",
                  "Izlanuvchi uchun asosiy sahifa ma'lumot kiritish, klinik-antropometrik yozuvlarni tartiblash, statistik ko'rsatkichlarni ko'rish va hisobotlarni tayyorlash jarayonini bitta yo'nalishda birlashtiradi.",
                )}
              </Typography>

              {!isSuperAdmin && (
                <Grid container spacing={2} sx={{ mt: 3, maxWidth: 780 }}>
                  {researcherProfileItems.map((item) => (
                    <Grid xs={12} sm={6} key={item.label}>
                      <Box
                        sx={{
                          height: "100%",
                          p: 2,
                          borderRadius: 3,
                          bgcolor: isDark ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.72)",
                          border: "1px solid",
                          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(8,47,73,0.08)",
                        }}
                      >
                        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1 }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 2,
                              display: "grid",
                              placeItems: "center",
                              color: item.color,
                              bgcolor: `${item.color}18`,
                              flexShrink: 0,
                            }}
                          >
                            {item.icon}
                          </Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={700}>
                            {item.label}
                          </Typography>
                        </Stack>
                        <Typography variant="body1" fontWeight={700} sx={{ lineHeight: 1.45 }}>
                          {item.value || pt("notSelected")}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Science />}
                  onClick={() => navigate("/researcher?section=analyze")}
                  sx={{
                    borderRadius: 3,
                    px: 3.5,
                    py: 1.6,
                    fontWeight: 900,
                    textTransform: "none",
                    boxShadow: "0 18px 38px rgba(8, 145, 178, 0.24)",
                  }}
                >
                  {pt("analyzeTab")}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Assessment />}
                  onClick={() => navigate("/researcher?section=panel")}
                  sx={{
                    borderRadius: 3,
                    px: 3.5,
                    py: 1.6,
                    fontWeight: 900,
                    textTransform: "none",
                    bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.68)",
                  }}
                >
                  {pt("researcherPanelTab")}
                </Button>
              </Stack>
            </motion.div>
          </Grid>

          <Grid xs={12} md={6} lg={5}>
            <motion.div
              initial={{ opacity: 0, y: 34, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.75, ease: "easeOut", delay: 0.1 }}
            >
              <GlassPaper
                sx={{
                  p: { xs: 2.5, md: 3 },
                  borderRadius: 5,
                  overflow: "hidden",
                  background: isDark
                    ? "linear-gradient(145deg, rgba(15,23,42,0.78), rgba(8,47,73,0.52))"
                    : "linear-gradient(145deg, rgba(255,255,255,0.88), rgba(240,249,255,0.74))",
                  boxShadow: isDark
                    ? "0 28px 80px rgba(0,0,0,0.36)"
                    : "0 28px 80px rgba(15,23,42,0.12)",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
                  <Box>
                    <Typography variant="overline" color="primary.main" fontWeight={800}>
                      {pt("liveReport")}
                    </Typography>
                    <Typography variant="h5" fontWeight={800}>
                      {pt("researchStatus")}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 54,
                      height: 54,
                      borderRadius: 3,
                      display: "grid",
                      placeItems: "center",
                      color: "#0891b2",
                      bgcolor: "rgba(8,145,178,0.12)",
                    }}
                  >
                    <Analytics />
                  </Box>
                </Stack>

                <Grid container spacing={1.5}>
                  {reportMetrics.map((metric) => (
                    <Grid xs={12} sm={4} key={metric.label}>
                      <Box
                        sx={{
                          p: 1.6,
                          borderRadius: 3,
                          bgcolor: isDark ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.72)",
                          border: "1px solid",
                          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(8,47,73,0.08)",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary" fontWeight={800}>
                          {metric.label}
                        </Typography>
                        <Typography variant="h4" fontWeight={800} sx={{ color: metric.color }}>
                          {metric.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {metric.helper}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                <Box
                  sx={{
                    mt: 2.5,
                    p: 2.2,
                    borderRadius: 3,
                    bgcolor: isDark ? "rgba(15,118,110,0.10)" : "rgba(15,118,110,0.06)",
                    border: "1px solid rgba(15,118,110,0.16)",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 2.5,
                        display: "grid",
                        placeItems: "center",
                        color: "#16a34a",
                        bgcolor: "rgba(22,163,74,0.12)",
                      }}
                    >
                      <CheckCircle />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={800}>
                        {pt("dataReady")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pt("dataReadyDesc")}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </GlassPaper>
            </motion.div>
          </Grid>
        </Grid>

        <Grid container spacing={2.5} sx={{ mt: { xs: 5, md: 7 } }}>
          {featureCards.map((card) => (
            <Grid xs={12} sm={6} md={3} key={card.title}>
              <GlassPaper
                sx={{
                  p: 2.5,
                  height: "100%",
                  borderRadius: 3,
                  background: isDark ? "rgba(15,23,42,0.70)" : "rgba(255,255,255,0.86)",
                  transition: "transform 0.24s ease, box-shadow 0.24s ease",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: isDark
                      ? "0 18px 48px rgba(0,0,0,0.34)"
                      : "0 18px 48px rgba(15,23,42,0.10)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    mb: 2,
                    borderRadius: 2.5,
                    display: "grid",
                    placeItems: "center",
                    color: card.color,
                    bgcolor: `${card.color}16`,
                  }}
                >
                  {card.icon}
                </Box>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                  {card.text}
                </Typography>
              </GlassPaper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 10 }}>
      <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, md: 4 } }}>
        {showLocalResearcherNav && (
          <>
            {/* ── Page Header ── */}
            <GlassPaper
              sx={{
                p: { xs: 2, md: 3 },
                mb: 4,
                position: "sticky",
                top: 12,
                zIndex: 10,
                overflow: "visible",
              }}
            >
              <Grid container alignItems="center" spacing={2}>
                <Grid xs={12} md={4}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar
                      sx={{
                        width: 50,
                        height: 50,
                        background: "linear-gradient(135deg, #0f766e 0%, #2563eb 100%)",
                        fontSize: 20,
                        fontWeight: 900,
                        boxShadow: "0 4px 12px rgba(15,118,110,0.24)",
                      }}
                    >
                      {user?.name?.charAt(0).toUpperCase() || "I"}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={800} noWrap sx={{ lineHeight: 1.2 }}>
                        {user?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        {isSuperAdmin ? tr("roleSuperAdmin") : tr("roleResearcher")}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid xs={12} md={8}>
                  <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    centered={false}
                    sx={{
                      minHeight: 40,
                      "& .MuiTabs-indicator": {
                        height: 4,
                        borderRadius: "4px 4px 0 0",
                        bgcolor: "primary.main",
                      },
                      "& .MuiTab-root": {
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: { xs: 0.8, sm: 0.95, md: 1 },
                        minHeight: 48,
                        minWidth: { xs: 132, sm: 150, md: 170 },
                        flexShrink: 0,
                        px: { xs: 1, sm: 2 },
                        whiteSpace: "nowrap",
                        transition: "all 0.2s ease",
                        "&.Mui-selected": {
                          color: "primary.main",
                        },
                        "&:hover": {
                          color: "primary.light",
                          bgcolor: "rgba(15,118,110,0.04)",
                        },
                      },
                    }}
                  >
                    {TABS.map((tab, i) => (
                      <Tab
                        key={i}
                        label={
                          <Stack
                            component="span"
                            direction="row"
                            alignItems="center"
                            justifyContent="center"
                            spacing={1}
                            sx={{ minWidth: 0 }}
                          >
                            <Box
                              component="span"
                              sx={{
                                display: "inline-flex",
                                color: activeTab === i ? "primary.main" : "text.secondary",
                              }}
                            >
                              {tab.icon}
                            </Box>
                            <Typography
                              component="span"
                              variant="body2"
                              fontWeight={800}
                              sx={{
                                display: "inline",
                                color: activeTab === i ? "primary.main" : "text.primary",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {tab.label}
                            </Typography>
                          </Stack>
                        }
                        aria-label={tab.label}
                      />
                    ))}
                  </Tabs>
                </Grid>
              </Grid>
            </GlassPaper>
          </>
        )}

        {/* ── Main Content Area ── */}
        <Box sx={{ minHeight: "70vh" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.99, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.01, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 0 && <ResearcherHome />}

              {activeTab === 1 && (
                <Box>
                  <ResearcherForm
                    onSuccess={() => {
                      fetchData();
                    }}
                  />
                </Box>
              )}

              {activeTab === 2 && (
                <Stack spacing={3}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h4" fontWeight={900}>
                        {pt("researcherPanelTab")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {tr("databaseSubtitle")}
                      </Typography>
                      {!isSuperAdmin && (
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={{ xs: 0.5, sm: 2 }}
                          sx={{ mt: 1 }}
                        >
                          <Typography variant="caption" color="text.secondary" fontWeight={800}>
                            {pt("researchTopic")}:{" "}
                            <Box component="span" sx={{ color: "text.primary", fontWeight: 900 }}>
                              {user?.research_topic || pt("notSelected")}
                            </Box>
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontWeight={800}>
                            {pt("researchType")}:{" "}
                            <Box component="span" sx={{ color: "text.primary", fontWeight: 900 }}>
                              {user?.research_type || pt("notSelected")}
                            </Box>
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontWeight={800}>
                            {pt("researchArea")}:{" "}
                            <Box component="span" sx={{ color: "text.primary", fontWeight: 900 }}>
                              {user?.research_area || pt("notSelected")}
                            </Box>
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontWeight={800}>
                            {pt("scientificSupervisor")}:{" "}
                            <Box component="span" sx={{ color: "text.primary", fontWeight: 900 }}>
                              {user?.scientific_supervisor || pt("notSelected")}
                            </Box>
                          </Typography>
                        </Stack>
                      )}
                    </Box>
                    <Box display="flex" gap={2} flexWrap="wrap">
                      <input
                        ref={importInputRef}
                        type="file"
                        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        hidden
                        onChange={handleImportXlsx}
                      />
                      <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<Description />}
                        onClick={handleExportSummaryDocx}
                        sx={{ borderRadius: 2 }}
                      >
                        {tr("docxReport")}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Description />}
                        onClick={handleDownloadImportTemplate}
                        sx={{ borderRadius: 2 }}
                      >
                        {tr("template")}
                      </Button>
                      <Button
                        variant="outlined"
                        color="success"
                        startIcon={importing ? <CircularProgress size={18} /> : <CloudUpload />}
                        onClick={() => importInputRef.current?.click()}
                        disabled={importing}
                        sx={{ borderRadius: 2 }}
                      >
                        {tr("importXlsx")}
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => setDeleteConfirmOpen(true)}
                        disabled={checked.size === 0}
                        sx={{ borderRadius: 2 }}
                      >
                        {tr("delete")} ({checked.size})
                      </Button>
                      <Chip
                        icon={<Visibility sx={{ color: "inherit !important" }} />}
                        label={`${data.length} ${tr("records")}`}
                        color="primary"
                        sx={{ fontWeight: 800, py: 2, px: 2, borderRadius: 2, height: 40 }}
                      />
                    </Box>
                  </Box>

                  <Stats />

                  <AdvancedResearchFilter
                    filter={filter}
                    setFilter={setFilter}
                    onSearch={handleSearch}
                    onExport={handleExport}
                  />

                  <RecordsTable
                    rows={data}
                    loading={loading}
                    checked={checked}
                    toggleAll={toggleAll}
                    toggleOne={toggleOne}
                    onView={setDetailRecord}
                    onEdit={setEditRecord}
                    onDelete={(id, type) => {
                      if (type === "soft") {
                        setChecked(new Set([id]));
                        setDeleteConfirmOpen(true);
                      } else {
                        handleDelete(id, type);
                      }
                    }}
                    isSuperAdmin={isSuperAdmin}
                    tr={tr}
                    lang={lang}
                  />

                  <DashboardFilters
                    filters={filter}
                    onFilterChange={(newFilters) => {
                      setFilter(newFilters);
                      fetchData(newFilters);
                    }}
                    onReset={() => {
                      const empty = {
                        search: "",
                        full_name: "",
                        school_name: "",
                        settlement: "",
                        gender: "",
                        age_min: 0,
                        age_max: 100,
                        bmi_min: 10,
                        bmi_max: 50,
                        somatotype: "",
                        date_from: "",
                        date_to: "",
                      };
                      setFilter(empty);
                      fetchData(empty);
                    }}
                  />
                  <Box sx={{ mt: 3 }}>
                    <ResearchStatisticsPanel rows={data} />
                  </Box>
                  <EnhancedResearchAnalytics data={data} isDark={isDark} />
                </Stack>
              )}

              {activeTab === 3 && isSuperAdmin && (
                <Stack spacing={3}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h4" fontWeight={900}>
                        {tr("deleted")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {tr("restoreOrClean")}
                      </Typography>
                    </Box>
                    <Button
                      startIcon={<Refresh />}
                      onClick={fetchDeleted}
                      variant="contained"
                      color="warning"
                      sx={{ borderRadius: 2 }}
                    >
                      {tr("refresh")}
                    </Button>
                  </Box>
                  <Alert
                    severity="info"
                    variant="outlined"
                    sx={{
                      borderRadius: 3,
                      border: "1px dashed",
                      bgcolor: "rgba(2, 136, 209, 0.05)",
                    }}
                  >
                    {pt("trashInfo")}
                  </Alert>
                  <RecordsTable
                    rows={deletedData}
                    loading={deletedLoading}
                    checked={checked}
                    toggleAll={toggleAll}
                    toggleOne={toggleOne}
                    onView={setDetailRecord}
                    onEdit={() => {}}
                    onDelete={handleDelete}
                    isSuperAdmin={isSuperAdmin}
                    showDeleted
                    tr={tr}
                    lang={lang}
                  />
                  {checked.size > 0 && (
                    <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<Refresh />}
                        onClick={() => handleDelete(Array.from(checked), "restore")}
                      >
                        {tr("restore")} ({checked.size})
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<DeleteForever />}
                        onClick={() => setDeleteConfirmOpen(true)}
                      >
                        {tr("hardDelete")} ({checked.size})
                      </Button>
                    </Box>
                  )}
                </Stack>
              )}
            </motion.div>
          </AnimatePresence>
        </Box>
        {/* ── Modals ── */}
        <DetailModal
          record={detailRecord}
          open={!!detailRecord}
          onClose={() => setDetailRecord(null)}
          onEdit={(r) => {
            setDetailRecord(null);
            setEditRecord(r);
          }}
          onDelete={(id, type) => {
            handleDelete(id, type);
            setDetailRecord(null);
          }}
          isSuperAdmin={isSuperAdmin}
        />

        <EditModal
          record={editRecord}
          open={!!editRecord}
          onClose={() => setEditRecord(null)}
          onSaved={() => fetchData()}
        />

        <LogoutConfirmDialog
          open={logoutDialogOpen}
          onClose={() => setLogoutDialogOpen(false)}
          onConfirm={() => {
            setLogoutDialogOpen(false);
            logout();
          }}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>{tr("delete")}</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {tr("selectedRecordsPrefix")}: <strong>{checked.size}</strong>.{" "}
              {isSuperAdmin && activeTab === 3 ? tr("confirmHardDelete") : tr("confirmSoftDelete")}
            </Typography>
            {isSuperAdmin && activeTab === 3 && (
              <Box
                sx={{
                  bgcolor: "error.lighter",
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "error.light",
                }}
              >
                <Typography
                  variant="caption"
                  color="error.dark"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <DeleteForever fontSize="small" /> {pt("hardDeleteNote")}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">
              {tr("cancel")}
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() =>
                handleDelete(Array.from(checked), isSuperAdmin && activeTab === 3 ? "hard" : "soft")
              }
              disabled={deleteConfirmLoading}
            >
              {deleteConfirmLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : isSuperAdmin && activeTab === 3 ? (
                tr("hardDeletedOne")
              ) : (
                tr("delete")
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ResearcherPage;

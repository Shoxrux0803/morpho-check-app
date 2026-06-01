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

/* ════════════════════════════════════════════════════
   DETAIL MODAL
════════════════════════════════════════════════════ */
const DetailModal = ({ record, open, onClose, onEdit, onDelete, isSuperAdmin }) => {
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
                      ? "O'g'il bola"
                      : "Qiz bola"
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
              {record.full_name || "Noma'lum"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ID: {record.id} | Sana: {record.examination_date || "-"} | Yaratildi:{" "}
              {new Date(record.created_at).toLocaleDateString("uz-UZ")}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Section
          title="I. Pasport / Umumiy Ma'lumotlar"
          Icon={Person}
          fields={[
            ["F.I.SH", "full_name"],
            ["Maktab / Bog'cha", "school_name"],
            ["Aholi punkti", "settlement"],
            ["Tug'ilgan joyi", "birth_place"],
            ["Tug'ilgan sana", "birth_date"],
            ["Jinsi", "gender"],
            ["Ota millati", "father_nationality"],
            ["Ona millati", "mother_nationality"],
            ["Yashashni boshlagan", "living_since"],
            ["Muassasaga qabul", "enrolled_date"],
            ["Maishiy sharoit", "living_conditions"],
            ["Mehnat rejimi", "labor_regime"],
            ["O'tkir kasalliklar", "past_illnesses"],
            ["Farzandlar soni", "children_count"],
            ["Nechanchi farzand", "child_order"],
            ["Oziqlanish turi", "feeding_type"],
            ["Ota-ona qarindoshligi", "parents_marriage"],
            ["Ona sog'ligi", "mother_health_status"],
            ["Tekshiruv sanasi", "examination_date"],
          ]}
        />
        <Section
          title="II. Jismoniy Rivojlanish (Oyoqlar)"
          Icon={Place}
          fields={[
            ["Pastki oyoq-qo'l", "lower_leg_total"],
            ["Pastki oyoq-qo'l uzunligi", "lower_leg_length"],
            ["Spina iliaca", "lower_leg_spina_iliaca"],
            ["Symphysion", "lower_leg_symphysion"],
            ["Tibiale balandligi", "tibiale_height"],
            ["Chanoq kengligi", "pelvic_width"],
            ["Son uzunligi", "thigh_length"],
            ["Son aylanasi", "thigh_circumference"],
            ["Boldir uzunligi", "calf_length"],
            ["Boldir aylanasi", "calf_circumference"],
            ["Oyoq panja uzunligi", "foot_length"],
            ["Tishlar soni", "teeth_count"],
            ["Menstruatsiya", "menstruation_start"],
          ]}
        />
        <Section
          title="III. Bosh suyagi"
          Icon={Science}
          fields={[
            ["Uzunasiga diametr", "skull_longitudinal"],
            ["Ko'ndalang diametr", "skull_transverse"],
            ["Bosh aylanasi", "head_circumference"],
            ["Peshona ko'ndalang", "forehead_transverse"],
            ["Bosh balandligi", "skull_height"],
            ["Asos uzunligi", "skull_base_length"],
            ["Asos kengligi", "skull_base_width"],
          ]}
        />
        <Section
          title="IV. Yuz o'lchamlari"
          Icon={Person}
          fields={[
            ["Yanoq diametri", "face_bizygomatic"],
            ["Pastki jag' diametri", "face_bigonial"],
            ["Morfologik balandlik", "face_morphological_height"],
            ["Fizionomik balandlik", "face_physiognomic_height"],
            ["Burun balandligi", "nose_height"],
            ["Burun kengligi", "nose_width"],
            ["Tashqi ko'z kengligi", "outer_canthal_width"],
            ["Ichki ko'z kengligi", "inner_canthal_width"],
            ["Lab qalinligi", "lips_mucosa_height"],
            ["Og'iz kengligi", "mouth_width"],
          ]}
        />
        <Section
          title="V. Ko'krak qafasi va gavda"
          Icon={FitnessCenter}
          fields={[
            ["Bo'y (tik)", "chest_standing_height"],
            ["Bo'y (o'tirgan)", "chest_sitting_height"],
            ["Vazn (kg)", "weight"],
            ["Tana uzunligi", "trunk_length"],
            ["Korpus uzunligi", "torso_length"],
            ["Ko'krak aylanasi (pauza)", "chest_circumference_pause"],
            ["Nafas olganda", "chest_circumference_inhale"],
            ["Nafas chiqarganda", "chest_circumference_exhale"],
            ["Bel aylanasi", "waist_circumference"],
            ["Qorin aylanasi", "abdomen_circumference"],
            ["Yuqori segment", "upper_segment_length"],
            ["Ko'ndalang diametr", "chest_transverse_diameter"],
            ["Old-orqa diametr", "chest_anteroposterior_diameter"],
            ["Ko'krak balandligi", "chest_height"],
          ]}
        />
        <Section
          title="VI. Qo'l va Yog' qatlami"
          Icon={FitnessCenter}
          fields={[
            ["Qo'l uzunligi", "arm_length"],
            ["Yelka uzunligi", "shoulder_length"],
            ["Yelka kengligi", "shoulder_width"],
            ["Yelka aylanasi (jami)", "arm_circumference_total"],
            ["Yelka aylanasi (tinch)", "shoulder_circumference_rest"],
            ["Yelka aylanasi (tarang)", "shoulder_circumference_flexed"],
            ["Bilak uzunligi", "forearm_length"],
            ["Panja uzunligi", "hand_length"],
            ["Dinamometriya", "dynamometry"],
            ["Triseps yog'i", "fat_triceps"],
            ["Biseps yog'i", "fat_biceps"],
            ["Kurak osti yog'i", "fat_subscapular"],
            ["Yonbosh yog'i", "fat_iliac"],
            ["Tizza orqa yog'i", "fat_popliteal"],
          ]}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            startIcon={<Description />}
            onClick={() => ResearchApi.downloadDocx(record.id, "uz")}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            DOCX (UZ)
          </Button>
          <Button
            size="small"
            startIcon={<Description />}
            onClick={() => ResearchApi.downloadDocx(record.id, "ru")}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            DOCX (RU)
          </Button>
        </Stack>
        <Box flex={1} />
        <Button startIcon={<Edit />} variant="contained" onClick={() => onEdit(record)}>
          Tahrirlash
        </Button>
        {isSuperAdmin && (
          <Button
            startIcon={<DeleteForever />}
            color="error"
            variant="outlined"
            onClick={() => onDelete(record.id, "hard")}
          >
            Hard Delete
          </Button>
        )}
        <Button
          startIcon={<Delete />}
          color="warning"
          variant="outlined"
          onClick={() => onDelete(record.id, "soft")}
        >
          O'chirish
        </Button>
        <Button onClick={onClose} variant="text">
          Yopish
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
              "Ota-ona qarindoshligi",
              "parents_marriage",
              "select",
              [
                {
                  value: "Yaqin qarindosh (близкородственный)",
                  label: "Yaqin qarindosh (близкородственный)",
                },
                {
                  value: "Uzoq qarindosh (дальнородственный)",
                  label: "Uzoq qarindosh (дальнородственный)",
                },
                {
                  value: "Qarindosh emas (неродственный)",
                  label: "Qarindosh emas (неродственный)",
                },
              ],
            ],
            ["Ona sog'ligi", "mother_health_status", "text"],
            ["Tekshiruv sanasi", "examination_date", "date"],
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
        <SectionTitle icon={Place} title="II. Jismoniy Rivojlanish (Oyoqlar)" />
        <Grid container spacing={2} pt={1}>
          {[
            ["Pastki oyoq-qo'l", "lower_leg_total"],
            ["Pastki oyoq-qo'l uzunligi", "lower_leg_length"],
            ["Spina iliaca", "lower_leg_spina_iliaca"],
            ["Symphysion", "lower_leg_symphysion"],
            ["Tibiale balandligi", "tibiale_height"],
            ["Chanoq kengligi", "pelvic_width"],
            ["Son uzunligi", "thigh_length"],
            ["Son aylanasi", "thigh_circumference"],
            ["Boldir uzunligi", "calf_length"],
            ["Boldir aylanasi", "calf_circumference"],
            ["Oyoq panja uzunligi", "foot_length"],
            ["Tishlar soni", "teeth_count"],
          ].map(([label, k, type]) => (
            <Grid xs={12} sm={6} md={4} key={k}>
              <F label={label} k={k} type={type || "number"} />
            </Grid>
          ))}
        </Grid>

        {/* Section III: Skull */}
        <SectionTitle icon={Science} title="III. Bosh suyagi" />
        <Grid container spacing={2} pt={1}>
          {[
            ["Uzunasiga diametr", "skull_longitudinal"],
            ["Ko'ndalang diametr", "skull_transverse"],
            ["Bosh aylanasi", "head_circumference"],
            ["Peshona ko'ndalang", "forehead_transverse"],
            ["Bosh balandligi", "skull_height"],
            ["Asos uzunligi", "skull_base_length"],
            ["Asos kengligi", "skull_base_width"],
          ].map(([label, k]) => (
            <Grid xs={12} sm={6} md={4} key={k}>
              <F label={label} k={k} type="number" />
            </Grid>
          ))}
        </Grid>

        {/* Section IV: Face */}
        <SectionTitle icon={Person} title="IV. Yuz o'lchamlari" />
        <Grid container spacing={2} pt={1}>
          {[
            ["Yanoq diametri", "face_bizygomatic"],
            ["Pastki jag' diametri", "face_bigonial"],
            ["Morfologik balandlik", "face_morphological_height"],
            ["Fizionomik balandlik", "face_physiognomic_height"],
            ["Burun balandligi", "nose_height"],
            ["Burun kengligi", "nose_width"],
            ["Tashqi ko'z kengligi", "outer_canthal_width"],
            ["Ichki ko'z kengligi", "inner_canthal_width"],
            ["Lab qalinligi", "lips_mucosa_height"],
            ["Og'iz kengligi", "mouth_width"],
          ].map(([label, k]) => (
            <Grid xs={12} sm={6} md={4} key={k}>
              <F label={label} k={k} type="number" />
            </Grid>
          ))}
        </Grid>

        {/* Section V: Chest */}
        <SectionTitle icon={FitnessCenter} title="V. Ko'krak qafasi va gavda" />
        <Grid container spacing={2} pt={1}>
          {[
            ["Bo'y (tik)", "chest_standing_height"],
            ["Bo'y (o'tirgan)", "chest_sitting_height"],
            ["Vazn (kg)", "weight"],
            ["Tana uzunligi", "trunk_length"],
            ["Korpus uzunligi", "torso_length"],
            ["Ko'krak aylanasi (pauza)", "chest_circumference_pause"],
            ["Nafas olganda", "chest_circumference_inhale"],
            ["Nafas chiqarganda", "chest_circumference_exhale"],
            ["Bel aylanasi", "waist_circumference"],
            ["Qorin aylanasi", "abdomen_circumference"],
            ["Yuqori segment", "upper_segment_length"],
            ["Ko'ndalang diametr", "chest_transverse_diameter"],
            ["Old-orqa diametr", "chest_anteroposterior_diameter"],
            ["Ko'krak balandligi", "chest_height"],
          ].map(([label, k]) => (
            <Grid xs={12} sm={6} md={4} key={k}>
              <F label={label} k={k} type="number" />
            </Grid>
          ))}
        </Grid>

        {/* Section VI: Arms and Fat */}
        <SectionTitle icon={FitnessCenter} title="VI. Qo'l va Yog' qatlami" />
        <Grid container spacing={2} pt={1}>
          {[
            ["Qo'l uzunligi", "arm_length"],
            ["Yelka uzunligi", "shoulder_length"],
            ["Yelka kengligi", "shoulder_width"],
            ["Yelka aylanasi", "arm_circumference_total"],
            ["Yelka aylanasi (tinch)", "shoulder_circumference_rest"],
            ["Yelka aylanasi (tarang)", "shoulder_circumference_flexed"],
            ["Bilak uzunligi", "forearm_length"],
            ["Panja uzunligi", "hand_length"],
            ["Dinamometriya", "dynamometry"],
            ["Triseps yog'i", "fat_triceps"],
            ["Biseps yog'i", "fat_biceps"],
            ["Kurak osti yog'i", "fat_subscapular"],
            ["Yonbosh yog'i", "fat_iliac"],
            ["Tizza orqa yog'i", "fat_popliteal"],
          ].map(([label, k]) => (
            <Grid xs={12} sm={6} md={4} key={k}>
              <F label={label} k={k} type="number" />
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Bekor qilish</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={20} /> : "Saqlash"}
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
}) => (
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
            <TableCell sx={{ fontWeight: 700, color: "error.main" }}>{tr("deletedDate")}</TableCell>
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
                    {row.deleted_at ? new Date(row.deleted_at).toLocaleDateString("uz-UZ") : "—"}
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

/* ════════════════════════════════════════════════════
   FILTER BAR
════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════
   RESEARCH ANALYTICS (Professional Dashboard)
════════════════════════════════════════════════════ */
const ResearchAnalytics = ({ data, isDark }) => {
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
      const city = r.settlement || "Noma'lum";
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});
    const citiesData = Object.entries(citiesMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Gender Data
    const genderData = [
      { name: "O'g'il bolalar", value: boys, color: "#2563eb" },
      { name: "Qiz bolalar", value: girls, color: "#f50057" },
      { name: "Noma'lum", value: total - boys - girls, color: "#9e9e9e" },
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
        age: `${a.age} yosh`,
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
  }, [data, timeRange]);

  return (
    <Stack spacing={4}>
      {/* ── Analytics Header ── */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight={900}>
            Analitika Markazi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tadqiqot ma'lumotlarinning professional tahlili
          </Typography>
        </Box>
      </Box>

      {/* ── Key Metrics Cards ── */}
      <Grid container spacing={3}>
        {[
          { label: "Jami yozuvlar", value: stats.total, icon: <People />, color: "#0f766e" },
          { label: "O'g'il bolalar", value: stats.boys, icon: <TrendingUp />, color: "#0ea5e9" },
          { label: "Qiz bolalar", value: stats.girls, icon: <TrendingUp />, color: "#ec4899" },
          { label: "O'rtacha BMI", value: stats.avgBmi, icon: <Assessment />, color: "#10b981" },
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
              Jinsi bo'yicha taqsimot
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
              Top 5 hududlar
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
              Ma'lumotlar yig'ish dinamikasi
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
              Yosh bo'yicha antropometrik ko'rsatkichlar (O'rtacha)
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={stats.ageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="age" />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="#0f766e"
                  label={{ value: "Vazn (kg)", angle: -90, position: "insideLeft" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#f50057"
                  label={{ value: "Bo'y (sm)", angle: 90, position: "insideRight" }}
                />
                <RechartsTooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="vazn"
                  fill="#0f766e"
                  radius={[4, 4, 0, 0]}
                  opacity={0.6}
                  name="O'rtacha vazn (kg)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="bo'y"
                  stroke="#f50057"
                  strokeWidth={4}
                  dot={{ r: 6 }}
                  name="O'rtacha bo'y (sm)"
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
          Tadqiqot Hisoboti
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          Barcha to'plangan ma'lumotlarni tahliliy formatda yuklab oling
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
                toast.success("Yuklab olish yakunlandi");
              } catch (err) {
                toast.error("Xatolik: " + err.message);
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
            XLSX dataset
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={async () => {
              try {
                const blob = await ResearchApi.exportSummaryDocx({});
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `scientific_summary_${new Date().toISOString().slice(0, 10)}.docx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                toast.success("DOCX hisobot tayyor");
              } catch (err) {
                toast.error("Xatolik: " + err.message);
              }
            }}
            startIcon={<Description />}
            sx={{ borderRadius: 3, px: 5, py: 2, fontWeight: 800 }}
          >
            Ilmiy DOCX report
          </Button>
        </Stack>
      </GlassPaper>
    </Stack>
  );
};

/* ════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════ */
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
      const blob = await ResearchApi.exportSummaryDocx(filter);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scientific_summary_${new Date().toISOString().slice(0, 10)}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("DOCX hisobot tayyor");
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
      toast.error(`Shablonni yuklashda xatolik: ${err.message}`);
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
        label: "Ilmiy ish mavzusi",
        value: user?.research_topic,
        icon: <Science fontSize="small" />,
        color: "#0891b2",
      },
      {
        label: "Tadqiqot turi",
        value: user?.research_type,
        icon: <Assessment fontSize="small" />,
        color: "#2563eb",
      },
      {
        label: "Tadqiqot hududi",
        value: user?.research_area,
        icon: <Place fontSize="small" />,
        color: "#ca8a04",
      },
      {
        label: "Ilmiy rahbar",
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
                  {pt("researcherHeroTitle2", "tadqiqot oynasi")}
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
                          {item.value || "Kiritilmagan"}
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
                            Ilmiy ish mavzusi:{" "}
                            <Box component="span" sx={{ color: "text.primary", fontWeight: 900 }}>
                              {user?.research_topic || "Kiritilmagan"}
                            </Box>
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontWeight={800}>
                            Tadqiqot turi:{" "}
                            <Box component="span" sx={{ color: "text.primary", fontWeight: 900 }}>
                              {user?.research_type || "Kiritilmagan"}
                            </Box>
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontWeight={800}>
                            Tadqiqot hududi:{" "}
                            <Box component="span" sx={{ color: "text.primary", fontWeight: 900 }}>
                              {user?.research_area || "Kiritilmagan"}
                            </Box>
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontWeight={800}>
                            Ilmiy rahbar:{" "}
                            <Box component="span" sx={{ color: "text.primary", fontWeight: 900 }}>
                              {user?.scientific_supervisor || "Kiritilmagan"}
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
                        DOCX report
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Description />}
                        onClick={handleDownloadImportTemplate}
                        sx={{ borderRadius: 2 }}
                      >
                        Shablon
                      </Button>
                      <Button
                        variant="outlined"
                        color="success"
                        startIcon={importing ? <CircularProgress size={18} /> : <CloudUpload />}
                        onClick={() => importInputRef.current?.click()}
                        disabled={importing}
                        sx={{ borderRadius: 2 }}
                      >
                        Import XLSX
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
                  <ResearchAnalytics data={data} isDark={isDark} />
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
                  <DeleteForever fontSize="small" /> <strong>Hard delete</strong> (butunlay
                  o'chirish) qaytarib bo'lmaydigan amaldir.
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

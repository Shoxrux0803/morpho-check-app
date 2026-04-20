import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Container, Typography, Paper, Tabs, Tab, TextField, Button, Avatar, Stack,
  CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Divider,
  Chip, InputAdornment, Grid, Alert, Collapse, Stepper, Step, StepLabel, MenuItem, useTheme
} from "@mui/material";
import {
  Description, Download, Add, Dashboard, Logout, Edit, Delete, DeleteForever,
  Search, FilterList, Close, Visibility, InfoOutlined, Person, Place, School,
  Science, FitnessCenter, Refresh, ArrowForward, ArrowBack, Save, Analytics, CheckCircle,
  Assessment, TrendingUp, People, Public
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ResearchApi } from "../services/api";
import CloudUpload from "@mui/icons-material/CloudUpload";
import ResearcherForm from "../components/Research/ResearcherForm";
import { toast } from "react-hot-toast";
import AdvancedResearchFilter from "../components/Research/AdvancedResearchFilter";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, PieChart, Pie, Cell, BarChart, Bar, Legend,
  ComposedChart, Line
} from "recharts";
import LogoutConfirmDialog from "../components/LogoutConfirmDialog";

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

const InfoRow = ({ label, value, color }) =>
  value ? (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Typography variant="body2" fontWeight={600} color={color}>
        {value ?? "-"}
      </Typography>
    </Box>
  ) : null;

const SectionTitle = ({ icon: Icon, title }) => (
  <Box display="flex" alignItems="center" gap={1} mb={2} mt={3}>
    <Icon color="primary" sx={{ fontSize: 20 }} />
    <Typography variant="subtitle1" fontWeight={700} color="primary">{title}</Typography>
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
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Box
                sx={{
                  p: 1.5, borderRadius: 2,
                  background: "rgba(0,123,255,0.04)",
                  border: "1px solid rgba(0,123,255,0.08)"
                }}
              >
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" fontWeight={600}>{record[key]}</Typography>
              </Box>
            </Grid>
          ) : null
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
          background: (theme) => theme.palette.mode === 'dark' ? "rgba(23, 26, 33, 0.95)" : "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          border: (theme) => theme.palette.mode === 'dark' ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(100,116,139,0.15)",
          boxShadow: (theme) => theme.palette.mode === 'dark' ? "0 24px 48px rgba(0,0,0,0.5)" : "0 24px 48px rgba(100,116,139,0.15)",
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {record.full_name || "Noma'lum"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ID: {record.id} | Sana: {record.examination_date || "-"} |
              Yaratildi: {new Date(record.created_at).toLocaleDateString("uz-UZ")}
            </Typography>
          </Box>
          <IconButton onClick={onClose}><Close /></IconButton>
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
          <Button startIcon={<DeleteForever />} color="error" variant="outlined"
            onClick={() => onDelete(record.id, "hard")}>
            Hard Delete
          </Button>
        )}
        <Button startIcon={<Delete />} color="warning" variant="outlined"
          onClick={() => onDelete(record.id, "soft")}>
          O'chirish
        </Button>
        <Button onClick={onClose} variant="text">Yopish</Button>
      </DialogActions>
    </Dialog>
  );
};

/* ════════════════════════════════════════════════════
   EDIT MODAL — simplified (key fields only)
════════════════════════════════════════════════════ */
const EditModal = ({ record, open, onClose, onSaved }) => {
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
      toast.success("Ma'lumot yangilandi");
      onSaved();
      onClose();
    } catch (err) {
      toast.error("Xatolik: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const F = ({ label, k, type = "text", options }) => (
    <TextField
      select={type === "select"}
      label={label} size="small" fullWidth type={type === "select" ? undefined : type}
      value={form[k] ?? ""}
      onChange={set(k)}
      InputLabelProps={type === "date" || type === "select" ? { shrink: true } : undefined}
      sx={{ minWidth: type === "select" ? 200 : "auto" }}
    >
      {type === "select" && options?.map(opt => (
        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
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
          background: (theme) => theme.palette.mode === 'dark' ? "rgba(23, 26, 33, 0.95)" : "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          border: (theme) => theme.palette.mode === 'dark' ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(100,116,139,0.15)",
          boxShadow: (theme) => theme.palette.mode === 'dark' ? "0 24px 48px rgba(0,0,0,0.5)" : "0 24px 48px rgba(100,116,139,0.15)",
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>
        Yozuvni tahrirlash
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 12, top: 12 }}><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* Section I: Demographic */}
        <SectionTitle icon={Person} title="I. Pasport / Umumiy Ma'lumotlar" />
        <Grid container spacing={2} pt={1}>
          {[
            ["F.I.SH", "full_name", "text"], ["Maktab / Bog'cha", "school_name", "text"],
            ["Aholi punkti", "settlement", "text"], ["Tug'ilgan joyi", "birth_place", "text"],
          ["Tug'ilgan sana", "birth_date", "date"], ["Jinsi (Пол)", "gender", "select", (() => {
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
                  { value: "erkak", label: "Erkak (Мужчина)" },
                  { value: "ayol", label: "Ayol (Женщина)" }
                ]
              : [
                  { value: "Boy", label: "O'g'il bola (Мальчик)" },
                  { value: "Girl", label: "Qiz bola (Девочка)" }
                ];
          })()], ["Ota millati", "father_nationality", "text"],
            ["Ona millati", "mother_nationality", "text"], ["Yashashni boshlagan", "living_since", "text"],
            ["Muassasaga qabul", "enrolled_date", "text"], ["Maishiy sharoit", "living_conditions", "text"],
            ["Mehnat rejimi", "labor_regime", "text"], ["O'tkir kasalliklar", "past_illnesses", "text"],
            ["Farzandlar soni", "children_count", "number"], ["Nechanchi farzand", "child_order", "number"],
            ["Oziqlanish turi", "feeding_type", "select", [
              { value: "Tabiiy (естественном вскармливании)", label: "Tabiiy (естественном вскармливании)" },
              { value: "Sun'iy (искусственном вскармливании)", label: "Sun'iy (искусственном вскармливании)" }
            ]], 
            ["Ota-ona qarindoshligi", "parents_marriage", "select", [
              { value: "Yaqin qarindosh (близкородственный)", label: "Yaqin qarindosh (близкородственный)" },
              { value: "Uzoq qarindosh (дальнородственный)", label: "Uzoq qarindosh (дальнородственный)" },
              { value: "Qarindosh emas (неродственный)", label: "Qarindosh emas (неродственный)" }
            ]],
            ["Ona sog'ligi", "mother_health_status", "text"], ["Tekshiruv sanasi", "examination_date", "date"]
          ].map(([label, k, type, options]) => (
            <Grid item xs={12} sm={6} md={k === "feeding_type" || k === "parents_marriage" ? 6 : 4} key={k}>
              <F label={label} k={k} type={type} options={options} />
            </Grid>
          ))}
        </Grid>

        {/* Section II: Lower Leg */}
        <SectionTitle icon={Place} title="II. Jismoniy Rivojlanish (Oyoqlar)" />
        <Grid container spacing={2} pt={1}>
          {[
            ["Spina iliaca", "lower_leg_spina_iliaca"], ["Symphysion", "lower_leg_symphysion"],
            ["Tibiale balandligi", "tibiale_height"], ["Chanoq kengligi", "pelvic_width"],
            ["Son uzunligi", "thigh_length"], ["Son aylanasi", "thigh_circumference"],
            ["Boldir uzunligi", "calf_length"], ["Boldir aylanasi", "calf_circumference"],
            ["Oyoq panja uzunligi", "foot_length"], ["Tishlar soni", "teeth_count"],
            ["Menstruatsiya", "menstruation_start", "text"]
          ].map(([label, k, type]) => (
            <Grid item xs={12} sm={6} md={4} key={k}>
              <F label={label} k={k} type={type || "number"} />
            </Grid>
          ))}
        </Grid>

        {/* Section III: Skull */}
        <SectionTitle icon={Science} title="III. Bosh suyagi" />
        <Grid container spacing={2} pt={1}>
          {[
            ["Uzunasiga diametr", "skull_longitudinal"], ["Ko'ndalang diametr", "skull_transverse"],
            ["Bosh aylanasi", "head_circumference"], ["Peshona ko'ndalang", "forehead_transverse"],
            ["Bosh balandligi", "skull_height"], ["Asos uzunligi", "skull_base_length"],
            ["Asos kengligi", "skull_base_width"]
          ].map(([label, k]) => (
            <Grid item xs={12} sm={6} md={4} key={k}>
              <F label={label} k={k} type="number" />
            </Grid>
          ))}
        </Grid>

        {/* Section IV: Face */}
        <SectionTitle icon={Person} title="IV. Yuz o'lchamlari" />
        <Grid container spacing={2} pt={1}>
          {[
            ["Yanoq diametri", "face_bizygomatic"], ["Pastki jag' diametri", "face_bigonial"],
            ["Morfologik balandlik", "face_morphological_height"], ["Fizionomik balandlik", "face_physiognomic_height"],
            ["Burun balandligi", "nose_height"], ["Burun kengligi", "nose_width"],
            ["Tashqi ko'z kengligi", "outer_canthal_width"], ["Ichki ko'z kengligi", "inner_canthal_width"],
            ["Lab qalinligi", "lips_mucosa_height"], ["Og'iz kengligi", "mouth_width"]
          ].map(([label, k]) => (
            <Grid item xs={12} sm={6} md={4} key={k}>
              <F label={label} k={k} type="number" />
            </Grid>
          ))}
        </Grid>

        {/* Section V: Chest */}
        <SectionTitle icon={FitnessCenter} title="V. Ko'krak qafasi va gavda" />
        <Grid container spacing={2} pt={1}>
          {[
            ["Bo'y (tik)", "chest_standing_height"], ["Bo'y (o'tirgan)", "chest_sitting_height"],
            ["Vazn (kg)", "weight"], ["Tana uzunligi", "trunk_length"], ["Korpus uzunligi", "torso_length"],
            ["Ko'krak aylanasi (pauza)", "chest_circumference_pause"], ["Nafas olganda", "chest_circumference_inhale"],
            ["Nafas chiqarganda", "chest_circumference_exhale"], ["Bel aylanasi", "waist_circumference"],
            ["Qorin aylanasi", "abdomen_circumference"], ["Yuqori segment", "upper_segment_length"],
            ["Ko'ndalang diametr", "chest_transverse_diameter"], ["Old-orqa diametr", "chest_anteroposterior_diameter"],
            ["Ko'krak balandligi", "chest_height"]
          ].map(([label, k]) => (
            <Grid item xs={12} sm={6} md={4} key={k}>
              <F label={label} k={k} type="number" />
            </Grid>
          ))}
        </Grid>

        {/* Section VI: Arms and Fat */}
        <SectionTitle icon={FitnessCenter} title="VI. Qo'l va Yog' qatlami" />
        <Grid container spacing={2} pt={1}>
          {[
            ["Qo'l uzunligi", "arm_length"], ["Yelka uzunligi", "shoulder_length"],
            ["Yelka kengligi", "shoulder_width"], ["Yelka aylanasi (tinch)", "shoulder_circumference_rest"],
            ["Yelka aylanasi (tarang)", "shoulder_circumference_flexed"], ["Bilak uzunligi", "forearm_length"],
            ["Panja uzunligi", "hand_length"], ["Dinamometriya", "dynamometry"],
            ["Triseps yog'i", "fat_triceps"], ["Biseps yog'i", "fat_biceps"],
            ["Kurak osti yog'i", "fat_subscapular"], ["Yonbosh yog'i", "fat_iliac"],
            ["Tizza orqa yog'i", "fat_popliteal"]
          ].map(([label, k]) => (
            <Grid item xs={12} sm={6} md={4} key={k}>
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
const RecordsTable = ({ rows, loading, onView, onEdit, onDelete, isSuperAdmin, showDeleted = false }) => (
  <TableContainer component={GlassPaper}>
    <Table size="small">
      <TableHead sx={{ background: (theme) => theme.palette.mode === 'dark' ? "rgba(255,255,255,0.03)" : "rgba(0,123,255,0.05)" }}>
        <TableRow>
          <TableCell sx={{ fontWeight: 700, width: 50 }}>#</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>F.I.SH</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Maktab / Bog'cha</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Tekshiruv</TableCell>
          {!showDeleted && <TableCell sx={{ fontWeight: 700 }}>Bo'y / Vazn</TableCell>}
          {showDeleted && <TableCell sx={{ fontWeight: 700, color: "error.main" }}>O'chirilgan sana</TableCell>}
          <TableCell sx={{ fontWeight: 700 }} align="right">Amallar</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading ? (
          <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
        ) : rows.length === 0 ? (
          <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>Ma'lumot topilmadi</TableCell></TableRow>
        ) : (
          rows.map((row, idx) => (
            <TableRow
              key={row.id}
              hover
              sx={{ cursor: "pointer", "&:hover": { background: "rgba(0,123,255,0.04)" } }}
              onClick={() => onView(row)}
            >
              <TableCell>
                <Typography variant="caption" color="text.secondary">{idx + 1}</Typography>
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar sx={{ width: 30, height: 30, fontSize: 12, bgcolor: "primary.light" }}>
                    {(row.full_name || "?").charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="body2" fontWeight={600}>{row.full_name || "—"}</Typography>
                </Stack>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{row.school_name || "—"}</Typography>
                <Typography variant="caption" color="text.secondary">{row.settlement || ""}</Typography>
              </TableCell>
              <TableCell>
                <Chip label={row.examination_date || "—"} size="small" variant="outlined" sx={{ fontSize: 11 }} />
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
                  <Tooltip title="Batafsil">
                    <IconButton size="small" color="info" onClick={() => onView(row)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {!showDeleted && (
                    <>
                      <Tooltip title="Tahrirlash">
                        <IconButton size="small" color="primary" onClick={() => onEdit(row)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Soft o'chirish">
                        <IconButton size="small" color="warning" onClick={() => onDelete(row.id, "soft")}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {isSuperAdmin && (
                        <Tooltip title="Butunlay o'chirish">
                          <IconButton size="small" color="error" onClick={() => onDelete(row.id, "hard")}>
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
const FilterBar = ({ filter, setFilter, onSearch, onExport }) => {
  const [open, setOpen] = useState(false);
  return (
    <GlassPaper sx={{ p: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField
          size="small" placeholder="Ism, maktab, shahar bo'yicha qidirish..."
          value={filter.search}
          onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment>,
          }}
          sx={{ flex: 1, maxWidth: 400 }}
        />
        <Button startIcon={<FilterList />} variant="outlined" size="small"
          onClick={() => setOpen(!open)}>
          Filter
        </Button>
        <Button startIcon={<Search />} variant="contained" size="small" onClick={onSearch}>
          Qidirish
        </Button>
        <Box flex={1} />
        <Button startIcon={<Download />} color="success" variant="outlined" size="small"
          onClick={onExport}>
          XLSX
        </Button>
      </Stack>
      <Collapse in={open}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={2}>
          <TextField
            size="small" label="Dan (sana)" type="text"
            placeholder="2024-01-01"
            value={filter.date_from || ""}
            onChange={(e) => setFilter((f) => ({ ...f, date_from: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small" label="Gacha (sana)" type="text"
            placeholder="2024-12-31"
            value={filter.date_to || ""}
            onChange={(e) => setFilter((f) => ({ ...f, date_to: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="text" size="small" color="inherit"
            onClick={() => { setFilter({ search: "", date_from: "", date_to: "" }); onSearch(); }}>
            Tozalash
          </Button>
        </Stack>
      </Collapse>
    </GlassPaper>
  );
};

/* ════════════════════════════════════════════════════
   RESEARCH ANALYTICS (Professional Dashboard)
════════════════════════════════════════════════════ */
const ResearchAnalytics = ({ data, isDark }) => {
  const [timeRange, setTimeRange] = useState("all"); // "all" or "30d"

  // 1. Data Aggregation
  const stats = useMemo(() => {
    let filteredData = data;
    if (timeRange === "30d") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filteredData = data.filter(r => new Date(r.created_at) >= thirtyDaysAgo);
    }

    const total = filteredData.length;
    const boys = filteredData.filter(r => {
      const g = (r.gender || "").toLowerCase();
      return g === "boy" || g === "m" || g === "male" || g === "erkak" || g.includes("o'g'il") || g.includes("о'ғил");
    }).length;
    const girls = filteredData.filter(r => {
      const g = (r.gender || "").toLowerCase();
      return g === "girl" || g === "f" || g === "female" || g === "ayol" || g.includes("qiz") || g.includes("қиз");
    }).length;
    
    // Average BMI Calculation
    const bmis = filteredData.map(r => (r.weight && r.chest_standing_height) ? (r.weight / Math.pow(r.chest_standing_height/100, 2)) : null).filter(v => v);
    const avgBmi = bmis.length ? (bmis.reduce((a, b) => a + b, 0) / bmis.length).toFixed(1) : "0";

    // Settlement Distribution
    const citiesMap = filteredData.reduce((acc, r) => {
      const city = r.settlement || "Noma'lum";
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});
    const citiesData = Object.entries(citiesMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);

    // Gender Data
    const genderData = [
      { name: "O'g'il bolalar", value: boys, color: "#007bff" },
      { name: "Qiz bolalar", value: girls, color: "#f50057" },
      { name: "Noma'lum", value: total - boys - girls, color: "#9e9e9e" }
    ].filter(g => g.value > 0);

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

    const ageData = Object.values(ageMap).map(a => ({
      age: `${a.age} yosh`,
      vazn: a.weight.length ? (a.weight.reduce((v1, v2) => v1 + v2, 0) / a.weight.length).toFixed(1) : 0,
      "bo'y": a.height.length ? (a.height.reduce((h1, h2) => h1 + h2, 0) / a.height.length).toFixed(1) : 0,
    })).sort((a,b) => parseInt(a.age) - parseInt(b.age));

    // Progress Over Time
    const timelineMap = filteredData.reduce((acc, r) => {
      const date = new Date(r.created_at).toISOString().slice(0, 10);
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    const timelineData = Object.entries(timelineMap).map(([date, count]) => ({ date, count })).sort((a,b) => a.date.localeCompare(b.date));

    return { total, boys, girls, avgBmi, genderData, citiesData, ageData, timelineData };
  }, [data, timeRange]);

  return (
    <Stack spacing={4}>
      {/* ── Analytics Header ── */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight={900}>Analitika Markazi</Typography>
          <Typography variant="body2" color="text.secondary">Tadqiqot ma'lumotlarinning professional tahlili</Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', p: 0.5, borderRadius: 3 }}>
          <Button 
            size="small" 
            variant={timeRange === "all" ? "contained" : "text"} 
            onClick={() => setTimeRange("all")}
            sx={{ borderRadius: 2, textTransform: 'none', px: 3, fontWeight: 700 }}
          >
            Hammasi
          </Button>
          <Button 
            size="small" 
            variant={timeRange === "30d" ? "contained" : "text"} 
            onClick={() => setTimeRange("30d")}
            sx={{ borderRadius: 2, textTransform: 'none', px: 3, fontWeight: 700 }}
          >
            Oxirgi 30 kun
          </Button>
        </Stack>
      </Box>

      {/* ── Key Metrics Cards ── */}
      <Grid container spacing={3}>
        {[
          { label: "Jami yozuvlar", value: stats.total, icon: <People />, color: "#007bff" },
          { label: "O'g'il bolalar", value: stats.boys, icon: <TrendingUp />, color: "#0ea5e9" },
          { label: "Qiz bolalar", value: stats.girls, icon: <TrendingUp />, color: "#ec4899" },
          { label: "O'rtacha BMI", value: stats.avgBmi, icon: <Assessment />, color: "#10b981" },
        ].map((card, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <GlassPaper sx={{ p: 3, textAlign: 'center', border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: `${card.color}15`, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>{card.icon}</Box>
              <Typography variant="h4" fontWeight={900} sx={{ color: card.color }}>{card.value}</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>{card.label}</Typography>
            </GlassPaper>
          </Grid>
        ))}
      </Grid>

      {/* ── Charts Section ── */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <GlassPaper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={800} mb={3}>Jinsi bo'yicha taqsimot</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={stats.genderData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {stats.genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </GlassPaper>
        </Grid>

        <Grid item xs={12} md={8}>
          <GlassPaper sx={{ p: 3, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={800} mb={3}>Top 5 hududlar</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.citiesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fontWeight: 600, fill: isDark ? "#eee" : "#555" }} axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" fill="#007bff" radius={[0, 4, 4, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </GlassPaper>
        </Grid>

        <Grid item xs={12}>
          <GlassPaper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={800} mb={3}>Ma'lumotlar yig'ish dinamikasi</Typography>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={stats.timelineData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#007bff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#007bff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "text.secondary" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "text.secondary" }} axisLine={false} tickLine={false} />
                <RechartsTooltip />
                <Area type="monotone" dataKey="count" stroke="#007bff" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </GlassPaper>
        </Grid>

        <Grid item xs={12}>
          <GlassPaper sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={800} mb={3}>Yosh bo'yicha antropometrik ko'rsatkichlar (O'rtacha)</Typography>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={stats.ageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="age" />
                <YAxis yAxisId="left" orientation="left" stroke="#007bff" label={{ value: "Vazn (kg)", angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#f50057" label={{ value: "Bo'y (sm)", angle: 90, position: 'insideRight' }} />
                <RechartsTooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="vazn" fill="#007bff" radius={[4, 4, 0, 0]} opacity={0.6} name="O'rtacha vazn (kg)" />
                <Line yAxisId="right" type="monotone" dataKey="bo'y" stroke="#f50057" strokeWidth={4} dot={{ r: 6 }} name="O'rtacha bo'y (sm)" />
              </ComposedChart>
            </ResponsiveContainer>
          </GlassPaper>
        </Grid>
      </Grid>

      <GlassPaper sx={{ p: 4, textAlign: 'center', background: isDark ? 'linear-gradient(135deg, rgba(0,123,255,0.15) 0%, rgba(0,123,255,0) 100%)' : 'linear-gradient(135deg, rgba(0,123,255,0.05) 0%, rgba(255,255,255,0.5) 100%)' }}>
        <Typography variant="h5" fontWeight={900} mb={1}>Tadqiqot Hisoboti</Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>Barcha to'plangan ma'lumotlarni tahliliy formatda (.xlsx) yuklab oling</Typography>
        <Button
          variant="contained" size="large"
          onClick={async () => {
            try {
              const blob = await ResearchApi.exportDataset({});
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `full_analysis_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
              document.body.appendChild(a); a.click(); a.remove();
              toast.success("Yuklab olish yakunlandi");
            } catch (err) {
              toast.error("Xatolik: " + err.message);
            }
          }}
          startIcon={<Download />}
          sx={{ borderRadius: 3, px: 8, py: 2, fontWeight: 800, background: 'linear-gradient(135deg, #007bff 0%, #00d4ff 100%)' }}
        >
          To'liq bazani eksport qilish
        </Button>
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
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";

  const [activeTab, setActiveTab] = useState(0); // 0 = Yangi qo'shish
  const [data, setData] = useState([]);
  const [deletedData, setDeletedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletedLoading, setDeletedLoading] = useState(false);
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
    date_to: ""
  });

  // Modals
  const [detailRecord, setDetailRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const fetchData = useCallback(async (filterParams = filter) => {
    setLoading(true);
    try {
      const result = await ResearchApi.list(filterParams);
      setData(result);
    } catch (err) {
      console.error(err);
      toast.error("Ma'lumotlar yuklanmadi");
    } finally {
      setLoading(false);
    }
  }, [filter]);

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
    if (activeTab === 1 || activeTab === 2) fetchData();
    if (activeTab === 3 && isSuperAdmin) fetchDeleted();
  }, [activeTab, fetchData, fetchDeleted, isSuperAdmin]);

  const handleSearch = () => fetchData(filter);

  const handleExport = async () => {
    try {
      const blob = await ResearchApi.exportXlsx(filter);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `research_data_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Eksport xatosi: " + err.message);
    }
  };

  const handleDelete = async (id, type) => {
    const msg = type === "hard"
      ? "DIQQAT! Bu yozuv bazadan butunlay o'chiriladi. Davom etamizmi?"
      : type === "restore"
        ? "Bu yozuvni tiklashni istaysizmi?"
        : "Bu yozuvni o'chirmoqchimisiz? (tiklash mumkin)";

    if (!window.confirm(msg)) return;
    try {
      if (type === "hard") {
        await ResearchApi.hardDelete(id);
        toast.success("Butunlay o'chirildi");
      } else if (type === "restore") {
        await ResearchApi.restore(id);
        toast.success("Tiklandi");
        fetchDeleted();
      } else {
        await ResearchApi.softDelete(id);
        toast.success("O'chirildi");
      }
      if (type !== "restore") {
        setData((d) => d.filter((r) => r.id !== id));
        if (detailRecord?.id === id) setDetailRecord(null);
      }
      fetchData(); // Refresh list after any deletion/restoration
    } catch (err) {
      toast.error("Xatolik: " + err.message);
    }
  };

  const TABS = [
    { label: "Yangi qo'shish", icon: <Add />, color: "#007bff" },
    { label: "Ma'lumotlar ro'yxati", icon: <Dashboard />, color: "#00c853" },
    { label: "Analitika", icon: <Assessment />, color: "#673ab7" },
    ...(isSuperAdmin ? [{ label: "O'chirilganlar", icon: <Delete />, color: "#f44336" }] : []),
  ];

  const Stats = () => (
    <Grid container spacing={2} mb={3}>
      {[
        { label: "Jami yozuvlar", value: data.length, color: "#007bff", icon: <Analytics /> },
        { label: "Oxirgi 30 kun", value: data.filter((r) => {
            const d = new Date(r.created_at);
            return (Date.now() - d.getTime()) < 30 * 86400000;
          }).length, color: "#00c853", icon: <Refresh /> },
        ...(isSuperAdmin ? [{ label: "O'chirilganlar", value: deletedData.length, color: "#f44336", icon: <DeleteForever /> }] : []),
      ].map(({ label, value, color, icon }) => (
        <Grid item xs={12} sm={isSuperAdmin ? 4 : 6} key={label}>
          <GlassPaper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}>
            <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: isDark ? `${color}15` : `${color}08`, color }}>{icon}</Box>
            <Box>
              <Typography variant="h5" fontWeight={900} sx={{ color }}>{value}</Typography>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </Box>
          </GlassPaper>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 10 }}>
      <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, md: 4 } }}>
      {/* ── Page Header ── */}
      <GlassPaper sx={{ p: { xs: 2, md: 3 }, mb: 4, position: "sticky", top: 12, zIndex: 10, overflow: 'visible' }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  width: 50, height: 50,
                  background: "linear-gradient(135deg, #007bff 0%, #00d4ff 100%)",
                  fontSize: 20, fontWeight: 900,
                  boxShadow: "0 4px 12px rgba(0,123,255,0.3)",
                }}
              >
                {user?.name?.charAt(0).toUpperCase() || "I"}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={800} noWrap sx={{ lineHeight: 1.2 }}>
                  {user?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {isSuperAdmin ? "Super Admin" : "Tadqiqotchi"}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={8}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
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
                  fontSize: "0.95rem",
                  minHeight: 48,
                  minWidth: 120,
                  transition: "all 0.2s ease",
                  "&.Mui-selected": {
                    color: "primary.main",
                  },
                  "&:hover": {
                    color: "primary.light",
                    bgcolor: "rgba(0,123,255,0.04)",
                  }
                }
              }}
            >
              {TABS.map((tab, i) => (
                <Tab
                  key={i}
                  icon={tab.icon}
                  iconPosition="start"
                  label={tab.label}
                  sx={{ gap: 1 }}
                />
              ))}
            </Tabs>
          </Grid>
        </Grid>
      </GlassPaper>

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
            {activeTab === 0 && (
              <Box>
                <ResearcherForm onSuccess={() => { setActiveTab(1); fetchData(); }} />
              </Box>
            )}

            {activeTab === 1 && (
              <Stack spacing={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h4" fontWeight={900}>Ma'lumotlar bazasi</Typography>
                    <Typography variant="body2" color="text.secondary">Jami yig'ilgan tadqiqot natijalari</Typography>
                  </Box>
                  <Chip
                    icon={<Visibility sx={{ color: "inherit !important" }} />}
                    label={`${data.length} ta yozuv`}
                    color="primary"
                    sx={{ fontWeight: 800, py: 2, px: 2, borderRadius: 2, height: 40 }}
                  />
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
                  onView={setDetailRecord}
                  onEdit={setEditRecord}
                  onDelete={handleDelete}
                  isSuperAdmin={isSuperAdmin}
                />
              </Stack>
            )}

            {activeTab === 2 && (
              <ResearchAnalytics data={data} isDark={isDark} />
            )}

            {activeTab === 3 && isSuperAdmin && (
              <Stack spacing={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h4" fontWeight={900}>Arxiv</Typography>
                    <Typography variant="body2" color="text.secondary">O'chirilgan ma'lumotlarni tiklash yoki tozalash</Typography>
                  </Box>
                  <Button startIcon={<Refresh />} onClick={fetchDeleted} variant="contained" color="warning" sx={{ borderRadius: 2 }}>
                    Yangilash
                  </Button>
                </Box>
                <Alert
                  severity="info"
                  variant="outlined"
                  sx={{ borderRadius: 3, border: "1px dashed", bgcolor: "rgba(2, 136, 209, 0.05)" }}
                >
                  Savatchadagi yozuvlar 30 kundan keyin avtomatik o'chirilishi mumkin.
                </Alert>
                <RecordsTable
                  rows={deletedData}
                  loading={deletedLoading}
                  onView={setDetailRecord}
                  onEdit={() => { }}
                  onDelete={handleDelete}
                  isSuperAdmin={isSuperAdmin}
                  showDeleted
                />
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
        onEdit={(r) => { setDetailRecord(null); setEditRecord(r); }}
        onDelete={(id, type) => { handleDelete(id, type); setDetailRecord(null); }}
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
    </Container>
  </Box>
  );
};

export default ResearcherPage;


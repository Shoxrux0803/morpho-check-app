import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Container, Typography, Paper, Tabs, Tab, TextField, Button, Avatar, Stack,
  CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Divider,
  Chip, InputAdornment, Grid, Alert, Collapse, Stepper, Step, StepLabel, MenuItem
} from "@mui/material";
import {
  Description, Download, Add, Dashboard, Logout, Edit, Delete, DeleteForever,
  Search, FilterList, Close, Visibility, InfoOutlined, Person, Place, School,
  Science, FitnessCenter, Refresh, ArrowForward, ArrowBack, Save, Analytics
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ResearchApi } from "../services/api";
import { toast } from "react-hot-toast";
import AdvancedResearchFilter from "../components/Research/AdvancedResearchFilter";

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
        theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
      overflow: "hidden",
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
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
            ["Tug'ilgan sana", "birth_date", "date"], ["Ota millati", "father_nationality", "text"],
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
      <TableHead sx={{ background: "rgba(0,123,255,0.06)" }}>
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
                  {showDeleted && isSuperAdmin && (
                    <>
                      <Tooltip title="Tiklash">
                        <IconButton size="small" color="success" onClick={() => onDelete(row.id, "restore")}>
                          <Refresh fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Butunlay o'chirish">
                        <IconButton size="small" color="error" onClick={() => onDelete(row.id, "hard")}>
                          <DeleteForever fontSize="small" />
                        </IconButton>
                      </Tooltip>
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
   ADD FORM  (mavjuddan qisqartirilgan, modal sifatida)
════════════════════════════════════════════════════ */
const ResearcherForm = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  const emptyForm = {
    full_name: "", school_name: "", settlement: "", birth_place: "", birth_date: "",
    father_nationality: "", mother_nationality: "", living_since: "", enrolled_date: "",
    living_conditions: "", labor_regime: "", past_illnesses: "", children_count: "",
    child_order: "", feeding_type: "", parents_marriage: "", mother_health_status: "",
    examination_date: "",
    lower_leg_spina_iliaca: "", lower_leg_symphysion: "", tibiale_height: "",
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
    arm_length: "", shoulder_length: "", shoulder_width: "", shoulder_circumference_rest: "",
    shoulder_circumference_flexed: "", forearm_length: "", hand_length: "", dynamometry: "",
    fat_triceps: "", fat_biceps: "", fat_subscapular: "", fat_iliac: "", fat_popliteal: ""
  };
  const [formData, setFormData] = useState(emptyForm);

  const steps = ["Shaxsiy ma'lumotlar", "Barcha o'lchovlar"];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const cleanData = {};
      Object.keys(formData).forEach((k) => {
        if (formData[k] !== "") cleanData[k] = formData[k];
      });
      await ResearchApi.create(cleanData);
      toast.success("Ma'lumot muvaffaqiyatli saqlandi");
      setFormData(emptyForm);
      onSuccess();
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
              </Grid>
            </Box>
          ) : (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  {SL("II. Jismoniy Rivojlanish (Oyoqlar)")}
                  <Grid container spacing={2}>
                    {[
                      ["lower_leg_spina_iliaca","Spina iliaca"],["lower_leg_symphysion","Symphysion"],
                      ["tibiale_height","Tibiale balandligi"],["pelvic_width","Chanoq kengligi"],
                      ["thigh_length","Son uzunligi"],["thigh_circumference","Son aylanasi"],
                      ["calf_length","Boldir uzunligi"],["calf_circumference","Boldir aylanasi"],
                      ["foot_length","Oyoq panja uzunligi"],["teeth_count","Tishlar soni"],
                      ["menstruation_start","Menstruatsiya", "text"],
                    ].map(([name, label, t]) => (
                      <Grid item xs={12} sm={6} md={4} key={name}>{I(name, label, t || "number")}</Grid>
                    ))}
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
                      ["shoulder_width","Yelka kengligi"],["shoulder_circumference_rest","Yelka aylanasi (tinch)"],
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
            Ma'lumotni Saqlash
          </Button>
        )}
      </Box>
    </GlassPaper>
  );
};

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
   MAIN PAGE
════════════════════════════════════════════════════ */
const ResearcherPage = () => {
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
    if (activeTab === 1) fetchData();
    if (activeTab === 2 && isSuperAdmin) fetchDeleted();
  }, [activeTab, fetchData, fetchDeleted, isSuperAdmin]);

  const handleSearch = () => fetchData(filter);

  const handleExport = async () => {
    try {
      const blob = await ResearchApi.exportXlsx();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "research_data.xlsx";
      document.body.appendChild(a); a.click(); a.remove();
    } catch (err) {
      toast.error("Ma'lumot mavjud emas: " + err.message);
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
          <GlassPaper sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `${color}15`, color }}>{icon}</Box>
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
    <Container maxWidth={false} sx={{ py: 3, px: { xs: 2, md: 4 } }}>
      {/* ── Page Header ── */}
      <GlassPaper sx={{ p: { xs: 2, md: 3 }, mb: 4, position: "sticky", top: 12, zIndex: 10 }}>
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

          <Grid item xs={12} md={5}>
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

          <Grid item xs={12} md={3}>
            <Stack direction="row" spacing={2} justifyContent="flex-end" alignItems="center">
              <Tooltip title="Chiqish">
                <Button
                  variant="soft"
                  color="error"
                  onClick={logout}
                  startIcon={<Logout />}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                    bgcolor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(244, 67, 54, 0.1)"
                        : "rgba(244, 67, 54, 0.05)",
                    "&:hover": { bgcolor: "error.main", color: "#fff" }
                  }}
                >
                  Chiqish
                </Button>
              </Tooltip>
            </Stack>
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

            {activeTab === 2 && isSuperAdmin && (
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
    </Container>
  );
};

export default ResearcherPage;


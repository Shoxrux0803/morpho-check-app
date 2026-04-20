import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, CircularProgress, IconButton, Tooltip, Stack, Button,
  TextField, InputAdornment, Collapse, Grid, Divider, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, Alert, Avatar, Tabs, Tab, MenuItem
} from "@mui/material";
import {
  Download, Description, Edit, Delete, DeleteForever, Search,
  FilterList, Refresh, Visibility, Close, Person, Place, Science,
  FitnessCenter, RestoreFromTrash
} from "@mui/icons-material";
import { ResearchApi } from "../../services/api";
import { toast } from "react-hot-toast";
import AdvancedResearchFilter from "../Research/AdvancedResearchFilter";

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

const SectionTitle = ({ icon: Icon, title }) => (
  <Box display="flex" alignItems="center" gap={1} mb={2} mt={3}>
    <Icon color="primary" sx={{ fontSize: 20 }} />
    <Typography variant="subtitle1" fontWeight={700} color="primary">{title}</Typography>
    <Divider sx={{ flex: 1 }} />
  </Box>
);

/* ════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════ */
const ResearcherDataView = ({ isSuperAdmin = true }) => {
  const [data, setData] = useState([]);
  const [deletedData, setDeletedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletedLoading, setDeletedLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState(0); // 0: Active, 1: Deleted
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
  const [filterOpen, setFilterOpen] = useState(false);
  
  const [detailRecord, setDetailRecord] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeTab === 0) fetchData();
    else if (activeTab === 1) fetchDeletedData();
  }, [activeTab]);

  const fetchData = async (params = filter) => {
    setLoading(true);
    try {
      const result = await ResearchApi.list(params);
      setData(result);
    } catch (err) {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedData = async () => {
    setDeletedLoading(true);
    try {
      const result = await ResearchApi.deletedList();
      setDeletedData(result);
    } catch (err) {
      toast.error("O'chirilgan yozuvlarni yuklashda xatolik");
    } finally {
      setDeletedLoading(false);
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
        if (activeTab === 0) setData(d => d.filter(r => r.id !== id));
        else setDeletedData(d => d.filter(r => r.id !== id));
      } else if (type === "restore") {
        await ResearchApi.restore(id);
        toast.success("Tiklandi");
        fetchDeletedData();
      } else {
        await ResearchApi.softDelete(id);
        toast.success("O'chirildi");
        setData(d => d.filter(r => r.id !== id));
      }
      if (detailRecord?.id === id) setDetailRecord(null);
    } catch (err) {
      toast.error("Xatolik: " + err.message);
    }
  };

  const handleEditSave = async () => {
    setSaving(true);
    try {
      const { id, created_at, created_by_id, is_deleted, deleted_at, ...payload } = editForm;
      await ResearchApi.update(id, payload);
      toast.success("Ma'lumot yangilandi");
      setEditRecord(null);
      fetchData();
    } catch (err) {
      toast.error("Xatolik: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExportXlsx = async () => {
    try {
      const blob = await ResearchApi.exportXlsx();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "research_data.xlsx";
      document.body.appendChild(a); a.click(); a.remove();
    } catch (err) {
      toast.error("Xatolik: " + err.message);
    }
  };

  const handleDownloadDocx = (id, lang = "ru") => {
    ResearchApi.downloadDocx(id, lang);
  };

  /* ── Table Components ── */
  const renderTable = (rows, isLoading, isDeletedView = false) => (
    <TableContainer component={GlassPaper}>
      <Table size="small">
        <TableHead sx={{ background: isDeletedView ? "rgba(244,67,54,0.06)" : "rgba(0,123,255,0.06)" }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, width: 50 }}>#</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>F.I.SH</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Maktab / Bog'cha</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Tekshiruv</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Bo'y / Vazn</TableCell>
            {isDeletedView && <TableCell sx={{ fontWeight: 700, color: "error.main" }}>O'chirilgan</TableCell>}
            <TableCell sx={{ fontWeight: 700 }} align="right">Amallar</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={isDeletedView ? 7 : 6} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
          ) : rows.length === 0 ? (
            <TableRow><TableCell colSpan={isDeletedView ? 7 : 6} align="center" sx={{ py: 6, color: "text.secondary" }}>Ma'lumot topilmadi</TableCell></TableRow>
          ) : (
            rows.map((row, idx) => (
              <TableRow
                key={row.id}
                hover
                sx={{ cursor: "pointer", "&:hover": { background: "rgba(0,123,255,0.04)" } }}
                onClick={() => setDetailRecord(row)}
              >
                <TableCell><Typography variant="caption" color="text.secondary">{idx + 1}</Typography></TableCell>
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
                <TableCell><Chip label={row.examination_date || "—"} size="small" variant="outlined" sx={{ fontSize: 11 }} /></TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {row.chest_standing_height ? `${row.chest_standing_height} sm` : "—"} /
                    {row.weight ? ` ${row.weight} kg` : " —"}
                  </Typography>
                </TableCell>
                {isDeletedView && (
                  <TableCell>
                    <Typography variant="caption" color="error">
                      {row.deleted_at ? new Date(row.deleted_at).toLocaleDateString("uz-UZ") : "—"}
                    </Typography>
                  </TableCell>
                )}
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title="Batafsil"><IconButton size="small" color="info" onClick={() => setDetailRecord(row)}><Visibility fontSize="small" /></IconButton></Tooltip>
                    {!isDeletedView ? (
                      <>
                        <Tooltip title="Tahrirlash"><IconButton size="small" color="primary" onClick={() => { setEditRecord(row); setEditForm({ ...row }); }}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Soft o'chirish"><IconButton size="small" color="warning" onClick={() => handleDelete(row.id, "soft")}><Delete fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Butunlay o'chirish"><IconButton size="small" color="error" onClick={() => handleDelete(row.id, "hard")}><DeleteForever fontSize="small" /></IconButton></Tooltip>
                      </>
                    ) : (
                      <>
                        <Tooltip title="Tiklash"><IconButton size="small" color="success" onClick={() => handleDelete(row.id, "restore")}><Refresh fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Butunlay o'chirish"><IconButton size="small" color="error" onClick={() => handleDelete(row.id, "hard")}><DeleteForever fontSize="small" /></IconButton></Tooltip>
                      </>
                    )}
                    <Tooltip title="DOCX (RU)"><IconButton size="small" onClick={() => handleDownloadDocx(row.id, "ru")}><Description fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="DOCX (UZ)"><IconButton size="small" color="primary" onClick={() => handleDownloadDocx(row.id, "uz")}><Description fontSize="small" /></IconButton></Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={900}>Izlanuvchi Ma'lumotlari</Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" color="success" startIcon={<Download />} onClick={handleExportXlsx}>XLSX</Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => activeTab === 0 ? fetchData() : fetchDeletedData()}>Yangilash</Button>
        </Stack>
      </Box>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2, borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
        <Tab label="Aktiv yozuvlar" sx={{ textTransform: "none", fontWeight: 600 }} />
        {isSuperAdmin && <Tab label="O'chirilganlar" icon={<RestoreFromTrash />} iconPosition="start" sx={{ textTransform: "none", fontWeight: 600 }} />}
      </Tabs>

      {activeTab === 0 && (
        <Stack spacing={3}>
          <AdvancedResearchFilter
            filter={filter}
            setFilter={setFilter}
            onSearch={fetchData}
          />

          {renderTable(data, loading)}
        </Stack>
      )}

      {activeTab === 1 && renderTable(deletedData, deletedLoading, true)}

      {/* ── Detail Modal ── */}
      <DetailModal
        record={detailRecord}
        open={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        onEdit={(r) => { setDetailRecord(null); setEditRecord(r); setEditForm({ ...r }); }}
        onDelete={(id, type) => { handleDelete(id, type); setDetailRecord(null); }}
        isSuperAdmin={isSuperAdmin}
        handleDownloadDocx={handleDownloadDocx}
      />

      {/* ── Edit Modal ── */}
      <Dialog open={!!editRecord} onClose={() => setEditRecord(null)} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle sx={{ fontWeight: 800 }}>
          Tahrirlash 
          <IconButton onClick={() => setEditRecord(null)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <Close />
          </IconButton>
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
            ].map(([label, key, type, options]) => (
              <Grid item xs={12} sm={6} md={key === "feeding_type" || key === "parents_marriage" ? 6 : 4} key={key}>
                <TextField 
                  select={type === "select"}
                  label={label} fullWidth size="small" type={type === "select" ? undefined : type} 
                  value={editForm[key] || ""} 
                  onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                  InputLabelProps={type === "date" || type === "select" ? { shrink: true } : undefined}
                  sx={{ minWidth: type === "select" ? 200 : "auto" }}
                >
                  {type === "select" && options?.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </TextField>
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
            ].map(([label, key, type]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <TextField 
                  label={label} fullWidth size="small" type={type || "number"} 
                  value={editForm[key] || ""} 
                  onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                />
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
            ].map(([label, key]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <TextField 
                  label={label} fullWidth size="small" type="number" 
                  value={editForm[key] || ""} 
                  onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                />
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
            ].map(([label, key]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <TextField 
                  label={label} fullWidth size="small" type="number" 
                  value={editForm[key] || ""} 
                  onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                />
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
            ].map(([label, key]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <TextField 
                  label={label} fullWidth size="small" type="number" 
                  value={editForm[key] || ""} 
                  onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                />
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
            ].map(([label, key]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <TextField 
                  label={label} fullWidth size="small" type="number" 
                  value={editForm[key] || ""} 
                  onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditRecord(null)}>Bekor qilish</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : "Saqlash"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const DetailModal = ({ record, open, onClose, onEdit, onDelete, isSuperAdmin, handleDownloadDocx }) => {
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
              ID: {record.id} | Sana: {record.examination_date || "-"}
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

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            startIcon={<Description />}
            onClick={() => handleDownloadDocx(record.id, "uz")}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            DOCX (UZ)
          </Button>
          <Button
            size="small"
            startIcon={<Description />}
            onClick={() => handleDownloadDocx(record.id, "ru")}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            DOCX (RU)
          </Button>
        </Stack>
        <Box flex={1} />
        <Button startIcon={<Edit />} variant="contained" onClick={() => onEdit(record)}>Tahrirlash</Button>
        <Button startIcon={<Delete />} color="warning" variant="outlined" onClick={() => onDelete(record.id, "soft")}>O'chirish</Button>
        {isSuperAdmin && <Button startIcon={<DeleteForever />} color="error" variant="outlined" onClick={() => onDelete(record.id, "hard")}>Butunlay</Button>}
        <Button onClick={onClose}>Yopish</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResearcherDataView;

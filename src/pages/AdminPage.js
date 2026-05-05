import React, { useMemo, useState, useEffect, useCallback } from "react";
import { AdminApi } from "../services/AdminApi";
import { generateDocx, generatePdf, generatePdfById, generateDocxById } from "../services/api";
import { LANGUAGES } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Material UI importlari
import {
  Container, Grid, Typography, Paper, AppBar, Toolbar, Tabs, Tab, Box, 
  IconButton, Button, FormControl, InputLabel, Select, MenuItem, Dialog, 
  DialogTitle, DialogContent, DialogActions, LinearProgress, Alert, useTheme, 
  useMediaQuery, CircularProgress, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TablePagination, TextField, InputAdornment, Stack, Avatar,
  Tooltip
} from "@mui/material";
import {
  Delete, Download, FilterList, Close, Dashboard as DashboardIcon, 
  List as ListIcon, Lock, Person, Visibility, VisibilityOff, Assessment,
  BiotechOutlined, Logout, Refresh
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

// Modular Components
import AdminDashboard from "../components/Dashboard/AdminDashboard";
import AdminScientificAnalysis from "../components/Dashboard/AdminScientificAnalysis";
import AdminFilters from "../components/Admin/AdminFilters";
import AdminTable from "../components/Admin/AdminTable";
import InputForm from "../components/InputForm";
import ResearcherDataView from "../components/Admin/ResearcherDataView";
import DashboardFilters from "../components/Dashboard/DashboardFilters";


/** ===== Helpers ===== */
const calcBMI = (wKg, hCm) => {
  const h = Number(hCm) / 100;
  if (!h || !wKg) return null;
  return Math.round((Number(wKg) / (h * h)) * 10) / 10;
};

const bmiStatus = (bmi, age) => {
  if (!bmi) return "-";
  if (age >= 20) {
    if (bmi < 18.5) return "Ozg'in";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Ortiqcha";
    return "Semizlik";
  }
  return bmi < 18.5 ? "Ozg'in" : bmi < 25 ? "Normal" : "Ortiqcha";
};

const normalize = (r) => {
  const bmiVal = r.bmi ?? calcBMI(r.weight, r.height);
  return {
    ...r,
    idCode: r.id_code || r.idCode,
    createdAt: r.created_at || r.createdAt,
    firstName: r.first_name || r.firstName,
    lastName: r.last_name || r.lastName,
    bmi: bmiVal,
    bmiStatus: r.bmi_status || bmiStatus(bmiVal, r.age),
  };
};

const GlassPaper = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      background: (theme) =>
        theme.palette.mode === "dark"
          ? "rgba(30, 30, 40, 0.7)"
          : "rgba(255, 255, 255, 0.7)",
      backdropFilter: "blur(20px)",
      borderRadius: 4,
      border: "1px solid",
      borderColor: (theme) =>
        theme.palette.mode === "dark"
          ? "rgba(255, 255, 255, 0.12)"
          : "rgba(100, 116, 139, 0.12)",
      overflow: "auto",
      boxShadow: (theme) => 
        theme.palette.mode === "dark"
          ? "0 8px 32px rgba(0,0,0,0.4)"
          : "0 8px 32px rgba(100,116,139,0.1)",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const horizontalScrollSx = {
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
};

function CustomModal({ children, onClose, title, onDownloadDocx, isDownloading, onDownloadPdf, isPdfDownloading, pdfLang, setPdfLang }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog open={true} onClose={onClose} fullScreen={fullScreen} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight="bold">{title}</Typography>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
          <Button variant="contained" color="secondary" startIcon={isDownloading ? <CircularProgress size={20} color="inherit" /> : <Download />} onClick={onDownloadDocx} disabled={isDownloading || isPdfDownloading} sx={{ borderRadius: 2 }}>Word</Button>
          <FormControl size="small" sx={{ minWidth: 90 }}><InputLabel>Til</InputLabel><Select value={pdfLang} label="Til" onChange={(e) => setPdfLang(e.target.value)}>{LANGUAGES.map((l) => (<MenuItem key={l.code} value={l.code}>{l.flag} {l.label}</MenuItem>))}</Select></FormControl>
          <Button variant="contained" color="primary" startIcon={isPdfDownloading ? <CircularProgress size={20} color="inherit" /> : <Download />} onClick={onDownloadPdf} disabled={isDownloading || isPdfDownloading} sx={{ borderRadius: 2 }}>PDF hisobot</Button>
        </Box>
        <Button variant="outlined" onClick={onClose} sx={{ borderRadius: 2 }}>Yopish</Button>
      </DialogActions>
    </Dialog>
  );
}

// ===== ASOSIY ADMIN PAGE =====
export default function AdminPage() {
  const navigate = useNavigate();
  const { user, login: authLogin, loading: authLoading } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [activeTab, setActiveTab] = useState(0);
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // States for downloads
  const [viewRow, setViewRow] = useState(null);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfLang, setPdfLang] = useState("uz");

  // Filters
  // Unified Filters for both Table and Dashboard
  const [dashFilters, setDashFilters] = useState({
    q: "",
    gender: "",
    age_min: 0,
    age_max: 100,
    bmi_min: 10,
    bmi_max: 50,
    region: "",
    somatotype: "",
    date_from: "",
    date_to: "",
  });
  const [sort, setSort] = useState({ key: "createdAt", dir: "desc" });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [checked, setChecked] = useState(new Set());

  // Login state
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginInProgress, setLoginInProgress] = useState(false);

  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [importingXlsx, setImportingXlsx] = useState(false);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);

  // Edit state
  const [editRow, setEditRow] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Deletion state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false);

  // Load Data - Paginated
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const resp = await AdminApi.analyses.list({
        q: dashFilters.q,
        gender: dashFilters.gender,
        ageMin: dashFilters.age_min,
        ageMax: dashFilters.age_max,
        dateFrom: dashFilters.date_from,
        dateTo: dashFilters.date_to,
        region: dashFilters.region,
        somatotype: dashFilters.somatotype,
        sortKey: sort.key === "createdAt" ? "created_at" : sort.key,
        sortDir: sort.dir,
        page: page + 1,
        pageSize: rowsPerPage,
      });
      setRaw((resp.items || []).map(normalize));
      setTotalCount(resp.total || 0);
    } catch (e) {
      console.error("Load failed:", e);
    } finally {
      setLoading(false);
    }
  }, [user, dashFilters, sort, page, rowsPerPage]);

  const fetchDashboardStats = useCallback(async (filters = dashFilters) => {
    if (!user) return;
    setStatsLoading(true);
    try {
      const data = await AdminApi.stats(filters);
      setStats(data);
    } catch (e) {
      console.error("Failed to fetch admin stats:", e);
    } finally {
      setStatsLoading(false);
    }
  }, [user, dashFilters]);


  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (activeTab === 0) {
      fetchDashboardStats();
    }
  }, [activeTab, fetchDashboardStats]);


  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginInProgress(true);
    try {
      const profile = await authLogin(loginForm);
      if (profile.role !== "admin" && profile.role !== "superadmin") {
        navigate("/");
      }
    } catch (err) {
      setLoginError(err.message || "Kirishda xatolik yuz berdi");
    } finally {
      setLoginInProgress(false);
    }
  }, [authLogin, loginForm, navigate]);

  const handleUpdateAnalysis = useCallback(async (e) => {
    e?.preventDefault();
    if (!editRow) return;
    setUpdating(true);
    try {
      await AdminApi.analyses.update(editRow.id, editRow);
      toast.success("Ma'lumot yangilandi");
      setEditRow(null);
      load();
    } catch (err) {
      toast.error("Xatolik: " + err.message);
    } finally {
      setUpdating(false);
    }
  }, [editRow, load]);

  const handleEditInputChange = useCallback((e) => {
    const { name, value } = e.target;
    const numericFields = [
      "age", "age_months", "age_days", "height", "weight", "chest", "waist", "head",
      "father_height", "mother_height",
      "shoulder_length", "shoulder_breadth", "shoulder_circumference",
      "arm_elbow_length", "hand_length", "thigh_length", "thigh_circumference",
      "calf_length", "calf_circumference", "foot_length", "body_length",
      "total_body_water", "fat_percent", "fat_mass", "muscle_mass", "bone_mass", "acm", "visceral_fat"
    ];
    
    let v = value;
    if (numericFields.includes(name) || numericFields.map(f => {
      const camel = f.split('_').map((x, i) => i === 0 ? x : x.charAt(0).toUpperCase() + x.slice(1)).join('');
      return camel;
    }).includes(name)) {
      v = value === "" ? "" : Number(value);
    }
    
    setEditRow(prev => ({ ...prev, [name]: v }));
  }, []);

  const handleBulkUpdateEdit = useCallback((data) => {
    setEditRow(prev => ({ ...prev, ...data }));
  }, []);

  const toggleAll = useCallback(() => {
    const next = new Set(checked);
    const allChecked = raw.length > 0 && raw.every((r) => checked.has(r.id));
    if (allChecked) raw.forEach((r) => next.delete(r.id));
    else raw.forEach((r) => next.add(r.id));
    setChecked(next);
  }, [checked, raw]);

  const toggleOne = useCallback((id) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChecked(next);
  }, [checked]);

  const handleDeleteConfirm = useCallback(async (mode) => {
    setDeleteConfirmLoading(true);
    try {
      if (mode === "hard") {
        await AdminApi.analyses.hardDelete(Array.from(checked));
        toast.success("Ma'lumotlar butunlay o'chirildi");
      } else {
        await AdminApi.analyses.removeMany(Array.from(checked));
        toast.success("Ma'lumotlar savatga yuborildi. Superadmin ularni tiklashi mumkin.");
      }
      setChecked(new Set());
      setDeleteConfirmOpen(false);
      load();
    } catch (e) {
      toast.error("O'chirishda xatolik: " + e.message);
    } finally {
      setDeleteConfirmLoading(false);
    }
  }, [checked, load]);

  const onDeleteSelected = useCallback(async () => {
    if (!checked.size) return;
    setDeleteConfirmOpen(true);
  }, [checked.size]);

  // Keyboard shortcut for deletion
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Delete" || e.code === "Delete" || e.key === "Backspace") {
        // Don't trigger if user is typing in a text input or textarea
        const el = document.activeElement;
        const tag = el.tagName.toUpperCase();
        const isTextInput = (tag === "INPUT" && !["checkbox", "radio", "range", "button", "submit"].includes(el.type)) || tag === "TEXTAREA" || el.isContentEditable;
        
        if (isTextInput) return;

        if (checked.size > 0 && activeTab === 1) {
          onDeleteSelected();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [checked.size, activeTab, onDeleteSelected]);

  const handleDownloadPdf = useCallback(async () => {
    if (!viewRow) return;
    setDownloadingPdf(true);
    try {
      const blob = await generatePdfById(viewRow.id, pdfLang);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${viewRow.idCode}_${pdfLang}.pdf`;
      a.click();
    } catch (e) { alert("PDF Error: " + e.message); }
    finally { setDownloadingPdf(false); }
  }, [viewRow, pdfLang]);

  const handleDownloadDocx = useCallback(async () => {
    if (!viewRow) return;
    setDownloadingDocx(true);
    try {
      const blob = await generateDocxById(viewRow.id, pdfLang);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anketa_${viewRow.idCode}_${pdfLang}.docx`;
      a.click();
    } catch (e) { alert("Word Error: " + e.message); }
    finally { setDownloadingDocx(false); }
  }, [handleDownloadPdf, viewRow, pdfLang]);

  const handleExportXlsx = useCallback(async () => {
    setExportingXlsx(true);
    try {
      const blob = await AdminApi.analyses.exportXlsx({
        ...dashFilters
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analyses_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      toast.success("Excel muvaffaqiyatli yuklandi");
    } catch (e) {
      toast.error("Excel yuklashda xatolik: " + e.message);
    } finally {
      setExportingXlsx(false);
    }
  }, [dashFilters]);


  const handleDownloadTemplate = useCallback(async () => {
    try {
      const blob = await AdminApi.analyses.exportTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `morphocheck_template.xlsx`;
      a.click();
      toast.success("Shablon yuklandi");
    } catch (e) {
      toast.error("Shablonni yuklashda xatolik: " + e.message);
    }
  }, []);

  const handleImportXlsx = useCallback(async () => {
    if (!importFile) return;
    setImportingXlsx(true);
    setImportResult(null);
    try {
      const res = await AdminApi.analyses.importXlsx(importFile);
      setImportResult(res);
      toast.success(`Tayyor! ${res.imported} ta yangi, ${res.updated} ta yangilangan`);
      if (!res.errors || res.errors.length === 0) setImportConfirmOpen(false);
      load();
    } catch (e) {
      toast.error("Importda xatolik: " + e.message);
    } finally {
      setImportingXlsx(false);
    }
  }, [importFile, load]);

  const availableTabs = useMemo(() => {
    const allTabs = [
      { 
        id: 0, 
        label: "Dashboard", 
        icon: <DashboardIcon />, 
        roles: ["admin", "superadmin"], 
        content: <AdminDashboard data={raw} loading={loading} stats={stats} statsLoading={statsLoading} totalCount={totalCount} userName={user?.name} filters={dashFilters} /> 
      },
      { 
        id: 1, 
        label: "Ma'lumotlar", 
        icon: <ListIcon />, 
        roles: ["admin", "superadmin"],
        content: (
          <Box sx={{ py: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} flexDirection={{ xs: "column", md: "row" }} gap={2} mb={3}>
               <Typography variant="h5" fontWeight="bold">Ma'lumotlar Listi</Typography>
               <Box display="flex" gap={1.5} flexWrap="wrap">
                 <Button 
                    variant="outlined" 
                    color="secondary" 
                    onClick={handleDownloadTemplate}
                    startIcon={<Download />}
                  >
                    Shablon
                  </Button>
                 <Button 
                    variant="outlined" 
                    color="success" 
                    onClick={() => setImportConfirmOpen(true)}
                    startIcon={importingXlsx ? <CircularProgress size={20} /> : <Visibility />}
                  >
                    Import
                  </Button>
                 <Button 
                    variant="outlined" 
                    color="primary" 
                    startIcon={exportingXlsx ? <CircularProgress size={20} /> : <Download />} 
                    onClick={handleExportXlsx}
                    disabled={exportingXlsx}
                  >
                    Eksport
                  </Button>
                 <Button variant="outlined" color="error" startIcon={<Delete />} onClick={onDeleteSelected} disabled={!checked.size}>O'chirish ({checked.size})</Button>
               </Box>
            </Box>
            
            <Paper sx={{ mt: 3, borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              {loading && <LinearProgress />}
              <AdminTable rows={raw} checked={checked} toggleAll={toggleAll} toggleOne={toggleOne} allChecked={raw.length > 0 && raw.every(r => checked.has(r.id))} setViewRow={setViewRow} onEdit={(r) => setEditRow(r)} formatDate={(d) => new Date(d).toLocaleDateString("uz-UZ")} user={user} />
              <TablePagination component="div" count={totalCount} rowsPerPage={rowsPerPage} page={page} onPageChange={(e, p) => setPage(p)} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} />
            </Paper>
          </Box>
        )
      },

      { 
        id: 2, 
        label: "Ilmiy Tahlil", 
        icon: <BiotechOutlined />, 
        roles: ["admin", "superadmin"],
        content: <AdminScientificAnalysis data={raw} loading={loading} totalCount={totalCount} filters={dashFilters} />
      },

      { 
        id: 3, 
        label: "Izlanuvchi ma'lumotlari", 
        icon: <Assessment />, 
        roles: ["superadmin"],
        content: <ResearcherDataView isSuperAdmin={user?.role === 'superadmin'} />
      },
    ];
    return allTabs.filter(tab => tab.roles.includes(user?.role));
  }, [user, raw, loading, stats, statsLoading, totalCount, handleDownloadTemplate, setImportConfirmOpen, importingXlsx, exportingXlsx, handleExportXlsx, onDeleteSelected, checked, dashFilters, setDashFilters, toggleAll, toggleOne, setViewRow, rowsPerPage, page, setPage, setRowsPerPage]);


  if (authLoading) return <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>;

  // LOGIN SCREEN
  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassPaper sx={{ p: 4, position: "relative", overflow: "visible" }}>
            <Box
              sx={{
                position: "absolute",
                top: -40,
                left: "50%",
                transform: "translateX(-50%)",
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #007bff 0%, #00d4ff 100%)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: "0 8px 32px rgba(0, 123, 255, 0.3)",
              }}
            >
              <Lock sx={{ color: "white", fontSize: 40 }} />
            </Box>

            <Box textAlign="center" mt={4} mb={4}>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                Admin Panel
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tizimga kirish uchun login va parolingizni kiriting
              </Typography>
            </Box>

            {loginError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {loginError}
              </Alert>
            )}

            <Box component="form" onSubmit={handleLogin}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Email yoki Login"
                  variant="outlined"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Parol"
                  type={showPassword ? "text" : "password"}
                  variant="outlined"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  fullWidth
                  size="large"
                  type="submit"
                  variant="contained"
                  disabled={loginInProgress}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    boxShadow: "0 8px 16px rgba(0, 123, 255, 0.25)",
                    fontSize: "1rem",
                    fontWeight: 700,
                    textTransform: "none",
                  }}
                >
                  {loginInProgress ? <CircularProgress size={24} color="inherit" /> : "Kirish"}
                </Button>
              </Stack>
            </Box>
          </GlassPaper>
        </motion.div>
      </Container>
    );
  }

  // Check role for authenticated users
  if (user.role !== "admin" && user.role !== "superadmin") {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Typography variant="h5" textAlign="center">Ruxsat berilmagan</Typography>
        <Button fullWidth variant="contained" onClick={() => navigate("/")} sx={{ mt: 2 }}>Bosh sahifa</Button>
      </Container>
    );
  }



  const renderContent = () => {
    const currentTab = availableTabs.find(t => t.id === activeTab) || availableTabs[0];
    return currentTab?.content || null;
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 10 }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: isDark ? "rgba(23, 26, 33, 0.85)" : "rgba(255, 255, 255, 0.9)", backdropFilter: 'blur(20px)', color: "text.primary", borderBottom: "1px solid", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
        <Container maxWidth="xl">
            <Toolbar disableGutters sx={{ gap: { xs: 1, md: 2 }, minWidth: 0, flexWrap: { xs: "wrap", md: "nowrap" } }}>
                <Typography variant="h6" fontWeight="900" sx={{ flexGrow: 1, color: 'primary.main', minWidth: { xs: "100%", md: 180 } }}>MORPHO CHECK <Box component="span" sx={{ color: 'text.primary', fontWeight: 400 }}>PRO</Box></Typography>
                <Box sx={{ flex: "1 1 auto", minWidth: 0, maxWidth: "100%", overflowX: "auto" }}>
                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
                    {availableTabs.map((tab) => (
                      <Tab key={tab.id} icon={tab.icon} iconPosition="start" label={tab.label} value={tab.id} sx={{ fontWeight: 700, textTransform: 'none' }} />
                    ))}
                </Tabs>
                </Box>
                <Box sx={{ ml: 2 }}>
                   <Tooltip title="Chiqish"><IconButton onClick={() => setLogoutDialogOpen(true)} color="error" size="small"><Logout /></IconButton></Tooltip>
                </Box>
            </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, px: { xs: 1.5, sm: 3 }, maxWidth: "100%" }}>
        {/* PERSISTENT FILTERS FOR RELEVANT TABS */}
        {(activeTab === 0 || activeTab === 1 || activeTab === 2) && (
          <Box mb={4}>
            <DashboardFilters 
              filters={dashFilters} 
              onFilterChange={setDashFilters} 
              onReset={() => setDashFilters({
                q: "", gender: "", region: "", age_min: 0, age_max: 100, 
                bmi_min: 10, bmi_max: 50, somatotype: "", date_from: "", date_to: ""
              })}
            />
          </Box>
        )}
        <Box sx={horizontalScrollSx}>
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            <Box sx={{ minWidth: { xs: activeTab === 0 || activeTab === 2 ? 720 : 0, md: 0 } }}>
            {renderContent()}
            </Box>
          </motion.div>
        </AnimatePresence>
        </Box>
      </Container>

      {viewRow && (
        <CustomModal title="Batafsil ma'lumot" onClose={() => setViewRow(null)} onDownloadDocx={handleDownloadDocx} isDownloading={downloadingDocx} onDownloadPdf={handleDownloadPdf} isPdfDownloading={downloadingPdf} pdfLang={pdfLang} setPdfLang={setPdfLang}>
          <Table size="small">
             <TableBody>
                 <TableRow><TableCell>ID</TableCell><TableCell><strong>{viewRow.idCode}</strong></TableCell></TableRow>
                 <TableRow><TableCell>Ism Familiya</TableCell><TableCell>{viewRow.lastName} {viewRow.firstName}</TableCell></TableRow>
                 <TableRow><TableCell>Sana</TableCell><TableCell>{new Date(viewRow.createdAt).toLocaleString("uz-UZ")}</TableCell></TableRow>
                 <TableRow><TableCell>Hudud</TableCell><TableCell>{viewRow.region}</TableCell></TableRow>
                 <TableRow><TableCell>BMI</TableCell><TableCell><strong>{viewRow.bmi}</strong> ({viewRow.bmiStatus})</TableCell></TableRow>
             </TableBody>
          </Table>
        </CustomModal>
      )}

      {editRow && (
        <Dialog 
          open={true} 
          onClose={() => setEditRow(null)} 
          maxWidth="lg"
          fullWidth
          PaperProps={{ 
            sx: { 
              borderRadius: 4, 
              bgcolor: 'background.paper',
              boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            } 
          }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 4, pt: 3, pb: 2 }}>
            <Typography variant="h5" fontWeight={800}>Ma'lumotni tahrirlash</Typography>
            <IconButton onClick={() => setEditRow(null)}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2, md: 4 }, py: 0 }}>
             <InputForm 
                formData={editRow} 
                handleInputChange={handleEditInputChange} 
                onBulkUpdate={handleBulkUpdateEdit}
                handleSubmit={handleUpdateAnalysis} 
                loading={updating} 
                isAdminView={true}
                submitLabel="Saqlash"
              />
          </DialogContent>
          <DialogActions sx={{ p: 4, pt: 2 }}>
             <Button onClick={() => setEditRow(null)} color="inherit" sx={{ mr: 2 }}>Bekor qilish</Button>
             <Button variant="contained" size="large" onClick={handleUpdateAnalysis} disabled={updating} sx={{ borderRadius: 3, px: 4 }}>
                {updating ? <CircularProgress size={24} color="inherit" /> : "Saqlash"}
             </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog for Super Admin */}
      <Dialog 
        open={deleteConfirmOpen} 
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>O'chirishni tasdiqlang</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Siz <strong>{checked.size}</strong> ta yozuvni tanladingiz. {user.role === "superadmin" ? "Ushbu ma'lumotlarni qanday o'chirishni xohlaysiz?" : "Haqiqatan ham ushbu ma'lumotlarni o'chirib tashlamoqchimisiz?"}
          </Typography>
          {user.role === "superadmin" && (
            <Box sx={{ bgcolor: 'error.lighter', p: 2, borderRadius: 2, border: '1px solid', borderColor: 'error.light' }}>
              <Typography variant="caption" color="error.dark" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lock fontSize="small" /> <strong>Hard delete</strong> (butunlay o'chirish) qaytarib bo'lmaydigan amaldir. <strong>Soft delete</strong> (savatga yuborish) esa ma'lumotni tiklash imkonini beradi.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">Bekor qilish</Button>
          <Button 
            variant={user.role === "superadmin" ? "outlined" : "contained"} 
            color="error" 
            onClick={() => handleDeleteConfirm("soft")} 
            disabled={deleteConfirmLoading}
          >
            {user.role === "superadmin" ? "Savatga yuborish" : "O'chirish"}
          </Button>
          {user.role === "superadmin" && (
            <Button 
              variant="contained" 
              color="error" 
              onClick={() => handleDeleteConfirm("hard")} 
              disabled={deleteConfirmLoading}
            >
              Butunlay o'chirish
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Import XLSX Dialog */}
      <Dialog 
        open={importConfirmOpen} 
        onClose={() => !importingXlsx && setImportConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Excel-dan Ma'lumotlarni Import Qilish</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Ma'lumotlarni ommaviy qo'shish uchun shablonni to'ldiring va shu erga yuklang. Ism, Familiya, Bo'y va Vazn ustunlari to'ldirilishi majburiy.
          </Typography>
          
          <Box 
            sx={{ 
              mt: 2, 
              p: 4, 
              border: '2px dashed', 
              borderColor: importFile ? 'primary.main' : 'divider',
              borderRadius: 3,
              textAlign: 'center',
              bgcolor: 'background.default',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' }
            }}
            onClick={() => document.getElementById('xlsx-input').click()}
          >
            <input 
              type="file" 
              id="xlsx-input" 
              hidden 
              accept=".xlsx" 
              onChange={(e) => setImportFile(e.target.files[0])} 
            />
            <Typography variant="h6" color={importFile ? 'primary.main' : 'text.disabled'}>
              {importFile ? importFile.name : "XLSX faylni tanlang"}
            </Typography>
          </Box>

          {importResult && importResult.errors && importResult.errors.length > 0 && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'error.lighter', borderRadius: 2, maxHeight: 200, overflow: 'auto' }}>
              <Typography variant="caption" color="error.main" fontWeight="bold">Xatoliklar topildi ({importResult.errors.length} ta):</Typography>
              {importResult.errors.map((err, idx) => (
                <Typography key={idx} variant="caption" display="block" sx={{ color: 'error.dark', mt: 0.5 }}>- {err}</Typography>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setImportConfirmOpen(false)} disabled={importingXlsx} color="inherit">Bekor qilish</Button>
          <Button 
            variant="contained" 
            onClick={handleImportXlsx} 
            disabled={!importFile || importingXlsx}
            startIcon={importingXlsx ? <CircularProgress size={20} color="inherit" /> : null}
          >
            Yuklash va Import
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

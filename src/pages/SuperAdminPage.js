import React, { useState, useEffect, useCallback } from "react";
import { 
  Box, Container, Typography, Paper, Tabs, Tab, TextField, Button, Avatar, Stack, 
  IconButton, Tooltip, InputAdornment, Alert, CircularProgress, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, 
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Divider,
  Chip, Collapse, Grid, useTheme, Checkbox
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import {
  Lock, Person, Logout, Dashboard, People, Add, Edit, Delete, Visibility,
  VisibilityOff, Security, History, Storage, RestoreFromTrash, Assignment, AutoGraph,
  SettingsSuggest, Refresh, CloudUpload, Download, FilterList, Search, DeleteForever,
  Science, FitnessCenter, Place, Close, InfoOutlined,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { AdminApi, ResearchApi } from "../services/api";
import { toast } from "react-hot-toast";
import { UZB_LOCATIONS } from "../data/uzbLocations";
import LogoutConfirmDialog from "../components/LogoutConfirmDialog";

// Components
import SuperAdminDashboard from "../components/Dashboard/SuperAdminDashboard";
import SuperAdminRegionalMap from "../components/Dashboard/SuperAdminRegionalMap";
import ScientificAnalysis from "../components/Dashboard/ScientificAnalysis";
import ClinicalCMS from "../components/Admin/ClinicalCMS";
import AdminActivity from "../components/Admin/AdminActivity";
import DashboardFilters from "../components/Dashboard/DashboardFilters";


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
      overflow: "auto",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const scrollableContentSx = {
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  overflowX: "auto",
  overflowY: "visible",
  WebkitOverflowScrolling: "touch",
  pb: 1,
};

const SuperAdminPage = () => {
  const navigate = useNavigate();
  const { user, login: authLogin, logout, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Admin Management State
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "admin",
    phone: "",
    region: "",
  });
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Deleted Data State
  const [deletedData, setDeletedData] = useState([]);
  const [deletedAdmins, setDeletedAdmins] = useState([]);
  const [deletedLoading, setDeletedLoading] = useState(false);
  
  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  
  // Dashboard Stats State
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [dashFilters, setDashFilters] = useState({
    gender: "",
    region: "",
    age_min: 0,
    age_max: 100,
    bmi_min: 10,
    bmi_max: 50,
    somatotype: "",
    date_from: "",
    date_to: ""
  });
  const [viewRow, setViewRow] = useState(null);

  // Backup State
  const [backups, setBackups] = useState([]);
  const [backupLoading, setBackupLoading] = useState(false);

  const [checked, setChecked] = useState(new Set());
  const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false);
  const getDeletedRowKey = (row) => row.__rowKey || `${row.__deletedSource || "analysis"}:${row.id}`;
  const getDeletedRowCode = (row) => row.id_code || (row.id ? `#${row.id}` : "-");
  const getDeletedRowPatientName = (row) =>
    row.full_name || row.name || [row.last_name, row.first_name].filter(Boolean).join(" ") || "-";
  const getDeletedByName = (row) =>
    row.deleted_by_name || row.deleted_by?.name || row.deleted_by_email || "Noma'lum";
  const getDeletedDate = (row) => {
    if (!row.deleted_at) return "-";
    const date = new Date(row.deleted_at);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
  };
  const getGenderLabel = (gender) => {
    if (!gender) return "-";
    const normalized = String(gender).toLowerCase();
    if (["male", "erkak", "boy"].includes(normalized)) return "Erkak";
    if (["female", "ayol", "girl"].includes(normalized)) return "Ayol";
    return gender;
  };
  const getDeletedRowBmiText = (row) => {
    const bmi =
      row.bmi ??
      (row.weight && row.chest_standing_height
        ? (row.weight / Math.pow(row.chest_standing_height / 100, 2)).toFixed(1)
        : null);
    if (!bmi) return "-";
    return row.bmi_status ? `${bmi} (${row.bmi_status})` : String(bmi);
  };

  const toggleAll = useCallback((rows) => {
    const next = new Set(checked);
    const allChecked = rows.length > 0 && rows.every((r) => checked.has(getDeletedRowKey(r)));
    if (allChecked) rows.forEach((r) => next.delete(getDeletedRowKey(r)));
    else rows.forEach((r) => next.add(getDeletedRowKey(r)));
    setChecked(next);
  }, [checked]);

  const toggleOne = useCallback((id) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChecked(next);
  }, [checked]);


  const handleBulkRestore = async () => {
    if (checked.size === 0) return;
    try {
      const selectedRows = deletedData.filter((row) => checked.has(getDeletedRowKey(row)));
      const analysisIds = selectedRows
        .filter((row) => row.__deletedSource !== "research")
        .map((row) => row.id);
      const researchIds = selectedRows
        .filter((row) => row.__deletedSource === "research")
        .map((row) => row.id);

      if (analysisIds.length) await AdminApi.analyses.restore(analysisIds);
      for (const id of researchIds) await ResearchApi.restore(id);

      toast.success("Ma'lumotlar tiklandi");
      setChecked(new Set());
      fetchDeletedAnalyses();
    } catch (err) {
      toast.error("Xatolik: " + err.message);
    }
  };

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleBulkHardDelete = async () => {
    if (checked.size === 0) return;
    setDeleteConfirmOpen(true);
  };

  // Keyboard shortcut for deletion
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Delete" || e.code === "Delete" || e.key === "Backspace") {
        const el = document.activeElement;
        const tag = el.tagName.toUpperCase();
        const isTextInput = (tag === "INPUT" && !["checkbox", "radio", "range", "button", "submit"].includes(el.type)) || tag === "TEXTAREA" || el.isContentEditable;
        
        if (isTextInput) return;

        if (checked.size > 0 && activeTab === 4) {
           handleBulkHardDelete();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [checked.size, activeTab, handleBulkHardDelete]);


  useEffect(() => {
    if (user?.role === "superadmin") {
      if (activeTab === 0 || activeTab === 1 || activeTab === 2) {
        fetchDashboardStats(dashFilters);
        fetchAdmins();
      }
      if (activeTab === 3) fetchAdmins();
      if (activeTab === 4) {
        fetchDeletedAnalyses();
        fetchDeletedAdmins();
      }
      if (activeTab === 6) fetchAuditLogs();
      if (activeTab === 7) fetchBackups();
    }
  }, [user, activeTab, dashFilters]);




  const fetchDashboardStats = async (filters = dashFilters) => {
    setStatsLoading(true);
    try {
      const data = await AdminApi.stats(filters);
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };


  const fetchAdmins = async () => {
    setAdminsLoading(true);
    try {
      const data = await AdminApi.users.list();
      setAdmins(data);
    } catch (err) {
      console.error("Failed to fetch admins:", err);
    } finally {
      setAdminsLoading(false);
    }
  };

  const fetchDeletedAnalyses = async () => {
    setDeletedLoading(true);
    try {
      const [analysisResult, researchResult] = await Promise.allSettled([
        AdminApi.analyses.deletedList({ show_deleted: true, page_size: 100 }),
        ResearchApi.deletedList(),
      ]);

      if (analysisResult.status === "rejected") {
        console.error("Failed to fetch deleted analyses:", analysisResult.reason);
      }
      if (researchResult.status === "rejected") {
        console.error("Failed to fetch deleted research records:", researchResult.reason);
      }

      const analysisRows =
        analysisResult.status === "fulfilled"
          ? (analysisResult.value.items || [])
              .filter((i) => i.is_deleted)
              .map((i) => ({
                ...i,
                deleted_by_name: getDeletedByName(i),
                __deletedSource: "analysis",
                __rowKey: `analysis:${i.id}`,
              }))
          : [];
      const researchRows =
        researchResult.status === "fulfilled"
          ? (researchResult.value || [])
              .filter((i) => i.is_deleted)
              .map((i) => ({
                ...i,
                deleted_by_name: getDeletedByName(i),
                __deletedSource: "research",
                __rowKey: `research:${i.id}`,
              }))
          : [];

      setDeletedData(
        [...analysisRows, ...researchRows].sort(
          (a, b) => new Date(b.deleted_at || 0) - new Date(a.deleted_at || 0),
        ),
      );
    } catch (err) {
      console.error("Failed to fetch deleted analyses:", err);
    } finally {
      setDeletedLoading(false);
    }
  };
  const fetchDeletedAdmins = async () => {
    setDeletedLoading(true);
    try {
      const data = await AdminApi.users.deletedList();
      setDeletedAdmins((data || []).filter(u => u.is_deleted));
    } catch (err) {
      console.error("Failed to fetch deleted admins:", err);
    } finally {
      setDeletedLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const data = await AdminApi.auditLogs.list({ page_size: 100 });
      setAuditLogs(data.items || []);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setAuditLoading(false);
    }
  };

  const fetchBackups = async () => {
    setBackupLoading(true);
    try {
      const data = await AdminApi.backup.list();
      setBackups(data.items || []);
    } catch (err) {
      console.error("Failed to fetch backups:", err);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginInProgress(true);
    try {
      const profile = await authLogin(loginForm);
      if (profile.role !== "superadmin" && profile.role !== "admin") {
        navigate("/");
      }
    } catch (err) {
      setLoginError(err.message || "Kirishda xatolik yuz berdi");
    } finally {
      setLoginInProgress(false);
    }
  };

  const handleAdminAction = async () => {
    // Validation
    if (adminForm.password) {
      if (adminForm.password !== adminForm.confirmPassword) {
        toast.error("Parollar mos kelmadi!");
        return;
      }
      if (adminForm.password.length < 6) {
        toast.error("Parol kamida 6 ta belgidan iborat bo'lishi kerak!");
        return;
      }
    } else if (!currentAdmin) {
      // New admin must have a password
      toast.error("Parol kiritish majburiy!");
      return;
    }

    try {
      const { confirmPassword, ...payload } = adminForm;
      
      if (currentAdmin) {
        // UserUpdate doesn't have password_confirm
        if (!payload.password) delete payload.password;
        
        await AdminApi.users.update(currentAdmin.id, payload);
        toast.success('Admin muvaffaqiyatli yangilandi');
      } else {
        // UserCreate needs password_confirm
        payload.password_confirm = confirmPassword;
        await AdminApi.users.create(payload);
        toast.success("Yangi admin muvaffaqiyatli qo'shildi");
      }
      setAdminDialogOpen(false);
      fetchAdmins();
    } catch (err) {
      toast.error("Xatolik: " + err.message);
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (window.confirm("Haqiqatan ham bu adminni o'chirmoqchimisiz?")) {
      try {
        await AdminApi.users.delete(id);
        fetchAdmins();
        toast.success("Admin o'chirildi");
      } catch (err) {
        toast.error("Xatolik: " + err.message);
      }
    }
  };

  const handleRestoreAnalysis = async (rowOrId) => {
    const row =
      typeof rowOrId === "object"
        ? rowOrId
        : deletedData.find((item) => item.id === rowOrId || getDeletedRowKey(item) === rowOrId);
    if (!row) return;

    try {
      if (row.__deletedSource === "research") {
        await ResearchApi.restore(row.id);
      } else {
        await AdminApi.analyses.restore([row.id]);
      }
      toast.success("Ma'lumot tiklandi");
      fetchDeletedAnalyses();
    } catch (err) {
      toast.error("Xatolik: " + err.message);
    }
  };

  const handleRestoreAdmin = async (id) => {
    try {
      await AdminApi.users.restore(id);
      toast.success("Admin muvaffaqiyatli tiklandi");
      fetchDeletedAdmins();
      fetchAdmins();
    } catch (err) {
      toast.error("Xatolik: " + err.message);
    }
  };

  const handleHardDeleteAnalysis = async (rowOrId) => {
    const row =
      typeof rowOrId === "object"
        ? rowOrId
        : deletedData.find((item) => item.id === rowOrId || getDeletedRowKey(item) === rowOrId);
    if (!row) return;

    if (window.confirm("DIQQAT! Ushbu ma'lumot bazadan butunlay o'chiriladi. Tiklab bo'lmaydi! Davom etamizmi?")) {
      try {
        if (row.__deletedSource === "research") {
          await ResearchApi.hardDelete(row.id);
        } else {
          await AdminApi.analyses.hardDelete([row.id]);
        }
        toast.success("Ma'lumot butunlay o'chirildi");
        fetchDeletedAnalyses();
      } catch (err) {
        toast.error("Xatolik: " + err.message);
      }
    }
  };

  const handleCreateBackup = async () => {
    setBackupLoading(true);
    try {
      await AdminApi.backup.create();
      toast.success("Zaxira nusxasi yaratildi");
      fetchBackups();
    } catch (err) {
      toast.error("Xatolik: " + err.message);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreBackup = async (filename) => {
    if (window.confirm(`DIQQAT! "${filename}" nusxasidan ma'lumotlarni tiklamoqchimisiz? Mavjud ma'lumotlar o'zgarishi mumkin.`)) {
      setBackupLoading(true);
      try {
        await AdminApi.backup.restore(filename);
        toast.success("Ma'lumotlar muvaffaqiyatli tiklandi");
      } catch (err) {
        toast.error("Xatolik: " + err.message);
      } finally {
        setBackupLoading(false);
      }
    }
  };

  const handleDeleteBackup = async (filename) => {
    if (window.confirm(`Zaxira faylini (${filename}) o'chirmoqchimisiz?`)) {
      try {
        await AdminApi.backup.delete(filename);
        toast.success("Fayl o'chirildi");
        fetchBackups();
      } catch (err) {
        toast.error("Xatolik: " + err.message);
      }
    }
  };

  const handleClearAudit = async () => {
    if (window.confirm("Barcha jurnallarni tozalamoqchimisiz?")) {
      try {
        await AdminApi.auditLogs.clear();
        toast.success("Jurnal tozalandi");
        fetchAuditLogs();
      } catch (err) {
        toast.error("Xatolik: " + err.message);
      }
    }
  };

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  // LOGIN SCREEN
  if (!user || user.role !== "superadmin") {
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
                Super Admin
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tizimni boshqarish uchun hisobingizga kiring
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

  // MAIN CONTENT RENDERER
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: 
        return (
          <Box>
            <DashboardFilters 
              filters={dashFilters} 
              onFilterChange={setDashFilters} 
              onReset={() => setDashFilters({
                gender: "", region: "", age_min: 0, age_max: 100, 
                bmi_min: 10, bmi_max: 50, somatotype: "", date_from: "", date_to: ""
              })}
            />
            <SuperAdminDashboard stats={stats} statsLoading={statsLoading} admins={admins} />
          </Box>
        );
      case 1: 
        return (
          <Box>
            <DashboardFilters 
              filters={dashFilters} 
              onFilterChange={setDashFilters} 
              onReset={() => setDashFilters({
                gender: "", region: "", age_min: 0, age_max: 100, 
                bmi_min: 10, bmi_max: 50, somatotype: "", date_from: "", date_to: ""
              })}
            />
            <ScientificAnalysis stats={stats} loading={statsLoading} />
          </Box>
        );

      case 2:
        return <SuperAdminRegionalMap stats={stats} statsLoading={statsLoading} admins={admins} />;

      case 3:
        return (
          <Stack spacing={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4" fontWeight={800}>Adminlar Boshqaruvi</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setCurrentAdmin(null);
                  setAdminForm({ name: "", email: "", password: "", confirmPassword: "", role: "admin", phone: "", region: "" });
                  setShowAdminPassword(false);
                  setAdminDialogOpen(true);
                }}
                sx={{ borderRadius: 2 }}
              >
                Yangi Admin
              </Button>
            </Box>

            <TableContainer component={GlassPaper}>
              <Table>
                <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Ism</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Rol</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Telefon</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Amallar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {adminsLoading ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                  ) : (
                    admins.map((admin) => (
                      <TableRow key={admin.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.light" }}>{admin.name.charAt(0)}</Avatar>
                            <Typography variant="body2" fontWeight={600}>{admin.name}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>
                          <Chip label={admin.role.toUpperCase()} size="small" color={admin.role === "superadmin" ? "error" : "primary"} variant="outlined" />
                        </TableCell>
                        <TableCell>{admin.phone || "-"}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton size="small" onClick={() => { 
                              setCurrentAdmin(admin); 
                              setAdminForm({ ...admin, password: "", confirmPassword: "" }); 
                              setShowAdminPassword(false);
                              setAdminDialogOpen(true); 
                            }}>
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleDeleteAdmin(admin.id)} disabled={admin.id === user.id}><Delete fontSize="small" /></IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        );
      case 4:
        return (
          <Stack spacing={3}>
             <Box display="flex" justifyContent="space-between" alignItems="center">
               <Typography variant="h4" fontWeight={800}>O'chirilgan ma'lumotlar</Typography>
               {checked.size > 0 && (
                 <Stack direction="row" spacing={2}>
                    <Button variant="contained" color="success" startIcon={<Refresh />} onClick={handleBulkRestore}>Tiklash ({checked.size})</Button>
                    <Button variant="contained" color="error" startIcon={<DeleteForever />} onClick={handleBulkHardDelete}>Butunlay o'chirish ({checked.size})</Button>
                 </Stack>
               )}
             </Box>
             <TableContainer component={GlassPaper}>
               <Table>
                 <TableHead>
                   <TableRow>
                      <TableCell sx={{ width: 40 }}>
                         <Checkbox 
                           size="small" 
                           indeterminate={checked.size > 0 && checked.size < deletedData.length}
                           checked={deletedData.length > 0 && deletedData.every(r => checked.has(getDeletedRowKey(r)))}
                           onChange={() => toggleAll(deletedData)}
                         />
                      </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>ID Kod</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Bemor</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Kim o'chirdi</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>O'chirilgan sana</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Amallar</TableCell>
                  </TableRow>
                 </TableHead>
                 <TableBody>
                   {deletedLoading ? (
                     <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                   ) : deletedData.length === 0 ? (
                     <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8 }}>Bo'sh</TableCell></TableRow>
                   ) : (
                     deletedData.map((item) => (
                       <TableRow 
                         key={getDeletedRowKey(item)}
                         hover 
                         onClick={() => toggleOne(getDeletedRowKey(item))}
                         sx={{ 
                           cursor: 'pointer',
                           bgcolor: checked.has(getDeletedRowKey(item)) ? "rgba(0,123,255,0.08)" : "inherit"
                         }}
                       >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                             <Checkbox 
                               size="small" 
                               checked={checked.has(getDeletedRowKey(item))}
                               onChange={() => toggleOne(getDeletedRowKey(item))}
                             />
                          </TableCell>
                         <TableCell sx={{ fontWeight: "bold" }}>{getDeletedRowCode(item)}</TableCell>
                         <TableCell>{getDeletedRowPatientName(item)}</TableCell>
                         <TableCell>
                           <Stack direction="row" spacing={1} alignItems="center">
                             <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: "error.main" }}>{getDeletedByName(item).charAt(0).toUpperCase()}</Avatar>
                             <Typography variant="caption" fontWeight={600}>{getDeletedByName(item)}</Typography>
                           </Stack>
                         </TableCell>
                         <TableCell>{getDeletedDate(item)}</TableCell>
                         <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                           <Stack direction="row" spacing={1} justifyContent="flex-end">
                             <Tooltip title="Batafsil"><IconButton size="small" color="info" onClick={() => setViewRow(item)}><Visibility /></IconButton></Tooltip>
                             <Tooltip title="Tiklash"><IconButton size="small" color="success" onClick={() => handleRestoreAnalysis(item)}><Refresh /></IconButton></Tooltip>
                             <Tooltip title="Butunlay o'chirish"><IconButton size="small" color="error" onClick={() => handleHardDeleteAnalysis(item)}><Delete /></IconButton></Tooltip>
                           </Stack>
                         </TableCell>
                       </TableRow>
                     ))
                   )}
                 </TableBody>
               </Table>
             </TableContainer>

             <Typography variant="h5" fontWeight={700} sx={{ mt: 4, mb: 2 }}>O'chirilgan Adminlar / Izlanuvchilar</Typography>
             <TableContainer component={GlassPaper}>
               <Table>
                 <TableHead>
                   <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Ism</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Rol</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>O'chirilgan sana</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Amallar</TableCell>
                  </TableRow>
                 </TableHead>
                 <TableBody>
                   {deletedLoading ? (
                     <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                   ) : deletedAdmins.length === 0 ? (
                     <TableRow><TableCell colSpan={5} align="center" sx={{ py: 8 }}>Bo'sh</TableCell></TableRow>
                   ) : (
                     deletedAdmins.map((item) => (
                       <TableRow key={item.id} hover>
                         <TableCell>
                           <Stack direction="row" spacing={1.5} alignItems="center">
                             <Avatar sx={{ width: 32, height: 32, bgcolor: "warning.light" }}>{item.name.charAt(0)}</Avatar>
                             <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                           </Stack>
                         </TableCell>
                         <TableCell>{item.email}</TableCell>
                         <TableCell><Chip label={item.role.toUpperCase()} size="small" variant="outlined" /></TableCell>
                         <TableCell>{item.deleted_at ? new Date(item.deleted_at).toLocaleString() : "-"}</TableCell>
                         <TableCell align="right">
                           <Tooltip title="Tiklash">
                             <IconButton size="small" color="success" onClick={() => handleRestoreAdmin(item.id)}>
                               <Refresh />
                             </IconButton>
                           </Tooltip>
                         </TableCell>
                       </TableRow>
                     ))
                   )}
                 </TableBody>
               </Table>
             </TableContainer>
          </Stack>
        );
      case 5:
        return (
          <Stack spacing={3}>
            <Typography variant="h4" fontWeight={800}>Xavfsizlik</Typography>
            <GlassPaper sx={{ p: 4, maxWidth: 600 }}>
              <Typography variant="h6" gutterBottom>Parolni o'zgartirish</Typography>
              <TextField fullWidth label="Mavjud parol" type="password" margin="normal" />
              <TextField fullWidth label="Yangi parol" type="password" margin="normal" />
              <TextField fullWidth label="Yangi parolni tasdiqlang" type="password" margin="normal" />
              <Button variant="contained" sx={{ mt: 3, borderRadius: 2 }}>Yangilash</Button>
            </GlassPaper>
          </Stack>
        );
      case 6:
        return (
          <Stack spacing={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4" fontWeight={800}>Tizim Jurnali (Audit)</Typography>
              <Button startIcon={<Delete />} color="error" variant="outlined" onClick={handleClearAudit}>Tozalash</Button>
            </Box>
            <TableContainer component={GlassPaper}>
               <Table size="small">
                 <TableHead><TableRow>
                   <TableCell sx={{ fontWeight: 700 }}>Vaqt</TableCell>
                   <TableCell sx={{ fontWeight: 700 }}>Foydalanuvchi</TableCell>
                   <TableCell sx={{ fontWeight: 700 }}>Amal</TableCell>
                   <TableCell sx={{ fontWeight: 700 }}>Ob'ekt</TableCell>
                 </TableRow></TableHead>
                 <TableBody>
                   {auditLoading ? (
                     <TableRow><TableCell colSpan={4} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                   ) : (
                     auditLogs.map((log) => (
                       <TableRow key={log.id} hover>
                         <TableCell variant="caption">{new Date(log.created_at).toLocaleString()}</TableCell>
                         <TableCell>{log.user_email || "System"}</TableCell>
                         <TableCell><Chip label={log.action} size="small" variant="outlined" /></TableCell>
                         <TableCell sx={{ wordBreak: 'break-all' }}>{log.details}</TableCell>
                       </TableRow>
                     ))
                   )}
                 </TableBody>
               </Table>
             </TableContainer>
          </Stack>
        );
      case 7:
        return (
          <Stack spacing={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h4" fontWeight={800}>Zaxira Nusxalari (Backup)</Typography>
              <Button startIcon={<CloudUpload />} variant="contained" onClick={handleCreateBackup} disabled={backupLoading}>Yangi nusxa yaratish</Button>
            </Box>
            <TableContainer component={GlassPaper}>
               <Table>
                 <TableHead><TableRow>
                   <TableCell sx={{ fontWeight: 700 }}>Fayl nomi</TableCell>
                   <TableCell sx={{ fontWeight: 700 }}>Hajmi</TableCell>
                   <TableCell sx={{ fontWeight: 700 }}>Vaqti</TableCell>
                   <TableCell sx={{ fontWeight: 700 }} align="right">Amallar</TableCell>
                 </TableRow></TableHead>
                 <TableBody>
                   {backupLoading && backups.length === 0 ? (
                     <TableRow><TableCell colSpan={4} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                   ) : (
                     Array.isArray(backups) && backups.map((b) => (
                       <TableRow key={b.filename} hover>
                         <TableCell fontWeight="bold">{b.filename}</TableCell>
                         <TableCell>{((b.size_bytes || b.size || 0) / 1024 / 1024).toFixed(2)} MB</TableCell>
                         <TableCell>{new Date(b.created_at).toLocaleString()}</TableCell>
                         <TableCell align="right">
                           <Stack direction="row" spacing={1} justifyContent="flex-end">
                             <Tooltip title="Tiklash"><IconButton color="primary" onClick={() => handleRestoreBackup(b.filename)}><Refresh /></IconButton></Tooltip>
                             <Tooltip title="O'chirish"><IconButton color="error" onClick={() => handleDeleteBackup(b.filename)}><Delete /></IconButton></Tooltip>
                           </Stack>
                         </TableCell>
                       </TableRow>
                     ))
                   )}
                 </TableBody>
               </Table>
             </TableContainer>
          </Stack>
        );
      case 8: return <ClinicalCMS />;
      case 9: return <AdminActivity />;
      default: return null;
    }
  };

  const isDark = useTheme().palette.mode === 'dark';

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 10 }}>
      <Container maxWidth={false} sx={{ py: 4, px: { xs: 1.5, sm: 2, md: 4 }, maxWidth: "100%" }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="flex-start">
          {/* Sidebar Tabs */}
          <Box sx={{ 
            width: { xs: "100%", md: 300 }, 
            minWidth: { md: 300 },
            maxWidth: { md: 300 },
            flexShrink: 0,
            position: { md: "sticky" }, 
            top: 24 
          }}>
            <GlassPaper sx={{ p: 2, border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(100,116,139,0.12)', boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(100,116,139,0.08)' }}>
              <Box p={2} mb={2} textAlign="center">
                <Avatar sx={{ width: 64, height: 64, margin: "0 auto 16px", bgcolor: "primary.main", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>SA</Avatar>
                <Typography variant="h6" fontWeight={700}>{user.name}</Typography>
                <Typography variant="caption" color="text.secondary">Super Administrator</Typography>
              </Box>

              <Tabs
                orientation="vertical"
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                sx={{
                  "& .MuiTabs-indicator": { display: "none" },
                  "& .MuiTab-root": {
                    borderRadius: 2, mb: 0.5, alignItems: "flex-start", textAlign: "left",
                    minHeight: 44, textTransform: "none", fontWeight: 600, fontSize: "0.85rem",
                    transition: "all 0.2s", color: "text.secondary",
                    "&.Mui-selected": { bgcolor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 123, 255, 0.08)", color: "primary.main" },
                    "&:hover": { bgcolor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.04)" },
                  },
                }}
              >
                <Tab icon={<Dashboard sx={{ mr: 1.5, fontSize: 20 }} />} iconPosition="start" label="Dashboard" />
                <Tab icon={<AutoGraph sx={{ mr: 1.5, fontSize: 20 }} />} iconPosition="start" label="Ilmiy Tahlil" />
                <Tab icon={<Place sx={{ mr: 1.5, fontSize: 20 }} />} iconPosition="start" label="Hududiy xarita" />
                <Tab icon={<People sx={{ mr: 1.5, fontSize: 20 }} />} iconPosition="start" label="Adminlar" />
                <Tab icon={<RestoreFromTrash sx={{ mr: 1.5, fontSize: 20 }} />} iconPosition="start" label="O'chirilganlar" />
                <Tab icon={<Security sx={{ mr: 1.5, fontSize: 20 }} />} iconPosition="start" label="Xavfsizlik" />
                <Tab icon={<History sx={{ mr: 1.5, fontSize: 20 }} />} iconPosition="start" label="Audit Jurnali" />
                <Tab icon={<Storage sx={{ mr: 1.5, fontSize: 20 }} />} iconPosition="start" label="Backup" />
                <Tab icon={<SettingsSuggest sx={{ mr: 1.5, fontSize: 20 }} />} iconPosition="start" label="Klinik CMS" />
                <Tab icon={<Assignment sx={{ mr: 1.5, fontSize: 20 }} />} iconPosition="start" label="Monitoring" />
              </Tabs>

              <Box mt={2} pt={2} borderTop={isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.05)"}>
                <Button fullWidth color="error" startIcon={<Logout />} onClick={() => setLogoutDialogOpen(true)} sx={{ borderRadius: 2, justifyContent: "flex-start", px: 2 }}>Chiqish</Button>
              </Box>
            </GlassPaper>
          </Box>

          {/* Main Content Area */}
          <Box sx={{ flexGrow: 1, ...scrollableContentSx }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Box sx={{ minWidth: { xs: activeTab === 0 || activeTab === 1 ? 720 : 0, md: 0 } }}>
                  {renderTabContent()}
                </Box>
              </motion.div>
            </AnimatePresence>
          </Box>
        </Stack>

        <Dialog open={adminDialogOpen} onClose={() => setAdminDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>{currentAdmin ? "Adminni tahrirlash" : "Yangi Admin qo'shish"}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="F.I.SH" fullWidth value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} />
              <TextField label="Email" fullWidth value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} />
              
              <TextField 
                label={currentAdmin ? "Yangi parol (ixtiyoriy)" : "Parol"} 
                type={showAdminPassword ? "text" : "password"} 
                fullWidth 
                value={adminForm.password} 
                onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowAdminPassword(!showAdminPassword)} edge="end">
                        {showAdminPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField 
                label="Parolni tasdiqlash" 
                type={showAdminPassword ? "text" : "password"} 
                fullWidth 
                value={adminForm.confirmPassword} 
                onChange={(e) => setAdminForm({ ...adminForm, confirmPassword: e.target.value })}
                error={adminForm.password !== adminForm.confirmPassword && adminForm.confirmPassword !== ""}
                helperText={adminForm.password !== adminForm.confirmPassword && adminForm.confirmPassword !== "" ? "Parollar mos kelmadi" : ""}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowAdminPassword(!showAdminPassword)} edge="end">
                        {showAdminPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <FormControl fullWidth><InputLabel>Rol</InputLabel>
                <Select value={adminForm.role} label="Rol" onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}>
                  <MenuItem value="admin">Administrator</MenuItem>
                  <MenuItem value="superadmin">Super Administrator</MenuItem>
                  <MenuItem value="researcher">Izlanuvchi</MenuItem>
                </Select>
              </FormControl>
              <TextField label="Telefon" fullWidth value={adminForm.phone || ""} onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })} />
              <FormControl fullWidth>
                <InputLabel>Hudud</InputLabel>
                <Select value={adminForm.region || ""} label="Hudud" onChange={(e) => setAdminForm({ ...adminForm, region: e.target.value })}>
                  <MenuItem value="">Barchasi (Global)</MenuItem>
                  {Object.keys(UZB_LOCATIONS).map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}><Button onClick={() => setAdminDialogOpen(false)}>Bekor qilish</Button><Button variant="contained" onClick={handleAdminAction}>Saqlash</Button></DialogActions>
        </Dialog>

        <LogoutConfirmDialog
          open={logoutDialogOpen}
          onClose={() => setLogoutDialogOpen(false)}
          onConfirm={() => {
            setLogoutDialogOpen(false);
            logout();
          }}
        />

        <Dialog 
          open={deleteConfirmOpen} 
          onClose={() => setDeleteConfirmOpen(false)}
          PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>Butunlay o'chirish</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Siz <strong>{checked.size}</strong> ta yozuvni tanladingiz. Bularni bazadan butunlay o'chirib tashlamoqchimisiz?
            </Typography>
            <Box sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.05)', p: 2, borderRadius: 2, border: '1px solid', borderColor: 'error.light' }}>
              <Typography variant="caption" color="error.dark" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DeleteForever fontSize="small" /> DIQQAT: Bu amalni qaytarib bo'lmaydi!
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">Bekor qilish</Button>
            <Button 
              variant="contained" 
              color="error" 
              onClick={async () => {
                setDeleteConfirmLoading(true);
                try {
                  const selectedRows = deletedData.filter((row) => checked.has(getDeletedRowKey(row)));
                  const analysisIds = selectedRows
                    .filter((row) => row.__deletedSource !== "research")
                    .map((row) => row.id);
                  const researchIds = selectedRows
                    .filter((row) => row.__deletedSource === "research")
                    .map((row) => row.id);

                  if (analysisIds.length) await AdminApi.analyses.hardDelete(analysisIds);
                  for (const id of researchIds) await ResearchApi.hardDelete(id);

                  toast.success("Ma'lumotlar o'chirildi");
                  setChecked(new Set());
                  setDeleteConfirmOpen(false);
                  fetchDeletedAnalyses();
                } catch (e) { toast.error(e.message); }
                finally { setDeleteConfirmLoading(false); }
              }} 
              disabled={deleteConfirmLoading}
            >
              {deleteConfirmLoading ? <CircularProgress size={20} color="inherit" /> : "Ha, butunlay o'chirilsin"}
            </Button>
          </DialogActions>
        </Dialog>

        {viewRow && (
          <Dialog open={true} onClose={() => setViewRow(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6" fontWeight="bold">O'chirilgan ma'lumot tafsiloti</Typography>
                <IconButton onClick={() => setViewRow(null)} size="small"><Close /></IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
               <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">ID Kod</Typography>
                      <Typography variant="body1" fontWeight="bold">{getDeletedRowCode(viewRow)}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">Bemor</Typography>
                      <Typography variant="body1" fontWeight="bold">{getDeletedRowPatientName(viewRow)}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">Yoshi / Jinsi</Typography>
                      <Typography variant="body1">{viewRow.age ? `${viewRow.age} yosh` : "-"} / {getGenderLabel(viewRow.gender)}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">BMI</Typography>
                      <Typography variant="body1">{getDeletedRowBmiText(viewRow)}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.1)' : 'rgba(211, 47, 47, 0.05)', borderRadius: 2, border: '1px solid', borderColor: 'error.light' }}>
                      <Typography variant="caption" color="error.dark">O'chirgan shaxs</Typography>
                      <Typography variant="body1" fontWeight="bold">{getDeletedByName(viewRow)}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.1)' : 'rgba(211, 47, 47, 0.05)', borderRadius: 2, border: '1px solid', borderColor: 'error.light' }}>
                      <Typography variant="caption" color="error.dark">O'chirilgan vaqt</Typography>
                      <Typography variant="body1">{getDeletedDate(viewRow)}</Typography>
                    </Box>
                  </Grid>
                  {(viewRow.region || viewRow.settlement || viewRow.school_name) && (
                    <Grid item xs={12}>
                      <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary">Hudud / muassasa</Typography>
                        <Typography variant="body1">{[viewRow.region || viewRow.settlement, viewRow.school_name].filter(Boolean).join(" / ")}</Typography>
                      </Box>
                    </Grid>
                  )}
               </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button variant="contained" color="success" startIcon={<Refresh />} onClick={() => { handleRestoreAnalysis(viewRow); setViewRow(null); }}>Tiklash</Button>
              <Button variant="outlined" color="error" startIcon={<DeleteForever />} onClick={() => { handleHardDeleteAnalysis(viewRow); setViewRow(null); }}>Butunlay o'chirish</Button>
              <Button onClick={() => setViewRow(null)} color="inherit">Yopish</Button>
            </DialogActions>
          </Dialog>
        )}
      </Container>
    </Box>
  );
};

export default SuperAdminPage;

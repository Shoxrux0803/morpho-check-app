import React, { useState, useEffect, useCallback } from "react";
import { 
  Box, Container, Typography, Paper, Tabs, Tab, TextField, Button, Avatar, Stack, 
  IconButton, Tooltip, InputAdornment, Alert, CircularProgress, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, 
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Divider,
  Chip, Collapse, Grid
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
import { AdminApi } from "../services/api";
import { toast } from "react-hot-toast";
import { UZB_LOCATIONS } from "../data/uzbLocations";

// Components
import SuperAdminDashboard from "../components/Dashboard/SuperAdminDashboard";
import ScientificAnalysis from "../components/Dashboard/ScientificAnalysis";
import ClinicalCMS from "../components/Admin/ClinicalCMS";
import AdminActivity from "../components/Admin/AdminActivity";
import ResearcherDataView from "../components/Admin/ResearcherDataView";

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

const SuperAdminPage = () => {
  const navigate = useNavigate();
  const { user, login: authLogin, logout, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginInProgress, setLoginInProgress] = useState(false);

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
  const [deletedLoading, setDeletedLoading] = useState(false);
  
  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  
  // Dashboard Stats State
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Backup State
  const [backups, setBackups] = useState([]);
  const [backupLoading, setBackupLoading] = useState(false);

  useEffect(() => {
    if (user?.role === "superadmin") {
      if (activeTab === 0 || activeTab === 1) {
        fetchDashboardStats();
        fetchAdmins();
      }
      if (activeTab === 2) fetchAdmins();
      if (activeTab === 3) fetchDeletedAnalyses();
      if (activeTab === 5) fetchAuditLogs();
      if (activeTab === 6) fetchBackups();
    }
  }, [user, activeTab]);



  const fetchDashboardStats = async () => {
    setStatsLoading(true);
    try {
      const data = await AdminApi.stats();
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
      const data = await AdminApi.analyses.deletedList();
      setDeletedData(data.items || []);
    } catch (err) {
      console.error("Failed to fetch deleted analyses:", err);
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

  const handleRestoreAnalysis = async (id) => {
    try {
      await AdminApi.analyses.restore([id]);
      toast.success("Ma'lumot tiklandi");
      fetchDeletedAnalyses();
    } catch (err) {
      toast.error("Xatolik: " + err.message);
    }
  };

  const handleHardDeleteAnalysis = async (id) => {
    if (window.confirm("DIQQAT! Ushbu ma'lumot bazadan butunlay o'chiriladi. Tiklab bo'lmaydi! Davom etamizmi?")) {
      try {
        await AdminApi.analyses.hardDelete([id]);
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
      case 0: return <SuperAdminDashboard stats={stats} statsLoading={statsLoading} admins={admins} />;
      case 1: return <ScientificAnalysis stats={stats} loading={statsLoading} />;
      case 2:
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
      case 3:
        return (
          <Stack spacing={3}>
             <Typography variant="h4" fontWeight={800}>O'chirilgan ma'lumotlar</Typography>
             <TableContainer component={GlassPaper}>
               <Table>
                 <TableHead><TableRow>
                   <TableCell sx={{ fontWeight: 700 }}>ID Kod</TableCell>
                   <TableCell sx={{ fontWeight: 700 }}>Bemor</TableCell>
                   <TableCell sx={{ fontWeight: 700 }}>O'chirilgan sana</TableCell>
                   <TableCell sx={{ fontWeight: 700 }} align="right">Amallar</TableCell>
                 </TableRow></TableHead>
                 <TableBody>
                   {deletedLoading ? (
                     <TableRow><TableCell colSpan={4} align="center" sx={{ py: 8 }}><CircularProgress /></TableCell></TableRow>
                   ) : deletedData.length === 0 ? (
                     <TableRow><TableCell colSpan={4} align="center" sx={{ py: 8 }}>Bo'sh</TableCell></TableRow>
                   ) : (
                     deletedData.map((item) => (
                       <TableRow key={item.id} hover>
                         <TableCell fontWeight="bold">{item.id_code}</TableCell>
                         <TableCell>{item.last_name} {item.first_name}</TableCell>
                         <TableCell>{new Date(item.deleted_at).toLocaleString()}</TableCell>
                         <TableCell align="right">
                           <Stack direction="row" spacing={1} justifyContent="flex-end">
                             <Tooltip title="Tiklash"><IconButton size="small" color="success" onClick={() => handleRestoreAnalysis(item.id)}><Refresh /></IconButton></Tooltip>
                             <Tooltip title="Butunlay o'chirish"><IconButton size="small" color="error" onClick={() => handleHardDeleteAnalysis(item.id)}><Delete /></IconButton></Tooltip>
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
      case 5:
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
      case 6:
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
      case 7: return <ClinicalCMS />;
      case 8: return <AdminActivity />;
      case 9: return renderResearchTab();
      default: return null;
    }
  };

  // ══════════════════════════════════════════════════
  //  IZLANUVCHILAR TAB RENDERER
  // ══════════════════════════════════════════════════
  const renderResearchTab = () => (
    <ResearcherDataView isSuperAdmin={true} />
  );

  return (
    <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="flex-start">
        {/* Sidebar Tabs */}
        <Box sx={{ width: { xs: "100%", md: 300 }, position: { md: "sticky" }, top: 24 }}>
          <GlassPaper sx={{ p: 2 }}>
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
                  "&.Mui-selected": { bgcolor: "rgba(0, 123, 255, 0.1)", color: "primary.main" },
                  "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
                },
              }}
            >
              <Tab icon={<Dashboard sx={{ mr: 1.5, fontSize: 20 }} />} iconPosition="start" label="Dashboard" />
              <Tab icon={<AutoGraph sx={{ mr: 1.5, fontSize: 20 }} />} iconPosition="start" label="Ilmiy Tahlil" />
              <Tab icon={<People sx={{ mr: 1.5, fontSize: 20 }} />} iconPosition="start" label="Adminlar" />
              <Tab icon={<RestoreFromTrash sx={{ mr: 1.5, fontSize: 20 }} />} iconPosition="start" label="O'chirilganlar" />
              <Tab icon={<Security sx={{ mr: 1.5, fontSize: 20 }} />} iconPosition="start" label="Xavfsizlik" />
              <Tab icon={<History sx={{ mr: 1.5, fontSize: 20 }} />} iconPosition="start" label="Audit Jurnali" />
              <Tab icon={<Storage sx={{ mr: 1.5, fontSize: 20 }} />} iconPosition="start" label="Backup" />
              <Tab icon={<SettingsSuggest sx={{ mr: 1.5, fontSize: 20 }} />} iconPosition="start" label="Klinik CMS" />
              <Tab icon={<Assignment sx={{ mr: 1.5, fontSize: 20 }} />} iconPosition="start" label="Monitoring" />
              <Tab
                icon={<Science sx={{ mr: 1.5, fontSize: 20 }} />}
                iconPosition="start"
                label="Izlanuvchilar"
                sx={{ mt: 1, borderTop: "1px solid rgba(0,0,0,0.06)" }}
              />
            </Tabs>

            <Box mt={2} pt={2} borderTop="1px solid rgba(0,0,0,0.05)">
              <Button fullWidth color="error" startIcon={<Logout />} onClick={logout} sx={{ borderRadius: 2, justifyContent: "flex-start", px: 2 }}>Chiqish</Button>
            </Box>
          </GlassPaper>
        </Box>

        {/* Main Content Area */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderTabContent()}
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
    </Container>
  );
};

export default SuperAdminPage;

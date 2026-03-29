import React, { useState, useEffect } from "react";
import { Box, Container, Typography, Paper, Tabs, Tab, TextField, Button, Avatar, Stack, IconButton, Tooltip, Fade, InputAdornment, Alert, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { useNavigate } from "react-router-dom";

import {
  AdminPanelSettings,
  Lock,
  Person,
  Logout,
  Dashboard,
  People,
  Assessment,
  Add,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Security,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend 
} from "recharts";


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
          ? "rgba(255, 255, 255, 0.08)"
          : "rgba(0, 0, 0, 0.05)",
      overflow: "hidden",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const SuperAdminPage = () => {
  const navigate = useNavigate();
  const { user, login, logout, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginInProgress, setLoginInProgress] = useState(false);

  // User role checking is now handled by AdminWrapper in App.js

  // Admin Management State
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
    phone: "",
  });

  // System Stats State
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (user?.role === "superadmin") {
      fetchAdmins();
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await api.AdminApi.stats.get();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch statistics:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchAdmins = async () => {
    setAdminsLoading(true);
    try {
      const data = await api.AdminApi.users.list();
      setAdmins(data);
    } catch (err) {
      console.error("Failed to fetch admins:", err);
    } finally {
      setAdminsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginInProgress(true);
    try {
      const profile = await login(loginForm);
      if (profile.role === "admin" || profile.role === "superadmin") {
        // Stay here, Dashboard (Admin) or User Management (SuperAdmin) will render
        // because AdminWrapper in App.js will handle the role-based switch
      } else {
        navigate("/");
      }
    } catch (err) {
      setLoginError(err.message || "Kirishda xatolik yuz berdi");
    } finally {
      setLoginInProgress(false);
    }
  };

  const handleAdminAction = async () => {
    try {
      if (currentAdmin) {
        await api.AdminApi.users.update(currentAdmin.id, adminForm);
        alert("Admin ma'lumotlari muvaffaqiyatli yangilandi");
      } else {
        await api.AdminApi.users.create(adminForm);
        alert("Yangi admin muvaffaqiyatli qo'shildi");
      }
      setAdminDialogOpen(false);
      fetchAdmins();
    } catch (err) {
      alert("Xatolik: " + err.message);
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (window.confirm("Haqiqatan ham bu adminni o'chirmoqchimisiz?")) {
      try {
        await api.AdminApi.users.delete(id);
        fetchAdmins();
      } catch (err) {
        alert("Xatolik: " + err.message);
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
                  helperText="Masalan: admin@admin.com yoki Admin"
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

  // MAIN DASHBOARD
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="flex-start">
        {/* Sidebar Tabs */}
        <Box sx={{ width: { xs: "100%", md: 280 } }}>
          <GlassPaper sx={{ p: 2 }}>
            <Box p={2} mb={2} textAlign="center">
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  margin: "0 auto 16px",
                  bgcolor: "primary.main",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                SA
              </Avatar>
              <Typography variant="h6" fontWeight={700}>
                {user.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tizim Super Administratori
              </Typography>
            </Box>

            <Tabs
              orientation="vertical"
              value={activeTab}
              onChange={(e, v) => setActiveTab(v)}
              sx={{
                "& .MuiTabs-indicator": { display: "none" },
                "& .MuiTab-root": {
                  borderRadius: 2,
                  mb: 1,
                  alignItems: "flex-start",
                  textAlign: "left",
                  minHeight: 48,
                  textTransform: "none",
                  fontWeight: 600,
                  transition: "all 0.2s",
                  color: "text.secondary",
                  "&.Mui-selected": {
                    bgcolor: "rgba(0, 123, 255, 0.1)",
                    color: "primary.main",
                  },
                  "&:hover": {
                    bgcolor: "rgba(0, 0, 0, 0.04)",
                  },
                },
              }}
            >
              <Tab icon={<Dashboard sx={{ mr: 2 }} />} iconPosition="start" label="Umumiy tahlil" />
              <Tab icon={<People sx={{ mr: 2 }} />} iconPosition="start" label="Adminlar boshqaruvi" />
              <Tab icon={<Assessment sx={{ mr: 2 }} />} iconPosition="start" label="Hisobotlar" />
              <Tab icon={<Security sx={{ mr: 2 }} />} iconPosition="start" label="Xavfsizlik" />
            </Tabs>

            <Box mt={4} pt={2} borderTop="1px solid rgba(0,0,0,0.05)">
              <Button
                fullWidth
                color="error"
                startIcon={<Logout />}
                onClick={logout}
                sx={{ borderRadius: 2, justifyContent: "flex-start", px: 2 }}
              >
                Chiqish
              </Button>
            </Box>
          </GlassPaper>
        </Box>

        {/* Main Content Area */}
        <Box sx={{ flexGrow: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 0 && (
                <Stack spacing={3}>
                  <Typography variant="h4" fontWeight={800}>
                    Tizim Tahlili
                  </Typography>
                  
                  {statsLoading ? (
                    <Box display="flex" justifyContent="center" py={10}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <>
                      <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr 1fr" }} gap={3}>
                        {[
                          { label: "Jami analzlar", val: stats?.total_analyses?.toLocaleString() || "0", color: "#3f51b5" },
                          { label: "Oylik o'sish", val: `${stats?.monthly_growth || 0}`, color: "#4caf50" },
                          { label: "Umumiy tushum", val: `${stats?.total_revenue?.toLocaleString() || "0"} so'm`, color: "#f50057" },
                        ].map((stat, i) => (
                          <GlassPaper key={i} sx={{ p: 3, borderLeft: `6px solid ${stat.color}`, transition: "transform 0.2s", "&:hover": { transform: "translateY(-5px)" } }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                              {stat.label}
                            </Typography>
                            <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
                              {stat.val}
                            </Typography>
                          </GlassPaper>
                        ))}
                      </Box>

                      {/* Charts Section */}
                      <Box display="grid" gridTemplateColumns={{ xs: "1fr", lg: "2fr 1fr" }} gap={3}>
                        <GlassPaper sx={{ p: 3, minHeight: 400 }}>
                          <Typography variant="h6" fontWeight={700} mb={3}>Analizlar dinamikasi (Oylik)</Typography>
                          <Box sx={{ height: 320, width: "100%" }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={stats?.monthly_trend || []}>
                                <defs>
                                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3f51b5" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3f51b5" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <ReTooltip 
                                  contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#3f51b5" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </Box>
                        </GlassPaper>

                        <GlassPaper sx={{ p: 3, minHeight: 400 }}>
                          <Typography variant="h6" fontWeight={700} mb={3}>Jinsiy taqsimot</Typography>
                          <Box sx={{ height: 320, width: "100%" }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: "Erkak", value: stats?.by_gender?.erkak || 0 },
                                    { name: "Ayol", value: stats?.by_gender?.ayol || 0 },
                                    { name: "Noma'lum", value: stats?.by_gender?.["noma'lum"] || 0 },
                                  ].filter(d => d.value > 0)}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  <Cell fill="#0088FE" />
                                  <Cell fill="#FF8042" />
                                  <Cell fill="#8884d8" />
                                </Pie>
                                <ReTooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                              </PieChart>
                            </ResponsiveContainer>
                          </Box>
                        </GlassPaper>
                      </Box>

                      <Box display="grid" gridTemplateColumns={{ xs: "1fr", lg: "1fr 1fr" }} gap={3}>
                        <GlassPaper sx={{ p: 3, minHeight: 350 }}>
                          <Typography variant="h6" fontWeight={700} mb={3}>Yosh guruhlari</Typography>
                          <Box sx={{ height: 280, width: "100%" }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={stats?.by_age_group || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <ReTooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="value" fill="#4caf50" radius={[4, 4, 0, 0]} barSize={40} />
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        </GlassPaper>

                        <GlassPaper sx={{ p: 3, minHeight: 350 }}>
                          <Typography variant="h6" fontWeight={700} mb={3}>Somatotype taqsimoti</Typography>
                          <Box sx={{ height: 280, width: "100%" }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart 
                                layout="vertical" 
                                data={Object.entries(stats?.by_somatotype || {}).map(([name, value]) => ({ name, value }))}
                              >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} />
                                <ReTooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="value" fill="#ff9800" radius={[0, 4, 4, 0]} barSize={20} />
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        </GlassPaper>
                      </Box>
                    </>
                  )}
                </Stack>
              )}

              {activeTab === 1 && (
                <Stack spacing={3}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4" fontWeight={800}>
                      Adminlar Boshqaruvi
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => {
                        setCurrentAdmin(null);
                        setAdminForm({ name: "", email: "", password: "", role: "admin", phone: "" });
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
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                              <CircularProgress />
                            </TableCell>
                          </TableRow>
                        ) : (
                          admins.map((admin) => (
                            <TableRow key={admin.id} hover>
                              <TableCell>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                  <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.light" }}>
                                    {admin.name.charAt(0)}
                                  </Avatar>
                                  <Typography variant="body2" fontWeight={600}>
                                    {admin.name}
                                  </Typography>
                                </Stack>
                              </TableCell>
                              <TableCell>{admin.email}</TableCell>
                              <TableCell>
                                <Box
                                  component="span"
                                  sx={{
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    bgcolor: admin.role === "superadmin" ? "error.light" : "primary.light",
                                    color: admin.role === "superadmin" ? "error.dark" : "primary.dark",
                                  }}
                                >
                                  {admin.role.toUpperCase()}
                                </Box>
                              </TableCell>
                              <TableCell>{admin.phone || "-"}</TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                  <Tooltip title="Tahrirlash">
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setCurrentAdmin(admin);
                                        setAdminForm({ ...admin, password: "" });
                                        setAdminDialogOpen(true);
                                      }}
                                    >
                                      <Edit fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="O'chirish">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleDeleteAdmin(admin.id)}
                                      disabled={admin.id === user.id}
                                    >
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Stack>
              )}
              
              {(activeTab === 2 || activeTab === 3) && (
                <Box py={10} textAlign="center">
                  <Typography variant="h5" color="text.secondary">
                    Tez orada...
                  </Typography>
                </Box>
              )}
            </motion.div>
          </AnimatePresence>
        </Box>
      </Stack>

      {/* Admin Dialog */}
      <Dialog open={adminDialogOpen} onClose={() => setAdminDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {currentAdmin ? "Adminni tahrirlash" : "Yangi Admin qo'shish"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="F.I.SH"
              fullWidth
              value={adminForm.name}
              onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
            />
            <TextField
              label="Email"
              fullWidth
              value={adminForm.email}
              onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
            />
            <TextField
              label="Yangi parol (ixtiyoriy)"
              type="password"
              fullWidth
              value={adminForm.password}
              onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select
                value={adminForm.role}
                label="Rol"
                onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
              >
                <MenuItem value="admin">Administrator</MenuItem>
                <MenuItem value="superadmin">Super Administrator</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Telefon"
              fullWidth
              value={adminForm.phone}
              onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setAdminDialogOpen(false)}>Bekor qilish</Button>
          <Button variant="contained" onClick={handleAdminAction}>Saqlash</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SuperAdminPage;

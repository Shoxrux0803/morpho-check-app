import React, { useMemo, useState, useEffect, useCallback } from "react";
import { AdminApi } from "../services/AdminApi";
import { generateDocx, generatePdf, generatePdfById, generateDocxById } from "../services/api";
import { LANGUAGES } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Material UI importlari
import {
  Container,
  Grid,
  Typography,
  Paper,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Box,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Stack,
  Avatar,
} from "@mui/material";
import {
  Delete,
  Download,
  FilterList,
  Close,
  Dashboard as DashboardIcon,
  List as ListIcon,
  Lock,
  Person,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

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

// Yangi modular komponentlar
import StatsCards from "../components/Dashboard/StatsCards";
import RecentActivity from "../components/Dashboard/RecentActivity";
import RegionStats from "../components/Dashboard/RegionStats";
import BMIDistribution from "../components/Dashboard/BMIDistribution";
import UserGrowthChart from "../components/Dashboard/UserGrowthChart";
import GenderDistribution from "../components/Dashboard/GenderDistribution";
import AgeGroupDistribution from "../components/Dashboard/AgeGroupDistribution";
import SomatotypeAnalysis from "../components/Dashboard/SomatotypeAnalysis";
import AdminFilters from "../components/Admin/AdminFilters";
import AdminTable from "../components/Admin/AdminTable";

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
  if (bmi < 12) return "Ozg'in?";
  if (bmi < 18) return "Normal?";
  if (bmi < 22) return "Ortiqcha?";
  return "Semizlik?";
};

const normalize = (r) => {
  const name = (r.name || "").trim();
  const parts = name.split(" ");
  const firstGuess = parts[0] || "";
  const lastGuess = parts.slice(1).join(" ");
  const bmiVal = r.bmi ?? calcBMI(r.weight, r.height);

  return {
    ...r,
    idCode: r.id_code || r.idCode,
    createdAt: r.created_at || r.createdAt,
    firstName: r.first_name || r.firstName || firstGuess,
    lastName: r.last_name || r.lastName || lastGuess,
    bmi: bmiVal,
    bmiStatus: r.bmi_status || bmiStatus(bmiVal, r.age),
  };
};

function CustomModal({ children, onClose, title, onDownloadDocx, isDownloading, onDownloadPdf, isPdfDownloading, pdfLang, setPdfLang }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog open={true} onClose={onClose} fullScreen={fullScreen} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight="bold">{title}</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
          <Button
            variant="contained"
            color="secondary"
            startIcon={isDownloading ? <CircularProgress size={20} color="inherit" /> : <Download />}
            onClick={onDownloadDocx}
            disabled={isDownloading || isPdfDownloading}
            sx={{ borderRadius: 2 }}
          >
            Word
          </Button>

          <FormControl size="small" sx={{ minWidth: 90 }}>
            <InputLabel>Til</InputLabel>
            <Select value={pdfLang} label="Til" onChange={(e) => setPdfLang(e.target.value)}>
              {LANGUAGES.map((l) => (
                <MenuItem key={l.code} value={l.code}>
                  {l.flag} {l.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="primary"
            startIcon={isPdfDownloading ? <CircularProgress size={20} color="inherit" /> : <Download />}
            onClick={onDownloadPdf}
            disabled={isDownloading || isPdfDownloading}
            sx={{ borderRadius: 2 }}
          >
            PDF hisobot
          </Button>
        </Box>
        <Button variant="outlined" onClick={onClose} sx={{ borderRadius: 2 }}>Yopish</Button>
      </DialogActions>
    </Dialog>
  );
}

// ===== ASOSIY ADMIN PAGE =====
export default function AdminPage() {
  const navigate = useNavigate();
  const { user, login, loading: authLoading } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginInProgress, setLoginInProgress] = useState(false);

  // User role checking is now handled by AdminWrapper in App.js

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginInProgress(true);
    try {
      const profile = await login(loginForm);
      if (profile.role === "superadmin" || profile.role === "admin") {
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

  const [activeTab, setActiveTab] = useState(0);
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfLang, setPdfLang] = useState("uz");

  // Filtr/sort/paging
  const [q, setQ] = useState("");
  const [gender, setGender] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [region, setRegion] = useState("");
  const [sort, setSort] = useState({ key: "createdAt", dir: "desc" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Tanlov/bulk
  const [checked, setChecked] = useState(new Set());
  const [viewRow, setViewRow] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(true);

  // DashBoard ma'lumotlari - FILTRLANGAN
  const [dashData, setDashData] = useState([]);
  const [dashLoading, setDashLoading] = useState(false);

  // Tab switch qilinganda dashboard ma'lumotlarini yuklash
  useEffect(() => {
    if (activeTab === 0) {
      const fetchDashData = async () => {
        setDashLoading(true);
        try {
          // Dashboard uchun filtrlar asosida ko'proq ma'lumot olamiz (max 1000)
          const res = await AdminApi.analyses.list({ 
            q, gender, ageMin, ageMax, dateFrom, dateTo, region,
            page: 1, pageSize: 1000 
          });
          setDashData(res.items || []);
        } catch (e) {
          console.error("Dashboard yuklashda xato:", e);
        } finally {
          setDashLoading(false);
        }
      };
      fetchDashData();
    }
  }, [activeTab, q, gender, ageMin, ageMax, dateFrom, dateTo, region, user]);

  // Statistikalar (KPI uchun barcha dashData bo'yicha)
  const dashboardStats = useMemo(() => {
    if (!dashData.length) return { totalUsers: totalCount, todayUsers: 0, avgAge: 0, avgBMI: 0, normalBMIPercent: 0 };
    
    const today = new Date().toDateString();
    const todayCount = dashData.filter(u => new Date(u.created_at || u.createdAt).toDateString() === today).length;
    
    let totalAge = 0;
    let totalBMI = 0;
    let bmiCount = 0;
    let normalCount = 0;

    dashData.forEach(u => {
      totalAge += Number(u.age) || 0;
      const bmi = u.bmi || calcBMI(u.weight, u.height);
      if (bmi) {
        totalBMI += bmi;
        bmiCount++;
        if (bmi >= 18.5 && bmi < 25) normalCount++;
      }
    });

    return {
      totalUsers: totalCount,
      todayUsers: todayCount,
      avgAge: (totalAge / dashData.length).toFixed(1),
      avgBMI: bmiCount > 0 ? (totalBMI / bmiCount) : 0,
      normalBMIPercent: bmiCount > 0 ? (normalCount / bmiCount) * 100 : 0
    };
  }, [dashData, totalCount]);

  // Yuklash - BACKEND PAGINATION
  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const response = await AdminApi.analyses.list({
        q, gender, ageMin, ageMax, dateFrom, dateTo, region,
        sortKey: sort.key === "createdAt" ? "created_at" : sort.key,
        sortDir: sort.dir,
        page: page + 1,
        pageSize: rowsPerPage,
      });
      setRaw((response.items || []).map(normalize));
      setTotalCount(response.total || 0);
    } catch (e) {
      setErr(e?.message || "Xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  }, [q, gender, ageMin, ageMax, dateFrom, dateTo, region, sort, page, rowsPerPage, user]);

  useEffect(() => { load(); }, [load]);

  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
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
                Tizimga kirish uchun hisobingizga kiring
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
                  disabled={loginInProgress || authLoading}
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

  const toggleAll = () => {
    const next = new Set(checked);
    const allChecked = raw.length > 0 && raw.every((r) => checked.has(r.id));
    if (allChecked) raw.forEach((r) => next.delete(r.id));
    else raw.forEach((r) => next.add(r.id));
    setChecked(next);
  };

  const toggleOne = (id) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChecked(next);
  };

  const onDeleteSelected = async () => {
    if (!checked.size || !window.confirm(`${checked.size} ta yozuvni o'chirasizmi?`)) return;
    try {
      await Promise.all(Array.from(checked).map(id => AdminApi.analyses.remove(id)));
      setChecked(new Set());
      load();
    } catch (e) { alert("O'chirishda xato."); }
  };

  const handleDownloadPdf = async () => {
    if (!viewRow) return;
    setDownloadingPdf(true);
    try {
      const blob = await generatePdfById(viewRow.id, pdfLang);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `morphocheck_report_${viewRow.idCode}_${pdfLang}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("PDF yuklashda xato: " + e.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!viewRow) return;
    setDownloadingDocx(true);
    try {
      const blob = await generateDocxById(viewRow.id, pdfLang);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `morphocheck_anketa_${viewRow.idCode}_${pdfLang}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Word yuklashda xato: " + e.message);
    } finally {
      setDownloadingDocx(false);
    }
  };

  const onExportXlsx = async () => {
    try {
      const blob = await AdminApi.analyses.exportXlsx({ q, gender, ageMin, ageMax, dateFrom, dateTo, region });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `morphocheck_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
    } catch (e) { alert("Eksportda xato."); }
  };

  const renderTabContent = () => {
    if (activeTab === 0) {
      return (
        <Box sx={{ py: 2 }}>
            <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                    <Typography variant="h4" fontWeight="900" color="primary.main">Dashboard</Typography>
                    <Typography variant="body1" color="text.secondary">Tizimdagi umumiy tahliliy ko'rsatkichlar</Typography>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<FilterList />} 
                    onClick={() => setFiltersOpen(!filtersOpen)}
                    sx={{ borderRadius: 3, px: 3 }}
                >
                    Filtrlar {filtersOpen ? 'Yopish' : 'Ochish'}
                </Button>
            </Box>

            {filtersOpen && (
              <Box mb={4}>
                  <AdminFilters 
                    q={q} setQ={setQ} gender={gender} setGender={setGender} 
                    ageMin={ageMin} setAgeMin={setAgeMin} ageMax={ageMax} setAgeMax={setAgeMax}
                    dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo}
                    region={region} setRegion={setRegion}
                  />
              </Box>
            )}

            <StatsCards 
                totalUsers={dashboardStats.totalUsers} 
                todayUsers={dashboardStats.todayUsers} 
                avgAge={dashboardStats.avgAge}
                avgBMI={dashboardStats.avgBMI}
                normalBMIPercent={dashboardStats.normalBMIPercent}
            />

            <Grid container spacing={3}>
                <Grid item xs={12} lg={8}><UserGrowthChart data={dashData} loading={dashLoading} /></Grid>
                <Grid item xs={12} lg={4}><RecentActivity data={dashData} loading={dashLoading} /></Grid>
                
                <Grid item xs={12} md={4} lg={3}><BMIDistribution data={dashData} loading={dashLoading} /></Grid>
                <Grid item xs={12} md={4} lg={3}><GenderDistribution data={dashData} loading={dashLoading} /></Grid>
                <Grid item xs={12} md={4} lg={3}><AgeGroupDistribution data={dashData} loading={dashLoading} /></Grid>
                <Grid item xs={12} md={12} lg={3}><SomatotypeAnalysis data={dashData} loading={dashLoading} /></Grid>

                <RegionStats data={dashData} loading={dashLoading} />
            </Grid>
        </Box>
      );
    }

    return (
      <Box sx={{ py: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} gap={2}>
           <Typography variant="h5" fontWeight="bold">Foydalanuvchilar Listi</Typography>
           <Box display="flex" gap={1}>
             <Button variant="outlined" startIcon={<Download />} onClick={onExportXlsx} sx={{ borderRadius: 2 }}>XLSX Export</Button>
             <Button variant="outlined" color="error" startIcon={<Delete />} onClick={onDeleteSelected} disabled={!checked.size} sx={{ borderRadius: 2 }}>O'chirish ({checked.size})</Button>
           </Box>
        </Box>
        
        <AdminFilters 
            q={q} setQ={setQ} gender={gender} setGender={setGender} 
            ageMin={ageMin} setAgeMin={setAgeMin} ageMax={ageMax} setAgeMax={setAgeMax}
            dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo}
            region={region} setRegion={setRegion}
        />

        <Paper elevation={0} sx={{ mt: 3, borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          {loading && <LinearProgress />}
          <AdminTable 
            rows={raw} checked={checked} toggleAll={toggleAll} toggleOne={toggleOne} 
            allChecked={raw.length > 0 && raw.every(r => checked.has(r.id))} 
            setViewRow={setViewRow} formatDate={(d) => new Date(d).toLocaleDateString("uz-UZ")} 
            user={user}
          />
          <TablePagination
            component="div" count={totalCount} rowsPerPage={rowsPerPage} page={page}
            onPageChange={(e, p) => setPage(p)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          />
        </Paper>
      </Box>
    );
  };

  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 10 }}>
      <AppBar 
        position="sticky" 
        elevation={0} 
        sx={{ 
            bgcolor: isDark ? "rgba(23, 26, 33, 0.8)" : "rgba(255, 255, 255, 0.8)", 
            backdropFilter: 'blur(10px)',
            color: "text.primary", 
            borderBottom: "1px solid",
            borderColor: "divider"
        }}
      >
        <Container maxWidth="xl">
            <Toolbar disableGutters>
                <Typography variant="h6" fontWeight="900" sx={{ flexGrow: 1, letterSpacing: -0.5, color: 'primary.main' }}>
                   MORPHO CHECK <Box component="span" sx={{ color: 'text.primary', fontWeight: 400 }}>PRO</Box>
                </Typography>
                <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ minHeight: 64 }}>
                    <Tab icon={<DashboardIcon />} iconPosition="start" label="Dashboard" sx={{ fontWeight: 'bold' }} />
                    <Tab icon={<ListIcon />} iconPosition="start" label="Ma'lumotlar" sx={{ fontWeight: 'bold' }} />
                </Tabs>
            </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {renderTabContent()}
      </Container>

      {viewRow && (
        <CustomModal 
            title="Tizim Ma'lumoti" onClose={() => setViewRow(null)} 
            onDownloadDocx={handleDownloadDocx} isDownloading={downloadingDocx}
            onDownloadPdf={handleDownloadPdf} isPdfDownloading={downloadingPdf}
            pdfLang={pdfLang} setPdfLang={setPdfLang}
        >
          <TableContainer><Table size="small">
             <TableBody>
                 <TableRow><TableCell>ID</TableCell><TableCell><strong>{viewRow.idCode}</strong></TableCell></TableRow>
                 <TableRow><TableCell>Ism Familiya</TableCell><TableCell>{viewRow.lastName} {viewRow.firstName}</TableCell></TableRow>
                 <TableRow><TableCell>Sana</TableCell><TableCell>{new Date(viewRow.createdAt).toLocaleString("uz-UZ")}</TableCell></TableRow>
                 <TableRow><TableCell>Hudud</TableCell><TableCell>{viewRow.region}, {viewRow.district}</TableCell></TableRow>
                 <TableRow><TableCell>Vazn / Bo'y</TableCell><TableCell>{viewRow.weight} kg / {viewRow.height} sm</TableCell></TableRow>
                 <TableRow><TableCell>IBT (BMI)</TableCell><TableCell><strong>{viewRow.bmi}</strong> ({viewRow.bmiStatus})</TableCell></TableRow>
             </TableBody>
          </Table></TableContainer>
        </CustomModal>
      )}
    </Box>
  );
}

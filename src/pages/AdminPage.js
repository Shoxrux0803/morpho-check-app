// src/pages/AdminPage.js
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { AdminApi } from "../services/AdminApi";
import { generateDocx, generatePdf } from "../services/api";

// Material UI importlari
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Box,
  Chip,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  useTheme,
  useMediaQuery,
  CircularProgress, // CircularProgress qo'shildi
} from "@mui/material";
import {
  People,
  PersonAdd,
  TrendingUp,
  TrendingDown,
  Delete,
  Visibility,
  Download,
  FilterList,
  Search,
  Close,
  LocationOn,
  Analytics,
  List,
  Dashboard as DashboardIcon,
  Cake,
  MonitorWeight,
} from "@mui/icons-material";

// Uzbekistan map removed

// Yangi modular komponentlar
import StatsCards from "../components/Dashboard/StatsCards";
import RecentActivity from "../components/Dashboard/RecentActivity";
import RegionStats from "../components/Dashboard/RegionStats";
import BMIDistribution from "../components/Dashboard/BMIDistribution";
import UserGrowthChart from "../components/Dashboard/UserGrowthChart";
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
    id: r.id,
    idCode: r.id_code || r.idCode,
    createdAt: r.created_at || r.createdAt || null,
    firstName: r.first_name || r.firstName || firstGuess,
    lastName: r.last_name || r.lastName || lastGuess,
    gender: r.gender,
    age: r.age,
    ageMonths: r.age_months,
    ageDays: r.age_days,
    height: r.height,
    weight: r.weight,
    chest: r.chest,
    waist: r.waist,
    hip: r.hip,
    head: r.head,
    region: r.region,
    district: r.district,
    address: r.address,
    examinationDate: r.examination_date,
    birthDate: r.birth_date,
    preschoolInstitution: r.preschool_institution,
    shoulderLength: r.shoulder_length,
    shoulderBreadth: r.shoulder_breadth,
    shoulderCircumference: r.shoulder_circumference,
    armElbowLength: r.arm_elbow_length,
    handLength: r.hand_length,
    thighLength: r.thigh_length,
    thighCircumference: r.thigh_circumference,
    calfLength: r.calf_length,
    calfCircumference: r.calf_circumference,
    footLength: r.foot_length,
    zScore: r.z_score,
    somatotype: r.somatotype,
    recommendations: r.recommendations,
    bmi: bmiVal,
    bmiStatus: r.bmi_status || bmiStatus(bmiVal, r.age),
  };
};

/** ===== CSV eksport ===== */
function exportToCsv(filename, rows) {
  if (!rows?.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) =>
    typeof v === "string" && (v.includes(",") || v.includes('"') || v.includes("\n"))
      ? `"${v.replace(/"/g, '""')}"`
      : (v ?? "");
  const csv =
    headers.join(",") +
    "\n" +
    rows.map((r) => headers.map((h) => escape(r[h])).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function CustomModal({ children, onClose, title, onDownloadDocx, isDownloading, onDownloadPdf, isPdfDownloading }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog open={true} onClose={onClose} fullScreen={fullScreen} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{title}</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
        <Box display="flex" gap={1}>
          <Button 
            variant="contained" 
            color="secondary" 
            startIcon={isDownloading ? <CircularProgress size={20} color="inherit" /> : <Download />} 
            onClick={onDownloadDocx}
            disabled={isDownloading || isPdfDownloading}
          >
            {isDownloading ? "Yuklanmoqda..." : "Word (DOCX)"}
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={isPdfDownloading ? <CircularProgress size={20} color="inherit" /> : <Download />} 
            onClick={onDownloadPdf}
            disabled={isDownloading || isPdfDownloading}
          >
            {isPdfDownloading ? "Yuklanmoqda..." : "PDF (User report)"}
          </Button>
        </Box>
        <Button variant="outlined" onClick={onClose}>Yopish</Button>
      </DialogActions>
    </Dialog>
  );
}

// ===== ASOSIY ADMIN PAGE =====
export default function AdminPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [activeTab, setActiveTab] = useState(0);
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Payload tayyorlash funksiyasi (DOCX va PDF uchun umumiy)
  const preparePayload = async (row) => {
    const res = await AdminApi.analyses.get(row.id);
    let fullData = normalize(res);
    
    return {
      id_code: fullData.idCode,
      firstName: fullData.firstName,
      lastName: fullData.lastName,
      region: fullData.region || "",
      district: fullData.district || "",
      address: fullData.address || "",
      age: Number(fullData.age),
      ageMonths: Number(fullData.ageMonths) || 0,
      ageDays: Number(fullData.ageDays) || 0,
      gender: fullData.gender,
      height: Number(fullData.height),
      weight: Number(fullData.weight),
      chest: Number(fullData.chest) || 0,
      head: Number(fullData.head) || 0,
      waist: Number(fullData.waist) || 0,
      examinationDate: fullData.examinationDate || fullData.createdAt?.split("T")[0] || new Date().toISOString().split("T")[0],
      birthDate: fullData.birthDate || "",
      preschoolInstitution: fullData.preschoolInstitution || "",
      shoulderLength: Number(fullData.shoulderLength) || 0,
      shoulderBreadth: Number(fullData.shoulderBreadth) || 0,
      shoulderCircumference: Number(fullData.shoulderCircumference) || 0,
      armElbowLength: Number(fullData.armElbowLength) || 0,
      handLength: Number(fullData.handLength) || 0,
      thighLength: Number(fullData.thighLength) || 0,
      thighCircumference: Number(fullData.thighCircumference) || 0,
      calfLength: Number(fullData.calfLength) || 0,
      calfCircumference: Number(fullData.calfCircumference) || 0,
      footLength: Number(fullData.footLength) || 0,
      totalBodyWater: fullData.totalBodyWater !== "" && fullData.totalBodyWater != null ? Number(fullData.totalBodyWater) : null,
      fatPercent: fullData.fatPercent !== "" && fullData.fatPercent != null ? Number(fullData.fatPercent) : null,
      fatMass: fullData.fatMass !== "" && fullData.fatMass != null ? Number(fullData.fatMass) : null,
      muscleMass: fullData.muscleMass !== "" && fullData.muscleMass != null ? Number(fullData.muscleMass) : null,
      boneMass: fullData.boneMass !== "" && fullData.boneMass != null ? Number(fullData.boneMass) : null,
      acm: fullData.acm !== "" && fullData.acm != null ? Number(fullData.acm) : null,
      visceralFat: fullData.visceralFat !== "" && fullData.visceralFat != null ? Number(fullData.visceralFat) : null,
      analysis: {
        z_score: fullData.zScore,
        somatotype: fullData.somatotype,
        bmi: fullData.bmi,
        bmi_category: fullData.bmiStatus,
      },
    };
  };

  const handleDownloadDocx = async (row) => {
    setDownloadingDocx(true);
    try {
      const payload = await preparePayload(row);
      const blob = await generateDocx(payload);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `morphocheck_admin_${payload.firstName}_${payload.lastName}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("DOCX yaratishda xatolik: " + (e?.message || "Noma'lum xato"));
    } finally {
      setDownloadingDocx(false);
    }
  };

  const handleDownloadPdf = async (row) => {
    setDownloadingPdf(true);
    try {
      const payload = await preparePayload(row);
      const blob = await generatePdf(payload);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `morphocheck_report_${payload.firstName}_${payload.lastName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("PDF yaratishda xatolik: " + (e?.message || "Noma'lum xato"));
    } finally {
      setDownloadingPdf(false);
    }
  };

  // DashBoard chizish uchun hamma ma'lumotlar
  const [dashData, setDashData] = useState([]);
  const [dashLoading, setDashLoading] = useState(true);

  useEffect(() => {
    const fetchDashData = async () => {
      setDashLoading(true);
      try {
        const res = await AdminApi.analyses.list({ page: 1, pageSize: 1000 });
        setDashData(res.items || []);
      } catch (e) {
        console.error("Dashboard chizish uchun ma'lumot yuklashda xatolik:", e);
      } finally {
        setDashLoading(false);
      }
    };
    fetchDashData();
  }, []);

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
  const [filtersOpen, setFiltersOpen] = useState(false);


  // Yuklash - BACKEND PAGINATION (useCallback bilan)
  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const response = await AdminApi.analyses.list({
        q,
        gender,
        ageMin,
        ageMax,
        dateFrom,
        dateTo,
        region,
        sortKey: sort.key === "createdAt" ? "created_at" : sort.key,
        sortDir: sort.dir,
        page: page + 1, // Material UI page 0-based, backend 1-based
        pageSize: rowsPerPage,
      });

      const items = response.items || [];
      const total = response.total || items.length;

      setRaw(items.map(normalize));
      setTotalCount(total);
    } catch (e) {
      setErr(e?.message || "Ma'lumotlarni yuklashda xatolik.");
    } finally {
      setLoading(false);
    }
  }, [q, gender, ageMin, ageMax, dateFrom, dateTo, region, sort, page, rowsPerPage]);


  // Filtr yoki sahifa o'zgarganda yangilash
  useEffect(() => {
    load();
  }, [load]);


  // Statistikalar
  const stats = useMemo(() => {
    const totalUsers = totalCount; // Backenddan kelgan umumiy son
    const today = new Date().toDateString();
    const todayUsers = raw.filter((user) => {
      if (!user.createdAt) return false;
      return new Date(user.createdAt).toDateString() === today;
    }).length;

    // Faol foydalanuvchilar - oxirgi 7 kun ichida faol bo'lganlar
    const activeUsers = raw.filter((user) => {
      if (!user.createdAt) return false;
      const userDate = new Date(user.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return userDate >= weekAgo;
    }).length;

    const avgAge =
      raw.length > 0
        ? Math.round(
            (raw.reduce((sum, user) => sum + (Number(user.age) || 0), 0) / raw.length) * 10,
          ) / 10
        : 0;

    return {
      totalUsers,
      todayUsers,
      activeUsers,
      avgAge,
    };
  }, [raw, totalCount]);

  // Format funksiyalari
  const formatDate = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? "-" : d.toLocaleDateString("uz-UZ");
  };

  const formatDateTime = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? "-" : d.toLocaleString("uz-UZ");
  };

  // Tanlash funksiyalari - FAQAT JORIY SAHIFADAGI ELEMENTLAR
  const currentPageRows = raw; // Backenddan kelgan joriy sahifa ma'lumotlari

  const allChecked = currentPageRows.length > 0 && currentPageRows.every((r) => checked.has(r.id));
  const toggleAll = () => {
    const next = new Set(checked);
    if (allChecked) {
      currentPageRows.forEach((r) => next.delete(r.id));
    } else {
      currentPageRows.forEach((r) => next.add(r.id));
    }
    setChecked(next);
  };

  const toggleOne = (id) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChecked(next);
  };

  // O'chirish
  const onDeleteSelected = async () => {
    if (!checked.size) return;
    if (!window.confirm(`${checked.size} ta yozuvni o'chirasizmi?`)) return;
    const ids = Array.from(checked);
    try {
      if (AdminApi.analyses.removeMany) {
        await AdminApi.analyses.removeMany(ids);
      } else {
        await Promise.all(ids.map((id) => AdminApi.analyses.remove(id)));
      }
      setChecked(new Set());
      await load();
    } catch (e) {
      alert(e?.message || "O'chirishda xatolik yuz berdi.");
    }
  };

  // XLSX eksport
  const onExportXlsx = async () => {
    try {
      const blob = await AdminApi.analyses.exportXlsx({
        q,
        gender,
        ageMin,
        ageMax,
        dateFrom,
        dateTo,
        region,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `morphocheck_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Eksport qilishda xatolik: " + (e?.message || "Noma'lum xatolik"));
    }
  };


  // Tab kontentlari
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Dashboard
        return (
          <Box>
            <Grid container spacing={3}>
              {/* Row 1: Asosiy ko'rsatkichlar (KPI) */}
              <Grid item xs={12}>
                <StatsCards
                  totalUsers={stats.totalUsers}
                  todayUsers={stats.todayUsers}
                  activeUsers={stats.activeUsers}
                  avgAge={stats.avgAge}
                />
              </Grid>

              {/* Row 2: Oxirgi faollik tarixi (uzunasiga) */}
              <Grid item xs={12}>
                <RecentActivity data={dashData} loading={dashLoading} />
              </Grid>

              {/* Row 3: Foydalanuvchilar o'sishi va BMI taqsimoti */}
              <Grid item xs={12} md={8}>
                <UserGrowthChart data={dashData} loading={dashLoading} />
              </Grid>
              <Grid item xs={12} md={4}>
                <BMIDistribution data={dashData} loading={dashLoading} />
              </Grid>

              {/* Row 4: Viloyatlar kesimida statistika */}
              {/* RegionStats ichida Grid item'lar bor, shuning uchun o'rash shart emas */}
              <RegionStats data={dashData} loading={dashLoading} />
            </Grid>
          </Box>
        );

      case 1: // Foydalanuvchilar ro'yxati
        return (
          <Box>
            {/* Sarlavha va tugmalar */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
              flexDirection={isMobile ? "column" : "row"}
              gap={2}
            >
              <Typography variant="h5" fontWeight="bold">
                Foydalanuvchilar ro'yxati
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={onExportXlsx}
                  disabled={totalCount === 0}
                >
                  XLSX eksport
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={onDeleteSelected}
                  disabled={checked.size === 0}
                >
                  O'chirish ({checked.size})
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => setFiltersOpen(!filtersOpen)}
                >
                  Filtrlar
                </Button>
              </Box>
            </Box>

            {/* Filtrlar paneli */}
            {filtersOpen && (
              <AdminFilters
                q={q}
                setQ={setQ}
                gender={gender}
                setGender={setGender}
                ageMin={ageMin}
                setAgeMin={setAgeMin}
                ageMax={ageMax}
                setAgeMax={setAgeMax}
                dateFrom={dateFrom}
                setDateFrom={setDateFrom}
                dateTo={dateTo}
                setDateTo={setDateTo}
                region={region}
                setRegion={setRegion}
              />
            )}

            {/* Jadval */}
            <Card>
              {loading && <LinearProgress />}
              <CardContent sx={{ p: 0 }}>
                {err ? (
                  <Alert severity="error" sx={{ m: 2 }}>
                    {err}
                  </Alert>
                ) : (
                  <>
                    <AdminTable
                      rows={currentPageRows}
                      checked={checked}
                      toggleAll={toggleAll}
                      allChecked={allChecked}
                      toggleOne={toggleOne}
                      setViewRow={setViewRow}
                      formatDate={formatDate}
                    />

                    {/* PAGINATION - BACKEND PAGINATION */}
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      component="div"
                      count={totalCount} // Backenddan kelgan umumiy son
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={(event, newPage) => setPage(newPage)}
                      onRowsPerPageChange={(event) => {
                        const newRowsPerPage = parseInt(event.target.value, 10);
                        setRowsPerPage(newRowsPerPage);
                        setPage(0); // Sahifani boshiga qaytarish
                      }}
                      labelRowsPerPage="Sahifadagi qatorlar:"
                      labelDisplayedRows={({ from, to, count }) =>
                        `${from}-${to} ning ${count !== -1 ? count : ` ${to} dan ko'p`}`
                      }
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            MorphoCheck Pro Admin Panel
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl">
        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons="auto"
          >
            <Tab icon={<DashboardIcon />} iconPosition="start" label="Dashboard" />
            <Tab icon={<List />} iconPosition="start" label="Foydalanuvchilar ro'yxati" />
          </Tabs>
        </Paper>

        {renderTabContent()}

        {/* Modal (batafsil) */}
        {viewRow && (
          <CustomModal 
            title="Batafsil ma'lumot" 
            onClose={() => setViewRow(null)}
            onDownloadDocx={() => handleDownloadDocx(viewRow)}
            isDownloading={downloadingDocx}
            onDownloadPdf={() => handleDownloadPdf(viewRow)}
            isPdfDownloading={downloadingPdf}
          >
            <TableContainer component={Paper} elevation={0} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: "grey.100" }}>
                  <TableRow>
                    <TableCell><strong>Ko'rsatkich</strong></TableCell>
                    <TableCell><strong>Qiymat</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow><TableCell>F.I.SH</TableCell><TableCell>{viewRow.lastName} {viewRow.firstName}</TableCell></TableRow>
                  <TableRow><TableCell>Sana</TableCell><TableCell>{formatDateTime(viewRow.createdAt)}</TableCell></TableRow>
                  <TableRow><TableCell>Manzil</TableCell><TableCell>{[viewRow.region, viewRow.district, viewRow.address].filter(Boolean).join(", ") || "-"}</TableCell></TableRow>
                  <TableRow><TableCell>Jins va Yosh</TableCell><TableCell>{viewRow.gender}, {viewRow.age} yosh ({viewRow.ageMonths} oy)</TableCell></TableRow>
                  <TableRow><TableCell>Bo'y va Vazn</TableCell><TableCell>{viewRow.height} sm, {viewRow.weight} kg</TableCell></TableRow>
                  <TableRow><TableCell>BMI</TableCell><TableCell>{viewRow.bmi ?? "-"} ({viewRow.bmiStatus})</TableCell></TableRow>
                  <TableRow><TableCell>Aylanalar (sm)</TableCell><TableCell>Ko'krak: {viewRow.chest || "-"}, Bel: {viewRow.waist || "-"}, Bosh: {viewRow.head || "-"}, Bo'ksa: {viewRow.hip || "-"}</TableCell></TableRow>
                  <TableRow><TableCell>Z-Score</TableCell><TableCell>{viewRow.zScore ?? "-"}</TableCell></TableRow>
                  <TableRow><TableCell>Somatotip</TableCell><TableCell>{viewRow.somatotype ?? "-"}</TableCell></TableRow>
                  <TableRow><TableCell colSpan={2} sx={{ bgcolor: "grey.50" }}><strong>Qo'shimcha o'lchovlar (sm)</strong></TableCell></TableRow>
                  <TableRow><TableCell>Yelka uzunligi / kengligi / aylanasi</TableCell><TableCell>{viewRow.shoulderLength || "-"} / {viewRow.shoulderBreadth || "-"} / {viewRow.shoulderCircumference || "-"}</TableCell></TableRow>
                  <TableRow><TableCell>Qo'l-tirsak / Kaft uzunligi</TableCell><TableCell>{viewRow.armElbowLength || "-"} / {viewRow.handLength || "-"}</TableCell></TableRow>
                  <TableRow><TableCell>Son uzunligi / aylanasi</TableCell><TableCell>{viewRow.thighLength || "-"} / {viewRow.thighCircumference || "-"}</TableCell></TableRow>
                  <TableRow><TableCell>Boldir uzunligi / aylanasi</TableCell><TableCell>{viewRow.calfLength || "-"} / {viewRow.calfCircumference || "-"}</TableCell></TableRow>
                  <TableRow><TableCell>Oyoq kafti uzunligi</TableCell><TableCell>{viewRow.footLength || "-"}</TableCell></TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CustomModal>
        )}
      </Container>
    </Box>
  );
}

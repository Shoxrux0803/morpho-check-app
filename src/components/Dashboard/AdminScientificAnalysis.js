// src/components/Dashboard/AdminScientificAnalysis.js
// Oddiy Admin uchun ilmiy tahlil — faqat o'z kiritgan ma'lumotlari
import React, { useMemo } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  CircularProgress,
} from "@mui/material";
import {
  BiotechOutlined,
  ScienceOutlined,
  AutoGraphOutlined,
  EqualizerOutlined,
} from "@mui/icons-material";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Cell,
  ReferenceLine,
} from "recharts";
import { useLanguage } from "../../contexts/LanguageContext";

const COLORS = {
  primary: "#0f766e",
  secondary: "#2563eb",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  teal: "#14b8a6",
};

const ADMIN_SCI_TEXT = {
  uz: {
    emptyTitle: "Ilmiy tahlil uchun ma'lumot yo'q",
    emptySub: "Bemorlarni ro'yxatdan o'tkazing",
    title: "Ilmiy-Antropometrik Tahlil",
    subtitle: "Murakkab statistik modellar va korrelyatsion tahlil natijalari",
    filtered: "Filtrlangan",
    bmiHistogram: "BMI Gistogrammasi",
    bmiHistogramSub: "Bemorlarning BMI qiymatlari bo'yicha statistik taqsimoti",
    patients: "Bemorlar",
    patientCount: "Bemorlar soni",
    zScoreAnalysis: "Z-score (SD) Analizi",
    zScoreAnalysisSub: "Populyatsiya normalidan chetlanish ko'rsatkichi",
    percentiles: "Statistik Persentillar",
    percentilesSub: "Guruh ichidagi o'lchovlar kvantillari",
    percentile: "Persentil",
    height: "Bo'y",
    weight: "Vazn",
    chest: "Ko'krak",
    age: "Yosh",
    cm: " sm",
    kg: " kg",
    yearUnit: " yil",
    p50Note: "* P50 ko'rsatkichi guruh uchun mediana hisoblanadi.",
    riskGroups: "Sog'liq Xavfi Guruhlari",
    riskGroupsSub: "BMI asosida klinik xavf darajasini baholash",
    normal: "Normal",
    overweight: "Ortiqcha vazn",
    obese: "Semizlik",
    underweight: "Ozg'inlik",
    lowRisk: "Past xavf",
    mediumRisk: "O'rta xavf",
    highRisk: "Yuqori xavf",
    observe: "Kuzatuv",
    patientsLower: "ta bemor",
    ageBmiTitle: "Yosh — BMI Korrelyatsiyasi",
    ageBmiSub: "Yosh o'tishi bilan tana vazni indeksi o'zgarishi",
    heightChestTitle: "Bo'y — Ko'krak qafasi",
    heightChestSub: "Antropometrik o'lchovlar o'rtasidagi bog'liqlik",
    measurements: "O'lchovlar",
    footerSuffix: "ta ma'lumot tahlili",
  },
  ru: {
    emptyTitle: "Нет данных для научного анализа",
    emptySub: "Зарегистрируйте пациентов",
    title: "Научно-антропометрический анализ",
    subtitle: "Результаты сложных статистических моделей и корреляционного анализа",
    filtered: "Отфильтровано",
    bmiHistogram: "Гистограмма BMI",
    bmiHistogramSub: "Статистическое распределение BMI пациентов",
    patients: "Пациенты",
    patientCount: "Количество пациентов",
    zScoreAnalysis: "Z-score (SD) анализ",
    zScoreAnalysisSub: "Показатель отклонения от нормы популяции",
    percentiles: "Статистические перцентили",
    percentilesSub: "Квантили измерений внутри группы",
    percentile: "Перцентиль",
    height: "Рост",
    weight: "Вес",
    chest: "Грудь",
    age: "Возраст",
    cm: " см",
    kg: " кг",
    yearUnit: " лет",
    p50Note: "* P50 является медианой для группы.",
    riskGroups: "Группы риска для здоровья",
    riskGroupsSub: "Оценка клинического риска на основе BMI",
    normal: "Норма",
    overweight: "Избыточный вес",
    obese: "Ожирение",
    underweight: "Недостаток веса",
    lowRisk: "Низкий риск",
    mediumRisk: "Средний риск",
    highRisk: "Высокий риск",
    observe: "Наблюдение",
    patientsLower: "пациентов",
    ageBmiTitle: "Корреляция возраст — BMI",
    ageBmiSub: "Изменение индекса массы тела с возрастом",
    heightChestTitle: "Рост — грудная клетка",
    heightChestSub: "Связь между антропометрическими измерениями",
    measurements: "Измерения",
    footerSuffix: "записей проанализировано",
  },
  en: {
    emptyTitle: "No data for scientific analysis",
    emptySub: "Register patients first",
    title: "Scientific Anthropometric Analysis",
    subtitle: "Results of advanced statistical models and correlation analysis",
    filtered: "Filtered",
    bmiHistogram: "BMI Histogram",
    bmiHistogramSub: "Statistical distribution of patient BMI values",
    patients: "Patients",
    patientCount: "Patient count",
    zScoreAnalysis: "Z-score (SD) Analysis",
    zScoreAnalysisSub: "Deviation from the population norm",
    percentiles: "Statistical Percentiles",
    percentilesSub: "Measurement quantiles within the group",
    percentile: "Percentile",
    height: "Height",
    weight: "Weight",
    chest: "Chest",
    age: "Age",
    cm: " cm",
    kg: " kg",
    yearUnit: " years",
    p50Note: "* P50 is the median for the group.",
    riskGroups: "Health Risk Groups",
    riskGroupsSub: "Clinical risk assessment based on BMI",
    normal: "Normal",
    overweight: "Overweight",
    obese: "Obesity",
    underweight: "Underweight",
    lowRisk: "Low risk",
    mediumRisk: "Medium risk",
    highRisk: "High risk",
    observe: "Monitoring",
    patientsLower: "patients",
    ageBmiTitle: "Age — BMI Correlation",
    ageBmiSub: "Changes in body mass index with age",
    heightChestTitle: "Height — Chest",
    heightChestSub: "Relationship between anthropometric measurements",
    measurements: "Measurements",
    footerSuffix: "records analyzed",
  },
  kz: {
    emptyTitle: "Ғылыми талдау үшін дерек жоқ",
    emptySub: "Пациенттерді тіркеңіз",
    title: "Ғылыми-антропометриялық талдау",
    subtitle: "Күрделі статистикалық модельдер және корреляциялық талдау нәтижелері",
    filtered: "Сүзілген",
    bmiHistogram: "BMI гистограммасы",
    bmiHistogramSub: "Пациенттердің BMI мәндері бойынша статистикалық таралу",
    patients: "Пациенттер",
    patientCount: "Пациенттер саны",
    zScoreAnalysis: "Z-score (SD) талдауы",
    zScoreAnalysisSub: "Популяция нормасынан ауытқу көрсеткіші",
    percentiles: "Статистикалық перцентильдер",
    percentilesSub: "Топ ішіндегі өлшемдер квантильдері",
    percentile: "Перцентиль",
    height: "Бой",
    weight: "Салмақ",
    chest: "Кеуде",
    age: "Жас",
    cm: " см",
    kg: " кг",
    yearUnit: " жас",
    p50Note: "* P50 көрсеткіші топ үшін медиана болып саналады.",
    riskGroups: "Денсаулық қаупі топтары",
    riskGroupsSub: "BMI негізінде клиникалық қауіп деңгейін бағалау",
    normal: "Қалыпты",
    overweight: "Артық салмақ",
    obese: "Семіздік",
    underweight: "Салмақ тапшылығы",
    lowRisk: "Төмен қауіп",
    mediumRisk: "Орташа қауіп",
    highRisk: "Жоғары қауіп",
    observe: "Бақылау",
    patientsLower: "пациент",
    ageBmiTitle: "Жас — BMI корреляциясы",
    ageBmiSub: "Жас ұлғайған сайын дене салмағы индексінің өзгеруі",
    heightChestTitle: "Бой — кеуде қуысы",
    heightChestSub: "Антропометриялық өлшемдер арасындағы байланыс",
    measurements: "Өлшемдер",
    footerSuffix: "дерек талданды",
  },
};

ADMIN_SCI_TEXT.ky = {
  ...ADMIN_SCI_TEXT.uz,
  emptyTitle: "Илимий талдоо үчүн маалымат жок",
  emptySub: "Бейтаптарды каттаңыз",
  title: "Илимий-антропометриялык талдоо",
  subtitle: "Татаал статистикалык моделдер жана корреляциялык талдоо жыйынтыктары",
  filtered: "Чыпкаланган",
  bmiHistogram: "BMI гистограммасы",
  bmiHistogramSub: "Бейтаптардын BMI маанилери боюнча статистикалык бөлүштүрүү",
  patients: "Бейтаптар",
  patientCount: "Бейтаптар саны",
  zScoreAnalysis: "Z-score (SD) талдоосу",
  percentiles: "Статистикалык перцентилдер",
  percentile: "Перцентиль",
  height: "Бой",
  weight: "Салмак",
  chest: "Көкүрөк",
  age: "Жаш",
  riskGroups: "Ден соолук коркунучу топтору",
  normal: "Норма",
  overweight: "Ашыкча салмак",
  obese: "Семирүү",
  underweight: "Салмак жетишсиздиги",
  lowRisk: "Төмөн коркунуч",
  mediumRisk: "Орточо коркунуч",
  highRisk: "Жогорку коркунуч",
  observe: "Көзөмөл",
  measurements: "Өлчөөлөр",
};
ADMIN_SCI_TEXT.tg = {
  ...ADMIN_SCI_TEXT.uz,
  emptyTitle: "Барои таҳлили илмӣ маълумот нест",
  emptySub: "Беморонро ба қайд гиред",
  title: "Таҳлили илмӣ-антропометрӣ",
  subtitle: "Натиҷаҳои моделҳои омории мураккаб ва таҳлили коррелятсионӣ",
  filtered: "Филтршуда",
  bmiHistogram: "Гистограммаи BMI",
  bmiHistogramSub: "Тақсимоти омории арзишҳои BMI-и беморон",
  patients: "Беморон",
  patientCount: "Шумораи беморон",
  zScoreAnalysis: "Таҳлили Z-score (SD)",
  zScoreAnalysisSub: "Нишондиҳандаи дуршавӣ аз меъёри популятсионӣ",
  percentiles: "Персентилҳои оморӣ",
  percentilesSub: "Квантилҳои ченакҳо дар дохили гурӯҳ",
  percentile: "Персентил",
  height: "Қад",
  weight: "Вазн",
  chest: "Қафаси сина",
  age: "Синну сол",
  cm: " см",
  kg: " кг",
  yearUnit: " сол",
  p50Note: "* P50 барои гурӯҳ медиана ҳисоб мешавад.",
  riskGroups: "Гурӯҳҳои хавфи саломатӣ",
  riskGroupsSub: "Баҳодиҳии хавфи клиникӣ дар асоси BMI",
  normal: "Меъёр",
  overweight: "Вазни зиёдатӣ",
  obese: "Фарбеҳӣ",
  underweight: "Камвазнӣ",
  lowRisk: "Хавфи паст",
  mediumRisk: "Хавфи миёна",
  highRisk: "Хавфи баланд",
  observe: "Назорат",
  patientsLower: "бемор",
  ageBmiTitle: "Коррелятсияи синну сол - BMI",
  ageBmiSub: "Тағйирёбии индекси вазни бадан бо синну сол",
  heightChestTitle: "Қад - қафаси сина",
  heightChestSub: "Алоқа байни ченакҳои антропометрӣ",
  measurements: "Ченакҳо",
  footerSuffix: "сабт таҳлил шуд",
};
const localeByLang = { uz: "uz-UZ", tg: "tg-TJ", ru: "ru-RU", en: "en-US", kz: "kk-KZ", ky: "ky-KG" };

const GlassCard = ({ children, sx = {} }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: "100%",
        borderRadius: 2,
        background: isDark ? "rgba(15,23,42,0.78)" : "rgba(255,255,255,0.96)",
        backdropFilter: "blur(14px)",
        border: "1px solid",
        borderColor: isDark ? "rgba(148,163,184,0.18)" : "rgba(15,118,110,0.14)",
        boxShadow: isDark ? "0 18px 45px rgba(0,0,0,0.26)" : "0 16px 44px rgba(15,23,42,0.07)",
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
};

const SectionTitle = ({ icon, title, subtitle, badge }) => (
  <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2.5}>
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
        {icon}
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{
            color: "text.primary",
            letterSpacing: 0,
          }}
        >
          {title}
        </Typography>
      </Box>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
    {badge && (
      <Chip
        label={badge}
        size="small"
        sx={{ bgcolor: `${COLORS.primary}22`, color: COLORS.primary, fontWeight: 700 }}
      />
    )}
  </Box>
);

const getTooltipStyle = (isDark) => ({
  contentStyle: {
    borderRadius: "12px",
    border: "none",
    boxShadow: isDark
      ? "0 10px 15px -3px rgba(0, 0, 0, 0.4)"
      : "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    background: isDark ? "#1e293b" : "#ffffff",
    color: isDark ? "#f8fafc" : "#1e293b",
    fontSize: "13px",
    padding: "10px 14px",
    borderLeft: isDark ? "4px solid #14b8a6" : "4px solid #0f766e",
  },
  itemStyle: {
    color: isDark ? "#f1f5f9" : "#334155",
    padding: "2px 0",
  },
  labelStyle: {
    color: isDark ? "#5eead4" : "#0f766e",
    fontWeight: 800,
    marginBottom: "4px",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  cursor: { stroke: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)", strokeWidth: 2 },
});

export default function AdminScientificAnalysis({ data = [], loading, totalCount = 0, filters }) {
  const theme = useTheme();
  const { lang } = useLanguage();
  const s = ADMIN_SCI_TEXT[lang] || ADMIN_SCI_TEXT.uz;
  const isDark = theme.palette.mode === "dark";
  const customTooltip = useMemo(() => getTooltipStyle(isDark), [isDark]);

  // ---- BMI Histogram ----
  const bmiHistogram = useMemo(() => {
    const ranges = [
      { label: "<16", min: 0, max: 16 },
      { label: "16-18.5", min: 16, max: 18.5 },
      { label: "18.5-22", min: 18.5, max: 22 },
      { label: "22-25", min: 22, max: 25 },
      { label: "25-30", min: 25, max: 30 },
      { label: "30-35", min: 30, max: 35 },
      { label: ">35", min: 35, max: 999 },
    ];
    return ranges.map((r) => ({
      range: r.label,
      count: data.filter((d) => {
        const bmi = parseFloat(d.bmi);
        return !isNaN(bmi) && bmi >= r.min && bmi < r.max;
      }).length,
    }));
  }, [data]);

  // ---- Age vs BMI scatter ----
  const scatterData = useMemo(
    () =>
      data
        .filter((d) => d.age && d.bmi && !isNaN(Number(d.age)) && !isNaN(Number(d.bmi)))
        .slice(0, 200)
        .map((d) => ({ age: Number(d.age), bmi: parseFloat(d.bmi) })),
    [data],
  );

  // ---- Xavf guruhlari ----
  const riskGroups = useMemo(() => {
    const bmiVals = data.map((d) => parseFloat(d.bmi)).filter((v) => !isNaN(v));
    const n = bmiVals.length || 1;
    const normal = bmiVals.filter((v) => v >= 18.5 && v < 25).length;
    const overweight = bmiVals.filter((v) => v >= 25 && v < 30).length;
    const obese = bmiVals.filter((v) => v >= 30).length;
    const underweight = bmiVals.filter((v) => v < 18.5).length;
    return [
      {
        name: s.normal,
        count: normal,
        pct: Math.round((normal / n) * 100),
        color: COLORS.success,
        desc: s.lowRisk,
      },
      {
        name: s.overweight,
        count: overweight,
        pct: Math.round((overweight / n) * 100),
        color: COLORS.warning,
        desc: s.mediumRisk,
      },
      {
        name: s.obese,
        count: obese,
        pct: Math.round((obese / n) * 100),
        color: COLORS.error,
        desc: s.highRisk,
      },
      {
        name: s.underweight,
        count: underweight,
        pct: Math.round((underweight / n) * 100),
        color: COLORS.info,
        desc: s.observe,
      },
    ];
  }, [data, s]);

  // ---- Persentil table ----
  const percentileTable = useMemo(() => {
    const bmiVals = data
      .map((d) => parseFloat(d.bmi))
      .filter((v) => !isNaN(v))
      .sort((a, b) => a - b);
    const heightVals = data
      .map((d) => parseFloat(d.height))
      .filter((v) => !isNaN(v))
      .sort((a, b) => a - b);
    const weightVals = data
      .map((d) => parseFloat(d.weight))
      .filter((v) => !isNaN(v))
      .sort((a, b) => a - b);

    const perc = (arr, p) => {
      if (!arr.length) return "—";
      const idx = Math.floor((arr.length * p) / 100);
      return arr[Math.min(idx, arr.length - 1)]?.toFixed(1);
    };

    return [10, 25, 50, 75, 90].map((p) => ({
      p: `P${p}`,
      bmi: perc(bmiVals, p),
      height: perc(heightVals, p),
      weight: perc(weightVals, p),
    }));
  }, [data]);

  // ---- BMI Z-score taqsimoti ----
  const zScoreData = useMemo(() => {
    const bmiVals = data.map((d) => parseFloat(d.bmi)).filter((v) => !isNaN(v));
    if (!bmiVals.length) return [];
    const mean = bmiVals.reduce((s, v) => s + v, 0) / bmiVals.length;
    const std = Math.sqrt(bmiVals.reduce((s, v) => s + (v - mean) ** 2, 0) / bmiVals.length) || 1;
    const buckets = {
      "< -2σ": 0,
      "-2 — -1σ": 0,
      "-1 — 0": 0,
      "0 — +1σ": 0,
      "+1 — +2σ": 0,
      "> +2σ": 0,
    };
    bmiVals.forEach((v) => {
      const z = (v - mean) / std;
      if (z < -2) buckets["< -2σ"]++;
      else if (z < -1) buckets["-2 — -1σ"]++;
      else if (z < 0) buckets["-1 — 0"]++;
      else if (z < 1) buckets["0 — +1σ"]++;
      else if (z < 2) buckets["+1 — +2σ"]++;
      else buckets["> +2σ"]++;
    });
    const getBucketColor = (key) =>
      key.includes("-2") || key.includes("> +2")
        ? COLORS.error
        : key.includes("-1") || key.includes("+1")
          ? COLORS.warning
          : COLORS.success;
    return Object.entries(buckets).map(([category, count]) => ({
      category,
      count,
      fill: getBucketColor(category),
    }));
  }, [data]);

  // ---- Correlation: Height vs Chest ----
  const heightChestData = useMemo(
    () =>
      data
        .filter((d) => d.height && d.chest && !isNaN(Number(d.height)) && !isNaN(Number(d.chest)))
        .map((d) => ({ height: Number(d.height), chest: Number(d.chest) })),
    [data],
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress size={48} sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  if (!data.length) {
    return (
      <Box p={4} textAlign="center">
        <BiotechOutlined sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          {s.emptyTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          {s.emptySub}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        mb={4}
        p={3}
        sx={{
          borderRadius: 2,
          background: isDark
            ? "linear-gradient(135deg, rgba(15,118,110,0.22), rgba(37,99,235,0.12))"
            : "linear-gradient(135deg, rgba(15,118,110,0.10), rgba(37,99,235,0.06))",
          border: `1px solid ${COLORS.primary}22`,
        }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <BiotechOutlined sx={{ fontSize: 40, color: COLORS.primary }} />
          <Box>
            <Typography
              variant="h4"
              fontWeight={900}
              sx={{ color: "text.primary", lineHeight: 1.2 }}
            >
              {s.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {s.subtitle}
            </Typography>
          </Box>
          <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
            {filters &&
              Object.values(filters).some(
                (v) => v !== "" && v !== 0 && v !== 100 && v !== 10 && v !== 50,
              ) && <Chip label={s.filtered} color="info" size="small" sx={{ fontWeight: 800 }} />}
            <Chip
              label="PRO ANALYTICS"
              size="small"
              sx={{ bgcolor: COLORS.primary, color: "white", fontWeight: 900, px: 1 }}
            />
          </Box>
        </Box>
      </Box>

      {/* ===== ROW 1: BMI Histogram + Z-score ===== */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <GlassCard>
            <SectionTitle
              icon={<EqualizerOutlined sx={{ color: COLORS.primary }} />}
              title={s.bmiHistogram}
              subtitle={s.bmiHistogramSub}
              badge={`n=${data.length}`}
            />
            <Box sx={{ height: 270 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bmiHistogram} barCategoryGap="20%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="range"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    allowDecimals={false}
                  />
                  <ReferenceLine x="18.5-22" stroke={COLORS.success} strokeDasharray="4 4" />
                  <ReTooltip {...customTooltip} />
                  <Bar dataKey="count" name={s.patients} radius={[6, 6, 0, 0]}>
                    {bmiHistogram.map((entry, i) => {
                      const isNormal = entry.range === "18.5-22" || entry.range === "22-25";
                      const isRisk = entry.range === ">35" || entry.range === "<16";
                      return (
                        <Cell
                          key={i}
                          fill={isNormal ? COLORS.success : isRisk ? COLORS.error : COLORS.primary}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <GlassCard>
            <SectionTitle
              icon={<ScienceOutlined sx={{ color: COLORS.secondary }} />}
              title={s.zScoreAnalysis}
              subtitle={s.zScoreAnalysisSub}
            />
            <Box sx={{ height: 270 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zScoreData} barCategoryGap="20%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    allowDecimals={false}
                  />
                  <ReTooltip {...customTooltip} />
                  <Bar dataKey="count" name={s.patientCount} radius={[6, 6, 0, 0]}>
                    {zScoreData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>
      </Grid>

      {/* ===== ROW 2: Persentil + Xavf guruhlari ===== */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <GlassCard sx={{ height: "100%" }}>
            <SectionTitle
              icon={<AutoGraphOutlined sx={{ color: COLORS.teal }} />}
              title={s.percentiles}
              subtitle={s.percentilesSub}
            />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {[s.percentile, "BMI", s.height, s.weight].map((h) => (
                      <TableCell
                        key={h}
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.75rem",
                          color: COLORS.primary,
                          borderBottom: `2px solid ${COLORS.primary}22`,
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {percentileTable.map((row) => (
                    <TableRow key={row.p} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell>
                        <Chip
                          label={row.p}
                          size="small"
                          sx={{
                            bgcolor: `${COLORS.primary}15`,
                            color: COLORS.primary,
                            fontWeight: 800,
                            fontSize: "0.7rem",
                            height: 20,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "text.primary" }}>
                        {row.bmi}
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>
                        {row.height}
                        {s.cm}
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>
                        {row.weight}
                        {s.kg}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box
              mt={2}
              p={1.5}
              sx={{
                borderRadius: 2,
                bgcolor: "action.hover",
                border: "1px dashed",
                borderColor: "divider",
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                {s.p50Note}
              </Typography>
            </Box>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <GlassCard sx={{ height: "100%" }}>
            <SectionTitle
              icon={<ScienceOutlined sx={{ color: COLORS.error }} />}
              title={s.riskGroups}
              subtitle={s.riskGroupsSub}
            />
            <Stack spacing={3} mt={1}>
              {riskGroups.map((g) => (
                <Box key={g.name}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box>
                      <Typography variant="body2" fontWeight={800}>
                        {g.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {g.count} {s.patientsLower}
                      </Typography>
                    </Box>
                    <Box textAlign="right">
                      <Chip
                        label={g.desc}
                        size="small"
                        sx={{
                          fontSize: "0.65rem",
                          bgcolor: `${g.color}18`,
                          color: g.color,
                          fontWeight: 700,
                          mb: 0.5,
                        }}
                      />
                      <Typography
                        variant="h6"
                        fontWeight={900}
                        sx={{ color: g.color, lineHeight: 1 }}
                      >
                        {g.pct}%
                      </Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={g.pct}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      bgcolor: `${g.color}12`,
                      "& .MuiLinearProgress-bar": { bgcolor: g.color, borderRadius: 6 },
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </GlassCard>
        </Grid>
      </Grid>

      {/* ===== ROW 3: Correlations ===== */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <GlassCard>
            <SectionTitle
              icon={<AutoGraphOutlined sx={{ color: COLORS.warning }} />}
              title={s.ageBmiTitle}
              subtitle={s.ageBmiSub}
              badge="CORRELATION"
            />
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    type="number"
                    dataKey="age"
                    name={s.age}
                    unit={s.yearUnit}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    domain={["auto", "auto"]}
                  />
                  <YAxis
                    type="number"
                    dataKey="bmi"
                    name="BMI"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    domain={["auto", "auto"]}
                  />
                  <ReferenceLine y={18.5} stroke={COLORS.success} strokeDasharray="4 4" />
                  <ReferenceLine y={25} stroke={COLORS.warning} strokeDasharray="4 4" />
                  <ReTooltip {...customTooltip} cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter
                    name={s.patients}
                    data={scatterData}
                    fill={COLORS.primary}
                    opacity={0.6}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <GlassCard>
            <SectionTitle
              icon={<BiotechOutlined sx={{ color: COLORS.info }} />}
              title={s.heightChestTitle}
              subtitle={s.heightChestSub}
              badge="MORPHOLOGY"
            />
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    type="number"
                    dataKey="height"
                    name={s.height}
                    unit={s.cm}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    domain={["auto", "auto"]}
                  />
                  <YAxis
                    type="number"
                    dataKey="chest"
                    name={s.chest}
                    unit={s.cm}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    domain={["auto", "auto"]}
                  />
                  <ReTooltip {...customTooltip} cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter
                    name={s.measurements}
                    data={heightChestData}
                    fill={COLORS.teal}
                    opacity={0.6}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </Box>
          </GlassCard>
        </Grid>
      </Grid>

      {/* Footer */}
      <Box py={3} textAlign="center" mt={2} sx={{ borderTop: "1px solid", borderColor: "divider" }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ letterSpacing: 1, fontWeight: 600 }}
        >
          MORPHOCHECK SCIENTIFIC ENGINE v2.0 • {totalCount} {s.footerSuffix} •{" "}
          {new Date().toLocaleDateString(localeByLang[lang] || "uz-UZ")}
        </Typography>
      </Box>
    </Box>
  );
}

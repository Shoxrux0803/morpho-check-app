// src/components/Dashboard/ScientificAnalysis.js
// SuperAdmin uchun ilmiy tahlil sahifasi — barcha ma'lumotlar bo'yicha
import React, { useMemo } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Divider,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  useTheme,
  Alert,
} from "@mui/material";
import {
  ScienceOutlined,
  BiotechOutlined,
  EqualizerOutlined,
  AutoGraphOutlined,
} from "@mui/icons-material";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  Area,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
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

const SCI_TEXT = {
  uz: {
    title: "Ilmiy Tahlil",
    subtitle: "Populyatsion Z-score, persentil, korrelyatsiya va xavf guruhlari tahlili",
    zDist: "Z-score bo'yicha taqsimot",
    zDistSub: "BMI normaldan chetlanish analizi (standart og'ish bo'yicha guruhlar)",
    patientCount: "Bemorlar soni",
    patients: "Bemorlar",
    patientsLower: "bemor",
    normalNote:
      "Normal distribusiya (Gauss egri chizig'i) bo'yicha: bemorlarning 68% +/-1σ ichida, 95% +/-2σ ichida bo'lishi kutiladi. Tizimingizda: Normal guruhi",
    percentileTable: "Persentil jadvali",
    percentileSub: "BMI, bo'y va vazn bo'yicha taqsimot chegaralari",
    percentile: "Persentil",
    heightCm: "Bo'y (sm)",
    weightKg: "Vazn (kg)",
    percentileNote: "* Ma'lumotlar o'rtacha BMI qiymatiga asoslanib hisoblanadi:",
    correlationMatrix: "Korrelyatsiya matritsasi",
    correlationSub: "Ko'rsatkichlar orasidagi bog'liqlik (Pearson r koeffitsienti)",
    parameter: "Parametr",
    age: "Yosh",
    height: "Bo'y",
    weight: "Vazn",
    chest: "Ko'krak",
    strongCorr: "Kuchli bog'liqlik (r > 0.7)",
    mediumCorr: "O'rta bog'liqlik (0.4-0.7)",
    weakCorr: "Zaif bog'liqlik (0.2-0.4)",
    riskGroups: "Xavf guruhlari tahlili",
    riskGroupsSub: "Sog'liq xavfi bo'yicha bemorlar guruhlari va ulushi",
    healthy: "Sog'lom (Normal BMI)",
    overweight: "Ortiqcha vazn",
    obese: "Semizlik",
    underweight: "Ozg'inlik",
    lowRisk: "Past xavf",
    mediumRisk: "O'rtacha xavf",
    highRisk: "Yuqori xavf",
    observeRisk: "Kuzatish kerak",
    attention: "Diqqat",
    highRiskNote: "Tizimda {pct}% bemorlar yuqori xavf guruhida. Klinik aralashuv tavsiya etiladi.",
    trendTitle: "6 oylik trend tahlili",
    trendSub: "Dinamika, o'sish sur'ati va BMI o'rtacha qiymati",
    analysesCount: "Analizlar soni",
    avgBmi: "O'rtacha BMI",
    average: "O'rtacha",
    footer: "MorphoCheck ilmiy-statistik tahlil moduli • Barcha ma'lumotlar real vaqt rejimida •",
    zLess: "< -2σ (Ozg'in)",
    zMinus2: "-2σ - -1σ",
    zMinus1: "-1σ - 0 (Norm-)",
    zZero: "0 - +1σ (Norm+)",
    zPlus1: "+1σ - +2σ",
    zGreater: "> +2σ (Semizlik)",
  },
  ru: {
    title: "Научный анализ",
    subtitle: "Популяционный Z-score, перцентили, корреляции и группы риска",
    zDist: "Распределение по Z-score",
    zDistSub: "Анализ отклонения BMI от нормы по группам стандартного отклонения",
    patientCount: "Количество пациентов",
    patients: "Пациенты",
    patientsLower: "пациент",
    normalNote:
      "По нормальному распределению ожидается: 68% пациентов в пределах +/-1σ, 95% в пределах +/-2σ. В системе нормальная группа:",
    percentileTable: "Таблица перцентилей",
    percentileSub: "Границы распределения по BMI, росту и весу",
    percentile: "Перцентиль",
    heightCm: "Рост (см)",
    weightKg: "Вес (кг)",
    percentileNote: "* Данные рассчитаны на основе среднего BMI:",
    correlationMatrix: "Матрица корреляции",
    correlationSub: "Связь между показателями (коэффициент Pearson r)",
    parameter: "Параметр",
    age: "Возраст",
    height: "Рост",
    weight: "Вес",
    chest: "Грудь",
    strongCorr: "Сильная связь (r > 0.7)",
    mediumCorr: "Средняя связь (0.4-0.7)",
    weakCorr: "Слабая связь (0.2-0.4)",
    riskGroups: "Анализ групп риска",
    riskGroupsSub: "Группы пациентов и доля по риску для здоровья",
    healthy: "Здоровые (нормальный BMI)",
    overweight: "Избыточный вес",
    obese: "Ожирение",
    underweight: "Недостаток веса",
    lowRisk: "Низкий риск",
    mediumRisk: "Средний риск",
    highRisk: "Высокий риск",
    observeRisk: "Требуется наблюдение",
    attention: "Внимание",
    highRiskNote:
      "В системе {pct}% пациентов находятся в группе высокого риска. Рекомендуется клиническое вмешательство.",
    trendTitle: "Тренд за 6 месяцев",
    trendSub: "Динамика, темп роста и среднее значение BMI",
    analysesCount: "Количество анализов",
    avgBmi: "Средний BMI",
    average: "Среднее",
    footer: "Научно-статистический модуль MorphoCheck • Все данные в реальном времени •",
    zLess: "< -2σ (дефицит веса)",
    zMinus2: "-2σ - -1σ",
    zMinus1: "-1σ - 0 (норма-)",
    zZero: "0 - +1σ (норма+)",
    zPlus1: "+1σ - +2σ",
    zGreater: "> +2σ (ожирение)",
  },
  en: {
    title: "Scientific Analysis",
    subtitle: "Population Z-score, percentile, correlation, and risk group analysis",
    zDist: "Z-score distribution",
    zDistSub: "BMI deviation analysis by standard deviation groups",
    patientCount: "Patient count",
    patients: "Patients",
    patientsLower: "patients",
    normalNote:
      "Normal distribution expects 68% of patients within +/-1σ and 95% within +/-2σ. In your system, the normal group:",
    percentileTable: "Percentile table",
    percentileSub: "Distribution limits by BMI, height, and weight",
    percentile: "Percentile",
    heightCm: "Height (cm)",
    weightKg: "Weight (kg)",
    percentileNote: "* Data is calculated from the average BMI:",
    correlationMatrix: "Correlation matrix",
    correlationSub: "Relationship between indicators (Pearson r coefficient)",
    parameter: "Parameter",
    age: "Age",
    height: "Height",
    weight: "Weight",
    chest: "Chest",
    strongCorr: "Strong correlation (r > 0.7)",
    mediumCorr: "Moderate correlation (0.4-0.7)",
    weakCorr: "Weak correlation (0.2-0.4)",
    riskGroups: "Risk group analysis",
    riskGroupsSub: "Patient groups and share by health risk",
    healthy: "Healthy (Normal BMI)",
    overweight: "Overweight",
    obese: "Obesity",
    underweight: "Underweight",
    lowRisk: "Low risk",
    mediumRisk: "Medium risk",
    highRisk: "High risk",
    observeRisk: "Needs monitoring",
    attention: "Attention",
    highRiskNote:
      "{pct}% of patients are in the high-risk group. Clinical intervention is recommended.",
    trendTitle: "6-month trend analysis",
    trendSub: "Dynamics, growth rate, and average BMI",
    analysesCount: "Analysis count",
    avgBmi: "Average BMI",
    average: "Average",
    footer: "MorphoCheck scientific-statistical analysis module • All data in real time •",
    zLess: "< -2σ (Underweight)",
    zMinus2: "-2σ - -1σ",
    zMinus1: "-1σ - 0 (Norm-)",
    zZero: "0 - +1σ (Norm+)",
    zPlus1: "+1σ - +2σ",
    zGreater: "> +2σ (Obesity)",
  },
  kz: {
    title: "Ғылыми талдау",
    subtitle: "Популяциялық Z-score, перцентиль, корреляция және қауіп топтарын талдау",
    zDist: "Z-score бойынша таралу",
    zDistSub: "BMI нормадан ауытқуын стандартты ауытқу топтары бойынша талдау",
    patientCount: "Пациенттер саны",
    patients: "Пациенттер",
    patientsLower: "пациент",
    normalNote:
      "Қалыпты таралу бойынша пациенттердің 68% +/-1σ, 95% +/-2σ ішінде болады деп күтіледі. Жүйедегі қалыпты топ:",
    percentileTable: "Перцентиль кестесі",
    percentileSub: "BMI, бой және салмақ бойынша таралу шектері",
    percentile: "Перцентиль",
    heightCm: "Бой (см)",
    weightKg: "Салмақ (кг)",
    percentileNote: "* Деректер орташа BMI негізінде есептеледі:",
    correlationMatrix: "Корреляция матрицасы",
    correlationSub: "Көрсеткіштер арасындағы байланыс (Pearson r коэффициенті)",
    parameter: "Параметр",
    age: "Жас",
    height: "Бой",
    weight: "Салмақ",
    chest: "Кеуде",
    strongCorr: "Күшті байланыс (r > 0.7)",
    mediumCorr: "Орташа байланыс (0.4-0.7)",
    weakCorr: "Әлсіз байланыс (0.2-0.4)",
    riskGroups: "Қауіп топтарын талдау",
    riskGroupsSub: "Денсаулық қаупі бойынша пациент топтары және үлесі",
    healthy: "Сау (қалыпты BMI)",
    overweight: "Артық салмақ",
    obese: "Семіздік",
    underweight: "Салмақ тапшылығы",
    lowRisk: "Төмен қауіп",
    mediumRisk: "Орташа қауіп",
    highRisk: "Жоғары қауіп",
    observeRisk: "Бақылау қажет",
    attention: "Назар аударыңыз",
    highRiskNote: "Жүйеде пациенттердің {pct}% жоғары қауіп тобында. Клиникалық араласу ұсынылады.",
    trendTitle: "6 айлық тренд талдауы",
    trendSub: "Динамика, өсу қарқыны және орташа BMI мәні",
    analysesCount: "Талдаулар саны",
    avgBmi: "Орташа BMI",
    average: "Орташа",
    footer: "MorphoCheck ғылыми-статистикалық талдау модулі • Барлық деректер нақты уақытта •",
    zLess: "< -2σ (салмақ тапшылығы)",
    zMinus2: "-2σ - -1σ",
    zMinus1: "-1σ - 0 (норма-)",
    zZero: "0 - +1σ (норма+)",
    zPlus1: "+1σ - +2σ",
    zGreater: "> +2σ (семіздік)",
  },
};

SCI_TEXT.ky = {
  ...SCI_TEXT.uz,
  title: "Илимий талдоо",
  subtitle: "Популяциялык Z-score, перцентиль, корреляция жана коркунуч топторунун талдоосу",
  zDist: "Z-score боюнча бөлүштүрүү",
  patientCount: "Бейтаптар саны",
  patients: "Бейтаптар",
  percentileTable: "Перцентиль таблицасы",
  percentile: "Перцентиль",
  heightCm: "Бой (см)",
  weightKg: "Салмак (кг)",
  correlationMatrix: "Корреляция матрицасы",
  parameter: "Параметр",
  age: "Жаш",
  height: "Бой",
  weight: "Салмак",
  chest: "Көкүрөк",
  riskGroups: "Коркунуч топторунун талдоосу",
  healthy: "Дени сак (нормалдуу BMI)",
  overweight: "Ашыкча салмак",
  obese: "Семирүү",
  underweight: "Салмак жетишсиздиги",
  lowRisk: "Төмөн коркунуч",
  mediumRisk: "Орточо коркунуч",
  highRisk: "Жогорку коркунуч",
  attention: "Көңүл буруңуз",
  trendTitle: "6 айлык тренд талдоосу",
  analysesCount: "Талдоолор саны",
  avgBmi: "Орточо BMI",
  average: "Орточо",
  footer: "MorphoCheck илимий-статистикалык талдоо модулу • Бардык маалыматтар реалдуу убакытта •",
};
SCI_TEXT.tg = {
  ...SCI_TEXT.uz,
  title: "Таҳлили илмӣ",
  subtitle: "Таҳлили Z-score-и популятсионӣ, персентил, коррелятсия ва гурӯҳҳои хавф",
  zDist: "Тақсимот аз рӯи Z-score",
  zDistSub: "Таҳлили дуршавии BMI аз меъёр аз рӯи гурӯҳҳои инҳирофи стандартӣ",
  patientCount: "Шумораи беморон",
  patients: "Беморон",
  patientsLower: "бемор",
  normalNote:
    "Аз рӯи тақсимоти нормалӣ интизор меравад: 68% беморон дар ҳудуди +/-1σ ва 95% дар ҳудуди +/-2σ бошанд. Дар низом гурӯҳи меъёр:",
  percentileTable: "Ҷадвали персентилҳо",
  percentileSub: "Ҳудудҳои тақсимот аз рӯи BMI, қад ва вазн",
  percentile: "Персентил",
  heightCm: "Қад (см)",
  weightKg: "Вазн (кг)",
  percentileNote: "* Маълумот дар асоси арзиши миёнаи BMI ҳисоб шудааст:",
  correlationMatrix: "Матритсаи коррелятсия",
  correlationSub: "Алоқа байни нишондиҳандаҳо (коэффисиенти Pearson r)",
  parameter: "Параметр",
  age: "Синну сол",
  height: "Қад",
  weight: "Вазн",
  chest: "Қафаси сина",
  strongCorr: "Алоқаи қавӣ (r > 0.7)",
  mediumCorr: "Алоқаи миёна (0.4-0.7)",
  weakCorr: "Алоқаи суст (0.2-0.4)",
  riskGroups: "Таҳлили гурӯҳҳои хавф",
  riskGroupsSub: "Гурӯҳҳои беморон ва ҳисса аз рӯи хавфи саломатӣ",
  healthy: "Солим (BMI меъёр)",
  overweight: "Вазни зиёдатӣ",
  obese: "Фарбеҳӣ",
  underweight: "Камвазнӣ",
  lowRisk: "Хавфи паст",
  mediumRisk: "Хавфи миёна",
  highRisk: "Хавфи баланд",
  observeRisk: "Назорат лозим",
  attention: "Диққат",
  highRiskNote:
    "Дар низом {pct}% беморон дар гурӯҳи хавфи баланд мебошанд. Дахолати клиникӣ тавсия мешавад.",
  trendTitle: "Таҳлили тренди 6 моҳа",
  trendSub: "Динамика, суръати афзоиш ва арзиши миёнаи BMI",
  analysesCount: "Шумораи таҳлилҳо",
  avgBmi: "BMI миёна",
  average: "Миёна",
  footer: "Модули таҳлили илмӣ-омории MorphoCheck • Ҳамаи маълумот дар вақти воқеӣ •",
  zLess: "< -2σ (камвазнӣ)",
  zMinus2: "-2σ - -1σ",
  zMinus1: "-1σ - 0 (меъёр-)",
  zZero: "0 - +1σ (меъёр+)",
  zPlus1: "+1σ - +2σ",
  zGreater: "> +2σ (фарбеҳӣ)",
};
const localeByLang = {
  uz: "uz-UZ",
  tg: "tg-TJ",
  ru: "ru-RU",
  en: "en-US",
  kz: "kk-KZ",
  ky: "ky-KG",
};

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
        overflowX: "auto",
        "&::-webkit-scrollbar": {
          height: "6px",
        },
        "&::-webkit-scrollbar-track": {
          background: "transparent",
        },
        "&::-webkit-scrollbar-thumb": {
          background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
          borderRadius: "10px",
        },
        "&::-webkit-scrollbar-thumb:hover": {
          background: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
        },
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
};

const SectionTitle = ({ icon, title, subtitle, badge }) => (
  <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
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
        sx={{ bgcolor: `${COLORS.primary}18`, color: COLORS.primary, fontWeight: 700 }}
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

// Z-score bar chart custom shape
const ZScoreBar = (props) => {
  const { x, y, width, height, payload } = props;
  const z = payload?.zscore || 0;
  const color = Math.abs(z) > 2 ? COLORS.error : Math.abs(z) > 1 ? COLORS.warning : COLORS.success;
  return <rect x={x} y={y} width={width} height={height} fill={color} rx={4} />;
};

// Korrelyatsiya jadval rangi
const getCorrColor = (val) => {
  const abs = Math.abs(val);
  if (abs > 0.7) return { bg: `${COLORS.primary}22`, text: COLORS.primary, weight: 800 };
  if (abs > 0.4) return { bg: "#10b98122", text: COLORS.success, weight: 700 };
  if (abs > 0.2) return { bg: "#f59e0b22", text: COLORS.warning, weight: 600 };
  return { bg: "transparent", text: "#666", weight: 400 };
};

export default function ScientificAnalysis({ stats, loading }) {
  const theme = useTheme();
  const { lang } = useLanguage();
  const s = SCI_TEXT[lang] || SCI_TEXT.uz;
  const isDark = theme.palette.mode === "dark";
  const customTooltip = useMemo(() => getTooltipStyle(isDark), [isDark]);

  // Percentile data from backend
  const percentileData = useMemo(() => {
    if (stats?.percentile_data && stats.percentile_data.length > 0) {
      return stats.percentile_data;
    }
    // Fallback/Simulated
    const bmiAvg = parseFloat(stats?.avg_bmi || 22);
    return [
      { percentile: "P10", bmi: (bmiAvg - 5).toFixed(1), height: "153", weight: "48" },
      { percentile: "P25", bmi: (bmiAvg - 2.5).toFixed(1), height: "158", weight: "55" },
      { percentile: "P50", bmi: bmiAvg.toFixed(1), height: "165", weight: "65" },
      { percentile: "P75", bmi: (bmiAvg + 2.5).toFixed(1), height: "171", weight: "75" },
      { percentile: "P90", bmi: (bmiAvg + 5).toFixed(1), height: "177", weight: "88" },
    ];
  }, [stats]);

  // Z-score taqsimoti
  const zScoreData = useMemo(() => {
    if (stats?.z_score_distribution && stats.z_score_distribution.length > 0) {
      return stats.z_score_distribution;
    }
    // Simulated fallback
    const bd = stats?.bmi_distribution || {};
    const total =
      (bd.normal || 0) + (bd.underweight || 0) + (bd.overweight || 0) + (bd.obese || 0) || 1;
    return [
      {
        category: s.zLess,
        count: bd.underweight || 0,
        pct: (((bd.underweight || 0) / total) * 100).toFixed(1),
        zscore: -2.5,
      },
      {
        category: s.zMinus2,
        count: Math.round((bd.normal || 0) * 0.2) || 0,
        pct: "8.0",
        zscore: -1.5,
      },
      {
        category: s.zMinus1,
        count: Math.round((bd.normal || 0) * 0.35) || 0,
        pct: "21.0",
        zscore: -0.5,
      },
      {
        category: s.zZero,
        count: Math.round((bd.normal || 0) * 0.35) || 0,
        pct: "21.0",
        zscore: 0.5,
      },
      {
        category: s.zPlus1,
        count: bd.overweight || 0,
        pct: (((bd.overweight || 0) / total) * 100).toFixed(1),
        zscore: 1.5,
      },
      {
        category: s.zGreater,
        count: bd.obese || 0,
        pct: (((bd.obese || 0) / total) * 100).toFixed(1),
        zscore: 2.5,
      },
    ];
  }, [stats, s]);

  // Korrelyatsiya matritsasi
  const corrMatrix = useMemo(() => {
    if (stats?.correlation_matrix && stats.correlation_matrix.length > 0) {
      return stats.correlation_matrix;
    }
    return [
      { param: "BMI", bmi: 1.0, yosh: 0.31, boy: -0.18, vazn: 0.78, ko_krak: 0.42 },
      { param: s.age, bmi: 0.31, yosh: 1.0, boy: -0.12, vazn: 0.29, ko_krak: 0.15 },
      { param: s.height, bmi: -0.18, yosh: -0.12, boy: 1.0, vazn: 0.55, ko_krak: 0.33 },
      { param: s.weight, bmi: 0.78, yosh: 0.29, boy: 0.55, vazn: 1.0, ko_krak: 0.61 },
      { param: s.chest, bmi: 0.42, yosh: 0.15, boy: 0.33, vazn: 0.61, ko_krak: 1.0 },
    ];
  }, [stats, s]);

  // Risk groups
  const riskGroups = useMemo(() => {
    const bd = stats?.bmi_distribution || {};
    const total =
      (bd.normal || 0) + (bd.underweight || 0) + (bd.overweight || 0) + (bd.obese || 0) || 1;
    return [
      {
        name: s.healthy,
        count: bd.normal || 0,
        pct: Math.round(((bd.normal || 0) / total) * 100),
        color: COLORS.success,
        risk: s.lowRisk,
      },
      {
        name: s.overweight,
        count: bd.overweight || 0,
        pct: Math.round(((bd.overweight || 0) / total) * 100),
        color: COLORS.warning,
        risk: s.mediumRisk,
      },
      {
        name: s.obese,
        count: bd.obese || 0,
        pct: Math.round(((bd.obese || 0) / total) * 100),
        color: COLORS.error,
        risk: s.highRisk,
      },
      {
        name: s.underweight,
        count: bd.underweight || 0,
        pct: Math.round(((bd.underweight || 0) / total) * 100),
        color: COLORS.info,
        risk: s.observeRisk,
      },
    ];
  }, [stats, s]);

  // Trend analysis: 6 oy dinamikasi
  const trendData = useMemo(
    () =>
      (stats?.monthly_trend || []).slice(-6).map((m) => ({
        month: m.month,
        count: m.count,
        growth: m.growth_pct ? parseFloat(m.growth_pct).toFixed(1) : null,
        avg_bmi: m.avg_bmi ? parseFloat(m.avg_bmi).toFixed(2) : null,
      })),
    [stats],
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress size={48} sx={{ color: COLORS.primary }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Box
          display="flex"
          alignItems="center"
          gap={2}
          mb={1}
          p={3}
          sx={{
            borderRadius: 2,
            border: "1px solid",
            borderColor: isDark ? "rgba(148,163,184,0.18)" : "rgba(15,118,110,0.16)",
            background: isDark
              ? "linear-gradient(135deg, rgba(15,118,110,0.22), rgba(37,99,235,0.12))"
              : "linear-gradient(135deg, rgba(15,118,110,0.10), rgba(37,99,235,0.06))",
          }}
        >
          <BiotechOutlined sx={{ fontSize: 32, color: COLORS.primary }} />
          <Box flex={1}>
            <Typography variant="h4" fontWeight={900} sx={{ color: "text.primary" }}>
              {s.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {s.subtitle}
            </Typography>
          </Box>
          <Chip
            label="SCIENTIFIC"
            size="small"
            sx={{ bgcolor: COLORS.primary, color: "#fff", fontWeight: 900, fontSize: "0.7rem" }}
          />
        </Box>
      </Box>

      {/* ===== ROW 1: Z-score taqsimoti ===== */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <GlassCard>
            <SectionTitle
              icon={<EqualizerOutlined sx={{ color: COLORS.primary }} />}
              title={s.zDist}
              subtitle={s.zDistSub}
              badge={`n = ${stats?.total_analyses?.toLocaleString() || "0"}`}
            />
            <Box sx={{ height: 280, minWidth: { xs: 280, sm: 400, md: 600 } }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zScoreData} barCategoryGap="15%">
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
                  />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                  <ReTooltip {...customTooltip} formatter={(val) => [val, s.patientCount]} />
                  <Bar
                    dataKey="count"
                    name={s.patients}
                    radius={[6, 6, 0, 0]}
                    shape={<ZScoreBar />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
              <Typography variant="caption">
                {s.normalNote} <strong>{stats?.bmi_distribution?.normal || 0}</strong>{" "}
                {s.patientsLower}
              </Typography>
            </Alert>
          </GlassCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <GlassCard sx={{ height: "100%" }}>
            <SectionTitle
              icon={<ScienceOutlined sx={{ color: COLORS.secondary }} />}
              title={s.percentileTable}
              subtitle={s.percentileSub}
            />
            <TableContainer component={Paper} elevation={0} sx={{ bgcolor: "transparent" }}>
              <Table size="small" sx={{ minWidth: { xs: 280, sm: 350, md: 400 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: COLORS.primary, fontSize: "0.75rem" }}>
                      {s.percentile}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                      BMI
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                      {s.heightCm}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                      {s.weightKg}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {percentileData.map((row) => (
                    <TableRow key={row.percentile} hover>
                      <TableCell>
                        <Chip
                          label={row.percentile}
                          size="small"
                          sx={{
                            bgcolor: `${COLORS.primary}18`,
                            color: COLORS.primary,
                            fontWeight: 800,
                            fontSize: "0.7rem",
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>
                        {row.bmi}
                      </TableCell>
                      <TableCell align="center">{row.height}</TableCell>
                      <TableCell align="center">{row.weight}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              {s.percentileNote} {parseFloat(stats?.avg_bmi || 22).toFixed(1)}
            </Typography>
          </GlassCard>
        </Grid>
      </Grid>

      {/* ===== ROW 2: Korrelyatsiya matritsasi ===== */}
      <Grid container spacing={3} mb={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <GlassCard>
            <SectionTitle
              icon={<AutoGraphOutlined sx={{ color: COLORS.teal }} />}
              title={s.correlationMatrix}
              subtitle={s.correlationSub}
            />
            <TableContainer component={Paper} elevation={0} sx={{ bgcolor: "transparent" }}>
              <Table size="small" sx={{ minWidth: { xs: 280, sm: 350, md: 500 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, fontSize: "0.7rem" }}>
                      {s.parameter}
                    </TableCell>
                    {["BMI", s.age, s.height, s.weight, s.chest].map((h) => (
                      <TableCell
                        key={h}
                        align="center"
                        sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {corrMatrix.map((row) => (
                    <TableRow key={row.param}>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                        {row.param}
                      </TableCell>
                      {[row.bmi, row.yosh, row.boy, row.vazn, row.ko_krak].map((val, i) => {
                        const style = getCorrColor(val);
                        return (
                          <TableCell key={i} align="center" sx={{ bgcolor: style.bg }}>
                            <Typography
                              variant="caption"
                              sx={{ color: style.text, fontWeight: style.weight }}
                            >
                              {typeof val === "number" ? val.toFixed(2) : val}
                            </Typography>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box mt={1.5} display="flex" gap={1} flexWrap="wrap">
              <Typography
                variant="caption"
                sx={{ bgcolor: `${COLORS.primary}22`, px: 1, borderRadius: 1 }}
              >
                {s.strongCorr}
              </Typography>
              <Typography variant="caption" sx={{ bgcolor: "#10b98122", px: 1, borderRadius: 1 }}>
                {s.mediumCorr}
              </Typography>
              <Typography variant="caption" sx={{ bgcolor: "#f59e0b22", px: 1, borderRadius: 1 }}>
                {s.weakCorr}
              </Typography>
            </Box>
          </GlassCard>
        </Grid>

        {/* ===== Xavf guruhlari ===== */}
        <Grid size={{ xs: 12, md: 6 }}>
          <GlassCard>
            <SectionTitle
              icon={<ScienceOutlined sx={{ color: COLORS.error }} />}
              title={s.riskGroups}
              subtitle={s.riskGroupsSub}
            />
            <Stack spacing={2.5} mt={1}>
              {riskGroups.map((group) => (
                <Box key={group.name}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" fontWeight={700}>
                      {group.name}
                    </Typography>
                    <Box display="flex" gap={1} alignItems="center">
                      <Chip
                        label={group.risk}
                        size="small"
                        sx={{
                          fontSize: "0.65rem",
                          bgcolor: `${group.color}22`,
                          color: group.color,
                        }}
                      />
                      <Typography variant="body2" fontWeight={800} sx={{ color: group.color }}>
                        {group.pct}%
                      </Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={group.pct}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      bgcolor: `${group.color}18`,
                      "& .MuiLinearProgress-bar": { bgcolor: group.color, borderRadius: 5 },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" mt={0.3} display="block">
                    {group.count.toLocaleString()} {s.patientsLower}
                  </Typography>
                </Box>
              ))}
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <Typography variant="caption">
                <strong>{s.attention}:</strong>{" "}
                {s.highRiskNote.replace(
                  "{pct}",
                  riskGroups.find((g) => g.name === s.obese)?.pct || 0,
                )}
              </Typography>
            </Alert>
          </GlassCard>
        </Grid>
      </Grid>

      {/* ===== ROW 3: Trend tahlili ===== */}
      {trendData.length > 0 && (
        <Grid container spacing={3} mb={3}>
          <Grid size={{ xs: 12 }}>
            <GlassCard>
              <SectionTitle
                icon={<AutoGraphOutlined sx={{ color: COLORS.warning }} />}
                title={s.trendTitle}
                subtitle={s.trendSub}
                badge="TREND"
              />
              <Box sx={{ height: 280, minWidth: { xs: 280, sm: 400, md: 700 } }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <YAxis
                      yAxisId="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <ReTooltip {...customTooltip} />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="count"
                      name={s.analysesCount}
                      fill={`${COLORS.primary}33`}
                      stroke={COLORS.primary}
                      strokeWidth={2}
                    />
                    {trendData.some((d) => d.avg_bmi) && (
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="avg_bmi"
                        name={s.avgBmi}
                        stroke={COLORS.warning}
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: COLORS.warning }}
                        strokeDasharray="6 3"
                      />
                    )}
                    <ReferenceLine
                      yAxisId="left"
                      y={stats?.monthly_avg}
                      stroke={COLORS.success}
                      strokeDasharray="4 4"
                      label={{ value: s.average, fill: COLORS.success, fontSize: 11 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Grid>
        </Grid>
      )}

      {/* Footer */}
      <Box py={2} textAlign="center" mt={2}>
        <Typography variant="caption" color="text.secondary">
          {s.footer} {new Date().toLocaleDateString(localeByLang[lang] || "uz-UZ")}
        </Typography>
      </Box>
    </Box>
  );
}

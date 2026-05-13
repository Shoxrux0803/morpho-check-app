// src/pages/InfoDetail.js
import React from "react";
import { motion } from "framer-motion";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  CircleDot,
  Dna,
  FileText,
  Gauge,
  HeartPulse,
  LineChart,
  Microscope,
  Network,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useThemeMode } from "../providers/ThemeProviderMUI";
import { useLanguage } from "../contexts/LanguageContext";
import logo from "../assets/morphocheck-logo.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay, ease: "easeOut" },
  }),
};

const zScoreBands = [
  { label: "< -3", color: "#dc2626", width: 14 },
  { label: "-3..-2", color: "#f97316", width: 14 },
  { label: "-2..+1", color: "#16a34a", width: 44 },
  { label: "+1..+2", color: "#f59e0b", width: 14 },
  { label: "> +2", color: "#dc2626", width: 14 },
];

const somatoTypes = [
  { label: "Endomorf", value: 72, color: "#f97316" },
  { label: "Mezomorf", value: 88, color: "#16a34a" },
  { label: "Ektomorf", value: 54, color: "#0ea5e9" },
];

const indexCards = [
  {
    key: "HMAI",
    title: "Hududiy Morfologik Adaptatsiya Indeksi",
    subtitle: "HMAI (мослашув)",
    icon: Gauge,
    color: "#0ea5e9",
    formula: "HMAI = (MM% / FM%) x BMI x E",
    meaning:
      "Mushak va yog' komponentlari o'rtasidagi nisbatni BMI hamda hududiy ekologik koeffitsient bilan bog'lab, bolaning muhitga morfologik moslashuv darajasini ko'rsatadi.",
    deep: "Oddiy BMI tana tarkibini ajratmaydi. HMAI esa sog'lom mushak ustunligi, energetik zaxira va yashash muhiti ta'sirini bitta integrativ ko'rsatkichga jamlaydi. Urban, tog', cho'l yoki qishloq sharoitlarida bir xil BMI turlicha biologik ma'noga ega bo'lishi mumkin.",
    factors: [
      "MM% - mushak massasi",
      "FM% - yog' massasi",
      "BMI - tana massasi indeksi",
      "E - hududiy omil",
    ],
    zones: ["Past adaptatsiya", "Kompensatsiya", "Optimal moslashuv", "Sportiv fenotip"],
  },
  {
    key: "MII",
    title: "Morfologik Integratsiya Indeksi",
    subtitle: "MII (интеграция)",
    icon: Network,
    color: "#16a34a",
    formula: "MII = (r(h,m) + r(m,CI) + r(BMI,FM%)) / 3",
    meaning:
      "Bo'y, vazn, ko'krak aylanasi, BMI va yog' foizi o'rtasidagi korrelyatsion uyg'unlikni baholab, organizmni yagona biologik tizim sifatida ko'rsatadi.",
    deep: "MII izolyatsiya qilingan raqamlar o'rniga tizimli uyg'unlikni o'lchaydi. Yuqori MII parametrlar bir-biriga mos rivojlanayotganini, past MII esa yashirin disbalans yoki rivojlanish sur'atlari nomutanosibligini ko'rsatishi mumkin.",
    factors: ["r(h,m) - bo'y/vazn", "r(m,CI) - vazn/ko'krak", "r(BMI,FM%) - indeks/tarkib"],
    zones: ["Fragmentatsiya", "O'tish zonasi", "Uyg'un integratsiya", "Yuqori tizimlilik"],
  },
  {
    key: "ADI",
    title: "Antropometrik Disgarmoniya Indeksi",
    subtitle: "ADI (номутаносиблик)",
    icon: Target,
    color: "#f97316",
    formula: "ADI = |Zh| + |Zw| + |ZBMI|",
    meaning:
      "Bo'y, vazn va BMI bo'yicha Z-score og'ishlarini birlashtirib, umumiy morfologik nomutanosiblik darajasini klinik skriningga qulay ko'rinishda beradi.",
    deep: "Z-score alohida o'qilganda klinik signal bo'laklarga ajralib ketadi. ADI esa og'ishlar yig'indisini ko'rsatadi: bir parametr ozgina, ikkinchisi sezilarli siljigan holatlarda umumiy riskni tezroq payqashga yordam beradi.",
    factors: ["Zh - bo'y Z-score", "Zw - vazn Z-score", "ZBMI - BMI Z-score"],
    zones: ["Normaga yaqin", "Yengil disbalans", "O'rta nomutanosiblik", "Kuchli disgarmoniya"],
  },
  {
    key: "MCRI",
    title: "MorphoCheck Kompleks Risk Indeksi",
    subtitle: "MCRI (Риск индекси)",
    icon: ShieldCheck,
    color: "#dc2626",
    formula: "MCRI = (BMIz + FMz - MMz) / 3",
    meaning:
      "BMI, yog' massasi va mushak komponentini birgalikda hisoblab, adipostatik fenotip va metabolik xavfni erta bosqichda prognoz qilishga xizmat qiladi.",
    deep: "BMI yuqori bo'lishi har doim ham bir xil xavf degani emas: mushak massasi yuqori bolada klinik ma'no boshqacha, yog' massasi yuqori va mushak past bo'lsa risk kuchayadi. MCRI shu farqni raqamli qiladi.",
    factors: ["BMIz - BMI standarti", "FMz - yog' Z-score", "MMz - mushak Z-score"],
    zones: ["Past risk", "Kuzatuv", "Profilaktika", "Yuqori risk"],
  },
];

const clinicalLayers = [
  { icon: Activity, title: "Z-Score standarti", value: "WHO/BSST", color: "#0ea5e9" },
  { icon: Dna, title: "Xit-Karter modeli", value: "3 komponent", color: "#16a34a" },
  { icon: BrainCircuit, title: "AI talqin", value: "Kontekstli", color: "#8b5cf6" },
  { icon: FileText, title: "Hisobot", value: "PDF/DOCX/XLSX", color: "#f97316" },
];

function GlassPanel({ children, sx, hover = true }) {
  const theme = useTheme();
  const { mode } = useThemeMode();

  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, mode === "dark" ? 0.5 : 0.8)}`,
        background:
          mode === "dark"
            ? alpha(theme.palette.background.paper, 0.6)
            : alpha(theme.palette.background.paper, 0.9),
        boxShadow: `0 18px 50px ${alpha(theme.palette.common.black, mode === "dark" ? 0.22 : 0.08)}`,
        backdropFilter: "blur(18px)",
        overflow: "hidden",
        transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
        ...(hover && {
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: `0 26px 70px ${alpha(theme.palette.common.black, mode === "dark" ? 0.32 : 0.12)}`,
            borderColor: alpha(theme.palette.primary.main, 0.32),
          },
        }),
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}

function ZScoreScale() {
  const theme = useTheme();

  return (
    <Box>
      <Stack direction="row" sx={{ height: 18, borderRadius: 1, overflow: "hidden", mb: 1.5 }}>
        {zScoreBands.map((band) => (
          <Box
            key={band.label}
            sx={{
              width: `${band.width}%`,
              bgcolor: band.color,
              opacity: 0.9,
            }}
          />
        ))}
      </Stack>
      <Stack direction="row" justifyContent="space-between">
        {zScoreBands.map((band) => (
          <Typography key={band.label} variant="caption" color="text.secondary" fontWeight={800}>
            {band.label}
          </Typography>
        ))}
      </Stack>
      <Box
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 1.5,
          bgcolor: alpha(theme.palette.info.main, 0.08),
          border: `1px solid ${alpha(theme.palette.info.main, 0.16)}`,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Z-score bolaning o'lchovi yosh va jins bo'yicha referens populyatsiyadan nechta standart
          og'ish uzoqlashganini ko'rsatadi. MorphoCheck bo'y, vazn va BMI signalini birgalikda
          o'qib, ADI va MCRI uchun klinik asos yaratadi.
        </Typography>
      </Box>
    </Box>
  );
}

function SomatoTriangle() {
  const theme = useTheme();

  return (
    <Box sx={{ display: "grid", placeItems: "center" }}>
      <Box
        sx={{
          position: "relative",
          width: "min(100%, 320px)",
          aspectRatio: "1.08",
          mt: 1,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: "6% 12% 18%",
            clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
            background: `linear-gradient(135deg, ${alpha("#f97316", 0.26)}, ${alpha(
              "#16a34a",
              0.3,
            )} 50%, ${alpha("#0ea5e9", 0.26)})`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            left: "48%",
            top: "42%",
            width: 18,
            height: 18,
            borderRadius: "50%",
            bgcolor: "primary.main",
            border: `4px solid ${theme.palette.background.paper}`,
            boxShadow: `0 0 0 8px ${alpha(theme.palette.primary.main, 0.14)}`,
          }}
        />
        {[
          { text: "Mezomorf", left: "50%", top: 0, color: "#16a34a" },
          { text: "Endomorf", left: 0, top: "82%", color: "#f97316" },
          { text: "Ektomorf", left: "77%", top: "82%", color: "#0ea5e9" },
        ].map((item) => (
          <Chip
            key={item.text}
            label={item.text}
            size="small"
            sx={{
              position: "absolute",
              left: item.left,
              top: item.top,
              transform: "translateX(-50%)",
              bgcolor: alpha(item.color, 0.12),
              color: item.color,
              fontWeight: 900,
              borderRadius: 1,
            }}
          />
        ))}
      </Box>
      <Stack spacing={1.4} sx={{ width: "100%" }}>
        {somatoTypes.map((type) => (
          <Box key={type.label}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="body2" fontWeight={900}>
                {type.label}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={800}>
                {type.value}%
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={type.value}
              sx={{
                height: 8,
                borderRadius: 1,
                bgcolor: alpha(type.color, 0.14),
                "& .MuiLinearProgress-bar": { bgcolor: type.color, borderRadius: 1 },
              }}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function IndexRadar() {
  const theme = useTheme();
  const points = [
    { label: "MII", x: 50, y: 12, value: 76 },
    { label: "HMAI", x: 88, y: 42, value: 68 },
    { label: "MCRI", x: 70, y: 86, value: 34 },
    { label: "ADI", x: 30, y: 86, value: 42 },
    { label: "Z", x: 12, y: 42, value: 72 },
  ];
  const polygon = points
    .map((p) => {
      const cx = 50 + ((p.x - 50) * p.value) / 100;
      const cy = 50 + ((p.y - 50) * p.value) / 100;
      return `${cx},${cy}`;
    })
    .join(" ");

  return (
    <Box sx={{ width: "100%", maxWidth: 360, mx: "auto" }}>
      <svg
        viewBox="0 0 100 100"
        width="100%"
        role="img"
        aria-label="MorphoCheck indeks radar diagrammasi"
      >
        {[20, 35, 50].map((r) => (
          <circle
            key={r}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={alpha(theme.palette.text.primary, 0.14)}
            strokeWidth="0.7"
          />
        ))}
        {points.map((p) => (
          <g key={p.label}>
            <line
              x1="50"
              y1="50"
              x2={p.x}
              y2={p.y}
              stroke={alpha(theme.palette.text.primary, 0.14)}
              strokeWidth="0.7"
            />
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="5"
              fontWeight="800"
              fill={theme.palette.text.secondary}
            >
              {p.label}
            </text>
          </g>
        ))}
        <polygon
          points={polygon}
          fill={alpha(theme.palette.primary.main, 0.24)}
          stroke={theme.palette.primary.main}
          strokeWidth="1.4"
        />
        <circle cx="50" cy="50" r="2" fill={theme.palette.primary.main} />
      </svg>
    </Box>
  );
}

function FlowDiagram() {
  const theme = useTheme();
  const { mode } = useThemeMode();
  const nodes = [
    { title: "Antropometriya", desc: "bo'y, vazn, CI", color: "#0ea5e9" },
    { title: "BIA tarkib", desc: "FM%, MM%", color: "#16a34a" },
    { title: "Muhit omili", desc: "E, urban, altitude", color: "#8b5cf6" },
    { title: "Indekslar", desc: "HMAI, MII, ADI, MCRI", color: "#f97316" },
    { title: "Xulosa", desc: "profil, risk, tavsiya", color: "#dc2626" },
  ];

  return (
    <Grid container spacing={1.5}>
      {nodes.map((node, index) => (
        <Grid item xs={12} sm={index === nodes.length - 1 ? 12 : 6} md key={node.title}>
          <Box
            sx={{
              height: "100%",
              p: 2,
              borderRadius: 1.5,
              border: `1px solid ${alpha(node.color, mode === "dark" ? 0.36 : 0.22)}`,
              bgcolor: alpha(node.color, mode === "dark" ? 0.12 : 0.08),
              position: "relative",
              "&:after":
                index < nodes.length - 1
                  ? {
                      content: '""',
                      position: "absolute",
                      right: { xs: "50%", md: -12 },
                      bottom: { xs: -12, md: "50%" },
                      width: { xs: 1, md: 24 },
                      height: { xs: 24, md: 1 },
                      bgcolor: alpha(theme.palette.text.primary, 0.22),
                    }
                  : {},
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <CircleDot size={16} color={node.color} />
              <Typography variant="subtitle2" fontWeight={950}>
                {node.title}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" fontWeight={800}>
              {node.desc}
            </Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}

function IndexDeepCard({ item, index }) {
  const theme = useTheme();
  const Icon = item.icon;

  return (
    <motion.div
      custom={0.08 * index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
    >
      <GlassPanel>
        <Box sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1.5,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                color: item.color,
                bgcolor: alpha(item.color, 0.12),
                border: `1px solid ${alpha(item.color, 0.22)}`,
              }}
            >
              <Icon size={25} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="overline"
                sx={{ color: item.color, fontWeight: 950, lineHeight: 1 }}
              >
                {item.subtitle}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 950, lineHeight: 1.16 }}>
                {item.title}
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              p: 1.5,
              mb: 2,
              borderRadius: 1,
              color: item.color,
              bgcolor: alpha(item.color, 0.09),
              border: `1px solid ${alpha(item.color, 0.16)}`,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontWeight: 900,
              fontSize: { xs: 13, sm: 14 },
              overflowWrap: "anywhere",
            }}
          >
            {item.formula}
          </Box>

          <Typography variant="body1" sx={{ mb: 1.5, fontWeight: 700 }}>
            {item.meaning}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            {item.deep}
          </Typography>

          <Grid container spacing={1.2}>
            {item.factors.map((factor) => (
              <Grid item xs={12} sm={6} key={factor}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{
                    p: 1.2,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.text.primary, 0.035),
                  }}
                >
                  <CheckCircle2 size={16} color={item.color} />
                  <Typography variant="caption" fontWeight={800}>
                    {factor}
                  </Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 2.5 }} />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {item.zones.map((zone) => (
              <Chip
                key={zone}
                label={zone}
                size="small"
                sx={{
                  borderRadius: 1,
                  fontWeight: 850,
                  bgcolor: alpha(item.color, 0.1),
                  color: item.color,
                }}
              />
            ))}
          </Stack>
        </Box>
      </GlassPanel>
    </motion.div>
  );
}

export default function InfoDetail() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { mode } = useThemeMode();
  const { t } = useLanguage();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        py: { xs: 4, md: 7 },
        overflow: "hidden",
        background:
          mode === "dark"
            ? `radial-gradient(circle at 18% 8%, ${alpha("#0ea5e9", 0.18)}, transparent 32%),
               radial-gradient(circle at 82% 18%, ${alpha("#16a34a", 0.14)}, transparent 28%),
               linear-gradient(180deg, ${theme.palette.background.default}, ${alpha("#020617", 0.96)})`
            : `radial-gradient(circle at 18% 8%, ${alpha("#0ea5e9", 0.16)}, transparent 32%),
               radial-gradient(circle at 82% 18%, ${alpha("#22c55e", 0.13)}, transparent 28%),
               linear-gradient(180deg, #f7fbff 0%, #ffffff 44%, #f8fafc 100%)`,
      }}
    >
      <Container maxWidth="xl" sx={{ position: "relative", zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Button
            startIcon={<ArrowLeft size={18} />}
            onClick={() => navigate("/")}
            sx={{
              mb: 3,
              color: "text.secondary",
              fontWeight: 850,
              borderRadius: 1,
            }}
          >
            {t("backBtn")}
          </Button>
        </motion.div>

        <Grid container spacing={3} alignItems="stretch">
          <Grid item xs={12} lg={7}>
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <Stack spacing={3}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: { xs: 64, md: 76 },
                      height: { xs: 64, md: 76 },
                      borderRadius: 2,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: alpha(theme.palette.background.paper, 0.86),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                      boxShadow: `0 18px 45px ${alpha(theme.palette.primary.main, 0.14)}`,
                    }}
                  >
                    <Box
                      component="img"
                      src={logo}
                      alt="MorphoCheck Pro"
                      sx={{ width: "82%", height: "82%" }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 950 }}>
                      MorphoCheck Pro
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={800}>
                      Ilmiy antropometriya, somatotip va raqamli risk tahlili
                    </Typography>
                  </Box>
                </Stack>

                <Typography
                  variant="h1"
                  sx={{
                    maxWidth: 980,
                    fontWeight: 950,
                    letterSpacing: 0,
                    lineHeight: 0.98,
                    fontSize: { xs: "2.45rem", sm: "3.5rem", md: "5.2rem" },
                  }}
                >
                  Morfofunksional tahlilning professional batafsil xaritasi
                </Typography>

                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ maxWidth: 860, lineHeight: 1.65, fontWeight: 500 }}
                >
                  Z-Score, Xit-Karter somatotipi, HMAI, MII, ADI va MCRI indekslari bitta konseptual
                  modelga birlashadi: norma, uyg'unlik, moslashuv, nomutanosiblik va metabolik risk
                  alohida emas, tizimli klinik profil sifatida baholanadi.
                </Typography>

                <Grid container spacing={1.5}>
                  {clinicalLayers.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Grid item xs={6} md={3} key={item.title}>
                        <motion.div
                          custom={0.1 + index * 0.06}
                          initial="hidden"
                          animate="visible"
                          variants={fadeUp}
                        >
                          <GlassPanel sx={{ p: 2 }} hover={false}>
                            <Stack spacing={1.2}>
                              <Icon size={23} color={item.color} />
                              <Typography variant="caption" color="text.secondary" fontWeight={850}>
                                {item.title}
                              </Typography>
                              <Typography variant="h6" fontWeight={950} sx={{ color: item.color }}>
                                {item.value}
                              </Typography>
                            </Stack>
                          </GlassPanel>
                        </motion.div>
                      </Grid>
                    );
                  })}
                </Grid>
              </Stack>
            </motion.div>
          </Grid>

          <Grid item xs={12} lg={5}>
            <motion.div custom={0.18} initial="hidden" animate="visible" variants={fadeUp}>
              <GlassPanel hover={false}>
                <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <Box>
                      <Typography
                        variant="overline"
                        sx={{ color: "primary.main", fontWeight: 950 }}
                      >
                        Composite profile
                      </Typography>
                      <Typography variant="h4" fontWeight={950}>
                        Indekslar paneli
                      </Typography>
                    </Box>
                    <Chip
                      icon={<Sparkles size={16} />}
                      label="Pro"
                      sx={{
                        borderRadius: 1,
                        fontWeight: 900,
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                      }}
                    />
                  </Stack>
                  <IndexRadar />
                  <FlowDiagram />
                </Box>
              </GlassPanel>
            </motion.div>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: { xs: 3, md: 5 } }}>
          <Grid item xs={12} md={6}>
            <motion.div
              custom={0.08}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <GlassPanel>
                <Box sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <BarChart3 color="#0ea5e9" />
                    <Typography variant="h4" fontWeight={950}>
                      Z-Score tahlili
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Z-score bolani faqat "normal" yoki "normal emas" deb ajratmaydi. U o'sish
                    trayektoriyasidagi aniq masofani ko'rsatadi, shuning uchun skrining, dinamik
                    monitoring va xavf guruhlarini ajratishda asosiy ilmiy o'lchov bo'lib xizmat
                    qiladi.
                  </Typography>
                  <ZScoreScale />
                </Box>
              </GlassPanel>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <motion.div
              custom={0.16}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <GlassPanel>
                <Box sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <LineChart color="#16a34a" />
                    <Typography variant="h4" fontWeight={950}>
                      Xit-Karter somatotipi
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Somatotip endomorfiya, mezomorfiya va ektomorfiya nisbatini ko'rsatadi.
                    MorphoCheck bu uch komponentni tana tarkibi va Z-score bilan solishtirib,
                    fenotipning klinik izohini aniqroq qiladi.
                  </Typography>
                  <SomatoTriangle />
                </Box>
              </GlassPanel>
            </motion.div>
          </Grid>
        </Grid>

        <Box sx={{ mt: { xs: 4, md: 6 } }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
            <Microscope color={theme.palette.primary.main} />
            <Box>
              <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 950 }}>
                Author indices
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 950, lineHeight: 1.05 }}>
                HMAI, MII, ADI va MCRI bo'yicha chuqurlashtirilgan ilmiy blok
              </Typography>
            </Box>
          </Stack>

          <Grid container spacing={3}>
            {indexCards.map((item, index) => (
              <Grid item xs={12} lg={6} key={item.key}>
                <IndexDeepCard item={item} index={index} />
              </Grid>
            ))}
          </Grid>
        </Box>

        <Grid container spacing={3} sx={{ mt: { xs: 4, md: 6 } }}>
          <Grid item xs={12} lg={7}>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <GlassPanel>
                <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <TrendingUp color="#8b5cf6" />
                    <Typography variant="h4" fontWeight={950}>
                      MorphoCheck Risk Score konsepsiyasi
                    </Typography>
                  </Stack>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2.5 }}>
                    Platforma yakuniy talqinni bitta indeksga qamab qo'ymaydi. MCRI riskni oshiradi,
                    ADI nomutanosiblikni kuchaytiradi, MII va HMAI esa uyg'unlik hamda adaptatsiya
                    himoya omili sifatida qaraladi.
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: alpha("#8b5cf6", 0.1),
                      border: `1px solid ${alpha("#8b5cf6", 0.18)}`,
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      fontWeight: 900,
                      color: "#8b5cf6",
                      overflowWrap: "anywhere",
                    }}
                  >
                    MC-Score = w1 x MCRI - w2 x MII - w3 x HMAI + w4 x ADI
                  </Box>
                  <Grid container spacing={1.5} sx={{ mt: 2 }}>
                    {[
                      ["MCRI yuqori", "risk ortadi", "#dc2626"],
                      ["ADI yuqori", "disgarmoniya ko'payadi", "#f97316"],
                      ["MII yuqori", "uyg'unlik himoya qiladi", "#16a34a"],
                      ["HMAI yuqori", "adaptatsiya kuchli", "#0ea5e9"],
                    ].map(([title, desc, color]) => (
                      <Grid item xs={12} sm={6} key={title}>
                        <Box sx={{ p: 1.6, borderRadius: 1, bgcolor: alpha(color, 0.09) }}>
                          <Typography variant="subtitle2" fontWeight={950} sx={{ color }}>
                            {title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontWeight={800}>
                            {desc}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </GlassPanel>
            </motion.div>
          </Grid>

          <Grid item xs={12} lg={5}>
            <motion.div
              custom={0.12}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <GlassPanel>
                <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <HeartPulse color="#dc2626" />
                    <Typography variant="h4" fontWeight={950}>
                      Klinik qaror zanjiri
                    </Typography>
                  </Stack>
                  <Stack spacing={1.5}>
                    {[
                      "O'lchovlar validatsiyasi va yosh-jins normasi bilan solishtirish",
                      "Somatotip, tana tarkibi va Z-score kesishmasini aniqlash",
                      "HMAI/MII/ADI/MCRI orqali adaptiv, strukturaviy va risk profilini chiqarish",
                      "Skrining xulosasi, monitoring yo'nalishi va profilaktik tavsiyalarni shakllantirish",
                    ].map((text, index) => (
                      <Stack key={text} direction="row" spacing={1.5} alignItems="flex-start">
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: 1,
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            color: "primary.main",
                            fontWeight: 950,
                          }}
                        >
                          {index + 1}
                        </Box>
                        <Typography variant="body2" color="text.secondary" fontWeight={750}>
                          {text}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </GlassPanel>
            </motion.div>
          </Grid>
        </Grid>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <GlassPanel sx={{ mt: { xs: 4, md: 6 } }} hover={false}>
            <Box
              sx={{
                p: { xs: 2.5, md: 4 },
                display: "flex",
                gap: 3,
                alignItems: { xs: "stretch", md: "center" },
                justifyContent: "space-between",
                flexDirection: { xs: "column", md: "row" },
              }}
            >
              <Box>
                <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 950 }}>
                  Ready for analysis
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 950, mb: 1 }}>
                  Tahlilni amaliy natijaga aylantiring
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 760 }}>
                  MorphoCheck Pro ilmiy formulalarni shifokor, tadqiqotchi va administrator uchun
                  o'qilishi oson, eksport qilinadigan va kuzatib boriladigan raqamli hisobotga
                  aylantiradi.
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="large"
                startIcon={<Zap size={20} />}
                onClick={() => navigate("/morphocheck-pro")}
                sx={{
                  alignSelf: { xs: "stretch", md: "center" },
                  px: 4,
                  py: 1.6,
                  borderRadius: 1,
                  fontWeight: 950,
                  boxShadow: `0 18px 36px ${alpha(theme.palette.primary.main, 0.26)}`,
                }}
              >
                {t("tryNow")}
              </Button>
            </Box>
          </GlassPanel>
        </motion.div>
      </Container>
    </Box>
  );
}

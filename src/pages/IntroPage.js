// src/pages/IntroPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform, useSpring } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ShieldCheck,
  FileText,
  Mail,
  Phone,
  Sparkles,
  ArrowRight,
  Zap,
  BarChart3,
  GraduationCap,
  Cpu,
  Fingerprint,
  Bot,
  CheckCircle2,
  Globe,
  Award,
  Microscope,
  Stethoscope,
} from "lucide-react";
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  Grid,
  Paper,
  useTheme,
  useMediaQuery,
  alpha,
  Stack,
} from "@mui/material";
import { useThemeMode } from "../providers/ThemeProviderMUI";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";

// --- Advanced Holographic Body Component ---
const TechRing = ({ size, duration, delay, opacity = 0.2, dash = "5, 5" }) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    style={{ position: "absolute", zIndex: 0 }}
    animate={{ rotate: 360 }}
    transition={{ duration, repeat: Infinity, ease: "linear", delay }}
  >
    <circle
      cx="50"
      cy="50"
      r="48"
      stroke="currentColor"
      strokeWidth="0.5"
      fill="none"
      strokeDasharray={dash}
      style={{ opacity }}
    />
  </motion.svg>
);

const BodySilhouette = ({ color, size = 180 }) => (
  <Box
    sx={{
      position: "relative",
      width: size,
      height: size * 1.5,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {/* Tech HUD Background Rings */}
    <Box
      sx={{
        color,
        position: "absolute",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
      }}
    >
      <TechRing size={size * 1.8} duration={20} delay={0} opacity={0.15} />
      <TechRing size={size * 1.4} duration={15} delay={-2} opacity={0.1} dash="10, 10" />
      <TechRing size={size * 1.1} duration={25} delay={-5} opacity={0.05} dash="2, 4" />
    </Box>

    <svg
      width={size}
      height={size * 1.5}
      viewBox="0 0 100 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: "relative", zIndex: 1 }}
    >
      <defs>
        <filter id="glow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="50%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="bodyFillGrad" x1="0" y1="8" x2="0" y2="104">
          <stop offset="0%" stopColor={color} stopOpacity="0.34" />
          <stop offset="48%" stopColor={color} stopOpacity="0.16" />
          <stop offset="100%" stopColor={color} stopOpacity="0.28" />
        </linearGradient>
      </defs>

      {/* Silhouette Body */}
      <g
        stroke={color}
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
      >
        <motion.path
          d="
            M50 6
            C44.7 6 40.8 10.1 40.8 15.2
            C40.8 20 44.1 23.8 48.2 24.8
            L48.2 28.2
            C43.8 28.7 40.1 30.3 37.4 33.6
            C34.2 37.5 32.3 43.4 30.3 50.4
            C28.9 55.4 27.5 60.8 25.5 65.7
            C24.7 67.6 25.4 69.5 27.1 70.1
            C28.8 70.7 30.3 69.7 31.2 67.9
            C34.4 61.2 36.3 54.7 38.5 47.1
            L39.7 61.4
            C40.1 66.3 41.5 70.2 43.5 73.1
            L41.1 101
            C40.9 103.9 42.7 106 45.1 106
            C47.4 106 48.9 104.4 49.4 101.9
            L51 78.1
            L52.6 101.9
            C53.1 104.4 54.6 106 56.9 106
            C59.3 106 61.1 103.9 60.9 101
            L58.5 73.1
            C60.5 70.2 61.9 66.3 62.3 61.4
            L63.5 47.1
            C65.7 54.7 67.6 61.2 70.8 67.9
            C71.7 69.7 73.2 70.7 74.9 70.1
            C76.6 69.5 77.3 67.6 76.5 65.7
            C74.5 60.8 73.1 55.4 71.7 50.4
            C69.7 43.4 67.8 37.5 64.6 33.6
            C61.9 30.3 58.2 28.7 53.8 28.2
            L53.8 24.8
            C57.9 23.8 61.2 20 61.2 15.2
            C61.2 10.1 55.3 6 50 6
            Z
          "
          fill="url(#bodyFillGrad)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.96 }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
        />
        <motion.path
          d="M37.8 36.5 C43.3 39.4 56.7 39.4 62.2 36.5 M39.8 61.4 C45.4 64.5 56.6 64.5 62.2 61.4 M43.5 73.1 C47.8 75.5 54.2 75.5 58.5 73.1"
          fill="none"
          strokeWidth="0.8"
          opacity="0.62"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.62 }}
          transition={{ duration: 1.5, delay: 0.45, ease: "easeInOut" }}
        />
        <motion.path
          d="M50 28.8 V73.8 M38.5 47.1 H63.5 M41.1 101 H60.9"
          fill="none"
          strokeWidth="0.5"
          strokeDasharray="2 2"
          opacity="0.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.5 }}
        />
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.76 }}
          transition={{ delay: 1, duration: 0.7 }}
        >
          <path d="M29 34 H71" strokeWidth="0.45" strokeDasharray="1.5 2.5" />
          <path d="M33 61 H67" strokeWidth="0.45" strokeDasharray="1.5 2.5" />
          <path d="M40 77 H62" strokeWidth="0.45" strokeDasharray="1.5 2.5" />
          <path d="M25 70 L32 70 M68 70 L75 70" strokeWidth="0.45" />
          <path d="M45 106 H57" strokeWidth="0.45" />
        </motion.g>
      </g>

      {/* Horizontal Scanning Line */}
      <motion.g
        animate={{ y: [10, 100, 10] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect
          x="10"
          y="0"
          width="80"
          height="1.5"
          fill={color}
          style={{ filter: "blur(1px)", opacity: 0.9 }}
        />
        <rect
          x="15"
          y="-12"
          width="70"
          height="12"
          fill="url(#scanGrad)"
          style={{ opacity: 0.3 }}
        />
      </motion.g>

      {/* Bio-Analysis Nodes */}
      {[
        { x: 50, y: 15, label: "Cranial" },
        { x: 50, y: 39, label: "Thorax" },
        { x: 31, y: 58, label: "Arm" },
        { x: 69, y: 58, label: "Arm" },
        { x: 44, y: 76, label: "Femur" },
        { x: 56, y: 76, label: "Femur" },
      ].map((node, i) => (
        <motion.g key={i} transform={`translate(${node.x}, ${node.y})`}>
          <circle r="1.7" fill="#fff" />
          <motion.circle
            r="4.8"
            stroke={color}
            strokeWidth="0.3"
            animate={{ scale: [1, 2.5, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
          />
          {/* Node Callout Text */}
          <motion.text
            x="8"
            y="2"
            fill={color}
            fontSize="3"
            fontWeight="bold"
            style={{ opacity: 0.4, pointerEvents: "none" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: i * 0.8 }}
          >
            {node.label}
          </motion.text>
        </motion.g>
      ))}

      {/* Background Particles/Grid */}
      {[...Array(15)].map((_, i) => (
        <motion.circle
          key={`p-${i}`}
          cx={Math.random() * 100}
          cy={Math.random() * 110}
          r="0.4"
          fill={color}
          animate={{ opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 2 + Math.random() * 3, repeat: Infinity }}
        />
      ))}
    </svg>
  </Box>
);

const storySteps = [
  {
    eyebrow: "01 / Collect",
    title: "Ma'lumotlar bir joyga yig'iladi",
    desc: "Antropometrik o'lchovlar, hudud va yosh guruhlari klinik tahlilga tayyor holatga keladi.",
    metric: "140+",
    label: "data signal",
    color: "#0891b2",
    icon: Fingerprint,
  },
  {
    eyebrow: "02 / Analyze",
    title: "WHO LMS va Z-score avtomatik ishlaydi",
    desc: "Tizim HAZ, BAZ va SDS ko'rsatkichlarini real vaqt rejimida hisoblab, risk signallarini ajratadi.",
    metric: "98.4%",
    label: "analysis sync",
    color: "#16a34a",
    icon: Activity,
  },
  {
    eyebrow: "03 / Map",
    title: "Hududiy holat scroll bilan jonlanadi",
    desc: "Xarita qatlami viloyatlar kesimida klinik monitoring signalini ko'rsatadi.",
    metric: "14",
    label: "regional layers",
    color: "#ca8a04",
    icon: Globe,
  },
  {
    eyebrow: "04 / Report",
    title: "Natija hisobotga aylanadi",
    desc: "Shifokor, admin va researcher uchun tayyor tahliliy ko'rinish va eksport yo'llari ochiladi.",
    metric: "PDF",
    label: "ready report",
    color: "#7c3aed",
    icon: FileText,
  },
];

const mapRegions = [
  { name: "Nukus", x: 90, y: 112, w: 178, h: 92, color: "#0891b2" },
  { name: "Xorazm", x: 232, y: 206, w: 90, h: 54, color: "#16a34a" },
  { name: "Buxoro", x: 336, y: 238, w: 150, h: 86, color: "#ca8a04" },
  { name: "Navoiy", x: 430, y: 152, w: 168, h: 102, color: "#7c3aed" },
  { name: "Samarqand", x: 532, y: 292, w: 108, h: 58, color: "#0891b2" },
  { name: "Qashqadaryo", x: 498, y: 370, w: 122, h: 72, color: "#16a34a" },
  { name: "Surxondaryo", x: 594, y: 438, w: 92, h: 74, color: "#ca8a04" },
  { name: "Jizzax", x: 646, y: 252, w: 96, h: 58, color: "#7c3aed" },
  { name: "Toshkent", x: 746, y: 200, w: 128, h: 62, color: "#0891b2" },
  { name: "Farg'ona", x: 846, y: 272, w: 92, h: 46, color: "#16a34a" },
  { name: "Andijon", x: 930, y: 246, w: 72, h: 42, color: "#ca8a04" },
  { name: "Namangan", x: 884, y: 198, w: 76, h: 40, color: "#7c3aed" },
];

const ScrollProgress = ({ progress, color }) => (
  <motion.div
    style={{
      scaleX: progress,
      transformOrigin: "0% 50%",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      backgroundColor: color,
      boxShadow: `0 0 18px ${alpha(color, 0.55)}`,
      zIndex: 2000,
      pointerEvents: "none",
    }}
    aria-hidden="true"
    className="scroll-progress"
  />
);

const UzbekistanSignalMap = ({ activeIndex, theme, mode }) => (
  <Box
    sx={{
      position: "relative",
      minHeight: { xs: 320, md: 520 },
      borderRadius: "24px",
      p: { xs: 2, md: 3 },
      overflow: "hidden",
      bgcolor: alpha(theme.palette.background.paper, mode === "dark" ? 0.5 : 0.78),
      border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
      boxShadow: `0 24px 70px ${alpha(theme.palette.common.black, mode === "dark" ? 0.34 : 0.1)}`,
      backdropFilter: "blur(22px)",
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
      <Box>
        <Typography variant="overline" color="text.secondary" fontWeight={900}>
          Regional signal map
        </Typography>
        <Typography variant="h5" fontWeight={900}>
          O'zbekiston bo'yicha monitoring
        </Typography>
      </Box>
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          bgcolor: storySteps[activeIndex].color,
          boxShadow: `0 0 0 8px ${alpha(storySteps[activeIndex].color, 0.14)}`,
        }}
      />
    </Stack>

    <Box
      component="svg"
      viewBox="0 0 1080 620"
      sx={{
        width: "100%",
        height: { xs: 260, md: 420 },
        display: "block",
        color: "text.primary",
      }}
      role="img"
      aria-label="MorphoCheck regional scroll map"
    >
      <defs>
        <filter id="mapGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="9" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <path
        d="M54 164 C142 78 260 90 362 126 C478 166 560 104 682 128 C804 152 892 130 1012 216 C1048 242 1042 316 1002 346 C930 400 798 360 720 422 C642 484 534 540 428 488 C330 440 302 336 202 304 C104 274 18 234 54 164 Z"
        fill={alpha(theme.palette.primary.main, mode === "dark" ? 0.1 : 0.08)}
        stroke={alpha(theme.palette.text.primary, 0.18)}
        strokeWidth="2"
      />
      {mapRegions.map((region, index) => {
        const isActive = index % storySteps.length === activeIndex;
        return (
          <motion.g
            key={region.name}
            animate={{
              opacity: isActive ? 1 : 0.48,
              scale: isActive ? 1.04 : 1,
            }}
            transition={{ duration: 0.45 }}
            style={{ transformOrigin: `${region.x + region.w / 2}px ${region.y + region.h / 2}px` }}
          >
            <rect
              x={region.x}
              y={region.y}
              width={region.w}
              height={region.h}
              rx="26"
              fill={alpha(region.color, isActive ? 0.72 : 0.22)}
              stroke={isActive ? "#fff" : alpha(theme.palette.text.primary, 0.22)}
              strokeWidth={isActive ? 4 : 1.5}
              filter={isActive ? "url(#mapGlow)" : undefined}
            />
            <text
              x={region.x + region.w / 2}
              y={region.y + region.h / 2 + 4}
              textAnchor="middle"
              fontSize="18"
              fontWeight="800"
              fill={isActive ? "#fff" : theme.palette.text.secondary}
            >
              {region.name}
            </text>
          </motion.g>
        );
      })}
      {[0, 1, 2, 3].map((item) => (
        <motion.circle
          key={item}
          cx={220 + item * 210}
          cy={92 + (item % 2) * 34}
          r="8"
          fill={storySteps[activeIndex].color}
          animate={{ opacity: [0.25, 0.9, 0.25], r: [6, 11, 6] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: item * 0.28 }}
        />
      ))}
    </Box>

    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
      {storySteps.map((step, index) => (
        <Box
          key={step.eyebrow}
          sx={{
            flex: 1,
            height: 8,
            borderRadius: 4,
            bgcolor: index <= activeIndex ? step.color : alpha(theme.palette.text.primary, 0.12),
            transition: "background-color 0.35s ease",
          }}
        />
      ))}
    </Stack>
  </Box>
);

const StickyScrollStory = ({ theme, mode, fadeInUp }) => {
  const sectionRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start center", "end center"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const nextIndex = Math.min(
      storySteps.length - 1,
      Math.max(0, Math.floor(latest * storySteps.length)),
    );
    setActiveIndex(nextIndex);
  });

  return (
    <Box
      ref={sectionRef}
      sx={{
        py: { xs: 10, md: 18 },
        position: "relative",
        zIndex: 10,
        bgcolor: alpha(theme.palette.background.paper, mode === "dark" ? 0.12 : 0.28),
      }}
    >
      <Container maxWidth="lg">
        <motion.div {...fadeInUp}>
          <Typography variant="h2" fontWeight="900" gutterBottom letterSpacing={0}>
            Klinik tahlildan hududiy monitoringgacha
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 760, mb: 8 }}>
            MorphoCheck Pro o'lchovlarni tahlil qiladi, risk signallarini ajratadi va natijani
            hududlar kesimida tushunarli ko'rinishga olib keladi.
          </Typography>
        </motion.div>

        <Grid container spacing={{ xs: 4, md: 7 }} alignItems="flex-start">
          <Grid item xs={12} md={5}>
            <Stack spacing={{ xs: 2, md: 6 }}>
              {storySteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeIndex === index;
                return (
                  <motion.div
                    key={step.eyebrow}
                    initial={{ opacity: 0, y: 26 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-10% 0px" }}
                    transition={{ duration: 0.55, delay: index * 0.08 }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "48px minmax(0, 1fr)",
                        gap: 2,
                        p: { xs: 2, md: 2.5 },
                        borderRadius: "18px",
                        border: `1px solid ${
                          isActive
                            ? alpha(step.color, 0.55)
                            : alpha(theme.palette.text.primary, 0.1)
                        }`,
                        bgcolor: isActive
                          ? alpha(step.color, mode === "dark" ? 0.14 : 0.08)
                          : "transparent",
                        transition: "all 0.35s ease",
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: "14px",
                          display: "grid",
                          placeItems: "center",
                          bgcolor: alpha(step.color, isActive ? 0.18 : 0.1),
                          color: step.color,
                        }}
                      >
                        <Icon size={22} />
                      </Box>
                      <Box>
                        <Typography variant="overline" fontWeight={900} sx={{ color: step.color }}>
                          {step.eyebrow}
                        </Typography>
                        <Typography variant="h5" fontWeight={900} gutterBottom>
                          {step.title}
                        </Typography>
                        <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                          {step.desc}
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>
                );
              })}
            </Stack>
          </Grid>

          <Grid item xs={12} md={7}>
            <Box sx={{ position: { md: "sticky" }, top: { md: 96 } }}>
              <UzbekistanSignalMap activeIndex={activeIndex} theme={theme} mode={mode} />
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {storySteps.map((step, index) => (
                  <Grid item xs={6} sm={3} key={step.label}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: "16px",
                        border: `1px solid ${alpha(step.color, activeIndex === index ? 0.48 : 0.14)}`,
                        bgcolor: alpha(
                          step.color,
                          activeIndex === index ? (mode === "dark" ? 0.16 : 0.08) : 0.03,
                        ),
                      }}
                    >
                      <Typography variant="h5" fontWeight={900} sx={{ color: step.color }}>
                        {step.metric}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={800}>
                        {step.label}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default function IntroPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const { t } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const yParallax = useTransform(scrollYProgress, [0, 0.5], [0, -100]);

  useEffect(() => {
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [mode]);

  const styles = {
    heroGradient: {
      background: `linear-gradient(to right, 
        ${theme.palette.primary.main}, #0891b2, #0f766e, #ca8a04, ${theme.palette.primary.main})`,
      backgroundSize: "200% auto",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      fontWeight: 900,
      animation: "slowRainbow 12s linear infinite",
      "@keyframes slowRainbow": {
        "0%": { backgroundPosition: "0% 50%" },
        "50%": { backgroundPosition: "100% 50%" },
        "100%": { backgroundPosition: "0% 50%" },
      },
    },
    premiumCard: {
      background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, mode === "dark" ? 0.55 : 0.82)} 0%, ${alpha(theme.palette.background.default, mode === "dark" ? 0.32 : 0.62)} 100%)`,
      backdropFilter: "blur(28px) saturate(180%)",
      WebkitBackdropFilter: "blur(28px) saturate(180%)",
      border: `1px solid ${alpha(theme.palette.primary.main, mode === "dark" ? 0.2 : 0.14)}`,
      borderRadius: "24px",
      boxShadow: `0 24px 70px ${alpha(theme.palette.common.black, mode === "dark" ? 0.36 : 0.12)}`,
      transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
      overflow: "hidden",
      "&:hover": {
        transform: "translateY(-8px)",
        boxShadow: `0 30px 90px ${alpha(theme.palette.common.black, mode === "dark" ? 0.5 : 0.16)}`,
        borderColor: alpha(theme.palette.primary.main, 0.36),
      },
    },
    actionButton: {
      borderRadius: "14px",
      padding: "14px 28px",
      fontSize: "1.02rem",
      fontWeight: "800",
      textTransform: "none",
      letterSpacing: 0,
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: "none",
      "&:hover": { transform: "translateY(-2px)" },
    },
    glassChip: {
      px: 2,
      py: 0.8,
      borderRadius: "100px",
      bgcolor: alpha(theme.palette.primary.main, 0.1),
      color: theme.palette.primary.main,
      fontWeight: "800",
      fontSize: "0.8rem",
      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
      backdropFilter: "blur(10px)",
      display: "inline-flex",
      alignItems: "center",
      gap: 1,
      mb: 3,
    },
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: "easeOut" },
  };

  const reportMetrics = [
    { label: "HAZ", value: "+0.42", helper: "Height-for-age", color: "#0891b2" },
    { label: "BAZ", value: "-0.18", helper: "BMI-for-age", color: "#16a34a" },
    { label: "SDS", value: "0.96", helper: "Norm interval", color: "#ca8a04" },
  ];

  const qualityStats = [
    { label: "Accuracy", val: "99.9%", icon: Activity, color: "#10b981" },
    { label: "Data Points", val: "140+", icon: Fingerprint, color: "#0891b2" },
  ];

  return (
    <Box sx={{ minHeight: "100vh", position: "relative" }}>
      <ScrollProgress progress={smoothProgress} color={theme.palette.primary.main} />

      {/* Hero Section */}
      <Box sx={{ position: "relative", zIndex: 10 }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              py: { xs: 10, md: 0 },
            }}
          >
            <Grid container spacing={{ xs: 4, md: 8 }} alignItems="center">
              <Grid item xs={12} md={6} lg={7}>
                <motion.div style={{ opacity, scale, y: yParallax }}>
                  <motion.div
                    initial={{ opacity: 0, x: -60 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, ease: "circOut" }}
                  >
                    <Box sx={styles.glassChip}>
                      <Sparkles size={16} />
                      {t("newEra")}
                    </Box>

                    <Typography
                      variant="h1"
                      sx={{
                        fontSize: { xs: "2.45rem", sm: "3.7rem", md: "5.2rem", lg: "6rem" },
                        fontWeight: 900,
                        mb: 3,
                        lineHeight: 1.02,
                        letterSpacing: 0,
                        color: "text.primary",
                      }}
                    >
                      {t("heroTitle1")}
                      <Box
                        component="span"
                        sx={styles.heroGradient}
                        display={{ xs: "inline", sm: "block" }}
                      >
                        {" "}
                        {t("heroTitle2")}
                      </Box>
                    </Typography>

                    <Typography
                      variant="h5"
                      sx={{
                        color: "text.secondary",
                        mb: 4,
                        maxWidth: { xs: "100%", sm: "95%", md: "650px" },
                        lineHeight: 1.7,
                        fontWeight: 500,
                        fontSize: { xs: "1.1rem", md: "1.35rem" },
                      }}
                    >
                      {t("heroDesc")}
                    </Typography>

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1.5}
                      sx={{ mb: 5, maxWidth: 680 }}
                    >
                      {[
                        { icon: ShieldCheck, text: "WHO standartlari" },
                        { icon: BarChart3, text: "Z-score monitoring" },
                        { icon: Microscope, text: "AI klinik tahlil" },
                      ].map((item) => (
                        <Box
                          key={item.text}
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 1,
                            px: 1.6,
                            py: 1,
                            borderRadius: "12px",
                            color: "text.primary",
                            bgcolor: alpha(
                              theme.palette.background.paper,
                              mode === "dark" ? 0.22 : 0.62,
                            ),
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                            backdropFilter: "blur(14px)",
                          }}
                        >
                          <item.icon size={17} color={theme.palette.primary.main} />
                          <Typography variant="caption" fontWeight={800}>
                            {item.text}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5}>
                      <Button
                        variant="contained"
                        onClick={() =>
                          navigate(user?.role === "researcher" ? "/researcher" : "/morphocheck-pro")
                        }
                        sx={{
                          ...styles.actionButton,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #0891b2 100%)`,
                          boxShadow: `0 14px 34px ${alpha(theme.palette.primary.main, 0.28)}`,
                        }}
                        startIcon={<Zap size={22} />}
                      >
                        {t("enterSystem")}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => navigate("/info")}
                        sx={{
                          ...styles.actionButton,
                          borderWidth: "2px",
                          borderColor: alpha(theme.palette.text.primary, 0.14),
                          color: "text.primary",
                          "&:hover": {
                            borderWidth: "2px",
                            borderColor: theme.palette.primary.main,
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                          },
                        }}
                      >
                        {t("details")}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => navigate("/author")}
                        startIcon={<GraduationCap size={18} />}
                        sx={{
                          ...styles.actionButton,
                          borderWidth: "2px",
                          borderColor: alpha("#0f766e", 0.35),
                          color: "#0f766e",
                          "&:hover": {
                            borderWidth: "2px",
                            borderColor: "#0f766e",
                            bgcolor: alpha("#0f766e", 0.07),
                            boxShadow: `0 0 20px ${alpha("#0f766e", 0.18)}`,
                          },
                        }}
                      >
                        Avtor haqida
                      </Button>
                    </Stack>
                  </motion.div>
                </motion.div>
              </Grid>

              <Grid item xs={12} md={6} lg={5}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ duration: 1.2, ease: "backOut" }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        inset: -40,
                        background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.25)} 0%, transparent 70%)`,
                        filter: "blur(60px)",
                        zIndex: -1,
                      },
                    }}
                  >
                    <Card sx={styles.premiumCard}>
                      <CardContent sx={{ p: { xs: 2.5, sm: 4, md: 4.5 } }}>
                        <Stack spacing={4}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: 2,
                            }}
                          >
                            <Box>
                              <Typography
                                variant="overline"
                                sx={{
                                  color: "primary.main",
                                  fontWeight: 900,
                                  letterSpacing: 1.6,
                                  lineHeight: 1,
                                }}
                              >
                                Clinical dashboard
                              </Typography>
                              <Typography
                                variant="h4"
                                fontWeight="900"
                                letterSpacing={0}
                                sx={{ mt: 0.6 }}
                              >
                                {t("liveReport")}
                              </Typography>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  mt: 1,
                                  fontWeight: 700,
                                  color: "text.secondary",
                                }}
                              >
                                <Bot size={18} color={theme.palette.primary.main} /> AI ENGINE
                                ACTIVE
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box
                                sx={{
                                  px: 1.4,
                                  py: 0.8,
                                  borderRadius: "999px",
                                  bgcolor: alpha("#16a34a", 0.1),
                                  border: `1px solid ${alpha("#16a34a", 0.24)}`,
                                  color: "#16a34a",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.8,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    bgcolor: "#16a34a",
                                    boxShadow: `0 0 14px ${alpha("#16a34a", 0.8)}`,
                                  }}
                                />
                                <Typography variant="caption" fontWeight={900}>
                                  LIVE
                                </Typography>
                              </Box>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                              >
                                <Cpu
                                  color={theme.palette.primary.main}
                                  size={34}
                                  strokeWidth={1.5}
                                />
                              </motion.div>
                            </Stack>
                          </Box>

                          <Box
                            sx={{
                              minHeight: { xs: 430, sm: 420, md: 390 },
                              bgcolor: alpha(
                                theme.palette.text.primary,
                                mode === "dark" ? 0.03 : 0.018,
                              ),
                              borderRadius: "18px",
                              position: "relative",
                              overflow: "hidden",
                              display: "grid",
                              gridTemplateColumns: { xs: "1fr", sm: "1fr 1.25fr" },
                              alignItems: "stretch",
                              gap: 2,
                              p: { xs: 2, sm: 2.5 },
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                              backgroundImage: `linear-gradient(${alpha(theme.palette.primary.main, 0.04)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.035)} 1px, transparent 1px), radial-gradient(circle at 80% 20%, ${alpha("#0891b2", 0.14)}, transparent 38%)`,
                              backgroundSize: "20px 20px",
                            }}
                          >
                            {/* Corner Accents */}
                            {[
                              { top: 12, left: 12, borderLeft: 2, borderTop: 2 },
                              { top: 12, right: 12, borderRight: 2, borderTop: 2 },
                              { bottom: 12, left: 12, borderLeft: 2, borderBottom: 2 },
                              { bottom: 12, right: 12, borderRight: 2, borderBottom: 2 },
                            ].map((corner, i) => (
                              <Box
                                key={i}
                                sx={{
                                  position: "absolute",
                                  width: 20,
                                  height: 20,
                                  borderColor: alpha(theme.palette.primary.main, 0.4),
                                  ...corner,
                                }}
                              />
                            ))}

                            {/* Scanning Line with Glow */}
                            <motion.div
                              animate={{ top: ["-10%", "110%"] }}
                              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                              style={{
                                position: "absolute",
                                left: 0,
                                width: "100%",
                                height: "2px",
                                background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}, transparent)`,
                                boxShadow: `0 0 20px ${theme.palette.primary.main}`,
                                zIndex: 5,
                                opacity: 0.6,
                              }}
                            />

                            <Stack spacing={1.4} sx={{ position: "relative", zIndex: 2 }}>
                              {reportMetrics.map((metric) => (
                                <Paper
                                  key={metric.label}
                                  elevation={0}
                                  sx={{
                                    p: 1.6,
                                    borderRadius: "14px",
                                    bgcolor: alpha(
                                      theme.palette.background.paper,
                                      mode === "dark" ? 0.36 : 0.76,
                                    ),
                                    border: `1px solid ${alpha(metric.color, 0.18)}`,
                                    backdropFilter: "blur(16px)",
                                  }}
                                >
                                  <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                  >
                                    <Box>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        fontWeight={800}
                                      >
                                        {metric.helper}
                                      </Typography>
                                      <Typography
                                        variant="h5"
                                        fontWeight={900}
                                        sx={{ color: metric.color }}
                                      >
                                        {metric.value}
                                      </Typography>
                                    </Box>
                                    <Typography
                                      variant="overline"
                                      fontWeight={900}
                                      sx={{ color: metric.color }}
                                    >
                                      {metric.label}
                                    </Typography>
                                  </Stack>
                                </Paper>
                              ))}

                              <Paper
                                elevation={0}
                                sx={{
                                  p: 1.6,
                                  borderRadius: "14px",
                                  bgcolor: alpha(
                                    theme.palette.background.paper,
                                    mode === "dark" ? 0.32 : 0.7,
                                  ),
                                  border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
                                }}
                              >
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  spacing={1.2}
                                  sx={{ mb: 1.2 }}
                                >
                                  <Stethoscope size={18} color={theme.palette.primary.main} />
                                  <Typography
                                    variant="caption"
                                    fontWeight={900}
                                    color="text.secondary"
                                  >
                                    Protocol validation
                                  </Typography>
                                </Stack>
                                {["WHO LMS", "Somatotype", "AI advice"].map((label, i) => (
                                  <Stack
                                    key={label}
                                    direction="row"
                                    alignItems="center"
                                    spacing={1}
                                    sx={{ py: 0.25 }}
                                  >
                                    <CheckCircle2
                                      size={15}
                                      color={i === 2 ? "#ca8a04" : "#16a34a"}
                                    />
                                    <Typography variant="caption" fontWeight={800}>
                                      {label}
                                    </Typography>
                                  </Stack>
                                ))}
                              </Paper>
                            </Stack>

                            <Box
                              sx={{
                                position: "relative",
                                zIndex: 1,
                                textAlign: "center",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                minHeight: { xs: 260, sm: "auto" },
                              }}
                            >
                              <Box
                                sx={{
                                  position: "absolute",
                                  inset: { xs: 8, sm: 12 },
                                  borderRadius: "50%",
                                  background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.18)} 0%, transparent 62%)`,
                                  filter: "blur(8px)",
                                }}
                              />
                              <BodySilhouette
                                color={theme.palette.primary.main}
                                size={isMobile ? 128 : 155}
                              />
                              <motion.div
                                animate={{ opacity: [0.38, 0.78, 0.38] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                <Typography
                                  variant="overline"
                                  sx={{
                                    display: "block",
                                    mt: 1,
                                    letterSpacing: 2,
                                    fontWeight: 900,
                                    opacity: 0.72,
                                    color: theme.palette.primary.main,
                                  }}
                                >
                                  REAL-TIME ANALYSIS
                                </Typography>
                              </motion.div>
                            </Box>

                            {/* Technical Overlays (Side bars) */}
                            <Box
                              sx={{
                                position: "absolute",
                                left: 20,
                                top: "20%",
                                height: "60%",
                                width: "2px",
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                              }}
                            >
                              <motion.div
                                animate={{ height: ["10%", "90%", "10%"] }}
                                transition={{ duration: 5, repeat: Infinity }}
                                style={{
                                  width: "100%",
                                  background: theme.palette.primary.main,
                                  opacity: 0.5,
                                }}
                              />
                            </Box>

                            {/* Data Stream (Right side) */}
                            <Box
                              sx={{
                                position: "absolute",
                                right: 15,
                                top: 40,
                                bottom: 40,
                                width: 40,
                                overflow: "hidden",
                                opacity: 0.3,
                                display: { xs: "none", sm: "block" },
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: "6px",
                                  fontFamily: "monospace",
                                  display: "block",
                                  color: theme.palette.primary.main,
                                  lineHeight: 1,
                                }}
                              >
                                {[...Array(20)].map((_, i) => (
                                  <motion.span
                                    key={i}
                                    animate={{ opacity: [0.2, 1, 0.2] }}
                                    transition={{
                                      duration: 0.5 + Math.random(),
                                      repeat: Infinity,
                                      delay: Math.random(),
                                    }}
                                    style={{ display: "block" }}
                                  >
                                    {Math.random().toString(16).slice(2, 8).toUpperCase()}
                                  </motion.span>
                                ))}
                              </Typography>
                            </Box>

                            {/* Scan Progress Counter */}
                            <Box
                              sx={{
                                position: "absolute",
                                bottom: 20,
                                right: 25,
                                textAlign: "right",
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: "10px",
                                  fontWeight: 900,
                                  color: theme.palette.primary.main,
                                  opacity: 0.72,
                                }}
                              >
                                SCANNING...
                              </Typography>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontSize: "14px",
                                  fontWeight: 900,
                                  fontFamily: "monospace",
                                  color: theme.palette.primary.main,
                                }}
                              >
                                <motion.span
                                  animate={{ content: ["00%", "45%", "89%", "23%", "67%"] }} // Note: motion doesn't animate content easily without useMotionValue, but we can fake it with opacity/sequence
                                >
                                  98.4%
                                </motion.span>
                              </Typography>
                            </Box>
                          </Box>

                          <Grid container spacing={2.5}>
                            {qualityStats.map((stat, idx) => (
                              <Grid item xs={6} key={stat.label}>
                                <Paper
                                  elevation={0}
                                  sx={{
                                    p: 2.5,
                                    bgcolor: alpha(
                                      theme.palette.background.paper,
                                      mode === "dark" ? 0.32 : 0.62,
                                    ),
                                    border: `1px solid ${alpha(stat.color, 0.16)}`,
                                    borderRadius: "16px",
                                    "&:hover": {
                                      borderColor: stat.color,
                                      bgcolor: alpha(stat.color, 0.05),
                                    },
                                  }}
                                >
                                  <Stack direction="row" spacing={1.5} alignItems="center">
                                    <stat.icon size={20} color={stat.color} />
                                    <Box>
                                      <Typography
                                        variant="caption"
                                        fontWeight="800"
                                        sx={{ opacity: 0.6, display: "block", mb: 0.2 }}
                                      >
                                        {stat.label}
                                      </Typography>
                                      <Typography variant="h6" fontWeight="900">
                                        {stat.val}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Box>
                </motion.div>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* Trust Section */}
      <Box sx={{ py: 10, position: "relative", zIndex: 10 }}>
        <Container maxWidth="lg">
          <Typography
            variant="overline"
            sx={{
              display: "block",
              textAlign: "center",
              mb: 4,
              fontWeight: 900,
              letterSpacing: 2,
              color: "text.secondary",
            }}
          >
            {t("trustedBy")}
          </Typography>
          <Stack
            direction="row"
            spacing={8}
            justifyContent="center"
            alignItems="center"
            sx={{
              opacity: 0.6,
              flexWrap: "wrap",
              "& svg": { filter: mode === "dark" ? "grayscale(1) invert(1)" : "grayscale(1)" },
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <ShieldCheck size={32} />
              <Typography variant="h6" fontWeight="900">
                ISO 27001
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Globe size={32} />
              <Typography variant="h6" fontWeight="900">
                WHO Standards
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Award size={32} />
              <Typography variant="h6" fontWeight="900">
                MedTech 2024
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 20, position: "relative", zIndex: 10 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 12 }}>
            <motion.div {...fadeInUp}>
              <Typography variant="h2" fontWeight="900" gutterBottom letterSpacing="-0.03em">
                {t("whyMorpho")}
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{
                  maxWidth: { xs: "95vw", sm: "90vw", md: "700px" },
                  mx: "auto",
                  fontWeight: 400,
                }}
              >
                {t("whyDesc")}
              </Typography>
            </motion.div>
          </Box>

          <Grid container spacing={4}>
            {[
              { icon: ShieldCheck, title: t("feat1Title"), desc: t("feat1Desc"), color: "#3b82f6" },
              { icon: Activity, title: t("feat2Title"), desc: t("feat2Desc"), color: "#10b981" },
              { icon: FileText, title: t("feat3Title"), desc: t("feat3Desc"), color: "#f59e0b" },
            ].map((feature, i) => (
              <Grid item xs={12} md={4} key={i}>
                <motion.div {...fadeInUp} transition={{ delay: i * 0.15 + 0.3 }}>
                  <Card sx={styles.premiumCard}>
                    <CardContent sx={{ p: 5 }}>
                      <Box
                        sx={{
                          mb: 4,
                          p: 2.5,
                          display: "inline-flex",
                          borderRadius: "20px",
                          bgcolor: alpha(feature.color, 0.1),
                          color: feature.color,
                        }}
                      >
                        <feature.icon size={40} strokeWidth={1.5} />
                      </Box>
                      <Typography variant="h5" fontWeight="900" gutterBottom>
                        {feature.title}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {feature.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <StickyScrollStory theme={theme} mode={mode} fadeInUp={fadeInUp} />

      {/* Process Section */}
      <Box
        sx={{
          py: 20,
          position: "relative",
          zIndex: 10,
          bgcolor: alpha(theme.palette.background.paper, 0.2),
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 12 }}>
            <Typography variant="h2" fontWeight="900" gutterBottom letterSpacing="-0.03em">
              {t("processTitle")}
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              { step: "01", title: t("step1Title"), desc: t("step1Desc") },
              { step: "02", title: t("step2Title"), desc: t("step2Desc") },
              { step: "03", title: t("step3Title"), desc: t("step3Desc") },
            ].map((item, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Box sx={{ position: "relative" }}>
                  <Typography
                    variant="h1"
                    sx={{
                      position: "absolute",
                      top: -40,
                      left: { xs: 0, sm: -10 },
                      fontSize: { xs: "5rem", sm: "8rem" },
                      fontWeight: 900,
                      opacity: 0.05,
                      color: theme.palette.primary.main,
                    }}
                  >
                    {item.step}
                  </Typography>
                  <Box sx={{ pt: 4 }}>
                    <Typography variant="h4" fontWeight="900" gutterBottom>
                      {item.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontSize: "1.1rem" }}>
                      {item.desc}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 15, position: "relative", zIndex: 10 }}>
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Paper
              sx={{
                p: { xs: 6, md: 10 },
                textAlign: "center",
                borderRadius: "40px",
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)} 0%, #8b5cf6 100%)`,
                color: "white",
                boxShadow: `0 30px 60px ${alpha(theme.palette.primary.main, 0.3)}`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box sx={{ position: "absolute", top: -20, right: -20, opacity: 0.1 }}>
                <Zap size={200} />
              </Box>

              <Typography variant="h2" fontWeight="900" gutterBottom>
                {t("getStartedNow")}
              </Typography>
              <Typography variant="h6" sx={{ mb: 6, opacity: 0.9 }}>
                {t("heroDesc").split(".")[0]}.
              </Typography>

              <Button
                variant="contained"
                onClick={() => navigate("/morphocheck-pro")}
                sx={{
                  bgcolor: "white",
                  color: "primary.main",
                  borderRadius: "20px",
                  px: 6,
                  py: 2,
                  fontSize: "1.2rem",
                  fontWeight: 900,
                  "&:hover": {
                    bgcolor: alpha("#fff", 0.9),
                    transform: "translateY(-5px)",
                  },
                }}
              >
                {t("enterSystem")} <ArrowRight size={24} style={{ marginLeft: "12px" }} />
              </Button>
            </Paper>
          </motion.div>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          position: "relative",
          zIndex: 10,
          py: 8,
          borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
          backdropFilter: "blur(10px)",
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} justifyContent="space-between" alignItems="center">
            <Grid item xs={12} md={4}>
              <Typography variant="h5" fontWeight="900" sx={styles.heroGradient}>
                MorphoCheck Pro
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                © {new Date().getFullYear()} {t("footerCopy")}
              </Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={3} justifyContent="flex-end">
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{
                      px: 3,
                      py: 1.5,
                      borderRadius: "16px",
                      background: alpha(theme.palette.background.paper, 0.4),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    }}
                  >
                    <a
                      href="mailto:shermanov356abduvali@gmail.com"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        color: "inherit",
                        textDecoration: "none",
                      }}
                    >
                      <Mail size={20} color={theme.palette.primary.main} />
                      <Typography variant="body2" fontWeight="700">
                        Email Us
                      </Typography>
                    </a>
                  </Stack>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{
                      px: 3,
                      py: 1.5,
                      borderRadius: "16px",
                      background: alpha(theme.palette.background.paper, 0.4),
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                    }}
                  >
                    <a
                      href="tel:+998909699680"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        color: "inherit",
                        textDecoration: "none",
                      }}
                    >
                      <Phone size={20} color={theme.palette.secondary.main} />
                      <Typography variant="body2" fontWeight="700">
                        Call Support
                      </Typography>
                    </a>
                  </Stack>
                </motion.div>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

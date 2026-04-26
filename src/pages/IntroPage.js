// src/pages/IntroPage.jsx
import React, { useEffect } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  HeartPulse,
  Activity,
  ShieldCheck,
  FileText,
  Mail,
  Phone,
  Sparkles,
  ArrowRight,
  Zap,
  BarChart3,
  Users,
  GraduationCap,
  Cpu,
  Fingerprint,
  Bot,
  CheckCircle2,
  Globe,
  Award
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
  TextField,
  useTheme,
  useMediaQuery,
  alpha,
  Stack,
} from "@mui/material";
import { useThemeMode } from "../providers/ThemeProviderMUI";
import MorphoProBackground from "../components/MorphoProBackground";
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
  <Box sx={{ position: "relative", width: size, height: size * 1.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
    {/* Tech HUD Background Rings */}
    <Box sx={{ color, position: "absolute", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
      <TechRing size={size * 1.8} duration={20} delay={0} opacity={0.15} />
      <TechRing size={size * 1.4} duration={15} delay={-2} opacity={0.1} dash="10, 10" />
      <TechRing size={size * 1.1} duration={25} delay={-5} opacity={0.05} dash="2, 4" />
    </Box>

    <svg width={size} height={size * 1.5} viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: "relative", zIndex: 1 }}>
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
      </defs>

      {/* Silhouette Body */}
      <g stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)">
          <motion.circle 
            cx="50" cy="15" r="9" 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          <motion.path 
            d="M20,42 H80 M50,42 V68 L30,98 M50,68 L70,98" 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
          />
          {/* Inner skeletal/muscle lines for more detail */}
          <motion.path 
            d="M35,42 V55 M65,42 V55 M50,25 V42" 
            strokeWidth="0.5"
            opacity="0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.5 }}
          />
      </g>

      {/* Horizontal Scanning Line */}
      <motion.g
        animate={{ y: [10, 100, 10] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="10" y="0" width="80" height="1.5" fill={color} style={{ filter: "blur(1px)", opacity: 0.9 }} />
        <rect x="15" y="-12" width="70" height="12" fill="url(#scanGrad)" style={{ opacity: 0.3 }} />
      </motion.g>

      {/* Bio-Analysis Nodes */}
      {[
        { x: 50, y: 15, label: "Brain Activity" },
        { x: 50, y: 42, label: "Cardiac" },
        { x: 20, y: 42, label: "Motor" },
        { x: 80, y: 42, label: "Motor" },
        { x: 30, y: 98, label: "Bone" },
        { x: 70, y: 98, label: "Bone" },
      ].map((node, i) => (
        <motion.g key={i} transform={`translate(${node.x}, ${node.y})`}>
          <circle r="2" fill="#fff" />
          <motion.circle 
            r="5" 
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
        ${theme.palette.primary.main}, #8b5cf6, #ec4899, #8b5cf6, ${theme.palette.primary.main})`,
      backgroundSize: "200% auto",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      fontWeight: 900,
      animation: "slowRainbow 12s linear infinite",
      "@keyframes slowRainbow": {
        "0%": { backgroundPosition: "0% 50%" },
        "50%": { backgroundPosition: "100% 50%" },
        "100%": { backgroundPosition: "0% 50%" }
      }
    },
    premiumCard: {
      background: alpha(theme.palette.background.paper, mode === "dark" ? 0.3 : 0.6),
      backdropFilter: "blur(24px) saturate(180%)",
      WebkitBackdropFilter: "blur(24px) saturate(180%)",
      border: `1px solid ${alpha(theme.palette.common.white, mode === "dark" ? 0.08 : 0.2)}`,
      borderRadius: "28px",
      boxShadow: `0 12px 40px 0 ${alpha(theme.palette.common.black, mode === "dark" ? 0.3 : 0.08)}`,
      transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
      overflow: "hidden",
      "&:hover": {
        transform: "translateY(-12px)",
        boxShadow: `0 24px 60px 0 ${alpha(theme.palette.common.black, mode === "dark" ? 0.5 : 0.15)}`,
        borderColor: alpha(theme.palette.primary.main, 0.4),
      },
    },
    actionButton: {
      borderRadius: "18px",
      padding: "16px 36px",
      fontSize: "1.15rem",
      fontWeight: "800",
      textTransform: "none",
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      "&:hover": { transform: "scale(1.04) translateY(-2px)" },
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
      mb: 3
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  return (
    <Box sx={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <MorphoProBackground theme={mode} />

      {/* Hero Section */}
      <Box sx={{ position: "relative", zIndex: 10 }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              py: { xs: 10, md: 0 }
            }}
          >
            <Grid container spacing={8} alignItems="center">
              <Grid item xs={12} md={6} lg={7}>
                <motion.div style={{ opacity, y: yParallax }}>
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
                        fontSize: { xs: "3.5rem", md: "5.5rem", lg: "6.5rem" },
                        fontWeight: 900,
                        mb: 3,
                        lineHeight: 1.05,
                        letterSpacing: "-0.04em",
                        color: "text.primary"
                      }}
                    >
                      {t("heroTitle1")}
                      <Box component="span" sx={styles.heroGradient} display="block">
                        {t("heroTitle2")}
                      </Box>
                    </Typography>

                    <Typography
                      variant="h5"
                      sx={{
                        color: "text.secondary",
                        mb: 6,
                        maxWidth: "650px",
                        lineHeight: 1.6,
                        fontWeight: 500,
                        fontSize: { xs: "1.1rem", md: "1.35rem" }
                      }}
                    >
                      {t("heroDesc")}
                    </Typography>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5}>
                      <Button
                        variant="contained"
                        onClick={() => navigate(user?.role === "researcher" ? "/researcher" : "/morphocheck-pro")}
                        sx={{
                          ...styles.actionButton,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #8b5cf6 100%)`,
                          boxShadow: `0 15px 35px ${alpha(theme.palette.primary.main, 0.4)}`,
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
                          borderColor: alpha(theme.palette.text.primary, 0.1),
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
                          borderColor: alpha("#8b5cf6", 0.35),
                          color: "#8b5cf6",
                          "&:hover": {
                            borderWidth: "2px",
                            borderColor: "#8b5cf6",
                            bgcolor: alpha("#8b5cf6", 0.07),
                            boxShadow: `0 0 20px ${alpha("#8b5cf6", 0.2)}`,
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
                      <CardContent sx={{ p: 5 }}>
                        <Stack spacing={4}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box>
                              <Typography variant="h4" fontWeight="900" letterSpacing="-0.02em">
                                {t("liveReport")}
                              </Typography>
                              <Typography variant="subtitle2" color="primary.main" sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, fontWeight: 700 }}>
                                <Bot size={18} /> AI ENGINE ACTIVE
                              </Typography>
                            </Box>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            >
                              <Cpu color={theme.palette.primary.main} size={36} strokeWidth={1.5} />
                            </motion.div>
                          </Box>

                          <Box 
                            sx={{ 
                              height: "360px", 
                              bgcolor: alpha(theme.palette.text.primary, 0.02), 
                              borderRadius: 4, 
                              position: "relative", 
                              overflow: "hidden", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                              backgroundImage: `linear-gradient(${alpha(theme.palette.primary.main, 0.03)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.03)} 1px, transparent 1px)`,
                              backgroundSize: '20px 20px',
                            }}
                          >
                            {/* Corner Accents */}
                            {[
                              { top: 12, left: 12, borderLeft: 2, borderTop: 2 },
                              { top: 12, right: 12, borderRight: 2, borderTop: 2 },
                              { bottom: 12, left: 12, borderLeft: 2, borderBottom: 2 },
                              { bottom: 12, right: 12, borderRight: 2, borderBottom: 2 },
                            ].map((corner, i) => (
                              <Box key={i} sx={{ position: "absolute", width: 20, height: 20, borderColor: alpha(theme.palette.primary.main, 0.4), ...corner }} />
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
                                opacity: 0.6
                              }}
                            />

                            <Box sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                                <BodySilhouette color={theme.palette.primary.main} size={160} />
                                <motion.div
                                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                >
                                  <Typography variant="overline" sx={{ display: "block", mt: 1, letterSpacing: 4, fontWeight: 900, opacity: 0.5, color: theme.palette.primary.main }}>
                                      REAL-TIME ANALYSIS...
                                  </Typography>
                                </motion.div>
                            </Box>

                            {/* Technical Overlays (Side bars) */}
                            <Box sx={{ position: "absolute", left: 20, top: "20%", height: "60%", width: "2px", bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                                <motion.div 
                                  animate={{ height: ["10%", "90%", "10%"] }} 
                                  transition={{ duration: 5, repeat: Infinity }}
                                  style={{ width: "100%", background: theme.palette.primary.main, opacity: 0.5 }} 
                                />
                            </Box>

                            {/* Data Stream (Right side) */}
                            <Box sx={{ position: "absolute", right: 15, top: 40, bottom: 40, width: 40, overflow: "hidden", opacity: 0.3, display: { xs: "none", sm: "block" } }}>
                                <Typography variant="caption" sx={{ fontSize: "6px", fontFamily: "monospace", display: "block", color: theme.palette.primary.main, lineHeight: 1 }}>
                                    {[...Array(20)].map((_, i) => (
                                      <motion.span
                                        key={i}
                                        animate={{ opacity: [0.2, 1, 0.2] }}
                                        transition={{ duration: 0.5 + Math.random(), repeat: Infinity, delay: Math.random() }}
                                        style={{ display: "block" }}
                                      >
                                        {Math.random().toString(16).slice(2, 8).toUpperCase()}
                                      </motion.span>
                                    ))}
                                </Typography>
                            </Box>

                            {/* Scan Progress Counter */}
                            <Box sx={{ position: "absolute", bottom: 20, right: 25, textAlign: "right" }}>
                                <Typography variant="caption" sx={{ fontSize: "10px", fontWeight: 900, color: theme.palette.primary.main, opacity: 0.6 }}>
                                    SCANNING...
                                </Typography>
                                <Typography variant="h6" sx={{ fontSize: "14px", fontWeight: 900, fontFamily: "monospace", color: theme.palette.primary.main }}>
                                    <motion.span
                                      animate={{ content: ["00%", "45%", "89%", "23%", "67%"] }} // Note: motion doesn't animate content easily without useMotionValue, but we can fake it with opacity/sequence
                                    >
                                      98.4%
                                    </motion.span>
                                </Typography>
                            </Box>
                          </Box>

                          <Grid container spacing={2.5}>
                            {[
                              { label: "Accuracy", val: "99.9%", icon: Activity, color: "#10b981" },
                              { label: "Data Points", val: "140+", icon: Fingerprint, color: "#3b82f6" },
                            ].map((stat, idx) => (
                              <Grid item xs={6} key={stat.label}>
                                <Paper
                                  elevation={0}
                                  sx={{
                                    p: 2.5,
                                    bgcolor: alpha(theme.palette.background.paper, 0.5),
                                    border: `1px solid ${alpha(theme.palette.text.primary, 0.05)}`,
                                    borderRadius: "20px",
                                    "&:hover": { borderColor: stat.color, bgcolor: alpha(stat.color, 0.05) }
                                  }}
                                >
                                  <Stack direction="row" spacing={1.5} alignItems="center">
                                    <stat.icon size={20} color={stat.color} />
                                    <Box>
                                      <Typography variant="caption" fontWeight="800" sx={{ opacity: 0.6, display: "block", mb: 0.2 }}>
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
          <Typography variant="overline" sx={{ display: "block", textAlign: "center", mb: 4, fontWeight: 900, letterSpacing: 2, color: "text.secondary" }}>
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
              "& svg": { filter: mode === "dark" ? "grayscale(1) invert(1)" : "grayscale(1)" }
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
                <ShieldCheck size={32} />
                <Typography variant="h6" fontWeight="900">ISO 27001</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
                <Globe size={32} />
                <Typography variant="h6" fontWeight="900">WHO Standards</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
                <Award size={32} />
                <Typography variant="h6" fontWeight="900">MedTech 2024</Typography>
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
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: "700px", mx: "auto", fontWeight: 400 }}>
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
                <motion.div
                  {...fadeInUp}
                  transition={{ delay: i * 0.15 + 0.3 }}
                >
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

      {/* Process Section */}
      <Box sx={{ py: 20, position: "relative", zIndex: 10, bgcolor: alpha(theme.palette.background.paper, 0.2) }}>
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
                        left: -10, 
                        fontSize: "8rem", 
                        fontWeight: 900, 
                        opacity: 0.05,
                        color: theme.palette.primary.main
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
                overflow: "hidden"
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
                    transform: "translateY(-5px)"
                  }
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
                      <a href="mailto:shermanov356abduvali@gmail.com" style={{ display: "flex", alignItems: "center", gap: "12px", color: "inherit", textDecoration: "none" }}>
                        <Mail size={20} color={theme.palette.primary.main} />
                        <Typography variant="body2" fontWeight="700">Email Us</Typography>
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
                      <a href="tel:+998909699680" style={{ display: "flex", alignItems: "center", gap: "12px", color: "inherit", textDecoration: "none" }}>
                        <Phone size={20} color={theme.palette.secondary.main} />
                        <Typography variant="body2" fontWeight="700">Call Support</Typography>
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

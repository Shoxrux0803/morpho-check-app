// src/pages/IntroPage.jsx
import React, { useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
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
import DOFLinesAnimation from "../components/DOFLinesAnimation";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";

export default function IntroPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mode } = useThemeMode();
  const { t } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  useEffect(() => {
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [mode]);

  const styles = {
    heroGradient: {
      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #8b5cf6 50%, #ec4899 100%)`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      fontWeight: 900,
    },
    premiumCard: {
      background: alpha(theme.palette.background.paper, mode === "dark" ? 0.4 : 0.7),
      backdropFilter: "blur(20px) saturate(180%)",
      WebkitBackdropFilter: "blur(20px) saturate(180%)",
      border: `1px solid ${alpha(theme.palette.common.white, mode === "dark" ? 0.1 : 0.2)}`,
      borderRadius: "24px",
      boxShadow: `0 8px 32px 0 ${alpha(theme.palette.common.black, 0.1)}`,
      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      "&:hover": {
        transform: "translateY(-8px) scale(1.01)",
        boxShadow: `0 20px 40px 0 ${alpha(theme.palette.common.black, 0.25)}`,
        borderColor: alpha(theme.palette.primary.main, 0.5),
      },
    },
    actionButton: {
      borderRadius: "16px",
      padding: "14px 32px",
      fontSize: "1.1rem",
      fontWeight: "bold",
      textTransform: "none",
      transition: "all 0.3s ease",
      "&:hover": { transform: "scale(1.05)" },
    },
  };

  return (
    <Box sx={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Premium DOFLines Renderer Background */}
      <DOFLinesAnimation theme={mode} />

      {/* Hero Section */}
      <Box sx={{ position: "relative", zIndex: 10 }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              pt: { xs: 10, md: 0 },
            }}
          >
            <Grid container spacing={6} alignItems="center">
              <Grid item xs={12} md={7}>
                <motion.div style={{ opacity, scale }}>
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          px: 2,
                          py: 0.5,
                          borderRadius: "20px",
                          bgcolor: alpha(theme.palette.primary.main, 0.15),
                          color: theme.palette.primary.main,
                          fontWeight: "bold",
                          fontSize: "0.85rem",
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                        }}
                      >
                        {t("newEra")}
                      </Box>
                      <Sparkles size={16} color={theme.palette.primary.main} />
                    </Stack>

                    <Typography
                      variant="h1"
                      sx={{
                        fontSize: { xs: "3rem", md: "4.5rem" },
                        mb: 3,
                        lineHeight: 1.1,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {t("heroTitle1")}
                      <Box component="span" sx={styles.heroGradient} display="block">
                        {t("heroTitle2")}
                      </Box>
                    </Typography>

                    <Typography
                      variant="h6"
                      sx={{
                        color: "text.secondary",
                        mb: 5,
                        maxWidth: "600px",
                        lineHeight: 1.6,
                        opacity: 0.9,
                      }}
                    >
                      {t("heroDesc")}
                    </Typography>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 6 }}>
                      <Button
                        variant="contained"
                        onClick={() => navigate(user?.role === "researcher" ? "/researcher" : "/morphocheck-pro")}
                        sx={{
                          ...styles.actionButton,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #8b5cf6 100%)`,
                          boxShadow: `0 10px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                          "&:hover": {
                            boxShadow: `0 15px 30px ${alpha(theme.palette.primary.main, 0.4)}`,
                          },
                        }}
                        startIcon={<Zap size={20} />}
                      >
                        {t("enterSystem")}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => navigate("/info")}
                        sx={{
                          ...styles.actionButton,
                          borderColor: alpha(theme.palette.text.primary, 0.2),
                          color: "text.primary",
                          "&:hover": {
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
                          borderColor: alpha("#8b5cf6", 0.35),
                          color: "#8b5cf6",
                          "&:hover": {
                            borderColor: "#8b5cf6",
                            bgcolor: alpha("#8b5cf6", 0.07),
                            boxShadow: `0 0 20px ${alpha("#8b5cf6", 0.2)}`,
                          },
                        }}
                      >
                        Avtor haqida
                      </Button>
                    </Stack>

                    {/* Quick Stats */}
                    <Grid container spacing={4}>
                      {[
                        { icon: Users, label: t("users"), value: "10,000+" },
                        { icon: BarChart3, label: t("accuracy"), value: "99.9%" },
                      ].map((stat, i) => (
                        <Grid item key={i}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Box
                              sx={{
                                p: 1.5,
                                borderRadius: "12px",
                                bgcolor: alpha(theme.palette.background.paper, 0.5),
                                border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
                              }}
                            >
                              <stat.icon size={24} />
                            </Box>
                            <Box>
                              <Typography variant="h6" fontWeight="bold">
                                {stat.value}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {stat.label}
                              </Typography>
                            </Box>
                          </Stack>
                        </Grid>
                      ))}
                    </Grid>
                  </motion.div>
                </motion.div>
              </Grid>

              {!isMobile && (
                <Grid item md={5}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                  >
                    <Box
                      sx={{
                        position: "relative",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          inset: -20,
                          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.2)} 0%, transparent 70%)`,
                          filter: "blur(40px)",
                          zIndex: -1,
                        },
                      }}
                    >
                      <Card sx={styles.premiumCard}>
                        <CardContent sx={{ p: 4 }}>
                          <Stack spacing={3}>
                            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                              <Typography variant="h5" fontWeight="900">
                                {t("liveReport")}
                              </Typography>
                              <Activity color={theme.palette.primary.main} />
                            </Box>
                            <Box sx={{ height: "4px", bgcolor: alpha(theme.palette.text.primary, 0.05), borderRadius: 2 }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "75%" }}
                                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                                style={{ height: "100%", background: theme.palette.primary.main, borderRadius: 2 }}
                              />
                            </Box>
                            <Grid container spacing={2}>
                              {["Z-Score", "Somatotype", "BMI", "Health Map"].map((tag) => (
                                <Grid item xs={6} key={tag}>
                                  <Paper
                                    sx={{
                                      p: 2,
                                      bgcolor: alpha(theme.palette.background.paper, 0.4),
                                      border: `1px solid ${alpha(theme.palette.text.primary, 0.05)}`,
                                      borderRadius: "16px",
                                      textAlign: "center",
                                    }}
                                  >
                                    <Typography variant="caption" fontWeight="bold">
                                      {tag}
                                    </Typography>
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
              )}
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ position: "relative", zIndex: 10, py: 15, bgcolor: alpha(theme.palette.background.default, 0.4) }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: "center", mb: 10 }}>
            <Typography variant="h3" fontWeight="900" gutterBottom>
              {t("whyMorpho")}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ opacity: 0.7 }}>
              {t("whyDesc")}
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              { icon: ShieldCheck, title: t("feat1Title"), desc: t("feat1Desc") },
              { icon: Activity, title: t("feat2Title"), desc: t("feat2Desc") },
              { icon: FileText, title: t("feat3Title"), desc: t("feat3Desc") },
            ].map((feature, i) => (
              <Grid item xs={12} md={4} key={i}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card sx={styles.premiumCard}>
                    <CardContent sx={{ p: 4 }}>
                      <Box
                        sx={{
                          mb: 3,
                          p: 2,
                          display: "inline-flex",
                          borderRadius: "16px",
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                        }}
                      >
                        <feature.icon size={32} />
                      </Box>
                      <Typography variant="h5" fontWeight="bold" gutterBottom>
                        {feature.title}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
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

      {/* Footer */}
      <Box
        sx={{
          position: "relative",
          zIndex: 10,
          py: 6,
          borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.05)}`,
          backdropFilter: "blur(10px)",
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems="center"
            spacing={4}
          >
            <Box>
              <Typography variant="h6" fontWeight="900" sx={styles.heroGradient}>
                MorphoCheck Pro
              </Typography>
              <Typography variant="body2" color="text.secondary">
                © {new Date().getFullYear()} {t("footerCopy")}
              </Typography>
            </Box>
            <Stack direction="row" spacing={4} alignItems="center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: "12px",
                    background: alpha(theme.palette.background.paper, 0.5),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      background: alpha(theme.palette.primary.main, 0.1),
                      borderColor: theme.palette.primary.main,
                      boxShadow: `0 0 15px ${alpha(theme.palette.primary.main, 0.2)}`,
                    },
                  }}
                >
                  <a
                    href="mailto:shermanov356abduvali@gmail.com"
                    style={{ display: "flex", alignItems: "center", gap: "10px", color: "inherit", textDecoration: "none" }}
                  >
                    <Box sx={{ p: 1, borderRadius: "50%", bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, display: "flex" }}>
                      <Mail size={18} />
                    </Box>
                    <Typography variant="body2" fontWeight="600">
                      shermanov356abduvali@gmail.com
                    </Typography>
                  </a>
                </Stack>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: "12px",
                    background: alpha(theme.palette.background.paper, 0.5),
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      background: alpha(theme.palette.secondary.main, 0.1),
                      borderColor: theme.palette.secondary.main,
                      boxShadow: `0 0 15px ${alpha(theme.palette.secondary.main, 0.2)}`,
                    },
                  }}
                >
                  <a
                    href="tel:+998909699680"
                    style={{ display: "flex", alignItems: "center", gap: "10px", color: "inherit", textDecoration: "none" }}
                  >
                    <Box sx={{ p: 1, borderRadius: "50%", bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main, display: "flex" }}>
                      <Phone size={18} />
                    </Box>
                    <Typography variant="body2" fontWeight="600">
                      +998 90 969 96 80
                    </Typography>
                  </a>
                </Stack>
              </motion.div>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

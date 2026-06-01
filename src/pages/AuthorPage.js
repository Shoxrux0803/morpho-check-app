// src/pages/AuthorPage.js
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  Divider,
  alpha,
  useTheme,
  Button,
  Avatar,
  Tooltip,
  Paper,
} from "@mui/material";
import {
  ArrowLeft,
  ExternalLink,
  BookOpen,
  GraduationCap,
  FlaskConical,
  Award,
  Globe,
  Mail,
  Phone,
  BarChart2,
  Users,
  FileText,
  Calendar,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import MorphoProBackground from "../components/MorphoProBackground";
import { useThemeMode } from "../providers/ThemeProviderMUI";
import { useLanguage } from "../contexts/LanguageContext";
import authorPortrait from "../assets/author_portrait.png";

// ─────────────────── Ma'lumotlar ───────────────────
const AUTHOR = {
  fullName: "Shermanov Abduvali Ortiqovich",
  degree: "PhD (Fanlar doktori)",
  degreeEn: "Doctor of Philosophy (PhD)",
  position: "Ilmiy tadqiqotchi, Morfologiya bo'limi",
  organization: "O'zbekiston Davlat Jismoniy Tarbiya va Sport Universiteti",
  email: "shermanov356abduvali@gmail.com",
  phone: "+998 90 969 96 80",
  scopusUrl: "https://www.scopus.com/authid/detail.uri?authorId=58102375800",
  googleScholarUrl: "https://scholar.google.com/citations?user=SCHOLAR_ID_HERE",
  orcidUrl: "https://orcid.org/0000-0002-8610-8646",
  researchGateUrl: "https://www.researchgate.net/profile/Abduvali-Shermanov",
  stats: [
    { icon: FileText, label: "Maqolalar", value: "35+", color: "#3b82f6" },
    { icon: Users, label: "Iqtiboslar", value: "150+", color: "#10b981" },
    { icon: GraduationCap, label: "H-Index", value: "4", color: "#f59e0b" },
    { icon: Globe, label: "Loyihalar", value: "12", color: "#8b5cf6" },
  ],
  researchAreas: [
    "Morfologiya",
    "Somatologiya",
    "Jismoniy antropologiya",
    "WHO Z-score tahlili",
    "Sport tibbiyoti",
    "Bioimpedansometriya",
  ],
  timeline: [
    {
      year: "2015",
      title: "Oliy ta'lim",
      desc: "Sport morfologiyasi yo'nalishida ilk tadqiqotlar.",
    },
    {
      year: "2019",
      title: "Ilmiy faoliyat",
      desc: "Respublika darajasidagi ilmiy loyihalar ishtirokchisi.",
    },
    {
      year: "2021",
      title: "PhD Himoyasi",
      desc: "Antropometrik tahlil bo'yicha dissertatsiya himoyasi.",
    },
    {
      year: "2023",
      title: "MorphoCheck Pro",
      desc: "Tizimning metodologik asosini yaratish va joriy etish.",
    },
  ],
  bio: `Shermanov Abduvali Ortiqovich — O'zbekistondagi morfologiya va somatologiya sohasining yetakchi mutaxassislaridan biri. 
U bolalar va o'smirlarning jismoniy rivojlanishini ilmiy asosda baholash metodologiyasini takomillashtirishga ulkan hissa qo'shgan.

Uning tadqiqotlari Butunjahon Sog'liqni Saqlash Tashkiloti (WHO) standartlarini O'zbekiston populyatsiyasiga moslashtirish va raqamli texnologiyalar yordamida aniq monitoring o'tkazishga qaratilgan. "MorphoCheck Pro" tizimi uning ko'p yillik ilmiy izlanishlarining amaliy natijasidir.`,
};

const profileLinks = [
  {
    label: "Scopus",
    icon: "S",
    url: AUTHOR.scopusUrl,
    color: "#E87722",
    desc: "Scientific Indexing",
  },
  {
    label: "Google Scholar",
    icon: "G",
    url: AUTHOR.googleScholarUrl,
    color: "#4285F4",
    desc: "Citations",
  },
  { label: "ORCID", icon: "O", url: AUTHOR.orcidUrl, color: "#A6CE39", desc: "Digital ID" },
  {
    label: "ResearchGate",
    icon: "R",
    url: AUTHOR.researchGateUrl,
    color: "#00CCBB",
    desc: "Network",
  },
];

const FadeIn = ({ children, delay = 0, x = 0, y = 20 }) => (
  <motion.div
    initial={{ opacity: 0, x, y }}
    whileInView={{ opacity: 1, x: 0, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
  >
    {children}
  </motion.div>
);

export default function AuthorPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { mode } = useThemeMode();
  const { t } = useLanguage();
  const isDark = mode === "dark";

  const glassStyle = {
    background: alpha(theme.palette.background.paper, isDark ? 0.25 : 0.6),
    backdropFilter: "blur(24px) saturate(180%)",
    WebkitBackdropFilter: "blur(24px) saturate(180%)",
    border: `1px solid ${alpha(theme.palette.common.white, isDark ? 0.08 : 0.2)}`,
    borderRadius: "32px",
    boxShadow: `0 12px 40px 0 ${alpha(theme.palette.common.black, isDark ? 0.4 : 0.08)}`,
    transition: "all 0.4s ease-in-out",
  };

  const gradientText = {
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #8b5cf6 50%, #ec4899 100%)`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontWeight: 900,
  };

  return (
    <Box sx={{ minHeight: "100vh", position: "relative", py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 10 }}>
        {/* Header */}
        <FadeIn y={-20}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 6 }}>
            <Button
              startIcon={<ArrowLeft size={20} />}
              onClick={() => navigate("/")}
              sx={{
                borderRadius: "16px",
                px: 3,
                py: 1,
                color: "text.primary",
                bgcolor: alpha(theme.palette.text.primary, 0.05),
                "&:hover": { bgcolor: alpha(theme.palette.text.primary, 0.1) },
              }}
            >
              {t("backBtn") || "Orqaga"}
            </Button>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Chip
                label="Scientific Profile"
                variant="outlined"
                size="small"
                sx={{ fontWeight: 800, borderRadius: "8px" }}
              />
              <Chip
                label="v2.0 Professional"
                color="primary"
                size="small"
                sx={{ fontWeight: 800, borderRadius: "8px" }}
              />
            </Box>
          </Stack>
        </FadeIn>

        <Grid container spacing={5}>
          {/* Left Column */}
          <Grid item xs={12} md={4}>
            <FadeIn x={-30}>
              <Card
                sx={{
                  ...glassStyle,
                  textAlign: "center",
                  position: "relative",
                  overflow: "visible",
                  mb: 4,
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    top: -50,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 1,
                  }}
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Avatar
                      src={authorPortrait}
                      sx={{
                        width: 180,
                        height: 180,
                        border: `4px solid ${alpha(theme.palette.primary.main, 0.6)}`,
                        boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.4)}`,
                      }}
                    />
                  </motion.div>
                </Box>
                <CardContent sx={{ pt: 18, px: 4, pb: 4 }}>
                  <Typography variant="h4" fontWeight={900} gutterBottom letterSpacing={0}>
                    {AUTHOR.fullName}
                  </Typography>
                  <Typography variant="h6" color="primary" fontWeight={800} sx={{ mb: 2 }}>
                    {AUTHOR.degree}
                  </Typography>
                  <Divider sx={{ mb: 3, opacity: 0.2 }} />
                  <Stack spacing={2} sx={{ textAlign: "left" }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: "10px",
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                        }}
                      >
                        <Mail size={18} />
                      </Box>
                      <Typography variant="body2" fontWeight={600}>
                        {AUTHOR.email}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: "10px",
                          bgcolor: alpha("#10b981", 0.1),
                          color: "#10b981",
                        }}
                      >
                        <Phone size={18} />
                      </Box>
                      <Typography variant="body2" fontWeight={600}>
                        {AUTHOR.phone}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              {/* Research Areas */}
              <Card sx={{ ...glassStyle, p: 3 }}>
                <Typography
                  variant="overline"
                  fontWeight={900}
                  color="text.secondary"
                  sx={{ display: "block", mb: 2, letterSpacing: 2 }}
                >
                  Research Expertise
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {AUTHOR.researchAreas.map((area, i) => (
                    <Chip
                      key={i}
                      label={area}
                      size="small"
                      sx={{
                        borderRadius: "10px",
                        fontWeight: 700,
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.15) },
                      }}
                    />
                  ))}
                </Box>
              </Card>
            </FadeIn>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} md={8}>
            {/* Biography */}
            <FadeIn delay={0.2}>
              <Card sx={{ ...glassStyle, p: 4, mb: 4 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: "14px",
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                    }}
                  >
                    <Sparkles size={24} />
                  </Box>
                  <Typography variant="h5" fontWeight={800}>
                    Ilmiy Faoliyat
                  </Typography>
                </Stack>
                <Typography
                  variant="body1"
                  sx={{ color: "text.secondary", lineHeight: 1.8, fontSize: "1.1rem", mb: 4 }}
                >
                  {AUTHOR.bio}
                </Typography>

                {/* Stats */}
                <Grid container spacing={2}>
                  {AUTHOR.stats.map((stat, i) => (
                    <Grid item xs={6} sm={3} key={i}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          textAlign: "center",
                          borderRadius: "20px",
                          bgcolor: alpha(stat.color, 0.05),
                          border: `1px solid ${alpha(stat.color, 0.1)}`,
                        }}
                      >
                        <Typography variant="h4" fontWeight={900} sx={{ color: stat.color }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="caption" fontWeight={800} color="text.secondary">
                          {stat.label}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Card>
            </FadeIn>

            {/* Timeline */}
            <FadeIn delay={0.3}>
              <Card sx={{ ...glassStyle, p: 4, mb: 4 }}>
                <Typography
                  variant="h6"
                  fontWeight={900}
                  sx={{ mb: 4, display: "flex", alignItems: "center", gap: 1.5 }}
                >
                  <Calendar size={22} /> Ilmiy Yo'l
                </Typography>
                <Stack spacing={4}>
                  {AUTHOR.timeline.map((item, i) => (
                    <Stack key={i} direction="row" spacing={3}>
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            bgcolor: "primary.main",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 900,
                            zIndex: 1,
                          }}
                        >
                          {item.year.slice(2)}
                        </Box>
                        {i !== AUTHOR.timeline.length - 1 && (
                          <Box
                            sx={{
                              width: 2,
                              flexGrow: 1,
                              bgcolor: alpha(theme.palette.primary.main, 0.2),
                              my: 1,
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ pb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={800}>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.desc}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Card>
            </FadeIn>

            {/* Links */}
            <FadeIn delay={0.4}>
              <Grid container spacing={2}>
                {profileLinks.map((link, i) => (
                  <Grid item xs={12} sm={6} key={i}>
                    <Box
                      component="a"
                      href={link.url}
                      target="_blank"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 2.5,
                        borderRadius: "24px",
                        bgcolor: alpha(link.color, 0.05),
                        border: `1px solid ${alpha(link.color, 0.1)}`,
                        textDecoration: "none",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          bgcolor: alpha(link.color, 0.1),
                          borderColor: link.color,
                          transform: "translateY(-4px)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: "14px",
                          bgcolor: link.color,
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900,
                          fontSize: "1.2rem",
                          boxShadow: `0 8px 16px ${alpha(link.color, 0.3)}`,
                        }}
                      >
                        {link.icon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" fontWeight={800} color="text.primary">
                          {link.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          {link.desc}
                        </Typography>
                      </Box>
                      <ChevronRight size={20} color={link.color} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </FadeIn>
          </Grid>
        </Grid>

        {/* Footer Note */}
        <FadeIn delay={0.5}>
          <Box sx={{ mt: 8, textAlign: "center", opacity: 0.5 }}>
            <Typography
              variant="caption"
              sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}
            >
              <Award size={14} /> MorphoCheck Pro Scientific Methodology ©{" "}
              {new Date().getFullYear()}
            </Typography>
          </Box>
        </FadeIn>
      </Container>
    </Box>
  );
}

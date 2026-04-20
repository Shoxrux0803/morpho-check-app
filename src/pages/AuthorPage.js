// src/pages/AuthorPage.js
import React from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DOFLinesAnimation from "../components/DOFLinesAnimation";
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
  // ↓ Haqiqiy profillarni shu yerga kiriting
  scopusUrl: "https://www.scopus.com/authid/detail.uri?authorId=SCOPUS_ID_HERE",
  googleScholarUrl: "https://scholar.google.com/citations?user=SCHOLAR_ID_HERE",
  orcidUrl: "https://orcid.org/ORCID-ID-HERE",
  researchGateUrl: "https://www.researchgate.net/profile/RESEARCHGATE_ID_HERE",
  stats: [
    { icon: FileText, label: "Ilmiy maqolalar", value: "25+" },
    { icon: Users,    label: "Tsitata soni",   value: "120+" },
    { icon: Award,    label: "Grantlar",        value: "5"    },
    { icon: Globe,    label: "Xalqaro hamkorlik", value: "8"  },
  ],
  researchAreas: [
    "Morfologiya",
    "Somatologiya",
    "Jismoniy antropologiya",
    "WHO Z-score tahlili",
    "Bolalar sog'lig'i",
    "Bioimdedansometriya",
  ],
  bio: `Shermanov Abduvali Ortiqovich — O'zbekistondagi morfologiya va somatologiya sohasining yetakchi tadqiqotchilaridan biri. 
U bolalar va o'smirlarning jismoniy rivojlanishini ilmiy asosda baholash metodologiyasini ishlab chiqqan va WHO Z-score standartlariga asoslangan mahalliy normativlarni yaratishda muhim hissa qo'shgan.

Uning ilmiy faoliyati xalqaro ilmiy jurnallarda e'lon qilingan, Scopus va Web of Science ma'lumotlar bazalarida indekslangan maqolalarni o'z ichiga oladi. Tadqiqotchi sifatida u "MorphoCheck Pro" dasturining asosiy metodologik me'mori hisoblanadi.`,
};

// ─────────────────── Profil linklari ───────────────────
const profileLinks = [
  {
    label: "Scopus",
    icon: "S",
    url: AUTHOR.scopusUrl,
    color: "#E87722",
    bgColor: "rgba(232,119,34,0.1)",
    borderColor: "rgba(232,119,34,0.3)",
    description: "Elsevier Scopus profili",
  },
  {
    label: "Google Scholar",
    icon: "G",
    url: AUTHOR.googleScholarUrl,
    color: "#4285F4",
    bgColor: "rgba(66,133,244,0.1)",
    borderColor: "rgba(66,133,244,0.3)",
    description: "Google Scholar sahifasi",
  },
  {
    label: "ORCID",
    icon: "O",
    url: AUTHOR.orcidUrl,
    color: "#A6CE39",
    bgColor: "rgba(166,206,57,0.1)",
    borderColor: "rgba(166,206,57,0.3)",
    description: "ORCID identifikatori",
  },
  {
    label: "ResearchGate",
    icon: "R",
    url: AUTHOR.researchGateUrl,
    color: "#00CCBB",
    bgColor: "rgba(0,204,187,0.1)",
    borderColor: "rgba(0,204,187,0.3)",
    description: "ResearchGate profili",
  },
];

// ─────────────────── AnimateIn helper ───────────────────
const FadeIn = ({ children, delay = 0, direction = "up" }) => {
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === "up" ? 30 : direction === "down" ? -30 : 0,
      x: direction === "left" ? 30 : direction === "right" ? -30 : 0,
    },
    visible: { opacity: 1, y: 0, x: 0 },
  };
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      variants={variants}
    >
      {children}
    </motion.div>
  );
};

// ─────────────────── Asosiy komponent ───────────────────
export default function AuthorPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { mode } = useThemeMode();
  const { t } = useLanguage();

  const isDark = mode === "dark";

  const cardStyle = {
    background: alpha(theme.palette.background.paper, isDark ? 0.45 : 0.75),
    backdropFilter: "blur(24px) saturate(180%)",
    WebkitBackdropFilter: "blur(24px) saturate(180%)",
    border: `1px solid ${alpha(theme.palette.common.white, isDark ? 0.08 : 0.25)}`,
    borderRadius: "24px",
    boxShadow: `0 8px 32px 0 ${alpha(theme.palette.common.black, isDark ? 0.3 : 0.1)}`,
  };

  const gradientText = {
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #8b5cf6 50%, #ec4899 100%)`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontWeight: 900,
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        py: { xs: 8, md: 10 },
      }}
    >
      <DOFLinesAnimation theme={mode} />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 10 }}>
        {/* ── Orqaga tugmasi ── */}
        <FadeIn delay={0} direction="right">
          <Button
            startIcon={<ArrowLeft size={18} />}
            onClick={() => navigate("/")}
            sx={{ mb: 5, color: "text.secondary", fontWeight: 600 }}
          >
            {t("backBtn") || "Orqaga"}
          </Button>
        </FadeIn>

        {/* ── Sarlavha ── */}
        <FadeIn delay={0.05}>
          <Box sx={{ textAlign: "center", mb: 7 }}>
            <Chip
              icon={<GraduationCap size={14} />}
              label="Ilmiy profil"
              size="small"
              sx={{
                mb: 2,
                px: 1.5,
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: theme.palette.primary.main,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                fontWeight: 700,
                fontSize: "0.78rem",
              }}
            />
            <Typography variant="h3" fontWeight={900} gutterBottom>
              Avtor{" "}
              <Box component="span" sx={gradientText}>
                haqida
              </Box>
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560, mx: "auto", opacity: 0.8 }}>
              MorphoCheck Pro tizimining asosiy tadqiqotchisi va metodologiya me'mori
            </Typography>
          </Box>
        </FadeIn>

        <Grid container spacing={4}>
          {/* ════════ CHAP USTUN: Avatar + Profil ════════ */}
          <Grid item xs={12} md={4}>
            {/* Avatar Karta */}
            <FadeIn delay={0.1} direction="right">
              <Card sx={{ ...cardStyle, mb: 3, textAlign: "center", overflow: "visible" }}>
                <CardContent sx={{ pt: 5, pb: 4, px: 4 }}>
                  {/* Glowing Avatar */}
                  <Box sx={{ position: "relative", display: "inline-block", mb: 3 }}>
                    <Box
                      sx={{
                        position: "absolute",
                        inset: -8,
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.4)} 0%, transparent 70%)`,
                        filter: "blur(16px)",
                        zIndex: 0,
                      }}
                    />
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                      <Avatar
                        src={authorPortrait}
                        alt={AUTHOR.fullName}
                        sx={{
                          width: 160,
                          height: 160,
                          border: `3px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                          boxShadow: `0 0 40px ${alpha(theme.palette.primary.main, 0.3)}`,
                          position: "relative",
                          zIndex: 1,
                        }}
                      />
                    </motion.div>
                  </Box>

                  <Typography variant="h5" fontWeight={900} gutterBottom>
                    {AUTHOR.fullName}
                  </Typography>
                  <Chip
                    icon={<Award size={14} />}
                    label={AUTHOR.degree}
                    size="small"
                    sx={{
                      mb: 2,
                      bgcolor: alpha(theme.palette.secondary.main, 0.12),
                      color: theme.palette.secondary.main,
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                      fontWeight: 700,
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, lineHeight: 1.5 }}>
                    {AUTHOR.position}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ lineHeight: 1.4, display: "block" }}>
                    {AUTHOR.organization}
                  </Typography>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Kontakt Karta */}
            <FadeIn delay={0.2} direction="right">
              <Card sx={{ ...cardStyle, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 2, textTransform: "uppercase", letterSpacing: 1, fontSize: "0.7rem" }}>
                    Aloqa
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ p: 1, borderRadius: "10px", bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, display: "flex" }}>
                        <Mail size={16} />
                      </Box>
                      <Typography variant="body2" sx={{ wordBreak: "break-all", fontSize: "0.8rem" }}>
                        {AUTHOR.email}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ p: 1, borderRadius: "10px", bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, display: "flex" }}>
                        <Phone size={16} />
                      </Box>
                      <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                        {AUTHOR.phone}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Tadqiqot sohalari */}
            <FadeIn delay={0.25} direction="right">
              <Card sx={cardStyle}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 2, textTransform: "uppercase", letterSpacing: 1, fontSize: "0.7rem" }}>
                    Tadqiqot sohalari
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                    {AUTHOR.researchAreas.map((area, i) => (
                      <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.05 }}>
                        <Chip
                          label={area}
                          size="small"
                          icon={<FlaskConical size={12} />}
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            color: theme.palette.primary.main,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            fontWeight: 600,
                            fontSize: "0.72rem",
                          }}
                        />
                      </motion.div>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </FadeIn>
          </Grid>

          {/* ════════ O'NG USTUN: Bio + Statistika + Profil linklari ════════ */}
          <Grid item xs={12} md={8}>
            {/* Biografiya */}
            <FadeIn delay={0.15}>
              <Card sx={{ ...cardStyle, mb: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                    <Box sx={{ p: 1.2, borderRadius: "12px", bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, display: "flex" }}>
                      <BookOpen size={20} />
                    </Box>
                    <Typography variant="h6" fontWeight={800}>
                      Qisqacha ma'lumot
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 3, opacity: 0.3 }} />
                  {AUTHOR.bio.split("\n\n").map((paragraph, i) => (
                    <Typography key={i} variant="body1" color="text.secondary" sx={{ mb: i < 1 ? 2 : 0, lineHeight: 1.85, opacity: 0.9 }}>
                      {paragraph.trim()}
                    </Typography>
                  ))}
                </CardContent>
              </Card>
            </FadeIn>

            {/* Statistika */}
            <FadeIn delay={0.2}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {AUTHOR.stats.map((stat, i) => (
                  <Grid item xs={6} sm={3} key={i}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 + i * 0.08 }}
                    >
                      <Card sx={{ ...cardStyle, textAlign: "center" }}>
                        <CardContent sx={{ py: 3, px: 2 }}>
                          <Box
                            sx={{
                              mb: 1.5,
                              p: 1.5,
                              display: "inline-flex",
                              borderRadius: "14px",
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                            }}
                          >
                            <stat.icon size={22} />
                          </Box>
                          <Typography variant="h5" fontWeight={900} sx={gradientText}>
                            {stat.value}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {stat.label}
                          </Typography>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </FadeIn>

            {/* Profil linklari */}
            <FadeIn delay={0.3}>
              <Card sx={cardStyle}>
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                    <Box sx={{ p: 1.2, borderRadius: "12px", bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main, display: "flex" }}>
                      <BarChart2 size={20} />
                    </Box>
                    <Typography variant="h6" fontWeight={800}>
                      Ilmiy profil linklari
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 3, opacity: 0.3 }} />

                  <Grid container spacing={2}>
                    {profileLinks.map((link, i) => (
                      <Grid item xs={12} sm={6} key={i}>
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 + i * 0.08 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Tooltip title={link.description} placement="top">
                            <Box
                              component="a"
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                p: 2.5,
                                borderRadius: "16px",
                                background: link.bgColor,
                                border: `1px solid ${link.borderColor}`,
                                textDecoration: "none",
                                color: "text.primary",
                                transition: "all 0.3s ease",
                                "&:hover": {
                                  background: alpha(link.color, 0.15),
                                  borderColor: link.color,
                                  boxShadow: `0 4px 20px ${alpha(link.color, 0.2)}`,
                                },
                              }}
                            >
                              {/* Harfli ikon */}
                              <Box
                                sx={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: "12px",
                                  bgcolor: link.color,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#fff",
                                  fontWeight: 900,
                                  fontSize: "1.2rem",
                                  flexShrink: 0,
                                  boxShadow: `0 4px 12px ${alpha(link.color, 0.4)}`,
                                }}
                              >
                                {link.icon}
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body1" fontWeight={800} noWrap>
                                  {link.label}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {link.description}
                                </Typography>
                              </Box>
                              <ExternalLink size={16} color={link.color} style={{ flexShrink: 0 }} />
                            </Box>
                          </Tooltip>
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Izoh */}
                  <Box
                    sx={{
                      mt: 3,
                      p: 2,
                      borderRadius: "12px",
                      bgcolor: alpha(theme.palette.warning.main, 0.08),
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.6 }}>
                      💡 <strong>Izoh:</strong> Profil manzillari hozircha test sifatida kiritilgan. Haqiqiy Scopus ID, Google Scholar va ORCID havolalarini yangilash uchun dasturchi bilan bog'laning.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </FadeIn>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

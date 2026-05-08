// src/pages/InfoDetail.js
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
  alpha,
  useTheme,
  Button,
} from "@mui/material";
import { HeartPulse, Activity, Zap, FileText, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useThemeMode } from "../providers/ThemeProviderMUI";
import { useLanguage } from "../contexts/LanguageContext";
import logo from "../assets/morphocheck-logo.png";

export default function InfoDetail() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { mode } = useThemeMode();
  const { t } = useLanguage();

  const styles = {
    premiumCard: {
      background: alpha(theme.palette.background.paper, mode === "dark" ? 0.4 : 0.7),
      backdropFilter: "blur(20px) saturate(180%)",
      WebkitBackdropFilter: "blur(20px) saturate(180%)",
      border: `1px solid ${alpha(theme.palette.common.white, mode === "dark" ? 0.1 : 0.2)}`,
      borderRadius: "24px",
      boxShadow: `0 8px 32px 0 ${alpha(theme.palette.common.black, 0.1)}`,
      height: "100%",
    },
  };

  const features = [
    { icon: Activity, title: t("infoFeat1Title"), desc: t("infoFeat1Desc") },
    { icon: HeartPulse, title: t("infoFeat2Title"), desc: t("infoFeat2Desc") },
    { icon: Zap, title: t("infoFeat3Title"), desc: t("infoFeat3Desc") },
    { icon: FileText, title: t("infoFeat4Title"), desc: t("infoFeat4Desc") },
  ];

  const whyList = [t("whyList1"), t("whyList2"), t("whyList3"), t("whyList4"), t("whyList5")];

  return (
    <Box sx={{ minHeight: "100vh", position: "relative", py: 10 }}>
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 10 }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            startIcon={<ArrowLeft />}
            onClick={() => navigate("/")}
            sx={{ mb: 4, color: "text.secondary" }}
          >
            {t("backBtn")}
          </Button>
        </motion.div>

        <Grid container spacing={6}>
          <Grid item xs={12} md={7}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{
                  mb: 3,
                  width: "fit-content",
                  maxWidth: "100%",
                  p: 1,
                  pr: 2.5,
                  borderRadius: "20px",
                  background:
                    mode === "dark"
                      ? alpha(theme.palette.background.paper, 0.5)
                      : "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(232,248,255,0.9))",
                  border: `1px solid ${alpha(theme.palette.primary.main, mode === "dark" ? 0.24 : 0.16)}`,
                  boxShadow: `0 18px 44px ${alpha(theme.palette.primary.main, mode === "dark" ? 0.12 : 0.1)}`,
                  backdropFilter: "blur(16px)",
                }}
              >
                <Box
                  sx={{
                    width: { xs: 58, sm: 68 },
                    height: { xs: 58, sm: 68 },
                    borderRadius: "16px",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    background:
                      mode === "dark"
                        ? "linear-gradient(145deg, rgba(14,165,233,0.2), rgba(34,197,94,0.14))"
                        : "linear-gradient(145deg, #ffffff, #e9faff)",
                    border: `1px solid ${alpha(theme.palette.common.white, mode === "dark" ? 0.16 : 0.75)}`,
                  }}
                >
                  <Box
                    component="img"
                    src={logo}
                    alt="MorphoCheck Pro"
                    sx={{
                      width: { xs: 50, sm: 60 },
                      height: { xs: 50, sm: 60 },
                      objectFit: "contain",
                      filter: "drop-shadow(0 8px 16px rgba(8, 47, 73, 0.14))",
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="overline"
                    sx={{
                      display: "block",
                      color: "primary.main",
                      fontWeight: 900,
                      lineHeight: 1.1,
                    }}
                  >
                    MorphoCheck Pro
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontWeight: 700, lineHeight: 1.25 }}
                  >
                    Clinical anthropometric platform
                  </Typography>
                </Box>
              </Stack>

              <Typography
                variant="h2"
                sx={{
                  mb: 3,
                  fontWeight: 900,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #0ea5e9 42%, #16a34a 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontSize: { xs: "2.25rem", sm: "3.25rem", md: "4rem" },
                  lineHeight: 1.04,
                }}
              >
                MorphoCheck Pro — {t("infoTitle")}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 6, opacity: 0.9 }}>
                {t("infoSubtitle")}
              </Typography>

              <Stack spacing={4}>
                {features.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <Stack direction="row" spacing={3} alignItems="flex-start">
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: "16px",
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                        }}
                      >
                        <item.icon size={28} />
                      </Box>
                      <Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                          {item.title}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {item.desc}
                        </Typography>
                      </Box>
                    </Stack>
                  </motion.div>
                ))}
              </Stack>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={5}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              <Card sx={styles.premiumCard}>
                <CardContent sx={{ p: 4, position: "relative", overflow: "hidden" }}>
                  <Box
                    component="img"
                    src={logo}
                    alt=""
                    aria-hidden="true"
                    sx={{
                      position: "absolute",
                      top: -36,
                      right: -34,
                      width: 160,
                      height: 160,
                      objectFit: "contain",
                      opacity: mode === "dark" ? 0.1 : 0.08,
                      pointerEvents: "none",
                    }}
                  />
                  <Typography variant="h4" fontWeight="900" gutterBottom>
                    {t("whyUs")}
                  </Typography>
                  <Stack spacing={3} sx={{ mt: 4 }}>
                    {whyList.map((text, i) => (
                      <Stack key={i} direction="row" spacing={2} alignItems="center">
                        <CheckCircle2 size={24} color={theme.palette.success.main} />
                        <Typography variant="body1" fontWeight="500">
                          {text}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>

                  <Box sx={{ mt: 6 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => navigate("/morphocheck-pro")}
                      sx={{
                        py: 2,
                        borderRadius: "16px",
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #8b5cf6 100%)`,
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                      }}
                    >
                      {t("tryNow")}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

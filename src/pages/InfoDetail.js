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
import {
  HeartPulse,
  Activity,
  Zap,
  FileText,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DOFLinesAnimation from "../components/DOFLinesAnimation";
import { useThemeMode } from "../providers/ThemeProviderMUI";
import { useLanguage } from "../contexts/LanguageContext";

export default function InfoDetail() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { mode } = useThemeMode();
  const { t } = useLanguage();

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
      height: "100%",
    },
  };

  const features = [
    { icon: Activity, title: t("infoFeat1Title"), desc: t("infoFeat1Desc") },
    { icon: HeartPulse, title: t("infoFeat2Title"), desc: t("infoFeat2Desc") },
    { icon: Zap, title: t("infoFeat3Title"), desc: t("infoFeat3Desc") },
    { icon: FileText, title: t("infoFeat4Title"), desc: t("infoFeat4Desc") },
  ];

  const whyList = [
    t("whyList1"),
    t("whyList2"),
    t("whyList3"),
    t("whyList4"),
    t("whyList5"),
  ];

  return (
    <Box sx={{ minHeight: "100vh", position: "relative", overflow: "hidden", py: 10 }}>
      <DOFLinesAnimation theme={mode} />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 10 }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
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
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <Typography variant="h2" sx={{ mb: 3, fontWeight: 900 }}>
                MorphoCheck Pro —{" "}
                <Box component="span" sx={styles.heroGradient}>
                  {t("infoTitle")}
                </Box>
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
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.4 }}>
              <Card sx={styles.premiumCard}>
                <CardContent sx={{ p: 4 }}>
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

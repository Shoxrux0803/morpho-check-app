import React from "react";
import { Alert, Box, Chip, Container, Grid, Paper, Stack, Typography } from "@mui/material";
import GppGoodOutlinedIcon from "@mui/icons-material/GppGoodOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";

const items = [
  {
    icon: <LockOutlinedIcon />,
    title: "Kirish huquqi cheklangan",
    text: "Bemor va bolalar ma'lumotlari faqat ruxsatli admin, superadmin va izlanuvchi rollariga ko'rsatiladi.",
  },
  {
    icon: <VerifiedUserOutlinedIcon />,
    title: "Ota-ona yoki vasiy roziligi",
    text: "Bola ma'lumotini kiritishdan oldin qonuniy vakilning ismi, munosabati va rozilik tasdig'i saqlanadi.",
  },
  {
    icon: <AssignmentTurnedInOutlinedIcon />,
    title: "Auditga tayyor iz",
    text: "Rozilik holati, vasiy ma'lumoti va policy versiyasi yozuv bilan birga saqlanadi.",
  },
];

export default function PrivacyCompliancePage() {
  return (
    <Box sx={{ minHeight: "100vh", py: { xs: 4, md: 8 }, bgcolor: "background.default" }}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Box>
            <Chip
              icon={<GppGoodOutlinedIcon />}
              label="HIPAA / GDPR privacy principles"
              color="primary"
              sx={{ mb: 2, fontWeight: 800 }}
            />
            <Typography variant="h3" fontWeight={900} sx={{ mb: 1 }}>
              Maxfiylik va rozilik standarti
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 820 }}>
              MorphoCheck bemorlar va bolalarning sog'lig'iga oid ma'lumotlarini minimal kirish
              huquqi, maqsadli ishlov berish va ota-ona/vasiyning aniq roziligi tamoyillari asosida
              yuritadi.
            </Typography>
          </Box>

          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Ushbu sahifa tizimning maxfiylik amaliyotlarini tasdiqlovchi ichki bayonotdir. Yuridik
            audit yoki rasmiy sertifikatlash talab qilinsa, tashkilotning huquqiy maslahatchisi
            bilan alohida tekshiruv o'tkazilishi kerak.
          </Alert>

          <Grid container spacing={2.5}>
            {items.map((item) => (
              <Grid item xs={12} md={4} key={item.title}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: "100%",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box sx={{ color: "primary.main", mb: 2 }}>{item.icon}</Box>
                  <Typography variant="h6" fontWeight={800} gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.text}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 4 },
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="h5" fontWeight={900} gutterBottom>
              Consent Form matni
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Men bolaning qonuniy vakili sifatida uning shaxsiy, antropometrik va sog'liq
              ma'lumotlarini MorphoCheck tizimida tibbiy tahlil, ilmiy kuzatuv va hisobot tayyorlash
              maqsadida qayta ishlashga rozilik beraman. Ma'lumotlar faqat ruxsatli foydalanuvchilar
              tomonidan ko'riladi va xizmat maqsadlaridan tashqarida ishlatilmaydi.
            </Typography>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}

import React from "react";
import { Alert, Box, Chip, Container, Grid, Paper, Stack, Typography } from "@mui/material";
import GppGoodOutlinedIcon from "@mui/icons-material/GppGoodOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";

const items = [
  {
    icon: <LockOutlinedIcon />,
    title: "Shaxs sha'ni va huquqlari ustuvor",
    text: "Ishtirokchining farovonligi, huquqlari va manfaatlari ilmiy yoki xizmat maqsadlaridan ustun qo'yiladi.",
  },
  {
    icon: <VerifiedUserOutlinedIcon />,
    title: "Xabardor qilingan rozilik",
    text: "Bola ma'lumotini kiritishdan oldin qonuniy vakil tadqiqot maqsadi, ma'lumotlar ishlovi va huquqlari haqida xabardor qilinadi.",
  },
  {
    icon: <AssignmentTurnedInOutlinedIcon />,
    title: "Ilmiy va etik izchillik",
    text: "Rozilik holati, vasiy ma'lumoti va Helsinki deklaratsiyasi asosidagi policy versiyasi yozuv bilan birga saqlanadi.",
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
              label="WMA Declaration of Helsinki ethical principles"
              color="primary"
              sx={{ mb: 2, fontWeight: 800 }}
            />
            <Typography variant="h3" fontWeight={900} sx={{ mb: 1 }}>
              Helsinki deklaratsiyasi asosidagi etik rozilik standarti
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 820 }}>
              MorphoCheck inson ishtirokidagi tibbiy tadqiqotlar uchun Jahon tibbiyot
              assotsiatsiyasining Helsinki deklaratsiyasida belgilangan etik tamoyillarga:
              xabardor qilingan rozilik, shaxs huquqlari, zaif guruhlarni himoya qilish,
              maxfiylik va ilmiy asoslangan maqsadga tayanadi.
            </Typography>
          </Box>

          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Ushbu sahifa tizimning etik rozilik va tadqiqot ma'lumotlari bilan ishlash
            amaliyotlarini bayon qiladi. Tashkilot darajasidagi rasmiy etik komissiya, yuridik
            audit yoki sertifikatlash talab qilinsa, alohida tasdiqlash jarayoni o'tkazilishi kerak.
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
              Rozilik bayonnomasi matni
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Men bolaning qonuniy vakili sifatida uning shaxsiy, antropometrik va sog'liq
              ma'lumotlarini MorphoCheck tizimida tibbiy tahlil, ilmiy kuzatuv va hisobot tayyorlash
              maqsadida qayta ishlashga rozilik beraman. Ushbu rozilik Jahon tibbiyot
              assotsiatsiyasining Helsinki deklaratsiyasi tamoyillariga muvofiq ixtiyoriylik,
              tushunarli axborot berish, bolani himoya qilish, zarar xavfini kamaytirish,
              maxfiylikni saqlash va istalgan vaqtda rozilikni bekor qilish huquqini e'tirof etadi.
            </Typography>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}

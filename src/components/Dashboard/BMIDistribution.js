import React, { useMemo, useState } from "react";
import { Card, CardContent, Typography, Box, useTheme, CircularProgress, Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { MonitorWeight, Fullscreen, Close } from "@mui/icons-material";

const BMIDistribution = ({ data, loading }) => {
  const theme = useTheme();
  const [openModal, setOpenModal] = useState(false);

  const bmiData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let ozgin = 0;
    let normal = 0;
    let ortiqcha = 0;
    let semizlik = 0;

    data.forEach((user) => {
      let bmiStr = user.bmi_status || user.bmiStatus;
      if (!bmiStr) {
        // Ob'ektdan kalkulyatsiya qilinmagan bo'lsa o'zimiz hisoblaymiz
        const w = Number(user.weight);
        const h = Number(user.height) / 100;
        if (w && h) {
          const bmi = w / (h * h);
          if (bmi < 18.5) ozgin++;
          else if (bmi < 25) normal++;
          else if (bmi < 30) ortiqcha++;
          else semizlik++;
        }
        return;
      }

      const status = bmiStr.toLowerCase();
      if (status.includes("ozg'in") || status.includes("underweight")) ozgin++;
      else if (status.includes("normal")) normal++;
      else if (status.includes("ortiqcha") || status.includes("overweight")) ortiqcha++;
      else if (status.includes("semizlik") || status.includes("obese")) semizlik++;
    });

    return [
      { name: "Ozg'in (<18.5)", value: ozgin, color: theme.palette.info.main },
      { name: "Normal (18.5-24.9)", value: normal, color: theme.palette.success.main },
      { name: "Ortiqcha (25-29.9)", value: ortiqcha, color: theme.palette.warning.main },
      { name: "Semizlik (≥30)", value: semizlik, color: theme.palette.error.main },
    ];
  }, [data, theme]);

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={bmiData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {bmiData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            borderRadius: 8, 
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.divider}`
          }} 
          itemStyle={{ color: theme.palette.text.primary }} 
        />
        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12, color: theme.palette.text.primary }}/>
      </PieChart>
    </ResponsiveContainer>
  );

  if (loading) {
    return (
      <Card elevation={2} sx={{ borderRadius: 3, height: "100%" }}>
        <Box display="flex" justifyContent="center" alignItems="center" height={300}>
          <CircularProgress />
        </Box>
      </Card>
    );
  }

  return (
    <>
      <Card elevation={2} sx={{ borderRadius: 3, height: "100%" }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              <MonitorWeight sx={{ mr: 1, verticalAlign: "middle", fontSize: 20 }} /> BMI Taqsimoti
            </Typography>
            <IconButton onClick={() => setOpenModal(true)} size="small" title="Kattalashtirish">
              <Fullscreen />
            </IconButton>
          </Box>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 350 }}>
            {bmiData.reduce((acc, curr) => acc + curr.value, 0) === 0 ? (
               <Typography color="text.secondary">Ma'lumot topilmadi</Typography>
            ) : (
              renderChart()
            )}
          </Box>
        </CardContent>
      </Card>

      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { height: '80vh', borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box display="flex" alignItems="center">
            <MonitorWeight sx={{ mr: 1, color: "primary.main" }} /> 
            BMI Taqsimoti batafsil
          </Box>
          <IconButton onClick={() => setOpenModal(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pb: 4 }}>
          {bmiData.reduce((acc, curr) => acc + curr.value, 0) === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <Typography color="text.secondary">Ma'lumot topilmadi</Typography>
            </Box>
          ) : (
            renderChart()
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BMIDistribution;

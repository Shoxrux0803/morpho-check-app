import React, { useMemo, useState } from "react";
import {
  Typography,
  Box,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { MonitorWeight, Close } from "@mui/icons-material";
import DashboardCard from "./DashboardCard";

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
      { name: "Ozg'in", value: ozgin, color: "#00C49F" },
      { name: "Normal", value: normal, color: "#0088FE" },
      { name: "Ortiqcha", value: ortiqcha, color: "#FFBB28" },
      { name: "Semizlik", value: semizlik, color: "#FF8042" },
    ];
  }, [data]);

  const total = bmiData.reduce((acc, curr) => acc + curr.value, 0);

  const renderChart = (height = 300) => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={bmiData}
          cx="50%"
          cy="50%"
          innerRadius={height * 0.2}
          outerRadius={height * 0.3}
          paddingAngle={5}
          dataKey="value"
          stroke="none"
        >
          {bmiData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 4px 12px rgba(0,0,0,0.5)"
                : "0 4px 12px rgba(0,0,0,0.1)",
            border: "none",
            backgroundColor: theme.palette.background.paper,
            backdropFilter: "blur(5px)",
            color: theme.palette.text.primary,
          }}
          itemStyle={{ color: theme.palette.text.primary }}
        />
        <Legend verticalAlign="bottom" height={36} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <>
      <DashboardCard
        title="BMI Taqsimoti"
        icon={<MonitorWeight />}
        loading={loading}
        onFullscreen={() => setOpenModal(true)}
      >
        {total === 0 ? (
          <Typography color="text.secondary">Ma'lumot topilmadi</Typography>
        ) : (
          renderChart(300)
        )}
      </DashboardCard>

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background:
              theme.palette.mode === "dark"
                ? "rgba(23, 26, 33, 0.95)"
                : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            border:
              theme.palette.mode === "dark"
                ? "1px solid rgba(255,255,255,0.12)"
                : "1px solid rgba(100,116,139,0.15)",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 24px 48px rgba(0,0,0,0.5)"
                : "0 24px 48px rgba(100,116,139,0.15)",
          },
        }}
      >
        <DialogTitle
          sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <Box display="flex" alignItems="center">
            <MonitorWeight sx={{ mr: 1, color: "primary.main" }} />
            BMI Taqsimoti batafsil
          </Box>
          <IconButton onClick={() => setOpenModal(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pb: 4 }}>
          {total === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" height={400}>
              <Typography color="text.secondary">Ma'lumot topilmadi</Typography>
            </Box>
          ) : (
            renderChart(500)
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BMIDistribution;

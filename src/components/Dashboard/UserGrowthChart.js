import React, { useMemo, useState } from "react";
import { Card, CardContent, Typography, Box, useTheme, CircularProgress, Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Fullscreen, Close } from "@mui/icons-material";

const UserGrowthChart = ({ data, loading }) => {
  const theme = useTheme();
  const [openModal, setOpenModal] = useState(false);

  const growthData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Oxirgi 30 kun uchun sanalar ro'yxatini shakllantirish
    const datesArr = [];
    const datesMap = {};
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0]; // "YYYY-MM-DD"
      datesArr.push(dateStr);
      datesMap[dateStr] = 0;
    }

    // Har bir sana uchun foydalanuvchilarni sanash
    data.forEach((user) => {
      if (user.createdAt || user.created_at) {
        const dateStr = (user.createdAt || user.created_at).split("T")[0];
        if (datesMap[dateStr] !== undefined) {
          datesMap[dateStr]++;
        }
      }
    });

    // Chart uchun data formatlash
    return datesArr.map((dateStr) => {
      const d = new Date(dateStr);
      const formattedDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return {
        date: formattedDate,
        users: datesMap[dateStr],
      };
    });
  }, [data]);

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={growthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="date" 
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} 
          axisLine={{ stroke: theme.palette.divider }}
          tickLine={false}
          minTickGap={20}
        />
        <YAxis 
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} 
          axisLine={{ stroke: theme.palette.divider }}
          tickLine={false}
        />
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
        <Tooltip
          contentStyle={{ 
            borderRadius: 8, 
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[3]
          }}
          itemStyle={{ color: theme.palette.text.primary }}
          labelStyle={{ fontWeight: "bold", color: theme.palette.text.primary, marginBottom: 4 }}
        />
        <Area 
          type="monotone" 
          dataKey="users" 
          name="Yangi foydalanuvchilar"
          stroke={theme.palette.primary.main} 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorUsers)" 
          animationDuration={1500}
        />
      </AreaChart>
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
              <TrendingUp sx={{ mr: 1, verticalAlign: "middle", fontSize: 20 }} /> Oxirgi 30 kundagi o'sish
            </Typography>
            <IconButton onClick={() => setOpenModal(true)} size="small" title="Kattalashtirish">
              <Fullscreen />
            </IconButton>
          </Box>
          <Box sx={{ flexGrow: 1, height: 350 }}>
            {growthData.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography color="text.secondary">Ma'lumot topilmadi</Typography>
              </Box>
            ) : (
              renderChart()
            )}
          </Box>
        </CardContent>
      </Card>

      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { height: '80vh', borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box display="flex" alignItems="center">
            <TrendingUp sx={{ mr: 1, color: "primary.main" }} /> 
            Oxirgi 30 kundagi o'sish batafsil
          </Box>
          <IconButton onClick={() => setOpenModal(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pb: 4 }}>
          {growthData.length === 0 ? (
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

export default UserGrowthChart;

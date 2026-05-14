import React from "react";
import { Grid, Card, CardContent, Typography, Box, useTheme, Avatar } from "@mui/material";
import {
  People,
  PersonAdd,
  TrendingUp,
  TrendingDown,
  Analytics,
  Straighten,
  DoneAll,
} from "@mui/icons-material";

const StatsCards = ({ totalUsers, todayUsers, activeUsers, avgAge, avgBMI, normalBMIPercent }) => {
  const theme = useTheme();

  const isDark = theme.palette.mode === "dark";

  const stats = [
    {
      title: "Jami foydalanuvchilar",
      value: totalUsers?.toLocaleString() || "0",
      change: "+5.4%",
      trend: "up",
      icon: <People />,
      color: theme.palette.primary.main,
      bg: isDark ? `${theme.palette.primary.main}26` : "rgba(25, 118, 210, 0.1)",
    },
    {
      title: "Bugun qo'shilganlar",
      value: todayUsers?.toLocaleString() || "0",
      change: todayUsers > 0 ? "Faol" : "Kutilmoqda",
      trend: todayUsers > 0 ? "up" : "down",
      icon: <PersonAdd />,
      color: theme.palette.success.main,
      bg: isDark ? `${theme.palette.success.main}26` : "rgba(46, 125, 50, 0.1)",
    },
    {
      title: "O'rtacha IBT (BMI)",
      value: avgBMI?.toFixed(1) || "0.0",
      change: "Normal chegarada",
      trend: "up",
      icon: <Straighten />,
      color: theme.palette.info.main,
      bg: isDark ? `${theme.palette.info.main}26` : "rgba(2, 136, 209, 0.1)",
    },
    {
      title: "Sog'lom vazn ulushi",
      value: (normalBMIPercent || 0).toFixed(1) + "%",
      change: "Populyatsiya",
      trend: "up",
      icon: <DoneAll />,
      color: theme.palette.secondary.main,
      bg: isDark ? `${theme.palette.secondary.main}26` : "rgba(156, 39, 176, 0.1)",
    },
  ];

  return (
    <Grid container spacing={3} mb={4}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card
            className="mc-surface-reveal mc-ambient-sheen"
            elevation={0}
            sx={{
              "--mc-delay": `${index * 70}ms`,
              height: "100%",
              borderRadius: 4,
              position: "relative",
              overflow: "hidden",
              background: isDark ? "rgba(23, 26, 33, 0.7)" : "rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(10px)",
              border: isDark
                ? "1px solid rgba(255, 255, 255, 0.08)"
                : "1px solid rgba(255, 255, 255, 0.3)",
              boxShadow: isDark
                ? "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
                : "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
              transition:
                "transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease, border-color 0.28s ease",
              "&:hover": {
                transform: "translateY(-6px) scale(1.01)",
                borderColor: `${stat.color}55`,
                boxShadow: isDark
                  ? "0 12px 40px 0 rgba(0, 0, 0, 0.45)"
                  : "0 12px 40px 0 rgba(31, 38, 135, 0.12)",
              },
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="500" gutterBottom>
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" fontWeight="800" sx={{ mb: 1, letterSpacing: -0.5 }}>
                    {stat.value}
                  </Typography>
                  <Box display="flex" alignItems="center">
                    {stat.trend === "up" ? (
                      <TrendingUp sx={{ color: "success.main", fontSize: 16, mr: 0.5 }} />
                    ) : (
                      <TrendingDown sx={{ color: "error.main", fontSize: 16, mr: 0.5 }} />
                    )}
                    <Typography
                      variant="caption"
                      color={stat.trend === "up" ? "success.main" : "error.main"}
                      fontWeight="bold"
                    >
                      {stat.change}
                    </Typography>
                  </Box>
                </Box>
                <Avatar
                  className="mc-soft-pop"
                  sx={{
                    "--mc-delay": `${index * 90 + 120}ms`,
                    bgcolor: stat.bg,
                    color: stat.color,
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                  }}
                >
                  {stat.icon}
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatsCards;

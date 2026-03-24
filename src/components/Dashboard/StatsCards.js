import React from "react";
import { Grid, Card, CardContent, Typography, Box } from "@mui/material";
import { People, PersonAdd, TrendingUp, TrendingDown, Analytics } from "@mui/icons-material";

const StatsCards = ({ totalUsers, todayUsers, activeUsers, avgAge }) => {
  const stats = [
    {
      title: "Jami foydalanuvchilar",
      value: totalUsers?.toLocaleString() || "0",
      change: "+12%",
      trend: "up",
      icon: <People sx={{ fontSize: 40 }} />,
      color: "primary.main",
    },
    {
      title: "Bugun qo'shilganlar",
      value: todayUsers?.toLocaleString() || "0",
      change: "+5%",
      trend: "up",
      icon: <PersonAdd sx={{ fontSize: 40 }} />,
      color: "success.main",
    },
    {
      title: "Faol foydalanuvchilar",
      value: activeUsers?.toLocaleString() || "0",
      change: "+8%",
      trend: "up",
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      color: "warning.main",
    },
    {
      title: "O'rtacha yosh",
      value: avgAge?.toString() || "0",
      change: "-2%",
      trend: "down",
      icon: <Analytics sx={{ fontSize: 40 }} />,
      color: "info.main",
    },
  ];

  return (
    <Grid container spacing={3}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color={stat.color}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {stat.title}
                  </Typography>
                  <Box display="flex" alignItems="center">
                    {stat.trend === "up" ? (
                      <TrendingUp sx={{ color: "success.main", fontSize: 16, mr: 0.5 }} />
                    ) : (
                      <TrendingDown sx={{ color: "error.main", fontSize: 16, mr: 0.5 }} />
                    )}
                    <Typography
                      variant="body2"
                      color={stat.trend === "up" ? "success.main" : "error.main"}
                      fontWeight="medium"
                    >
                      {stat.change} o'tgan oydan
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ color: stat.color }}>{stat.icon}</Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatsCards;

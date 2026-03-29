import React, { useMemo } from "react";
import { Typography, useTheme } from "@mui/material";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "@mui/icons-material";
import DashboardCard from "./DashboardCard";

const UserGrowthChart = ({ data, loading }) => {
  const theme = useTheme();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const grouped = {};
    data.forEach((user) => {
      const date = user.created_at || user.createdAt;
      if (date) {
        const day = new Date(date).toLocaleDateString("uz-UZ", {
          month: "short",
          day: "numeric",
        });
        grouped[day] = (grouped[day] || 0) + 1;
      }
    });

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .slice(-10); // Oxirgi 10 kun
  }, [data]);

  return (
    <DashboardCard title="Foydalanuvchilar O'sishi" icon={<TrendingUp />} loading={loading}>
      {chartData.length === 0 ? (
        <Typography color="text.secondary">Ma'lumot topilmadi</Typography>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
            <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: theme.palette.text.secondary }} 
            />
            <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: theme.palette.text.secondary }} 
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: 12, 
                boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.1)',
                border: 'none',
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary
              }} 
              itemStyle={{ color: theme.palette.text.primary }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={theme.palette.primary.main}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValue)"
              name="Foydalanuvchilar"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </DashboardCard>
  );
};

export default UserGrowthChart;

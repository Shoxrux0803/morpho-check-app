import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { Typography, useTheme } from "@mui/material";
import { AccessibilityNew } from "@mui/icons-material";
import DashboardCard from "./DashboardCard";
import { useLanguage } from "../../contexts/LanguageContext";

const SomatotypeAnalysis = ({ data, loading }) => {
  const theme = useTheme();
  const { t } = useLanguage();

  const somatotypeData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const counts = {};

    data.forEach((user) => {
      const type = (user.somatotype || t("unknown")).trim();
      if (type) {
        counts[type] = (counts[type] || 0) + 1;
      }
    });

    const entries = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return entries.slice(0, 8); // Top 8 somatotypes
  }, [data, t]);

  const total = somatotypeData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <DashboardCard title={t("somatotypeLabel")} icon={<AccessibilityNew />} loading={loading}>
      {total === 0 ? (
        <Typography color="text.secondary">{t("noData")}</Typography>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={somatotypeData} margin={{ bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              tick={{ fontSize: 10, fill: theme.palette.text.secondary }}
              interval={0}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
            />
            <Tooltip
              cursor={{ fill: theme.palette.divider, opacity: 0.1 }}
              contentStyle={{
                borderRadius: 12,
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 4px 12px rgba(0,0,0,0.5)"
                    : "0 4px 12px rgba(0,0,0,0.1)",
                border: "none",
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
              }}
              itemStyle={{ color: theme.palette.text.primary }}
            />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              barSize={25}
              fill={theme.palette.secondary.main}
            >
              {somatotypeData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index % 2 === 0 ? theme.palette.primary.light : theme.palette.primary.main}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </DashboardCard>
  );
};

export default SomatotypeAnalysis;

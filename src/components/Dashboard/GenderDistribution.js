import React, { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Box, Typography, useTheme } from "@mui/material";
import { Wc } from "@mui/icons-material";
import DashboardCard from "./DashboardCard";

const GenderDistribution = ({ data, loading }) => {
  const theme = useTheme();

  const genderData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let male = 0;
    let female = 0;

    data.forEach((user) => {
      const g = (user.gender || "").toLowerCase();

      // Robust male check
      const isMale =
        g === "m" ||
        g === "male" ||
        g === "boy" ||
        g.includes("o'g'il") ||
        g.includes("о'ғил") ||
        g.includes("муж");
      // Robust female check
      const isFemale =
        g === "f" ||
        g === "female" ||
        g === "girl" ||
        g.includes("qiz") ||
        g.includes("қиз") ||
        g.includes("жен");

      if (isMale) male++;
      else if (isFemale) female++;
    });

    return [
      { name: "Erkak", value: male, color: "#0088FE" },
      { name: "Ayol", value: female, color: "#FF8042" },
    ];
  }, [data]);

  const total = genderData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <DashboardCard title="Jins Taumoti" icon={<Wc />} loading={loading}>
      {total === 0 ? (
        <Typography color="text.secondary">Ma'lumot topilmadi</Typography>
      ) : (
        <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {genderData.map((entry, index) => (
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
                  color: theme.palette.text.primary,
                }}
                itemStyle={{ color: theme.palette.text.primary }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              pointerEvents: "none",
              mb: 4,
            }}
          >
            <Typography variant="h5" fontWeight="bold">
              {total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Jami
            </Typography>
          </Box>
        </Box>
      )}
    </DashboardCard>
  );
};

export default GenderDistribution;

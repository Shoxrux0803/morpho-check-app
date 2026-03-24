import React from "react";
import { Card, CardContent, Typography } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const AgeWeightChart = () => {
  const data = [
    { age: "18-25", weight: 68, users: 1200 },
    { age: "26-35", weight: 72, users: 1800 },
    { age: "36-45", weight: 75, users: 900 },
    { age: "46-55", weight: 78, users: 600 },
    { age: "56+", weight: 76, users: 300 },
  ];

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 2, height: "100%" }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Yosh va vazn taqsimoti
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="age" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Bar yAxisId="left" dataKey="weight" fill="#1976d2" name="O'rtacha vazn (kg)" />
            <Bar yAxisId="right" dataKey="users" fill="#ed6c02" name="Foydalanuvchilar" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default AgeWeightChart;

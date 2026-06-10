import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const RegionalChart = () => {
  const data = [
    { region: 'Toshkent', users: 4231 },
    { region: 'Samarqand', users: 2876 },
    { region: 'Buxoro', users: 1954 },
    { region: 'Andijon', users: 3120 },
    { region: 'Fargʻona', users: 2789 },
    { region: 'Namangan', users: 2345 },
  ];

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 2, height: '100%' }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Viloyatlar bo'yicha foydalanuvchilar
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="region" width={80} />
            <Tooltip />
            <Bar dataKey="users" fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RegionalChart;

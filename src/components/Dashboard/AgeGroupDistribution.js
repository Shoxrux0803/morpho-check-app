import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Typography, useTheme, Box } from '@mui/material';
import { Cake } from '@mui/icons-material';
import DashboardCard from './DashboardCard';

const AgeGroupDistribution = ({ data, loading }) => {
  const theme = useTheme();

  const ageData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const counts = {
      '0-5': 0,
      '6-12': 0,
      '13-18': 0,
      '18+': 0
    };

    data.forEach((user) => {
      const age = Number(user.age);
      if (age <= 5) counts['0-5']++;
      else if (age <= 12) counts['6-12']++;
      else if (age <= 18) counts['13-18']++;
      else counts['18+']++;
    });

    return [
      { name: '0-5 yosh', value: counts['0-5'], color: '#8884d8' },
      { name: '6-12 yosh', value: counts['6-12'], color: '#82ca9d' },
      { name: '13-18 yosh', value: counts['13-18'], color: '#ffc658' },
      { name: '18+ yosh', value: counts['18+'], color: '#ff7300' },
    ];
  }, [data]);

  const total = ageData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <DashboardCard title="Yosh Guruhlari" icon={<Cake />} loading={loading}>
      {total === 0 ? (
        <Typography color="text.secondary">Ma'lumot topilmadi</Typography>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ageData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
            <XAxis type="number" hide />
            <YAxis 
                type="category" 
                dataKey="name" 
                width={70} 
                tick={{ fontSize: 12, fontWeight: 500, fill: theme.palette.text.secondary }} 
                axisLine={false}
                tickLine={false}
            />
            <Tooltip 
              cursor={{ fill: theme.palette.divider, opacity: 0.1 }}
              contentStyle={{ 
                borderRadius: 12, 
                boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.1)',
                border: 'none',
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary
              }} 
              itemStyle={{ color: theme.palette.text.primary }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
              {ageData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </DashboardCard>
  );
};

export default AgeGroupDistribution;

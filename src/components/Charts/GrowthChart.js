// src/components/Charts/GrowthChart.jsx
import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Legend,
  Label,
} from 'recharts';
import { useTheme } from '@mui/material';
import { WHO_DATA } from '../../utils/growthReference';
import { useLanguage } from '../../contexts/LanguageContext';

const GrowthChart = ({ gender, age, type, value }) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const isDark = theme.palette.mode === 'dark';

  const dataKey = gender === 'erkak' || gender === 'male' || gender === 'o\'g\'il' ? 'boys' : 'girls';
  const indicatorKey = type === 'height' ? 'heightForAge' : 'bmiForAge';
  const rawData = WHO_DATA[dataKey][indicatorKey];

  // Ranglar va uslublar
  const colors = {
    sd3: isDark ? '#ff5252' : '#d32f2f', // Qizil
    sd2: isDark ? '#ffa726' : '#f57c00', // To'q sariq
    sd1: isDark ? '#ffeb3b' : '#fbc02d', // Sariq
    median: isDark ? '#4caf50' : '#2e7d32', // Yashil
    patient: isDark ? '#ffffff' : '#000000',
    grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    text: theme.palette.text.secondary,
  };

  const chartData = useMemo(() => rawData, [rawData]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: isDark ? '#1a1a2e' : '#fff',
          padding: '10px',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>{payload[0].payload.age} {t('yearsOld')}</p>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            {payload.map((p, i) => (
              <p key={i} style={{ margin: '2px 0', color: p.color }}>
                {p.name}: {p.value}
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 400, marginTop: '20px' }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
          <XAxis 
            dataKey="age" 
            stroke={colors.text} 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
          >
            <Label value={t('ageLabel')} offset={-10} position="insideBottom" fill={colors.text} fontSize={12} />
          </XAxis>
          <YAxis 
            stroke={colors.text} 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            domain={['auto', 'auto']}
          >
            <Label 
              value={type === 'height' ? 'cm' : 'BMI'} 
              angle={-90} 
              position="insideLeft" 
              style={{ textAnchor: 'middle', fill: colors.text, fontSize: 12 }} 
            />
          </YAxis>
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} iconType="plainline" />

          {/* Z-Score Lines */}
          <Line name="+3 SD" type="monotone" dataKey="sd3pos" stroke={colors.sd3} strokeWidth={1} dot={false} strokeDasharray="5 5" />
          <Line name="+2 SD" type="monotone" dataKey="sd2pos" stroke={colors.sd2} strokeWidth={1} dot={false} strokeDasharray="3 3" />
          <Line name="+1 SD" type="monotone" dataKey="sd1pos" stroke={colors.sd1} strokeWidth={1} dot={false} />
          <Line name="Median" type="monotone" dataKey="median" stroke={colors.median} strokeWidth={2.5} dot={false} />
          <Line name="-1 SD" type="monotone" dataKey="sd1neg" stroke={colors.sd1} strokeWidth={1} dot={false} />
          <Line name="-2 SD" type="monotone" dataKey="sd2neg" stroke={colors.sd2} strokeWidth={1} dot={false} strokeDasharray="3 3" />
          <Line name="-3 SD" type="monotone" dataKey="sd3neg" stroke={colors.sd3} strokeWidth={1} dot={false} strokeDasharray="5 5" />

          {/* Current Patient Data Point */}
          {age && value && (
            <ReferenceDot 
              x={Number(age)} 
              y={Number(value)} 
              r={6} 
              fill={theme.palette.primary.main} 
              stroke="#fff" 
              strokeWidth={2}
              isFront={true}
              label={{ position: 'top', value: `${value}`, fill: colors.text, fontSize: 13, fontWeight: 700 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GrowthChart;

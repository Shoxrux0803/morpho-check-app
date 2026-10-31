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
import { Alert, useTheme } from '@mui/material';
import WHO_DATA from '../../data/who2007Charts.json';
import WHO_V6 from '../../data/whoLmsV6.json';
import { useLanguage } from '../../contexts/LanguageContext';

const GrowthChart = ({ gender, age, type, value }) => {
  const theme = useTheme();
  const { t, lang } = useLanguage();
  const isDark = theme.palette.mode === 'dark';

  const dataKey = ['erkak', 'male', "o'g'il", 'boy', 'boys'].includes(
    String(gender).toLowerCase()
  )
    ? 'boys'
    : 'girls';
  const indicatorKey =
    type === 'height'
      ? 'heightForAge'
      : type === 'weight'
        ? 'weightForAge'
        : 'bmiForAge';
  const baseData = WHO_DATA[dataKey];
  const rawData = baseData[indicatorKey];

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

  const chartData = useMemo(() => {
    const indicator =
      type === 'height' ? 'HFA' : type === 'weight' ? 'WFA' : 'BFA';
    const sex = dataKey === 'boys' ? 'male' : 'female';
    const suppliedRows = WHO_V6.filter(
      (row) => row.indicator === indicator && row.sex === sex
    ).map((row) => {
      const at = (z) =>
        row.L === 0
          ? row.M * Math.exp(row.S * z)
          : row.M * Math.pow(1 + row.L * row.S * z, 1 / row.L);
      return {
        age: row.month / 12,
        sd3neg: at(-3),
        sd2neg: at(-2),
        sd1neg: at(-1),
        median: row.M,
        sd1pos: at(1),
        sd2pos: at(2),
        sd3pos: at(3),
      };
    });
    return [...suppliedRows, ...rawData.filter((row) => row.age > 90 / 12)];
  }, [rawData, type, dataKey]);

  if (
    !Number.isFinite(Number(age)) ||
    Number(age) < 30 / 12 ||
    Number(age) > (type === 'weight' ? 10 : 19)
  ) {
    return (
      <Alert severity="info">
        {lang === 'en'
          ? `The supplied reference is available from 30 months to ${type === 'weight' ? 10 : 19} years. This age is outside the chart range.`
          : `Ma’lumotnoma 30 oylikdan ${type === 'weight' ? 10 : 19} yoshgacha mavjud. Ushbu yosh uchun me’yor chizig‘i ko‘rsatilmaydi.`}
      </Alert>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: isDark ? '#1a1a2e' : '#fff',
            padding: '10px',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <p style={{ margin: 0, fontWeight: 700, fontSize: '14px' }}>
            {payload[0].payload.age} {t('yearsOld')}
          </p>
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
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={colors.grid}
            vertical={false}
          />
          <XAxis
            dataKey="age"
            type="number"
            domain={[61 / 12, type === 'weight' ? 10 : 19]}
            tickFormatter={(v) => Number(v.toFixed(1))}
            stroke={colors.text}
            fontSize={12}
            tickLine={false}
            axisLine={false}
          >
            <Label
              value={t('ageLabel')}
              offset={-10}
              position="insideBottom"
              fill={colors.text}
              fontSize={12}
            />
          </XAxis>
          <YAxis
            stroke={colors.text}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
          >
            <Label
              value={type === 'bmi' ? 'BMI' : type === 'weight' ? 'kg' : 'cm'}
              angle={-90}
              position="insideLeft"
              style={{ textAnchor: 'middle', fill: colors.text, fontSize: 12 }}
            />
          </YAxis>
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} iconType="plainline" />

          {/* Z-Score Lines */}
          <Line
            name="+3 SD"
            type="monotone"
            dataKey="sd3pos"
            stroke={colors.sd3}
            strokeWidth={1}
            dot={false}
            strokeDasharray="5 5"
          />
          <Line
            name="+2 SD"
            type="monotone"
            dataKey="sd2pos"
            stroke={colors.sd2}
            strokeWidth={1}
            dot={false}
            strokeDasharray="3 3"
          />
          <Line
            name="+1 SD"
            type="monotone"
            dataKey="sd1pos"
            stroke={colors.sd1}
            strokeWidth={1}
            dot={false}
          />
          <Line
            name="Median"
            type="monotone"
            dataKey="median"
            stroke={colors.median}
            strokeWidth={2.5}
            dot={false}
          />
          <Line
            name="-1 SD"
            type="monotone"
            dataKey="sd1neg"
            stroke={colors.sd1}
            strokeWidth={1}
            dot={false}
          />
          <Line
            name="-2 SD"
            type="monotone"
            dataKey="sd2neg"
            stroke={colors.sd2}
            strokeWidth={1}
            dot={false}
            strokeDasharray="3 3"
          />
          <Line
            name="-3 SD"
            type="monotone"
            dataKey="sd3neg"
            stroke={colors.sd3}
            strokeWidth={1}
            dot={false}
            strokeDasharray="5 5"
          />

          {/* Current Patient Data Point */}
          {age && value && (
            <ReferenceDot
              x={Number(age)}
              y={Number(value)}
              ifOverflow="extendDomain"
              r={6}
              fill={theme.palette.primary.main}
              stroke="#fff"
              strokeWidth={2}
              isFront={true}
              label={{
                position: 'top',
                value: `${value}`,
                fill: colors.text,
                fontSize: 13,
                fontWeight: 700,
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GrowthChart;

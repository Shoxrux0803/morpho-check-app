import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLanguage } from '../../contexts/LanguageContext';
import { ResearchApi } from '../../services/api';

export default function ChildTimeline({ record }) {
  const { lang } = useLanguage();
  const en = lang === 'en';
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    let active = true;
    setState({ loading: true });
    ResearchApi.timeline(record.id)
      .then((data) => {
        if (active) setState({ data });
      })
      .catch((error) => {
        if (active) setState({ error: error.message });
      });
    return () => {
      active = false;
    };
  }, [record.id]);
  const visits = state.data?.visits || [];
  const chartData = visits
    .filter((v) => v.date && Number(v.height) > 0)
    .map((v) => ({
      ...v,
      height: Number(v.height),
      date: v.date.slice(0, 10),
    }));
  return (
    <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 3 }}>
      <Typography fontWeight={650} sx={{ mb: 1 }}>
        {en
          ? 'Child profile · repeat visits'
          : 'Bolaning kartasi · takroriy tashriflar'}
      </Typography>
      {state.loading && <CircularProgress size={22} />}
      {state.error && <Alert severity="error">{state.error}</Alert>}
      {state.data && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {state.data.subject_code
              ? `${state.data.subject_code} · ${state.data.total} ${en ? 'visits' : 'tashrif'}`
              : en
                ? 'No stable child code. Only this visit is shown; enter the same code on future visits to link them.'
                : 'Doimiy kod yo‘q. Hozir faqat shu tashrif ko‘rsatiladi. Keyingi tashriflarda bir xil kod kiriting.'}
          </Typography>
          {state.data.truncated && (
            <Alert severity="info">
              {en
                ? 'Showing the first 500 visits.'
                : 'Birinchi 500 tashrif ko‘rsatilmoqda.'}
            </Alert>
          )}
          {chartData.length > 1 && (
            <Box sx={{ height: 220, mb: 2 }}>
              <ResponsiveContainer>
                <LineChart
                  data={chartData}
                  margin={{ left: 0, right: 20, top: 15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis
                    domain={['auto', 'auto']}
                    unit=" cm"
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip />
                  <Line
                    type="linear"
                    dataKey="height"
                    name={en ? 'Height (cm)' : 'Bo‘y (sm)'}
                    stroke="#148578"
                    strokeWidth={2}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {[
                    en ? 'Date' : 'Sana',
                    en ? 'Height (cm)' : 'Bo‘y (sm)',
                    en ? 'Weight (kg)' : 'Vazn (kg)',
                    'BMI (kg/m²)',
                  ].map((v) => (
                    <TableCell key={v}>{v}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {visits.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>{v.date || '—'}</TableCell>
                    <TableCell>{v.height ?? '—'}</TableCell>
                    <TableCell>{v.weight ?? '—'}</TableCell>
                    <TableCell>
                      {v.height > 0 && v.weight > 0
                        ? (v.weight / (v.height / 100) ** 2).toFixed(1)
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Paper>
  );
}

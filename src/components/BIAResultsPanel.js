import React from 'react';
import {
  Alert,
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';

export default function BIAResultsPanel({ data }) {
  const { lang } = useLanguage();
  const en = lang === 'en';
  if (!data) return null;
  const items = [
    ['TBW', data.tbw_percent, '%'],
    ['PBF', data.pbf_percent, '%'],
    [en ? 'Fat mass' : 'Yog‘ massasi', data.fat_mass_kg, 'kg'],
    [en ? 'Fat-free mass' : 'Yog‘siz massa', data.ffm_kg, 'kg'],
    [en ? 'Skeletal muscle' : 'Skelet mushaklari', data.smm_kg, 'kg'],
    ['BMR', data.bmr_kcal_day, 'kcal/day'],
  ];
  const sourceLabel = (source) =>
    !source
      ? en
        ? 'Unknown'
        : 'Noma’lum'
      : /calculated|schofield/.test(source)
        ? en
          ? 'Calculated'
          : 'Hisoblangan'
        : /estimated|fallback/.test(source)
          ? en
            ? 'Estimated'
            : 'Taxminiy'
          : ['admin_input', 'measured', 'device', 'device_report'].includes(
                source
              )
            ? en
              ? 'Measured input'
              : 'Kiritilgan o‘lchov'
            : source;
  const metadata = data.metadata || {};
  return (
    <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Typography fontWeight={650}>
          {en ? 'Body composition · BIA' : 'Tana tarkibi · BIA'}
        </Typography>
        <Chip
          size="small"
          variant="outlined"
          color={
            data.qc_status === 'error'
              ? 'error'
              : data.qc_status === 'warning'
                ? 'warning'
                : 'default'
          }
          label={
            data.qc_status === 'ok'
              ? en
                ? 'Checked'
                : 'Tekshirildi'
              : en
                ? 'Review needed'
                : 'Tekshirish kerak'
          }
        />
      </Stack>
      {data.qc_status !== 'ok' && (
        <Alert
          severity={data.qc_status === 'error' ? 'error' : 'info'}
          sx={{ mb: 2 }}
        >
          {en
            ? 'Review device readings, units and measurement conditions. A reference interval may not be available for every value.'
            : 'Qurilma qiymatlari, birliklar va o‘lchov sharoitlarini tekshiring. Har bir qiymat uchun me’yor oralig‘i mavjud bo‘lmasligi mumkin.'}
        </Alert>
      )}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {Object.entries(metadata)
          .filter(([, value]) => value)
          .map(([key, value]) => (
            <Chip
              key={key}
              size="small"
              variant="outlined"
              label={`${{ device_manufacturer: en ? 'Manufacturer' : 'Ishlab chiqaruvchi', device_model: en ? 'Device' : 'Qurilma', measurement_date: en ? 'Date' : 'Sana', measurement_method: en ? 'Protocol' : 'Protokol' }[key] || key}: ${value}`}
            />
          ))}
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {[
                en ? 'Indicator' : 'Ko‘rsatkich',
                en ? 'Value' : 'Qiymat',
                en ? 'Source' : 'Manba',
              ].map((v) => (
                <TableCell key={v}>{v}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(([label, metric, unit]) => (
              <TableRow key={label}>
                <TableCell>{label}</TableCell>
                <TableCell>
                  {metric?.used_value ?? metric?.value ?? '—'} {unit}
                </TableCell>
                <TableCell>{sourceLabel(metric?.source)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: 1.5 }}
      >
        {en
          ? 'Measured inputs and formula-derived values remain separate.'
          : 'Kiritilgan o‘lchovlar va formula bilan hisoblangan qiymatlar alohida ko‘rsatiladi.'}
      </Typography>
    </Paper>
  );
}

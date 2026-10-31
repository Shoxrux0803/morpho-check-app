import React from 'react';
import { Alert, Box, Chip, Paper, Stack, Typography } from '@mui/material';
import { FactCheckOutlined } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { reviewMeasurements } from '../utils/measurementQuality';

export default function MeasurementQualityPanel({ data }) {
  const { lang } = useLanguage();
  const en = lang === 'en';
  const q = reviewMeasurements(data);
  const estimatedCount = Object.entries(
    data?.referenceTemplate?.values || {}
  ).filter(
    ([key, value]) =>
      data?.[key] !== '' &&
      data?.[key] != null &&
      Number(data[key]) === Number(value)
  ).length;
  const labels = en
    ? {
        height: 'Height',
        weight: 'Weight',
        shoulder: 'Shoulder breadth',
        thigh: 'Thigh circumference',
      }
    : {
        height: 'Bo‘y',
        weight: 'Vazn',
        shoulder: 'Yelka kengligi',
        thigh: 'Son aylanasi',
      };
  return (
    <Paper
      className="analysis-quality-panel"
      variant="outlined"
      sx={{ p: 2.5, mb: 3, borderRadius: 3, bgcolor: 'background.paper' }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <FactCheckOutlined color="primary" />
        <Typography fontWeight={650}>
          {en ? 'Data quality' : 'Ma’lumot sifati'}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Chip
          size="small"
          variant="outlined"
          label={
            q.issues.length
              ? `${q.issues.length} ${en ? 'to review' : 'tekshiruv'}`
              : en
                ? 'Source review'
                : 'Manba tekshiruvi'
          }
          color={q.issues.length ? 'warning' : 'default'}
        />
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {en
          ? 'Enter height and circumferences in cm, weight in kg.'
          : 'Bo‘y va aylanalarni sm, vaznni kg da kiriting.'}
      </Typography>
      {estimatedCount > 0 && (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          {en
            ? `${estimatedCount} fields contain age-based template estimates. Replace them with actual measurements.`
            : `${estimatedCount} ta maydon yoshga mos taxminiy jadval bilan to‘ldirilgan. Haqiqiy o‘lchovlar bilan almashtiring.`}
        </Alert>
      )}
      {q.missing.length > 0 && (
        <Typography variant="body2" sx={{ mb: 1 }}>
          {en ? 'Missing: ' : 'Yetishmayapti: '}
          {q.missing.map((key) => labels[key]).join(', ')}
        </Typography>
      )}
      {q.issues.map(({ key, reason, unit }) => (
        <Alert key={`${key}-${reason}`} severity="warning" sx={{ mb: 1 }}>
          {labels[key]}:{' '}
          {reason === 'positive'
            ? en
              ? 'Enter a positive number.'
              : 'Musbat raqam kiriting.'
            : en
              ? `Check the source measurement and unit (${unit}).`
              : `Manba o‘lchovi va birlikni (${unit}) tekshiring.`}
        </Alert>
      ))}
      {q.bmi != null && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2">
            BMI: <strong>{q.bmi.toFixed(1)} kg/m²</strong>
          </Typography>
          <Chip size="small" label={en ? 'Calculated' : 'Hisoblangan'} />
        </Stack>
      )}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: 1 }}
      >
        {en
          ? 'BMI = weight / (height in metres)². Structural checks are not a clinical assessment.'
          : 'BMI = vazn / (metrda bo‘y)². Bu tekshiruv klinik baholash hisoblanmaydi.'}
      </Typography>
    </Paper>
  );
}

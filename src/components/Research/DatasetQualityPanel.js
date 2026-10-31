import React from 'react';
import { Alert, Chip, Paper, Stack, Typography } from '@mui/material';
import { useLanguage } from '../../contexts/LanguageContext';
import { reviewMeasurements } from '../../utils/measurementQuality';

export default function DatasetQualityPanel({ rows }) {
  const { lang } = useLanguage();
  const en = lang === 'en';
  const quality = rows.map(reviewMeasurements);
  const missing = quality.filter((q) => q.missing.length).length;
  const flagged = quality.filter((q) => q.issues.length).length;
  const seen = new Set();
  let repeats = 0;
  rows.forEach((row) => {
    if (!row.subject_code || !row.examination_date) return;
    const key = JSON.stringify([
      row.created_by_id,
      row.subject_code,
      row.examination_date,
    ]);
    if (seen.has(key)) repeats += 1;
    seen.add(key);
  });
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 3 }}>
      <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
        <Typography variant="body2" fontWeight={650} sx={{ mr: 1 }}>
          {en ? 'Data quality' : 'Ma’lumot sifati'}
        </Typography>
        <Chip
          size="small"
          variant="outlined"
          label={`${en ? 'Missing measurements' : 'O‘lchov yetishmaydi'}: ${missing}`}
        />
        <Chip
          size="small"
          variant="outlined"
          color={flagged ? 'warning' : 'default'}
          label={`${en ? 'Review units / values' : 'Birlik / qiymat tekshiruvi'}: ${flagged}`}
        />
        <Chip
          size="small"
          variant="outlined"
          color={repeats ? 'warning' : 'default'}
          label={`${en ? 'Possible duplicates' : 'Ehtimoliy takrorlar'}: ${repeats}`}
        />
      </Stack>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: 1 }}
      >
        {en
          ? `Checks cover the ${rows.length} loaded rows on this page. Missing height/weight and repeated child codes on the same date are counted.`
          : `Tekshiruv shu sahifadagi ${rows.length} ta yuklangan yozuvga tegishli. Bo‘y/vazn yetishmasligi va bir sanada takrorlangan bola kodi hisoblanadi.`}
      </Typography>
      {repeats > 0 && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          {en
            ? 'Review repeated visits before merging records.'
            : 'Yozuvlarni birlashtirishdan oldin takroriy tashriflarni tekshiring.'}
        </Alert>
      )}
    </Paper>
  );
}

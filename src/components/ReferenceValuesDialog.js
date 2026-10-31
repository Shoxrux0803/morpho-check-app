import React from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';

export default function ReferenceValuesDialog({ data, onClose }) {
  const { lang, t } = useLanguage();
  const english = lang === 'en';
  const labels = {
    height: t('heightLabel'),
    weight: t('weightLabel'),
    chest: t('chestLabel'),
    waist: t('waistLabel'),
    head: t('headLabel'),
    chest_standing_height: t('heightLabel'),
  };
  return (
    <Dialog open={Boolean(data)} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {english
          ? 'Approximate reference values'
          : 'Taxminiy ma’lumotnoma qiymatlari'}
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          {english
            ? 'These values come from an interpolated template, not Gemini or a patient measurement. They are shown for reference and are not copied into your record.'
            : 'Bu qiymatlar Gemini yoki bemor o‘lchovi emas, interpolatsiya qilingan taxminiy jadvaldan olingan. Ular ma’lumotnoma uchun ko‘rsatiladi va yozuvingizga ko‘chirilmaydi.'}
        </Alert>
        <Typography variant="caption" color="text.secondary">
          {data?.source} · {data?.formula_version}
        </Typography>
        <Box component="dl" sx={{ m: 0, mt: 2 }}>
          {Object.entries(data?.params || {})
            .filter(([, v]) => v !== '')
            .map(([key, value]) => (
              <Box
                key={key}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 2,
                  py: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography component="dt" variant="body2">
                  {labels[key] || key.replace(/_/g, ' ')}
                </Typography>
                <Typography
                  component="dd"
                  variant="body2"
                  sx={{ m: 0, fontWeight: 600 }}
                >
                  {String(value)} {data?.units?.[key] || ''}
                </Typography>
              </Box>
            ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{english ? 'Close' : 'Yopish'}</Button>
      </DialogActions>
    </Dialog>
  );
}

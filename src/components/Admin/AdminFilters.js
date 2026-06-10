import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
} from '@mui/material';
import { Search } from '@mui/icons-material';

import { UZB_LOCATIONS } from '../../data/uzbLocations';
import { useLanguage } from '../../contexts/LanguageContext';
import { pageT } from '../../utils/pageI18n';
import { getLocalizedLocationLabel } from '../../utils/locationI18n';

const AdminFilters = ({
  q,
  setQ,
  gender,
  setGender,
  ageMin,
  setAgeMin,
  ageMax,
  setAgeMax,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  region,
  setRegion,
}) => {
  const regions = Object.keys(UZB_LOCATIONS);
  const { lang } = useLanguage();
  const t = (key) => pageT(lang, key);

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card
      elevation={0}
      sx={{
        mb: 3,
        borderRadius: 4,
        background: isDark
          ? 'rgba(23, 26, 33, 0.7)'
          : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        border: isDark
          ? '1px solid rgba(255, 255, 255, 0.12)'
          : '1px solid rgba(100, 116, 139, 0.12)',
        boxShadow: isDark
          ? '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
          : '0 8px 32px 0 rgba(100, 116, 139, 0.08)',
      }}
    >
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label={t('search')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('searchPatientPlaceholder')}
              InputProps={{
                startAdornment: (
                  <Search sx={{ mr: 1, color: 'text.secondary' }} />
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>{t('region')}</InputLabel>
              <Select
                value={region}
                label={t('region')}
                onChange={(e) => setRegion(e.target.value)}
              >
                <MenuItem value="">{t('all')}</MenuItem>
                {regions.map((r) => (
                  <MenuItem key={r} value={r}>
                    {getLocalizedLocationLabel(r, lang, 1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>{t('gender')}</InputLabel>
              <Select
                value={gender}
                label={t('gender')}
                onChange={(e) => setGender(e.target.value)}
              >
                <MenuItem value="">{t('all')}</MenuItem>
                <MenuItem value="erkak">{t('male')}</MenuItem>
                <MenuItem value="ayol">{t('female')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="number"
              label={t('ageMin')}
              value={ageMin}
              onChange={(e) => setAgeMin(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="number"
              label={t('ageMax')}
              value={ageMax}
              onChange={(e) => setAgeMax(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="date"
              label={t('dateFrom')}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="date"
              label={t('dateTo')}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default AdminFilters;

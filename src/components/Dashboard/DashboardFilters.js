import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  MenuItem,
  Select,
  FormControl,
  Button,
  Stack,
  Collapse,
  useTheme,
  Chip,
  IconButton,
  TextField,
} from '@mui/material';

import {
  FilterList,
  RestartAlt,
  ExpandMore,
  ExpandLess,
  Wc,
  CheckCircle,
  Science,
  FitnessCenter,
} from '@mui/icons-material';
import { UZB_LOCATIONS } from '../../data/uzbLocations';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLocalizedLocationLabel } from '../../utils/locationI18n';

const SOMATOTYPES = ['Endomorph', 'Mesomorph', 'Ectomorph', 'Central'];
const DEFAULT_FILTERS = {
  gender: '',
  region: '',
  age_min: 0,
  age_max: 100,
  bmi_min: 10,
  bmi_max: 50,
  somatotype: '',
  date_from: '',
  date_to: '',
};

const FILTER_I18N = {
  uz: {
    title: 'Analitik Filtrlar',
    subtitle: "Ma'lumotlarni saralash va tahlil qilish",
    activeFilters: (count) => `${count} ta filtr faol`,
    demographics: 'Demografiya',
    gender: 'JINSI',
    male: 'Erkak',
    female: 'Ayol',
    all: 'Barchasi',
    region: 'HUDUD (VILOYAT)',
    allRegions: 'Hamma hududlar',
    biometrics: 'Biometriya',
    ageRange: "YOSH ORALIG'I",
    bmiRange: "BMI ORALIG'I",
    scientific: 'Ilmiy Klassifikatsiya',
    somatotype: 'SOMATOTIP',
    allTypes: 'Barcha tiplar',
    dateFrom: 'SANADAN',
    clear: 'Tozalash',
    apply: "Qo'llash",
  },
  ru: {
    title: 'Аналитические фильтры',
    subtitle: 'Сортировка и анализ данных',
    activeFilters: (count) => `${count} активн. фильтр(ов)`,
    demographics: 'Демография',
    gender: 'ПОЛ',
    male: 'Мужской',
    female: 'Женский',
    all: 'Все',
    region: 'РЕГИОН (ОБЛАСТЬ)',
    allRegions: 'Все регионы',
    biometrics: 'Биометрия',
    ageRange: 'ВОЗРАСТНОЙ ДИАПАЗОН',
    bmiRange: 'ДИАПАЗОН BMI',
    scientific: 'Научная классификация',
    somatotype: 'СОМАТОТИП',
    allTypes: 'Все типы',
    dateFrom: 'С ДАТЫ',
    clear: 'Очистить',
    apply: 'Применить',
  },
  en: {
    title: 'Analytical Filters',
    subtitle: 'Filter and analyze records',
    activeFilters: (count) => `${count} active filter${count === 1 ? '' : 's'}`,
    demographics: 'Demographics',
    gender: 'GENDER',
    male: 'Male',
    female: 'Female',
    all: 'All',
    region: 'REGION',
    allRegions: 'All regions',
    biometrics: 'Biometrics',
    ageRange: 'AGE RANGE',
    bmiRange: 'BMI RANGE',
    scientific: 'Scientific Classification',
    somatotype: 'SOMATOTYPE',
    allTypes: 'All types',
    dateFrom: 'FROM DATE',
    clear: 'Clear',
    apply: 'Apply',
  },
  kz: {
    title: 'Талдамалық сүзгілер',
    subtitle: 'Деректерді сұрыптау және талдау',
    activeFilters: (count) => `${count} сүзгі белсенді`,
    demographics: 'Демография',
    gender: 'ЖЫНЫСЫ',
    male: 'Ер',
    female: 'Әйел',
    all: 'Барлығы',
    region: 'АЙМАҚ (ОБЛЫС)',
    allRegions: 'Барлық аймақтар',
    biometrics: 'Биометрия',
    ageRange: 'ЖАС АРАЛЫҒЫ',
    bmiRange: 'BMI АРАЛЫҒЫ',
    scientific: 'Ғылыми классификация',
    somatotype: 'СОМАТОТИП',
    allTypes: 'Барлық типтер',
    dateFrom: 'КҮННЕН',
    clear: 'Тазалау',
    apply: 'Қолдану',
  },
};

FILTER_I18N.tg = {
  ...FILTER_I18N.uz,
  title: 'Филтрҳои таҳлилӣ',
  subtitle: 'Саракунӣ ва таҳлили маълумот',
  activeFilters: (count) => `${count} филтр фаъол`,
  demographics: 'Демография',
  gender: 'ҶИНС',
  male: 'Мард',
  female: 'Зан',
  all: 'Ҳама',
  region: 'ҲУДУД (ВИЛОЯТ)',
  allRegions: 'Ҳамаи ҳудудҳо',
  biometrics: 'Биометрия',
  ageRange: 'ДИАПАЗОНИ СИННУ СОЛ',
  bmiRange: 'ДИАПАЗОНИ BMI',
  scientific: 'Таснифи илмӣ',
  somatotype: 'СОМАТОТИП',
  allTypes: 'Ҳамаи навъҳо',
  dateFrom: 'АЗ САНА',
  clear: 'Тоза кардан',
  apply: 'Татбиқ',
};

FILTER_I18N.tm = {
  ...FILTER_I18N.uz,
  title: 'Analitik filtrler',
  subtitle: 'Maglumatlary saylamak we analiz etmek',
  activeFilters: (count) => `${count} filtr isjen`,
  demographics: 'Demografiya',
  gender: 'JYNSY',
  male: 'Erkek',
  female: 'Ayal',
  all: 'Hemmesi',
  region: 'SEBIT (WELAYAT)',
  allRegions: 'Ahli sebitler',
  biometrics: 'Biometriya',
  ageRange: 'YAS ARALYGY',
  bmiRange: 'BMI ARALYGY',
  scientific: 'Ylmy klassifikasiya',
  somatotype: 'SOMATOTIP',
  allTypes: 'Ahli tipler',
  dateFrom: 'SENEDAN',
  clear: 'Arassala',
  apply: 'Ulan',
};

const GlassPaper = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      background: (theme) =>
        theme.palette.mode === 'dark'
          ? 'rgba(30, 32, 45, 0.7)'
          : 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(20px)',
      borderRadius: 4,
      border: '1px solid',
      borderColor: (theme) =>
        theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(99, 102, 241, 0.15)',
      boxShadow: (theme) =>
        theme.palette.mode === 'dark'
          ? '0 8px 32px rgba(0,0,0,0.3)'
          : '0 8px 32px rgba(99, 102, 241, 0.08)',
      overflow: 'auto',
      '&::-webkit-scrollbar': {
        height: '6px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(0,0,0,0.1)',
        borderRadius: '10px',
      },
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const DashboardFilters = ({ filters, onFilterChange, onReset }) => {
  const [expanded, setExpanded] = useState(false);
  const { lang } = useLanguage();
  const t = FILTER_I18N[lang] || FILTER_I18N.uz;

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const safeFilters = { ...DEFAULT_FILTERS, ...(filters || {}) };

  const handleChange = (field) => (event, newValue) => {
    onFilterChange({
      ...safeFilters,
      [field]:
        event?.target?.value !== undefined ? event.target.value : newValue,
    });
  };

  const activeCount = Object.values(filters || {}).filter(
    (v) => v !== '' && v !== null && v !== undefined
  ).length;

  return (
    <Box sx={{ mb: 4 }}>
      <GlassPaper sx={{ p: { xs: 2, md: 3 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={2}
          mb={expanded ? 3 : 0}
        >
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ minWidth: 0 }}
          >
            <Box
              sx={{
                p: 1.2,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                display: 'flex',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              }}
            >
              <FilterList />
            </Box>
            <Box>
              <Typography
                variant="h6"
                fontWeight={800}
                sx={{ lineHeight: 1.2 }}
              >
                {t.title}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
              >
                {t.subtitle}
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
            flexWrap="wrap"
            useFlexGap
          >
            {activeCount > 0 && (
              <Chip
                label={t.activeFilters(activeCount)}
                size="small"
                color="primary"
                variant="soft"
                onDelete={onReset}
                sx={{ fontWeight: 700, borderRadius: 1.5 }}
              />
            )}
            <IconButton
              onClick={() => setExpanded(!expanded)}
              sx={{
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                transition: '0.3s',
              }}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Stack>
        </Stack>

        <Collapse in={expanded}>
          <Grid container spacing={4}>
            {/* 1. Demografiya va Jins */}
            <Grid item xs={12} md={4}>
              <Typography
                variant="subtitle2"
                fontWeight={800}
                color="primary"
                sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Wc fontSize="small" /> {t.demographics}
              </Typography>
              <Stack spacing={3}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={700}
                    sx={{ mb: 1, display: 'block' }}
                  >
                    {t.gender}
                  </Typography>
                  <ToggleButtonGroup
                    value={safeFilters.gender}
                    exclusive
                    onChange={handleChange('gender')}
                    fullWidth
                    size="small"
                    sx={{
                      '& .MuiToggleButton-root': {
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 700,
                        border: '1px solid',
                        borderColor: isDark
                          ? 'rgba(255,255,255,0.1)'
                          : 'rgba(0,0,0,0.1)',
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': { bgcolor: 'primary.dark' },
                        },
                      },
                    }}
                  >
                    <ToggleButton value="erkak">{t.male}</ToggleButton>
                    <ToggleButton value="ayol">{t.female}</ToggleButton>
                    <ToggleButton value="">{t.all}</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={700}
                    sx={{ mb: 1, display: 'block' }}
                  >
                    {t.region}
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={safeFilters.region}
                      onChange={handleChange('region')}
                      displayEmpty
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="">{t.allRegions}</MenuItem>
                      {Object.keys(UZB_LOCATIONS).map((loc) => (
                        <MenuItem key={loc} value={loc}>
                          {getLocalizedLocationLabel(loc, lang, 1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Stack>
            </Grid>

            {/* 2. Yosh va Biometriya */}
            <Grid item xs={12} md={4}>
              <Typography
                variant="subtitle2"
                fontWeight={800}
                color="secondary"
                sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <FitnessCenter fontSize="small" /> {t.biometrics}
              </Typography>
              <Stack spacing={3}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={700}
                    sx={{ mb: 1, display: 'block' }}
                  >
                    {t.ageRange}
                  </Typography>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    alignItems="center"
                  >
                    <TextField
                      label="Min"
                      type="number"
                      size="small"
                      value={safeFilters.age_min || 0}
                      onChange={(e) =>
                        onFilterChange({
                          ...safeFilters,
                          age_min: e.target.value,
                        })
                      }
                      sx={{ borderRadius: 2 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                    <TextField
                      label="Max"
                      type="number"
                      size="small"
                      value={safeFilters.age_max || 100}
                      onChange={(e) =>
                        onFilterChange({
                          ...safeFilters,
                          age_max: e.target.value,
                        })
                      }
                      sx={{ borderRadius: 2 }}
                    />
                  </Stack>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={700}
                    sx={{ mb: 1, display: 'block' }}
                  >
                    {t.bmiRange}
                  </Typography>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                    alignItems="center"
                  >
                    <TextField
                      label="Min"
                      type="number"
                      size="small"
                      value={safeFilters.bmi_min || 10}
                      onChange={(e) =>
                        onFilterChange({
                          ...safeFilters,
                          bmi_min: e.target.value,
                        })
                      }
                      InputProps={{ inputProps: { step: 0.5 } }}
                      sx={{ borderRadius: 2 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                    <TextField
                      label="Max"
                      type="number"
                      size="small"
                      value={safeFilters.bmi_max || 50}
                      onChange={(e) =>
                        onFilterChange({
                          ...safeFilters,
                          bmi_max: e.target.value,
                        })
                      }
                      InputProps={{ inputProps: { step: 0.5 } }}
                      sx={{ borderRadius: 2 }}
                    />
                  </Stack>
                </Box>
              </Stack>
            </Grid>

            {/* 3. Ilmiy Ko'rsatkichlar */}
            <Grid item xs={12} md={4}>
              <Typography
                variant="subtitle2"
                fontWeight={800}
                color="success.main"
                sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Science fontSize="small" /> {t.scientific}
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={700}
                    sx={{ mb: 1, display: 'block' }}
                  >
                    {t.somatotype}
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={safeFilters.somatotype}
                      onChange={handleChange('somatotype')}
                      displayEmpty
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="">{t.allTypes}</MenuItem>
                      {SOMATOTYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={700}
                    sx={{ mb: 1, display: 'block' }}
                  >
                    {t.dateFrom}
                  </Typography>
                  <input
                    type="date"
                    value={safeFilters.date_from || ''}
                    onChange={(e) =>
                      onFilterChange({
                        ...safeFilters,
                        date_from: e.target.value,
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '8.5px 14px',
                      borderRadius: '8px',
                      border: isDark
                        ? '1px solid rgba(255,255,255,0.2)'
                        : '1px solid rgba(0,0,0,0.2)',
                      background: 'transparent',
                      color: isDark ? 'white' : 'black',
                      fontFamily: 'inherit',
                    }}
                  />
                </Box>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  pt={1}
                >
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<RestartAlt />}
                    onClick={onReset}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 700,
                    }}
                  >
                    {t.clear}
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<CheckCircle />}
                    onClick={() => setExpanded(false)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 700,
                      background:
                        'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                    }}
                  >
                    {t.apply}
                  </Button>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Collapse>
      </GlassPaper>
    </Box>
  );
};

export default DashboardFilters;

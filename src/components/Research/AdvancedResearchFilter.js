import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Stack,
  InputAdornment,
  Collapse,
  Grid,
  MenuItem,
  Typography,
  Chip,
} from '@mui/material';
import {
  Search,
  FilterList,
  RestartAlt,
  ExpandLess,
  School,
  Place,
  Person,
  Download,
  Wc,
} from '@mui/icons-material';
import { useLanguage } from '../../contexts/LanguageContext';
import { researcherT } from '../../utils/researcherI18n';

const GlassPaper = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      background: (theme) =>
        theme.palette.mode === 'dark'
          ? 'rgba(30,30,40,0.7)'
          : 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(20px)',
      borderRadius: 4,
      border: '1px solid',
      borderColor: (theme) =>
        theme.palette.mode === 'dark'
          ? 'rgba(255,255,255,0.12)'
          : 'rgba(100, 116, 139, 0.12)',
      overflow: 'hidden',
      boxShadow: (theme) =>
        theme.palette.mode === 'dark'
          ? '0 8px 32px rgba(0,0,0,0.4)'
          : '0 8px 32px rgba(100,116,139,0.08)',
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const AdvancedResearchFilter = ({
  filter,
  setFilter,
  onSearch,
  onExport,
  isAssistant,
}) => {
  const { lang } = useLanguage();
  const t = (key) => researcherT(lang, key);
  const [expanded, setExpanded] = useState(false);

  // Feeding type options
  const feedingOptions = [
    { value: 'Tabiiy', label: t('natural') },
    { value: "Sun'iy", label: t('artificial') },
  ];

  // Parents marriage options
  const marriageOptions = [
    { value: 'Yaqin qarindosh', label: t('closeRelative') },
    {
      value: 'Uzoq qarindosh',
      label: t('distantRelative'),
    },
    { value: 'Qarindosh emas', label: t('notRelative') },
  ];

  const handleClear = () => {
    const emptyFilter = {
      search: '',
      full_name: '',
      school_name: '',
      settlement: '',
      feeding_type: '',
      parents_marriage: '',
      gender: '',
      weight_min: '',
      weight_max: '',
      height_min: '',
      height_max: '',
      date_from: '',
      date_to: '',
    };
    setFilter(emptyFilter);
    onSearch(emptyFilter);
  };

  const handleRemoveChip = (key) => {
    const updatedFilter = { ...filter, [key]: '' };
    setFilter(updatedFilter);
    onSearch(updatedFilter);
  };

  const activeFilters = Object.entries(filter).filter(([key, value]) => {
    return (
      value !== '' && value !== null && value !== undefined && key !== 'search'
    );
  });

  const handleChange = (e) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };

  return (
    <Box sx={{ mb: 3 }}>
      <GlassPaper sx={{ p: 2 }}>
        {/* Main Search Bar */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1.25, sm: 1.5 }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{
            minWidth: 0,
            '& .MuiButton-root': {
              minHeight: 42,
              minWidth: { xs: 0, sm: 96 },
              whiteSpace: 'normal',
              lineHeight: 1.2,
            },
          }}
        >
          <TextField
            fullWidth
            size="small"
            name="search"
            placeholder={t('quickSearchPlaceholder')}
            value={filter.search || ''}
            onChange={handleChange}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'primary.main' }} />
                </InputAdornment>
              ),
              sx: { borderRadius: 3 },
            }}
          />

          <Button
            variant={expanded ? 'contained' : 'outlined'}
            startIcon={expanded ? <ExpandLess /> : <FilterList />}
            onClick={() => setExpanded(!expanded)}
            sx={{
              borderRadius: 3,
              textTransform: 'none',
              width: { xs: '100%', sm: 'auto' },
              px: { xs: 1.5, sm: 2 },
            }}
          >
            {t('filters')}
          </Button>

          <Button
            variant="contained"
            color="primary"
            onClick={() => onSearch()}
            sx={{
              borderRadius: 3,
              px: { xs: 1.5, sm: 3 },
              textTransform: 'none',
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            {t('search')}
          </Button>

          {onExport && !isAssistant && (
            <Button
              variant="outlined"
              color="success"
              startIcon={<Download />}
              onClick={onExport}
              sx={{
                borderRadius: 3,
                px: { xs: 1.5, sm: 2 },
                textTransform: 'none',
                whiteSpace: 'nowrap',
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              XLSX
            </Button>
          )}
        </Stack>

        {/* Advanced Filters Panel */}
        <Collapse in={expanded}>
          <Box
            sx={{
              mt: 3,
              pt: 3,
              borderTop: (theme) =>
                theme.palette.mode === 'dark'
                  ? '1px solid rgba(255,255,255,0.08)'
                  : '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <Grid container spacing={3}>
              {/* Demographics Group */}
              <Grid item xs={12} md={4}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ fontWeight: 700, mb: 1, display: 'block' }}
                >
                  {t('demographics')}
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    size="small"
                    name="full_name"
                    label={t('fullNameDetailed')}
                    value={filter.full_name || ''}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    select
                    fullWidth
                    size="small"
                    name="gender"
                    label={t('gender')}
                    value={filter.gender || ''}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Wc fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  >
                    <MenuItem value="">{t('all')}</MenuItem>
                    <MenuItem value="erkak">{t('maleChild')}</MenuItem>
                    <MenuItem value="ayol">{t('femaleChild')}</MenuItem>
                  </TextField>
                  <TextField
                    fullWidth
                    size="small"
                    name="school_name"
                    label={t('schoolKindergarten')}
                    value={filter.school_name || ''}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <School fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    name="settlement"
                    label={t('settlement')}
                    value={filter.settlement || ''}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Place fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>
              </Grid>

              {/* Attributes Group */}
              <Grid item xs={12} md={4}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ fontWeight: 700, mb: 1, display: 'block' }}
                >
                  {t('attributes')}
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    name="feeding_type"
                    label={t('feedingType')}
                    value={filter.feeding_type || ''}
                    onChange={handleChange}
                  >
                    <MenuItem value="">{t('all')}</MenuItem>
                    {feedingOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    name="parents_marriage"
                    label={t('parentsMarriage')}
                    value={filter.parents_marriage || ''}
                    onChange={handleChange}
                  >
                    <MenuItem value="">{t('all')}</MenuItem>
                    {marriageOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      fullWidth
                      size="small"
                      name="date_from"
                      label={t('dateFrom')}
                      placeholder="2024-01-01"
                      value={filter.date_from || ''}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      name="date_to"
                      label={t('dateTo')}
                      placeholder="2024-12-31"
                      value={filter.date_to || ''}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Stack>
                </Stack>
              </Grid>

              {/* Biometrics Group */}
              <Grid item xs={12} md={4}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                  sx={{ fontWeight: 700, mb: 1, display: 'block' }}
                >
                  {t('measurements')}
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ mb: 1, display: 'block' }}
                    >
                      {t('weightRange')}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        size="small"
                        name="weight_min"
                        placeholder="Min"
                        value={filter.weight_min || ''}
                        onChange={handleChange}
                        type="number"
                      />
                      <Typography variant="caption">—</Typography>
                      <TextField
                        size="small"
                        name="weight_max"
                        placeholder="Max"
                        value={filter.weight_max || ''}
                        onChange={handleChange}
                        type="number"
                      />
                    </Stack>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ mb: 1, display: 'block' }}
                    >
                      {t('heightRange')}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        size="small"
                        name="height_min"
                        placeholder="Min"
                        value={filter.height_min || ''}
                        onChange={handleChange}
                        type="number"
                      />
                      <Typography variant="caption">—</Typography>
                      <TextField
                        size="small"
                        name="height_max"
                        placeholder="Max"
                        value={filter.height_max || ''}
                        onChange={handleChange}
                        type="number"
                      />
                    </Stack>
                  </Box>
                  <Button
                    fullWidth
                    variant="soft"
                    color="error"
                    startIcon={<RestartAlt />}
                    onClick={handleClear}
                    sx={{ mt: 'auto', py: 1 }}
                  >
                    {t('clearFilters')}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </GlassPaper>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}
        >
          <Typography
            variant="body2"
            sx={{
              alignSelf: 'center',
              mr: 1,
              fontWeight: 600,
              color: 'text.secondary',
            }}
          >
            {t('activeFilters')}
          </Typography>
          {activeFilters.map(([key, value]) => {
            let label = `${key}: ${value}`;
            if (key === 'date_from') label = `${t('fromDate')}: ${value}`;
            if (key === 'date_to') label = `${t('toDate')}: ${value}`;
            if (key === 'weight_min') label = `${t('weightShort')} >= ${value}`;
            if (key === 'weight_max') label = `${t('weightShort')} <= ${value}`;
            if (key === 'gender')
              label = `${t('gender')}: ${value === 'erkak' ? t('male') : t('female')}`;

            return (
              <Chip
                key={key}
                label={label}
                size="small"
                onDelete={() => handleRemoveChip(key)}
                color="primary"
                variant="soft"
                sx={{ borderRadius: 1.5, fontWeight: 500 }}
              />
            );
          })}
          <Button
            size="small"
            onClick={handleClear}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {t('clearAll')}
          </Button>
        </Stack>
      )}
    </Box>
  );
};

export default AdvancedResearchFilter;

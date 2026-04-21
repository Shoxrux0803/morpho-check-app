import React, { useState } from 'react';
import {
  Box, Paper, Typography, Grid, ToggleButtonGroup, 
  ToggleButton, MenuItem, Select, FormControl, InputLabel,
  Button, Stack, Collapse, useTheme, Chip, IconButton,
  Divider, InputAdornment, TextField
} from '@mui/material';

import {
  FilterList, RestartAlt, ExpandMore, ExpandLess, 
  Wc, Event, Place, ShowChart, PersonSearch,
  CheckCircle, Close, Science, FitnessCenter
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { UZB_LOCATIONS } from '../../data/uzbLocations';

const SOMATOTYPES = ['Endomorph', 'Mesomorph', 'Ectomorph', 'Central'];

const GlassPaper = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      background: (theme) =>
        theme.palette.mode === "dark" 
          ? "rgba(30, 32, 45, 0.7)" 
          : "rgba(255, 255, 255, 0.8)",
      backdropFilter: "blur(20px)",
      borderRadius: 4,
      border: "1px solid",
      borderColor: (theme) =>
        theme.palette.mode === "dark" 
          ? "rgba(255, 255, 255, 0.08)" 
          : "rgba(99, 102, 241, 0.15)",
      boxShadow: (theme) =>
        theme.palette.mode === "dark"
          ? "0 8px 32px rgba(0,0,0,0.3)"
          : "0 8px 32px rgba(99, 102, 241, 0.08)",
      overflow: "hidden",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const DashboardFilters = ({ filters, onFilterChange, onReset }) => {
  const [expanded, setExpanded] = useState(false);

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleChange = (field) => (event, newValue) => {
    onFilterChange({
      ...filters,
      [field]: event?.target?.value !== undefined ? event.target.value : newValue
    });
  };

  const activeCount = Object.values(filters).filter(v => v !== '' && v !== null && v !== undefined).length;


  return (
    <Box sx={{ mb: 4 }}>
      <GlassPaper sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={expanded ? 3 : 0}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                p: 1.2,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                display: 'flex',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              <FilterList />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                Analitik Filtrlar
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Ma'lumotlarni saralash va tahlil qilish
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            {activeCount > 0 && (
              <Chip 
                label={`${activeCount} ta filtr faol`} 
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
                transition: '0.3s'
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
              <Typography variant="subtitle2" fontWeight={800} color="primary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Wc fontSize="small" /> Demografiya
              </Typography>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
                    JINSI
                  </Typography>
                  <ToggleButtonGroup
                    value={filters.gender}
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
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                        '&.Mui-selected': {
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': { bgcolor: 'primary.dark' }
                        }
                      }
                    }}
                  >
                    <ToggleButton value="erkak">Erkak</ToggleButton>
                    <ToggleButton value="ayol">Ayol</ToggleButton>
                    <ToggleButton value="">Barchasi</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
                    HUDUD (VILOYAT)
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={filters.region}
                      onChange={handleChange('region')}
                      displayEmpty
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="">Hamma hududlar</MenuItem>
                      {Object.keys(UZB_LOCATIONS).map(loc => (
                        <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Stack>
            </Grid>

            {/* 2. Yosh va Biometriya */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" fontWeight={800} color="secondary" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FitnessCenter fontSize="small" /> Biometriya
              </Typography>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
                    YOSH ORALIG'I
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      label="Min"
                      type="number"
                      size="small"
                      value={filters.age_min || 0}
                      onChange={(e) => onFilterChange({ ...filters, age_min: e.target.value })}
                      sx={{ borderRadius: 2 }}
                    />
                    <Typography variant="body2" color="text.secondary">-</Typography>
                    <TextField
                      label="Max"
                      type="number"
                      size="small"
                      value={filters.age_max || 100}
                      onChange={(e) => onFilterChange({ ...filters, age_max: e.target.value })}
                      sx={{ borderRadius: 2 }}
                    />
                  </Stack>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
                    BMI ORALIG'I
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      label="Min"
                      type="number"
                      size="small"
                      value={filters.bmi_min || 10}
                      onChange={(e) => onFilterChange({ ...filters, bmi_min: e.target.value })}
                      InputProps={{ inputProps: { step: 0.5 } }}
                      sx={{ borderRadius: 2 }}
                    />
                    <Typography variant="body2" color="text.secondary">-</Typography>
                    <TextField
                      label="Max"
                      type="number"
                      size="small"
                      value={filters.bmi_max || 50}
                      onChange={(e) => onFilterChange({ ...filters, bmi_max: e.target.value })}
                      InputProps={{ inputProps: { step: 0.5 } }}
                      sx={{ borderRadius: 2 }}
                    />
                  </Stack>
                </Box>
              </Stack>
            </Grid>


            {/* 3. Ilmiy Ko'rsatkichlar */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" fontWeight={800} color="success.main" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Science fontSize="small" /> Ilmiy Klassifikatsiya
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
                    SOMATOTIP
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={filters.somatotype}
                      onChange={handleChange('somatotype')}
                      displayEmpty
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="">Barcha tiplar</MenuItem>
                      {SOMATOTYPES.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
                    SANADAN
                  </Typography>
                  <input
                    type="date"
                    value={filters.date_from || ''}
                    onChange={(e) => onFilterChange({ ...filters, date_from: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8.5px 14px',
                      borderRadius: '8px',
                      border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.2)',
                      background: 'transparent',
                      color: isDark ? 'white' : 'black',
                      fontFamily: 'inherit'
                    }}
                  />
                </Box>

                <Stack direction="row" spacing={1} pt={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<RestartAlt />}
                    onClick={onReset}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                  >
                    Tozalash
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
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                    }}
                  >
                    Qo'llash
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

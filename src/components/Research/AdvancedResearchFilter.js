import React, { useState, useEffect } from "react";
import {
  Box, Paper, TextField, Button, Stack, InputAdornment, 
  Collapse, Grid, MenuItem, Typography, IconButton, 
  Tooltip, Chip, Divider
} from "@mui/material";
import {
  Search, FilterList, Close, RestartAlt, 
  ExpandMore, ExpandLess, School, Place, 
  Person, FitnessCenter, CalendarMonth
} from "@mui/icons-material";

const GlassPaper = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      background: (theme) =>
        theme.palette.mode === "dark" ? "rgba(30,30,40,0.7)" : "rgba(255,255,255,0.85)",
      backdropFilter: "blur(20px)",
      borderRadius: 4,
      border: "1px solid",
      borderColor: (theme) =>
        theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
      overflow: "hidden",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

const AdvancedResearchFilter = ({ filter, setFilter, onSearch }) => {
  const [expanded, setExpanded] = useState(false);

  // Feeding type options
  const feedingOptions = [
    { value: "Tabiiy (естественном вскармливании)", label: "Tabiiy" },
    { value: "Sun'iy (искусственном вскармливании)", label: "Sun'iy" }
  ];

  // Parents marriage options
  const marriageOptions = [
    { value: "Yaqin qarindosh (близкородственный)", label: "Yaqin qarindosh" },
    { value: "Uzoq qarindosh (дальнородственный)", label: "Uzoq qarindosh" },
    { value: "Qarindosh emas (неродственный)", label: "Qarindosh emas" }
  ];

  const handleClear = () => {
    const emptyFilter = {
      search: "",
      full_name: "",
      school_name: "",
      settlement: "",
      feeding_type: "",
      parents_marriage: "",
      weight_min: "",
      weight_max: "",
      height_min: "",
      height_max: "",
      date_from: "",
      date_to: ""
    };
    setFilter(emptyFilter);
    onSearch(emptyFilter);
  };

  const handleRemoveChip = (key) => {
    const updatedFilter = { ...filter, [key]: "" };
    setFilter(updatedFilter);
    onSearch(updatedFilter);
  };

  const activeFilters = Object.entries(filter).filter(([key, value]) => {
    return value !== "" && value !== null && value !== undefined && key !== "search";
  });

  const handleChange = (e) => {
    setFilter({ ...filter, [e.target.name]: e.target.value });
  };

  return (
    <Box sx={{ mb: 3 }}>
      <GlassPaper sx={{ p: 2 }}>
        {/* Main Search Bar */}
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            fullWidth
            size="small"
            name="search"
            placeholder="F.I.SH, maktab yoki hudud bo'yicha tezkor qidirish..."
            value={filter.search || ""}
            onChange={handleChange}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "primary.main" }} />
                </InputAdornment>
              ),
              sx: { borderRadius: 3 }
            }}
          />
          
          <Button
            variant={expanded ? "contained" : "outlined"}
            startIcon={expanded ? <ExpandLess /> : <FilterList />}
            onClick={() => setExpanded(!expanded)}
            sx={{ borderRadius: 3, textTransform: "none", minWidth: 140 }}
          >
            Filtrlar
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            onClick={() => onSearch()}
            sx={{ borderRadius: 3, px: 3, textTransform: "none" }}
          >
            Qidirish
          </Button>
        </Stack>

        {/* Advanced Filters Panel */}
        <Collapse in={expanded}>
          <Box sx={{ mt: 3, pt: 3, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
            <Grid container spacing={3}>
              {/* Demographics Group */}
              <Grid item xs={12} md={4}>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: "block" }}>
                  Demografiya
                </Typography>
                <Stack spacing={2}>
                  <TextField 
                    fullWidth size="small" name="full_name" label="F.I.SH (to'liq)" 
                    value={filter.full_name || ""} onChange={handleChange}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Person fontSize="small" /></InputAdornment> }}
                  />
                  <TextField 
                    fullWidth size="small" name="school_name" label="Maktab / Bog'cha" 
                    value={filter.school_name || ""} onChange={handleChange}
                    InputProps={{ startAdornment: <InputAdornment position="start"><School fontSize="small" /></InputAdornment> }}
                  />
                  <TextField 
                    fullWidth size="small" name="settlement" label="Aholi punkti" 
                    value={filter.settlement || ""} onChange={handleChange}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Place fontSize="small" /></InputAdornment> }}
                  />
                </Stack>
              </Grid>

              {/* Attributes Group */}
              <Grid item xs={12} md={4}>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: "block" }}>
                  Xususiyatlar
                </Typography>
                <Stack spacing={2}>
                  <TextField 
                    select fullWidth size="small" name="feeding_type" label="Oziqlanish turi" 
                    value={filter.feeding_type || ""} onChange={handleChange}
                  >
                    <MenuItem value="">Barchasi</MenuItem>
                    {feedingOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                  </TextField>
                  <TextField 
                    select fullWidth size="small" name="parents_marriage" label="Ota-ona qarindoshligi" 
                    value={filter.parents_marriage || ""} onChange={handleChange}
                  >
                    <MenuItem value="">Barchasi</MenuItem>
                    {marriageOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                  </TextField>
                  <Stack direction="row" spacing={1}>
                    <TextField 
                      fullWidth size="small" name="date_from" label="Sana (dan)" placeholder="2024-01-01"
                      value={filter.date_from || ""} onChange={handleChange} InputLabelProps={{ shrink: true }}
                    />
                    <TextField 
                      fullWidth size="small" name="date_to" label="Sana (gacha)" placeholder="2024-12-31"
                      value={filter.date_to || ""} onChange={handleChange} InputLabelProps={{ shrink: true }}
                    />
                  </Stack>
                </Stack>
              </Grid>

              {/* Biometrics Group */}
              <Grid item xs={12} md={4}>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, mb: 1, display: "block" }}>
                  O'lchovlar
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" sx={{ mb: 1, display: "block" }}>Vazn oralig'i (kg)</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField size="small" name="weight_min" placeholder="Min" value={filter.weight_min || ""} onChange={handleChange} type="number" />
                      <Typography variant="caption">—</Typography>
                      <TextField size="small" name="weight_max" placeholder="Max" value={filter.weight_max || ""} onChange={handleChange} type="number" />
                    </Stack>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ mb: 1, display: "block" }}>Bo'y oralig'i (sm)</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField size="small" name="height_min" placeholder="Min" value={filter.height_min || ""} onChange={handleChange} type="number" />
                      <Typography variant="caption">—</Typography>
                      <TextField size="small" name="height_max" placeholder="Max" value={filter.height_max || ""} onChange={handleChange} type="number" />
                    </Stack>
                  </Box>
                  <Button 
                    fullWidth variant="soft" color="error" startIcon={<RestartAlt />} 
                    onClick={handleClear} sx={{ mt: "auto", py: 1 }}
                  >
                    Filtrlarni tozalash
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </GlassPaper>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
          <Typography variant="body2" sx={{ alignSelf: "center", mr: 1, fontWeight: 600, color: "text.secondary" }}>
            Aktiv filtrlar:
          </Typography>
          {activeFilters.map(([key, value]) => {
            let label = `${key}: ${value}`;
            if (key === "date_from") label = `Sanadan: ${value}`;
            if (key === "date_to") label = `Sanagacha: ${value}`;
            if (key === "weight_min") label = `Vazn >= ${value}`;
            if (key === "weight_max") label = `Vazn <= ${value}`;
            
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
          <Button size="small" onClick={handleClear} sx={{ textTransform: "none", fontWeight: 600 }}>
            Barchasini tozalash
          </Button>
        </Stack>
      )}
    </Box>
  );
};

export default AdvancedResearchFilter;

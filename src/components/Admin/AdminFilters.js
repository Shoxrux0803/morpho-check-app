import React from "react";
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
} from "@mui/material";
import { Search } from "@mui/icons-material";

import { UZB_LOCATIONS } from "../../data/uzbLocations";

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
              label="Qidiruv"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ism, familiya, jins, yosh..."
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Viloyat</InputLabel>
              <Select value={region} label="Viloyat" onChange={(e) => setRegion(e.target.value)}>
                <MenuItem value="">Hammasi</MenuItem>
                {regions.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Jins</InputLabel>
              <Select value={gender} label="Jins" onChange={(e) => setGender(e.target.value)}>
                <MenuItem value="">Hammasi</MenuItem>
                <MenuItem value="erkak">Erkak</MenuItem>
                <MenuItem value="ayol">Ayol</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="number"
              label="Yosh (min)"
              value={ageMin}
              onChange={(e) => setAgeMin(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="number"
              label="Yosh (max)"
              value={ageMax}
              onChange={(e) => setAgeMax(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Sana (dan)"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Sana (gacha)"
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

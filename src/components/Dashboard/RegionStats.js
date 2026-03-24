import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { LocationOn, People, DataUsage } from "@mui/icons-material";
import { AdminApi } from "../../services/AdminApi";

// Viloyat nomlarini to'g'irlash uchun
const normalizeRegionName = (name = "") =>
  String(name)
    .toLowerCase()
    .trim()
    .replace(/['’`]/g, "")
    .replace(/ viloyati| shahri| respublikasi| oblasti| regioni| vil\.?| vil/g, "")
    .replace(/gorod|shahar|city|g\./g, "")
    .replace(/\./g, "")
    .replace(/\s+/g, "");

const getShortRegionName = (name = "") =>
  name.replace("Viloyati", "").replace("Shahri", "").replace("Respublikasi", "").trim();

const REGIONS = [
  { key: "toshkent", name: "Toshkent Shahri", aliases: ["toshkent", "tashkent", "ташкент", "toshkent shahri", "toshkent city"] },
  { key: "toshkent_viloyati", name: "Toshkent Viloyati", aliases: ["toshkent viloyati", "toshkent region", "tashkent region", "toshkent obl"] },
  { key: "samarqand", name: "Samarqand Viloyati", aliases: ["samarqand", "samarkand", "самарканд"] },
  { key: "buxoro", name: "Buxoro Viloyati", aliases: ["buxoro", "bukhara", "бухара"] },
  { key: "andijon", name: "Andijon Viloyati", aliases: ["andijon", "andijan", "андижан"] },
  { key: "fargona", name: "Farg'ona Viloyati", aliases: ["fargona", "farg'ona", "fergana", "фергана"] },
  { key: "namangan", name: "Namangan Viloyati", aliases: ["namangan", "наманган"] },
  { key: "navoiy", name: "Navoiy Viloyati", aliases: ["navoiy", "navoi", "навоий"] },
  { key: "qashqadaryo", name: "Qashqadaryo Viloyati", aliases: ["qashqadaryo", "kashkadarya", "кашкадарья"] },
  { key: "surxondaryo", name: "Surxondaryo Viloyati", aliases: ["surxondaryo", "surkhandarya", "сурхандарья"] },
  { key: "jizzax", name: "Jizzax Viloyati", aliases: ["jizzax", "djizzak", "джизак"] },
  { key: "sirdaryo", name: "Sirdaryo Viloyati", aliases: ["sirdaryo", "syrdarya", "сырдарья"] },
  { key: "xorazm", name: "Xorazm Viloyati", aliases: ["xorazm", "khorezm", "хорезм"] },
  { key: "qoraqalpogiston", name: "Qoraqalpog'iston Respublikasi", aliases: ["qoraqalpogiston", "qoraqalpog'iston", "karakalpakstan", "каракалпакстан"] },
];

export default function RegionStats({ data, loading }) {
  const theme = useTheme();

  const stats = useMemo(() => {
    const regionMap = new Map();
    REGIONS.forEach((r) =>
      regionMap.set(r.key, {
        name: r.name,
        shortName: getShortRegionName(r.name),
        count: 0,
        totalAge: 0,
        totalWeight: 0,
        totalHeight: 0,
        genders: { erkak: 0, ayol: 0 },
      })
    );

    const matchRegion = (rawName) => {
      const norm = normalizeRegionName(rawName);
      for (const r of REGIONS) {
        if (normalizeRegionName(r.key) === norm || r.aliases.includes(norm)) return r.key;
      }
      return null;
    };

    data.forEach((user) => {
      const matchedKey = matchRegion(user.region || "");
      if (matchedKey && regionMap.has(matchedKey)) {
        const rStat = regionMap.get(matchedKey);
        rStat.count += 1;
        rStat.totalAge += Number(user.age) || 0;
        rStat.totalWeight += Number(user.weight) || 0;
        rStat.totalHeight += Number(user.height) || 0;
        
        const gender = String(user.gender).toLowerCase();
        if (gender === "erkak" || gender === "male" || gender === "m") rStat.genders.erkak += 1;
        else if (gender === "ayol" || gender === "female" || gender === "f") rStat.genders.ayol += 1;
      }
    });

    return Array.from(regionMap.values())
      .filter((r) => r.count > 0)
      .map((r) => ({
        ...r,
        avgAge: r.count > 0 ? (r.totalAge / r.count).toFixed(1) : 0,
        avgWeight: r.count > 0 ? (r.totalWeight / r.count).toFixed(1) : 0,
        avgHeight: r.count > 0 ? (r.totalHeight / r.count).toFixed(1) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const topRegions = stats.slice(0, 10);
  
  const genderData = [
    { name: "Erkak", value: stats.reduce((acc, curr) => acc + curr.genders.erkak, 0) },
    { name: "Ayol", value: stats.reduce((acc, curr) => acc + curr.genders.ayol, 0) },
  ];
  const COLORS = [theme.palette.primary.main, theme.palette.secondary.main];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (stats.length === 0) {
    return null; // Ma'lumot yo'q bo'lsa ko'rsatilmaydi
  }

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h5" fontWeight="bold" sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
          <DataUsage sx={{ mr: 1, color: "primary.main" }} /> Hududlar kesimida kengaytirilgan statistika
        </Typography>
      </Grid>

      {/* Top Regions BarChart */}
      <Grid item xs={12} md={8}>
          <Card elevation={2} sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <LocationOn sx={{ mr: 1, verticalAlign: "middle", fontSize: 20 }} /> Top Viloyatlar (Foydalanuvchilar soni)
              </Typography>
              <Box sx={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <BarChart data={topRegions} margin={{ top: 20, right: 30, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="shortName" tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} interval={0} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: theme.palette.text.secondary }} />
                    <Tooltip cursor={{ fill: theme.palette.action.hover }} contentStyle={{ borderRadius: 8, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, border: `1px solid ${theme.palette.divider}` }} />
                    <Bar dataKey="count" fill="url(#colorPv)" radius={[6, 6, 0, 0]} name="Foydalanuvchilar" animationDuration={1500} >
                      {topRegions.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={theme.palette.primary.main} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Gender Distribution PieChart */}
        <Grid item xs={12} md={4}>
           <Card elevation={2} sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                <People sx={{ mr: 1, verticalAlign: "middle", fontSize: 20 }} /> Jins bo'yicha taqsimot
              </Typography>
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, backgroundColor: theme.palette.background.paper, color: theme.palette.text.primary, border: `1px solid ${theme.palette.divider}` }} itemStyle={{ color: theme.palette.text.primary }} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Detailed Table */}
        <Grid item xs={12} md={12}>
          <Card elevation={2} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hududiy ko'rsatkichlar jadvali
              </Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <Table size="medium">
                  <TableHead sx={{ bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.grey[100] }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>Viloyat / Hudud</TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold" }}>Foydalanuvchilar</TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold" }}>O'rtacha Yosh</TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold" }}>O'rtacha Bo'y (sm)</TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold" }}>O'rtacha Vazn (kg)</TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold" }}>Jins (E/A)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.map((row) => (
                      <TableRow key={row.name} hover>
                        <TableCell component="th" scope="row">
                          {row.name}
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'inline-block', px: 2, py: 0.5, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 1, fontWeight: 'medium' }}>
                            {row.count}
                          </Box>
                        </TableCell>
                        <TableCell align="center">{row.avgAge}</TableCell>
                        <TableCell align="center">{row.avgHeight}</TableCell>
                        <TableCell align="center">{row.avgWeight}</TableCell>
                        <TableCell align="center">
                          {row.genders.erkak} / {row.genders.ayol}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
    </>
  );
}

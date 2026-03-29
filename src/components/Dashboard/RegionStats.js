import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Grid,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { LocationOn, DataUsage } from "@mui/icons-material";
import DashboardCard from "./DashboardCard";

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
        if (gender.includes("erkak") || gender.includes("male") || gender.includes("o'g'il")) rStat.genders.erkak += 1;
        else if (gender.includes("ayol") || gender.includes("female") || gender.includes("qiz")) rStat.genders.ayol += 1;
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

  const topRegions = stats.slice(0, 8);
  
  if (!loading && stats.length === 0) {
    return null;
  }

  return (
    <>
      <Grid item xs={12}>
        <Box sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <DataUsage color="primary" />
            <Typography variant="h5" fontWeight="800">Hududiy Tahlil</Typography>
        </Box>
      </Grid>

      {/* Top Regions BarChart */}
      <Grid item xs={12} lg={7}>
          <DashboardCard title="Hududlar bo'yicha qamrov" icon={<LocationOn />} loading={loading}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={topRegions} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                <XAxis 
                    dataKey="shortName" 
                    tick={{ fill: theme.palette.text.secondary, fontSize: 11 }} 
                    interval={0} 
                    angle={-45} 
                    textAnchor="end" 
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
                <Tooltip 
                    cursor={{ fill: theme.palette.divider, opacity: 0.1 }} 
                    contentStyle={{ 
                        borderRadius: 12, 
                        border: 'none', 
                        boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.1)',
                        backgroundColor: theme.palette.background.paper,
                        color: theme.palette.text.primary
                    }} 
                    itemStyle={{ color: theme.palette.text.primary }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Foydalanuvchilar" animationDuration={1500} barSize={35}>
                  {topRegions.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={index % 2 === 0 ? theme.palette.primary.main : theme.palette.primary.light} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </DashboardCard>
        </Grid>

        {/* Detailed Table */}
        <Grid item xs={12} lg={5}>
          <DashboardCard title="Statistik Ma'lumotlar" loading={loading} height={350}>
            <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent', maxHeight: 350, overflow: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "700", background: theme.palette.background.paper }}>Hudud</TableCell>
                    <TableCell align="center" sx={{ fontWeight: "700", background: theme.palette.background.paper }}>Soni</TableCell>
                    <TableCell align="center" sx={{ fontWeight: "700", background: theme.palette.background.paper }}>Yoshi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.map((row) => (
                    <TableRow key={row.name} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell component="th" scope="row" sx={{ py: 1.5 }}>
                        <Typography variant="body2" fontWeight="500">{row.name}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                            label={row.count} 
                            size="small" 
                            sx={{ bgcolor: `${theme.palette.primary.main}26`, color: 'primary.main', fontWeight: 'bold' }} 
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" color="text.secondary">{row.avgAge}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DashboardCard>
        </Grid>
    </>
  );
}

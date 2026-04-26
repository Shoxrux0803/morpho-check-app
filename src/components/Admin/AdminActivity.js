import React, { useState, useEffect, useCallback } from "react";
import { AdminApi } from "../../services/AdminApi";
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  LinearProgress,
  Stack,
  IconButton,
  Tooltip,
  Paper,
  useTheme,
  Button,
  ButtonGroup,
} from "@mui/material";
import {
  Refresh,
  Speed,
  AccessTime,
  QueryBuilder,
  LocationOn,
  AccountCircle,
  Science,
  SupervisorAccount,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

const StatusBadge = ({ status, isTyping }) => {
  const colors = {
    online: "#10B981",
    away: "#F59E0B",
    offline: "#6B7280",
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          bgcolor: colors[status] || colors.offline,
          boxShadow: status === "online" ? `0 0 10px ${colors.online}` : "none",
        }}
        component={motion.div}
        animate={status === "online" ? { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
      />
      <Typography variant="caption" sx={{ textTransform: "capitalize", fontWeight: "bold", fontSize: '0.7rem', color: colors[status] }}>
        {status} {isTyping && "• kiritmoqda..."}
      </Typography>
    </Box>
  );
};

const ActivityCard = ({ admin, isDark }) => {
  const isResearcher = admin.role === "researcher";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          height: "100%",
          borderRadius: 4,
          background: isDark
            ? "linear-gradient(135deg, rgba(30, 30, 40, 0.9) 0%, rgba(20, 20, 25, 0.9) 100%)"
            : "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
          border: "1px solid",
          borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.05)",
          overflow: "visible",
          position: "relative",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box display="flex" gap={2} alignItems="center">
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: isResearcher ? "secondary.main" : "primary.main",
                  boxShadow: isResearcher 
                    ? "0 4px 12px rgba(156,39,176,0.3)" 
                    : "0 4px 12px rgba(0,123,255,0.3)",
                }}
              >
                {isResearcher ? <Science /> : admin.name?.[0].toUpperCase() || "A"}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="800" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                  {admin.name}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip 
                    label={isResearcher ? "Izlanuvchi" : "Admin"} 
                    size="small" 
                    variant="outlined" 
                    color={isResearcher ? "secondary" : "primary"}
                    sx={{ height: 18, fontSize: '0.6rem', borderRadius: 1, fontWeight: 'bold' }}
                  />
                  <StatusBadge status={admin.status} isTyping={admin.is_typing} />
                </Stack>
              </Box>
            </Box>
            <Chip
              icon={<LocationOn sx={{ fontSize: "0.9rem !important" }} />}
              label={admin.region || "Global"}
              size="small"
              sx={{ borderRadius: 2, fontWeight: "bold", fontSize: '0.7rem' }}
            />
          </Box>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 6 }}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3, textAlign: "center", bgcolor: "transparent" }}>
                <Typography variant="caption" color="text.secondary" display="block">Bugun</Typography>
                <Typography variant="h5" fontWeight="900" color="primary">{admin.stats_today}</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3, textAlign: "center", bgcolor: "transparent" }}>
                <Typography variant="caption" color="text.secondary" display="block">Shu oy</Typography>
                <Typography variant="h5" fontWeight="900" color="secondary">{admin.stats_month}</Typography>
              </Paper>
            </Grid>
          </Grid>

          <Stack spacing={2} sx={{ mt: 3 }}>
             <Box>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                        <Speed sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="caption" fontWeight="bold">O'rtacha vaqt</Typography>
                    </Box>
                    <Typography variant="caption" fontWeight="bold">{admin.avg_entry_time} sek</Typography>
                </Box>
                <LinearProgress 
                    variant="determinate" 
                    value={Math.min(100, (60 / (admin.avg_entry_time || 60)) * 50)} 
                    color={admin.avg_entry_time < 120 ? "success" : "warning"}
                    sx={{ borderRadius: 1, height: 4 }}
                />
             </Box>

             <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center" gap={0.5}>
                    <QueryBuilder sx={{ fontSize: 16, color: "text.secondary" }} />
                    <Typography variant="caption" color="text.secondary">Eng faol vaqti:</Typography>
                </Box>
                <Typography variant="caption" fontWeight="bold">{admin.most_active_hour || "-"}</Typography>
             </Box>

             <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box display="flex" alignItems="center" gap={0.5}>
                    <AccessTime sx={{ fontSize: 16, color: "text.secondary" }} />
                    <Typography variant="caption" color="text.secondary">Oxirgi faollik:</Typography>
                </Box>
                <Typography variant="caption" fontWeight="bold">
                   {admin.last_active_at ? new Date(admin.last_active_at).toLocaleTimeString("uz-UZ") : "-"}
                </Typography>
             </Box>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function AdminActivity() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [roleFilter, setRoleFilter] = useState("all");
  
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const fetchActivity = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await AdminApi.activity.list();
      setData(res.items || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      toast.error("Ma'lumotlarni yangilashda xato!");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
    const timer = setInterval(() => fetchActivity(true), 30000);
    return () => clearInterval(timer);
  }, [fetchActivity]);

  const filteredData = data.filter(a => {
    if (roleFilter === "all") return true;
    return a.role === roleFilter;
  });

  const onlineCount = data.filter(a => a.status === 'online').length;

  return (
    <Box>
      <Box display="flex" flexDirection={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} mb={4} gap={2}>
        <Box>
          <Typography variant="h4" fontWeight="900" color="primary.main" gutterBottom>
            Monitoring Markazi
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Hozirda {onlineCount} ta foydalanuvchi online • Oxirgi yangilanish: {lastUpdated.toLocaleTimeString()}
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2} alignItems="center" width={{ xs: "100%", md: "auto" }}>
          <ButtonGroup size="small" variant="outlined" sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
            <Button 
                onClick={() => setRoleFilter("all")} 
                variant={roleFilter === "all" ? "contained" : "outlined"}
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
            >
                Barchasi
            </Button>
            <Button 
                onClick={() => setRoleFilter("admin")} 
                variant={roleFilter === "admin" ? "contained" : "outlined"}
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
            >
                Adminlar
            </Button>
            <Button 
                onClick={() => setRoleFilter("researcher")} 
                variant={roleFilter === "researcher" ? "contained" : "outlined"}
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
            >
                Izlanuvchilar
            </Button>
          </ButtonGroup>

          <Tooltip title="Yangilash">
              <IconButton 
                  onClick={() => fetchActivity()} 
                  disabled={loading}
                  sx={{ 
                      bgcolor: 'background.paper', 
                      boxShadow: 1,
                      '&:hover': { bgcolor: 'primary.main', color: 'white' }
                  }}
              >
                  <Refresh sx={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {loading && data.length === 0 ? (
        <Box py={10} textAlign="center">
          <LinearProgress sx={{ maxWidth: 400, mx: "auto", borderRadius: 2 }} />
          <Typography sx={{ mt: 2 }} color="text.secondary">Ma'lumotlar yuklanmoqda...</Typography>
        </Box>
      ) : (
        <AnimatePresence mode="popLayout">
          <Grid container spacing={3}>
            {filteredData.map((admin) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={admin.id}>
                <ActivityCard admin={admin} isDark={isDark} />
              </Grid>
            ))}
            {filteredData.length === 0 && (
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 10, textAlign: "center", borderRadius: 4, bgcolor: "transparent", border: "1px dashed", borderColor: "divider" }}>
                   <AccountCircle sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
                   <Typography color="text.secondary">
                     {roleFilter === "all" ? "Foydalanuvchilar topilmadi" : 
                      roleFilter === "admin" ? "Adminlar topilmadi" : "Izlanuvchilar topilmadi"}
                   </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </AnimatePresence>
      )}
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
}

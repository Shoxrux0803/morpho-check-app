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
} from "@mui/material";
import {
  Refresh,
  Speed,
  AccessTime,
  QueryBuilder,
  LocationOn,
  AccountCircle,
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
          width: 10,
          height: 10,
          borderRadius: "50%",
          bgcolor: colors[status] || colors.offline,
          boxShadow: status === "online" ? `0 0 10px ${colors.online}` : "none",
        }}
        component={motion.div}
        animate={status === "online" ? { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
      />
      <Typography variant="caption" sx={{ textTransform: "capitalize", fontWeight: "bold", color: colors[status] }}>
        {status} {isTyping && "• Ma'lumot kiritmoqda..."}
      </Typography>
    </Box>
  );
};

const ActivityCard = ({ admin, isDark }) => {
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
                  bgcolor: "primary.main",
                  boxShadow: "0 4px 12px rgba(0,123,255,0.3)",
                }}
              >
                {admin.name?.[0].toUpperCase() || "A"}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="800">
                  {admin.name}
                </Typography>
                <StatusBadge status={admin.status} isTyping={admin.is_typing} />
              </Box>
            </Box>
            <Chip
              icon={<LocationOn sx={{ fontSize: "1rem !important" }} />}
              label={admin.region || "Noma'lum hudud"}
              size="small"
              sx={{ borderRadius: 2, fontWeight: "bold" }}
            />
          </Box>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3, textAlign: "center", bgcolor: "transparent" }}>
                <Typography variant="caption" color="text.secondary" display="block">Bugun</Typography>
                <Typography variant="h5" fontWeight="900" color="primary">{admin.stats_today}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6}>
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
    // Auto-refresh: 30 sekund
    const timer = setInterval(() => fetchActivity(true), 30000);
    return () => clearInterval(timer);
  }, [fetchActivity]);

  const onlineCount = data.filter(a => a.status === 'online').length;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="900" color="primary.main">
            Admin Aktivligi
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Hozirda {onlineCount} ta admin online • Oxirgi yangilanish: {lastUpdated.toLocaleTimeString()}
          </Typography>
        </Box>
        <Tooltip title="Yangilash">
            <IconButton 
                onClick={() => fetchActivity()} 
                disabled={loading}
                sx={{ 
                    bgcolor: 'background.paper', 
                    boxShadow: 2,
                    '&:hover': { bgcolor: 'primary.main', color: 'white' }
                }}
            >
                <Refresh sx={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            </IconButton>
        </Tooltip>
      </Box>

      {loading && data.length === 0 ? (
        <Box py={10} textAlign="center">
          <LinearProgress sx={{ maxWidth: 400, mx: "auto", borderRadius: 2 }} />
          <Typography sx={{ mt: 2 }} color="text.secondary">Ma'lumotlar yuklanmoqda...</Typography>
        </Box>
      ) : (
        <AnimatePresence mode="popLayout">
          <Grid container spacing={3}>
            {data.map((admin) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={admin.id}>
                <ActivityCard admin={admin} isDark={isDark} />
              </Grid>
            ))}
            {data.length === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 10, textAlign: "center", borderRadius: 4, bgcolor: "transparent", border: "1px dashed", borderColor: "divider" }}>
                   <AccountCircle sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
                   <Typography color="text.secondary">Adminlar topilmadi</Typography>
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

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
  Divider,
} from "@mui/material";
import {
  Refresh,
  Speed,
  AccessTime,
  QueryBuilder,
  LocationOn,
  AccountCircle,
  Science,
  EmojiEvents,
  CalendarMonth,
} from "@mui/icons-material";
import TrendingUp from "@mui/icons-material/TrendingUp";
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
      <Typography
        variant="caption"
        sx={{
          textTransform: "capitalize",
          fontWeight: "bold",
          fontSize: "0.7rem",
          color: colors[status],
        }}
      >
        {status} {isTyping && "• kiritmoqda..."}
      </Typography>
    </Box>
  );
};

const formatAvgMinutes = (seconds = 0) => {
  if (!seconds) return "-";
  const minutes = seconds / 60;
  if (minutes < 1) return `${Math.max(1, Math.round(seconds))} sek`;
  return `${minutes.toFixed(minutes >= 10 ? 0 : 1)} daq`;
};

const getScore = (admin) =>
  (admin.stats_today || 0) * 3 + (admin.stats_week || 0) * 2 + (admin.stats_month || 0);

const getActivityKey = (admin, index) => {
  const id = admin.id || admin.user_id || admin.email || admin.name;
  return id ? `activity-${id}` : `activity-${admin.role || "user"}-${index}`;
};

const ActivityCard = ({ admin, isDark, rank, isBest, maxScore }) => {
  const isResearcher = admin.role === "researcher";
  const score = getScore(admin);
  const progress = maxScore ? Math.round((score / maxScore) * 100) : 0;

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
          borderRadius: 2,
          background: isBest
            ? isDark
              ? "linear-gradient(135deg, rgba(120, 83, 18, 0.9) 0%, rgba(251, 191, 36, 0.28) 48%, rgba(146, 64, 14, 0.82) 100%)"
              : "linear-gradient(135deg, #fff7cc 0%, #fbbf24 45%, #fff1b8 100%)"
            : isDark
              ? "linear-gradient(135deg, rgba(30, 30, 40, 0.9) 0%, rgba(20, 20, 25, 0.9) 100%)"
              : "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
          border: "1px solid",
          borderColor: isBest ? "#f59e0b" : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
          boxShadow: isBest
            ? "0 18px 45px rgba(245, 158, 11, 0.32)"
            : isDark
              ? "0 8px 32px rgba(0,0,0,0.4)"
              : "0 8px 32px rgba(0,0,0,0.05)",
          overflow: "hidden",
          position: "relative",
          animation: isBest ? "goldCardPulse 2.8s ease-in-out infinite" : "none",
          "&::before": isBest
            ? {
                content: '""',
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.18) 28%, rgba(255,255,255,0.65) 45%, rgba(255,255,255,0.12) 58%, transparent 100%)",
                transform: "translateX(-120%)",
                animation: "goldShine 3.2s ease-in-out infinite",
                pointerEvents: "none",
              }
            : undefined,
          "&::after": isBest
            ? {
                content: '""',
                position: "absolute",
                inset: 2,
                borderRadius: 1.75,
                border: "1px solid rgba(255, 255, 255, 0.42)",
                pointerEvents: "none",
              }
            : undefined,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" gap={2} alignItems="flex-start" mb={2}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: isBest ? "#f59e0b" : isResearcher ? "secondary.main" : "primary.main",
                background: isBest
                  ? "linear-gradient(135deg, #fef3c7 0%, #f59e0b 55%, #92400e 100%)"
                  : undefined,
                color: isBest ? "#111827" : undefined,
                boxShadow: isBest
                  ? "0 0 0 4px rgba(255,255,255,0.28), 0 0 24px rgba(245,158,11,0.75)"
                  : isResearcher
                    ? "0 4px 12px rgba(156,39,176,0.3)"
                    : "0 4px 12px rgba(15,118,110,0.24)",
                animation: isBest ? "goldTrophyPulse 1.8s ease-in-out infinite" : "none",
              }}
            >
              {isBest ? (
                <EmojiEvents />
              ) : isResearcher ? (
                <Science />
              ) : (
                admin.name?.[0].toUpperCase() || "A"
              )}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 0.5, flexWrap: "wrap", rowGap: 0.5 }}
              >
                <Typography variant="h6" fontWeight="800" sx={{ lineHeight: 1.2, minWidth: 0 }}>
                  #{rank} {admin.name}
                </Typography>
                {isBest && (
                  <Chip
                    label="Eng yaxshi"
                    size="small"
                    sx={{
                      height: 20,
                      borderRadius: 1,
                      fontSize: "0.65rem",
                      fontWeight: 900,
                      bgcolor: "#111827",
                      color: "#fde68a",
                      border: "1px solid rgba(253,230,138,0.7)",
                      boxShadow: "0 0 16px rgba(245,158,11,0.45)",
                    }}
                  />
                )}
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={isResearcher ? "Izlanuvchi" : "Admin"}
                  size="small"
                  variant="outlined"
                  color={isResearcher ? "secondary" : "primary"}
                  sx={{ height: 18, fontSize: "0.6rem", borderRadius: 1, fontWeight: "bold" }}
                />
                <StatusBadge status={admin.status} isTyping={admin.is_typing} />
              </Stack>
              <Stack direction="row" sx={{ mt: 1 }}>
                <Chip
                  icon={<LocationOn sx={{ fontSize: "0.9rem !important" }} />}
                  label={admin.region || "Global"}
                  size="small"
                  sx={{
                    maxWidth: "100%",
                    borderRadius: 2,
                    fontWeight: "bold",
                    fontSize: "0.7rem",
                    "& .MuiChip-label": {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    },
                  }}
                />
              </Stack>
            </Box>
          </Box>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 4 }}>
              <Paper
                variant="outlined"
                sx={{ p: 1.25, borderRadius: 2, textAlign: "center", bgcolor: "transparent" }}
              >
                <Typography variant="caption" color="text.secondary" display="block">
                  Bugun
                </Typography>
                <Typography variant="h5" fontWeight="900" color="primary">
                  {admin.stats_today}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Paper
                variant="outlined"
                sx={{ p: 1.25, borderRadius: 2, textAlign: "center", bgcolor: "transparent" }}
              >
                <Typography variant="caption" color="text.secondary" display="block">
                  Hafta
                </Typography>
                <Typography variant="h5" fontWeight="900" color="success.main">
                  {admin.stats_week || 0}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Paper
                variant="outlined"
                sx={{ p: 1.25, borderRadius: 2, textAlign: "center", bgcolor: "transparent" }}
              >
                <Typography variant="caption" color="text.secondary" display="block">
                  Shu oy
                </Typography>
                <Typography variant="h5" fontWeight="900" color="secondary">
                  {admin.stats_month}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Stack spacing={2} sx={{ mt: 3 }}>
            <Box>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <TrendingUp sx={{ fontSize: 16, color: "text.secondary" }} />
                  <Typography variant="caption" fontWeight="bold">
                    Reyting balli
                  </Typography>
                </Box>
                <Typography variant="caption" fontWeight="bold">
                  {score}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                color={isBest ? "warning" : "primary"}
                sx={{
                  borderRadius: 1,
                  height: 4,
                  bgcolor: isBest ? "rgba(120, 53, 15, 0.22)" : undefined,
                  "& .MuiLinearProgress-bar": isBest
                    ? {
                        background: "linear-gradient(90deg, #92400e, #f59e0b, #fef3c7)",
                      }
                    : undefined,
                }}
              />
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={0.5}>
                <Speed sx={{ fontSize: 16, color: "text.secondary" }} />
                <Typography variant="caption" color="text.secondary">
                  1 ta ma'lumotga:
                </Typography>
              </Box>
              <Typography variant="caption" fontWeight="bold">
                {formatAvgMinutes(admin.avg_entry_time)}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={0.5}>
                <CalendarMonth sx={{ fontSize: 16, color: "text.secondary" }} />
                <Typography variant="caption" color="text.secondary">
                  Jami kiritgan:
                </Typography>
              </Box>
              <Typography variant="caption" fontWeight="bold">
                {admin.total_entries || 0} ta
              </Typography>
            </Box>

            <Divider flexItem />

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={0.5}>
                <QueryBuilder sx={{ fontSize: 16, color: "text.secondary" }} />
                <Typography variant="caption" color="text.secondary">
                  Eng faol vaqti:
                </Typography>
              </Box>
              <Typography variant="caption" fontWeight="bold">
                {admin.most_active_hour || "-"}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={0.5}>
                <AccessTime sx={{ fontSize: 16, color: "text.secondary" }} />
                <Typography variant="caption" color="text.secondary">
                  Oxirgi faollik:
                </Typography>
              </Box>
              <Typography variant="caption" fontWeight="bold">
                {admin.last_active_at
                  ? new Date(admin.last_active_at).toLocaleTimeString("uz-UZ")
                  : "-"}
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

  const filteredData = data
    .filter((a) => {
      if (roleFilter === "all") return true;
      return a.role === roleFilter;
    })
    .sort((a, b) => getScore(b) - getScore(a) || (b.total_entries || 0) - (a.total_entries || 0));

  const onlineCount = data.filter((a) => a.status === "online").length;
  const bestUser = filteredData[0];
  const maxScore = bestUser ? getScore(bestUser) : 0;

  return (
    <Box>
      <Box
        display="flex"
        flexDirection={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        mb={4}
        gap={2}
      >
        <Box>
          <Typography variant="h4" fontWeight="900" color="primary.main" gutterBottom>
            Top chart
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Hozirda {onlineCount} ta foydalanuvchi online • Oxirgi yangilanish:{" "}
            {lastUpdated.toLocaleTimeString()}
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center" width={{ xs: "100%", md: "auto" }}>
          <ButtonGroup
            size="small"
            variant="outlined"
            sx={{ bgcolor: "background.paper", borderRadius: 2 }}
          >
            <Button
              onClick={() => setRoleFilter("all")}
              variant={roleFilter === "all" ? "contained" : "outlined"}
              sx={{ textTransform: "none", fontWeight: "bold" }}
            >
              Barchasi
            </Button>
            <Button
              onClick={() => setRoleFilter("admin")}
              variant={roleFilter === "admin" ? "contained" : "outlined"}
              sx={{ textTransform: "none", fontWeight: "bold" }}
            >
              Adminlar
            </Button>
            <Button
              onClick={() => setRoleFilter("researcher")}
              variant={roleFilter === "researcher" ? "contained" : "outlined"}
              sx={{ textTransform: "none", fontWeight: "bold" }}
            >
              Izlanuvchilar
            </Button>
          </ButtonGroup>

          <Tooltip title="Yangilash">
            <span>
              <IconButton
                onClick={() => fetchActivity()}
                disabled={loading}
                sx={{
                  bgcolor: "background.paper",
                  boxShadow: 1,
                  "&:hover": { bgcolor: "primary.main", color: "white" },
                }}
              >
                <Refresh sx={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {loading && data.length === 0 ? (
        <Box py={10} textAlign="center">
          <LinearProgress sx={{ maxWidth: 400, mx: "auto", borderRadius: 2 }} />
          <Typography sx={{ mt: 2 }} color="text.secondary">
            Ma'lumotlar yuklanmoqda...
          </Typography>
        </Box>
      ) : (
        <AnimatePresence mode="popLayout">
          {bestUser && (
            <Paper
              key="best-user-summary"
              elevation={0}
              sx={{
                mb: 3,
                p: { xs: 2, md: 3 },
                borderRadius: 2,
                border: "1px solid",
                borderColor: "#f59e0b",
                background: isDark
                  ? "linear-gradient(135deg, rgba(120, 53, 15, 0.9), rgba(245, 158, 11, 0.26), rgba(17, 24, 39, 0.82))"
                  : "linear-gradient(135deg, #fff7cc, #fbbf24, #fff8dc)",
                boxShadow: "0 20px 55px rgba(245, 158, 11, 0.24)",
                overflow: "hidden",
                position: "relative",
                animation: "goldCardPulse 2.8s ease-in-out infinite",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.14) 32%, rgba(255,255,255,0.72) 48%, rgba(255,255,255,0.12) 62%, transparent 100%)",
                  transform: "translateX(-120%)",
                  animation: "goldShine 3.2s ease-in-out infinite",
                  pointerEvents: "none",
                },
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "flex-start", md: "center" }}
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    sx={{
                      width: 52,
                      height: 52,
                      color: "#111827",
                      background: "linear-gradient(135deg, #fef3c7 0%, #f59e0b 55%, #92400e 100%)",
                      boxShadow: "0 0 0 4px rgba(255,255,255,0.28), 0 0 24px rgba(245,158,11,0.75)",
                      animation: "goldTrophyPulse 1.8s ease-in-out infinite",
                    }}
                  >
                    <EmojiEvents />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="overline"
                      fontWeight={900}
                      sx={{ color: isDark ? "#fde68a" : "#92400e" }}
                    >
                      Eng yaxshi natija
                    </Typography>
                    <Typography variant="h5" fontWeight={800}>
                      {bestUser.name}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={`Bugun ${bestUser.stats_today || 0} ta`} color="primary" />
                  <Chip label={`Hafta ${bestUser.stats_week || 0} ta`} color="success" />
                  <Chip label={`Oy ${bestUser.stats_month || 0} ta`} color="secondary" />
                  <Chip label={`1 yozuv ${formatAvgMinutes(bestUser.avg_entry_time)}`} />
                </Stack>
              </Stack>
            </Paper>
          )}
          <Grid key="activity-grid" container spacing={3}>
            {filteredData.map((admin, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={getActivityKey(admin, index)}>
                <ActivityCard
                  admin={admin}
                  isDark={isDark}
                  rank={index + 1}
                  isBest={index === 0}
                  maxScore={maxScore}
                />
              </Grid>
            ))}
            {filteredData.length === 0 && (
              <Grid size={{ xs: 12 }}>
                <Paper
                  sx={{
                    p: 10,
                    textAlign: "center",
                    borderRadius: 4,
                    bgcolor: "transparent",
                    border: "1px dashed",
                    borderColor: "divider",
                  }}
                >
                  <AccountCircle sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
                  <Typography color="text.secondary">
                    {roleFilter === "all"
                      ? "Foydalanuvchilar topilmadi"
                      : roleFilter === "admin"
                        ? "Adminlar topilmadi"
                        : "Izlanuvchilar topilmadi"}
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

        @keyframes goldShine {
          0% { transform: translateX(-120%); }
          42%, 100% { transform: translateX(120%); }
        }

        @keyframes goldCardPulse {
          0%, 100% { box-shadow: 0 18px 45px rgba(245, 158, 11, 0.24); }
          50% { box-shadow: 0 22px 64px rgba(245, 158, 11, 0.48); }
        }

        @keyframes goldTrophyPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
      `}</style>
    </Box>
  );
}

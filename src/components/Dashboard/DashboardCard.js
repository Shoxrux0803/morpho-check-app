import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { Fullscreen, Close } from "@mui/icons-material";

const DashboardCard = ({
  title,
  icon,
  children,
  loading,
  onFullscreen,
  isFullscreen,
  height = 350,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Card
      className="mc-surface-reveal mc-ambient-sheen"
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 4,
        position: "relative",
        overflow: "hidden",
        background: isDark ? "rgba(23, 26, 33, 0.7)" : "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(10px)",
        border: isDark
          ? "1px solid rgba(255, 255, 255, 0.12)"
          : "1px solid rgba(100, 116, 139, 0.12)",
        boxShadow: isDark
          ? "0 8px 32px 0 rgba(0, 0, 0, 0.4)"
          : "0 8px 32px 0 rgba(100, 116, 139, 0.08)",
        transition:
          "transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease, border-color 0.28s ease",
        "&:hover": {
          transform: "translateY(-5px) scale(1.006)",
          borderColor: isDark ? "rgba(125, 211, 252, 0.2)" : "rgba(14, 116, 144, 0.18)",
          boxShadow: isDark
            ? "0 12px 40px 0 rgba(0, 0, 0, 0.45)"
            : "0 12px 40px 0 rgba(31, 38, 135, 0.12)",
        },
      }}
    >
      <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            {icon && <Box sx={{ mr: 1.5, color: "primary.main", display: "flex" }}>{icon}</Box>}
            <Typography variant="h6" fontWeight="700" color="text.primary">
              {title}
            </Typography>
          </Box>
          <Box>
            {onFullscreen && (
              <IconButton size="small" onClick={onFullscreen} sx={{ color: "text.secondary" }}>
                {isFullscreen ? <Close /> : <Fullscreen />}
              </IconButton>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            minHeight: height,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loading ? <CircularProgress size={30} thickness={4} /> : children}
        </Box>
      </CardContent>
    </Card>
  );
};

export default DashboardCard;

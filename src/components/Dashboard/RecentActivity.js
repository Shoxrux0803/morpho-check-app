import React, { useMemo } from "react";
import { Card, CardContent, Typography, Box, CircularProgress } from "@mui/material";
import { Timeline } from "@mui/icons-material";

const getTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return `1 daqiqa oldin`;
  if (minutes < 60) return `${minutes} daqiqa oldin`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  return `${days} kun oldin`;
};

const RecentActivity = ({ data, loading }) => {

  const activities = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Sort by createdAt descending
    const sorted = [...data].sort((a, b) => {
      const dA = new Date(a.createdAt || a.created_at || 0).getTime();
      const dB = new Date(b.createdAt || b.created_at || 0).getTime();
      return dB - dA;
    });

    // Take top 5
    return sorted.slice(0, 5).map(user => ({
      action: "Yangi tahlil",
      details: `${user.lastName || ''} ${user.firstName || ''} (${user.region || 'Hudud kiritilmagan'})`,
      time: getTimeAgo(user.createdAt || user.created_at),
      id: user.id
    }));
  }, [data]);

  if (loading) {
    return (
      <Card elevation={2} sx={{ height: "100%", borderRadius: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" height={350}>
          <CircularProgress />
        </Box>
      </Card>
    );
  }

  return (
    <Card elevation={2} sx={{ height: "100%", borderRadius: 3 }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom>
          <Timeline sx={{ mr: 1, verticalAlign: "middle", fontSize: 20 }} />
          So'nggi faollik
        </Typography>
        <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 1, mt: 1 }}>
          {activities.length === 0 ? (
             <Typography color="text.secondary">Faollik topilmadi</Typography>
          ) : (
            activities.map((activity, index) => (
              <Box
                key={activity.id || index}
                sx={{
                  minWidth: 220,
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight="bold" color="primary" gutterBottom>
                    {activity.action}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {activity.details}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block", textAlign: "right" }}>
                  {activity.time}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;

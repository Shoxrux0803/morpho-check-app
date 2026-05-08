import React from "react";
import {
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Chip,
} from "@mui/material";
import { Person, AccessTime } from "@mui/icons-material";
import DashboardCard from "./DashboardCard";

const RecentActivity = ({ data, loading }) => {
  const recentData = (data || []).slice(0, 6); // Oxirgi 6 ta faollik

  const formatDate = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleString("uz-UZ", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardCard title="Oxirgi Faollik" icon={<AccessTime />} loading={loading} height={400}>
      {recentData.length === 0 ? (
        <Typography color="text.secondary">Faollik topilmadi</Typography>
      ) : (
        <List sx={{ width: "100%", p: 0 }}>
          {recentData.map((item, index) => (
            <React.Fragment key={item.id || index}>
              <ListItem alignItems="flex-start" sx={{ px: 0, py: 2 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: index % 2 === 0 ? "primary.light" : "secondary.light" }}>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle1" fontWeight="bold" component="span">
                        {item.first_name || item.firstName} {item.last_name || item.lastName}
                      </Typography>
                      <Chip
                        label={item.bmi_status || item.bmiStatus || "Ma'lumot yo'q"}
                        size="small"
                        color={
                          (item.bmi_status || item.bmiStatus || "").toLowerCase().includes("normal")
                            ? "success"
                            : "warning"
                        }
                        variant="outlined"
                        sx={{ fontSize: "0.7rem" }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box component="span" display="block" mt={0.5}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        component="span"
                        display="block"
                      >
                        {item.region || "Viloyat aniqlanmagan"}, {item.age} yosh
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ mt: 0.5, display: "block" }}
                        component="span"
                      >
                        {formatDate(item.created_at || item.createdAt)}
                      </Typography>
                    </Box>
                  }
                  secondaryTypographyProps={{ component: "div" }}
                />
              </ListItem>
              {index < recentData.length - 1 && (
                <Divider variant="inset" component="li" sx={{ ml: 7, borderColor: "divider" }} />
              )}
            </React.Fragment>
          ))}
        </List>
      )}
    </DashboardCard>
  );
};

export default RecentActivity;

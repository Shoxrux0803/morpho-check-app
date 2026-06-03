import React from "react";
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Button,
  Chip,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  Sync as SyncIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CloudOff as OffIcon,
  ErrorOutline as ErrorIcon,
  CheckCircleOutline as CheckIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useOfflineSync } from "../providers/OfflineSyncProvider";
import { useLanguage } from "../contexts/LanguageContext";

export default function SyncManager({ open, onClose, onEditItem }) {
  const { queue, isSyncing, removeFromQueue, syncManual } = useOfflineSync();
  const { t } = useLanguage();

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "syncing":
        return "info";
      case "failed":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <OffIcon color="warning" />;
      case "syncing":
        return <SyncIcon className="animate-spin" color="info" />;
      case "failed":
        return <ErrorIcon color="error" />;
      default:
        return <CheckIcon />;
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 350, p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6">{t("syncManagerTitle")}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<RefreshIcon />}
            disabled={isSyncing || queue.length === 0}
            onClick={syncManual}
          >
            {isSyncing ? t("syncing") : t("syncAllNow")}
          </Button>
        </Box>

        <Divider />

        {queue.length === 0 ? (
          <Box sx={{ py: 4, textAlignment: "center", opacity: 0.6 }}>
            <Typography align="center">{t("noPendingItems")}</Typography>
          </Box>
        ) : (
          <List>
            {queue.map((item) => (
              <ListItem
                key={item.id}
                sx={{
                  flexDirection: "column",
                  alignItems: "flex-start",
                  borderBottom: "1px solid #eee",
                  py: 2,
                }}
              >
                <Box sx={{ display: "flex", width: "100%", alignItems: "center", mb: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>{getStatusIcon(item.status)}</ListItemIcon>
                  <ListItemText
                    primary={`${item.payload.firstName} ${item.payload.lastName}`}
                    secondary={new Date(item.timestamp).toLocaleString()}
                  />
                  <Chip
                    label={item.status}
                    size="small"
                    color={getStatusColor(item.status)}
                    variant="outlined"
                  />
                </Box>

                {item.lastError && (
                  <Typography variant="caption" color="error" sx={{ mb: 1, display: "block" }}>
                    {t("errorPrefix")} {item.lastError}
                  </Typography>
                )}

                <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%", gap: 1 }}>
                  <Tooltip title={t("editAndFix")}>
                    <IconButton size="small" onClick={() => onEditItem(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t("remove")}>
                    <IconButton size="small" color="error" onClick={() => removeFromQueue(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
}

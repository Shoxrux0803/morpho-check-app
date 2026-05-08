import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Zoom,
} from "@mui/material";
import { Logout, Close } from "@mui/icons-material";

const LogoutConfirmDialog = ({ open, onClose, onConfirm }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Zoom}
      keepMounted
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 1,
          background: (theme) =>
            theme.palette.mode === "dark" ? "rgba(30, 32, 40, 0.9)" : "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(20px)",
          border: (theme) =>
            theme.palette.mode === "dark"
              ? "1px solid rgba(255, 255, 255, 0.1)"
              : "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 24px 48px rgba(0, 0, 0, 0.5)"
              : "0 24px 48px rgba(100, 116, 139, 0.2)",
        },
      }}
    >
      <DialogTitle
        component="div"
        sx={{ m: 0, p: 2, display: "flex", alignItems: "center", gap: 1.5 }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: "error.main",
            color: "white",
            boxShadow: "0 4px 12px rgba(211, 47, 47, 0.3)",
          }}
        >
          <Logout fontSize="small" />
        </Box>
        <Typography variant="h6" fontWeight={800}>
          Tizimdan chiqish
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 12,
            top: 12,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 3, py: 1 }}>
        <Typography variant="body1" color="text.secondary" fontWeight={500}>
          Chiqishni hohlaysizmi?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 700,
            px: 3,
          }}
        >
          Yo'q
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          autoFocus
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 700,
            px: 3,
            boxShadow: "0 4px 12px rgba(211, 47, 47, 0.2)",
          }}
        >
          Ha
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LogoutConfirmDialog;

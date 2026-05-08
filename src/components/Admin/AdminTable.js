import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Box,
} from "@mui/material";
import { Visibility, Delete, RestoreFromTrash, Edit } from "@mui/icons-material";

const AdminTable = ({
  rows,
  checked,
  toggleAll,
  allChecked,
  toggleOne,
  setViewRow,
  formatDate,
  user,
  onRestore, // Super admin uchun tiklash callback
  onEdit, // Tahrirlash callback
}) => {
  const isSuperAdmin = user?.role === "superadmin";

  return (
    <TableContainer sx={{ maxWidth: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <Table sx={{ minWidth: isSuperAdmin ? 1120 : 900 }}>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={allChecked}
                onChange={toggleAll}
                indeterminate={checked.size > 0 && !allChecked}
              />
            </TableCell>
            <TableCell>Sana</TableCell>
            <TableCell>F.I.SH</TableCell>
            <TableCell>Jins</TableCell>
            <TableCell>Yosh</TableCell>
            <TableCell>Manzil</TableCell>
            <TableCell>BMI</TableCell>
            <TableCell>Holat</TableCell>
            {isSuperAdmin && <TableCell>Admin</TableCell>}
            {isSuperAdmin && <TableCell>Status</TableCell>}
            <TableCell>Amallar</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row) => {
              const isDeleted = Boolean(row.is_deleted);
              return (
                <TableRow
                  key={row.id}
                  hover
                  sx={{
                    // Super admin o'chirilganni ham ko'ra oladi
                    cursor: isDeleted && !isSuperAdmin ? "default" : "pointer",
                    // O'chirilgan qatorlar: qizil fon
                    bgcolor: isDeleted ? "rgba(211, 47, 47, 0.07)" : "inherit",
                    "&:hover": isDeleted ? { bgcolor: "rgba(211, 47, 47, 0.12)" } : undefined,
                    // O'chirilgan qatorlar matnini kulrang qilamiz
                    "& td": isDeleted
                      ? { color: "text.disabled", textDecoration: "line-through" }
                      : {},
                  }}
                  onClick={() => {
                    // Super admin: o'chirilgan bo'lsa ham ko'ra oladi
                    // Oddiy admin: faqat aktiv qatorlarni ko'ra oladi
                    if (!isDeleted || isSuperAdmin) {
                      setViewRow(row);
                    }
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={checked.has(row.id)}
                      onChange={() => toggleOne(row.id)}
                      onClick={(e) => e.stopPropagation()}
                      disabled={isDeleted && !isSuperAdmin}
                    />
                  </TableCell>

                  {/* Sana */}
                  <TableCell sx={{ textDecoration: isDeleted ? "line-through" : "none" }}>
                    {formatDate(row.createdAt)}
                  </TableCell>

                  {/* F.I.SH */}
                  <TableCell sx={{ textDecoration: "none !important" }}>
                    <Typography
                      variant="body2"
                      fontWeight="medium"
                      sx={{
                        color: isDeleted ? "error.main" : "text.primary",
                        textDecoration: isDeleted ? "line-through" : "none",
                      }}
                    >
                      {row.lastName} {row.firstName}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ textTransform: "capitalize" }}>{row.gender}</TableCell>

                  <TableCell>
                    {row.age} yil
                    {row.age_months !== undefined && row.age_months !== null && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {row.age_months} oy, {row.age_days} kun
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    {row.region || "-"}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {[row.district, row.mahalla, row.address].filter(Boolean).join(" / ")}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {row.bmi ?? "-"}
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      ({row.bmiStatus})
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ textDecoration: "none !important" }}>
                    <Chip
                      label={row.bmiStatus || "-"}
                      size="small"
                      color={
                        row.bmiStatus?.startsWith("Semizlik")
                          ? "error"
                          : row.bmiStatus === "Normal"
                            ? "success"
                            : row.bmiStatus === "Ozg'in"
                              ? "warning"
                              : "default"
                      }
                      sx={{ opacity: isDeleted ? 0.5 : 1 }}
                    />
                  </TableCell>

                  {/* Super admin: Admin ustuni */}
                  {isSuperAdmin && (
                    <TableCell sx={{ textDecoration: "none !important" }}>
                      <Typography
                        variant="body2"
                        color={isDeleted ? "text.disabled" : "primary"}
                        fontWeight="medium"
                      >
                        {row.created_by_name || "Noma'lum"}
                      </Typography>
                    </TableCell>
                  )}

                  {/* Super admin: Status ustuni */}
                  {isSuperAdmin && (
                    <TableCell sx={{ textDecoration: "none !important" }}>
                      {isDeleted ? (
                        <Tooltip
                          title={
                            <Box>
                              <Typography variant="caption" display="block">
                                🗑️ O'chirgan: <strong>{row.deleted_by_name || "Noma'lum"}</strong>
                              </Typography>
                              {row.deleted_at && (
                                <Typography variant="caption" display="block">
                                  📅 {new Date(row.deleted_at).toLocaleString("uz-UZ")}
                                </Typography>
                              )}
                            </Box>
                          }
                          arrow
                          placement="top"
                        >
                          <Chip
                            label="O'CHIRILGAN"
                            size="small"
                            icon={<span style={{ fontSize: 12, paddingLeft: 4 }}>🗑️</span>}
                            sx={{
                              bgcolor: "error.main",
                              color: "white",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              cursor: "help",
                              "& .MuiChip-icon": { color: "white" },
                            }}
                          />
                        </Tooltip>
                      ) : (
                        <Chip
                          label="Aktiv"
                          size="small"
                          sx={{
                            bgcolor: "success.light",
                            color: "success.dark",
                            fontWeight: 600,
                            fontSize: "0.7rem",
                          }}
                        />
                      )}
                    </TableCell>
                  )}

                  {/* Amallar */}
                  <TableCell
                    onClick={(e) => e.stopPropagation()}
                    sx={{ textDecoration: "none !important" }}
                  >
                    <Box display="flex" gap={0.5}>
                      {/* Ko'rish tugmasi: aktiv qatorlar + super admin uchun o'chirilganlar ham */}
                      {(!isDeleted || isSuperAdmin) && (
                        <Tooltip title={isDeleted ? "O'chirilgan ma'lumotni ko'rish" : "Batafsil"}>
                          <IconButton
                            size="small"
                            sx={isDeleted ? { color: "error.main", opacity: 0.8 } : {}}
                            onClick={() => setViewRow(row)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {/* Tahrirlash tugmasi: faqat o'chirilmaganlar uchun */}
                      {!isDeleted && onEdit && (
                        <Tooltip title="Tahrirlash">
                          <IconButton size="small" color="primary" onClick={() => onEdit(row)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {/* Super admin: o'chirilgan ma'lumotni tiklash */}
                      {isSuperAdmin && isDeleted && onRestore && (
                        <Tooltip title="Tiklash (Restore)">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => onRestore([row.id])}
                          >
                            <RestoreFromTrash fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={isSuperAdmin ? 11 : 9} align="center" sx={{ py: 3 }}>
                Ma'lumot topilmadi
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AdminTable;

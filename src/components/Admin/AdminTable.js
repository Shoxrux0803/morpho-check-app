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
import { Visibility, Delete } from "@mui/icons-material";

const AdminTable = ({
  rows,
  checked,
  toggleAll,
  allChecked,
  toggleOne,
  setViewRow,
  formatDate,
}) => {
  return (
    <TableContainer>
      <Table>
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
            <TableCell>Amallar</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <TableRow
                key={row.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => setViewRow(row)}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={checked.has(row.id)}
                    onChange={() => toggleOne(row.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
                <TableCell>{formatDate(row.createdAt)}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
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
                    {row.district} {row.address}
                  </Typography>
                </TableCell>
                <TableCell>
                  {row.bmi ?? "-"}
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    ({row.bmiStatus})
                  </Typography>
                </TableCell>
                <TableCell>
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
                  />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Box display="flex">
                    <Tooltip title="Batafsil">
                      <IconButton size="small" onClick={() => setViewRow(row)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
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

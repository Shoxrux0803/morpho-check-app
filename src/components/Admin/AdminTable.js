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
import { Visibility, RestoreFromTrash, Edit } from "@mui/icons-material";
import { useLanguage } from "../../contexts/LanguageContext";
import { pageT } from "../../utils/pageI18n";

const REGION_LABELS_RU = {
  "toshkent shahri": "г. Ташкент",
  toshkent: "Ташкентская область",
  "toshkent viloyati": "Ташкентская область",
  qoraqalpogiston: "Республика Каракалпакстан",
  "qoraqalpog'iston": "Республика Каракалпакстан",
  andijon: "Андижанская область",
  buxoro: "Бухарская область",
  fargona: "Ферганская область",
  "farg'ona": "Ферганская область",
  jizzax: "Джизакская область",
  xorazm: "Хорезмская область",
  namangan: "Наманганская область",
  navoiy: "Навоийская область",
  qashqadaryo: "Кашкадарьинская область",
  samarqand: "Самаркандская область",
  sirdaryo: "Сырдарьинская область",
  surxondaryo: "Сурхандарьинская область",
};

const getRegionLabel = (value, lang) => {
  if (lang !== "ru") return value || "-";
  const key = String(value || "")
    .toLowerCase()
    .replace(/[‘’`ʻʼ]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return REGION_LABELS_RU[key] || value || "-";
};

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
  const { lang } = useLanguage();
  const t = (key) => pageT(lang, key);
  const isSuperAdmin = user?.role === "superadmin";
  const translateGender = (value) => {
    const normalized = String(value || "").toLowerCase();
    if (["erkak", "male", "m", "boy"].includes(normalized)) return t("male");
    if (["ayol", "female", "f", "girl"].includes(normalized)) return t("female");
    return value || "-";
  };
  const translateBmiStatus = (value) => {
    const normalized = String(value || "").toLowerCase();
    if (normalized.includes("normal")) return lang === "ru" ? "Норма" : value;
    if (normalized.includes("semizlik") || normalized.includes("obese")) {
      return lang === "ru" ? "Ожирение" : value;
    }
    if (normalized.includes("ozg") || normalized.includes("underweight")) {
      return lang === "ru" ? "Недостаточный вес" : value;
    }
    if (normalized.includes("ortiqcha") || normalized.includes("overweight")) {
      return lang === "ru" ? "Избыточный вес" : value;
    }
    return value || "-";
  };

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
            <TableCell>{t("date")}</TableCell>
            <TableCell>{t("fullName")}</TableCell>
            <TableCell>{t("gender")}</TableCell>
            <TableCell>{t("age")}</TableCell>
            <TableCell>{t("addressShort")}</TableCell>
            <TableCell>BMI</TableCell>
            <TableCell>{t("status")}</TableCell>
            {isSuperAdmin && <TableCell>Admin</TableCell>}
            {isSuperAdmin && <TableCell>{t("status")}</TableCell>}
            <TableCell>{t("actions")}</TableCell>
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

                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {translateGender(row.gender)}
                  </TableCell>

                  <TableCell>
                    {row.age} {t("yearShort")}
                    {row.age_months !== undefined && row.age_months !== null && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {row.age_months} {t("monthShort")}, {row.age_days} {t("dayShort")}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    {getRegionLabel(row.region, lang)}
                    <Typography variant="caption" display="block" color="text.secondary">
                      {[row.district, row.mahalla, row.address].filter(Boolean).join(" / ")}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {row.bmi ?? "-"}
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      ({translateBmiStatus(row.bmiStatus)})
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ textDecoration: "none !important" }}>
                    <Chip
                      label={translateBmiStatus(row.bmiStatus)}
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
                        {row.created_by_name || t("unknown")}
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
                                {t("deletedByShort")}:{" "}
                                <strong>{row.deleted_by_name || t("unknown")}</strong>
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
                            label={t("deletedStatus")}
                            size="small"
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
                          label={t("active")}
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
                        <Tooltip title={isDeleted ? t("viewDeletedData") : t("detailsTitle")}>
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
                        <Tooltip title={t("editData")}>
                          <IconButton size="small" color="primary" onClick={() => onEdit(row)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      {/* Super admin: o'chirilgan ma'lumotni tiklash */}
                      {isSuperAdmin && isDeleted && onRestore && (
                        <Tooltip title={t("restore")}>
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
                {t("noData")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AdminTable;

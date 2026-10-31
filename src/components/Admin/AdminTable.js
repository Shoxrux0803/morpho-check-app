import { formatAgeMonths } from '../../utils/ageMonths';
import React from 'react';
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
} from '@mui/material';
import { Visibility, RestoreFromTrash, Edit } from '@mui/icons-material';
import { useLanguage } from '../../contexts/LanguageContext';
import { pageT } from '../../utils/pageI18n';
import { getLocalizedLocationLabel } from '../../utils/locationI18n';

const localeByLang = {
  uz: 'uz-UZ',
  tg: 'tg-TJ',
  ru: 'ru-RU',
  en: 'en-US',
  kz: 'kk-KZ',
};

const AdminTable = ({
  rows,
  checked,
  toggleAll,
  allChecked,
  selectingAll = false,
  toggleOne,
  setViewRow,
  formatDate,
  user,
  onRestore, // Super admin uchun tiklash callback
  onEdit, // Tahrirlash callback
}) => {
  const { lang } = useLanguage();
  const t = (key) => pageT(lang, key);
  const locale = localeByLang[lang] || 'uz-UZ';
  const isSuperAdmin = user?.role === 'superadmin';
  const isAssistant = user?.role === 'field_assistant';
  const showCreator = !isAssistant;
  const hideChildPii = rows.some((row) => row.privacy_redacted);
  const translateGender = (value) => {
    const normalized = String(value || '').toLowerCase();
    if (['erkak', 'male', 'm', 'boy'].includes(normalized)) return t('male');
    if (['ayol', 'female', 'f', 'girl'].includes(normalized))
      return t('female');
    return value || '-';
  };
  const translateBmiStatus = (value) => {
    const normalized = String(value || '').toLowerCase();
    if (normalized.includes('normal')) return t('normal') || value;
    if (normalized.includes('semizlik') || normalized.includes('obese'))
      return t('obese') || value;
    if (normalized.includes('ozg') || normalized.includes('underweight'))
      return t('underweight') || value;
    if (normalized.includes('ortiqcha') || normalized.includes('overweight'))
      return t('overweight') || value;
    return value || '-';
  };

  return (
    <TableContainer
      sx={{
        maxWidth: '100%',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <Table sx={{ minWidth: isSuperAdmin ? 1180 : 980 }}>
        <TableHead>
          <TableRow>
            {!isAssistant && (
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allChecked}
                  onChange={toggleAll}
                  disabled={selectingAll}
                  indeterminate={checked.size > 0 && !allChecked}
                />
              </TableCell>
            )}
            <TableCell>{t('date')}</TableCell>
            {!hideChildPii && <TableCell>{t('fullName')}</TableCell>}
            <TableCell>{t('gender')}</TableCell>
            <TableCell>{t('age')}</TableCell>
            <TableCell>{t('addressShort')}</TableCell>
            <TableCell>BMI</TableCell>
            <TableCell>{t('status')}</TableCell>
            {showCreator && <TableCell>Kiritgan shaxs</TableCell>}
            {isSuperAdmin && <TableCell>{t('status')}</TableCell>}
            {!isAssistant && <TableCell>{t('actions')}</TableCell>}
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
                    cursor: isDeleted && !isSuperAdmin ? 'default' : 'pointer',
                    // O'chirilgan qatorlar: qizil fon
                    bgcolor: isDeleted ? 'rgba(211, 47, 47, 0.07)' : 'inherit',
                    '&:hover': isDeleted
                      ? { bgcolor: 'rgba(211, 47, 47, 0.12)' }
                      : undefined,
                    // O'chirilgan qatorlar matnini kulrang qilamiz
                    '& td': isDeleted
                      ? {
                          color: 'text.disabled',
                          textDecoration: 'line-through',
                        }
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
                  {!isAssistant && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={checked.has(row.id)}
                        onChange={() => toggleOne(row.id)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={isDeleted && !isSuperAdmin}
                      />
                    </TableCell>
                  )}

                  {/* Sana */}
                  <TableCell
                    sx={{ textDecoration: isDeleted ? 'line-through' : 'none' }}
                  >
                    {formatDate(row.createdAt)}
                  </TableCell>

                  {!hideChildPii && (
                    <TableCell sx={{ textDecoration: 'none !important' }}>
                      <Typography
                        variant="body2"
                        fontWeight="medium"
                        sx={{
                          color: isDeleted ? 'error.main' : 'text.primary',
                          textDecoration: isDeleted ? 'line-through' : 'none',
                        }}
                      >
                        {row.lastName} {row.firstName}
                      </Typography>
                    </TableCell>
                  )}

                  <TableCell sx={{ textTransform: 'capitalize' }}>
                    {translateGender(row.gender)}
                  </TableCell>

                  <TableCell>
                    {formatAgeMonths(row)} {t('monthShort')}
                  </TableCell>

                  <TableCell>
                    {getLocalizedLocationLabel(row.region, lang, 1)}
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                    >
                      {[
                        getLocalizedLocationLabel(row.district, lang, 2),
                        getLocalizedLocationLabel(row.mahalla, lang, 3),
                        row.address,
                      ]
                        .filter((part) => part && part !== '-')
                        .join(' / ')}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {row.bmi ?? '-'}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      ({translateBmiStatus(row.bmiStatus)})
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ textDecoration: 'none !important' }}>
                    <Chip
                      label={translateBmiStatus(row.bmiStatus)}
                      size="small"
                      color={
                        row.bmiStatus?.startsWith('Semizlik')
                          ? 'error'
                          : row.bmiStatus === 'Normal'
                            ? 'success'
                            : row.bmiStatus === "Ozg'in"
                              ? 'warning'
                              : 'default'
                      }
                      sx={{ opacity: isDeleted ? 0.5 : 1 }}
                    />
                  </TableCell>

                  {showCreator && (
                    <TableCell sx={{ textDecoration: 'none !important' }}>
                      <Chip
                        label={
                          row.created_by_role === 'field_assistant'
                            ? 'Field Assistant kiritdi'
                            : row.created_by_id === user?.id
                              ? "O'zi kiritdi"
                              : (row.created_by_role || 'Foydalanuvchi') +
                                ' kiritdi'
                        }
                        size="small"
                        color={
                          row.created_by_role === 'field_assistant'
                            ? 'warning'
                            : 'primary'
                        }
                        variant="outlined"
                        sx={{ fontWeight: 700 }}
                      />
                      <Typography variant="caption" display="block">
                        {row.created_by_name || t('unknown')}
                      </Typography>
                    </TableCell>
                  )}

                  {/* Super admin: Status ustuni */}
                  {isSuperAdmin && (
                    <TableCell sx={{ textDecoration: 'none !important' }}>
                      {isDeleted ? (
                        <Tooltip
                          title={
                            <Box>
                              <Typography variant="caption" display="block">
                                {t('deletedByShort')}:{' '}
                                <strong>
                                  {row.deleted_by_name || t('unknown')}
                                </strong>
                              </Typography>
                              {row.deleted_at && (
                                <Typography variant="caption" display="block">
                                  📅{' '}
                                  {new Date(row.deleted_at).toLocaleString(
                                    locale
                                  )}
                                </Typography>
                              )}
                            </Box>
                          }
                          arrow
                          placement="top"
                        >
                          <Chip
                            label={t('deletedStatus')}
                            size="small"
                            sx={{
                              bgcolor: 'error.main',
                              color: 'white',
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              cursor: 'help',
                              '& .MuiChip-icon': { color: 'white' },
                            }}
                          />
                        </Tooltip>
                      ) : (
                        <Chip
                          label={t('active')}
                          size="small"
                          sx={{
                            bgcolor: 'success.light',
                            color: 'success.dark',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        />
                      )}
                    </TableCell>
                  )}

                  {/* Amallar */}
                  {!isAssistant && (
                    <TableCell
                      onClick={(e) => e.stopPropagation()}
                      sx={{ textDecoration: 'none !important' }}
                    >
                      <Box display="flex" gap={0.5}>
                        {/* Ko'rish tugmasi: aktiv qatorlar + super admin uchun o'chirilganlar ham */}
                        {(!isDeleted || isSuperAdmin) && (
                          <Tooltip
                            title={
                              isDeleted
                                ? t('viewDeletedData')
                                : t('detailsTitle')
                            }
                          >
                            <IconButton
                              size="small"
                              sx={
                                isDeleted
                                  ? { color: 'error.main', opacity: 0.8 }
                                  : {}
                              }
                              onClick={() => setViewRow(row)}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {/* Tahrirlash tugmasi: faqat o'chirilmaganlar uchun */}
                        {!isDeleted && !isAssistant && onEdit && (
                          <Tooltip title={t('editData')}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => onEdit(row)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Super admin: o'chirilgan ma'lumotni tiklash */}
                        {isSuperAdmin && isDeleted && onRestore && (
                          <Tooltip title={t('restore')}>
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
                  )}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={(isSuperAdmin ? 11 : 9) - (hideChildPii ? 1 : 0)}
                align="center"
                sx={{ py: 3 }}
              >
                {t('noData')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AdminTable;

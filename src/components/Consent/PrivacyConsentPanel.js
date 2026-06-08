/** @jsxRuntime classic */
import React from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import GppGoodOutlinedIcon from "@mui/icons-material/GppGoodOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";

export const CONSENT_POLICY_VERSION = "privacy-consent-v1";

export const CONSENT_RELATIONSHIPS = [
  { value: "mother", label: "Ona" },
  { value: "father", label: "Ota" },
  { value: "guardian", label: "Qonuniy vasiy" },
];

const consentCopy = {
  title: "Maxfiylik va ota-ona/vasiyning roziligi",
  compliance: "HIPAA/GDPR tamoyillariga mos ishlov berish",
  note: "Bemor va bola sog'lig'iga oid ma'lumotlar faqat tibbiy tahlil, ilmiy kuzatuv va hisobot tayyorlash uchun ishlatiladi. Kirish huquqi admin, superadmin va ruxsatli izlanuvchilar bilan cheklanadi.",
  guardianName: "Rozilik bergan ota-ona yoki vasiy F.I.SH.",
  relationship: "Munosabati",
  phone: "Vasiy telefoni",
  checkbox:
    "Men bolaning qonuniy vakili sifatida uning shaxsiy va sog'liq ma'lumotlarini MorphoCheck tizimida qayta ishlashga roziman.",
  privacyHelp: "Maxfiylik standartlari bilan tanishing",
  privacyButton: "Ko'rish",
  confirmed: "Rozilik tasdiqlangan",
  missing: "Rozilik hali tasdiqlanmagan",
};

export function PrivacyConsentPanel({
  values,
  onChange,
  nameMap = {},
  FieldComponent = TextField,
  compact = false,
}) {
  const keys = {
    confirmed: nameMap.confirmed || "consentConfirmed",
    guardianName: nameMap.guardianName || "consentGuardianName",
    relationship: nameMap.relationship || "consentGuardianRelationship",
    phone: nameMap.phone || "consentGuardianPhone",
    policyVersion: nameMap.policyVersion || "consentPolicyVersion",
  };

  const checked = Boolean(values?.[keys.confirmed]);
  const handleValue = (name, value) => onChange?.({ target: { name, value } });

  return (
    <Paper
      elevation={0}
      sx={{
        p: compact ? 2 : 2.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: checked ? "success.light" : "warning.light",
        bgcolor: checked ? "rgba(46,125,50,0.06)" : "rgba(245,158,11,0.06)",
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                bgcolor: checked ? "success.main" : "warning.main",
                color: "#fff",
              }}
            >
              <GppGoodOutlinedIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant={compact ? "subtitle2" : "subtitle1"} fontWeight={800}>
                {consentCopy.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {consentCopy.compliance}
              </Typography>
            </Box>
          </Stack>
          <Chip
            icon={<VerifiedUserOutlinedIcon />}
            label={checked ? consentCopy.confirmed : consentCopy.missing}
            color={checked ? "success" : "warning"}
            size="small"
            sx={{ fontWeight: 800 }}
          />
        </Stack>

        {!compact && <Alert severity="info">{consentCopy.note}</Alert>}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Typography variant="body2" color="text.secondary">
            {consentCopy.privacyHelp}
          </Typography>
          <Button
            href="/privacy-compliance"
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            variant="outlined"
            endIcon={<OpenInNewOutlinedIcon fontSize="small" />}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
          >
            {consentCopy.privacyButton}
          </Button>
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <FieldComponent
              fullWidth
              size="small"
              label={consentCopy.guardianName}
              name={keys.guardianName}
              value={values?.[keys.guardianName] || ""}
              onChange={onChange}
              required
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FieldComponent
              select
              fullWidth
              size="small"
              label={consentCopy.relationship}
              name={keys.relationship}
              value={values?.[keys.relationship] || ""}
              onChange={onChange}
              required
            >
              {CONSENT_RELATIONSHIPS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </FieldComponent>
          </Grid>
          <Grid item xs={12} md={4}>
            <FieldComponent
              fullWidth
              size="small"
              label={consentCopy.phone}
              name={keys.phone}
              value={values?.[keys.phone] || ""}
              onChange={onChange}
              placeholder="+998"
            />
          </Grid>
        </Grid>

        <FormControlLabel
          control={
            <Checkbox
              checked={checked}
              onChange={(event) => {
                handleValue(keys.confirmed, event.target.checked);
                handleValue(keys.policyVersion, CONSENT_POLICY_VERSION);
              }}
            />
          }
          label={
            <Typography variant="body2" fontWeight={600}>
              {consentCopy.checkbox}
            </Typography>
          }
        />
      </Stack>
    </Paper>
  );
}

export function ConsentStatus({ record }) {
  const confirmed = Boolean(record?.consent_confirmed ?? record?.consentConfirmed);
  const guardian =
    record?.consent_guardian_name || record?.consentGuardianName || record?.guardianName || "";
  const relationship =
    record?.consent_guardian_relationship || record?.consentGuardianRelationship || "";
  const confirmedAt = record?.consent_confirmed_at || record?.consentConfirmedAt || "";

  return (
    <Alert
      severity={confirmed ? "success" : "warning"}
      icon={<VerifiedUserOutlinedIcon />}
      sx={{ mb: 2, borderRadius: 2 }}
    >
      <Typography variant="body2" fontWeight={800}>
        {confirmed ? consentCopy.confirmed : consentCopy.missing}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {guardian ? `${guardian}${relationship ? ` (${relationship})` : ""}` : consentCopy.note}
        {confirmedAt ? ` | ${new Date(confirmedAt).toLocaleString()}` : ""}
      </Typography>
    </Alert>
  );
}

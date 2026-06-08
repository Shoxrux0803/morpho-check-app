/** @jsxRuntime classic */
import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import GppGoodOutlinedIcon from "@mui/icons-material/GppGoodOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { toast } from "react-hot-toast";
import { useLanguage } from "../../contexts/LanguageContext";
import { generateConsentDocx } from "../../services/api";

export const CONSENT_POLICY_VERSION = "privacy-consent-v1";

export const CONSENT_RELATIONSHIPS = [
  { value: "mother", label: "Ona" },
  { value: "father", label: "Ota" },
  { value: "guardian", label: "Qonuniy vasiy" },
];

const COPY = {
  uz: {
    title: "Maxfiylik va ota-ona/vasiyning roziligi",
    compliance: "HIPAA/GDPR tamoyillariga mos ishlov berish",
    note: "Bemor va bola sog'lig'iga oid ma'lumotlar faqat tibbiy tahlil, ilmiy kuzatuv va hisobot tayyorlash uchun ishlatiladi. Kirish huquqi admin, superadmin va ruxsatli izlanuvchilar bilan cheklanadi.",
    guardianName: "Rozilik bergan ota-ona yoki vasiy F.I.SH.",
    relationship: "Munosabati",
    phone: "Vasiy telefoni",
    child: "Bola/bemor",
    checkbox:
      "Men bolaning qonuniy vakili sifatida uning shaxsiy va sog'liq ma'lumotlarini MorphoCheck tizimida qayta ishlashga roziman.",
    privacyHelp: "Maxfiylik standartlari bilan tanishing",
    privacyButton: "Ko'rish",
    docxButton: "DOCX olish",
    close: "Yopish",
    confirmed: "Rozilik tasdiqlangan",
    missing: "Rozilik hali tasdiqlanmagan",
    language: "Til",
  },
  en: {
    title: "Privacy and parent/guardian consent",
    compliance: "Processing aligned with HIPAA/GDPR principles",
    note: "Patient and child health data is used only for medical analysis, research observation, and report preparation. Access is limited to authorized admins, superadmins, and researchers.",
    guardianName: "Consenting parent or guardian full name",
    relationship: "Relationship",
    phone: "Guardian phone",
    child: "Child/patient",
    checkbox:
      "As the child's legal representative, I consent to processing the child's personal and health data in MorphoCheck.",
    privacyHelp: "Review the privacy standards",
    privacyButton: "View",
    docxButton: "Download DOCX",
    close: "Close",
    confirmed: "Consent confirmed",
    missing: "Consent not confirmed yet",
    language: "Language",
  },
  ru: {
    title: "Конфиденциальность и согласие родителя/представителя",
    compliance: "Обработка по принципам HIPAA/GDPR",
    note: "Медицинские данные пациента и ребенка используются только для анализа, научного наблюдения и подготовки отчетов. Доступ ограничен авторизованными пользователями.",
    guardianName: "Ф.И.О. родителя или законного представителя",
    relationship: "Отношение",
    phone: "Телефон представителя",
    child: "Ребенок/пациент",
    checkbox:
      "Я, как законный представитель ребенка, даю согласие на обработку его персональных и медицинских данных в MorphoCheck.",
    privacyHelp: "Ознакомьтесь со стандартами конфиденциальности",
    privacyButton: "Открыть",
    docxButton: "Скачать DOCX",
    close: "Закрыть",
    confirmed: "Согласие подтверждено",
    missing: "Согласие еще не подтверждено",
    language: "Язык",
  },
  kz: {
    title: "Құпиялылық және ата-ана/өкіл келісімі",
    compliance: "HIPAA/GDPR қағидаттарына сай өңдеу",
    note: "Пациент пен бала денсаулығына қатысты деректер тек медициналық талдау, ғылыми бақылау және есеп дайындау үшін қолданылады.",
    guardianName: "Келісім берген ата-ана немесе заңды өкіл",
    relationship: "Қатынасы",
    phone: "Өкіл телефоны",
    child: "Бала/пациент",
    checkbox:
      "Мен баланың заңды өкілі ретінде оның жеке және денсаулық деректерін MorphoCheck жүйесінде өңдеуге келісім беремін.",
    privacyHelp: "Құпиялылық стандарттарымен танысыңыз",
    privacyButton: "Көру",
    docxButton: "DOCX жүктеу",
    close: "Жабу",
    confirmed: "Келісім расталды",
    missing: "Келісім әлі расталмаған",
    language: "Тіл",
  },
  ky: {
    title: "Купуялык жана ата-эне/өкүл макулдугу",
    compliance: "HIPAA/GDPR принциптерине ылайык иштетүү",
    note: "Бейтап жана бала ден соолук маалыматтары медициналык талдоо, илимий байкоо жана отчет даярдоо үчүн гана колдонулат.",
    guardianName: "Макулдук берген ата-эне же мыйзамдуу өкүл",
    relationship: "Мамилеси",
    phone: "Өкүл телефону",
    child: "Бала/бейтап",
    checkbox:
      "Мен баланын мыйзамдуу өкүлү катары анын жеке жана ден соолук маалыматтарын MorphoCheck тутумунда иштетүүгө макулмун.",
    privacyHelp: "Купуялык стандарттары менен таанышыңыз",
    privacyButton: "Көрүү",
    docxButton: "DOCX жүктөө",
    close: "Жабуу",
    confirmed: "Макулдук тастыкталды",
    missing: "Макулдук тастыктала элек",
    language: "Тил",
  },
  tg: {
    title: "Махфият ва розигии волид/васӣ",
    compliance: "Коркард мувофиқи принсипҳои HIPAA/GDPR",
    note: "Маълумоти тиббии бемор ва кӯдак танҳо барои таҳлили тиббӣ, назорати илмӣ ва омодасозии ҳисобот истифода мешавад.",
    guardianName: "Ному насаби волид ё васии қонунӣ",
    relationship: "Муносибат",
    phone: "Телефони васӣ",
    child: "Кӯдак/бемор",
    checkbox:
      "Ман ҳамчун намояндаи қонунии кӯдак барои коркарди маълумоти шахсӣ ва тиббии ӯ дар MorphoCheck розигӣ медиҳам.",
    privacyHelp: "Бо стандартҳои махфият шинос шавед",
    privacyButton: "Дидан",
    docxButton: "DOCX гирифтан",
    close: "Пӯшидан",
    confirmed: "Розигӣ тасдиқ шуд",
    missing: "Розигӣ ҳанӯз тасдиқ нашудааст",
    language: "Забон",
  },
};

const LANGS = ["uz", "ru", "en", "kz", "ky", "tg"];
const getCopy = (lang) => COPY[lang] || COPY.uz;

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export function PrivacyConsentPanel({
  values,
  onChange,
  nameMap = {},
  FieldComponent = TextField,
  compact = false,
}) {
  const { lang } = useLanguage();
  const copy = getCopy(lang);
  const [open, setOpen] = useState(false);
  const [docLang, setDocLang] = useState(lang || "uz");
  const [downloading, setDownloading] = useState(false);
  const keys = {
    confirmed: nameMap.confirmed || "consentConfirmed",
    guardianName: nameMap.guardianName || "consentGuardianName",
    relationship: nameMap.relationship || "consentGuardianRelationship",
    phone: nameMap.phone || "consentGuardianPhone",
    policyVersion: nameMap.policyVersion || "consentPolicyVersion",
  };

  const checked = Boolean(values?.[keys.confirmed]);
  const childName =
    values?.full_name ||
    values?.childName ||
    `${values?.firstName || ""} ${values?.lastName || ""}`.trim();
  const guardianName = values?.[keys.guardianName] || "";
  const handleValue = (name, value) => onChange?.({ target: { name, value } });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await generateConsentDocx(
        {
          child_name: childName,
          guardian_name: guardianName,
          guardian_relationship: values?.[keys.relationship] || "",
          guardian_phone:
            values?.[keys.phone] || values?.parentsPhone || values?.parents_phone || "",
          consent_policy_version: values?.[keys.policyVersion] || CONSENT_POLICY_VERSION,
        },
        docLang,
      );
      downloadBlob(blob, `morphocheck_consent_${docLang}.docx`);
    } catch (error) {
      toast.error(error.message || "DOCX yuklashda xatolik");
    } finally {
      setDownloading(false);
    }
  };

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
                {copy.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {copy.compliance}
              </Typography>
            </Box>
          </Stack>
          <Chip
            icon={<VerifiedUserOutlinedIcon />}
            label={checked ? copy.confirmed : copy.missing}
            color={checked ? "success" : "warning"}
            size="small"
            sx={{ fontWeight: 800 }}
          />
        </Stack>

        {!compact && <Alert severity="info">{copy.note}</Alert>}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Typography variant="body2" color="text.secondary">
            {copy.privacyHelp}
          </Typography>
          <Button
            onClick={() => setOpen(true)}
            size="small"
            variant="outlined"
            startIcon={<VisibilityOutlinedIcon fontSize="small" />}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
          >
            {copy.privacyButton}
          </Button>
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <FieldComponent
              fullWidth
              size="small"
              label={copy.guardianName}
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
              label={copy.relationship}
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
              label={copy.phone}
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
              {copy.checkbox}
            </Typography>
          }
        />
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>{copy.title}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="info">{copy.note}</Alert>
            <Typography variant="body2">{copy.checkbox}</Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label={copy.guardianName}
                  value={guardianName}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label={copy.child}
                  value={childName}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 100, mr: "auto" }}>
            <InputLabel>{copy.language}</InputLabel>
            <Select
              value={docLang}
              label={copy.language}
              onChange={(event) => setDocLang(event.target.value)}
            >
              {LANGS.map((item) => (
                <MenuItem key={item} value={item}>
                  {item.toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={
              downloading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <DescriptionOutlinedIcon />
              )
            }
            onClick={handleDownload}
            disabled={downloading}
          >
            {copy.docxButton}
          </Button>
          <Button onClick={() => setOpen(false)}>{copy.close}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export function ConsentStatus({ record, onDownloadDocx, downloading = false, lang = "uz" }) {
  const copy = getCopy(lang);
  const confirmed = Boolean(record?.consent_confirmed ?? record?.consentConfirmed);
  const age = Number(record?.age ?? record?.age_years ?? 0);
  if (age >= 18 && !confirmed) return null;
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
        {confirmed ? copy.confirmed : copy.missing}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {guardian ? `${guardian}${relationship ? ` (${relationship})` : ""}` : copy.note}
        {confirmedAt ? ` | ${new Date(confirmedAt).toLocaleString()}` : ""}
      </Typography>
      {onDownloadDocx && (
        <Button
          size="small"
          variant="outlined"
          startIcon={downloading ? <CircularProgress size={16} /> : <DescriptionOutlinedIcon />}
          onClick={onDownloadDocx}
          disabled={downloading}
          sx={{ mt: 1, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
        >
          {copy.docxButton}
        </Button>
      )}
    </Alert>
  );
}

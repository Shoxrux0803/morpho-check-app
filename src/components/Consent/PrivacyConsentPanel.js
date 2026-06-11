/** @jsxRuntime classic */
import React, { useEffect, useRef, useState } from 'react';
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
} from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { generateConsentDocx } from '../../services/api';

export const CONSENT_POLICY_VERSION = 'helsinki-declaration-consent-v1';

export const CONSENT_RELATIONSHIPS = [
  { value: 'mother', label: 'Ona' },
  { value: 'father', label: 'Ota' },
  { value: 'guardian', label: 'Qonuniy vasiy' },
];

const COPY = {
  uz: {
    title: 'Helsinki deklaratsiyasi asosidagi ota-ona/vasiyning roziligi',
    compliance: 'Inson ishtirokidagi tibbiy tadqiqotlar uchun etik tamoyillar',
    note: "Bemor va bola sog'lig'iga oid ma'lumotlar Jahon tibbiyot assotsiatsiyasining Helsinki deklaratsiyasi tamoyillari asosida faqat tibbiy tahlil, ilmiy kuzatuv va hisobot tayyorlash uchun ishlatiladi. Ishtirokchi huquqlari, maxfiylik, xavfni kamaytirish va ixtiyoriy rozilik ustuvor hisoblanadi.",
    guardianName: 'Rozilik bergan ota-ona yoki vasiy F.I.SH.',
    relationship: 'Munosabati',
    phone: 'Vasiy telefoni',
    child: 'Bola/bemor',
    checkbox:
      "Men bolaning qonuniy vakili sifatida Helsinki deklaratsiyasi tamoyillari bo'yicha tushuntirilgan maqsadlar asosida uning shaxsiy va sog'liq ma'lumotlarini MorphoCheck tizimida qayta ishlashga roziman.",
    privacyHelp: 'Etik rozilik tamoyillari bilan tanishing',
    privacyButton: "Ko'rish",
    declarationButton: "Deklaratsiyani to'liq ko'rish",
    declarationTitle: "Helsinki deklaratsiyasi to'liq matni",
    declarationAcknowledge: 'Tanishib chiqdim',
    declarationScrollHint: 'Tasdiqlash uchun matn oxirigacha tushing.',
    declarationLoading: 'Deklaratsiya matni yuklanmoqda...',
    declarationError: 'Deklaratsiya matnini yuklashda xatolik yuz berdi.',
    docxButton: 'DOCX olish',
    close: 'Yopish',
    confirmed: 'Rozilik tasdiqlangan',
    missing: 'Rozilik hali tasdiqlanmagan',
    language: 'Til',
  },
  en: {
    title: 'Parent/guardian consent under the Declaration of Helsinki',
    compliance:
      'Ethical principles for medical research involving human participants',
    note: 'Patient and child health data is handled under the World Medical Association Declaration of Helsinki principles and used only for medical analysis, research observation, and report preparation. Participant rights, confidentiality, risk minimization, and voluntary consent are treated as priorities.',
    guardianName: 'Consenting parent or guardian full name',
    relationship: 'Relationship',
    phone: 'Guardian phone',
    child: 'Child/patient',
    checkbox:
      "As the child's legal representative, I consent to processing the child's personal and health data in MorphoCheck for the explained purposes under Declaration of Helsinki principles.",
    privacyHelp: 'Review the ethical consent principles',
    privacyButton: 'View',
    declarationButton: 'View full Declaration',
    declarationTitle: 'Full text of the Declaration of Helsinki',
    declarationAcknowledge: 'I have reviewed it',
    declarationScrollHint: 'Scroll to the end of the text to acknowledge.',
    declarationLoading: 'Loading the Declaration text...',
    declarationError: 'Could not load the Declaration text.',
    docxButton: 'Download DOCX',
    close: 'Close',
    confirmed: 'Consent confirmed',
    missing: 'Consent not confirmed yet',
    language: 'Language',
  },
  tr: {
    title: 'Helsinki Bildirgesi kapsaminda ebeveyn/vasi onami',
    compliance: 'Insan katilimcili tibbi arastirmalar icin etik ilkeler',
    note: 'Hasta ve cocuk sagligi verileri Dunya Tabipler Birligi Helsinki Bildirgesi ilkeleri kapsaminda yalnizca tibbi analiz, bilimsel izlem ve rapor hazirlama icin kullanilir. Katilimci haklari, gizlilik, riskin azaltilmasi ve gonullu onam onceliklidir.',
    guardianName: 'Onam veren ebeveyn veya vasi tam adi',
    relationship: 'Yakinlik derecesi',
    phone: 'Vasi telefonu',
    child: 'Cocuk/hasta',
    checkbox:
      'Cocugun yasal temsilcisi olarak, Helsinki Bildirgesi ilkelerine gore aciklanan amaclar kapsaminda cocugun kisisel ve saglik verilerinin MorphoCheck sisteminde islenmesine onay veriyorum.',
    privacyHelp: 'Etik onam ilkelerini inceleyin',
    privacyButton: 'Gor',
    declarationButton: 'Bildirgenin tam metnini gor',
    declarationTitle: 'Helsinki Bildirgesi tam metni',
    declarationAcknowledge: 'Inceledim',
    declarationScrollHint: 'Onaylamak icin metnin sonuna kadar inin.',
    declarationLoading: 'Bildirge metni yukleniyor...',
    declarationError: 'Bildirge metni yuklenemedi.',
    docxButton: 'DOCX indir',
    close: 'Kapat',
    confirmed: 'Onam onaylandi',
    missing: 'Onam henuz onaylanmadi',
    language: 'Dil',
  },
  ru: {
    title: 'Конфиденциальность и согласие родителя/представителя',
    compliance: 'Этические принципы Хельсинкской декларации',
    note: 'Медицинские данные пациента и ребенка используются только для анализа, научного наблюдения и подготовки отчетов. Доступ ограничен авторизованными пользователями.',
    guardianName: 'Ф.И.О. родителя или законного представителя',
    relationship: 'Отношение',
    phone: 'Телефон представителя',
    child: 'Ребенок/пациент',
    checkbox:
      'Я, как законный представитель ребенка, даю согласие на обработку его персональных и медицинских данных в MorphoCheck.',
    privacyHelp: 'Ознакомьтесь со стандартами конфиденциальности',
    privacyButton: 'Открыть',
    declarationButton: 'Полный текст декларации',
    declarationTitle: 'Полный текст Хельсинкской декларации',
    declarationAcknowledge: 'Ознакомлен(а)',
    declarationScrollHint:
      'Прокрутите текст до конца, чтобы подтвердить ознакомление.',
    declarationLoading: 'Загрузка текста декларации...',
    declarationError: 'Не удалось загрузить текст декларации.',
    docxButton: 'Скачать DOCX',
    close: 'Закрыть',
    confirmed: 'Согласие подтверждено',
    missing: 'Согласие еще не подтверждено',
    language: 'Язык',
  },
  kz: {
    title: 'Құпиялылық және ата-ана/өкіл келісімі',
    compliance: 'Хельсинки декларациясының этикалық қағидаттары',
    note: 'Пациент пен бала денсаулығына қатысты деректер тек медициналық талдау, ғылыми бақылау және есеп дайындау үшін қолданылады.',
    guardianName: 'Келісім берген ата-ана немесе заңды өкіл',
    relationship: 'Қатынасы',
    phone: 'Өкіл телефоны',
    child: 'Бала/пациент',
    checkbox:
      'Мен баланың заңды өкілі ретінде оның жеке және денсаулық деректерін MorphoCheck жүйесінде өңдеуге келісім беремін.',
    privacyHelp: 'Құпиялылық стандарттарымен танысыңыз',
    privacyButton: 'Көру',
    declarationButton: 'Декларацияны толық көру',
    declarationTitle: 'Хельсинки декларациясының толық мәтіні',
    declarationAcknowledge: 'Таныстым',
    declarationScrollHint:
      'Танысуды растау үшін мәтіннің соңына дейін түсіңіз.',
    declarationLoading: 'Декларация мәтіні жүктелуде...',
    declarationError: 'Декларация мәтінін жүктеу мүмкін болмады.',
    docxButton: 'DOCX жүктеу',
    close: 'Жабу',
    confirmed: 'Келісім расталды',
    missing: 'Келісім әлі расталмаған',
    language: 'Тіл',
  },
  ky: {
    title: 'Купуялык жана ата-эне/өкүл макулдугу',
    compliance: 'Хельсинки декларациясынын этикалык принциптери',
    note: 'Бейтап жана бала ден соолук маалыматтары медициналык талдоо, илимий байкоо жана отчет даярдоо үчүн гана колдонулат.',
    guardianName: 'Макулдук берген ата-эне же мыйзамдуу өкүл',
    relationship: 'Мамилеси',
    phone: 'Өкүл телефону',
    child: 'Бала/бейтап',
    checkbox:
      'Мен баланын мыйзамдуу өкүлү катары анын жеке жана ден соолук маалыматтарын MorphoCheck тутумунда иштетүүгө макулмун.',
    privacyHelp: 'Купуялык стандарттары менен таанышыңыз',
    privacyButton: 'Көрүү',
    declarationButton: 'Декларацияны толук көрүү',
    declarationTitle: 'Хельсинки декларациясынын толук тексти',
    declarationAcknowledge: 'Тааныштым',
    declarationScrollHint:
      'Таанышууну ырастоо үчүн тексттин аягына чейин түшүңүз.',
    declarationLoading: 'Декларация тексти жүктөлүүдө...',
    declarationError: 'Декларация текстин жүктөө мүмкүн болбоду.',
    docxButton: 'DOCX жүктөө',
    close: 'Жабуу',
    confirmed: 'Макулдук тастыкталды',
    missing: 'Макулдук тастыктала элек',
    language: 'Тил',
  },
  tg: {
    title: 'Махфият ва розигии волид/васӣ',
    compliance: 'Принсипҳои ахлоқии Эъломияи Ҳелсинки',
    note: 'Маълумоти тиббии бемор ва кӯдак танҳо барои таҳлили тиббӣ, назорати илмӣ ва омодасозии ҳисобот истифода мешавад.',
    guardianName: 'Ному насаби волид ё васии қонунӣ',
    relationship: 'Муносибат',
    phone: 'Телефони васӣ',
    child: 'Кӯдак/бемор',
    checkbox:
      'Ман ҳамчун намояндаи қонунии кӯдак барои коркарди маълумоти шахсӣ ва тиббии ӯ дар MorphoCheck розигӣ медиҳам.',
    privacyHelp: 'Бо стандартҳои махфият шинос шавед',
    privacyButton: 'Дидан',
    declarationButton: 'Дидани пурраи Эъломия',
    declarationTitle: 'Матни пурраи Эъломияи Ҳелсинки',
    declarationAcknowledge: 'Шинос шудам',
    declarationScrollHint: 'Барои тасдиқ матнро то охир поён баред.',
    declarationLoading: 'Матни Эъломия бор мешавад...',
    declarationError: 'Бор кардани матни Эъломия муяссар нашуд.',
    docxButton: 'DOCX гирифтан',
    close: 'Пӯшидан',
    confirmed: 'Розигӣ тасдиқ шуд',
    missing: 'Розигӣ ҳанӯз тасдиқ нашудааст',
    language: 'Забон',
  },
  tm: {
    title: 'Helsinki deklarasiýasy esasynda ene-ata/hossar razylygy',
    compliance:
      'Adamyň gatnaşmagyndaky lukmançylyk barlaglary üçin etiki ýörelgeler',
    note: 'Näsagyň we çaganyň saglygyna degişli maglumatlar Bütindünýä lukmançylyk assosiasiýasynyň Helsinki deklarasiýasynyň ýörelgeleri esasynda diňe lukmançylyk seljermesi, ylmy gözegçilik we hasabat taýýarlamak üçin ulanylýar.',
    guardianName: 'Razylyk beren ene-ata ýa-da kanuny hossar',
    relationship: 'Gatnaşygy',
    phone: 'Hossaryň telefony',
    child: 'Çaga/näsag',
    checkbox:
      'Men çaganyň kanuny wekili hökmünde onuň şahsy we saglyk maglumatlarynyň MorphoCheck ulgamynda işlenmegine razylyk berýärin.',
    privacyHelp: 'Etiki razylyk ýörelgeleri bilen tanyşyň',
    privacyButton: 'Görmek',
    declarationButton: 'Deklarasiýany doly görmek',
    declarationTitle: 'Helsinki deklarasiýasynyň doly teksti',
    declarationAcknowledge: 'Tanyşdym',
    declarationScrollHint: 'Tassyklamak üçin tekstiň ahyryna çenli aşak düşüň.',
    declarationLoading: 'Deklarasiýa teksti ýüklenýär...',
    declarationError: 'Deklarasiýa tekstini ýüklemek başartmady.',
    docxButton: 'DOCX almak',
    close: 'Ýapmak',
    confirmed: 'Razylyk tassyklandy',
    missing: 'Razylyk entek tassyklanmady',
    language: 'Dil',
  },
};

const LANGS = ['uz', 'tr', 'ru', 'en', 'kz', 'ky', 'tg', 'tm'];
const getCopy = (lang) => COPY[lang] || COPY.uz;

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

function HelsinkiDeclarationDialog({ open, onClose, copy, lang = 'uz' }) {
  const contentRef = useRef(null);
  const [markdown, setMarkdown] = useState('');
  const [loadedPath, setLoadedPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [atBottom, setAtBottom] = useState(false);
  const declarationPath =
    {
      uz: '/Helsinki_declaration_uz.md',
      ru: '/Helsinki_declaration_ru.md',
      en: '/Helsinki_declaration_en.md',
      tr: '/Helsinki_declaration_tr.md',
      kz: '/Helsinki_declaration_kz.md',
      ky: '/Helsinki_declaration_kg.md',
      tg: '/Helsinki_declaration_tj.md',
      tm: '/Helsinki_declaration_tm.md',
    }[lang] || '/Declaration_of_Helsinki_2013.md';

  useEffect(() => {
    if (!open) return;
    setAtBottom(false);
    if ((markdown && loadedPath === declarationPath) || loading) return;

    setLoading(true);

    fetch(declarationPath)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Declaration file not found');
        }
        return response.text();
      })
      .then((text) => {
        setMarkdown(text);
        setLoadedPath(declarationPath);
        setError('');
      })
      .catch(() => {
        setError(copy.declarationError);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [
    copy.declarationError,
    declarationPath,
    loadedPath,
    loading,
    markdown,
    open,
  ]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      const node = contentRef.current;
      if (!node) return;
      setAtBottom(node.scrollHeight <= node.clientHeight + 8);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [markdown, open]);

  const handleScroll = (event) => {
    const node = event.currentTarget;
    const bottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 12;
    if (bottom) setAtBottom(true);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          width: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 48px)' },
          m: { xs: 1, sm: 3 },
          maxHeight: { xs: 'calc(100dvh - 16px)', sm: 'calc(100dvh - 48px)' },
        },
      }}
    >
      <DialogTitle
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 },
          fontSize: { xs: '1.05rem', sm: '1.25rem' },
          fontWeight: 900,
          lineHeight: 1.25,
          overflowWrap: 'anywhere',
        }}
      >
        {copy.declarationTitle}
      </DialogTitle>
      <DialogContent
        dividers
        ref={contentRef}
        onScroll={handleScroll}
        sx={{
          px: { xs: 2, sm: 3 },
          py: { xs: 1.5, sm: 2 },
          maxHeight: { xs: 'calc(100dvh - 148px)', sm: '72vh' },
          bgcolor: 'background.paper',
        }}
      >
        {loading && (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <CircularProgress size={20} />
            <Typography variant="body2">{copy.declarationLoading}</Typography>
          </Stack>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && (
          <Box
            sx={{
              overflowWrap: 'anywhere',
              '& h1': {
                fontSize: { xs: '1.2rem', sm: '1.55rem' },
                fontWeight: 900,
                mt: 0,
                mb: 1.5,
              },
              '& h2': {
                fontSize: { xs: '1.05rem', sm: '1.25rem' },
                fontWeight: 850,
                mt: 3,
                mb: 1,
              },
              '& h3': { fontSize: '1rem', fontWeight: 850, mt: 2, mb: 0.5 },
              '& p, & li': {
                fontSize: { xs: '0.9rem', sm: '0.95rem' },
                lineHeight: 1.7,
              },
              '& ul, & ol': { pl: { xs: 2.25, sm: 3 } },
              '& hr': {
                border: 0,
                borderTop: '1px solid',
                borderColor: 'divider',
                my: 2.5,
              },
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {markdown}
            </ReactMarkdown>
          </Box>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          p: { xs: 1.5, sm: 2 },
          gap: 1,
          alignItems: { xs: 'stretch', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        {!atBottom && !error && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mr: { sm: 'auto' }, width: { xs: '100%', sm: 'auto' } }}
          >
            {copy.declarationScrollHint}
          </Typography>
        )}
        <Button
          variant="contained"
          onClick={onClose}
          disabled={!atBottom && !error}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 800,
          }}
        >
          {copy.declarationAcknowledge}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

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
  const [declarationOpen, setDeclarationOpen] = useState(false);
  const [docLang, setDocLang] = useState(lang || 'uz');
  const [downloading, setDownloading] = useState(false);
  const keys = {
    confirmed: nameMap.confirmed || 'consentConfirmed',
    guardianName: nameMap.guardianName || 'consentGuardianName',
    relationship: nameMap.relationship || 'consentGuardianRelationship',
    phone: nameMap.phone || 'consentGuardianPhone',
    policyVersion: nameMap.policyVersion || 'consentPolicyVersion',
  };

  const checked = Boolean(values?.[keys.confirmed]);
  const childName =
    values?.full_name ||
    values?.childName ||
    `${values?.firstName || ''} ${values?.lastName || ''}`.trim();
  const guardianName = values?.[keys.guardianName] || '';
  const handleValue = (name, value) => onChange?.({ target: { name, value } });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await generateConsentDocx(
        {
          child_name: childName,
          guardian_name: guardianName,
          guardian_relationship: values?.[keys.relationship] || '',
          guardian_phone:
            values?.[keys.phone] ||
            values?.parentsPhone ||
            values?.parents_phone ||
            '',
          consent_policy_version:
            values?.[keys.policyVersion] || CONSENT_POLICY_VERSION,
        },
        docLang
      );
      downloadBlob(blob, `morphocheck_consent_${docLang}.docx`);
    } catch (error) {
      toast.error(error.message || 'DOCX yuklashda xatolik');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: compact ? 1.5 : 2, sm: compact ? 2 : 2.5 },
        borderRadius: 2,
        border: '1px solid',
        borderColor: checked ? 'success.light' : 'warning.light',
        bgcolor: checked ? 'rgba(46,125,50,0.06)' : 'rgba(245,158,11,0.06)',
        overflow: 'hidden',
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
        >
          <Stack
            direction="row"
            spacing={1.2}
            alignItems="center"
            sx={{ minWidth: 0 }}
          >
            <Box
              sx={{
                flex: '0 0 auto',
                width: 36,
                height: 36,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: checked ? 'success.main' : 'warning.main',
                color: '#fff',
              }}
            >
              <GppGoodOutlinedIcon fontSize="small" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant={compact ? 'subtitle2' : 'subtitle1'}
                fontWeight={800}
                sx={{ lineHeight: 1.25, overflowWrap: 'anywhere' }}
              >
                {copy.title}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  lineHeight: 1.35,
                  overflowWrap: 'anywhere',
                }}
              >
                {copy.compliance}
              </Typography>
            </Box>
          </Stack>
          <Chip
            icon={<VerifiedUserOutlinedIcon />}
            label={checked ? copy.confirmed : copy.missing}
            color={checked ? 'success' : 'warning'}
            size="small"
            sx={{
              alignSelf: { xs: 'flex-start', sm: 'center' },
              maxWidth: '100%',
              fontWeight: 800,
              '& .MuiChip-label': {
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
            }}
          />
        </Stack>

        {!compact && <Alert severity="info">{copy.note}</Alert>}

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ overflowWrap: 'anywhere' }}
          >
            {copy.privacyHelp}
          </Typography>
          <Button
            onClick={() => setOpen(true)}
            size="small"
            variant="outlined"
            startIcon={<VisibilityOutlinedIcon fontSize="small" />}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              whiteSpace: 'normal',
              lineHeight: 1.25,
            }}
          >
            {copy.privacyButton}
          </Button>
          <Button
            onClick={() => setDeclarationOpen(true)}
            size="small"
            variant="contained"
            startIcon={<DescriptionOutlinedIcon fontSize="small" />}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              whiteSpace: 'normal',
              lineHeight: 1.25,
            }}
          >
            {copy.declarationButton}
          </Button>
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <FieldComponent
              fullWidth
              size="small"
              label={copy.guardianName}
              name={keys.guardianName}
              value={values?.[keys.guardianName] || ''}
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
              value={values?.[keys.relationship] || ''}
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
              value={values?.[keys.phone] || ''}
              onChange={onChange}
              placeholder="+998"
            />
          </Grid>
        </Grid>

        <FormControlLabel
          sx={{
            m: 0,
            alignItems: 'flex-start',
            '& .MuiFormControlLabel-label': { minWidth: 0 },
          }}
          control={
            <Checkbox
              sx={{ mt: -0.5, ml: -1 }}
              checked={checked}
              onChange={(event) => {
                handleValue(keys.confirmed, event.target.checked);
                handleValue(keys.policyVersion, CONSENT_POLICY_VERSION);
              }}
            />
          }
          label={
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ overflowWrap: 'anywhere' }}
            >
              {copy.checkbox}
            </Typography>
          }
        />
      </Stack>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            width: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 48px)' },
            m: { xs: 1, sm: 3 },
            maxHeight: { xs: 'calc(100dvh - 16px)', sm: 'calc(100dvh - 48px)' },
          },
        }}
      >
        <DialogTitle
          sx={{
            px: { xs: 2, sm: 3 },
            py: { xs: 1.5, sm: 2 },
            fontSize: { xs: '1.05rem', sm: '1.25rem' },
            fontWeight: 900,
            lineHeight: 1.25,
            overflowWrap: 'anywhere',
          }}
        >
          {copy.title}
        </DialogTitle>
        <DialogContent
          dividers
          sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}
        >
          <Stack spacing={2}>
            <Alert severity="info">{copy.note}</Alert>
            <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
              {copy.checkbox}
            </Typography>
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
        <DialogActions
          sx={{
            p: { xs: 1.5, sm: 2 },
            gap: 1,
            alignItems: { xs: 'stretch', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          <FormControl
            size="small"
            sx={{ minWidth: { xs: '100%', sm: 100 }, mr: { sm: 'auto' } }}
          >
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
            sx={{
              width: { xs: '100%', sm: 'auto' },
              whiteSpace: 'normal',
              lineHeight: 1.25,
            }}
          >
            {copy.docxButton}
          </Button>
          <Button
            onClick={() => setOpen(false)}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {copy.close}
          </Button>
        </DialogActions>
      </Dialog>
      <HelsinkiDeclarationDialog
        open={declarationOpen}
        onClose={() => setDeclarationOpen(false)}
        copy={copy}
        lang={lang}
      />
    </Paper>
  );
}

export function ConsentStatus({
  record,
  onDownloadDocx,
  downloading = false,
  lang = 'uz',
}) {
  const copy = getCopy(lang);
  const [declarationOpen, setDeclarationOpen] = useState(false);
  const confirmed = Boolean(
    record?.consent_confirmed ?? record?.consentConfirmed
  );
  const age = Number(record?.age ?? record?.age_years ?? 0);
  const consentRequired = age < 18 || confirmed;
  const guardian =
    record?.consent_guardian_name ||
    record?.consentGuardianName ||
    record?.guardianName ||
    '';
  const relationship =
    record?.consent_guardian_relationship ||
    record?.consentGuardianRelationship ||
    '';
  const confirmedAt =
    record?.consent_confirmed_at || record?.consentConfirmedAt || '';
  const severity = consentRequired
    ? confirmed
      ? 'success'
      : 'warning'
    : 'info';
  const title = consentRequired
    ? confirmed
      ? copy.confirmed
      : copy.missing
    : copy.compliance;

  return (
    <Alert
      severity={severity}
      icon={<VerifiedUserOutlinedIcon />}
      sx={{ mb: 2, borderRadius: 2 }}
    >
      <Typography variant="body2" fontWeight={800}>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {guardian
          ? `${guardian}${relationship ? ` (${relationship})` : ''}`
          : copy.note}
        {confirmedAt ? ` | ${new Date(confirmedAt).toLocaleString()}` : ''}
      </Typography>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        sx={{ mt: 1 }}
      >
        <Button
          size="small"
          variant="contained"
          startIcon={<VisibilityOutlinedIcon fontSize="small" />}
          onClick={() => setDeclarationOpen(true)}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            whiteSpace: 'normal',
            lineHeight: 1.25,
          }}
        >
          {copy.declarationButton}
        </Button>
        {onDownloadDocx && (
          <Button
            size="small"
            variant="outlined"
            startIcon={
              downloading ? (
                <CircularProgress size={16} />
              ) : (
                <DescriptionOutlinedIcon />
              )
            }
            onClick={onDownloadDocx}
            disabled={downloading}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              whiteSpace: 'normal',
              lineHeight: 1.25,
            }}
          >
            {copy.docxButton}
          </Button>
        )}
      </Stack>
      <HelsinkiDeclarationDialog
        open={declarationOpen}
        onClose={() => setDeclarationOpen(false)}
        copy={copy}
        lang={lang}
      />
    </Alert>
  );
}

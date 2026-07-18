const PAGE_LABELS = {
  uz: { scientificAnalysis: 'Ilmiy Tahlil' },
  ru: { scientificAnalysis: 'Научный анализ' },
  en: { scientificAnalysis: 'Scientific Analysis' },
  tr: { scientificAnalysis: 'Bilimsel Analiz' },
  tm: { scientificAnalysis: 'Ylmy analiz' },
  tg: { scientificAnalysis: 'Таҳлили илмӣ' },
  kz: { scientificAnalysis: 'Ғылыми талдау' },
  ky: { scientificAnalysis: 'Илимий талдоо' },
};

const DATE_LABELS_BY_LANG = {
  uz: {
    months: [
      'yanvar',
      'fevral',
      'mart',
      'aprel',
      'may',
      'iyun',
      'iyul',
      'avgust',
      'sentabr',
      'oktabr',
      'noyabr',
      'dekabr',
    ],
    weekdays: [
      'Yakshanba',
      'Dushanba',
      'Seshanba',
      'Chorshanba',
      'Payshanba',
      'Juma',
      'Shanba',
    ],
    format: ({ year, day, month, weekday }) =>
      `${year}-yil ${day}-${month}, ${weekday}`,
  },
  ru: {
    months: [
      'января',
      'февраля',
      'марта',
      'апреля',
      'мая',
      'июня',
      'июля',
      'августа',
      'сентября',
      'октября',
      'ноября',
      'декабря',
    ],
    weekdays: [
      'Воскресенье',
      'Понедельник',
      'Вторник',
      'Среда',
      'Четверг',
      'Пятница',
      'Суббота',
    ],
    format: ({ year, day, month, weekday }) =>
      `${year} г. ${day} ${month}, ${weekday}`,
  },
  en: {
    months: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    weekdays: [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ],
    format: ({ year, day, month, weekday }) =>
      `${year} ${month} ${day}, ${weekday}`,
  },
  kz: {
    months: [
      'қаңтар',
      'ақпан',
      'наурыз',
      'сәуір',
      'мамыр',
      'маусым',
      'шілде',
      'тамыз',
      'қыркүйек',
      'қазан',
      'қараша',
      'желтоқсан',
    ],
    weekdays: [
      'Жексенбі',
      'Дүйсенбі',
      'Сейсенбі',
      'Сәрсенбі',
      'Бейсенбі',
      'Жұма',
      'Сенбі',
    ],
    format: ({ year, day, month, weekday }) =>
      `${year} жыл ${day} ${month}, ${weekday}`,
  },
  ky: {
    months: [
      'январь',
      'февраль',
      'март',
      'апрель',
      'май',
      'июнь',
      'июль',
      'август',
      'сентябрь',
      'октябрь',
      'ноябрь',
      'декабрь',
    ],
    weekdays: [
      'Жекшемби',
      'Дүйшөмбү',
      'Шейшемби',
      'Шаршемби',
      'Бейшемби',
      'Жума',
      'Ишемби',
    ],
    format: ({ year, day, month, weekday }) =>
      `${year}-жыл ${day}-${month}, ${weekday}`,
  },
  tg: {
    months: [
      'январ',
      'феврал',
      'март',
      'апрел',
      'май',
      'июн',
      'июл',
      'август',
      'сентябр',
      'октябр',
      'ноябр',
      'декабр',
    ],
    weekdays: [
      'Якшанбе',
      'Душанбе',
      'Сешанбе',
      'Чоршанбе',
      'Панҷшанбе',
      'Ҷумъа',
      'Шанбе',
    ],
    format: ({ year, day, month, weekday }) =>
      `${year} сол ${day}-${month}, ${weekday}`,
  },
  tm: {
    months: [
      'yanwar',
      'fewral',
      'mart',
      'aprel',
      'may',
      'iyun',
      'iyul',
      'awgust',
      'sentýabr',
      'oktýabr',
      'noýabr',
      'dekabr',
    ],
    weekdays: [
      'Ýekşenbe',
      'Duşenbe',
      'Sişenbe',
      'Çarşenbe',
      'Penşenbe',
      'Anna',
      'Şenbe',
    ],
    format: ({ year, day, month, weekday }) =>
      `${year}-nji ýyl ${day}-${month}, ${weekday}`,
  },
  tr: {
    months: [
      'Ocak',
      'Şubat',
      'Mart',
      'Nisan',
      'Mayıs',
      'Haziran',
      'Temmuz',
      'Ağustos',
      'Eylül',
      'Ekim',
      'Kasım',
      'Aralık',
    ],
    weekdays: [
      'Pazar',
      'Pazartesi',
      'Salı',
      'Çarşamba',
      'Perşembe',
      'Cuma',
      'Cumartesi',
    ],
    format: ({ year, day, month, weekday }) =>
      `${year} yılı ${day} ${month}, ${weekday}`,
  },
};

const formatPanelDate = (date, lang) => {
  const labels = DATE_LABELS_BY_LANG[lang] || DATE_LABELS_BY_LANG.en;
  const parts = {
    year: date.getFullYear(),
    day: date.getDate(),
    month: labels.months[date.getMonth()],
    weekday: labels.weekdays[date.getDay()],
  };

  return labels.format(parts);
};

const HEADER_LABELS = {
  uz: {
    systemStatus: 'Tizim holati',
    active: 'Faol',
    database: 'Ma’lumotlar bazasi',
    optimal: 'Optimal',
    totalAdmins: 'Jami adminlar',
  },
  ru: {
    systemStatus: 'Статус системы',
    active: 'Активен',
    database: 'База данных',
    optimal: 'Оптимально',
    totalAdmins: 'Всего админов',
  },
  en: {
    systemStatus: 'System Status',
    active: 'Active',
    database: 'Database',
    optimal: 'Optimal',
    totalAdmins: 'Total Admins',
  },
  tr: {
    systemStatus: 'Sistem Durumu',
    active: 'Aktif',
    database: 'Veritabanı',
    optimal: 'Optimal',
    totalAdmins: 'Toplam Admin',
  },
  tm: {
    systemStatus: 'Ulgam ýagdaýy',
    active: 'Aktiw',
    database: 'Maglumatlar bazasy',
    optimal: 'Optimal',
    totalAdmins: 'Jemi adminler',
  },
  tg: {
    systemStatus: 'Ҳолати система',
    active: 'Фаъол',
    database: 'Базаи маълумотҳо',
    optimal: 'Оптималӣ',
    totalAdmins: 'Ҳамаи админҳо',
  },
  kz: {
    systemStatus: 'Жүйе күйі',
    active: 'Белсенді',
    database: 'Деректер базасы',
    optimal: 'Оптималды',
    totalAdmins: 'Барлық админдер',
  },
  ky: {
    systemStatus: 'Системанын абалы',
    active: 'Активдүү',
    database: 'Маалыматтар базасы',
    optimal: 'Оптималдуу',
    totalAdmins: 'Жалпы админдер',
  },
};

const RESEARCH_TYPE_OPTIONS = ['PhD', 'DSc', 'Magistrlik', 'Grant loyihasi'];

const ADMIN_REPORT_LABELS = {
  uz: {
    title: 'Admin va izlanuvchilar umumiy reporti',
    subtitle: "XLSX reportni ko'rish uchun tayyor vizual jadval",
    preview: "Reportni ko'rish",
    download: 'XLSX yuklab olish',
    downloading: 'Yuklanmoqda...',
    total: 'Jami',
    admins: 'Adminlar',
    researchers: 'Izlanuvchilar',
    superadmins: 'Superadminlar',
    generatedAt: 'Tayyorlangan vaqt',
    noRows: "Report uchun ma'lumot topilmadi",
    downloaded: 'Report yuklab olindi',
    downloadError: 'Report yuklashda xatolik:',
    columns: {
      index: '#',
      name: 'Ism Familiya',
      email: 'Email',
      role: 'Rol',
      phone: 'Telefon',
      region: 'Hudud',
      district: 'Tuman/Shahar',
      mahalla: 'Mahalla',
      researchTopic: 'Ilmiy ish mavzusi',
      researchType: 'Tadqiqot turi',
      researchArea: 'Tadqiqot hududi',
      supervisor: 'Ilmiy rahbar',
      createdAt: 'Yaratilgan vaqt',
    },
  },
  en: {
    title: 'Admins and researchers report',
    subtitle: 'A visual preview of the XLSX report',
    preview: 'View report',
    download: 'Download XLSX',
    downloading: 'Downloading...',
    total: 'Total',
    admins: 'Admins',
    researchers: 'Researchers',
    superadmins: 'Superadmins',
    generatedAt: 'Generated at',
    noRows: 'No rows found for this report',
    downloaded: 'Report downloaded',
    downloadError: 'Report download error:',
    columns: {
      index: '#',
      name: 'Full name',
      email: 'Email',
      role: 'Role',
      phone: 'Phone',
      region: 'Region',
      district: 'District/City',
      mahalla: 'Mahalla',
      researchTopic: 'Research topic',
      researchType: 'Research type',
      researchArea: 'Research area',
      supervisor: 'Scientific supervisor',
      createdAt: 'Created at',
    },
  },
  ru: {
    title: 'Общий отчет админов и исследователей',
    subtitle: 'Визуальный предпросмотр XLSX отчета',
    preview: 'Посмотреть отчет',
    download: 'Скачать XLSX',
    downloading: 'Загрузка...',
    total: 'Всего',
    admins: 'Админы',
    researchers: 'Исследователи',
    superadmins: 'Суперадмины',
    generatedAt: 'Сформировано',
    noRows: 'Данные для отчета не найдены',
    downloaded: 'Отчет скачан',
    downloadError: 'Ошибка загрузки отчета:',
    columns: {
      index: '#',
      name: 'ФИО',
      email: 'Email',
      role: 'Роль',
      phone: 'Телефон',
      region: 'Регион',
      district: 'Район/город',
      mahalla: 'Махалля',
      researchTopic: 'Тема исследования',
      researchType: 'Тип исследования',
      researchArea: 'Регион исследования',
      supervisor: 'Научный руководитель',
      createdAt: 'Создано',
    },
  },
  ky: {
    title: 'Админдер жана изилдөөчүлөр боюнча жалпы отчет',
    subtitle: 'XLSX отчетунун визуалдык алдын ала көрүнүшү',
    preview: 'Отчетту көрүү',
    download: 'XLSX жүктөп алуу',
    downloading: 'Жүктөлүүдө...',
    total: 'Жалпы',
    admins: 'Админдер',
    researchers: 'Изилдөөчүлөр',
    superadmins: 'Суперадминдер',
    generatedAt: 'Түзүлгөн убакыт',
    noRows: 'Отчет үчүн маалымат табылган жок',
    downloaded: 'Отчет жүктөлдү',
    downloadError: 'Отчетту жүктөөдө ката:',
    columns: {
      index: '#',
      name: 'Аты-жөнү',
      email: 'Email',
      role: 'Ролу',
      phone: 'Телефон',
      region: 'Аймак',
      district: 'Район/шаар',
      mahalla: 'Махалла',
      researchTopic: 'Илимий иштин темасы',
      researchType: 'Изилдөөнүн түрү',
      researchArea: 'Изилдөө аймагы',
      supervisor: 'Илимий жетекчи',
      createdAt: 'Түзүлгөн убакыт',
    },
  },
};

const ADMIN_REPORT_COLUMN_KEYS = [
  'index',
  'name',
  'email',
  'role',
  'phone',
  'region',
  'district',
  'mahalla',
  'researchTopic',
  'researchType',
  'researchArea',
  'supervisor',
  'createdAt',
];

const AUDIT_ACTION_LABELS = {
  uz: {
    create: 'Yaratish',
    created: 'Yaratildi',
    update: 'Tahrirlash',
    updated: 'Tahrirlandi',
    delete: 'O‘chirish',
    deleted: 'O‘chirildi',
    restore: 'Tiklash',
    restored: 'Tiklandi',
    login: 'Kirish',
    logout: 'Chiqish',
    backup: 'Zaxira nusxasi',
    clear: 'Tozalash',
    hard_delete: 'Butunlay o‘chirish',
    soft_delete: 'Chivintiqqa tashlash',
    delete_hard: 'Butunlay o‘chirish',
    delete_soft: 'Chivintiqqa tashlash',
    download: 'Yuklab olish',
    downloaded: 'Yuklab olindi',
    export: 'Eksport',
    exported: 'Eksport qilindi',
  },
  en: {
    create: 'Create',
    created: 'Created',
    update: 'Update',
    updated: 'Updated',
    delete: 'Delete',
    deleted: 'Deleted',
    restore: 'Restore',
    restored: 'Restored',
    login: 'Login',
    logout: 'Logout',
    backup: 'Backup',
    clear: 'Clear',
    hard_delete: 'Permanent delete',
    soft_delete: 'Move to trash',
    delete_hard: 'Permanent delete',
    delete_soft: 'Move to trash',
    download: 'Download',
    downloaded: 'Downloaded',
    export: 'Export',
    exported: 'Exported',
  },
  tr: {
    create: 'Olustur',
    created: 'Olusturuldu',
    update: 'Guncelle',
    updated: 'Guncellendi',
    delete: 'Sil',
    deleted: 'Silindi',
    restore: 'Geri yukle',
    restored: 'Geri yuklendi',
    login: 'Giris',
    logout: 'Cikis',
    backup: 'Yedek',
    clear: 'Temizle',
    hard_delete: 'Kalici silme',
    soft_delete: 'Cope tasima',
    delete_hard: 'Kalici silme',
    delete_soft: 'Cope tasima',
    download: 'Indirme',
    downloaded: 'Indirildi',
    export: 'Disa aktar',
    exported: 'Disa aktarildi',
  },
  ru: {
    create: 'Создание',
    created: 'Создано',
    update: 'Обновление',
    updated: 'Обновлено',
    delete: 'Удаление',
    deleted: 'Удалено',
    restore: 'Восстановление',
    restored: 'Восстановлено',
    login: 'Вход',
    logout: 'Выход',
    backup: 'Резервная копия',
    clear: 'Очистка',
    hard_delete: 'Полное удаление',
    soft_delete: 'Перемещение в корзину',
    delete_hard: 'Полное удаление',
    delete_soft: 'Перемещение в корзину',
    download: 'Скачивание',
    downloaded: 'Скачано',
    export: 'Экспорт',
    exported: 'Экспортировано',
  },
  kz: {
    create: 'Құру',
    created: 'Құрылды',
    update: 'Жаңарту',
    updated: 'Жаңартылды',
    delete: 'Жою',
    deleted: 'Жойылды',
    restore: 'Қалпына келтіру',
    restored: 'Қалпына келтірілді',
    login: 'Кіру',
    logout: 'Шығу',
    backup: 'Сақтық көшірме',
    clear: 'Тазалау',
    hard_delete: 'Толық жою',
    soft_delete: 'Себетке жіберу',
    delete_hard: 'Толық жою',
    delete_soft: 'Себетке жіберу',
    download: 'Жүктеп алу',
    downloaded: 'Жүктелді',
    export: 'Экспорт',
    exported: 'Экспортталды',
  },
  ky: {
    create: 'Түзүү',
    created: 'Түзүлдү',
    update: 'Жаңыртуу',
    updated: 'Жаңыртылды',
    delete: 'Өчүрүү',
    deleted: 'Өчүрүлдү',
    restore: 'Калыбына келтирүү',
    restored: 'Калыбына келтирилди',
    login: 'Кирүү',
    logout: 'Чыгуу',
    backup: 'Камдык көчүрмө',
    clear: 'Тазалоо',
    hard_delete: 'Толук өчүрүү',
    soft_delete: 'Себетке жөнөтүү',
    delete_hard: 'Толук өчүрүү',
    delete_soft: 'Себетке жөнөтүү',
    download: 'Жүктөө',
    downloaded: 'Жүктөлдү',
    export: 'Экспорт',
    exported: 'Экспорттолду',
  },
};

const CONFIRM_MESSAGES = {
  uz: {
    adminDeleteConfirm: "Haqiqatan ham bu adminni o'chirmoqchimisiz?",
    hardDeleteDataConfirm:
      "Ushbu ma'lumotni butunlay o'chirib tashlamoqchimisiz? Uni qayta tiklab bo'lmaydi!",
    backupRestoreConfirm:
      "Haqiqatan ham '{filename}' zaxira nusxasini tiklamoqchimisiz? Joriy ma'lumotlar almashtirilishi mumkin.",
    deleteBackupConfirm:
      "Haqiqatan ham '{filename}' zaxira faylini o'chirmoqchimisiz?",
    clearAuditConfirm: 'Barcha jurnallarni tozalamoqchimisiz?',
  },
  ru: {
    adminDeleteConfirm: 'Вы действительно хотите удалить этого админа?',
    hardDeleteDataConfirm:
      'Вы действительно хотите безвозвратно удалить эти данные? Это действие нельзя отменить!',
    backupRestoreConfirm:
      "Вы действительно хотите восстановить резервную копию '{filename}'? Текущие данные могут быть перезаписаны.",
    deleteBackupConfirm:
      "Вы действительно хотите удалить файл резервной копии '{filename}'?",
    clearAuditConfirm: 'Очистить все записи журнала?',
  },
  en: {
    adminDeleteConfirm: 'Do you really want to delete this admin?',
    hardDeleteDataConfirm:
      'Do you really want to permanently delete this data? This action cannot be undone!',
    backupRestoreConfirm:
      "Do you really want to restore the backup '{filename}'? Current data might be overwritten.",
    deleteBackupConfirm:
      "Do you really want to delete the backup file '{filename}'?",
    clearAuditConfirm: 'Clear all audit log entries?',
  },
  tr: {
    adminDeleteConfirm: 'Bu yöneticiyi gerçekten silmek istiyor musunuz?',
    hardDeleteDataConfirm:
      'Bu verileri kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!',
    backupRestoreConfirm:
      "'{filename}' yedeklemesini gerçekten geri yüklemek istiyor musunuz? Mevcut verilerin üzerine yazılabilir.",
    deleteBackupConfirm:
      "'{filename}' yedekleme dosyasını gerçekten silmek istiyor musunuz?",
    clearAuditConfirm: 'Tüm günlük kayıtlarını temizlemek istiyor musunuz?',
  },
  tm: {
    adminDeleteConfirm: 'Bu admini pozmak isleýärsinizmi?',
    hardDeleteDataConfirm:
      'Bu maglumaty hemişelik pozmak isleýärsinizmi? Bu hereketi yza alyp bolmaz!',
    backupRestoreConfirm:
      "'{filename}' ätiýaçlyk nusgasyny dikeltmek isleýärsinizmi? Häzirki maglumatlar täzelenip biler.",
    deleteBackupConfirm:
      "'{filename}' ätiýaçlyk faýlyny pozmak isleýärsinizmi?",
    clearAuditConfirm: 'Ähli žurnal ýazgylaryny arassalamak isleýärsinizmi?',
  },
  tg: {
    adminDeleteConfirm: 'Оё шумо дар ҳақиқат мехоҳед ин админро нест кунед?',
    hardDeleteDataConfirm:
      'Оё шумо дар ҳақиқат мехоҳед ин маълумотро ба таври ҳамешагӣ нест кунед? Ин амалро бекор карда намешавад!',
    backupRestoreConfirm:
      "Оё шумо дар ҳақиқат мехоҳед нусхаи эҳтиётии '{filename}'-ро барқарор кунед? Маалумоти ҷорӣ метавонад иваз карда шавад.",
    deleteBackupConfirm:
      "Оё шумо дар ҳақиқат мехоҳед файли нусхаи эҳтиётии '{filename}'-ро нест кунед?",
    clearAuditConfirm: 'Оё шумо мехоҳед ҳамаи журналҳоро тоза кунед?',
  },
  kz: {
    adminDeleteConfirm: 'Бұл админді шынымен жойғыңыз келе ме?',
    hardDeleteDataConfirm:
      'Бұл мәліметтерді біржола жойғыңыз келе ме? Бұл әрекетті қайтару мүмкін емес!',
    backupRestoreConfirm:
      "'{filename}' сақтық көшірмесін шынымен қалпына келтіргіңіз келе ме? Ағымдағы мәліметтер ауыстырылуы мүмкін.",
    deleteBackupConfirm:
      "'{filename}' сақтық көшірме файлын шынымен жойғыңыз келе ме?",
    clearAuditConfirm: 'Барлық журнал жазбаларын тазалайсыз ба?',
  },
  ky: {
    adminDeleteConfirm: 'Бул админди чын эле өчүрөсүзбү?',
    hardDeleteDataConfirm:
      'Бул маалыматты биротоло өчүрүүнү каалайсызбы? Бул аракетти жокко чыгаруу мүмкүн эмес!',
    backupRestoreConfirm:
      "'{filename}' камдык көчүрмөсүн чын эле калыбына келтиргиңиз келеби? Учурдагы маалыматтар алмаштырылышы мүмкүн.",
    deleteBackupConfirm:
      "'{filename}' камдык көчүрмө файлын чын эле өчүрөсүзбү?",
    clearAuditConfirm: 'Аудит журналын тазалоону ырастайсызбы?',
  },
};

const AUDIT_TARGET_LABELS_RU = {
  Analysis: 'Анализ',
  PatientAnalysis: 'Анализ пациента',
  User: 'Пользователь',
  AuditLog: 'Журнал аудита',
  Backup: 'Резервная копия',
  PDF: 'PDF-отчет',
  DOCX: 'DOCX-документ',
  ResearchRecord: 'Запись исследования',
};

const AUDIT_TARGET_LABELS_EN = {
  Analysis: 'Analysis',
  PatientAnalysis: 'Patient analysis',
  User: 'User',
  AuditLog: 'Audit log',
  Backup: 'Backup',
  PDF: 'PDF report',
  DOCX: 'DOCX document',
  ResearchRecord: 'Research record',
};

const AUDIT_TARGET_LABELS_TR = {
  Analysis: 'Analiz',
  PatientAnalysis: 'Hasta analizi',
  User: 'Kullanici',
  AuditLog: 'Denetim gunlugu',
  Backup: 'Yedek',
  PDF: 'PDF raporu',
  DOCX: 'DOCX belgesi',
  ResearchRecord: 'Araştırma kaydı',
};

const AUDIT_TARGET_LABELS_KZ = {
  Analysis: 'Талдау',
  PatientAnalysis: 'Пациент талдауы',
  User: 'Пайдаланушы',
  AuditLog: 'Аудит журналы',
  Backup: 'Сақтық көшірме',
  PDF: 'PDF есеп',
  DOCX: 'DOCX құжат',
  ResearchRecord: 'Зерттеу жазбасы',
};

const AUDIT_TARGET_LABELS_KY = {
  Analysis: 'Талдоо',
  PatientAnalysis: 'Бейтап талдоосу',
  User: 'Колдонуучу',
  AuditLog: 'Аудит журналы',
  Backup: 'Камдык көчүрмө',
  PDF: 'PDF отчет',
  DOCX: 'DOCX документ',
  ResearchRecord: 'Изилдөө жазуусу',
};
const AUDIT_JSON_KEY_LABELS_RU = {
  action: 'Действие',
  target_type: 'Тип объекта',
  target_id: 'ID объекта',
  details: 'Описание',
  user_id: 'ID пользователя',
  user_name: 'Пользователь',
  user_email: 'Email пользователя',
  name: 'Имя',
  role: 'Роль',
  email: 'Email',
  old: 'Было',
  new: 'Стало',
  changes: 'Изменения',
  ids: 'ID',
  count: 'Количество',
};

const AUDIT_JSON_KEY_LABELS_EN = {
  action: 'Action',
  target_type: 'Record type',
  target_id: 'Record ID',
  details: 'Details',
  user_id: 'User ID',
  user_name: 'User',
  user_email: 'User email',
  name: 'Name',
  role: 'Role',
  email: 'Email',
  old: 'Old',
  new: 'New',
  changes: 'Changes',
  ids: 'ID',
  count: 'Count',
};

const AUDIT_JSON_KEY_LABELS_TR = {
  action: 'Islem',
  target_type: 'Nesne turu',
  target_id: 'Nesne ID',
  details: 'Ayrintilar',
  user_id: 'Kullanici ID',
  user_name: 'Kullanici',
  user_email: 'Kullanici email',
  name: 'Ad',
  role: 'Rol',
  email: 'Email',
  old: 'Eski',
  new: 'Yeni',
  changes: 'Degisiklikler',
  ids: 'ID',
  count: 'Sayi',
};

const AUDIT_JSON_KEY_LABELS_KZ = {
  action: 'Әрекет',
  target_type: 'Объект түрі',
  target_id: 'Объект ID',
  details: 'Сипаттама',
  user_id: 'Пайдаланушы ID',
  user_name: 'Пайдаланушы',
  user_email: 'Пайдаланушы email',
  name: 'Аты',
  role: 'Рөл',
  email: 'Email',
  old: 'Бұрын',
  new: 'Кейін',
  changes: 'Өзгерістер',
  ids: 'ID',
  count: 'Саны',
};

const AUDIT_JSON_KEY_LABELS_KY = {
  action: 'Аракет',
  target_type: 'Объект түрү',
  target_id: 'Объект ID',
  details: 'Тавсиф',
  user_id: 'Колдонуучу ID',
  user_name: 'Колдонуучу',
  user_email: 'Колдонуучу email',
  name: 'Аты',
  role: 'Роль',
  email: 'Email',
  old: 'Мурун',
  new: 'Кийин',
  changes: 'Өзгөрүүлөр',
  ids: 'ID',
  count: 'Саны',
};
const AUDIT_DETAIL_PATTERNS_RU = [
  [
    /^Yangi tahlil (yaratildi|created|создано):\s*(.*)$/i,
    'Новый анализ создан: $2',
  ],
  [/^Yangi foydalanuvchi yaratildi:\s*(.*)$/i, 'Новый пользователь создан: $1'],
  [
    /^Foydalanuvchi ma'?lumotlari yangilandi:\s*(.*)$/i,
    'Данные пользователя обновлены: $1',
  ],
  [/^Foydalanuvchi o'?chirildi:\s*(.*)$/i, 'Пользователь удален: $1'],
  [/^Foydalanuvchi tiklandi:\s*(.*)$/i, 'Пользователь восстановлен: $1'],
  [
    /^Foydalanuvchi tizimga kirdi:\s*(.*)$/i,
    'Пользователь вошел в систему: $1',
  ],
  [
    /^(\d+)\s*ta tahlil savatga yuborildi:\s*(.*)$/i,
    '$1 анализ(ов) перемещено в корзину: $2',
  ],
  [
    /^(\d+)\s*ta tahlil butunlay o'?chirildi \(IDlar:\s*(.*)\)$/i,
    '$1 анализ(ов) удалено навсегда (ID: $2)',
  ],
  [
    /^(\d+)\s*ta tahlil savatdan tiklandi \(IDlar:\s*(.*)\)$/i,
    '$1 анализ(ов) восстановлено из корзины (ID: $2)',
  ],
  [
    /^Tahlil yangilandi:\s*(.*?)\.\s*O'?zgarishlar:\s*(.*)$/i,
    'Анализ обновлен: $1. Изменения: $2',
  ],
  [
    /^Audit jurnali tozalandi:\s*Barchasi\s*\((\d+)\s*ta yozuv\)$/i,
    'Журнал аудита очищен: все ($1 записей)',
  ],
  [
    /^Audit jurnali tozalandi:\s*(.*?)\s*\((\d+)\s*ta yozuv\)$/i,
    'Журнал аудита очищен: $1 ($2 записей)',
  ],
  [/^Zaxira nusxasi yaratildi:\s*(.*)$/i, 'Резервная копия создана: $1'],
  [
    /^Zaxira to'?liq tiklandi \(Almashtirish\):\s*(.*)$/i,
    'Резервная копия полностью восстановлена (замена): $1',
  ],
  [/^Zaxira nusxasi o'?chirildi:\s*(.*)$/i, 'Резервная копия удалена: $1'],
  [
    /^Bemor hisoboti \(PDF\) yuklab olindi:\s*(.*)$/i,
    'Отчет пациента (PDF) скачан: $1',
  ],
  [
    /^Bemor anketasi \(DOCX\) yuklab olindi:\s*(.*)$/i,
    'Анкета пациента (DOCX) скачана: $1',
  ],
  [
    /^(.+?) roli uchun Chat holati o'?zgartirildi:\s*AI=(True|False),\s*Ichki=(True|False)$/i,
    'Статус чата для роли $1 изменен: ИИ=$2, Внутренний=$3',
  ],
];

const AUDIT_DETAIL_REPLACEMENTS_RU = [
  [/\bYangi\b/gi, 'Новый'],
  [/\bfoydalanuvchi\b/gi, 'пользователь'],
  [/\bFoydalanuvchi\b/g, 'Пользователь'],
  [/\bma'?lumotlari\b/gi, 'данные'],
  [/\bMa'?lumotlar\b/g, 'Данные'],
  [/\bMa'?lumot\b/g, 'Данные'],
  [/\bma'?lumotlar\b/gi, 'данные'],
  [/\bma'?lumot\b/gi, 'данные'],
  [/\btahlil\b/gi, 'анализ'],
  [/\bTahlil\b/g, 'Анализ'],
  [/\bBemor hisoboti\b/g, 'Отчет пациента'],
  [/\bbemor hisoboti\b/gi, 'отчет пациента'],
  [/\bBemor anketasi\b/g, 'Анкета пациента'],
  [/\bbemor anketasi\b/gi, 'анкета пациента'],
  [/\bBemor\b/g, 'Пациент'],
  [/\bbemor\b/gi, 'пациент'],
  [/\bAdmin\b/g, 'Админ'],
  [/\badmin\b/gi, 'админ'],
  [/\bIzlanuvchi\b/g, 'Исследователь'],
  [/\bizlanuvchi\b/gi, 'исследователь'],
  [/\bResearcher\b/g, 'Исследователь'],
  [/\bresearcher\b/gi, 'исследователь'],
  [/\bAnalysis\b/g, 'Анализ'],
  [/\banalysis\b/gi, 'анализ'],
  [/\bUser\b/g, 'Пользователь'],
  [/\buser\b/gi, 'пользователь'],
  [/\byaratildi\b/gi, 'создано'],
  [/\byangilandi\b/gi, 'обновлено'],
  [/\btiklandi\b/gi, 'восстановлено'],
  [/\bo'?chirildi\b/gi, 'удалено'],
  [/\bcreated\b/gi, 'создано'],
  [/\bupdated\b/gi, 'обновлено'],
  [/\bdeleted\b/gi, 'удалено'],
  [/\brestored\b/gi, 'восстановлено'],
  [/\byuklab olindi\b/gi, 'скачано'],
  [/\byuklandi\b/gi, 'загружено'],
  [/\bolindi\b/gi, 'получено'],
  [/\bsavatga yuborildi\b/gi, 'перемещено в корзину'],
  [/\bsavatdan\b/gi, 'из корзины'],
  [/\bbutunlay\b/gi, 'навсегда'],
  [/\bIDlar\b/g, 'ID'],
  [/\bBarchasi\b/g, 'Все'],
  [/\bta yozuv\b/gi, 'записей'],
  [/\bta\b/g, 'шт'],
  [/\bZaxira nusxasi\b/g, 'Резервная копия'],
  [/\bzaxira nusxasi\b/gi, 'резервная копия'],
  [/\bZaxira\b/g, 'Резервная копия'],
  [/\bzaxira\b/gi, 'резервная копия'],
  [/\bfayl\b/gi, 'файл'],
  [/\bO'?zgarishlar\b/gi, 'Изменения'],
  [/\bAlmashtirish\b/gi, 'замена'],
  [/\btizimga kirdi\b/gi, 'вошел в систему'],
];

const AUDIT_DETAIL_CLEANUPS_RU = [
  [/Новый анализ создано/gi, 'Новый анализ создан'],
  [/Новый Анализ создано/gi, 'Новый анализ создан'],
  [/Анкета пациента \(DOCX\) скачано/gi, 'Анкета пациента (DOCX) скачана'],
  [/Анкета пациента скачано/gi, 'Анкета пациента скачана'],
  [/Отчет пациента \(PDF\) скачано/gi, 'Отчет пациента (PDF) скачан'],
  [/DOCX-отчет скачано/gi, 'DOCX-отчет скачан'],
  [/\s+:/g, ':'],
];

const AUDIT_DETAIL_PATTERNS_EN = [
  [
    /^Yangi tahlil (yaratildi|created|создано):\s*(.*)$/i,
    'New analysis created: $2',
  ],
  [/^Yangi foydalanuvchi yaratildi:\s*(.*)$/i, 'New user created: $1'],
  [
    /^Foydalanuvchi ma'?lumotlari yangilandi:\s*(.*)$/i,
    'User data updated: $1',
  ],
  [/^Foydalanuvchi o'?chirildi:\s*(.*)$/i, 'User deleted: $1'],
  [/^Foydalanuvchi tiklandi:\s*(.*)$/i, 'User restored: $1'],
  [/^Foydalanuvchi tizimga kirdi:\s*(.*)$/i, 'User logged in: $1'],
  [
    /^(\d+)\s*ta tahlil savatga yuborildi:\s*(.*)$/i,
    '$1 analyses moved to trash: $2',
  ],
  [
    /^(\d+)\s*ta tahlil butunlay o'?chirildi \(IDlar:\s*(.*)\)$/i,
    '$1 analyses permanently deleted (ID: $2)',
  ],
  [
    /^(\d+)\s*ta tahlil savatdan tiklandi \(IDlar:\s*(.*)\)$/i,
    '$1 analyses restored from trash (ID: $2)',
  ],
  [
    /^Tahlil yangilandi:\s*(.*?)\.\s*O'?zgarishlar:\s*(.*)$/i,
    'Analysis updated: $1. Changes: $2',
  ],
  [
    /^Audit jurnali tozalandi:\s*Barchasi\s*\((\d+)\s*ta yozuv\)$/i,
    'Audit log cleared: all ($1 records)',
  ],
  [
    /^Audit jurnali tozalandi:\s*(.*?)\s*\((\d+)\s*ta yozuv\)$/i,
    'Audit log cleared: $1 ($2 records)',
  ],
  [/^Zaxira nusxasi yaratildi:\s*(.*)$/i, 'Backup created: $1'],
  [
    /^Zaxira to'?liq tiklandi \(Almashtirish\):\s*(.*)$/i,
    'Backup fully restored (replace): $1',
  ],
  [/^Zaxira nusxasi o'?chirildi:\s*(.*)$/i, 'Backup deleted: $1'],
  [
    /^Bemor hisoboti \(PDF\) yuklab olindi:\s*(.*)$/i,
    'Patient report (PDF) downloaded: $1',
  ],
  [
    /^Bemor anketasi \(DOCX\) yuklab olindi:\s*(.*)$/i,
    'Patient questionnaire (DOCX) downloaded: $1',
  ],
  [
    /^(.+?) roli uchun Chat holati o'?zgartirildi:\s*AI=(True|False),\s*Ichki=(True|False)$/i,
    'Chat status for $1 role changed: AI=$2, Internal=$3',
  ],
];

const AUDIT_DETAIL_REPLACEMENTS_EN = [
  [/\bYangi\b/gi, 'New'],
  [/\bfoydalanuvchi\b/gi, 'user'],
  [/\bFoydalanuvchi\b/g, 'User'],
  [/\bma'?lumotlari\b/gi, 'data'],
  [/\bMa'?lumotlar\b/g, 'Data'],
  [/\bMa'?lumot\b/g, 'Data'],
  [/\bma'?lumotlar\b/gi, 'data'],
  [/\bma'?lumot\b/gi, 'data'],
  [/\btahlil\b/gi, 'analysis'],
  [/\bTahlil\b/g, 'Analysis'],
  [/\bBemor hisoboti\b/g, 'Patient report'],
  [/\bbemor hisoboti\b/gi, 'patient report'],
  [/\bBemor anketasi\b/g, 'Patient form'],
  [/\bbemor anketasi\b/gi, 'patient form'],
  [/\bBemor\b/g, 'Patient'],
  [/\bbemor\b/gi, 'patient'],
  [/\bAdmin\b/g, 'Admin'],
  [/\badmin\b/gi, 'admin'],
  [/\bIzlanuvchi\b/g, 'Researcher'],
  [/\bizlanuvchi\b/gi, 'researcher'],
  [/\bResearcher\b/g, 'Researcher'],
  [/\bresearcher\b/gi, 'researcher'],
  [/\bAnalysis\b/g, 'Analysis'],
  [/\banalysis\b/gi, 'analysis'],
  [/\bUser\b/g, 'User'],
  [/\buser\b/gi, 'user'],
  [/\byaratildi\b/gi, 'created'],
  [/\byangilandi\b/gi, 'updated'],
  [/\btiklandi\b/gi, 'restored'],
  [/\bo'?chirildi\b/gi, 'deleted'],
  [/\bcreated\b/gi, 'created'],
  [/\bupdated\b/gi, 'updated'],
  [/\bdeleted\b/gi, 'deleted'],
  [/\brestored\b/gi, 'restored'],
  [/\byuklab olindi\b/gi, 'downloaded'],
  [/\byuklandi\b/gi, 'uploaded'],
  [/\bolindi\b/gi, 'received'],
  [/\bsavatga yuborildi\b/gi, 'moved to trash'],
  [/\bsavatdan\b/gi, 'from trash'],
  [/\bbutunlay\b/gi, 'permanently'],
  [/\bIDlar\b/g, 'ID'],
  [/\bBarchasi\b/g, 'All'],
  [/\bta yozuv\b/gi, 'records'],
  [/\bta\b/g, 'items'],
  [/\bZaxira nusxasi\b/g, 'Backup'],
  [/\bzaxira nusxasi\b/gi, 'backup'],
  [/\bZaxira\b/g, 'Backup'],
  [/\bzaxira\b/gi, 'backup'],
  [/\bfayl\b/gi, 'file'],
  [/\bO'?zgarishlar\b/gi, 'Changes'],
  [/\bAlmashtirish\b/gi, 'replace'],
  [/\btizimga kirdi\b/gi, 'logged in'],
];

const AUDIT_DETAIL_CLEANUPS_EN = [
  [/New analysis created/gi, 'New analysis created'],
  [/Patient form \(DOCX\) downloaded/gi, 'Patient form (DOCX) downloaded'],
  [/Patient report \(PDF\) downloaded/gi, 'Patient report (PDF) downloaded'],
  [/\s+:/g, ':'],
];

const AUDIT_DETAIL_PATTERNS_TR = [
  [
    /^Yangi tahlil (yaratildi|created|создано):\s*(.*)$/i,
    'Yeni analiz olusturuldu: $2',
  ],
  [
    /^Yangi foydalanuvchi yaratildi:\s*(.*)$/i,
    'Yeni kullanici olusturuldu: $1',
  ],
  [
    /^Foydalanuvchi ma'?lumotlari yangilandi:\s*(.*)$/i,
    'Kullanici verileri guncellendi: $1',
  ],
  [/^Foydalanuvchi o'?chirildi:\s*(.*)$/i, 'Kullanici silindi: $1'],
  [/^Foydalanuvchi tiklandi:\s*(.*)$/i, 'Kullanici geri yuklendi: $1'],
  [/^Foydalanuvchi tizimga kirdi:\s*(.*)$/i, 'Kullanici sisteme girdi: $1'],
  [
    /^(\d+)\s*ta tahlil savatga yuborildi:\s*(.*)$/i,
    '$1 analiz cope tasindi: $2',
  ],
  [
    /^(\d+)\s*ta tahlil butunlay o'?chirildi \(IDlar:\s*(.*)\)$/i,
    '$1 analiz kalici silindi (ID: $2)',
  ],
  [
    /^(\d+)\s*ta tahlil savatdan tiklandi \(IDlar:\s*(.*)\)$/i,
    '$1 analiz copten geri yuklendi (ID: $2)',
  ],
  [
    /^Tahlil yangilandi:\s*(.*?)\.\s*O'?zgarishlar:\s*(.*)$/i,
    'Analiz guncellendi: $1. Degisiklikler: $2',
  ],
  [
    /^Audit jurnali tozalandi:\s*Barchasi\s*\((\d+)\s*ta yozuv\)$/i,
    'Denetim gunlugu temizlendi: tumu ($1 kayit)',
  ],
  [
    /^Audit jurnali tozalandi:\s*(.*?)\s*\((\d+)\s*ta yozuv\)$/i,
    'Denetim gunlugu temizlendi: $1 ($2 kayit)',
  ],
  [/^Zaxira nusxasi yaratildi:\s*(.*)$/i, 'Yedek olusturuldu: $1'],
  [
    /^Zaxira to'?liq tiklandi \(Almashtirish\):\s*(.*)$/i,
    'Yedek tamamen geri yuklendi (degistir): $1',
  ],
  [/^Zaxira nusxasi o'?chirildi:\s*(.*)$/i, 'Yedek silindi: $1'],
  [
    /^Bemor hisoboti \(PDF\) yuklab olindi:\s*(.*)$/i,
    'Hasta raporu (PDF) indirildi: $1',
  ],
  [
    /^Bemor anketasi \(DOCX\) yuklab olindi:\s*(.*)$/i,
    'Hasta anketi (DOCX) indirildi: $1',
  ],
  [
    /^(.+?) roli uchun Chat holati o'?zgartirildi:\s*AI=(True|False),\s*Ichki=(True|False)$/i,
    '$1 rolü için Sohbet durumu değiştirildi: AI=$2, Dahili=$3',
  ],
];

const AUDIT_DETAIL_REPLACEMENTS_TR = [
  [/\bYangi\b/gi, 'Yeni'],
  [/\bfoydalanuvchi\b/gi, 'kullanici'],
  [/\bFoydalanuvchi\b/g, 'Kullanici'],
  [/\bma'?lumotlari\b/gi, 'verileri'],
  [/\bMa'?lumotlar\b/g, 'Veriler'],
  [/\bMa'?lumot\b/g, 'Veri'],
  [/\bma'?lumotlar\b/gi, 'veriler'],
  [/\bma'?lumot\b/gi, 'veri'],
  [/\btahlil\b/gi, 'analiz'],
  [/\bTahlil\b/g, 'Analiz'],
  [/\bBemor hisoboti\b/g, 'Hasta raporu'],
  [/\bbemor hisoboti\b/gi, 'hasta raporu'],
  [/\bBemor anketasi\b/g, 'Hasta formu'],
  [/\bbemor anketasi\b/gi, 'hasta formu'],
  [/\bBemor\b/g, 'Hasta'],
  [/\bbemor\b/gi, 'hasta'],
  [/\bAdmin\b/g, 'Admin'],
  [/\badmin\b/gi, 'admin'],
  [/\bIzlanuvchi\b/g, 'Arastirmaci'],
  [/\bizlanuvchi\b/gi, 'arastirmaci'],
  [/\bResearcher\b/g, 'Arastirmaci'],
  [/\bresearcher\b/gi, 'arastirmaci'],
  [/\bAnalysis\b/g, 'Analiz'],
  [/\banalysis\b/gi, 'analiz'],
  [/\bUser\b/g, 'Kullanici'],
  [/\buser\b/gi, 'kullanici'],
  [/\byaratildi\b/gi, 'olusturuldu'],
  [/\byangilandi\b/gi, 'guncellendi'],
  [/\btiklandi\b/gi, 'geri yuklendi'],
  [/\bo'?chirildi\b/gi, 'silindi'],
  [/\bcreated\b/gi, 'olusturuldu'],
  [/\bupdated\b/gi, 'guncellendi'],
  [/\bdeleted\b/gi, 'silindi'],
  [/\brestored\b/gi, 'geri yuklendi'],
  [/\byuklab olindi\b/gi, 'indirildi'],
  [/\byuklandi\b/gi, 'yuklendi'],
  [/\bolindi\b/gi, 'alindi'],
  [/\bsavatga yuborildi\b/gi, 'cope tasindi'],
  [/\bsavatdan\b/gi, 'copten'],
  [/\bbutunlay\b/gi, 'kalici olarak'],
  [/\bIDlar\b/g, 'ID'],
  [/\bBarchasi\b/g, 'Tumu'],
  [/\bta yozuv\b/gi, 'kayit'],
  [/\bta\b/g, 'adet'],
  [/\bZaxira nusxasi\b/g, 'Yedek'],
  [/\bzaxira nusxasi\b/gi, 'yedek'],
  [/\bZaxira\b/g, 'Yedek'],
  [/\bzaxira\b/gi, 'yedek'],
  [/\bfayl\b/gi, 'dosya'],
  [/\bO'?zgarishlar\b/gi, 'Degisiklikler'],
  [/\bAlmashtirish\b/gi, 'degistir'],
  [/\btizimga kirdi\b/gi, 'sisteme girdi'],
];

const AUDIT_DETAIL_CLEANUPS_TR = [
  [/Yeni analiz olusturuldu/gi, 'Yeni analiz olusturuldu'],
  [/Hasta formu \(DOCX\) indirildi/gi, 'Hasta formu (DOCX) indirildi'],
  [/Hasta raporu \(PDF\) indirildi/gi, 'Hasta raporu (PDF) indirildi'],
  [/\s+:/g, ':'],
];

const AUDIT_DETAIL_PATTERNS_KZ = [
  [
    /^Yangi tahlil (yaratildi|created|создано):\s*(.*)$/i,
    'Жаңа талдау құрылды: $2',
  ],
  [/^Yangi foydalanuvchi yaratildi:\s*(.*)$/i, 'Жаңа пайдаланушы құрылды: $1'],
  [
    /^Foydalanuvchi ma'?lumotlari yangilandi:\s*(.*)$/i,
    'Пайдаланушы деректері жаңартылды: $1',
  ],
  [/^Foydalanuvchi o'?chirildi:\s*(.*)$/i, 'Пайдаланушы жойылды: $1'],
  [/^Foydalanuvchi tiklandi:\s*(.*)$/i, 'Пайдаланушы қалпына келтірілді: $1'],
  [/^Foydalanuvchi tizimga kirdi:\s*(.*)$/i, 'Пайдаланушы жүйеге кірді: $1'],
  [
    /^(\d+)\s*ta tahlil savatga yuborildi:\s*(.*)$/i,
    '$1 талдау себетке жіберілді: $2',
  ],
  [
    /^(\d+)\s*ta tahlil butunlay o'?chirildi \(IDlar:\s*(.*)\)$/i,
    '$1 талдау толық жойылды (ID: $2)',
  ],
  [
    /^(\d+)\s*ta tahlil savatdan tiklandi \(IDlar:\s*(.*)\)$/i,
    '$1 талдау себеттен қалпына келтірілді (ID: $2)',
  ],
  [
    /^Tahlil yangilandi:\s*(.*?)\.\s*O'?zgarishlar:\s*(.*)$/i,
    'Талдау жаңартылды: $1. Өзгерістер: $2',
  ],
  [
    /^Audit jurnali tozalandi:\s*Barchasi\s*\((\d+)\s*ta yozuv\)$/i,
    'Аудит журналы тазаланды: барлығы ($1 жазба)',
  ],
  [
    /^Audit jurnali tozalandi:\s*(.*?)\s*\((\d+)\s*ta yozuv\)$/i,
    'Аудит журналы тазаланды: $1 ($2 жазба)',
  ],
  [/^Zaxira nusxasi yaratildi:\s*(.*)$/i, 'Сақтық көшірме құрылды: $1'],
  [
    /^Zaxira to'?liq tiklandi \(Almashtirish\):\s*(.*)$/i,
    'Сақтық көшірме толық қалпына келтірілді (ауыстыру): $1',
  ],
  [/^Zaxira nusxasi o'?chirildi:\s*(.*)$/i, 'Сақтық көшірме жойылды: $1'],
  [
    /^Bemor hisoboti \(PDF\) yuklab olindi:\s*(.*)$/i,
    'Пациент есебі (PDF) жүктеп алынды: $1',
  ],
  [
    /^Bemor anketasi \(DOCX\) yuklab olindi:\s*(.*)$/i,
    'Пациент анкетасы (DOCX) жүктеп алынды: $1',
  ],
];

const AUDIT_DETAIL_REPLACEMENTS_KZ = [
  [/\bYangi\b/gi, 'Жаңа'],
  [/\bfoydalanuvchi\b/gi, 'пайдаланушы'],
  [/\bFoydalanuvchi\b/g, 'Пайдаланушы'],
  [/\bma'?lumotlari\b/gi, 'деректері'],
  [/\bMa'?lumotlar\b/g, 'Деректер'],
  [/\bMa'?lumot\b/g, 'Дерек'],
  [/\bma'?lumotlar\b/gi, 'деректер'],
  [/\bma'?lumot\b/gi, 'дерек'],
  [/\btahlil\b/gi, 'талдау'],
  [/\bTahlil\b/g, 'Талдау'],
  [/\bBemor hisoboti\b/g, 'Пациент есебі'],
  [/\bbemor hisoboti\b/gi, 'пациент есебі'],
  [/\bBemor anketasi\b/g, 'Пациент анкетасы'],
  [/\bbemor anketasi\b/gi, 'пациент анкетасы'],
  [/\bBemor\b/g, 'Пациент'],
  [/\bbemor\b/gi, 'пациент'],
  [/\bAdmin\b/g, 'Админ'],
  [/\badmin\b/gi, 'админ'],
  [/\bIzlanuvchi\b/g, 'Зерттеуші'],
  [/\bizlanuvchi\b/gi, 'зерттеуші'],
  [/\bResearcher\b/g, 'Зерттеуші'],
  [/\bresearcher\b/gi, 'зерттеуші'],
  [/\bAnalysis\b/g, 'Талдау'],
  [/\banalysis\b/gi, 'талдау'],
  [/\bUser\b/g, 'Пайдаланушы'],
  [/\buser\b/gi, 'пайдаланушы'],
  [/\byaratildi\b/gi, 'құрылды'],
  [/\byangilandi\b/gi, 'жаңартылды'],
  [/\btiklandi\b/gi, 'қалпына келтірілді'],
  [/\bo'?chirildi\b/gi, 'жойылды'],
  [/\bcreated\b/gi, 'құрылды'],
  [/\bupdated\b/gi, 'жаңартылды'],
  [/\bdeleted\b/gi, 'жойылды'],
  [/\brestored\b/gi, 'қалпына келтірілді'],
  [/\byuklab olindi\b/gi, 'жүктеп алынды'],
  [/\byuklandi\b/gi, 'жүктелді'],
  [/\bolindi\b/gi, 'алынды'],
  [/\bsavatga yuborildi\b/gi, 'себетке жіберілді'],
  [/\bsavatdan\b/gi, 'себеттен'],
  [/\bbutunlay\b/gi, 'толық'],
  [/\bIDlar\b/g, 'ID'],
  [/\bBarchasi\b/g, 'Барлығы'],
  [/\bta yozuv\b/gi, 'жазба'],
  [/\bta\b/g, 'дана'],
  [/\bZaxira nusxasi\b/g, 'Сақтық көшірме'],
  [/\bzaxira nusxasi\b/gi, 'сақтық көшірме'],
  [/\bZaxira\b/g, 'Сақтық көшірме'],
  [/\bzaxira\b/gi, 'сақтық көшірме'],
  [/\bfayl\b/gi, 'файл'],
  [/\bO'?zgarishlar\b/gi, 'Өзгерістер'],
  [/\bAlmashtirish\b/gi, 'ауыстыру'],
  [/\btizimga kirdi\b/gi, 'жүйеге кірді'],
];

const AUDIT_DETAIL_CLEANUPS_KZ = [
  [/Жаңа талдау құрылды/gi, 'Жаңа талдау құрылды'],
  [
    /Пациент анкетасы \(DOCX\) жүктеп алынды/gi,
    'Пациент анкетасы (DOCX) жүктеп алынды',
  ],
  [
    /Пациент есебі \(PDF\) жүктеп алынды/gi,
    'Пациент есебі (PDF) жүктеп алынды',
  ],
  [/\s+:/g, ':'],
];

const AUDIT_DETAIL_PATTERNS_KY = [
  [
    /^Yangi tahlil (yaratildi|created|создано):\s*(.*)$/i,
    'Жаңы талдоо түзүлдү: $2',
  ],
  [/^Yangi foydalanuvchi yaratildi:\s*(.*)$/i, 'Жаңы колдонуучу түзүлдү: $1'],
  [
    /^Foydalanuvchi ma'?lumotlari yangilandi:\s*(.*)$/i,
    'Колдонуучунун маалыматы жаңыртылды: $1',
  ],
  [/^Foydalanuvchi o'?chirildi:\s*(.*)$/i, 'Колдонуучу өчүрүлдү: $1'],
  [/^Foydalanuvchi tiklandi:\s*(.*)$/i, 'Колдонуучу калыбына келтирилди: $1'],
  [/^Foydalanuvchi tizimga kirdi:\s*(.*)$/i, 'Колдонуучу системага кирди: $1'],
  [
    /^(\d+)\s*ta tahlil savatga yuborildi:\s*(.*)$/i,
    '$1 талдоо себетке жөнөтүлдү: $2',
  ],
  [
    /^Audit jurnali tozalandi:\s*Barchasi\s*\((\d+)\s*ta yozuv\)$/i,
    'Аудит журналы тазаланды: баары ($1 жазуу)',
  ],
  [
    /^Audit jurnali tozalandi:\s*(.*?)\s*\((\d+)\s*ta yozuv\)$/i,
    'Аудит журналы тазаланды: $1 ($2 жазуу)',
  ],
  [/^Zaxira nusxasi yaratildi:\s*(.*)$/i, 'Камдык көчүрмө түзүлдү: $1'],
  [
    /^Zaxira to'?liq tiklandi \(Almashtirish\):\s*(.*)$/i,
    'Камдык көчүрмө толук калыбына келтирилди (алмаштыруу): $1',
  ],
  [/^Zaxira nusxasi o'?chirildi:\s*(.*)$/i, 'Камдык көчүрмө өчүрүлдү: $1'],
  [
    /^Bemor hisoboti \(PDF\) yuklab olindi:\s*(.*)$/i,
    'Бейтап отчету (PDF) жүктөлдү: $1',
  ],
  [
    /^Bemor anketasi \(DOCX\) yuklab olindi:\s*(.*)$/i,
    'Бейтап анкетасы (DOCX) жүктөлдү: $1',
  ],
  [
    /^(.+?) roli uchun Chat holati o'?zgartirildi:\s*AI=(True|False),\s*Ichki=(True|False)$/i,
    '$1 ролу үчүн Чат абалы өзгөртүлдү: AI=$2, Ички=$3',
  ],
];

const AUDIT_DETAIL_REPLACEMENTS_KY = [
  [/\bYangi\b/gi, 'Жаңы'],
  [/\bfoydalanuvchi\b/gi, 'колдонуучу'],
  [/\bFoydalanuvchi\b/g, 'Колдонуучу'],
  [/\bma'?lumotlari\b/gi, 'маалыматы'],
  [/\bma'?lumotlar\b/gi, 'маалыматтар'],
  [/\btahlil\b/gi, 'талдоо'],
  [/\bTahlil\b/g, 'Талдоо'],
  [/\bBemor hisoboti\b/g, 'Бейтап отчету'],
  [/\bBemor anketasi\b/g, 'Бейтап анкетасы'],
  [/\bBemor\b/g, 'Бейтап'],
  [/\bAdmin\b/g, 'Админ'],
  [/\bIzlanuvchi\b/g, 'Изилдөөчү'],
  [/\bResearcher\b/g, 'Изилдөөчү'],
  [/\byaratildi\b/gi, 'түзүлдү'],
  [/\byangilandi\b/gi, 'жаңыртылды'],
  [/\btiklandi\b/gi, 'калыбына келтирилди'],
  [/\bo'?chirildi\b/gi, 'өчүрүлдү'],
  [/\byuklab olindi\b/gi, 'жүктөлдү'],
  [/\bsavatga yuborildi\b/gi, 'себетке жөнөтүлдү'],
  [/\bsavatdan\b/gi, 'себеттен'],
  [/\bbutunlay\b/gi, 'толук'],
  [/\bBarchasi\b/g, 'Баары'],
  [/\bta yozuv\b/gi, 'жазуу'],
  [/\bZaxira nusxasi\b/g, 'Камдык көчүрмө'],
  [/\bzaxira nusxasi\b/gi, 'камдык көчүрмө'],
  [/\bZaxira\b/g, 'Камдык көчүрмө'],
  [/\bzaxira\b/gi, 'камдык көчүрмө'],
  [/\bfayl\b/gi, 'файл'],
  [/\bO'?zgarishlar\b/gi, 'Өзгөрүүлөр'],
  [/\bAlmashtirish\b/gi, 'алмаштыруу'],
  [/\btizimga kirdi\b/gi, 'системага кирди'],
];

const AUDIT_DETAIL_CLEANUPS_KY = [[/\s+:/g, ':']];
const formatAuditAction = (action, lang) => {
  const value = String(action || '-');
  const labels = AUDIT_ACTION_LABELS[lang];
  if (!labels) return value;
  const key = value.toLowerCase().trim().replaceAll('-', '_');
  return labels[key] || value;
};

const formatAuditTarget = (targetType, lang) => {
  if (!targetType) return '';
  const value = String(targetType);
  if (lang === 'uz') {
    const AUDIT_TARGET_LABELS_UZ = {
      User: 'Foydalanuvchi',
      PatientAnalysis: 'Bemor tahlili',
      Payment: 'To‘lov',
      Backup: 'Zaxira nusxasi',
      ClinicalData: 'Klinik ma’lumotlar',
      AuditLog: 'Audit jurnali',
    };
    return AUDIT_TARGET_LABELS_UZ[value] || value;
  }
  if (lang === 'en')
    return AUDIT_TARGET_LABELS_EN[value] || translateAuditText(value, lang);
  if (lang === 'tr')
    return AUDIT_TARGET_LABELS_TR[value] || translateAuditText(value, lang);
  if (lang === 'ru')
    return AUDIT_TARGET_LABELS_RU[value] || translateAuditText(value, lang);
  if (lang === 'kz')
    return AUDIT_TARGET_LABELS_KZ[value] || translateAuditText(value, lang);
  if (lang === 'ky')
    return AUDIT_TARGET_LABELS_KY[value] || translateAuditText(value, lang);
  return value;
};

const formatAuditJsonValue = (value, lang) => {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value))
    return value.map((item) => formatAuditJsonValue(item, lang)).join(', ');
  if (typeof value === 'object') return formatAuditDetails(value, lang);
  const text = String(value);
  return lang === 'en' ||
    lang === 'tr' ||
    lang === 'ru' ||
    lang === 'kz' ||
    lang === 'ky'
    ? translateAuditText(text, lang)
    : text;
};

const translateAuditText = (text, lang) => {
  const patterns =
    lang === 'en'
      ? AUDIT_DETAIL_PATTERNS_EN
      : lang === 'tr'
        ? AUDIT_DETAIL_PATTERNS_TR
        : lang === 'ky'
          ? AUDIT_DETAIL_PATTERNS_KY
          : lang === 'kz'
            ? AUDIT_DETAIL_PATTERNS_KZ
            : AUDIT_DETAIL_PATTERNS_RU;
  const replacements =
    lang === 'en'
      ? AUDIT_DETAIL_REPLACEMENTS_EN
      : lang === 'tr'
        ? AUDIT_DETAIL_REPLACEMENTS_TR
        : lang === 'ky'
          ? AUDIT_DETAIL_REPLACEMENTS_KY
          : lang === 'kz'
            ? AUDIT_DETAIL_REPLACEMENTS_KZ
            : AUDIT_DETAIL_REPLACEMENTS_RU;
  const cleanups =
    lang === 'en'
      ? AUDIT_DETAIL_CLEANUPS_EN
      : lang === 'tr'
        ? AUDIT_DETAIL_CLEANUPS_TR
        : lang === 'ky'
          ? AUDIT_DETAIL_CLEANUPS_KY
          : lang === 'kz'
            ? AUDIT_DETAIL_CLEANUPS_KZ
            : AUDIT_DETAIL_CLEANUPS_RU;

  const patternMatch = patterns.find(([pattern]) => pattern.test(text));
  if (patternMatch) return text.replace(patternMatch[0], patternMatch[1]);
  const translated = replacements.reduce(
    (result, [pattern, to]) => result.replace(pattern, to),
    text
  );
  return cleanups.reduce(
    (result, [pattern, to]) => result.replace(pattern, to),
    translated
  );
};

const formatAuditDetails = (details, lang) => {
  if (details === null || details === undefined || details === '') return '-';
  let text =
    typeof details === 'string' ? details : JSON.stringify(details, null, 2);

  try {
    const parsed = typeof details === 'string' ? JSON.parse(details) : details;
    if (parsed && typeof parsed === 'object') {
      text = Object.entries(parsed)
        .map(([key, value]) => {
          const label =
            lang === 'uz'
              ? {
                  email: 'Email',
                  role: 'Rol',
                  name: 'Ism',
                  status: 'Holat',
                  permissions: 'Ruxsatlar',
                  action: 'Harakat',
                  details: 'Tafsilotlar',
                  backup_file: 'Zaxira fayli',
                  backup_size: 'Zaxira hajmi',
                }[key] || key
              : lang === 'en'
                ? AUDIT_JSON_KEY_LABELS_EN[key] || translateAuditText(key, lang)
                : lang === 'tr'
                  ? AUDIT_JSON_KEY_LABELS_TR[key] ||
                    translateAuditText(key, lang)
                  : lang === 'ru'
                    ? AUDIT_JSON_KEY_LABELS_RU[key] ||
                      translateAuditText(key, lang)
                    : lang === 'kz'
                      ? AUDIT_JSON_KEY_LABELS_KZ[key] ||
                        translateAuditText(key, lang)
                      : lang === 'ky'
                        ? AUDIT_JSON_KEY_LABELS_KY[key] ||
                          translateAuditText(key, lang)
                        : key;
          return `${label}: ${formatAuditJsonValue(value, lang)}`;
        })
        .join('; ');
    }
  } catch {
    // Plain text audit details are expected too.
  }

  if (
    lang !== 'en' &&
    lang !== 'tr' &&
    lang !== 'ru' &&
    lang !== 'kz' &&
    lang !== 'ky'
  )
    return text;
  return translateAuditText(text, lang);
};

export {
  PAGE_LABELS,
  formatPanelDate,
  HEADER_LABELS,
  RESEARCH_TYPE_OPTIONS,
  ADMIN_REPORT_LABELS,
  ADMIN_REPORT_COLUMN_KEYS,
  CONFIRM_MESSAGES,
  formatAuditAction,
  formatAuditTarget,
  formatAuditDetails,
};

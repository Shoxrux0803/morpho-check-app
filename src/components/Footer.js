// src/components/Footer.jsx
import { useLanguage } from '../contexts/LanguageContext';

const FOOTER_TEXT = {
  uz: "O'zbekistonda ❤️ bilan yaratilgan",
  ru: 'Создано в Узбекистане с ❤️',
  en: 'Made with ❤️ in Uzbekistan',
  kz: 'Өзбекстанда ❤️ жасалған',
  ky: 'Өзбекстанда ❤️ менен жасалган',
  tg: 'Дар Ӯзбекистон бо ❤️ сохта шудааст',
};

export default function Footer() {
  const { lang } = useLanguage();
  const madeText = FOOTER_TEXT[lang] || FOOTER_TEXT.uz;

  return (
    <footer className="text-center text-muted py-3">
      <small>© {new Date().getFullYear()} MorphoCheck Pro</small>
      <small>{madeText}</small>
    </footer>
  );
}

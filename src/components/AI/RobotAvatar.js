// src/components/AI/RobotAvatar.js
// ─── PRO Living EMO-style Avatar ─────────────────────────────────────────────
// Accurate recreation of Living AI's EMO robot with 1000+ expression engine
// Features: Eye tracking, dynamic mouth, mood system, micro-animations, 3D tilt
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

// ── Constants ─────────────────────────────────────────────────────────────────
const AI_TRANSLATIONS = {
  uz: {
    welcome: 'Salom! Men MorphoAI 👋\nQanday yordam kerak?',
    proactive: [
      'Yordam kerakmi? 🤖',
      'Ishlaringiz yaxshimi? 😊',
      'Nima yangiliklar? 📊',
      'Savollaringiz bormi? 💬',
      'Bugun qanday ketmoqda? 🚀',
      'Tahlil natijalari tayormi? 📋',
      'Bir daqiqa dam oling! ☕',
    ],
    praises: [
      'WOW qoyil! 🎉\nYaxshi ishlayapsiz! Men sizdan faxrlanaman!',
      'Ajoyib natija! 🌟\nSiz haqiqatan ham ajoyibsiz!',
      "Zo'r! 👍\nShu ruhda davom eting!",
      'Qoyilmaqom! 🏆\nBunday natija kishini quvontiradi!',
      'Ofarin! 👏\nJuda yaxshi harakat qildingiz!',
    ],
    nightTime:
      'Siz juda kech ishlayapsiz! Choy ichib, dam olish vaqti kelmadimi? 🌙☕',
    tickle: 'Ey, qitiqlamang! 😄',
    idlePrompts: [
      "Hammasi joyidami? Yordam kerak bo'lsa aytishingiz mumkin! 🤔",
      "Ish boshlaymizmi? Nega to'xtab qoldingiz? 🚀",
      'Biror nima yozmoqchimisiz? Men tayyorman! 📝',
      'Sizni kutmoqdaman... 👀',
    ],
    longTyping:
      "Katta matn yozyapsiz shekilli? Yordam kerak bo'lsa, men shu yerdaman! 📝",
    talking: 'gapiryapti...',
  },
  ru: {
    welcome: 'Привет! Я MorphoAI 👋\nЧем могу помочь?',
    proactive: [
      'Нужна помощь? 🤖',
      'Как ваши дела? 😊',
      'Что нового? 📊',
      'Есть вопросы? 💬',
      'Как проходит день? 🚀',
      'Результаты анализа готовы? 📋',
      'Отдохните минутку! ☕',
    ],
    praises: [
      'ВАУ, потрясающе! 🎉\nОтличная работа! Я горжусь вами!',
      'Превосходный результат! 🌟\nВы просто молодец!',
      'Отлично! 👍\nПродолжайте в том же духе!',
      'Изумительно! 🏆\nТакой результат радует глаз!',
      'Браво! 👏\nОчень хорошее достижение!',
    ],
    nightTime:
      'Вы так поздно работаете! Не пора ли выпить чаю и отдохнуть? 🌙☕',
    tickle: 'Эй, щекотно же! 😄',
    idlePrompts: [
      'Все в порядке? Может, нужна подсказка? 🤔',
      'Начнем работу? Почему вы остановились? 🚀',
      'Хотите что-то написать? Я готов! 📝',
      'Я жду вас... 👀',
    ],
    longTyping:
      'Кажется, вы пишете большой текст? Если нужна помощь — я рядом! 📝',
    talking: 'печатает...',
  },
  en: {
    welcome: 'Hello! I am MorphoAI 👋\nHow can I help you?',
    proactive: [
      'Need help? 🤖',
      'How are you doing? 😊',
      "What's new? 📊",
      'Any questions? 💬',
      'How is your day going? 🚀',
      'Are analysis results ready? 📋',
      'Take a minute to rest! ☕',
    ],
    praises: [
      "WOW, amazing! 🎉\nGreat job! I'm proud of you!",
      'Excellent result! 🌟\nYou are truly awesome!',
      'Great! 👍\nKeep up the good work!',
      'Spectacular! 🏆\nSuch a result is delightful!',
      'Bravo! 👏\nYou did a really good job!',
    ],
    nightTime:
      "You are working so late! Isn't it time for tea and some rest? 🌙☕",
    tickle: 'Hey, that tickles! 😄',
    idlePrompts: [
      'Is everything okay? Let me know if you need a hint! 🤔',
      'Shall we start? Why did you stop? 🚀',
      'Do you want to write something? I am ready! 📝',
      'I am waiting for you... 👀',
    ],
    longTyping:
      "Looks like you're typing a lot! Let me know if you need any help! 📝",
    talking: 'typing...',
  },
  tg: {
    welcome: 'Салом! Ман MorphoAI 👋\nЧӣ тавр ёрӣ расонам?',
    proactive: [
      'Ёрӣ лозим аст? 🤖',
      'Корҳо чӣ тавр? 😊',
      'Чӣ навигариҳо? 📊',
      'Саволҳо доред? 💬',
      'Рӯзатон чӣ гуна мегузарад? 🚀',
      'Натиҷаҳои таҳлил тайёранд? 📋',
      'Як дақиқа истироҳат кунед! ☕',
    ],
    praises: [
      'ВАУ, қоил! 🎉\nКори олӣ! Ман бо шумо фахр мекунам!',
      'Натиҷаи аҷиб! 🌟\nШумо воқеан беҳтарин ҳастед!',
      'Зӯр! 👍\nҲамин тавр давом диҳед!',
      'Олиҷаноб! 🏆\nЧунин натиҷа касро хурсанд мекунад!',
      'Офарин! 👏\nБисёр хуб ҳаракат кардед!',
    ],
    nightTime:
      'Шумо хеле дер кор карда истодаед! Вақти чой нӯшидан ва истироҳат нест? 🌙☕',
    tickle: 'Эй, гижик накунед! 😄',
    idlePrompts: [
      'Ҳамааш хуб аст? Агар кӯмак лозим бошад, гӯед! 🤔',
      'Корро сар кунем? Чаро истодед? 🚀',
      'Ягон чиз навиштан мехоҳед? Ман тайёрам! 📝',
      'Ман шуморо интизорам... 👀',
    ],
    longTyping:
      'Ба назар мерасад, ки шумо матни калон навишта истодаед? Агар кӯмак лозим бошад, ман дар ин ҷо ҳастам! 📝',
    talking: 'менависад...',
  },
  kz: {
    welcome: 'Сәлем! Мен MorphoAI 👋\nҚандай көмек керек?',
    proactive: [
      'Көмек керек пе? 🤖',
      'Жағдайыңыз қалай? 😊',
      'Не жаңалық? 📊',
      'Сұрақтарыңыз бар ма? 💬',
      'Күніңіз қалай өтіп жатыр? 🚀',
      'Талдау нәтижелері дайын ба? 📋',
      'Бір минут демалыңыз! ☕',
    ],
    praises: [
      'ВАУ, керемет! 🎉\nЖақсы жұмыс! Мен сізбен мақтанамын!',
      'Керемет нәтиже! 🌟\nСіз шынымен тамашасыз!',
      'Күшті! 👍\nОсы қарқынмен жалғастырыңыз!',
      'Ғажап! 🏆\nМұндай нәтиже қуантады!',
      'Жарайсыз! 👏\nӨте жақсы еңбек еттіңіз!',
    ],
    nightTime:
      'Сіз өте кеш жұмыс істеп жатырсыз! Шай ішіп, демалатын кез келген жоқ па? 🌙☕',
    tickle: 'Эй, қытықтамаңыз! 😄',
    idlePrompts: [
      'Бәрі дұрыс па? Көмек керек болса айтыңыз! 🤔',
      'Жұмысты бастаймыз ба? Неге тоқтап қалдыңыз? 🚀',
      'Бірдеңе жазғыңыз келе ме? Мен дайынмын! 📝',
      'Мен сізді күтіп тұрмын... 👀',
    ],
    longTyping:
      'Сіз үлкен мәтін жазып жатқан сияқтысыз? Көмек керек болса, мен осындамын! 📝',
    talking: 'жазып жатыр...',
  },
  ky: {
    welcome: 'Салам! Мен MorphoAI 👋\nКандай жардам керек?',
    proactive: [
      'Жардам керекпи? 🤖',
      'Иштериңиз кандай? 😊',
      'Эмне жаңылык? 📊',
      'Суроолоруңуз барбы? 💬',
      'Күнүңүз кандай өтүп жатат? 🚀',
      'Анализ жыйынтыктары даярбы? 📋',
      'Бир мүнөт эс алыңыз! ☕',
    ],
    praises: [
      'ВАУ, азамат! 🎉\nЖакшы жумуш! Мен сиз менен сыймыктанам!',
      'Эң сонун натыйжа! 🌟\nСиз чындыгында мыктысыз!',
      'Мыкты! 👍\nУшул темпте улантыңыз!',
      'Керемет! 🏆\nМындай натыйжа кубантат!',
      'Бали! 👏\nӨтө жакшы аракет кылдыңыз!',
    ],
    nightTime:
      'Сиз өтө кеч иштеп жатасыз! Чай ичип, эс ала турган убак келген жокпу? 🌙☕',
    tickle: 'Эй, кытыгылабаңыз! 😄',
    idlePrompts: [
      'Баары жайындабы? Жардам керек болсо айтыңыз! 🤔',
      'Ишти баштайбызбы? Эмнеге токтоп калдыңыз? 🚀',
      'Бир нерсе жазгыңыз келеби? Мен даярмын! 📝',
      'Мен сизди күтүп жатам... 👀',
    ],
    longTyping:
      'Сиз чоң текст жазып жаткан окшойсуз? Жардам керек болсо, мен ушул жердемин! 📝',
    talking: 'жазып жатат...',
  },
  tr: {
    welcome: 'Merhaba! Ben MorphoAI 👋\nNasıl yardımcı olabilirim?',
    proactive: [
      'Yardıma ihtiyacınız var mı? 🤖',
      'Nasılsınız? 😊',
      'Ne var ne yok? 📊',
      'Sorularınız var mı? 💬',
      'Gününüz nasıl geçiyor? 🚀',
      'Analiz sonuçları hazır mı? 📋',
      'Bir dakika dinlenin! ☕',
    ],
    praises: [
      'WOW, harika! 🎉\nİyi iş! Seninle gurur duyuyorum!',
      'Mükemmel sonuç! 🌟\nGerçekten harikasın!',
      'Süper! 👍\nAynen böyle devam et!',
      'Muhteşem! 🏆\nBöyle bir sonuç sevindirici!',
      'Tebrikler! 👏\nÇok iyi çaba gösterdin!',
    ],
    nightTime:
      'Çok geç saatlere kadar çalışıyorsunuz! Biraz çay içip dinlenme vakti gelmedi mi? 🌙☕',
    tickle: 'Hey, gıdıklanıyorum! 😄',
    idlePrompts: [
      'Her şey yolunda mı? Yardıma ihtiyacınız olursa bana bildirin! 🤔',
      'Çalışmaya başlayalım mı? Neden durdunuz? 🚀',
      'Bir şey yazmak ister misiniz? Ben hazırım! 📝',
      'Sizi bekliyorum... 👀',
    ],
    longTyping:
      'Büyük bir metin yazıyorsunuz sanırım? Yardıma ihtiyacınız olursa buradayım! 📝',
    talking: 'yazıyor...',
  },
  tm: {
    welcome: 'Salam! Men MorphoAI 👋\nNäme kömek edip bilerin?',
    proactive: [
      'Kömek gerekmi? 🤖',
      'Ýagdaýlaryňyz nähili? 😊',
      'Näme täzelik? 📊',
      'Soraglaryňyz barmy? 💬',
      'Günüňiz nähili geçýär? 🚀',
      'Barlag netijeleri taýýarmy? 📋',
      'Bir minut dynç alyň! ☕',
    ],
    praises: [
      'WOW, berekella! 🎉\nGowy iş! Men seniň bilen buýsanýaryn!',
      'Ajaýyp netije! 🌟\nSen hakykatdan hem ajaýyp!',
      'Gaty gowy! 👍\nŞu depginde dowam et!',
      'Gudrat! 🏆\nŞeýle netije begendirýär!',
      'Berekella! 👏\nÖrän gowy hereket etdiň!',
    ],
    nightTime:
      'Gaty giç işleýärsiňiz! Çaý içip, dynç almagyň wagty gelmedimi? 🌙☕',
    tickle: 'Eý, gyjyklamaň! 😄',
    idlePrompts: [
      'Hemme zat gowumy? Kömek gerek bolsa aýdyň! 🤔',
      'Işe başlalyňmy? Näme üçin saklandyňyz? 🚀',
      'Bir zat ýazmak isleýärsiňizmi? Men taýýar! 📝',
      'Men size garaşýaryn... 👀',
    ],
    longTyping: 'Uly tekst ýazýan ýaly? Kömek gerek bolsa, men şu taýda! 📝',
    talking: 'ýazýar...',
  },
};

const WELCOME_KEY = 'morpho-robot-welcomed-test-3';
const INTERVAL_MS = 3 * 60 * 1000;

function clamp(v, lo, hi) {
  return Math.min(Math.max(v, lo), hi);
}

// ── CSS Keyframes ─────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
/* ── Particle Animations ── */
@keyframes zzz-float {
  0%   { opacity: 0; transform: translate(0,0) scale(0.5); }
  15%  { opacity: 1; }
  85%  { opacity: 0.6; }
  100% { opacity: 0; transform: translate(-12px,-30px) scale(1.3); }
}
@keyframes note-float {
  0%   { opacity: 0; transform: translate(0,0) scale(0.6) rotate(-15deg); }
  15%  { opacity: 1; }
  85%  { opacity: 0.8; }
  100% { opacity: 0; transform: translate(10px,-32px) scale(1.15) rotate(20deg); }
}
@keyframes heart-float {
  0%   { opacity: 0; transform: translate(0,0) scale(0.4); }
  20%  { opacity: 1; transform: scale(0.9); }
  80%  { opacity: 0.7; }
  100% { opacity: 0; transform: translate(-8px,-30px) scale(1.1); }
}
@keyframes star-twinkle {
  0%,100% { opacity: 0; transform: scale(0.3) rotate(0deg); }
  50%      { opacity: 1; transform: scale(1) rotate(180deg); }
}

/* ── Body Animations ── */
@keyframes emo-idle {
  0%   { transform: translateY(0px); }
  50%  { transform: translateY(-2px); }
  100% { transform: translateY(0px); }
}
@keyframes emo-sleep {
  0%   { transform: translateY(0px) rotate(-2.5deg); }
  50%  { transform: translateY(4px) rotate(2.5deg); }
  100% { transform: translateY(0px) rotate(-2.5deg); }
}
@keyframes emo-happy-bounce {
  0%,100% { transform: translateY(0) scale(1); }
  30%     { transform: translateY(-8px) scale(1.04); }
  60%     { transform: translateY(-3px) scale(1.02); }
}
@keyframes emo-eat {
  0%,100% { transform: translateY(0) rotate(0deg); }
  30%      { transform: translateY(4px) rotate(-5deg); }
  70%      { transform: translateY(4px) rotate(5deg); }
}
@keyframes emo-sing {
  0%   { transform: translateY(0) rotate(-5deg); }
  25%  { transform: translateY(-6px) rotate(0deg); }
  50%  { transform: translateY(0) rotate(5deg); }
  75%  { transform: translateY(-6px) rotate(0deg); }
  100% { transform: translateY(0) rotate(-5deg); }
}
@keyframes emo-curious {
  0%,100% { transform: rotate(0deg) translateX(0); }
  30%      { transform: rotate(12deg) translateX(2px); }
  70%      { transform: rotate(-8deg) translateX(-2px); }
}
@keyframes emo-love {
  0%,100% { transform: scale(1); }
  50%      { transform: scale(1.06); }
}
@keyframes emo-dizzy {
  0%   { transform: rotate(0deg); }
  25%  { transform: rotate(-8deg) translateX(-2px); }
  50%  { transform: rotate(0deg); }
  75%  { transform: rotate(8deg) translateX(2px); }
  100% { transform: rotate(0deg); }
}

/* ── Detail Animations ── */
@keyframes emo-leg-left {
  0%,100% { transform: translateY(0) rotate(0deg); }
  50%     { transform: translateY(-4px) rotate(-15deg); }
}
@keyframes emo-leg-right {
  0%,100% { transform: translateY(0) rotate(0deg); }
  50%     { transform: translateY(-4px) rotate(15deg); }
}
@keyframes emo-headphone-pulse {
  0%,100% { opacity: 1; filter: drop-shadow(0 0 4px #45f3ff); }
  50%     { opacity: 0.5; filter: drop-shadow(0 0 1px #45f3ff); }
}

/* ── Mouth ── */
@keyframes emo-mouth-talk {
  0%   { height: 3px; width: 12px; border-radius: 3px; }
  30%  { height: 10px; width: 16px; border-radius: 8px; }
  60%  { height: 5px; width: 14px; border-radius: 5px; }
  100% { height: 3px; width: 12px; border-radius: 3px; }
}
@keyframes emo-mouth-sing {
  0%,100% { width: 10px; height: 10px; }
  50%      { width: 14px; height: 16px; }
}
@keyframes emo-mouth-eat-chomp {
  0%,100% { height: 3px; width: 10px; border-radius: 3px; }
  50%      { height: 8px; width: 12px; border-radius: 6px; }
}

/* ── Bubble ── */
@keyframes bubble-pop {
  0%   { transform: scale(0.3) translateY(10px); opacity: 0; }
  60%  { transform: scale(1.05) translateY(-2px); opacity: 1; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}

/* ── Wake up ── */
@keyframes wake-up-spin {
  0%   { transform: rotate(0deg) scale(1); }
  15%  { transform: rotate(-15deg) scale(0.94); }
  45%  { transform: rotate(18deg) scale(1.06); }
  75%  { transform: rotate(-6deg) scale(1.02); }
  100% { transform: rotate(0deg) scale(1); }
}

/* ── Scanner ── */
@keyframes emo-scanner {
  0%   { transform: translateX(-50%) scaleX(0.7); opacity: 0.6; }
  100% { transform: translateX(-50%) scaleX(1.1); opacity: 1; }
}

/* ── Weather Animations ── */
@keyframes emo-hot {
  0%   { transform: translateY(0px) scale(1); }
  50%  { transform: translateY(2px) scale(0.98); }
  100% { transform: translateY(0px) scale(1); }
}
@keyframes emo-cold {
  0%, 100% { transform: translateX(0) translateY(0); }
  25%  { transform: translateX(-1px) translateY(1px); }
  75%  { transform: translateX(1px) translateY(-1px); }
}
@keyframes rain-drop {
  0%   { transform: translateY(-20px) scaleY(1); opacity: 0; }
  10%  { opacity: 1; }
  80%  { transform: translateY(50px) scaleY(1); opacity: 1; }
  100% { transform: translateY(60px) scaleY(0.2); opacity: 0; }
}
`;

let cssInjected = false;
function injectCSS() {
  if (cssInjected) return;
  cssInjected = true;
  const s = document.createElement('style');
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

// ── Particles ─────────────────────────────────────────────────────────────────
const ZzzParticle = ({ delay = 0 }) => (
  <span
    style={{
      position: 'absolute',
      top: '-14px',
      right: '0px',
      fontSize: `${10 + delay * 3}px`,
      fontWeight: 900,
      color: '#82b1ff',
      opacity: 0,
      animation: `zzz-float 3s ease-out ${delay * 0.9}s infinite`,
      pointerEvents: 'none',
      fontFamily: 'monospace',
      textShadow: '0 0 8px rgba(130,177,255,0.9)',
    }}
  >
    Z
  </span>
);

const NoteParticle = ({ delay = 0, symbol = '♪', offsetX = 0 }) => (
  <span
    style={{
      position: 'absolute',
      top: '-12px',
      left: `${offsetX}px`,
      fontSize: `${12 + delay * 2}px`,
      fontWeight: 800,
      color: '#69f0ae',
      opacity: 0,
      animation: `note-float 2.5s ease-out ${delay * 0.7}s infinite`,
      pointerEvents: 'none',
      textShadow: '0 0 10px rgba(105,240,174,0.9)',
    }}
  >
    {symbol}
  </span>
);

const HeartParticle = ({ delay = 0, offsetX = 0 }) => (
  <span
    style={{
      position: 'absolute',
      top: '-14px',
      left: `${offsetX}px`,
      fontSize: `${11 + delay * 2}px`,
      color: '#ff6b9d',
      opacity: 0,
      animation: `heart-float 2.8s ease-out ${delay * 0.8}s infinite`,
      pointerEvents: 'none',
      textShadow: '0 0 8px rgba(255,107,157,0.8)',
    }}
  >
    ❤
  </span>
);

const StarParticle = ({ delay = 0, offsetX = 0, offsetY = 0 }) => (
  <span
    style={{
      position: 'absolute',
      top: `${offsetY}px`,
      left: `${offsetX}px`,
      fontSize: '8px',
      color: '#ffd54f',
      opacity: 0,
      animation: `star-twinkle 2s ease-in-out ${delay}s infinite`,
      pointerEvents: 'none',
      textShadow: '0 0 6px rgba(255,213,79,0.9)',
    }}
  >
    ✦
  </span>
);

const CoffeeCup = ({ size }) => (
  <div
    style={{
      position: 'absolute',
      bottom: `${size * 0.04}px`,
      left: `${size * 0.02}px`,
      zIndex: 10,
      pointerEvents: 'none',
    }}
  >
    <svg width={size * 0.26} height={size * 0.3} viewBox="0 0 26 30">
      <rect x="5" y="6" width="16" height="20" rx="3" fill="#e8eaf6" />
      <ellipse cx="13" cy="6" rx="8" ry="3.5" fill="#4e342e" />
      <rect
        x="7"
        y="12"
        width="12"
        height="6"
        rx="2"
        fill="#8d6e63"
        opacity="0.6"
      />
      <path
        d="M 21 10 Q 26 14 21 20"
        stroke="#b0bec5"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 10 2 Q 12 -3 10 -7"
        stroke="rgba(255,255,255,0.5)"
        fill="none"
        strokeWidth="1.2"
        strokeLinecap="round"
      >
        <animate
          attributeName="d"
          values="M 10 2 Q 12 -3 10 -7;M 10 2 Q 8 -3 10 -7;M 10 2 Q 12 -3 10 -7"
          dur="2s"
          repeatCount="indefinite"
        />
      </path>
      <path
        d="M 15 1 Q 17 -4 15 -9"
        stroke="rgba(255,255,255,0.4)"
        fill="none"
        strokeWidth="1.2"
        strokeLinecap="round"
      >
        <animate
          attributeName="d"
          values="M 15 1 Q 17 -4 15 -9;M 15 1 Q 13 -4 15 -9;M 15 1 Q 17 -4 15 -9"
          dur="2.5s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  </div>
);

const RainParticle = ({ delay = 0, offsetX = 0 }) => (
  <span
    style={{
      position: 'absolute',
      top: '0px',
      left: `${offsetX}px`,
      width: '2px',
      height: '10px',
      background:
        'linear-gradient(to bottom, rgba(69,243,255,0), rgba(69,243,255,0.8))',
      opacity: 0,
      animation: `rain-drop 0.8s linear ${delay}s infinite`,
      pointerEvents: 'none',
    }}
  />
);

const SweatParticle = ({ delay = 0, offsetX = 0, offsetY = 0 }) => (
  <span
    style={{
      position: 'absolute',
      top: `${offsetY}px`,
      left: `${offsetX}px`,
      width: '4px',
      height: '6px',
      borderRadius: '50% 50% 2px 2px',
      background: 'rgba(69,243,255,0.6)',
      opacity: 0,
      animation: `bubble-pop 2s ease-in-out ${delay}s infinite alternate`,
      pointerEvents: 'none',
    }}
  />
);

const Umbrella = ({ size }) => (
  <div
    style={{
      position: 'absolute',
      top: `-${size * 0.1}px`,
      left: `-${size * 0.1}px`,
      zIndex: 20,
      pointerEvents: 'none',
    }}
  >
    <svg width={size * 0.8} height={size * 0.8} viewBox="0 0 40 40">
      <path
        d="M 20 5 C 5 5 2 20 2 20 L 38 20 C 38 20 35 5 20 5 Z"
        fill="#ff4757"
        opacity="0.9"
      />
      <path
        d="M 20 20 L 20 35 C 20 37 22 37 22 35"
        stroke="#2f3542"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

const Scarf = ({ size }) => (
  <div
    style={{
      position: 'absolute',
      top: `${size * 0.7}px`,
      left: `${size * 0.1}px`,
      zIndex: 20,
      pointerEvents: 'none',
    }}
  >
    <svg width={size * 0.8} height={size * 0.4} viewBox="0 0 40 20">
      <rect x="5" y="0" width="30" height="8" rx="4" fill="#3742fa" />
      <rect x="25" y="5" width="6" height="12" rx="3" fill="#3742fa" />
      <line
        x1="25"
        y1="16"
        x2="31"
        y2="16"
        stroke="#fff"
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  </div>
);

// ── Speech Bubble ─────────────────────────────────────────────────────────────
const SpeechBubble = ({ message, visible, onDismiss, isTyping, isMobile }) => {
  const { lang } = useLanguage();
  const aiDict = AI_TRANSLATIONS[lang] || AI_TRANSLATIONS['uz'];

  if (!visible) return null;

  const borderColor = '#00509d';
  const bgColor = '#f8f9fa';

  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'absolute',
        bottom: '82px',
        right: isMobile ? 'auto' : '-12px',
        left: isMobile ? '-12px' : 'auto',
        background: bgColor,
        borderRadius: '24px',
        padding: isTyping ? '12px 20px' : '14px 22px',
        minWidth: isTyping ? 'auto' : '180px',
        maxWidth: '280px',
        border: `6px solid ${borderColor}`,
        boxShadow:
          '0 12px 30px rgba(0,0,0,0.3), inset 0 6px 12px rgba(255,255,255,1), inset 0 -4px 8px rgba(0,0,0,0.06)',
        zIndex: 10,
        cursor: 'pointer',
        animation: 'bubble-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transformOrigin: isMobile ? 'bottom left' : 'bottom right',
      }}
    >
      {isTyping ? (
        <div
          style={{
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
            height: '19px',
          }}
        >
          {[0, 0.16, 0.32].map((d, i) => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: borderColor,
                animation: `emo-headphone-pulse 0.8s ease-in-out ${d}s infinite`,
              }}
            />
          ))}
          <span
            style={{
              fontSize: '11px',
              color: '#64748b',
              marginLeft: '6px',
              fontFamily: 'monospace',
              fontWeight: 600,
            }}
          >
            {aiDict.talking}
          </span>
        </div>
      ) : (
        <p
          style={{
            margin: 0,
            fontSize: '15px',
            color: '#1e293b',
            fontWeight: 600,
            lineHeight: 1.5,
            whiteSpace: 'pre-line',
            fontFamily: 'Inter, Segoe UI, sans-serif',
            textAlign: 'center',
          }}
        >
          {message}
        </p>
      )}

      {/* Flawless CSS Diamond Tail */}
      <div
        style={{
          position: 'absolute',
          bottom: '-12px',
          right: isMobile ? 'auto' : '36px',
          left: isMobile ? '36px' : 'auto',
          width: '24px',
          height: '24px',
          backgroundColor: bgColor,
          borderBottom: `6px solid ${borderColor}`,
          borderRight: `6px solid ${borderColor}`,
          transform: 'rotate(45deg)',
          zIndex: 2,
          borderRadius: '0 0 4px 0', // slightly rounded tip
        }}
      />
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ██  MAIN EMO AVATAR COMPONENT  ██
// ══════════════════════════════════════════════════════════════════════════════
const RobotAvatar = ({
  isOpen = false,
  passwordVisible = null,
  size = 64,
  compact = false,
  isTalking = false,
  isMobile = false,
}) => {
  injectCSS();
  const { lang } = useLanguage();
  const aiDict = AI_TRANSLATIONS[lang] || AI_TRANSLATIONS['uz'];

  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [headTilt, setHeadTilt] = useState(0);
  const containerRef = useRef(null);
  const mouseVelRef = useRef({ lx: 0, ly: 0, lt: 0 });

  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Weather Context: 'hot', 'cold', 'rain', 'moderate'
  const weatherContextRef = useRef(null);

  // Moods: idle | sleeping | smiling | winking | eating | singing | curious | love | dizzy
  const [mood, setMood] = useState('idle');
  const moodRef = useRef(mood);
  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  const [blinkState, setBlinkState] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [isTalkingInternal, setIsTalkingInternal] = useState(false);

  const isSleeping = mood === 'sleeping';
  const isEating = mood === 'eating';
  const isSinging = mood === 'singing';
  const isCurious = mood === 'curious';
  const isLove = mood === 'love';
  const isDizzy = mood === 'dizzy';
  const talking = isTalking || isTalkingInternal;

  // Speech bubble
  const [bubble, setBubble] = useState({
    visible: false,
    message: '',
    isTyping: false,
  });
  const proMsgIdx = useRef(0);
  const bubbleDismiss = useRef(null);
  const typingTimerRef = useRef(null);
  const moodTimerRef = useRef(null);

  const dismissBubble = useCallback(() => {
    setBubble({ visible: false, message: '', isTyping: false });
    setIsTalkingInternal(false);
    if (bubbleDismiss.current) clearTimeout(bubbleDismiss.current);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  }, []);

  const showBubble = useCallback((msg, durationMs = 7000) => {
    if (bubbleDismiss.current) clearTimeout(bubbleDismiss.current);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    setBubble({ visible: true, message: '', isTyping: true });
    setIsTalkingInternal(true);

    const typingDuration = 1500 + Math.random() * 1000;

    typingTimerRef.current = setTimeout(() => {
      setBubble({ visible: true, message: msg, isTyping: false });

      setTimeout(() => setIsTalkingInternal(false), 2000);

      bubbleDismiss.current = setTimeout(() => {
        setBubble({ visible: false, message: '', isTyping: false });
      }, durationMs);
    }, typingDuration);
  }, []);

  // ── Welcome ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (compact) return;
    const done = sessionStorage.getItem(WELCOME_KEY);
    if (!done) {
      sessionStorage.setItem(WELCOME_KEY, '1');
      const t = setTimeout(() => showBubble(aiDict.welcome, 8000), 1800);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiDict.welcome]);

  // ── Proactive Messages & Biorhythms ─────────────────────────────────────────
  useEffect(() => {
    if (compact) return;
    const timer = setInterval(() => {
      if (isOpenRef.current || moodRef.current === 'sleeping') return;

      const hour = new Date().getHours();
      // Biorhythms: late night / early morning check
      if (hour >= 23 || hour < 5) {
        // High chance to show night time prompt and get sleepy
        if (Math.random() > 0.3 && aiDict.nightTime) {
          showBubble(aiDict.nightTime, 9000);
          setMood('sleeping');
          return;
        }
      }

      const msgs = aiDict.proactive;
      const msg = msgs[proMsgIdx.current % msgs.length];
      proMsgIdx.current++;
      showBubble(msg, 9000);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [compact, showBubble, aiDict.proactive, aiDict.nightTime]);

  // ── Mouse tracking + Wake-up ────────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const mx = 4;
      setEyeOffset({
        x: clamp((dx / dist) * mx, -mx, mx),
        y: clamp((dy / dist) * mx, -mx, mx),
      });
      setHeadTilt(clamp((dx / window.innerWidth) * 16, -10, 10));

      // Wake up
      const now = Date.now();
      const dt = now - mouseVelRef.current.lt;
      if (dt > 0 && dt < 200) {
        const vx = (e.clientX - mouseVelRef.current.lx) / dt;
        const vy = (e.clientY - mouseVelRef.current.ly) / dt;
        const speed = Math.sqrt(vx * vx + vy * vy);
        const over =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        if (isSleeping && !isWakingUp && speed > 0.8 && over) {
          setIsWakingUp(true);
          setMood('dizzy'); // EMO wakes up dizzy!
          setTimeout(() => {
            setMood('idle');
            setIsWakingUp(false);
          }, 1200);
          scheduleNextMood();
        }
      }
      mouseVelRef.current = { lx: e.clientX, ly: e.clientY, lt: now };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [isSleeping, isWakingUp]
  );

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // ── Mood Scheduling (EMO has many moods!) ───────────────────────────────────
  const scheduleNextMood = useCallback(() => {
    if (moodTimerRef.current) clearTimeout(moodTimerRef.current);
    const delay = 6000 + Math.random() * 12000;
    moodTimerRef.current = setTimeout(() => {
      const rand = Math.random();
      const wCtx = weatherContextRef.current;

      // 25% chance to show a weather-related mood if context exists
      if (wCtx && rand < 0.25) {
        setMood(`weather_${wCtx}`);
        moodTimerRef.current = setTimeout(
          () => {
            setMood('idle');
            scheduleNextMood();
          },
          wCtx === 'moderate' ? 4000 : 8000
        );
        return;
      }

      if (rand < 0.35) {
        setMood('smiling');
        moodTimerRef.current = setTimeout(() => {
          setMood('idle');
          scheduleNextMood();
        }, 4000);
      } else if (rand < 0.5) {
        setMood('sleeping');
        moodTimerRef.current = setTimeout(
          () => {
            setMood('idle');
            scheduleNextMood();
          },
          12000 + Math.random() * 5000
        );
      } else if (rand < 0.6) {
        setMood('winking');
        moodTimerRef.current = setTimeout(() => {
          setMood('idle');
          scheduleNextMood();
        }, 2000);
      } else if (rand < 0.7) {
        setMood('eating');
        moodTimerRef.current = setTimeout(() => {
          setMood('idle');
          scheduleNextMood();
        }, 7000);
      } else if (rand < 0.8) {
        setMood('singing');
        moodTimerRef.current = setTimeout(() => {
          setMood('idle');
          scheduleNextMood();
        }, 8000);
      } else if (rand < 0.88) {
        setMood('curious');
        moodTimerRef.current = setTimeout(() => {
          setMood('idle');
          scheduleNextMood();
        }, 3500);
      } else if (rand < 0.95) {
        setMood('love');
        moodTimerRef.current = setTimeout(() => {
          setMood('idle');
          scheduleNextMood();
        }, 4500);
      } else {
        setMood('dizzy');
        moodTimerRef.current = setTimeout(() => {
          setMood('idle');
          scheduleNextMood();
        }, 3000);
      }
    }, delay);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setMood('idle');
      if (moodTimerRef.current) clearTimeout(moodTimerRef.current);
      return;
    }
    scheduleNextMood();
    return () => {
      if (moodTimerRef.current) clearTimeout(moodTimerRef.current);
    };
  }, [isOpen, scheduleNextMood]);

  // ── Celebration & Admin Chat Listeners ──────────────────────────────────────
  useEffect(() => {
    const handleCelebrate = (e) => {
      setMood('smiling');
      const praises = aiDict.praises;
      if (praises && praises.length > 0) {
        const randPraise = praises[Math.floor(Math.random() * praises.length)];
        showBubble(randPraise, 8000);
      } else if (e.detail?.message) {
        showBubble(e.detail.message, 8000);
      }
      if (moodTimerRef.current) clearTimeout(moodTimerRef.current);
      moodTimerRef.current = setTimeout(() => {
        setMood('idle');
        scheduleNextMood();
      }, 4000);
    };

    const handleAdminChat = (e) => {
      if (e.detail?.isOpen) {
        setMood('curious');
        if (moodTimerRef.current) clearTimeout(moodTimerRef.current);
        moodTimerRef.current = setTimeout(() => {
          setMood('idle');
          scheduleNextMood();
        }, 3000);
      }
    };

    window.addEventListener('emo-celebrate', handleCelebrate);
    window.addEventListener('admin-chat-toggled', handleAdminChat);
    return () => {
      window.removeEventListener('emo-celebrate', handleCelebrate);
      window.removeEventListener('admin-chat-toggled', handleAdminChat);
    };
  }, [showBubble, aiDict.praises, scheduleNextMood]);

  // ── Weather Listener ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleWeather = (e) => {
      const { code, temp } = e.detail;
      const isRain =
        (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
      const isSnow = code >= 71 && code <= 86;

      if (isRain) {
        weatherContextRef.current = 'rain';
      } else if (isSnow || temp <= 10) {
        weatherContextRef.current = 'cold';
      } else if (temp >= 30) {
        weatherContextRef.current = 'hot';
      } else {
        weatherContextRef.current = 'moderate';
      }
    };
    window.addEventListener('weather-update', handleWeather);
    return () => window.removeEventListener('weather-update', handleWeather);
  }, []);

  // ── Blinking ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isSleeping || mood === 'smiling' || isLove) return;
    let t;
    const blink = () => {
      setBlinkState(true);
      setTimeout(() => setBlinkState(false), 100);
      t = setTimeout(blink, 2500 + Math.random() * 5000);
    };
    t = setTimeout(blink, 1500);
    return () => clearTimeout(t);
  }, [isSleeping, mood, isLove]);

  // ── Body Animation ──────────────────────────────────────────────────────────
  const bodyAnim = (() => {
    if (isWakingUp)
      return 'wake-up-spin 1s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
    if (isSleeping) return 'emo-sleep 4s ease-in-out infinite';
    if (mood === 'smiling') return 'emo-happy-bounce 0.8s ease-in-out infinite';
    if (isEating) return 'emo-eat 1.2s ease-in-out infinite';
    if (isSinging) return 'emo-sing 0.9s ease-in-out infinite';
    if (isCurious) return 'emo-idle 4.5s ease-in-out infinite';
    if (isLove) return 'emo-love 1.5s ease-in-out infinite';
    if (isDizzy) return 'emo-dizzy 0.6s ease-in-out infinite';

    // Weather overrides
    if (mood === 'weather_cold') return 'emo-cold 0.3s ease-in-out infinite';
    if (mood === 'weather_hot') return 'emo-hot 2s ease-in-out infinite';
    if (mood === 'weather_rain') return 'emo-idle 4.5s ease-in-out infinite';
    if (mood === 'weather_moderate')
      return 'emo-happy-bounce 3s ease-in-out infinite';

    return 'emo-idle 4.5s ease-in-out infinite';
  })();

  // ── Empathy (Keyboard & Idle) ───────────────────────────────────────────────
  const lastActivityRef = useRef(Date.now());
  const idlePromptShownRef = useRef(false);
  const keystrokeCountRef = useRef(0);
  const lastKeystrokeTimeRef = useRef(0);

  useEffect(() => {
    if (compact) return;
    const handleActivity = (e) => {
      lastActivityRef.current = Date.now();
      idlePromptShownRef.current = false;

      // Keyboard empathy (detect long typing sessions)
      if (e.type === 'keydown' && !isOpenRef.current) {
        const now = Date.now();
        if (now - lastKeystrokeTimeRef.current > 3000) {
          keystrokeCountRef.current = 0; // reset if paused for 3 seconds
        }
        keystrokeCountRef.current += 1;
        lastKeystrokeTimeRef.current = now;

        if (keystrokeCountRef.current > 40) {
          keystrokeCountRef.current = 0; // prevent spam
          if (aiDict.longTyping) {
            setMood('curious');
            showBubble(aiDict.longTyping, 6000);
            if (moodTimerRef.current) clearTimeout(moodTimerRef.current);
            moodTimerRef.current = setTimeout(() => {
              setMood('idle');
              scheduleNextMood();
            }, 6000);
          }
        }
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);

    const idleTimer = setInterval(() => {
      if (isOpenRef.current) return;
      if (
        !idlePromptShownRef.current &&
        Date.now() - lastActivityRef.current > 120000
      ) {
        if (aiDict.idlePrompts && aiDict.idlePrompts.length > 0) {
          if (Math.random() < 0.4) {
            setMood('sleeping');
            if (moodTimerRef.current) clearTimeout(moodTimerRef.current);
          } else {
            const msgs = aiDict.idlePrompts;
            const msg = msgs[Math.floor(Math.random() * msgs.length)];
            showBubble(msg, 10000);
            setMood('curious');
            if (moodTimerRef.current) clearTimeout(moodTimerRef.current);
            moodTimerRef.current = setTimeout(() => {
              setMood('idle');
              scheduleNextMood();
            }, 6000);
          }
          idlePromptShownRef.current = true;
        }
      }
    }, 10000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      clearInterval(idleTimer);
    };
  }, [compact, aiDict.idlePrompts, showBubble, scheduleNextMood]);

  // ── Tickling ────────────────────────────────────────────────────────────────
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);

  const handleAvatarClick = useCallback(() => {
    const now = Date.now();
    if (now - lastClickTimeRef.current > 1000) {
      clickCountRef.current = 0;
    }
    clickCountRef.current += 1;
    lastClickTimeRef.current = now;

    if (clickCountRef.current >= 4) {
      clickCountRef.current = 0;
      setMood('dizzy');
      if (aiDict.tickle) {
        showBubble(aiDict.tickle, 4000);
      }
    }
  }, [aiDict.tickle, showBubble]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ██  RENDER EMO'S DIGITAL EYES  ██
  // ═══════════════════════════════════════════════════════════════════════════
  const renderEyes = () => {
    const isClosed = passwordVisible === false || blinkState || isSleeping;
    const isSmiling = mood === 'smiling';
    const isWinkingMood = mood === 'winking';
    const isSingingMood = mood === 'singing';

    const eyeW = size * 0.24;
    const eyeH = size * 0.22;
    const gap = size * 0.08;
    const cyan = '#45f3ff';
    const glow = 'rgba(69, 243, 255, 0.65)';

    const makeEye = (side) => {
      let w = eyeW;
      let h = eyeH;
      let br = '30%';
      let tx = eyeOffset.x;
      let ty = eyeOffset.y;
      let op = 1;
      let bg = cyan;
      let extraTransform = '';
      let anim = 'none';

      if (isSleeping) {
        // ─── EMO Sleep: thin horizontal line ───
        h = 3;
        br = '2px';
        w = eyeW * 0.75;
        op = 0.5;
        tx = 0;
        ty = 0;
        extraTransform = 'translateY(5px)';
      } else if (isClosed) {
        // ─── Blink ───
        h = 3;
        br = '2px';
        extraTransform = 'scaleX(0.85)';
      } else if (isWinkingMood && side === 'right') {
        // ─── Wink right eye ───
        h = 3;
        br = '2px';
        extraTransform = 'scaleX(0.85)';
      } else if (isSmiling) {
        // ─── EMO SMILE: Exact match to user's reference image ───
        // Flat bottom edge, perfectly rounded top = inverted U, slightly squeezed
        h = eyeH * 0.4;
        w = eyeW * 1.15;
        br = `${w}px ${w}px 0 0`; // top fully round, bottom completely flat
        extraTransform = 'translateY(6px)';
      } else if (isLove) {
        // ─── Love: heart-shaped eyes ───
        bg = '#ff6b9d';
        br = '40%';
        extraTransform = 'scale(1.1)';
        anim = 'emo-love 0.8s ease-in-out infinite';
      } else if (isCurious) {
        // ─── Curious: one eye bigger than other ───
        if (side === 'left') {
          extraTransform = 'scale(1.2)';
        } else {
          extraTransform = 'scale(0.85) translateY(2px)';
        }
      } else if (isDizzy) {
        // ─── Dizzy: spiral eyes (X shape via two lines) ───
        return (
          <div
            key={side}
            style={{
              width: eyeW,
              height: eyeH,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${eyeW * 0.7}px`,
              color: cyan,
              textShadow: `0 0 10px ${glow}`,
              animation: 'emo-dizzy 0.4s ease-in-out infinite',
              fontWeight: 900,
              fontFamily: 'monospace',
            }}
          >
            ✕
          </div>
        );
      } else if (isSingingMood) {
        br = '40%';
        extraTransform = 'scale(1.08)';
      }
      // REMOVED talking animation from eyes so they stay still when talking

      return (
        <div
          key={side}
          style={{
            width: typeof w === 'number' ? `${w}px` : w,
            height: typeof h === 'number' ? `${h}px` : h,
            backgroundColor: bg,
            borderRadius: br,
            opacity: op,
            boxShadow: `0 0 14px ${bg === cyan ? glow : 'rgba(255,107,157,0.6)'}, inset 0 0 6px rgba(255,255,255,0.7)`,
            transform: `translate(${tx}px, ${ty}px) ${extraTransform}`,
            transition: 'all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
            animation: anim,
          }}
        />
      );
    };

    return (
      <div
        style={{
          position: 'absolute',
          top: `${size * 0.32}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: `${gap}px`,
          alignItems: 'center',
          zIndex: 3,
        }}
      >
        {makeEye('left')}
        {makeEye('right')}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ██  RENDER EMO'S DYNAMIC MOUTH  ██
  // ═══════════════════════════════════════════════════════════════════════════
  const renderMouth = () => {
    const isSmiling = mood === 'smiling';
    const isSingingMood = mood === 'singing';

    // Default: hidden
    let opacity = 0;
    let w = '10px';
    let h = '2px';
    let br = '2px';
    let bg = '#45f3ff';
    let borderTopWidth = '0';
    let borderRightWidth = '0';
    let borderBottomWidth = '0';
    let borderLeftWidth = '0';
    const borderTopStyle = 'solid';
    const borderRightStyle = 'solid';
    const borderBottomStyle = 'solid';
    const borderLeftStyle = 'solid';
    let borderTopColor = 'transparent';
    let borderRightColor = 'transparent';
    let borderBottomColor = 'transparent';
    let borderLeftColor = 'transparent';
    let anim = 'none';
    let tx = `translate(${eyeOffset.x * 0.6}px, ${eyeOffset.y * 0.5}px)`;

    if (talking && !isSleeping) {
      // ─── Talking: animated open/close ───
      opacity = 1;
      anim = 'emo-mouth-talk 0.35s ease-in-out infinite';
    } else if (isSmiling) {
      // ─── EMO Smile mouth: hidden when smiling based on user request ───
      // Opacity stays 0, no mouth shown.
    } else if (isSingingMood) {
      // ─── Singing: open O mouth ───
      opacity = 1;
      w = '10px';
      h = '10px';
      br = '50%';
      anim = 'emo-mouth-sing 0.5s ease-in-out infinite';
    } else if (isEating) {
      // ─── Eating: chomping ───
      opacity = 1;
      anim = 'emo-mouth-eat-chomp 0.6s ease-in-out infinite';
    } else if (isLove) {
      // ─── Love: small happy smile ───
      opacity = 1;
      w = '14px';
      h = '7px';
      bg = 'transparent';
      borderRightWidth = '2.5px';
      borderBottomWidth = '2.5px';
      borderLeftWidth = '2.5px';
      borderTopColor = '#ff6b9d';
      borderRightColor = '#ff6b9d';
      borderBottomColor = '#ff6b9d';
      borderLeftColor = '#ff6b9d';
      br = '0 0 12px 12px';
    } else if (isDizzy) {
      // ─── Dizzy: wavy line ───
      opacity = 0.7;
      w = '16px';
      h = '3px';
      br = '2px';
      bg = '#45f3ff';
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: `${size * 0.62}px`,
          left: '50%',
          transform: `translateX(-50%) ${tx}`,
          width: w,
          height: h,
          backgroundColor: bg,
          borderTopWidth,
          borderRightWidth,
          borderBottomWidth,
          borderLeftWidth,
          borderTopStyle,
          borderRightStyle,
          borderBottomStyle,
          borderLeftStyle,
          borderTopColor,
          borderRightColor,
          borderBottomColor,
          borderLeftColor,
          borderRadius: br,
          opacity: opacity,
          boxShadow: opacity > 0 ? `0 0 10px rgba(69, 243, 255, 0.5)` : 'none',
          transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          animation: anim,
          zIndex: 3,
        }}
      />
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ██  RENDER  ██
  // ═══════════════════════════════════════════════════════════════════════════
  const s = size;

  return (
    <div
      ref={containerRef}
      onClick={handleAvatarClick}
      style={{
        position: 'relative',
        width: s,
        height: s,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '250px',
        cursor: 'pointer',
      }}
    >
      {/* Speech Bubble */}
      {!compact && (
        <SpeechBubble
          message={bubble.message}
          visible={bubble.visible && !isOpen}
          onDismiss={dismissBubble}
          isTyping={bubble.isTyping}
          isMobile={isMobile}
        />
      )}

      {/* Zzz particles */}
      {!compact && isSleeping && !isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-6px',
            zIndex: 15,
            pointerEvents: 'none',
          }}
        >
          <ZzzParticle delay={0} />
          <ZzzParticle delay={1} />
          <ZzzParticle delay={2} />
        </div>
      )}

      {/* Note particles */}
      {!compact && isSinging && !isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '-4px',
            left: '-8px',
            zIndex: 15,
            pointerEvents: 'none',
          }}
        >
          <NoteParticle delay={0} symbol="♪" offsetX={0} />
          <NoteParticle delay={0.8} symbol="♫" offsetX={18} />
          <NoteParticle delay={1.6} symbol="♩" offsetX={-4} />
        </div>
      )}

      {/* Heart particles */}
      {!compact && isLove && !isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            zIndex: 15,
            pointerEvents: 'none',
          }}
        >
          <HeartParticle delay={0} offsetX={0} />
          <HeartParticle delay={0.7} offsetX={15} />
          <HeartParticle delay={1.4} offsetX={-8} />
        </div>
      )}

      {/* Star particles for curious */}
      {!compact && isCurious && !isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            zIndex: 15,
            pointerEvents: 'none',
            width: '100%',
            height: '100%',
          }}
        >
          <StarParticle delay={0} offsetX={-5} offsetY={0} />
          <StarParticle delay={0.5} offsetX={s * 0.7} offsetY={-5} />
          <StarParticle delay={1} offsetX={s * 0.3} offsetY={-8} />
        </div>
      )}

      {/* Coffee cup */}
      {isEating && !isOpen && <CoffeeCup size={s} />}

      {/* Weather UI overlays */}
      {!compact && mood === 'weather_rain' && !isOpen && (
        <>
          <Umbrella size={s} />
          <div
            style={{
              position: 'absolute',
              top: '-10px',
              left: '0',
              width: '100%',
              height: '100%',
              zIndex: 15,
              pointerEvents: 'none',
            }}
          >
            <RainParticle delay={0} offsetX={10} />
            <RainParticle delay={0.2} offsetX={30} />
            <RainParticle delay={0.4} offsetX={50} />
            <RainParticle delay={0.1} offsetX={20} />
            <RainParticle delay={0.3} offsetX={40} />
          </div>
        </>
      )}

      {!compact && mood === 'weather_hot' && !isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '15px',
            zIndex: 15,
            pointerEvents: 'none',
          }}
        >
          <SweatParticle delay={0} offsetX={0} offsetY={0} />
          <SweatParticle delay={0.5} offsetX={5} offsetY={10} />
        </div>
      )}

      {/* ═══ Main Animated Wrapper ═══ */}
      <div
        style={{
          animation: bodyAnim,
          transformOrigin: 'center bottom',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          width: '100%',
          height: '100%',
          position: 'relative',
          transform: `rotateY(${headTilt}deg)`,
          transition: 'transform 0.15s ease-out',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* ═══ SVG: EMO Body ═══ */}
        <svg
          width={s}
          height={s * 0.92}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient
              id={`emo-body-${s}`}
              x1="20%"
              y1="0%"
              x2="80%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#3a3f4b" />
              <stop offset="50%" stopColor="#282c34" />
              <stop offset="100%" stopColor="#14171e" />
            </linearGradient>
            <linearGradient
              id={`emo-face-${s}`}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#0d1117" />
              <stop offset="100%" stopColor="#030508" />
            </linearGradient>
            <filter id={`sh-${s}`}>
              <feDropShadow
                dx="0"
                dy="5"
                stdDeviation="5"
                floodColor="#000"
                floodOpacity="0.5"
              />
            </filter>
            <filter id={`glow-${s}`}>
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="3"
                floodColor="#45f3ff"
                floodOpacity="0.85"
              />
            </filter>
          </defs>

          {/* ── Legs ── */}
          {/* Removed by user request */}

          {/* ── Headphones ── */}
          <g>
            {/* Left */}
            <rect
              x="4"
              y="33"
              width="10"
              height="34"
              rx="5"
              fill="#1e2530"
              filter={`url(#sh-${s})`}
            />
            <circle
              cx="9"
              cy="50"
              r="4"
              fill="#45f3ff"
              filter={`url(#glow-${s})`}
              style={{
                animation:
                  talking || isSinging
                    ? 'emo-headphone-pulse 0.8s infinite'
                    : 'none',
              }}
            />
            {/* Right */}
            <rect
              x="86"
              y="33"
              width="10"
              height="34"
              rx="5"
              fill="#1e2530"
              filter={`url(#sh-${s})`}
            />
            <circle
              cx="91"
              cy="50"
              r="4"
              fill="#45f3ff"
              filter={`url(#glow-${s})`}
              style={{
                animation:
                  talking || isSinging
                    ? 'emo-headphone-pulse 0.8s infinite 0.4s'
                    : 'none',
              }}
            />
          </g>

          {/* ── Main Body ── */}
          <rect
            x="10"
            y="8"
            width="80"
            height="80"
            rx="22"
            fill={`url(#emo-body-${s})`}
            filter={`url(#sh-${s})`}
          />

          {/* ── 3D Top highlight ── */}
          <path
            d="M 32 10 L 68 10 Q 88 10 88 30 L 88 34 Q 88 14 68 14 L 32 14 Q 12 14 12 34 L 12 30 Q 12 10 32 10 Z"
            fill="#ffffff"
            opacity="0.1"
          />

          {/* ── Screen Face ── */}
          <rect
            x="16"
            y="16"
            width="68"
            height="66"
            rx="16"
            fill={`url(#emo-face-${s})`}
          />

          {/* Weather tint overlay */}
          {mood === 'weather_hot' && (
            <rect
              x="16"
              y="16"
              width="68"
              height="66"
              rx="16"
              fill="rgba(255, 60, 0, 0.15)"
              pointerEvents="none"
            />
          )}
          {mood === 'weather_cold' && (
            <rect
              x="16"
              y="16"
              width="68"
              height="66"
              rx="16"
              fill="rgba(69, 243, 255, 0.15)"
              pointerEvents="none"
            />
          )}

          {/* ── Screen reflection ── */}
          <path
            d="M 16 38 Q 38 26 84 18 L 84 26 Q 50 36 16 48 Z"
            fill="#ffffff"
            opacity="0.04"
          />

          {/* ── Side accent lines ── */}
          <line
            x1="12"
            y1="72"
            x2="12"
            y2="84"
            stroke="#45f3ff"
            strokeWidth="1.5"
            opacity="0.3"
            strokeLinecap="round"
          />
          <line
            x1="88"
            y1="72"
            x2="88"
            y2="84"
            stroke="#45f3ff"
            strokeWidth="1.5"
            opacity="0.3"
            strokeLinecap="round"
          />
        </svg>

        {/* ═══ Eyes overlay ═══ */}
        {renderEyes()}

        {/* ═══ Mouth overlay ═══ */}
        {renderMouth()}

        {/* Scarf for cold weather overlay */}
        {!compact && mood === 'weather_cold' && !isOpen && <Scarf size={s} />}
      </div>
    </div>
  );
};

export default RobotAvatar;

// src/components/AI/RobotAvatar.js
// ─── PRO Living EMO-style Avatar with Mouth & Enhanced Expressions ────────────
import React, { useState, useEffect, useRef, useCallback } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────
const PROACTIVE_MESSAGES = [
  'Yordam kerakmi? 🤖',
  'Ishlaringiz yaxshimi? 😊',
  'Nima yangiliklar? 📊',
  'Savollaringiz bormi? 💬',
  'Bugun qanday ketmoqda? 🚀',
  'Tahlil natijalari tayormi? 📋',
  'Bir daqiqa dam oling! ☕',
];

const WELCOME_MSG = 'Salom! Men MorphoAI 👋\nQanday yordam kerak?';
const WELCOME_KEY = 'morpho-robot-welcomed-v5';
const INTERVAL_MS = 3 * 60 * 1000; // 3 daqiqa

function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }

// ── CSS Keyframes ─────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
@keyframes zzz-float {
  0%   { opacity: 0; transform: translate(0,0) scale(0.6); }
  20%  { opacity: 1; }
  80%  { opacity: 0.8; }
  100% { opacity: 0; transform: translate(-10px,-25px) scale(1.2); }
}
@keyframes note-float {
  0%   { opacity: 0; transform: translate(0,0) scale(0.7) rotate(-10deg); }
  20%  { opacity: 1; }
  80%  { opacity: 0.9; }
  100% { opacity: 0; transform: translate(12px,-28px) scale(1.1) rotate(15deg); }
}
@keyframes emo-idle {
  0%   { transform: translateY(0px) rotate(0deg); }
  50%  { transform: translateY(-3px) rotate(0.5deg); }
  100% { transform: translateY(0px) rotate(0deg); }
}
@keyframes emo-sleep {
  0%   { transform: translateY(0px) rotate(-2deg); }
  50%  { transform: translateY(4px) rotate(2deg); }
  100% { transform: translateY(0px) rotate(-2deg); }
}
@keyframes emo-happy {
  0%, 100% { transform: translateY(0) scale(1); }
  50%      { transform: translateY(-7px) scale(1.03); }
}
@keyframes emo-eat {
  0%,100% { transform: translateY(0) rotate(0deg); }
  25%      { transform: translateY(3px) rotate(-4deg); }
  75%      { transform: translateY(3px) rotate(4deg); }
}
@keyframes emo-sing {
  0%   { transform: translateY(0) rotate(-5deg); }
  25%  { transform: translateY(-5px) rotate(0deg); }
  50%  { transform: translateY(0) rotate(5deg); }
  75%  { transform: translateY(-5px) rotate(0deg); }
  100% { transform: translateY(0) rotate(-5deg); }
}
@keyframes bubble-pop {
  0%   { transform: scale(0.4); opacity: 0; }
  65%  { transform: scale(1.06); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes wake-up-spin {
  0%   { transform: rotate(0deg) scale(1); }
  20%  { transform: rotate(-12deg) scale(0.95); }
  50%  { transform: rotate(15deg) scale(1.05); }
  80%  { transform: rotate(-8deg) scale(1.02); }
  100% { transform: rotate(0deg) scale(1); }
}

/* Eye Animations */
@keyframes emo-eye-talk {
  0%,100% { transform: scaleY(1); opacity: 1; }
  50%      { transform: scaleY(0.7); opacity: 0.85; }
}
@keyframes emo-eye-sing {
  0%,100% { transform: scaleY(1) translateY(0); }
  50%      { transform: scaleY(1.1) translateY(-2px); }
}

/* Mouth Animations */
@keyframes emo-mouth-talk {
  0%,100% { height: 4px; width: 14px; border-radius: 4px; }
  50%      { height: 12px; width: 18px; border-radius: 8px; }
}
@keyframes emo-mouth-sing {
  0%,100% { height: 10px; width: 10px; }
  50%      { height: 16px; width: 14px; }
}
@keyframes emo-mouth-eat {
  0%,100% { transform: translateY(0) scale(1); }
  50%      { transform: translateY(2px) scale(1.2); }
}

/* Details */
@keyframes emo-leg-left {
  0%,100% { transform: translateY(0) rotate(0deg); }
  50%     { transform: translateY(-3px) rotate(-12deg); }
}
@keyframes emo-leg-right {
  0%,100% { transform: translateY(0) rotate(0deg); }
  50%     { transform: translateY(-3px) rotate(12deg); }
}
@keyframes emo-headphone-pulse {
  0%,100% { fill: #4fc3f7; filter: drop-shadow(0 0 3px #4fc3f7); }
  50%     { fill: #0288d1; filter: drop-shadow(0 0 0px transparent); }
}
`;

let cssInjected = false;
function injectCSS() {
  if (cssInjected) return;
  cssInjected = true;
  const style = document.createElement('style');
  style.textContent = GLOBAL_CSS;
  document.head.appendChild(style);
}

// ── Particles ─────────────────────────────────────────────────────────────────
const ZzzParticle = ({ delay = 0 }) => (
  <span style={{
    position: 'absolute', top: '-14px', right: '2px',
    fontSize: `${10 + delay * 3}px`, fontWeight: 800,
    color: '#82b1ff', opacity: 0,
    animation: `zzz-float 2.8s ease-out ${delay * 0.8}s infinite`,
    pointerEvents: 'none', fontFamily: 'Nunito, sans-serif',
    textShadow: '0 0 8px rgba(130,177,255,0.9)',
  }}>Z</span>
);

const NoteParticle = ({ delay = 0, symbol = '♪', offsetX = 0 }) => (
  <span style={{
    position: 'absolute', top: '-10px', left: `${offsetX}px`,
    fontSize: `${12 + delay * 2}px`, fontWeight: 800,
    color: '#69f0ae', opacity: 0,
    animation: `note-float 2.2s ease-out ${delay * 0.7}s infinite`,
    pointerEvents: 'none', fontFamily: 'sans-serif',
    textShadow: '0 0 10px rgba(105,240,174,0.9)',
  }}>{symbol}</span>
);

const CoffeeCup = ({ size }) => (
  <div style={{
    position: 'absolute', bottom: `${size * 0.05}px`, left: `${size * 0.08}px`,
    zIndex: 10, pointerEvents: 'none',
  }}>
    <svg width={size * 0.28} height={size * 0.32} viewBox="0 0 24 28">
      <path d="M 4 4 L 20 4 L 18 24 Q 12 28 6 24 Z" fill="#cbd5e1" />
      <ellipse cx="12" cy="4" rx="8" ry="3" fill="#5d4037" />
      <rect x="5" y="10" width="14" height="8" fill="#795548" />
      <path d="M 8 0 Q 10 -5 8 -10" stroke="#ffffff" fill="none" strokeWidth="1.5" opacity="0.7" strokeLinecap="round" />
      <path d="M 14 -2 Q 16 -7 14 -12" stroke="#ffffff" fill="none" strokeWidth="1.5" opacity="0.7" strokeLinecap="round" />
    </svg>
  </div>
);

// ── Speech Bubble ─────────────────────────────────────────────────────────────
const SpeechBubble = ({ message, visible, onDismiss, isTalking }) => {
  if (!visible) return null;
  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'absolute', bottom: '82px', right: '-12px',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(8px)',
        borderRadius: '16px 16px 4px 16px',
        padding: '12px 18px',
        minWidth: '180px', maxWidth: '250px',
        boxShadow: '0 12px 35px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.1)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        zIndex: 10, cursor: 'pointer',
        animation: 'bubble-pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transformOrigin: 'bottom right',
      }}
    >
      {isTalking && (
        <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
          {[0, 0.15, 0.3].map((d, i) => (
            <div key={i} style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#45f3ff',
              boxShadow: '0 0 8px #45f3ff',
              animation: `emo-eye-talk 0.6s ease-in-out ${d}s infinite alternate`,
            }} />
          ))}
        </div>
      )}
      <p style={{
        margin: 0, fontSize: '13px', color: '#f1f5f9',
        fontWeight: 600, lineHeight: 1.5, whiteSpace: 'pre-line',
        fontFamily: 'Inter, Segoe UI, sans-serif',
      }}>
        {message}
      </p>
      <div style={{
        position: 'absolute', bottom: '-9px', right: '22px',
        width: 0, height: 0,
        borderLeft: '11px solid transparent', borderTop: '10px solid rgba(15, 23, 42, 0.95)',
      }} />
    </div>
  );
};

// ── Main EMO Avatar ───────────────────────────────────────────────────────────
const RobotAvatar = ({
  isOpen          = false,
  passwordVisible = null,
  size            = 64,
  compact         = false,
  isTalking       = false,
}) => {
  injectCSS();

  // Eye tracking
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [headTilt, setHeadTilt]   = useState(0);
  const containerRef = useRef(null);
  const mouseVelRef  = useRef({ lx: 0, ly: 0, lt: 0 });
  
  const isOpenRef = useRef(isOpen);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  // Moods: idle | sleeping | smiling | winking | eating | singing
  const [mood, setMood] = useState('idle');
  const [blinkState, setBlinkState]       = useState(false);
  const [isWakingUp, setIsWakingUp]       = useState(false);
  const [isTalkingInternal, setIsTalkingInternal] = useState(false);

  const isSleeping = mood === 'sleeping';
  const isEating   = mood === 'eating';
  const isSinging  = mood === 'singing';
  const talking    = isTalking || isTalkingInternal;

  // Speech bubble
  const [bubble, setBubble] = useState({ visible: false, message: '' });
  const proMsgIdx     = useRef(0);
  const bubbleDismiss = useRef(null);
  const moodTimerRef  = useRef(null);

  const dismissBubble = useCallback(() => {
    setBubble({ visible: false, message: '' });
    setIsTalkingInternal(false);
    if (bubbleDismiss.current) clearTimeout(bubbleDismiss.current);
  }, []);

  const showBubble = useCallback((msg, durationMs = 7000) => {
    setBubble({ visible: true, message: msg });
    setIsTalkingInternal(true);
    if (bubbleDismiss.current) clearTimeout(bubbleDismiss.current);
    bubbleDismiss.current = setTimeout(() => {
      setBubble({ visible: false, message: '' });
      setIsTalkingInternal(false);
    }, durationMs);
  }, []);

  // ── Welcome Message ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (compact) return;
    const alreadyWelcomed = sessionStorage.getItem(WELCOME_KEY);
    if (!alreadyWelcomed) {
      sessionStorage.setItem(WELCOME_KEY, '1');
      const t = setTimeout(() => showBubble(WELCOME_MSG, 8000), 1800);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Reliable Proactive Messages ─────────────────────────────────────────────
  useEffect(() => {
    if (compact) return;
    const timer = setInterval(() => {
      if (isOpenRef.current) return;
      const msg = PROACTIVE_MESSAGES[proMsgIdx.current % PROACTIVE_MESSAGES.length];
      proMsgIdx.current++;
      showBubble(msg, 9000);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [compact, showBubble]);

  // ── Mouse tracking + Wake-up ────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const mx = 3.5; // Max pupil offset
    
    setEyeOffset({
      x: clamp((dx / dist) * mx, -mx, mx),
      y: clamp((dy / dist) * mx, -mx, mx),
    });

    // Slight 3D head tilt based on mouse position
    const tiltX = clamp((dx / window.innerWidth) * 15, -8, 8);
    setHeadTilt(tiltX);

    // Wake up logic
    const now = Date.now();
    const dt  = now - mouseVelRef.current.lt;
    if (dt > 0 && dt < 200) {
      const vx = (e.clientX - mouseVelRef.current.lx) / dt;
      const vy = (e.clientY - mouseVelRef.current.ly) / dt;
      const speed = Math.sqrt(vx * vx + vy * vy);
      
      const overRobot =
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top  && e.clientY <= rect.bottom;
        
      if (isSleeping && !isWakingUp && speed > 0.8 && overRobot) {
        setIsWakingUp(true);
        setMood('idle');
        setTimeout(() => setIsWakingUp(false), 800);
        scheduleNextMood();
      }
    }
    mouseVelRef.current = { lx: e.clientX, ly: e.clientY, lt: now };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSleeping, isWakingUp]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // ── Mood Scheduling ─────────────────────────────────────────────────────────
  const scheduleNextMood = useCallback(() => {
    if (moodTimerRef.current) clearTimeout(moodTimerRef.current);
    const delay = 8000 + Math.random() * 10000;
    moodTimerRef.current = setTimeout(() => {
      const rand = Math.random();
      if (rand < 0.25) {
        setMood('smiling');
        moodTimerRef.current = setTimeout(() => { setMood('idle'); scheduleNextMood(); }, 4000);
      } else if (rand < 0.50) {
        setMood('sleeping');
        moodTimerRef.current = setTimeout(() => { setMood('idle'); scheduleNextMood(); }, 12000 + Math.random() * 5000);
      } else if (rand < 0.65) {
        setMood('winking');
        moodTimerRef.current = setTimeout(() => { setMood('idle'); scheduleNextMood(); }, 2000);
      } else if (rand < 0.82) {
        setMood('eating');
        moodTimerRef.current = setTimeout(() => { setMood('idle'); scheduleNextMood(); }, 6500);
      } else {
        setMood('singing');
        moodTimerRef.current = setTimeout(() => { setMood('idle'); scheduleNextMood(); }, 7500);
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
    return () => { if (moodTimerRef.current) clearTimeout(moodTimerRef.current); };
  }, [isOpen, scheduleNextMood]);

  // ── Blinking logic ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isSleeping || mood === 'smiling') return;
    let t;
    const blink = () => {
      setBlinkState(true);
      setTimeout(() => setBlinkState(false), 120); // Faster, more realistic blink
      t = setTimeout(blink, 3000 + Math.random() * 4500);
    };
    t = setTimeout(blink, 2000);
    return () => clearTimeout(t);
  }, [isSleeping, mood]);

  // ── Animations ──────────────────────────────────────────────────────────────
  const bodyAnim = (() => {
    if (isWakingUp) return 'wake-up-spin 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
    if (isSleeping) return 'emo-sleep 3.5s ease-in-out infinite';
    if (mood === 'smiling') return 'emo-happy 1.2s ease-in-out infinite alternate';
    if (isEating) return 'emo-eat 1s ease-in-out infinite';
    if (isSinging) return 'emo-sing 1s ease-in-out infinite';
    return 'emo-idle 4s ease-in-out infinite';
  })();

  // ── PRO Digital Eyes ────────────────────────────────────────────────────────
  const renderDigitalEye = (side) => {
    const isClosed = passwordVisible === false || blinkState || isSleeping;
    const isSmiling = mood === 'smiling';
    const isWinking = mood === 'winking' && side === 'right';
    const isSingingMood = mood === 'singing';
    
    const ew = size * 0.23;
    const eh = size * 0.22;

    const eyeColor = '#45f3ff';
    const glowColor = 'rgba(69, 243, 255, 0.7)';

    let borderRadius = '32%'; 
    let heightStr = `${eh}px`;
    let widthStr = `${ew}px`;
    let transformStr = `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`;
    let marginY = '0px';
    let opacity = 1;

    if (isSleeping) {
      // PRO sleeping eyes (thin, slightly curved dashes)
      heightStr = '4px';
      widthStr = `${ew * 0.8}px`;
      borderRadius = '4px';
      opacity = 0.6;
      transformStr += ' scaleX(0.8) translateY(4px)';
    } else if (isClosed || isWinking) {
      // Normal blink or wink
      heightStr = '4px';
      borderRadius = '2px';
      transformStr += ' scaleX(0.9)';
    } else if (isSmiling) {
      // Happy eyes exactly matching user image (flat bottom, rounded top)
      borderRadius = '30px 30px 0 0';
      widthStr = `${ew * 1.1}px`;
      heightStr = `${eh * 0.55}px`;
      marginY = `${eh * 0.25}px`;
      transformStr += ' scale(1.05)';
    } else if (isSingingMood) {
      borderRadius = '45%';
      transformStr += ' scale(1.1)';
    }

    return (
      <div style={{
        width: widthStr, 
        height: heightStr, 
        marginTop: marginY,
        backgroundColor: eyeColor,
        borderRadius: borderRadius,
        opacity: opacity,
        boxShadow: `0 0 12px ${glowColor}, inset 0 0 5px rgba(255,255,255,0.8)`,
        transform: transformStr,
        transition: 'all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
        animation: talking ? 'emo-eye-talk 0.35s ease-in-out infinite' : (isSingingMood ? 'emo-eye-sing 0.5s ease-in-out infinite' : 'none'),
      }} />
    );
  };

  // ── PRO Digital Mouth ───────────────────────────────────────────────────────
  const renderDigitalMouth = () => {
    const isSmiling = mood === 'smiling';
    const isSingingMood = mood === 'singing';
    
    // Hide mouth by default
    let opacity = 0;
    let widthStr = '10px';
    let heightStr = '2px';
    let borderRadius = '2px';
    let background = '#45f3ff';
    let border = 'none';
    let borderTop = 'none';
    let animation = 'none';
    let transform = `translate(${eyeOffset.x * 0.8}px, ${eyeOffset.y * 0.8}px)`; // mouth tracks mouse slightly less than eyes

    if (talking && !isSleeping) {
      opacity = 1;
      background = '#45f3ff';
      animation = 'emo-mouth-talk 0.4s ease-in-out infinite';
    } else if (isSmiling) {
      opacity = 1;
      widthStr = '22px';
      heightStr = '10px';
      background = 'transparent';
      border = '3px solid #45f3ff';
      borderRadius = '0 0 18px 18px';
      borderTop = 'none';
      transform += ' translateY(2px)';
    } else if (isSingingMood) {
      opacity = 1;
      borderRadius = '50%';
      animation = 'emo-mouth-sing 0.6s ease-in-out infinite';
    } else if (isEating) {
      opacity = 1;
      widthStr = '8px';
      heightStr = '8px';
      borderRadius = '50%';
      animation = 'emo-mouth-eat 0.5s ease-in-out infinite alternate';
    }

    return (
      <div style={{
        position: 'absolute',
        top: `${size * 0.62}px`, // Below eyes
        left: '50%',
        transform: `translateX(-50%) ${transform}`,
        width: widthStr,
        height: heightStr,
        backgroundColor: background,
        border: border,
        borderTop: borderTop,
        borderRadius: borderRadius,
        opacity: opacity,
        boxShadow: opacity > 0 ? `0 0 10px rgba(69, 243, 255, 0.6)` : 'none',
        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        animation: animation,
      }} />
    );
  };

  const s = size;

  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'relative', width: s, height: s, 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        perspective: '200px', // For 3D head tilt
      }}
    >
      {!compact && (
        <SpeechBubble
          message={bubble.message}
          visible={bubble.visible && !isOpen}
          onDismiss={dismissBubble}
          isTalking={isTalkingInternal}
        />
      )}

      {!compact && isSleeping && !isOpen && (
        <div style={{ position: 'absolute', top: 0, right: '-5px', zIndex: 15, pointerEvents: 'none' }}>
          <ZzzParticle delay={0} />
          <ZzzParticle delay={1} />
        </div>
      )}

      {!compact && isSinging && !isOpen && (
        <div style={{ position: 'absolute', top: 0, left: '-5px', zIndex: 15, pointerEvents: 'none' }}>
          <NoteParticle delay={0} symbol="♪" offsetX={0} />
          <NoteParticle delay={1} symbol="♫" offsetX={15} />
          <NoteParticle delay={2} symbol="♩" offsetX={-5} />
        </div>
      )}

      {isEating && !isOpen && <CoffeeCup size={s} />}

      {/* Main Animated Wrapper for EMO */}
      <div style={{
        animation: bodyAnim,
        transformOrigin: 'center bottom',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
        width: '100%', height: '100%', position: 'relative',
        transform: `rotateY(${headTilt}deg)`,
        transition: 'transform 0.15s ease-out',
        transformStyle: 'preserve-3d',
      }}>
        
        {/* SVG Drawing of EMO */}
        <svg width={s} height={s * 0.9} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={`emo-body-${s}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#374151" />
              <stop offset="100%" stopColor="#111827" />
            </linearGradient>
            
            <linearGradient id={`emo-face-${s}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#111318" />
              <stop offset="100%" stopColor="#020406" />
            </linearGradient>

            <filter id={`shadow-${s}`}>
              <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.45" />
            </filter>
            <filter id={`hp-glow-${s}`}>
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#4fc3f7" floodOpacity="0.9" />
            </filter>
          </defs>

          {/* Left Leg */}
          <rect x="34" y="86" width="9" height="12" rx="4" fill="#0f172a" style={{ transformOrigin: '38px 86px', animation: isSinging ? 'emo-leg-left 0.5s ease-in-out infinite' : 'none' }} />
          {/* Right Leg */}
          <rect x="57" y="86" width="9" height="12" rx="4" fill="#0f172a" style={{ transformOrigin: '61px 86px', animation: isSinging ? 'emo-leg-right 0.5s ease-in-out infinite 0.25s' : 'none' }} />

          {/* Left Headphone */}
          <rect x="5" y="34" width="9" height="32" rx="4" fill="#1e293b" filter={`url(#shadow-${s})`} />
          <circle cx="9" cy="50" r="3.5" fill="#4fc3f7" filter={`url(#hp-glow-${s})`} style={{ animation: (talking || isSinging) ? 'emo-headphone-pulse 1s infinite' : 'none' }} />
          
          {/* Right Headphone */}
          <rect x="86" y="34" width="9" height="32" rx="4" fill="#1e293b" filter={`url(#shadow-${s})`} />
          <circle cx="91" cy="50" r="3.5" fill="#4fc3f7" filter={`url(#hp-glow-${s})`} style={{ animation: (talking || isSinging) ? 'emo-headphone-pulse 1s infinite' : 'none' }} />

          {/* Main Body/Head Casing */}
          <rect x="11" y="10" width="78" height="78" rx="22" fill={`url(#emo-body-${s})`} filter={`url(#shadow-${s})`} />
          
          {/* Top highlight for 3D effect */}
          <path d="M 33 12 L 67 12 Q 87 12 87 32 L 87 35 Q 87 16 67 16 L 33 16 Q 13 16 13 35 L 13 32 Q 13 12 33 12 Z" fill="#ffffff" opacity="0.12" />

          {/* Screen Face */}
          <rect x="17" y="17" width="66" height="64" rx="16" fill={`url(#emo-face-${s})`} />
          
          {/* Screen reflection */}
          <path d="M 17 35 Q 35 25 83 19 L 83 29 Q 50 37 17 47 Z" fill="#ffffff" opacity="0.05" />
        </svg>

        {/* Cyan Eyes (HTML overlay for CSS manipulation) */}
        <div style={{
          position: 'absolute',
          top: `${s * 0.33}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: `${s * 0.09}px`,
          alignItems: 'center',
          zIndex: 2,
        }}>
          {renderDigitalEye('left')}
          {renderDigitalEye('right')}
        </div>

        {/* PRO Dynamic Mouth */}
        {renderDigitalMouth()}

      </div>
    </div>
  );
};

export default RobotAvatar;

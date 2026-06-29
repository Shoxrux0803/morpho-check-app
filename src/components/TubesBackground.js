import React, { useEffect, useRef, useState } from 'react';
import { useThemeMode } from '../providers/ThemeProviderMUI';

export default function TubesBackground() {
  const containerRef = useRef(null);
  const initialized = useRef(false);
  const appRef = useRef(null);
  const { mode } = useThemeMode();
  const [weatherData, setWeatherData] = useState(null);

  // Listen to weather updates
  useEffect(() => {
    const handleWeather = (e) => setWeatherData(e.detail);
    window.addEventListener('weather-update', handleWeather);
    return () => window.removeEventListener('weather-update', handleWeather);
  }, []);

  // Parallax effect on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        !appRef.current ||
        !appRef.current.three ||
        !appRef.current.three.camera
      )
        return;
      const scrollY = window.scrollY;
      const maxScroll = Math.max(
        1,
        document.body.scrollHeight - window.innerHeight
      );
      const scrollRatio = Math.min(scrollY / maxScroll, 1);

      // Default Z is 5. Pushing back to 20 for depth effect
      appRef.current.three.camera.position.z = 5 + scrollRatio * 15;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getColors = (isDark, weather) => {
    let tubesColors = isDark
      ? ['#f967fb', '#53bc28', '#6958d5']
      : ['#0369a1', '#047857', '#4338ca'];
    let lightsColors = isDark
      ? ['#83f36e', '#fe8a2e', '#ff008a', '#60aed5']
      : ['#0284c7', '#059669', '#4f46e5', '#be185d'];

    if (weather) {
      const { temp, code } = weather;
      if (temp >= 28) {
        // Hot weather -> Fire colors
        tubesColors = ['#ff4500', '#ff8c00', '#ff003c'];
        lightsColors = ['#ff6347', '#ff4500', '#ffa500', '#ff8c00'];
      } else if (
        (code >= 51 && code <= 67) ||
        (code >= 80 && code <= 82) ||
        code >= 95
      ) {
        // Rainy/Stormy -> Deep blues
        tubesColors = isDark
          ? ['#00bfff', '#1e90ff', '#0000ff']
          : ['#075985', '#1d4ed8', '#3730a3'];
        lightsColors = isDark
          ? ['#87ceeb', '#4682b4', '#4169e1', '#0000cd']
          : ['#0369a1', '#1e40af', '#312e81', '#0f766e'];
      } else if ((code >= 71 && code <= 86) || temp <= 5) {
        // Snowy/Cold -> Ice colors
        tubesColors = isDark
          ? ['#e0ffff', '#add8e6', '#b0e0e6']
          : ['#0f766e', '#2563eb', '#7c3aed'];
        lightsColors = isDark
          ? ['#ffffff', '#f0f8ff', '#e6e6fa', '#d8bfd8']
          : ['#0d9488', '#1d4ed8', '#6d28d9', '#be185d'];
      }
    }

    return {
      tubes: tubesColors,
      lights: lightsColors,
      bg: isDark ? '#000000' : '#ffffff',
    };
  };

  const currentTheme = getColors(mode === 'dark', weatherData);

  // Update colors dynamically when mode or weather changes
  useEffect(() => {
    if (appRef.current) {
      appRef.current.tubes.setColors(currentTheme.tubes);
      appRef.current.tubes.setLightsColors(currentTheme.lights);
    }
  }, [mode, weatherData]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      // Create a canvas manually to ensure it's always a canvas
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      const canvasEl = document.createElement('canvas');
      canvasEl.id = 'tubes-canvas';
      canvasEl.style.width = '100%';
      canvasEl.style.height = '100%';
      canvasEl.style.display = 'block';
      if (containerRef.current) {
        containerRef.current.appendChild(canvasEl);
      }

      const script = document.createElement('script');
      script.type = 'module';
      script.innerHTML = `
        import TubesCursor from "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js";
        window.initTubesAnim = (el, initColors) => {
          // Intercept pointermove to apply custom smoothing and roaming
          const origAdd = document.body.addEventListener;
          let tubesPointerMove = null;
          let tubesPointerLeave = null;
          
          document.body.addEventListener = function(type, listener, options) {
            if (type === 'pointermove') {
              tubesPointerMove = listener;
            } else if (type === 'pointerleave') {
              tubesPointerLeave = listener; // Suppress it to prevent snapping/resetting
            } else {
              origAdd.call(this, type, listener, options);
            }
          };

          const app = TubesCursor(el, {
            sleepRadiusX: 250,
            sleepRadiusY: 250,
            sleepTimeScale1: 1.2,
            sleepTimeScale2: 1.5,
            tubes: {
              colors: initColors.tubes,
              lights: {
                intensity: 200,
                colors: initColors.lights
              }
            }
          });

          // Restore native addEventListener
          document.body.addEventListener = origAdd;

          // Smooth mouse tracking loop & Autonomous roaming
          let targetX = window.innerWidth / 2;
          let targetY = window.innerHeight / 2;
          let currentX = targetX;
          let currentY = targetY;
          let lastEvent = { clientX: targetX, clientY: targetY, pageX: targetX, pageY: targetY, preventDefault: ()=>{}, stopPropagation: ()=>{} };
          
          let lastMouseTime = 0; // 0 so it starts roaming immediately
          let mouseActive = false;

          const onPointerMove = (e) => {
            targetX = e.clientX;
            targetY = e.clientY;
            lastEvent = e;
            lastMouseTime = Date.now();
            mouseActive = true;
          };
          window.addEventListener('pointermove', onPointerMove);

          let time = Math.random() * 100; // Randomize start phase

          const smoothLoop = () => {
             const now = Date.now();
             
             // If mouse is inactive for 1.5 seconds, start roaming automatically
             if (now - lastMouseTime > 1500) {
               mouseActive = false;
             }

             if (!mouseActive) {
               time += 0.006;
               const cx = window.innerWidth / 2;
               const cy = window.innerHeight / 2;
               const rx = window.innerWidth * 0.35; // Roam within 35% of screen width
               const ry = window.innerHeight * 0.35;
               
               // Complex Lissajous curve for natural organic movement
               targetX = cx + Math.sin(time * 1.1) * Math.cos(time * 0.82) * rx;
               targetY = cy + Math.sin(time * 1.34) * Math.cos(time * 0.91) * ry;
             }

             // Adjust lerp speed: very smooth for roaming, snappier for mouse tracking
             const lerpSpeed = mouseActive ? 0.035 : 0.012;
             currentX += (targetX - currentX) * lerpSpeed; 
             currentY += (targetY - currentY) * lerpSpeed;
             
             if (tubesPointerMove && lastEvent) {
               // Create a mock event with interpolated coordinates
               const fakeE = Object.create(lastEvent);
               Object.defineProperties(fakeE, {
                 clientX: { value: currentX },
                 clientY: { value: currentY },
                 pageX: { value: currentX + window.scrollX },
                 pageY: { value: currentY + window.scrollY }
               });
               tubesPointerMove(fakeE);
             }
             app._smoothId = requestAnimationFrame(smoothLoop);
          };
          smoothLoop();
          
          // Cleanup
          const origDestroy = app.destroy;
          app.destroy = function() {
            window.removeEventListener('pointermove', onPointerMove);
            cancelAnimationFrame(app._smoothId);
            if (origDestroy) origDestroy.call(this);
          };

          return app;
        };
      `;
      document.head.appendChild(script);

      // Wait a bit for module to load
      await new Promise((r) => setTimeout(r, 600));

      if (window.initTubesAnim && canvasEl) {
        try {
          // Pass the INITIAL theme colors based on current mode
          const isDarkNow =
            document.documentElement.classList.contains('dark') ||
            document.body.dataset.theme === 'dark' ||
            window.localStorage.getItem('theme') === 'dark';
          appRef.current = window.initTubesAnim(canvasEl, getColors(isDarkNow));

          const handleClick = () => {
            if (!appRef.current) return;
            const rc = (c) =>
              new Array(c).fill(0).map(
                () =>
                  '#' +
                  Math.floor(Math.random() * 16777215)
                    .toString(16)
                    .padStart(6, '0')
              );
            appRef.current.tubes.setColors(rc(3));
            appRef.current.tubes.setLightsColors(rc(4));
          };

          window.addEventListener('click', handleClick);
          window._tubesClick = handleClick;
        } catch (err) {
          console.error('Tubes Anim Error:', err);
        }
      }
    };

    init();

    return () => {
      if (appRef.current && typeof appRef.current.destroy === 'function') {
        appRef.current.destroy();
      }
      if (window._tubesClick) {
        window.removeEventListener('click', window._tubesClick);
      }
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        overflow: 'hidden',
        zIndex: 0,
        backgroundColor: currentTheme.bg,
        transition: 'background-color 0.5s ease',
        pointerEvents: 'none',
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          filter:
            mode === 'dark'
              ? 'none'
              : 'invert(1) hue-rotate(180deg) saturate(1.8) contrast(1.12)',
        }}
      />

      {/* Blur Overlay to improve text readability and ensure correct theme tint */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor:
            mode === 'dark'
              ? 'rgba(0, 0, 0, 0.5)'
              : 'rgba(255, 255, 255, 0.18)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          transition: 'background-color 0.5s ease',
          zIndex: 1,
        }}
      />
    </div>
  );
}

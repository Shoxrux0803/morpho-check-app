import React, { useEffect, useMemo, useRef, useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useThemeMode } from '../providers/ThemeProviderMUI';

const getColors = (isDark, weather) => {
  let tubes = isDark
    ? ['#f967fb', '#53bc28', '#6958d5']
    : ['#0369a1', '#047857', '#4338ca'];
  let lights = isDark
    ? ['#83f36e', '#fe8a2e', '#ff008a', '#60aed5']
    : ['#0284c7', '#059669', '#4f46e5', '#be185d'];

  if (weather) {
    const temp = Number(weather.temp);
    const code = Number(weather.code);

    if (Number.isFinite(temp) && temp >= 28) {
      tubes = ['#ff4500', '#ff8c00', '#ff003c'];
      lights = ['#ff6347', '#ff4500', '#ffa500', '#ff8c00'];
    } else if (
      Number.isFinite(code) &&
      ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95)
    ) {
      tubes = isDark
        ? ['#00bfff', '#1e90ff', '#0000ff']
        : ['#075985', '#1d4ed8', '#3730a3'];
      lights = isDark
        ? ['#87ceeb', '#4682b4', '#4169e1', '#0000cd']
        : ['#0369a1', '#1e40af', '#312e81', '#0f766e'];
    } else if (
      (Number.isFinite(code) && code >= 71 && code <= 86) ||
      (Number.isFinite(temp) && temp <= 5)
    ) {
      tubes = isDark
        ? ['#e0ffff', '#add8e6', '#b0e0e6']
        : ['#0f766e', '#2563eb', '#7c3aed'];
      lights = isDark
        ? ['#ffffff', '#f0f8ff', '#e6e6fa', '#d8bfd8']
        : ['#0d9488', '#1d4ed8', '#6d28d9', '#be185d'];
    }
  }

  return {
    tubes,
    lights,
    background: isDark ? '#000000' : '#ffffff',
  };
};

export default function TubesBackground({ variant = 'default' }) {
  const isWelcome = variant === 'welcome';
  const canvasRef = useRef(null);
  const appRef = useRef(null);
  const themeRef = useRef(null);
  const { mode } = useThemeMode();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const compactViewport = useMediaQuery('(max-width: 768px)');
  const [weatherData, setWeatherData] = useState(null);
  const [animationAvailable, setAnimationAvailable] = useState(true);

  useEffect(() => {
    const handleWeather = (event) => setWeatherData(event.detail || null);
    window.addEventListener('weather-update', handleWeather);
    return () => window.removeEventListener('weather-update', handleWeather);
  }, []);

  const currentTheme = useMemo(
    () =>
      isWelcome
        ? {
            tubes:
              mode === 'dark'
                ? ['#2dd4bf', '#38bdf8', '#a78bfa']
                : ['#14b8a6', '#38bdf8', '#c4a460'],
            lights: ['#5eead4', '#7dd3fc', '#a78bfa', '#f8d593'],
            background: mode === 'dark' ? '#0d1917' : '#f8faf7',
          }
        : getColors(mode === 'dark', weatherData),
    [mode, weatherData, isWelcome]
  );
  themeRef.current = currentTheme;

  useEffect(() => {
    const app = appRef.current;
    if (!app?.tubes) return;
    app.tubes.setColors(currentTheme.tubes);
    app.tubes.setLightsColors(currentTheme.lights);
  }, [currentTheme]);

  useEffect(() => {
    if (reduceMotion || !canvasRef.current) return undefined;

    let app;
    let cancelled = false;

    const initialize = async () => {
      try {
        const probe = document.createElement('canvas');
        const context = probe.getContext('webgl2');
        if (context) {
          context.getExtension('WEBGL_lose_context')?.loseContext();
        } else {
          const adapter = await navigator.gpu?.requestAdapter();
          if (!adapter) {
            if (!cancelled) setAnimationAvailable(false);
            return;
          }
        }
        const { default: TubesCursor } =
          await import('threejs-components/build/cursors/tubes1.min.js');
        if (cancelled || !canvasRef.current) return;

        const initialTheme = themeRef.current;
        app = TubesCursor(canvasRef.current, {
          sleepRadiusX: isWelcome ? 440 : 250,
          sleepRadiusY: isWelcome ? 280 : 250,
          sleepTimeScale1: isWelcome ? 0.55 : 1.2,
          sleepTimeScale2: isWelcome ? 0.8 : 1.5,
          ...(isWelcome
            ? { bloom: { threshold: 0.2, strength: 1.05, radius: 0.4 } }
            : {}),
          tubes: {
            ...(isWelcome
              ? {
                  count: compactViewport ? 6 : 10,
                  minTubularSegments: 24,
                  maxTubularSegments: 64,
                  minRadius: 0.055,
                  maxRadius: 0.18,
                  material: { metalness: 0.45, roughness: 0.22 },
                  noise: 0.035,
                }
              : {}),
            colors: initialTheme.tubes,
            lights: {
              intensity: 200,
              colors: initialTheme.lights,
            },
          },
        });
        if (app.three) {
          app.three.fpsLimit = compactViewport ? 24 : 40;
          if (isWelcome) {
            app.three.minPixelRatio = 1;
            app.three.maxPixelRatio = compactViewport ? 1 : 1.5;
            app.three.resize();
          }
        }
        appRef.current = app;
        setAnimationAvailable(true);
      } catch {
        if (!cancelled) {
          appRef.current = null;
          setAnimationAvailable(false);
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
      appRef.current = null;
      if (typeof app?.dispose === 'function') app.dispose();
    };
  }, [compactViewport, reduceMotion, isWelcome]);

  useEffect(() => {
    if (reduceMotion) return undefined;
    let frameId = 0;

    const handleScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        const camera = appRef.current?.three?.camera;
        if (!camera) return;
        const maxScroll = Math.max(
          1,
          document.documentElement.scrollHeight - window.innerHeight
        );
        camera.position.z = 5 + Math.min(window.scrollY / maxScroll, 1) * 15;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [reduceMotion]);

  const showCanvas = !reduceMotion && animationAvailable;

  return (
    <div
      aria-hidden="true"
      className={isWelcome ? 'welcome-tubes-background' : undefined}
      data-animation={showCanvas ? 'active' : 'fallback'}
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        zIndex: 0,
        backgroundColor: isWelcome ? 'transparent' : currentTheme.background,
        transition: reduceMotion ? 'none' : 'background-color 0.5s ease',
        pointerEvents: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: showCanvas ? 'block' : 'none',
          width: '100%',
          height: '100%',
          filter:
            mode === 'dark' || isWelcome
              ? 'none'
              : 'invert(1) hue-rotate(180deg) saturate(1.8) contrast(1.12)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: isWelcome
            ? 'transparent'
            : mode === 'dark'
              ? 'rgba(0, 0, 0, 0.5)'
              : 'rgba(255, 255, 255, 0.18)',
          backdropFilter:
            isWelcome || reduceMotion || compactViewport ? 'none' : 'blur(6px)',
          WebkitBackdropFilter:
            isWelcome || reduceMotion || compactViewport ? 'none' : 'blur(6px)',
          transition: reduceMotion ? 'none' : 'background-color 0.5s ease',
          zIndex: 1,
        }}
      />
    </div>
  );
}

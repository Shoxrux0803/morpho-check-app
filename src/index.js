// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';

// CSS (importlar hammasi tepada)
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/motion.css';
import './index.css';
import '@fontsource-variable/inter';

// Tema util + MUI provider — ham importlar qatorida
import { applyTheme, getStoredTheme } from './utils/theme';
import ThemeProviderMUI from './providers/ThemeProviderMUI';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const disableNoisyWebGpuRenderer = () => {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) return;

  try {
    Object.defineProperty(Navigator.prototype, 'gpu', {
      configurable: true,
      get: () => undefined,
    });
  } catch {
    try {
      Object.defineProperty(navigator, 'gpu', {
        configurable: true,
        value: undefined,
      });
    } catch {}
  }
};
/* eslint-disable no-console */
const installDevConsoleNoiseFilter = () => {
  if (process.env.NODE_ENV !== 'development') return;

  const ignoredErrorMessages = [
    'React Router Future Flag Warning',
    'MUI Grid: The `item` prop has been removed',
    'MUI Grid: The `xs` prop has been removed',
    'MUI Grid: The `sm` prop has been removed',
    'MUI Grid: The `md` prop has been removed',
    'MUI Grid: The `lg` prop has been removed',
    'WARNING: Multiple instances of Three.js being imported.',
    'Blocked aria-hidden on an element because its descendant retained focus.',
    'Texture size ([Extent3D',
    'exceeded maximum texture size',
    'The texture size ([Extent3D',
    '[Invalid Texture',
    '[Invalid TextureView',
    '[Invalid BindGroup',
    '[Invalid CommandBuffer',
    'Could not create the swapchain texture.',
    'ValidateTextureSize',
    'APIInjectError',
    'ResizeObserver loop completed with undelivered notifications',
    'ResizeObserver loop limit exceeded',
  ];

  const shouldIgnoreError = (args) =>
    ignoredErrorMessages.some((message) =>
      args.some((arg) => String(arg).includes(message))
    );

  const isIgnoredResizeObserverError = (value) => {
    const message = String(value?.message || value || '');
    return (
      message.includes('ResizeObserver loop completed with undelivered notifications') ||
      message.includes('ResizeObserver loop limit exceeded')
    );
  };

  window.addEventListener(
    'error',
    (event) => {
      if (!isIgnoredResizeObserverError(event.error || event.message)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      if (!isIgnoredResizeObserverError(event.reason)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true
  );

  const originalError = console.error;
  console.warn = () => {};
  console.error = (...args) => {
    if (shouldIgnoreError(args)) return;
    originalError(...args);
  };
};
/* eslint-enable no-console */

// Importlardan KEYIN boshlang'ich tema
disableNoisyWebGpuRenderer();
installDevConsoleNoiseFilter();
applyTheme(getStoredTheme());

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProviderMUI>
      <App />
    </ThemeProviderMUI>
  </React.StrictMode>
);

reportWebVitals();

const clearDevelopmentCaches = async () => {
  if (process.env.NODE_ENV !== 'development') return;
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
};

if (process.env.NODE_ENV === 'development') {
  serviceWorkerRegistration.unregister();
  clearDevelopmentCaches().catch(() => {});
} else {
  // If you want your app to work offline and load faster, you can change
  // unregister() to register() below. Note this comes with some pitfalls.
  // Learn more about service workers: https://cra.link/PWA
  serviceWorkerRegistration.register();
}

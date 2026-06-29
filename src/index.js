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

const installDevConsoleNoiseFilter = () => {
  if (process.env.NODE_ENV !== 'development') return;

  const ignoredMessages = [
    'React Router Future Flag Warning',
    'MUI Grid: The `item` prop has been removed',
    'MUI Grid: The `xs` prop has been removed',
    'MUI Grid: The `sm` prop has been removed',
    'MUI Grid: The `md` prop has been removed',
    'MUI Grid: The `lg` prop has been removed',
    'WARNING: Multiple instances of Three.js being imported.',
    'Blocked aria-hidden on an element because its descendant retained focus.',
  ];

  const shouldIgnore = (args) =>
    ignoredMessages.some((message) =>
      args.some((arg) => typeof arg === 'string' && arg.includes(message))
    );

  ['warn', 'error'].forEach((level) => {
    const original = console[level];
    console[level] = (...args) => {
      if (shouldIgnore(args)) return;
      original(...args);
    };
  });
};

// Importlardan KEYIN boshlang'ich tema
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

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();
// rebuild

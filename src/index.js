// src/index.js
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

// CSS (importlar hammasi tepada)
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/motion.css";
import "./index.css";
import "@fontsource-variable/inter";

// Tema util + MUI provider — ham importlar qatorida
import { applyTheme, getStoredTheme } from "./utils/theme";
import ThemeProviderMUI from "./providers/ThemeProviderMUI";

// Importlardan KEYIN boshlang'ich tema
applyTheme(getStoredTheme());

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProviderMUI>
      <App />
    </ThemeProviderMUI>
  </React.StrictMode>,
);

reportWebVitals();
// rebuild

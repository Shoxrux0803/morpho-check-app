// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",                    // <— MUHIM
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}",       // <— Hamma fayllar qamralsin
  ],
  theme: { extend: {} },
  plugins: [],
};

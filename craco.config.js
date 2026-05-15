// craco.config.js
const path = require("path");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const axiosRoot = path.dirname(require.resolve("axios/package.json"));

      webpackConfig.resolve = webpackConfig.resolve || {};
      webpackConfig.resolve.alias = {
        ...(webpackConfig.resolve.alias || {}),
        axios: path.join(axiosRoot, "dist/esm/axios.js"),
      };

      // Source-map-loader'ni mediapipe fayllaridan istisno qilish
      webpackConfig.module.rules.forEach((rule) => {
        if (rule.loader && rule.loader.includes("source-map-loader")) {
          rule.exclude = /@mediapipe/;
        }
      });
      return webpackConfig;
    },
  },
  devServer: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
        logLevel: "debug",
      },
    },
  },
  jest: {
    configure: {
      moduleNameMapper: {
        "^@mediapipe/tasks-vision$": "<rootDir>/src/__mocks__/mediapipe.js",
      },
    },
  },
};

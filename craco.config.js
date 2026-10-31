// craco.config.js
const path = require("path");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const axiosRoot = path.dirname(require.resolve("axios/package.json"));

      // CRA shares a single ESLint result cache between the dev server and
      // production builds. Concurrent runs can restore stale formatting errors.
      // Keep lint checks enabled and always read the current source files.
      webpackConfig.plugins.forEach((plugin) => {
        if (plugin.constructor.name === "ESLintWebpackPlugin") {
          plugin.options.cache = false;
        }
      });

      webpackConfig.resolve = webpackConfig.resolve || {};
      webpackConfig.resolve.alias = {
        ...(webpackConfig.resolve.alias || {}),
        axios: path.join(axiosRoot, "dist/esm/axios.js"),
      };

      webpackConfig.module.rules.push({
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      });

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

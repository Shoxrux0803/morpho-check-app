// craco.config.js
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Source-map-loader'ni mediapipe fayllaridan istisno qilish
      webpackConfig.module.rules.forEach(rule => {
        if (rule.loader && rule.loader.includes('source-map-loader')) {
          rule.exclude = /@mediapipe/;
        }
      });
      return webpackConfig;
    }
  },
  jest: {
    configure: {
      moduleNameMapping: {
        '^@mediapipe/tasks-vision$': '<rootDir>/src/__mocks__/mediapipe.js'
      }
    }
  }
};
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
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug',
      },
    },
  },
  jest: {
    configure: {
      moduleNameMapping: {
        '^@mediapipe/tasks-vision$': '<rootDir>/src/__mocks__/mediapipe.js'
      }
    }
  }
};
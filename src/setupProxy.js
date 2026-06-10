const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_PROXY_TARGET || 'http://127.0.0.1:8000',
      changeOrigin: true,
      secure: false, // development rejimida self-signed certlar uchun foydali bo'lishi mumkin
    })
  );
};

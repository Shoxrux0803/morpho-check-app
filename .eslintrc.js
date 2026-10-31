module.exports = {
  extends: ['react-app', 'react-app/jest', 'prettier'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
    'no-unused-vars': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }]
  }
};

// Apps call /api/v1/...; the real API serves /v1/... and the Prism mock serves from the root.
const mock = process.env.API_MOCK === 'true';
const target =
  process.env.API_TARGET || (mock ? 'http://localhost:4010' : 'http://localhost:3000');

module.exports = {
  '/api': {
    target,
    secure: false,
    changeOrigin: true,
    pathRewrite: mock ? { '^/api/v1': '' } : { '^/api': '' },
  },
};

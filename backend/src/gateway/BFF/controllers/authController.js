const { proxyAuthRequest } = require('../services/authService');
const { fetchTextOrJson } = require('../services/proxyService');

function registerAuthRoutes(app, fetchImpl) {
  app.post(['/auth/login', '/auth/register', '/api/auth/login', '/api/auth/register'], async (req, res) => {
    try {
      const response = await proxyAuthRequest(req, fetchImpl);
      const payload = await fetchTextOrJson(response);
      return res.status(response.status).type('application/json').send(payload || '{}');
    } catch (err) {
      return res.status(502).json({ error: 'auth_proxy_error', details: err.message });
    }
  });
}

module.exports = { registerAuthRoutes };

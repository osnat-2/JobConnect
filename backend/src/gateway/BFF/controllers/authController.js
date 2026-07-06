const { proxyAuthRequest } = require('../services/authService');

function registerAuthRoutes(app, fetchImpl) {
  app.post(['/auth/login', '/auth/register'], async (req, res) => {
    try {
      const response = await proxyAuthRequest(req, fetchImpl);
      const payload = await response.json();
      return res.status(response.status).json(payload);
    } catch (err) {
      return res.status(502).json({ error: 'auth_proxy_error', details: err.message });
    }
  });
}

module.exports = { registerAuthRoutes };

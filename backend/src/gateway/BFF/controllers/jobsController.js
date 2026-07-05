const { fetchTextOrJson } = require('../services/proxyService');

function registerJobsRoutes(app, fetchImpl) {
  app.get(['/jobs', '/jobs/:path(*)'], async (req, res) => {
    const jobServiceUrl = process.env.JOB_SERVICE_URL || 'http://job-service:80';
    const pathSuffix = req.params.path ? `/${req.params.path}` : '';
    const targetUrl = `${jobServiceUrl}/Jobs${pathSuffix}${req._parsedUrl.search || ''}`;

    try {
      const response = await fetchImpl(targetUrl, {
        headers: { 'x-correlation-id': req.correlationId }
      });
      const payload = await fetchTextOrJson(response);
      return res.status(response.status).type('application/json').send(payload || '{}');
    } catch (err) {
      return res.status(502).json({ error: 'downstream_error', details: err.message });
    }
  });
}

module.exports = { registerJobsRoutes };
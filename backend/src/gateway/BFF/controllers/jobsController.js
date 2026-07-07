const { fetchTextOrJson } = require('../services/proxyService');
const { buildForwardHeaders } = require('../services/authService');

function registerJobsRoutes(app, fetchImpl) {
  app.get(['/jobs', '/jobs/:path(*)', '/api/jobs', '/api/jobs/:path(*)'], async (req, res) => {
    const jobServiceUrl = process.env.JOB_SERVICE_URL || 'http://job-service:80';
    const pathSuffix = req.params.path ? `/${req.params.path}` : '';
    const targetUrl = `${jobServiceUrl}/Jobs${pathSuffix}${req._parsedUrl.search || ''}`;

    try {
      const response = await fetchImpl(targetUrl, {
        headers: buildForwardHeaders(req)
      });
      const payload = await fetchTextOrJson(response);
      return res.status(response.status).type('application/json').send(payload || '{}');
    } catch (err) {
      return res.status(502).json({ error: 'downstream_error', details: err.message });
    }
  });

  app.post(['/jobs', '/api/jobs'], async (req, res) => {
    const jobServiceUrl = process.env.JOB_SERVICE_URL || 'http://job-service:80';

    try {
      const response = await fetchImpl(`${jobServiceUrl}/Jobs`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...buildForwardHeaders(req)
        },
        body: JSON.stringify(req.body || {})
      });
      const payload = await fetchTextOrJson(response);
      return res.status(response.status).type('application/json').send(payload || '{}');
    } catch (err) {
      return res.status(502).json({ error: 'downstream_error', details: err.message });
    }
  });

  app.post('/api/applications', async (req, res) => {
    const applicationServiceUrl = process.env.APPLICATION_SERVICE_URL || 'http://application-service:80';
    const requestBody = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
      ? req.body
      : (req.body || {});

    try {
      const response = await fetchImpl(`${applicationServiceUrl}/api/Applications`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...buildForwardHeaders(req)
        },
        body: JSON.stringify(requestBody)
      });
      const text = await response.text();
      let payload = '{}';
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = text;
        }
      }
      return res.status(response.status).type('application/json').send(payload || '{}');
    } catch (err) {
      return res.status(502).json({ error: 'downstream_error', details: err.message });
    }
  });

  app.patch('/api/applications/:id/status', async (req, res) => {
    const applicationServiceUrl = process.env.APPLICATION_SERVICE_URL || 'http://application-service:80';
    const { id } = req.params;

    try {
      const statusPayload = typeof req.body === 'number'
        ? req.body
        : (typeof req.body === 'string' ? req.body : req.body?.status ?? 1);

      const response = await fetchImpl(`${applicationServiceUrl}/api/Applications/${id}/status`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          ...buildForwardHeaders(req)
        },
        body: JSON.stringify(statusPayload)
      });
      const payload = await fetchTextOrJson(response);
      return res.status(response.status).type('application/json').send(payload || '{}');
    } catch (err) {
      return res.status(502).json({ error: 'downstream_error', details: err.message });
    }
  });
}

module.exports = { registerJobsRoutes };
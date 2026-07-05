const { fetchWithRetry } = require('../services/proxyService');

function registerKanbanRoutes(app, fetchImpl) {
  app.get(['/aggregate/kanban', '/aggregate/kanban/:candidateId'], async (req, res) => {
    const { candidateId } = req.params;
    if (!candidateId || candidateId.trim() === '') {
      return res.status(400).json({ error: 'invalid_request', message: 'candidateId is required.' });
    }

    const applicationServiceUrl = process.env.APPLICATION_SERVICE_URL || 'http://application-service:80';
    const candidateServiceUrl = process.env.CANDIDATE_SERVICE_URL || 'http://candidate-service:80';

    try {
      const [applicationResp, candidateResp] = await Promise.all([
        fetchWithRetry(fetchImpl, `${applicationServiceUrl}/api/Applications/${candidateId}`, {
          headers: { 'x-correlation-id': req.correlationId }
        }),
        fetchImpl(`${candidateServiceUrl}/api/Candidates/${candidateId}`, {
          headers: { 'x-correlation-id': req.correlationId }
        })
      ]);

      if (!applicationResp.ok || !candidateResp.ok) {
        const status = applicationResp.ok ? candidateResp.status : applicationResp.status;
        return res.status(status).json({
          error: 'downstream_error',
          message: 'One or more downstream services returned an error.'
        });
      }

      const [application, candidate] = await Promise.all([
        applicationResp.json(),
        candidateResp.json()
      ]);

      return res.json({ application, candidate });
    } catch (err) {
      return res.status(502).json({ error: 'downstream_error', details: err.message });
    }
  });
}

module.exports = { registerKanbanRoutes };
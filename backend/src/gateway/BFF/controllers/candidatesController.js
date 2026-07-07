const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { buildForwardHeaders } = require('../services/authService');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const candidateId = req.params.id;
    const storagePath = path.join(process.cwd(), 'uploads', candidateId);
    fs.mkdirSync(storagePath, { recursive: true });
    cb(null, storagePath);
  },
  filename: (req, file, cb) => cb(null, file.originalname),
});

const upload = multer({ storage });

function registerCandidatesRoutes(app, fetchImpl) {
  const candidateServiceUrl = process.env.CANDIDATE_SERVICE_URL || 'http://candidate-service:80';
  const bffBaseUrl = process.env.BFF_BASE_URL || 'http://bff:8080';
  const uploadRoot = process.env.UPLOAD_ROOT || path.join(process.cwd(), 'uploads');
  fs.mkdirSync(uploadRoot, { recursive: true });

  app.get(['/candidates', '/api/candidates'], async (req, res) => {
    const targetUrl = `${candidateServiceUrl}/api/Candidates${req._parsedUrl.search || ''}`;

    try {
      const response = await fetchImpl(targetUrl, {
        headers: buildForwardHeaders(req)
      });
      const payload = await response.json();
      return res.status(response.status).json(payload);
    } catch (err) {
      return res.status(502).json({ error: 'candidates_proxy_error', details: err.message });
    }
  });

  app.get(['/candidates/:id', '/api/candidates/:id'], async (req, res) => {
    const targetUrl = `${candidateServiceUrl}/api/Candidates/${req.params.id}`;

    try {
      const response = await fetchImpl(targetUrl, {
        headers: buildForwardHeaders(req)
      });
      const payload = await response.json();
      return res.status(response.status).json(payload);
    } catch (err) {
      return res.status(502).json({ error: 'candidates_proxy_error', details: err.message });
    }
  });

  app.get(['/candidates/:id/documents/:documentId', '/api/candidates/:id/documents/:documentId'], async (req, res) => {
    const targetUrl = `${candidateServiceUrl}/api/candidates/${req.params.id}/documents/${req.params.documentId}`;

    try {
      const response = await fetchImpl(targetUrl, {
        headers: buildForwardHeaders(req)
      });
      const payload = await response.json();
      return res.status(response.status).json(payload);
    } catch (err) {
      return res.status(502).json({ error: 'candidates_proxy_error', details: err.message });
    }
  });

  app.post(['/candidates', '/api/candidates'], async (req, res) => {
    try {
      const response = await fetchImpl(`${candidateServiceUrl}/api/Candidates`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...buildForwardHeaders(req)
        },
        body: JSON.stringify(req.body || {})
      });

      const text = await response.text();
      let payload = {};
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = { raw: text };
        }
      }

      return res.status(response.status).json(payload);
    } catch (err) {
      return res.status(502).json({ error: 'candidates_proxy_error', details: err.message });
    }
  });

  app.delete(['/candidates/:id', '/api/candidates/:id'], async (req, res) => {
    try {
      const response = await fetchImpl(`${candidateServiceUrl}/api/Candidates/${req.params.id}`, {
        method: 'DELETE',
        headers: buildForwardHeaders(req)
      });
      const payload = await response.text();
      return res.status(response.status).send(payload || '');
    } catch (err) {
      return res.status(502).json({ error: 'candidates_proxy_error', details: err.message });
    }
  });

  app.post(['/candidates/:id/resume', '/api/candidates/:id/resume'], upload.single('file'), async (req, res) => {
    const candidateId = req.params.id;
    if (!req.file) {
      return res.status(400).json({ error: 'bad_request', message: 'Resume file is required.' });
    }

    const file = req.file;
    const filePath = file.path || path.join(uploadRoot, candidateId, file.originalname);
    const safeFileName = path.basename(file.originalname);
    const storageUrl = `${bffBaseUrl}/files/${encodeURIComponent(candidateId)}/${encodeURIComponent(safeFileName)}`;
    const body = {
      candidateId,
      fileName: file.originalname,
      storageUrl,
      fileType: file.mimetype
    };

    try {
      const response = await fetchImpl(`${candidateServiceUrl}/api/candidates/${candidateId}/documents`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...buildForwardHeaders(req)
        },
        body: JSON.stringify(body)
      });
      const payload = await response.json();
      return res.status(response.status).json(payload);
    } catch (err) {
      return res.status(502).json({ error: 'resume_upload_error', details: err.message });
    }
  });
}

module.exports = { registerCandidatesRoutes };

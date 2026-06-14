const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 8080;

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Example aggregation endpoint for Kanban
app.get('/aggregate/kanban/:candidateId', async (req, res) => {
  const candidateId = req.params.candidateId;
  try {
    const appResp = await fetch(`http://application-service:80/applications/${candidateId}`);
    const candResp = await fetch(`http://candidate-service:80/candidates/${candidateId}`);
    const appJson = await appResp.json();
    const candJson = await candResp.json();
    return res.json({ application: appJson, candidate: candJson });
  } catch (err) {
    return res.status(502).json({ error: 'downstream_error', details: err.message });
  }
});

app.listen(PORT, () => console.log(`BFF listening on ${PORT}`));

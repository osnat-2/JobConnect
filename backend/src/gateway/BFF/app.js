const express = require('express');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { createAuthMiddleware } = require('./services/authService');
const loggerPath = fs.existsSync(path.resolve(__dirname, 'shared/nodejs/logger'))
  ? path.resolve(__dirname, 'shared/nodejs/logger')
  : path.resolve(__dirname, '../../../shared/nodejs/logger');
const { createRequestLogger } = require(loggerPath);
const { registerHealthRoutes } = require('./controllers/healthController');
const { registerJobsRoutes } = require('./controllers/jobsController');
const { registerKanbanRoutes } = require('./controllers/kanbanController');
const { registerAuthRoutes } = require('./controllers/authController');
const { registerCandidatesRoutes } = require('./controllers/candidatesController');

function createApp({ fetchImpl = global.fetch || require('node-fetch') } = {}) {
  const app = express();
  const uploadFolder = path.join(process.cwd(), 'uploads');
  fs.mkdirSync(uploadFolder, { recursive: true });

  app.use(express.json());
  app.use(createRequestLogger());
  app.use((req, res, next) => {
    const correlationId = req.header('x-correlation-id') || crypto.randomUUID();
    req.correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type,Authorization,X-Correlation-ID,X-User-Id,X-User-Email,X-User-Roles'
    );

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  });

  app.use('/files', express.static(uploadFolder));
  app.use(createAuthMiddleware());

  registerHealthRoutes(app);
  registerAuthRoutes(app, fetchImpl);
  registerCandidatesRoutes(app, fetchImpl);
  registerJobsRoutes(app, fetchImpl);
  registerKanbanRoutes(app, fetchImpl);

  return app;
}

module.exports = { createApp };
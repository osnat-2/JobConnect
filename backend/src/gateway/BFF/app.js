const express = require('express');
const crypto = require('node:crypto');
const { createAuthMiddleware } = require('./services/authService');
const { createRequestLogger } = require('@jobconnect/shared-nodejs/logger');
const { registerHealthRoutes } = require('./controllers/healthController');
const { registerJobsRoutes } = require('./controllers/jobsController');
const { registerKanbanRoutes } = require('./controllers/kanbanController');
const { registerAuthRoutes } = require('./controllers/authController');

function createApp({ fetchImpl = global.fetch || require('node-fetch') } = {}) {
  const app = express();

  app.use(express.json());
  app.use(createRequestLogger());
  app.use((req, res, next) => {
    const correlationId = req.header('x-correlation-id') || crypto.randomUUID();
    req.correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);
    next();
  });

  app.use(createAuthMiddleware());

  registerHealthRoutes(app);
  registerAuthRoutes(app, fetchImpl);
  registerJobsRoutes(app, fetchImpl);
  registerKanbanRoutes(app, fetchImpl);

  return app;
}

module.exports = { createApp };
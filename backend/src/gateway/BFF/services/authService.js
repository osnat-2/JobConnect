const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:80';

function extractBearerToken(req) {
  const authHeader = req.header('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice('Bearer '.length).trim();
}

function isAuthenticatedRequest(req) {
  return Boolean(extractBearerToken(req));
}

function createAuthMiddleware() {
  return (req, res, next) => {
    if (process.env.AUTH_REQUIRED === 'true' && !isAuthenticatedRequest(req)) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'A valid bearer token is required.'
      });
    }

    const token = extractBearerToken(req);
    req.auth = {
      token,
      userId: null,
      email: null,
      roles: []
    };

    if (token) {
      req.auth.userId = req.header('x-user-id') || null;
      req.auth.email = req.header('x-user-email') || null;
      req.auth.roles = (req.header('x-user-roles') || '').split(',').filter(Boolean);
    }

    if (req.headers.authorization) {
      delete req.headers.authorization;
    }

    next();
  };
}

function buildForwardHeaders(req) {
  const headers = {
    'x-correlation-id': req.correlationId
  };

  if (req.auth?.userId) {
    headers['x-user-id'] = req.auth.userId;
  }

  if (req.auth?.email) {
    headers['x-user-email'] = req.auth.email;
  }

  if (req.auth?.roles?.length) {
    headers['x-user-roles'] = req.auth.roles.join(',');
  }

  return headers;
}

async function proxyAuthRequest(req, fetchImpl = global.fetch || require('node-fetch')) {
  const targetUrl = `${AUTH_SERVICE_URL}/api/auth/${req.path.split('/').pop()}`;
  const body = JSON.stringify(req.body || {});

  return fetchImpl(targetUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...buildForwardHeaders(req)
    },
    body
  });
}

module.exports = {
  extractBearerToken,
  isAuthenticatedRequest,
  createAuthMiddleware,
  buildForwardHeaders,
  proxyAuthRequest
};

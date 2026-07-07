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

function decodeJwtPayload(token) {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) {
      return null;
    }

    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const jsonPayload = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function extractUserFromToken(token) {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const userId = payload.sub || payload.nameid || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || null;
  const email = payload.email || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || null;

  const roles = [];
  const roleValues = [];

  if (typeof payload.role === 'string') {
    roleValues.push(payload.role);
  }

  if (typeof payload.roles === 'string') {
    roleValues.push(payload.roles);
  }

  if (Array.isArray(payload.roles)) {
    roleValues.push(...payload.roles);
  }

  const microsoftRole = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  if (typeof microsoftRole === 'string') {
    roleValues.push(microsoftRole);
  }

  if (Array.isArray(microsoftRole)) {
    roleValues.push(...microsoftRole);
  }

  roleValues.forEach((role) => {
    if (typeof role === 'string') {
      role
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .forEach((value) => roles.push(value));
    }
  });

  return {
    userId,
    email,
    roles: Array.from(new Set(roles))
  };
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
    const tokenUser = token ? extractUserFromToken(token) : null;

    req.auth = {
      token,
      userId: req.header('x-user-id') || tokenUser?.userId || null,
      email: req.header('x-user-email') || tokenUser?.email || null,
      roles: (req.header('x-user-roles') || '').split(',').filter(Boolean)
    };

    if (req.auth.roles.length === 0 && tokenUser?.roles?.length) {
      req.auth.roles = tokenUser.roles;
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
  const body = req.body && Object.keys(req.body).length ? JSON.stringify(req.body) : null;
  const headers = {
    'content-type': req.header('content-type') || 'application/json',
    accept: req.header('accept') || 'application/json',
    ...buildForwardHeaders(req)
  };

  return fetchImpl(targetUrl, {
    method: 'POST',
    headers,
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

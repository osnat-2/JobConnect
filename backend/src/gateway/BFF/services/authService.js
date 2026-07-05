function isAuthenticatedRequest(req) {
  const authHeader = req.header('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  const expectedToken = process.env.AUTH_TOKEN || 'development-token';
  return token === expectedToken;
}

function createAuthMiddleware() {
  return (req, res, next) => {
    if (process.env.AUTH_REQUIRED === 'true' && !isAuthenticatedRequest(req)) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'A valid bearer token is required.'
      });
    }

    next();
  };
}

module.exports = {
  isAuthenticatedRequest,
  createAuthMiddleware
};

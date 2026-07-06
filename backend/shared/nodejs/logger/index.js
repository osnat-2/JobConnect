function createRequestLogger() {
  return (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      console.log(JSON.stringify({
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs,
        correlationId: req.correlationId || null
      }));
    });
    next();
  };
}

module.exports = {
  createRequestLogger
};

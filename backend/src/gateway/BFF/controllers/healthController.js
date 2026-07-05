function registerHealthRoutes(app) {
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', correlationId: req.correlationId });
  });
}

module.exports = { registerHealthRoutes };
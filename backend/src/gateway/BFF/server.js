const { createApp } = require('./app');

const app = createApp();
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`BFF listening on ${PORT}`);
});

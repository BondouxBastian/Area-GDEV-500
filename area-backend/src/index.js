require('dotenv').config();

const app = require('./app');
const { demarrerHooks } = require('./hooks/runner');

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  demarrerHooks();
});

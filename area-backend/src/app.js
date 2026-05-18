const express = require('express');
const cors = require('cors');

const SERVICES = require('./services');

const app = express();

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

app.use('/auth', require('./routes/auth'));
app.use('/services', require('./routes/services'));
app.use('/areas', require('./routes/areas'));

app.get('/about.json', (req, res) => {
  const services = Object.values(SERVICES).map((svc) => ({
    name: svc.id,
    actions: svc.actions.map((a) => ({ name: a.id, description: a.description })),
    reactions: svc.reactions.map((r) => ({ name: r.id, description: r.description })),
  }));

  res.json({
    client: {
      host: req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress,
    },
    server: {
      current_time: Math.floor(Date.now() / 1000),
      services,
    },
  });
});

// Gestion centralisée des erreurs inattendues
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[erreur]', err.message);
  res.status(500).json({ error: 'Erreur interne du serveur.' });
});

module.exports = app;

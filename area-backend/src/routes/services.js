const express = require('express');
const db = require('../db');
const SERVICES = require('../services');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET /services
// Retourne la liste de tous les services disponibles.
// Si l'utilisateur est connecté, chaque service indique s'il est souscrit.
router.get('/', (req, res) => {
  // Tentative de lecture du token sans bloquer les non-connectés
  let userId = null;
  try {
    const jwt = require('jsonwebtoken');
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
      userId = payload.sub;
    }
  } catch {
    // Token absent ou invalide : on continue en mode non-authentifié
  }

  let souscriptions = new Set();
  if (userId) {
    const rows = db.prepare('SELECT service_id FROM user_services WHERE user_id = ?').all(userId);
    souscriptions = new Set(rows.map((r) => r.service_id));
  }

  const liste = Object.values(SERVICES).map((svc) => ({
    ...svc,
    subscribed: souscriptions.has(svc.id),
  }));

  res.json(liste);
});

// POST /services/:id/subscribe
// Souscrit l'utilisateur au service indiqué.
// Le token OAuth du service (si nécessaire) est passé dans le corps de la requête.
router.post('/:id/subscribe', requireAuth, (req, res) => {
  const { id } = req.params;
  const { oauthToken } = req.body;

  if (!SERVICES[id]) {
    return res.status(404).json({ error: `Service "${id}" introuvable.` });
  }

  // Si aucun token fourni par le client, on essaie d'utiliser le token OAuth
  // stocké lors de la connexion (pour GitHub et Gmail notamment)
  let tokenFinal = oauthToken || null;
  if (!tokenFinal) {
    const oauthRow = db.prepare(
      'SELECT access_token FROM user_oauth WHERE user_id = ? AND provider = ?'
    ).get(req.user.id, id);
    tokenFinal = oauthRow?.access_token || null;
  }

  db.prepare(`
    INSERT INTO user_services (user_id, service_id, oauth_token)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, service_id) DO UPDATE SET oauth_token = excluded.oauth_token
  `).run(req.user.id, id, tokenFinal);

  res.json({ message: `Souscription au service "${SERVICES[id].name}" confirmée.` });
});

// DELETE /services/:id/subscribe
// Résilie la souscription de l'utilisateur au service.
router.delete('/:id/subscribe', requireAuth, (req, res) => {
  const { id } = req.params;

  if (!SERVICES[id]) {
    return res.status(404).json({ error: `Service "${id}" introuvable.` });
  }

  const result = db.prepare(
    'DELETE FROM user_services WHERE user_id = ? AND service_id = ?'
  ).run(req.user.id, id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Souscription introuvable.' });
  }

  res.json({ message: `Souscription au service "${SERVICES[id].name}" résiliée.` });
});

module.exports = router;

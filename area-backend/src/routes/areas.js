const express = require('express');
const db = require('../db');
const SERVICES = require('../services');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Transforme une ligne de la table areas en objet JSON prêt à être renvoyé au client.
// On parse les configs JSON stockées en texte et on enrichit avec le nom des actions/réactions.
function formaterArea(row) {
  const actionService = SERVICES[row.action_service];
  const reactionService = SERVICES[row.reaction_service];

  const actionDef = actionService?.actions.find((a) => a.id === row.action_id);
  const reactionDef = reactionService?.reactions.find((r) => r.id === row.reaction_id);

  return {
    id: row.id,
    name: row.name,
    active: row.active === 1,
    action: {
      service: row.action_service,
      id: row.action_id,
      name: actionDef?.name || row.action_id,
      config: JSON.parse(row.action_config),
    },
    reaction: {
      service: row.reaction_service,
      id: row.reaction_id,
      name: reactionDef?.name || row.reaction_id,
      config: JSON.parse(row.reaction_config),
    },
    runs: row.runs,
    created_at: row.created_at,
  };
}

// Vérifie que le couple service/action ou service/réaction est valide dans le catalogue.
function validerCouple(serviceId, componentId, type) {
  const service = SERVICES[serviceId];
  if (!service) return `Service "${serviceId}" inconnu.`;

  const liste = type === 'action' ? service.actions : service.reactions;
  const existe = liste.some((c) => c.id === componentId);
  if (!existe) return `${type === 'action' ? 'Action' : 'Réaction'} "${componentId}" inconnue pour le service "${serviceId}".`;

  return null;
}

// GET /areas
// Retourne toutes les automatisations de l'utilisateur connecté.
router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM areas WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);

  res.json(rows.map(formaterArea));
});

// POST /areas
// Crée une nouvelle automatisation.
// Corps attendu : { name, action: { service, id, config? }, reaction: { service, id, config? } }
router.post('/', requireAuth, (req, res) => {
  const { name, action, reaction } = req.body;

  if (!action?.service || !action?.id) {
    return res.status(400).json({ error: "L'action est incomplète (service et id requis)." });
  }
  if (!reaction?.service || !reaction?.id) {
    return res.status(400).json({ error: 'La réaction est incomplète (service et id requis).' });
  }

  const erreurAction = validerCouple(action.service, action.id, 'action');
  if (erreurAction) return res.status(400).json({ error: erreurAction });

  const erreurReaction = validerCouple(reaction.service, reaction.id, 'reaction');
  if (erreurReaction) return res.status(400).json({ error: erreurReaction });

  // Un nom par défaut est généré si l'utilisateur n'en a pas fourni
  const nomFinal = name?.trim() || `${SERVICES[action.service].name} → ${SERVICES[reaction.service].name}`;

  const result = db.prepare(`
    INSERT INTO areas (user_id, name, action_service, action_id, action_config, reaction_service, reaction_id, reaction_config)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.user.id,
    nomFinal,
    action.service,
    action.id,
    JSON.stringify(action.config || {}),
    reaction.service,
    reaction.id,
    JSON.stringify(reaction.config || {}),
  );

  const row = db.prepare('SELECT * FROM areas WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(formaterArea(row));
});

// PUT /areas/:id
// Remplace complètement une automatisation (action, réaction, nom).
router.put('/:id', requireAuth, (req, res) => {
  const area = db.prepare(
    'SELECT * FROM areas WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);

  if (!area) return res.status(404).json({ error: 'Automatisation introuvable.' });

  const { name, action, reaction } = req.body;

  if (action) {
    const erreur = validerCouple(action.service, action.id, 'action');
    if (erreur) return res.status(400).json({ error: erreur });
  }
  if (reaction) {
    const erreur = validerCouple(reaction.service, reaction.id, 'réaction');
    if (erreur) return res.status(400).json({ error: erreur });
  }

  db.prepare(`
    UPDATE areas SET
      name             = ?,
      action_service   = ?,
      action_id        = ?,
      action_config    = ?,
      reaction_service = ?,
      reaction_id      = ?,
      reaction_config  = ?
    WHERE id = ?
  `).run(
    name?.trim() || area.name,
    action?.service || area.action_service,
    action?.id || area.action_id,
    JSON.stringify(action?.config ?? JSON.parse(area.action_config)),
    reaction?.service || area.reaction_service,
    reaction?.id || area.reaction_id,
    JSON.stringify(reaction?.config ?? JSON.parse(area.reaction_config)),
    area.id,
  );

  const updated = db.prepare('SELECT * FROM areas WHERE id = ?').get(area.id);
  res.json(formaterArea(updated));
});

// PATCH /areas/:id
// Mise à jour partielle — utilisée principalement pour activer/désactiver une automatisation.
router.patch('/:id', requireAuth, (req, res) => {
  const area = db.prepare(
    'SELECT * FROM areas WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);

  if (!area) return res.status(404).json({ error: 'Automatisation introuvable.' });

  const { active, name } = req.body;

  if (active !== undefined) {
    db.prepare('UPDATE areas SET active = ? WHERE id = ?').run(active ? 1 : 0, area.id);
  }
  if (name !== undefined) {
    db.prepare('UPDATE areas SET name = ? WHERE id = ?').run(name.trim(), area.id);
  }

  const updated = db.prepare('SELECT * FROM areas WHERE id = ?').get(area.id);
  res.json(formaterArea(updated));
});

// DELETE /areas/:id
// Supprime une automatisation (et son historique de déclenchements, via CASCADE).
router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare(
    'DELETE FROM areas WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.user.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Automatisation introuvable.' });
  }

  res.json({ message: 'Automatisation supprimée.' });
});

module.exports = router;

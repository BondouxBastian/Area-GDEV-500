const express = require('express');
const db = require('../db');
const requireAdmin = require('../middleware/admin');

const router = express.Router();

// Toutes les routes de ce fichier sont réservées aux administrateurs
router.use(requireAdmin);

// GET /admin/users — liste tous les utilisateurs
router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT id, name, email, is_admin, created_at,
           (SELECT COUNT(*) FROM areas WHERE user_id = users.id) AS areas_count
    FROM users
    ORDER BY created_at DESC
  `).all();

  res.json(users.map((u) => ({ ...u, is_admin: !!u.is_admin })));
});

// PATCH /admin/users/:id — promouvoir ou rétrograder un utilisateur
router.patch('/users/:id', (req, res) => {
  const { id } = req.params;
  const { is_admin } = req.body;

  if (Number(id) === req.user.id)
    return res.status(400).json({ error: 'Vous ne pouvez pas modifier vos propres droits.' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

  db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(is_admin ? 1 : 0, id);
  const updated = db.prepare('SELECT id, name, email, is_admin FROM users WHERE id = ?').get(id);
  res.json({ ...updated, is_admin: !!updated.is_admin });
});

// DELETE /admin/users/:id — supprimer un utilisateur (et ses données en cascade)
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;

  if (Number(id) === req.user.id)
    return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' });

  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  if (result.changes === 0)
    return res.status(404).json({ error: 'Utilisateur introuvable.' });

  res.json({ message: 'Utilisateur supprimé.' });
});

// GET /admin/stats — statistiques globales de la plateforme
router.get('/stats', (req, res) => {
  const stats = {
    users:  db.prepare('SELECT COUNT(*) AS count FROM users').get().count,
    areas:  db.prepare('SELECT COUNT(*) AS count FROM areas').get().count,
    active: db.prepare('SELECT COUNT(*) AS count FROM areas WHERE active = 1').get().count,
    runs:   db.prepare('SELECT COALESCE(SUM(runs), 0) AS total FROM areas').get().total,
  };
  res.json(stats);
});

module.exports = router;

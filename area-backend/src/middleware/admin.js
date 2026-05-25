const jwt = require('jsonwebtoken');

// Middleware qui vérifie que l'utilisateur est connecté ET administrateur.
// À utiliser après requireAuth ou en remplacement si on veut tout-en-un.
function requireAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token manquant.' });

  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    if (!payload.is_admin)
      return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
    req.user = { id: payload.sub, email: payload.email, is_admin: true };
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
}

module.exports = requireAdmin;

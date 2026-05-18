const jwt = require('jsonwebtoken');

// Middleware d'authentification : vérifie le JWT dans l'en-tête Authorization.
// En cas de succès, injecte req.user avec l'id et l'email de l'utilisateur.
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou malformé.' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
}

module.exports = requireAuth;

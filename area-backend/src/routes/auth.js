const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

// Durée de validité des tokens JWT
const TOKEN_EXPIRY = '7d';

// Génère un JWT signé pour l'utilisateur donné
function genererToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

// Formate la réponse utilisateur renvoyée au client (on n'expose jamais le hash)
function formaterUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

// POST /auth/register
// Crée un compte avec email + mot de passe.
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nom, e-mail et mot de passe sont requis.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
  }

  const existant = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existant) {
    return res.status(409).json({ error: 'Un compte existe déjà avec cet e-mail.' });
  }

  const hash = await bcrypt.hash(password, 12);

  const result = db.prepare(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
  ).run(name, email, hash);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ token: genererToken(user), user: formaterUser(user) });
});

// POST /auth/login
// Authentification classique email + mot de passe.
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail et mot de passe sont requis.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !user.password_hash) {
    // On renvoie la même erreur pour ne pas révéler si l'adresse existe
    return res.status(401).json({ error: 'Identifiants invalides.' });
  }

  const valide = await bcrypt.compare(password, user.password_hash);
  if (!valide) {
    return res.status(401).json({ error: 'Identifiants invalides.' });
  }

  res.json({ token: genererToken(user), user: formaterUser(user) });
});

// POST /auth/oauth/:provider
// Connexion via un fournisseur OAuth (Google, GitHub...).
// Le client effectue le flux OAuth côté navigateur et nous transmet le token d'accès.
// On récupère les infos de l'utilisateur auprès du fournisseur, puis on crée
// ou met à jour le compte local correspondant.
router.post('/oauth/:provider', async (req, res) => {
  const { provider } = req.params;
  const { token: accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ error: 'Token OAuth manquant.' });
  }

  const fournisseursSupports = ['google', 'github'];
  if (!fournisseursSupports.includes(provider)) {
    return res.status(400).json({ error: `Fournisseur "${provider}" non pris en charge.` });
  }

  try {
    const infos = await recupererInfosOAuth(provider, accessToken);

    // Cherche un compte OAuth existant pour ce fournisseur + identifiant
    let oauthRow = db.prepare(
      'SELECT * FROM user_oauth WHERE provider = ? AND provider_user_id = ?'
    ).get(provider, infos.providerId);

    let user;

    if (oauthRow) {
      // Le fournisseur est déjà lié à un compte : on met à jour le token
      db.prepare('UPDATE user_oauth SET access_token = ? WHERE id = ?')
        .run(accessToken, oauthRow.id);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(oauthRow.user_id);
    } else {
      // Nouvelle liaison : on cherche un compte par e-mail, ou on en crée un
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(infos.email);

      if (!user) {
        const result = db.prepare(
          'INSERT INTO users (name, email) VALUES (?, ?)'
        ).run(infos.name, infos.email);
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      }

      db.prepare(
        'INSERT INTO user_oauth (user_id, provider, provider_user_id, access_token) VALUES (?, ?, ?, ?)'
      ).run(user.id, provider, infos.providerId, accessToken);
    }

    res.json({ token: genererToken(user), user: formaterUser(user) });
  } catch (err) {
    console.error(`Erreur OAuth ${provider}:`, err.message);
    res.status(401).json({ error: 'Authentification OAuth échouée.' });
  }
});

// Interroge l'API du fournisseur pour obtenir les informations de l'utilisateur connecté.
// Retourne { providerId, email, name }.
async function recupererInfosOAuth(provider, accessToken) {
  if (provider === 'google') {
    const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) throw new Error('Réponse Google invalide');
    const data = await resp.json();
    return { providerId: data.sub, email: data.email, name: data.name };
  }

  if (provider === 'github') {
    const resp = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'AREA-App' },
    });
    if (!resp.ok) throw new Error('Réponse GitHub invalide');
    const data = await resp.json();

    // L'e-mail peut être null si l'utilisateur l'a masqué dans ses paramètres GitHub
    let email = data.email;
    if (!email) {
      const emailsResp = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'AREA-App' },
      });
      if (emailsResp.ok) {
        const emails = await emailsResp.json();
        const principal = emails.find((e) => e.primary && e.verified);
        email = principal ? principal.email : `github_${data.id}@noreply.github.com`;
      }
    }

    return { providerId: String(data.id), email, name: data.name || data.login };
  }

  throw new Error(`Fournisseur inconnu : ${provider}`);
}

module.exports = router;

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

const TOKEN_EXPIRY = '7d';

// Génère un JWT signé pour l'utilisateur donné
function genererToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name, is_admin: user.is_admin || 0 },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

function formaterUser(user) {
  return { id: user.id, name: user.name, email: user.email, is_admin: !!user.is_admin };
}

// ─── Email / Mot de passe ─────────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Nom, e-mail et mot de passe sont requis.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });

  const existant = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existant)
    return res.status(409).json({ error: 'Un compte existe déjà avec cet e-mail.' });

  const hash = await bcrypt.hash(password, 12);
  const result = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(name, email, hash);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ token: genererToken(user), user: formaterUser(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'E-mail et mot de passe sont requis.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !user.password_hash)
    return res.status(401).json({ error: 'Identifiants invalides.' });

  const valide = await bcrypt.compare(password, user.password_hash);
  if (!valide)
    return res.status(401).json({ error: 'Identifiants invalides.' });

  res.json({ token: genererToken(user), user: formaterUser(user) });
});

// ─── OAuth — initiation ───────────────────────────────────────────────────────
// Le backend construit l'URL d'autorisation et redirige le navigateur vers le
// fournisseur. Le secret ne quitte jamais le serveur.

router.get('/oauth/:provider/init', (req, res) => {
  const { provider } = req.params;
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8081';

  if (provider === 'google') {
    if (!process.env.GOOGLE_CLIENT_ID)
      return res.status(500).json({ error: 'GOOGLE_CLIENT_ID non configuré.' });

    const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const params = new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID,
      redirect_uri:  `${backendUrl}/auth/oauth/google/callback`,
      response_type: 'code',
      scope:         'openid email profile',
      access_type:   'offline',
      prompt:        'select_account',
    });
    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  }

  if (provider === 'github') {
    if (!process.env.GITHUB_CLIENT_ID)
      return res.status(500).json({ error: 'GITHUB_CLIENT_ID non configuré.' });

    const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
    const params = new URLSearchParams({
      client_id:    process.env.GITHUB_CLIENT_ID,
      redirect_uri: `${backendUrl}/auth/oauth/github/callback`,
      // public_repo permet de lire les issues et PRs des dépôts publics
      scope:        'read:user user:email public_repo',
    });
    return res.redirect(`https://github.com/login/oauth/authorize?${params}`);
  }

  res.redirect(`${FRONTEND_URL}?oauth_error=Fournisseur+non+supporté`);
});

// ─── OAuth — callback ─────────────────────────────────────────────────────────
// Google / GitHub redirige ici après que l'utilisateur a accepté.
// On échange le code contre un token, on crée ou récupère l'utilisateur,
// puis on redirige le frontend avec le JWT dans l'URL.

router.get('/oauth/:provider/callback', async (req, res) => {
  const { provider } = req.params;
  const { code, error } = req.query;
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8081';

  if (error || !code) {
    return res.redirect(`${FRONTEND_URL}?oauth_error=Connexion+annulée`);
  }

  try {
    const infos = await echangerCodeOAuth(provider, code, req);
    const user = trouverOuCreerUtilisateur(provider, infos);
    const token = genererToken(user);
    // On passe le JWT dans l'URL — le frontend le lit et le stocke dans localStorage
    res.redirect(`${FRONTEND_URL}?token=${token}`);
  } catch (err) {
    console.error(`[oauth/${provider}]`, err.message);
    res.redirect(`${FRONTEND_URL}?oauth_error=Échec+de+l'authentification`);
  }
});

// ─── Helpers OAuth ────────────────────────────────────────────────────────────

// Échange le code d'autorisation contre un token d'accès puis récupère
// les informations du profil utilisateur auprès du fournisseur.
async function echangerCodeOAuth(provider, code, req) {
  // Utilise BACKEND_URL si défini, sinon reconstruit depuis la requête
  const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;

  if (provider === 'google') {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri:  `${backendUrl}/auth/oauth/google/callback`,
        grant_type:    'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('Token Google invalide');

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();
    return { providerId: profile.sub, email: profile.email, name: profile.name, accessToken: tokenData.access_token };
  }

  if (provider === 'github') {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri:  `${backendUrl}/auth/oauth/github/callback`,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('Token GitHub invalide');

    const profileRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'AREA-App' },
    });
    const profile = await profileRes.json();

    // L'e-mail peut être masqué par l'utilisateur dans ses paramètres GitHub
    let email = profile.email;
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'AREA-App' },
      });
      const emails = await emailsRes.json();
      const principal = emails.find((e) => e.primary && e.verified);
      email = principal ? principal.email : `github_${profile.id}@noreply.github.com`;
    }

    return { providerId: String(profile.id), email, name: profile.name || profile.login, accessToken: tokenData.access_token };
  }

  throw new Error(`Fournisseur inconnu : ${provider}`);
}

// Cherche un compte existant lié à ce fournisseur OAuth, ou en crée un nouveau.
function trouverOuCreerUtilisateur(provider, infos) {
  let oauthRow = db.prepare(
    'SELECT * FROM user_oauth WHERE provider = ? AND provider_user_id = ?'
  ).get(provider, infos.providerId);

  let user;

  if (oauthRow) {
    // Met à jour le token d'accès à chaque connexion (il peut avoir été renouvelé)
    if (infos.accessToken) {
      db.prepare('UPDATE user_oauth SET access_token = ? WHERE id = ?')
        .run(infos.accessToken, oauthRow.id);
    }
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(oauthRow.user_id);
  } else {
    // Rattache à un compte existant par e-mail si possible
    user = db.prepare('SELECT * FROM users WHERE email = ?').get(infos.email);
    if (!user) {
      const result = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)').run(infos.name, infos.email);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    }
    // On stocke aussi le token d'accès pour pouvoir l'utiliser dans les hooks
    db.prepare(
      'INSERT INTO user_oauth (user_id, provider, provider_user_id, access_token) VALUES (?, ?, ?, ?)'
    ).run(user.id, provider, infos.providerId, infos.accessToken || null);
  }

  return user;
}

module.exports = router;

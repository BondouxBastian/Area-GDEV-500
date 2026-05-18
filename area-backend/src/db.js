const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/area.db');

// Création du dossier data s'il n'existe pas encore
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(DB_PATH);

// WAL améliore les performances en lecture concurrente
db.pragma('journal_mode = WAL');
// Les contraintes de clés étrangères ne sont pas actives par défaut sous SQLite
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    email        TEXT    UNIQUE NOT NULL,
    password_hash TEXT,
    created_at   INTEGER DEFAULT (strftime('%s', 'now'))
  );

  -- Comptes OAuth liés à un utilisateur (Google, GitHub...)
  CREATE TABLE IF NOT EXISTS user_oauth (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider         TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    access_token     TEXT,
    UNIQUE(provider, provider_user_id)
  );

  -- Abonnements de l'utilisateur aux services (Gmail, GitHub, Discord...)
  CREATE TABLE IF NOT EXISTS user_services (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id  TEXT NOT NULL,
    oauth_token TEXT,
    created_at  INTEGER DEFAULT (strftime('%s', 'now')),
    UNIQUE(user_id, service_id)
  );

  -- Automatisations créées par les utilisateurs
  CREATE TABLE IF NOT EXISTS areas (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    active           INTEGER NOT NULL DEFAULT 1,
    action_service   TEXT NOT NULL,
    action_id        TEXT NOT NULL,
    action_config    TEXT NOT NULL DEFAULT '{}',
    reaction_service TEXT NOT NULL,
    reaction_id      TEXT NOT NULL,
    reaction_config  TEXT NOT NULL DEFAULT '{}',
    runs             INTEGER NOT NULL DEFAULT 0,
    created_at       INTEGER DEFAULT (strftime('%s', 'now'))
  );

  -- Historique des déclenchements pour éviter les doublons (idempotence)
  CREATE TABLE IF NOT EXISTS area_triggers (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    area_id      INTEGER NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    trigger_key  TEXT NOT NULL,
    triggered_at INTEGER DEFAULT (strftime('%s', 'now'))
  );
`);

module.exports = db;

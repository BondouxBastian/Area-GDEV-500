const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Ces variables d'environnement doivent être définies AVANT le premier require
// de n'importe quel module de l'app, car db.js lit DB_PATH à l'initialisation.
const TEST_DB_PATH = path.join(__dirname, '../data/area_test.db');
process.env.DB_PATH = TEST_DB_PATH;
process.env.JWT_SECRET = 'secret_jest_uniquement';
process.env.NODE_ENV = 'test';

const app = require('../src/app');

// Nettoyage de la base de test après l'exécution de la suite
afterAll(() => {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
});

// ─── /about.json ─────────────────────────────────────────────────────────────

describe('GET /about.json', () => {
  it('retourne le statut 200 et la structure requise par le sujet', async () => {
    const res = await request(app).get('/about.json');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('client.host');
    expect(res.body).toHaveProperty('server.current_time');
    expect(Array.isArray(res.body.server.services)).toBe(true);
    expect(res.body.server.services.length).toBeGreaterThan(0);

    // Chaque service doit exposer ses actions et réactions
    const premierService = res.body.server.services[0];
    expect(premierService).toHaveProperty('name');
    expect(Array.isArray(premierService.actions)).toBe(true);
    expect(Array.isArray(premierService.reactions)).toBe(true);
  });
});

// ─── Inscription ─────────────────────────────────────────────────────────────

describe('POST /auth/register', () => {
  it('crée un compte et retourne un token JWT', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'motdepasse' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user.email).toBe('alice@test.com');
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('refuse un e-mail déjà utilisé avec 409', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Alice2', email: 'alice@test.com', password: 'autremotdepasse' });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  it('refuse un mot de passe trop court avec 400', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Bob', email: 'bob@test.com', password: '123' });

    expect(res.status).toBe(400);
  });

  it('refuse un corps incomplet avec 400', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'incomplet@test.com' });

    expect(res.status).toBe(400);
  });
});

// ─── Connexion ───────────────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  it('retourne un token pour des identifiants valides', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'alice@test.com', password: 'motdepasse' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('alice@test.com');
  });

  it('refuse un mauvais mot de passe avec 401', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'alice@test.com', password: 'mauvais' });

    expect(res.status).toBe(401);
  });

  it('refuse un e-mail inexistant avec 401', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'inconnu@test.com', password: 'motdepasse' });

    expect(res.status).toBe(401);
  });
});

// ─── Middleware d'authentification ───────────────────────────────────────────

describe('Routes protégées par JWT', () => {
  it('GET /areas sans token retourne 401', async () => {
    const res = await request(app).get('/areas');
    expect(res.status).toBe(401);
  });

  it('GET /areas avec un token invalide retourne 401', async () => {
    const res = await request(app)
      .get('/areas')
      .set('Authorization', 'Bearer token_bidon');
    expect(res.status).toBe(401);
  });

  it('GET /areas avec un token valide retourne un tableau', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'alice@test.com', password: 'motdepasse' });

    const res = await request(app)
      .get('/areas')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─── Services ────────────────────────────────────────────────────────────────

describe('GET /services', () => {
  it('retourne la liste des services sans authentification', async () => {
    const res = await request(app).get('/services');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const timer = res.body.find((s) => s.id === 'timer');
    expect(timer).toBeDefined();
    expect(timer.actions.length).toBeGreaterThan(0);
  });
});

// ─── AREAs ───────────────────────────────────────────────────────────────────

describe('CRUD /areas', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'alice@test.com', password: 'motdepasse' });
    token = res.body.token;
  });

  it('crée une automatisation valide', async () => {
    const res = await request(app)
      .post('/areas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test AREA',
        action:   { service: 'timer',   id: 'every_day',    config: { hour: 9, minute: 0 } },
        reaction: { service: 'discord', id: 'send_message', config: { webhook_url: 'https://example.com', message: 'Bonjour' } },
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test AREA');
    expect(res.body.active).toBe(true);
    expect(res.body.runs).toBe(0);
  });

  it('refuse une action inconnue avec 400', async () => {
    const res = await request(app)
      .post('/areas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        action:   { service: 'timer', id: 'action_inexistante' },
        reaction: { service: 'discord', id: 'send_message' },
      });

    expect(res.status).toBe(400);
  });

  it('active et désactive une automatisation', async () => {
    // Création
    const created = await request(app)
      .post('/areas')
      .set('Authorization', `Bearer ${token}`)
      .send({
        action:   { service: 'timer', id: 'every_hour' },
        reaction: { service: 'discord', id: 'send_message', config: { webhook_url: 'x', message: 'y' } },
      });

    const id = created.body.id;

    // Désactivation
    const patched = await request(app)
      .patch(`/areas/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ active: false });

    expect(patched.status).toBe(200);
    expect(patched.body.active).toBe(false);

    // Suppression
    const deleted = await request(app)
      .delete(`/areas/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleted.status).toBe(200);
  });
});

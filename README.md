# AREA — Action-Reaction Platform

Plateforme d'automatisation type IFTTT/Zapier — projet Epitech G-DEV-500.

## Architecture

```
area-backend/   API REST Express + SQLite (port 8080)
area-frontend/  Client web React + Vite  (port 8081)
area-mobile/    Client mobile (stub APK)
```

## Prérequis

- Node.js 20+
- Docker + Docker Compose

## Lancement en développement

### 1. Configurer les variables d'environnement

```bash
cp area-backend/.env.example area-backend/.env
```

Renseigner les valeurs dans `area-backend/.env` :

| Variable | Description |
|---|---|
| `JWT_SECRET` | Clé secrète pour signer les tokens JWT |
| `GOOGLE_CLIENT_ID` | Client ID de l'app Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Client Secret de l'app Google OAuth |
| `GITHUB_CLIENT_ID` | Client ID de l'app GitHub OAuth |
| `GITHUB_CLIENT_SECRET` | Client Secret de l'app GitHub OAuth |
| `FRONTEND_URL` | URL du frontend (défaut : `http://localhost:8081`) |

### 2. Backend

```bash
cd area-backend
npm install
npm run dev
```

Le serveur démarre sur `http://localhost:8080`.

### 3. Frontend

```bash
cd area-frontend
npm install
npm run dev
```

Le client démarre sur `http://localhost:8081`.

## Lancement avec Docker

```bash
docker compose up --build
```

- API : `http://localhost:8080`
- Web : `http://localhost:8081`
- APK : `http://localhost:8081/client.apk`

## API REST

### Authentification

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/auth/register` | Créer un compte |
| `POST` | `/auth/login` | Se connecter |
| `GET` | `/auth/oauth/google/init` | Initier le flux OAuth Google |
| `GET` | `/auth/oauth/github/init` | Initier le flux OAuth GitHub |
| `GET` | `/auth/oauth/:provider/callback` | Callback OAuth (usage interne) |

**Exemple — inscription :**
```json
POST /auth/register
{ "name": "Alice", "email": "alice@exemple.com", "password": "motdepasse" }

→ { "token": "eyJ...", "user": { "id": 1, "name": "Alice", "email": "alice@exemple.com" } }
```

Les routes protégées attendent un header `Authorization: Bearer <token>`.

### Services

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/services` | Lister tous les services disponibles |
| `POST` | `/services/:id/subscribe` | S'abonner à un service |
| `DELETE` | `/services/:id/subscribe` | Se désabonner |

### Automatisations (AREAs)

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/areas` | Lister ses automatisations |
| `POST` | `/areas` | Créer une automatisation |
| `PUT` | `/areas/:id` | Modifier une automatisation |
| `PATCH` | `/areas/:id` | Activer / désactiver |
| `DELETE` | `/areas/:id` | Supprimer |

**Exemple — création d'une AREA :**
```json
POST /areas
{
  "name": "Issue GitHub → Discord",
  "action": {
    "service": "github",
    "id": "new_issue",
    "config": { "repo": "owner/mon-repo" }
  },
  "reaction": {
    "service": "discord",
    "id": "send_message",
    "config": {
      "webhook_url": "https://discord.com/api/webhooks/...",
      "message": "Nouvelle issue ouverte !"
    }
  }
}
```

### Administration (réservé aux admins)

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/admin/users` | Lister tous les utilisateurs |
| `PATCH` | `/admin/users/:id` | Promouvoir / rétrograder |
| `DELETE` | `/admin/users/:id` | Supprimer un utilisateur |
| `GET` | `/admin/stats` | Statistiques globales |

### Endpoint requis par le sujet

```
GET /about.json
```

Retourne la liste des services, actions et réactions disponibles ainsi que l'IP du client et l'heure serveur.

## Services disponibles

| Service | Actions | Réactions |
|---|---|---|
| Gmail | 3 | 2 |
| GitHub | 3 | 2 |
| Discord | 2 | 2 |
| Minuteur | 3 | 0 |
| Notion | 2 | 2 |

## Tests

```bash
cd area-backend
npm test
```

15 tests couvrant l'authentification, le middleware JWT, les services et le CRUD des AREAs.

## CI/CD

- **CI** : exécutée sur chaque push — tests backend, lint + build frontend, validation Docker
- **CD** : exécutée sur push vers `main` — publie les images Docker sur GitHub Container Registry

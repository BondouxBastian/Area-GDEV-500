# Guide de contribution — AREA

Ce document explique comment étendre la plateforme en ajoutant de nouveaux services, actions et réactions. L'architecture a été conçue pour que chaque extension se résume à toucher trois fichiers, sans modifier le moteur central.

---

## Sommaire

1. [Architecture du système](#architecture-du-système)
2. [Ajouter un nouveau service](#1-ajouter-un-nouveau-service)
3. [Ajouter une action à un service existant](#2-ajouter-une-action-à-un-service-existant)
4. [Ajouter une réaction à un service existant](#3-ajouter-une-réaction-à-un-service-existant)
5. [Implémenter la logique dans le moteur de déclenchement](#4-implémenter-la-logique-dans-le-moteur-de-déclenchement)
6. [Conventions de nommage et types de champs](#conventions-de-nommage-et-types-de-champs)
7. [Tester ses modifications](#tester-ses-modifications)
8. [Checklist avant de soumettre](#checklist-avant-de-soumettre)

---

## Architecture du système

```
area-backend/
  src/
    services.js          ← Catalogue déclaratif (services, actions, réactions, schémas)
    hooks/
      runner.js          ← Moteur de polling : vérifie les actions, exécute les réactions
    routes/
      services.js        ← Abonnements utilisateurs
      areas.js           ← CRUD des automatisations
    db.js                ← Base SQLite (schéma, connexion)

area-frontend/
  src/
    App.jsx              ← Le formulaire de création lit config_schema et génère les champs
    api.js               ← Couche HTTP (rien à modifier pour ajouter un service)
```

Le frontend ne connaît pas les services à l'avance : il appelle `GET /services` au chargement, lit les `config_schema` et génère les formulaires dynamiquement. Il n'y a donc **aucun fichier frontend à modifier** pour ajouter un service.

---

## 1. Ajouter un nouveau service

Ouvrir `area-backend/src/services.js` et ajouter une entrée dans l'objet `SERVICES`.

### Structure minimale

```js
monService: {
  // Identifiant interne — doit être unique, tout en minuscules, sans espace
  id: 'mon_service',

  // Nom affiché dans l'interface
  name: 'Mon Service',

  // Description courte visible sur la page de connexion des services
  description: 'Résumé en une ligne de ce que fait le service',

  // true si le service nécessite un token OAuth pour fonctionner.
  // false pour les services basés sur des webhooks ou ne nécessitant pas d'authentification.
  requiresOAuth: true,

  actions: [
    // voir section 2
  ],

  reactions: [
    // voir section 3
  ],
},
```

### Exemple complet

```js
slack: {
  id: 'slack',
  name: 'Slack',
  description: 'Messages, canaux, espaces de travail',
  requiresOAuth: true,
  actions: [
    {
      id: 'new_message',
      name: 'Nouveau message dans un canal',
      description: 'Se déclenche dès qu\'un message est posté dans le canal',
      config_schema: [
        {
          key: 'channel_id',
          label: 'ID du canal',
          type: 'text',
          required: true,
          placeholder: 'ex: C012AB3CD',
        },
      ],
    },
  ],
  reactions: [
    {
      id: 'send_message',
      name: 'Envoyer un message',
      description: 'Publie un message dans un canal Slack',
      config_schema: [
        {
          key: 'channel_id',
          label: 'ID du canal',
          type: 'text',
          required: true,
          placeholder: 'ex: C012AB3CD',
        },
        {
          key: 'message',
          label: 'Message',
          type: 'textarea',
          required: true,
          placeholder: 'Votre message...',
        },
      ],
    },
  ],
},
```

---

## 2. Ajouter une action à un service existant

Une action représente l'événement déclencheur d'une automatisation. Elle est déclarée dans le tableau `actions` du service concerné dans `services.js`.

### Structure d'une action

```js
{
  // Identifiant interne, unique au sein du service (snake_case)
  id: 'nom_action',

  // Affiché dans la liste déroulante du formulaire de création
  name: 'Libellé affiché',

  // Explication courte visible sous le nom dans l'interface
  description: 'Ce que détecte cette action',

  // Champs que l'utilisateur doit remplir pour configurer l'action.
  // Un tableau vide [] est valide si aucune configuration n'est requise.
  config_schema: [
    {
      key: 'nom_du_champ',       // Clé JSON stockée dans action_config (BDD)
      label: 'Libellé du champ', // Texte affiché dans le formulaire
      type: 'text',              // Type du champ (voir section Conventions)
      required: true,            // Empêche la soumission si vide
      placeholder: 'exemple',   // Texte indicatif dans le champ
    },
  ],
}
```

### Exemple — action "nouvelle étoile sur un dépôt" pour GitHub

```js
{
  id: 'new_star',
  name: 'Nouveau star sur un dépôt',
  description: 'Se déclenche quand quelqu\'un ajoute une étoile',
  config_schema: [
    {
      key: 'repo',
      label: 'Dépôt (owner/repo)',
      type: 'text',
      required: true,
      placeholder: 'ex: monuser/mon-repo',
    },
  ],
},
```

Une fois l'action déclarée ici, elle apparaît automatiquement dans le formulaire de création d'une AREA. Il reste ensuite à implémenter la vérification dans le moteur de déclenchement (voir section 4).

---

## 3. Ajouter une réaction à un service existant

Une réaction est l'effet produit lorsqu'une action se déclenche. Elle est déclarée dans le tableau `reactions` du service concerné.

### Structure d'une réaction

```js
{
  id: 'nom_reaction',
  name: 'Libellé affiché',
  description: 'Ce que fait cette réaction',
  config_schema: [
    {
      key: 'param',
      label: 'Paramètre',
      type: 'text',
      required: true,
      placeholder: '',
    },
  ],
}
```

### Exemple — réaction "fermer une issue" pour GitHub

```js
{
  id: 'close_issue',
  name: 'Fermer une issue',
  description: 'Ferme une issue existante sur un dépôt',
  config_schema: [
    {
      key: 'repo',
      label: 'Dépôt (owner/repo)',
      type: 'text',
      required: true,
      placeholder: 'ex: monuser/mon-repo',
    },
    {
      key: 'issue_number',
      label: "Numéro de l'issue",
      type: 'number',
      required: true,
      placeholder: '42',
    },
  ],
},
```

---

## 4. Implémenter la logique dans le moteur de déclenchement

Le moteur tourne dans `area-backend/src/hooks/runner.js`. Il vérifie toutes les AREAs actives toutes les 60 secondes.

### 4a. Vérifier une action (polling)

Localiser la fonction `verifierAction` et ajouter un branchement pour le nouveau service :

```js
async function verifierAction(service, actionId, config, oauthToken) {
  // ... branches existantes ...

  if (service === 'mon_service') {
    return verifierActionMonService(actionId, config, oauthToken);
  }

  return false;
}
```

Puis écrire la fonction de vérification :

```js
async function verifierActionMonService(actionId, config, oauthToken) {
  // Si le service nécessite OAuth, vérifier que le token est présent
  if (!oauthToken) return false;

  try {
    if (actionId === 'nom_action') {
      // Appeler l'API externe pour détecter l'événement
      const resp = await fetch('https://api.mon-service.com/endpoint', {
        headers: { Authorization: `Bearer ${oauthToken}` },
      });
      if (!resp.ok) return false;

      const data = await resp.json();

      // Retourner true uniquement si l'événement est "nouveau" (moins de 2 minutes)
      const createdAt = new Date(data.created_at);
      return (Date.now() - createdAt.getTime()) < 2 * 60 * 1000;
    }
  } catch {
    // Ne pas bloquer les autres vérifications en cas d'erreur réseau
    return false;
  }

  return false;
}
```

> **Règle importante sur la fraîcheur** : pour qu'un événement soit considéré "nouveau", vérifier qu'il date de moins de 2 minutes (`Date.now() - evenement.getTime() < 2 * 60 * 1000`). Le moteur tourne toutes les 60 secondes, une fenêtre de 2 minutes absorbe les légers décalages.

> **Déduplication** : le moteur enregistre chaque déclenchement dans la table `area_triggers` avec une `trigger_key`. Pour la plupart des services, la clé est générée automatiquement avec la minute courante (dans `calculerCleDeduplication`). Si le service nécessite une logique particulière, ajouter un `if (area.action_service === 'mon_service')` dans cette fonction.

### 4b. Exécuter une réaction

Localiser la fonction `executerReaction` et ajouter un branchement :

```js
async function executerReaction(service, reactionId, config, oauthToken) {
  // ... branches existantes ...

  if (service === 'mon_service') {
    await executerReactionMonService(reactionId, config, oauthToken);
    return;
  }

  console.warn(`[hooks] Réaction non implémentée : ${service}/${reactionId}`);
}
```

Puis écrire la fonction d'exécution :

```js
async function executerReactionMonService(reactionId, config, oauthToken) {
  if (!oauthToken) return;

  if (reactionId === 'nom_reaction') {
    await fetch('https://api.mon-service.com/endpoint', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${oauthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        param: config.param,
      }),
    });
  }
}
```

---

## Conventions de nommage et types de champs

### Identifiants

| Élément | Format | Exemple |
|---|---|---|
| `id` du service | snake_case | `mon_service` |
| `id` d'une action | snake_case | `new_message` |
| `id` d'une réaction | snake_case | `send_message` |
| `key` d'un champ de config | snake_case | `webhook_url` |

### Types de champs disponibles dans `config_schema`

| Type | Rendu HTML | Usage |
|---|---|---|
| `text` | `<input type="text">` | Chaîne courte (nom, ID, clé...) |
| `email` | `<input type="email">` | Adresse e-mail |
| `url` | `<input type="url">` | URL (webhook, endpoint...) |
| `number` | `<input type="number">` | Valeur numérique (numéro, intervalle...) |
| `textarea` | `<textarea>` | Texte long (message, description...) |
| `datetime-local` | `<input type="datetime-local">` | Date et heure précises |

Les champs `number` acceptent des propriétés optionnelles `min` et `max` :
```js
{ key: 'hour', label: 'Heure', type: 'number', required: true, placeholder: '8', min: 0, max: 23 }
```

---

## Tester ses modifications

### Lancer les tests existants

```bash
cd area-backend
npm test
```

### Vérifier que le nouveau service s'affiche

```bash
curl http://localhost:8080/about.json | jq '.server.services[] | select(.name == "Mon Service")'
```

### Vérifier la liste des services depuis le frontend

```bash
curl http://localhost:8080/services
```

### Tester le déclenchement manuellement

Le moteur de polling vérifie toutes les 60 secondes. Pour tester immédiatement sans attendre, appeler `verifierToutesLesAreas()` directement depuis un script Node :

```js
// scripts/tester-hooks.js
process.env.DB_PATH = './data/area.db';
require('dotenv').config();
const { demarrerHooks } = require('./src/hooks/runner');
// Appeler la fonction interne directement n'est pas exposée — modifier
// temporairement runner.js pour exporter verifierToutesLesAreas pendant les tests.
```

### Ajouter un test d'intégration

Les tests se trouvent dans `area-backend/tests/app.test.js`. Voici un exemple pour un nouveau service :

```js
describe('Nouveau service', () => {
  it('apparaît dans /about.json', async () => {
    const res = await request(app).get('/about.json');
    expect(res.status).toBe(200);
    const noms = res.body.server.services.map((s) => s.name);
    expect(noms).toContain('Mon Service');
  });
});
```

---

## Checklist avant de soumettre

Avant d'ouvrir une pull request, vérifier les points suivants :

- [ ] Le service est déclaré dans `services.js` avec au moins une action ou une réaction
- [ ] Chaque action et réaction a un `id` unique au sein du service
- [ ] Chaque champ de `config_schema` a les propriétés `key`, `label`, `type`, `required` et `placeholder`
- [ ] La logique de vérification est ajoutée dans `verifierAction` (runner.js)
- [ ] La logique d'exécution est ajoutée dans `executerReaction` (runner.js)
- [ ] Les erreurs réseau sont absorbées par un bloc `try/catch` qui retourne `false`
- [ ] `npm test` passe sans erreur
- [ ] Le service apparaît dans la réponse de `GET /about.json`
- [ ] Le service apparaît dans la réponse de `GET /services`

---

## Ressources

- [Documentation Express.js](https://expressjs.com/fr/)
- [API GitHub REST](https://docs.github.com/en/rest)
- [API Gmail](https://developers.google.com/gmail/api)
- [API Notion](https://developers.notion.com/)
- [Webhooks Discord](https://discord.com/developers/docs/resources/webhook)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)

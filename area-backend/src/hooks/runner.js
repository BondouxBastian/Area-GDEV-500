const db = require('../db');

// Intervalle de vérification des conditions d'action (en millisecondes).
// 60 secondes est un bon compromis entre réactivité et charge serveur.
const INTERVALLE_MS = 60_000;

// Point d'entrée : démarre la boucle de vérification des automatisations actives.
function demarrerHooks() {
  console.log('[hooks] Démarrage du moteur de déclenchement (intervalle : 60s)');
  setInterval(verifierToutesLesAreas, INTERVALLE_MS);
}

// Récupère toutes les automatisations actives et vérifie leur condition une par une.
async function verifierToutesLesAreas() {
  const areas = db.prepare(`
    SELECT a.*, us.oauth_token AS action_oauth
    FROM areas a
    LEFT JOIN user_services us
      ON us.user_id = a.user_id AND us.service_id = a.action_service
    WHERE a.active = 1
  `).all();

  for (const area of areas) {
    try {
      await verifierArea(area);
    } catch (err) {
      console.error(`[hooks] Erreur sur l'automatisation #${area.id} :`, err.message);
    }
  }
}

// Vérifie si la condition d'action d'une automatisation est remplie.
// Si oui, exécute la réaction associée (en évitant les doublons).
async function verifierArea(area) {
  const actionConfig = JSON.parse(area.action_config);
  const cleDeduplication = calculerCleDeduplication(area, actionConfig);

  // On ignore si ce déclenchement a déjà eu lieu récemment
  const dejaDeclenche = db.prepare(`
    SELECT 1 FROM area_triggers
    WHERE area_id = ? AND trigger_key = ?
    AND triggered_at > strftime('%s', 'now') - 86400
  `).get(area.id, cleDeduplication);

  if (dejaDeclenche) return;

  const conditionRemplie = await verifierAction(area.action_service, area.action_id, actionConfig, area.action_oauth);

  if (!conditionRemplie) return;

  // Enregistre le déclenchement pour la déduplication
  db.prepare('INSERT INTO area_triggers (area_id, trigger_key) VALUES (?, ?)').run(area.id, cleDeduplication);

  // Récupère le token OAuth pour le service de réaction
  const reactionService = db.prepare(`
    SELECT oauth_token FROM user_services
    WHERE user_id = ? AND service_id = ?
  `).get(area.user_id, area.reaction_service);

  const reactionOAuth = reactionService?.oauth_token || null;

  await executerReaction(
    area.reaction_service,
    area.reaction_id,
    JSON.parse(area.reaction_config),
    reactionOAuth
  );

  // Incrémente le compteur d'exécutions
  db.prepare('UPDATE areas SET runs = runs + 1 WHERE id = ?').run(area.id);

  console.log(`[hooks] Automatisation #${area.id} déclenchée (${area.action_service}/${area.action_id} → ${area.reaction_service}/${area.reaction_id})`);
}

// Calcule une clé unique pour identifier un déclenchement.
// Pour le minuteur, la clé inclut la date/heure afin d'éviter les répétitions le même jour.
function calculerCleDeduplication(area, actionConfig) {
  const maintenant = new Date();

  if (area.action_service === 'timer') {
    if (area.action_id === 'every_day') {
      // Un déclenchement par jour : la clé inclut la date du jour
      const date = maintenant.toISOString().slice(0, 10);
      return `${area.id}:timer:every_day:${date}`;
    }
    if (area.action_id === 'every_hour') {
      // Un déclenchement par tranche horaire configurée
      const heure = maintenant.getHours();
      const intervalleH = actionConfig.interval_hours || 1;
      const tranche = Math.floor(heure / intervalleH);
      const date = maintenant.toISOString().slice(0, 10);
      return `${area.id}:timer:every_hour:${date}:${tranche}`;
    }
    if (area.action_id === 'specific_date') {
      // Une seule fois à la date précise
      return `${area.id}:timer:specific_date:${actionConfig.date || ''}`;
    }
  }

  // Pour les autres services, la clé change à chaque minute pour permettre
  // la re-vérification périodique tout en évitant les doublons dans la même minute
  const minuteCourante = maintenant.toISOString().slice(0, 16);
  return `${area.id}:${area.action_service}:${area.action_id}:${minuteCourante}`;
}

// Vérifie si la condition d'une action est remplie.
// Retourne true si la réaction doit être déclenchée.
async function verifierAction(service, actionId, config, oauthToken) {
  if (service === 'timer') {
    return verifierActionTimer(actionId, config);
  }
  if (service === 'github') {
    return verifierActionGithub(actionId, config, oauthToken);
  }
  if (service === 'gmail') {
    return verifierActionGmail(actionId, config, oauthToken);
  }
  if (service === 'discord') {
    // Discord utilise des webhooks sortants, il n'y a pas de polling entrant à implémenter ici
    return false;
  }
  if (service === 'notion') {
    return verifierActionNotion(actionId, config, oauthToken);
  }

  return false;
}

// --- Timer -----------------------------------------------------------------

function verifierActionTimer(actionId, config) {
  const maintenant = new Date();
  const heure = maintenant.getHours();
  const minute = maintenant.getMinutes();

  if (actionId === 'every_day') {
    // Se déclenche si on est dans la bonne heure configurée (à la minute près)
    const heureVoulue = config.hour ?? 8;
    const minuteVoulue = config.minute ?? 0;
    return heure === heureVoulue && minute === minuteVoulue;
  }

  if (actionId === 'every_hour') {
    // Se déclenche toutes les N heures, à la minute 0
    const intervalleH = config.interval_hours ?? 1;
    return heure % intervalleH === 0 && minute === 0;
  }

  if (actionId === 'specific_date') {
    // Se déclenche une seule fois à la date/heure précise
    if (!config.date) return false;
    const cible = new Date(config.date);
    const diff = Math.abs(maintenant - cible) / 1000 / 60;
    return diff <= 1; // tolérance d'une minute
  }

  return false;
}

// --- GitHub ----------------------------------------------------------------

async function verifierActionGithub(actionId, config, oauthToken) {
  if (!oauthToken || !config.repo) return false;

  const headers = {
    Authorization: `Bearer ${oauthToken}`,
    'User-Agent': 'AREA-App',
    Accept: 'application/vnd.github+json',
  };

  try {
    if (actionId === 'new_issue') {
      const resp = await fetch(
        `https://api.github.com/repos/${config.repo}/issues?state=open&per_page=1&sort=created&direction=desc`,
        { headers }
      );
      if (!resp.ok) return false;
      const issues = await resp.json();
      if (!issues.length) return false;

      // On considère l'issue "nouvelle" si elle date de moins de 2 minutes
      const createdAt = new Date(issues[0].created_at);
      return (Date.now() - createdAt.getTime()) < 2 * 60 * 1000;
    }

    if (actionId === 'new_pr') {
      const resp = await fetch(
        `https://api.github.com/repos/${config.repo}/pulls?state=open&per_page=1&sort=created&direction=desc`,
        { headers }
      );
      if (!resp.ok) return false;
      const prs = await resp.json();
      if (!prs.length) return false;
      const createdAt = new Date(prs[0].created_at);
      return (Date.now() - createdAt.getTime()) < 2 * 60 * 1000;
    }

    if (actionId === 'pr_merged') {
      const resp = await fetch(
        `https://api.github.com/repos/${config.repo}/pulls?state=closed&per_page=1&sort=updated&direction=desc`,
        { headers }
      );
      if (!resp.ok) return false;
      const prs = await resp.json();
      const derniere = prs.find((p) => p.merged_at);
      if (!derniere) return false;
      const mergedAt = new Date(derniere.merged_at);
      return (Date.now() - mergedAt.getTime()) < 2 * 60 * 1000;
    }
  } catch {
    // En cas d'erreur réseau, on ne bloque pas le reste des vérifications
  }

  return false;
}

// --- Gmail -----------------------------------------------------------------

async function verifierActionGmail(actionId, config, oauthToken) {
  if (!oauthToken) return false;

  // L'API Gmail nécessite un token OAuth valide avec le scope gmail.readonly.
  // On interroge la boîte de réception et on cherche les messages récents.
  try {
    let query = 'is:unread newer_than:2m';
    if (actionId === 'email_from' && config.from) {
      query += ` from:${config.from}`;
    }
    if (actionId === 'email_label' && config.label) {
      query += ` label:${config.label}`;
    }

    const resp = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=1`,
      { headers: { Authorization: `Bearer ${oauthToken}` } }
    );
    if (!resp.ok) return false;
    const data = await resp.json();
    return (data.messages?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

// --- Notion ----------------------------------------------------------------

async function verifierActionNotion(actionId, config, oauthToken) {
  if (!oauthToken) return false;

  try {
    if (actionId === 'new_page' && config.parent_id) {
      const resp = await fetch('https://api.notion.com/v1/search', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${oauthToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: { value: 'page', property: 'object' },
          sort: { direction: 'descending', timestamp: 'last_edited_time' },
          page_size: 1,
        }),
      });
      if (!resp.ok) return false;
      const data = await resp.json();
      if (!data.results?.length) return false;
      const dernierEdite = new Date(data.results[0].created_time);
      return (Date.now() - dernierEdite.getTime()) < 2 * 60 * 1000;
    }
  } catch {
    return false;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Exécution des réactions
// ---------------------------------------------------------------------------

async function executerReaction(service, reactionId, config, oauthToken) {
  if (service === 'discord') {
    await executerReactionDiscord(reactionId, config);
    return;
  }
  if (service === 'gmail') {
    await executerReactionGmail(reactionId, config, oauthToken);
    return;
  }
  if (service === 'github') {
    await executerReactionGithub(reactionId, config, oauthToken);
    return;
  }
  if (service === 'notion') {
    await executerReactionNotion(reactionId, config, oauthToken);
    return;
  }

  console.warn(`[hooks] Réaction non implémentée : ${service}/${reactionId}`);
}

// --- Discord ---------------------------------------------------------------

async function executerReactionDiscord(reactionId, config) {
  // Discord utilise des webhooks : l'URL doit être stockée dans la config de la réaction
  if (!config.webhook_url) {
    console.warn('[hooks] Discord : webhook_url manquant dans la config de la réaction');
    return;
  }

  if (reactionId === 'send_message') {
    await fetch(config.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: config.message || 'Automatisation AREA déclenchée.' }),
    });
  }
}

// --- Gmail (envoi) ---------------------------------------------------------

async function executerReactionGmail(reactionId, config, oauthToken) {
  if (!oauthToken || !config.to) return;

  if (reactionId === 'send_email') {
    // L'API Gmail attend le message encodé en base64 (format RFC 2822)
    const contenu = [
      `To: ${config.to}`,
      `Subject: ${config.subject || 'Message depuis AREA'}`,
      '',
      config.body || '',
    ].join('\n');

    const encoded = Buffer.from(contenu).toString('base64url');

    await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${oauthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encoded }),
    });
  }
}

// --- GitHub (actions sortantes) --------------------------------------------

async function executerReactionGithub(reactionId, config, oauthToken) {
  if (!oauthToken || !config.repo) return;

  const headers = {
    Authorization: `Bearer ${oauthToken}`,
    'User-Agent': 'AREA-App',
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };

  if (reactionId === 'create_issue') {
    await fetch(`https://api.github.com/repos/${config.repo}/issues`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: config.title || 'Issue créée par AREA',
        body: config.body || '',
      }),
    });
  }

  if (reactionId === 'add_label' && config.issue_number && config.labels) {
    await fetch(`https://api.github.com/repos/${config.repo}/issues/${config.issue_number}/labels`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ labels: config.labels }),
    });
  }
}

// --- Notion (création) -----------------------------------------------------

async function executerReactionNotion(reactionId, config, oauthToken) {
  if (!oauthToken || !config.parent_id) return;

  const headers = {
    Authorization: `Bearer ${oauthToken}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  };

  if (reactionId === 'create_page') {
    await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        parent: { page_id: config.parent_id },
        properties: {
          title: { title: [{ text: { content: config.title || 'Page créée par AREA' } }] },
        },
      }),
    });
  }

  if (reactionId === 'add_db_item' && config.database_id) {
    await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        parent: { database_id: config.database_id },
        properties: config.properties || {},
      }),
    });
  }
}

module.exports = { demarrerHooks };

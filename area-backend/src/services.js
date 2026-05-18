// Catalogue des services disponibles sur la plateforme.
// C'est la source de vérité côté serveur — le frontend les récupère via GET /services.
// Pour ajouter un nouveau service, il suffit d'ajouter une entrée ici et d'implémenter
// les handlers correspondants dans hooks/runner.js.

const SERVICES = {
  gmail: {
    id: 'gmail',
    name: 'Gmail',
    description: 'E-mails, libellés, pièces jointes',
    requiresOAuth: true,
    actions: [
      { id: 'new_email',    name: 'Nouvel e-mail reçu',           description: "Se déclenche à la réception d'un e-mail" },
      { id: 'email_from',  name: "E-mail d'un expéditeur précis", description: "Se déclenche sur un e-mail d'une adresse donnée" },
      { id: 'email_label', name: 'E-mail étiqueté',               description: "Se déclenche quand un e-mail reçoit un libellé" },
    ],
    reactions: [
      { id: 'send_email',   name: 'Envoyer un e-mail',  description: 'Envoie un e-mail à un destinataire' },
      { id: 'create_draft', name: 'Créer un brouillon', description: "Crée un brouillon d'e-mail" },
    ],
  },

  github: {
    id: 'github',
    name: 'GitHub',
    description: 'Dépôts, issues, pull requests',
    requiresOAuth: true,
    actions: [
      { id: 'new_issue', name: 'Nouvelle issue ouverte',  description: "Se déclenche à l'ouverture d'une issue" },
      { id: 'new_pr',    name: 'Nouvelle pull request',   description: 'Se déclenche à la création d\'une PR' },
      { id: 'pr_merged', name: 'Pull request fusionnée',  description: 'Se déclenche lors de la fusion d\'une PR' },
    ],
    reactions: [
      { id: 'create_issue', name: 'Créer une issue',              description: 'Crée une nouvelle issue sur un dépôt' },
      { id: 'add_label',    name: 'Ajouter un label à une issue', description: 'Ajoute un label à une issue existante' },
    ],
  },

  discord: {
    id: 'discord',
    name: 'Discord',
    description: 'Messages, canaux, serveurs',
    // Discord utilise des webhooks, pas d'OAuth utilisateur à proprement parler
    requiresOAuth: false,
    actions: [
      { id: 'new_message', name: 'Nouveau message dans un canal', description: 'Se déclenche sur un nouveau message' },
      { id: 'new_member',  name: 'Nouveau membre du serveur',     description: 'Se déclenche quand quelqu\'un rejoint' },
    ],
    reactions: [
      { id: 'send_message', name: 'Envoyer un message', description: 'Publie un message dans un canal via un webhook' },
      { id: 'send_dm',      name: 'Envoyer un MP',      description: 'Envoie un message privé à un utilisateur' },
    ],
  },

  timer: {
    id: 'timer',
    name: 'Minuteur',
    description: 'Planifications, dates, heures',
    requiresOAuth: false,
    actions: [
      { id: 'every_day',     name: 'Chaque jour à une heure', description: 'Se déclenche quotidiennement à l\'heure définie' },
      { id: 'every_hour',    name: 'Toutes les X heures',     description: 'Se déclenche à intervalle régulier' },
      { id: 'specific_date', name: 'À une date précise',      description: 'Se déclenche à une date/heure donnée' },
    ],
    // Le minuteur ne produit pas de réactions, il sert uniquement de déclencheur
    reactions: [],
  },

  notion: {
    id: 'notion',
    name: 'Notion',
    description: 'Pages, bases de données, blocs',
    requiresOAuth: true,
    actions: [
      { id: 'new_page', name: 'Nouvelle page créée',    description: "Se déclenche à la création d'une page" },
      { id: 'db_item',  name: 'Nouvel élément en base', description: "Se déclenche à l'ajout d'une entrée en BDD" },
    ],
    reactions: [
      { id: 'create_page', name: 'Créer une page',             description: 'Crée une nouvelle page Notion' },
      { id: 'add_db_item', name: 'Ajouter un élément en base', description: 'Ajoute une ligne dans une base de données' },
    ],
  },
};

module.exports = SERVICES;

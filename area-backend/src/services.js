// Catalogue des services disponibles sur la plateforme.
// Chaque action et réaction expose un config_schema : la liste des champs
// que l'utilisateur doit renseigner lors de la création d'une AREA.
// Le frontend génère le formulaire dynamiquement à partir de ce schéma.

const SERVICES = {
  gmail: {
    id: 'gmail',
    name: 'Gmail',
    description: 'E-mails, libellés, pièces jointes',
    requiresOAuth: true,
    actions: [
      {
        id: 'new_email',
        name: 'Nouvel e-mail reçu',
        description: "Se déclenche à la réception de n'importe quel e-mail",
        config_schema: [],
      },
      {
        id: 'email_from',
        name: "E-mail d'un expéditeur précis",
        description: "Se déclenche sur un e-mail d'une adresse donnée",
        config_schema: [
          { key: 'from', label: "Adresse de l'expéditeur", type: 'email', required: true, placeholder: 'expediteur@exemple.com' },
        ],
      },
      {
        id: 'email_label',
        name: 'E-mail étiqueté',
        description: "Se déclenche quand un e-mail reçoit un libellé",
        config_schema: [
          { key: 'label', label: 'Libellé Gmail', type: 'text', required: true, placeholder: 'ex: Important' },
        ],
      },
    ],
    reactions: [
      {
        id: 'send_email',
        name: 'Envoyer un e-mail',
        description: 'Envoie un e-mail à un destinataire',
        config_schema: [
          { key: 'to',      label: 'Destinataire',    type: 'email',    required: true,  placeholder: 'destinataire@exemple.com' },
          { key: 'subject', label: 'Objet',            type: 'text',     required: true,  placeholder: 'Objet du message' },
          { key: 'body',    label: 'Corps du message', type: 'textarea', required: false, placeholder: 'Contenu de l\'e-mail...' },
        ],
      },
      {
        id: 'create_draft',
        name: 'Créer un brouillon',
        description: "Crée un brouillon d'e-mail",
        config_schema: [
          { key: 'to',      label: 'Destinataire', type: 'email',    required: true,  placeholder: 'destinataire@exemple.com' },
          { key: 'subject', label: 'Objet',         type: 'text',     required: true,  placeholder: 'Objet du brouillon' },
          { key: 'body',    label: 'Corps',          type: 'textarea', required: false, placeholder: '' },
        ],
      },
    ],
  },

  github: {
    id: 'github',
    name: 'GitHub',
    description: 'Dépôts, issues, pull requests',
    requiresOAuth: true,
    actions: [
      {
        id: 'new_issue',
        name: 'Nouvelle issue ouverte',
        description: "Se déclenche à l'ouverture d'une issue",
        config_schema: [
          { key: 'repo', label: 'Dépôt (owner/repo)', type: 'text', required: true, placeholder: 'ex: monuser/mon-repo' },
        ],
      },
      {
        id: 'new_pr',
        name: 'Nouvelle pull request',
        description: "Se déclenche à la création d'une PR",
        config_schema: [
          { key: 'repo', label: 'Dépôt (owner/repo)', type: 'text', required: true, placeholder: 'ex: monuser/mon-repo' },
        ],
      },
      {
        id: 'pr_merged',
        name: 'Pull request fusionnée',
        description: "Se déclenche lors de la fusion d'une PR",
        config_schema: [
          { key: 'repo', label: 'Dépôt (owner/repo)', type: 'text', required: true, placeholder: 'ex: monuser/mon-repo' },
        ],
      },
    ],
    reactions: [
      {
        id: 'create_issue',
        name: 'Créer une issue',
        description: 'Crée une nouvelle issue sur un dépôt',
        config_schema: [
          { key: 'repo',  label: 'Dépôt (owner/repo)', type: 'text',     required: true,  placeholder: 'ex: monuser/mon-repo' },
          { key: 'title', label: "Titre de l'issue",    type: 'text',     required: true,  placeholder: 'Titre de l\'issue' },
          { key: 'body',  label: 'Description',         type: 'textarea', required: false, placeholder: '' },
        ],
      },
      {
        id: 'add_label',
        name: 'Ajouter un label à une issue',
        description: 'Ajoute un label à une issue existante',
        config_schema: [
          { key: 'repo',         label: 'Dépôt (owner/repo)', type: 'text', required: true,  placeholder: 'ex: monuser/mon-repo' },
          { key: 'issue_number', label: "Numéro de l'issue",  type: 'number', required: true, placeholder: '42' },
          { key: 'labels',       label: 'Labels (séparés par des virgules)', type: 'text', required: true, placeholder: 'bug, urgent' },
        ],
      },
    ],
  },

  discord: {
    id: 'discord',
    name: 'Discord',
    description: 'Messages, canaux, serveurs',
    requiresOAuth: false,
    actions: [
      {
        id: 'new_message',
        name: 'Nouveau message dans un canal',
        description: 'Se déclenche sur un nouveau message (via bot)',
        config_schema: [],
      },
      {
        id: 'new_member',
        name: 'Nouveau membre du serveur',
        description: "Se déclenche quand quelqu'un rejoint (via bot)",
        config_schema: [],
      },
    ],
    reactions: [
      {
        id: 'send_message',
        name: 'Envoyer un message',
        description: 'Publie un message dans un canal via un webhook',
        config_schema: [
          { key: 'webhook_url', label: 'URL du webhook Discord', type: 'url',      required: true,  placeholder: 'https://discord.com/api/webhooks/...' },
          { key: 'message',     label: 'Message',                type: 'textarea', required: true,  placeholder: 'Votre message...' },
        ],
      },
      {
        id: 'send_dm',
        name: 'Envoyer un MP',
        description: 'Envoie un message privé (nécessite un bot Discord)',
        config_schema: [
          { key: 'webhook_url', label: 'URL du webhook Discord', type: 'url',      required: true,  placeholder: 'https://discord.com/api/webhooks/...' },
          { key: 'message',     label: 'Message',                type: 'textarea', required: true,  placeholder: 'Votre message...' },
        ],
      },
    ],
  },

  timer: {
    id: 'timer',
    name: 'Minuteur',
    description: 'Planifications, dates, heures',
    requiresOAuth: false,
    actions: [
      {
        id: 'every_day',
        name: 'Chaque jour à une heure',
        description: "Se déclenche quotidiennement à l'heure définie",
        config_schema: [
          { key: 'hour',   label: 'Heure (0-23)',   type: 'number', required: true,  placeholder: '8',  min: 0, max: 23 },
          { key: 'minute', label: 'Minute (0-59)',  type: 'number', required: false, placeholder: '0',  min: 0, max: 59 },
        ],
      },
      {
        id: 'every_hour',
        name: 'Toutes les X heures',
        description: 'Se déclenche à intervalle régulier',
        config_schema: [
          { key: 'interval_hours', label: 'Intervalle (heures)', type: 'number', required: true, placeholder: '1', min: 1, max: 24 },
        ],
      },
      {
        id: 'specific_date',
        name: 'À une date précise',
        description: 'Se déclenche une seule fois à la date/heure donnée',
        config_schema: [
          { key: 'date', label: 'Date et heure', type: 'datetime-local', required: true, placeholder: '' },
        ],
      },
    ],
    reactions: [],
  },

  email: {
    id: 'email',
    name: 'Email (SMTP)',
    description: 'Envoi d\'e-mails via votre compte Gmail ou tout serveur SMTP',
    requiresOAuth: false,
    actions: [],
    reactions: [
      {
        id: 'send_email',
        name: 'Envoyer un e-mail',
        description: 'Envoie un e-mail via SMTP (Gmail recommandé)',
        config_schema: [
          { key: 'from',     label: 'Votre adresse Gmail',        type: 'email',    required: true,  placeholder: 'vous@gmail.com' },
          { key: 'password', label: 'Mot de passe d\'application', type: 'text',     required: true,  placeholder: 'xxxx xxxx xxxx xxxx' },
          { key: 'to',       label: 'Destinataire',               type: 'email',    required: true,  placeholder: 'destinataire@exemple.com' },
          { key: 'subject',  label: 'Objet',                      type: 'text',     required: true,  placeholder: 'Objet du message' },
          { key: 'body',     label: 'Corps du message',           type: 'textarea', required: false, placeholder: 'Contenu de l\'e-mail...' },
        ],
      },
    ],
  },

  notion: {
    id: 'notion',
    name: 'Notion',
    description: 'Pages, bases de données, blocs',
    requiresOAuth: true,
    actions: [
      {
        id: 'new_page',
        name: 'Nouvelle page créée',
        description: "Se déclenche à la création d'une page",
        config_schema: [
          { key: 'parent_id', label: 'ID de la page parente', type: 'text', required: true, placeholder: 'ID Notion de la page parent' },
        ],
      },
      {
        id: 'db_item',
        name: 'Nouvel élément en base',
        description: "Se déclenche à l'ajout d'une entrée en BDD",
        config_schema: [
          { key: 'database_id', label: 'ID de la base de données', type: 'text', required: true, placeholder: 'ID Notion de la base' },
        ],
      },
    ],
    reactions: [
      {
        id: 'create_page',
        name: 'Créer une page',
        description: 'Crée une nouvelle page Notion',
        config_schema: [
          { key: 'parent_id', label: 'ID de la page parente', type: 'text', required: true,  placeholder: 'ID Notion de la page parent' },
          { key: 'title',     label: 'Titre de la page',      type: 'text', required: false, placeholder: 'Ma nouvelle page' },
        ],
      },
      {
        id: 'add_db_item',
        name: 'Ajouter un élément en base',
        description: 'Ajoute une ligne dans une base de données',
        config_schema: [
          { key: 'database_id', label: 'ID de la base de données', type: 'text', required: true, placeholder: 'ID Notion de la base' },
        ],
      },
    ],
  },
};

module.exports = SERVICES;

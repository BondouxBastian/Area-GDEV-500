// Catalogue des services disponibles sur la plateforme.
// Chaque action et réaction expose un config_schema : la liste des champs
// que l'utilisateur doit renseigner lors de la création d'une AREA.
// Le frontend génère le formulaire dynamiquement à partir de ce schéma.

const SERVICES = {
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
          { key: 'title', label: "Titre de l'issue",    type: 'text',     required: true,  placeholder: "Titre de l'issue" },
          { key: 'body',  label: 'Description',         type: 'textarea', required: false, placeholder: '' },
        ],
      },
      {
        id: 'add_label',
        name: 'Ajouter un label à une issue',
        description: 'Ajoute un label à une issue existante',
        config_schema: [
          { key: 'repo',         label: 'Dépôt (owner/repo)',                  type: 'text',   required: true,  placeholder: 'ex: monuser/mon-repo' },
          { key: 'issue_number', label: "Numéro de l'issue",                   type: 'number', required: true,  placeholder: '42' },
          { key: 'labels',       label: 'Labels (séparés par des virgules)',    type: 'text',   required: true,  placeholder: 'bug, urgent' },
        ],
      },
    ],
  },

  discord: {
    id: 'discord',
    name: 'Discord',
    description: 'Envoi de messages via webhook',
    requiresOAuth: false,
    // Les actions Discord (écoute de messages, arrivées de membres) nécessitent
    // un bot avec les intents Gateway, ce qui dépasse le cadre de cette plateforme.
    actions: [],
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
        description: 'Envoie un message privé via webhook',
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
          { key: 'hour',   label: 'Heure (0-23)',  type: 'number', required: true,  placeholder: '8', min: 0, max: 23 },
          { key: 'minute', label: 'Minute (0-59)', type: 'number', required: false, placeholder: '0', min: 0, max: 59 },
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
    description: "Envoi d'e-mails via votre compte Gmail",
    requiresOAuth: false,
    actions: [],
    reactions: [
      {
        id: 'send_email',
        name: 'Envoyer un e-mail',
        description: 'Envoie un e-mail via SMTP (Gmail recommandé)',
        config_schema: [
          { key: 'from',     label: 'Votre adresse Gmail',         type: 'email',    required: true,  placeholder: 'vous@gmail.com' },
          { key: 'password', label: "Mot de passe d'application",  type: 'text',     required: true,  placeholder: 'xxxx xxxx xxxx xxxx' },
          { key: 'to',       label: 'Destinataire',                type: 'email',    required: true,  placeholder: 'destinataire@exemple.com' },
          { key: 'subject',  label: 'Objet',                       type: 'text',     required: true,  placeholder: 'Objet du message' },
          { key: 'body',     label: 'Corps du message',            type: 'textarea', required: false, placeholder: "Contenu de l'e-mail..." },
        ],
      },
    ],
  },
};

module.exports = SERVICES;

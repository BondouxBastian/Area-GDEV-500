import { useState } from "react";
import "./App.css";

// ─── Données des services ──────────────────────────────────────────────────────

const SERVICES = [
  {
    id: "gmail",
    name: "Gmail",
    color: "#EA4335",
    icon: "✉",
    description: "E-mails, libellés, pièces jointes",
    actions: [
      { id: "new_email",    name: "Nouvel e-mail reçu",            description: "Se déclenche à la réception d'un e-mail" },
      { id: "email_from",  name: "E-mail d'un expéditeur précis",  description: "Se déclenche sur un e-mail d'une adresse donnée" },
      { id: "email_label", name: "E-mail étiqueté",                description: "Se déclenche quand un e-mail reçoit un libellé" },
    ],
    reactions: [
      { id: "send_email",    name: "Envoyer un e-mail",  description: "Envoie un e-mail à un destinataire" },
      { id: "create_draft",  name: "Créer un brouillon", description: "Crée un brouillon d'e-mail" },
    ],
  },
  {
    id: "github",
    name: "GitHub",
    color: "#24292F",
    icon: "⌥",
    description: "Dépôts, issues, pull requests",
    actions: [
      { id: "new_issue", name: "Nouvelle issue ouverte",  description: "Se déclenche à l'ouverture d'une issue" },
      { id: "new_pr",    name: "Nouvelle pull request",   description: "Se déclenche à la création d'une PR" },
      { id: "pr_merged", name: "Pull request fusionnée",  description: "Se déclenche lors de la fusion d'une PR" },
    ],
    reactions: [
      { id: "create_issue", name: "Créer une issue",            description: "Crée une nouvelle issue sur un dépôt" },
      { id: "add_label",    name: "Ajouter un label à une issue", description: "Ajoute un label à une issue existante" },
    ],
  },
  {
    id: "discor",
    name: "Discor",
    color: "#5865F2",
    icon: "◈",
    description: "Messages, canaux, serveurs",
    actions: [
      { id: "new_message", name: "Nouveau message dans un canal", description: "Se déclenche sur un nouveau message" },
      { id: "new_member",  name: "Nouveau membre du serveur",     description: "Se déclenche quand quelqu'un rejoint" },
    ],
    reactions: [
      { id: "send_message", name: "Envoyer un message", description: "Publie un message dans un canal" },
      { id: "send_dm",      name: "Envoyer un MP",      description: "Envoie un message privé à un utilisateur" },
    ],
  },
  {
    id: "timer",
    name: "Minuteur",
    color: "#F59E0B",
    icon: "◷",
    description: "Planifications, dates, heures",
    actions: [
      { id: "every_day",     name: "Chaque jour à une heure",    description: "Se déclenche quotidiennement à l'heure définie" },
      { id: "every_hour",    name: "Toutes les X heures",        description: "Se déclenche à intervalle régulier" },
      { id: "specific_date", name: "À une date précise",         description: "Se déclenche à une date/heure donnée" },
    ],
    reactions: [],
  },
  {
    id: "notion",
    name: "Notion",
    color: "#000000",
    icon: "▣",
    description: "Pages, bases de données, blocs",
    actions: [
      { id: "new_page", name: "Nouvelle page créée",       description: "Se déclenche à la création d'une page" },
      { id: "db_item",  name: "Nouvel élément en base",    description: "Se déclenche à l'ajout d'une entrée en BDD" },
    ],
    reactions: [
      { id: "create_page",  name: "Créer une page",              description: "Crée une nouvelle page Notion" },
      { id: "add_db_item",  name: "Ajouter un élément en base",  description: "Ajoute une ligne dans une base de données" },
    ],
  },
];

const AUTOMATISATIONS_DEMO = [
  {
    id: 1,
    name: "Issue GitHub → Alerte Discord",
    active: true,
    action:   { service: "github", name: "Nouvelle issue ouverte" },
    reaction: { service: "discor", name: "Envoyer un message" },
    runs: 24,
  },
  {
    id: 2,
    name: "Récapitulatif quotidien par e-mail",
    active: false,
    action:   { service: "timer", name: "Chaque jour à une heure" },
    reaction: { service: "gmail", name: "Envoyer un e-mail" },
    runs: 7,
  },
];

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const getService = (id) => SERVICES.find((s) => s.id === id);

// ─── Composants communs ───────────────────────────────────────────────────────

function Badge({ children, color = "#6366f1" }) {
  return (
    <span
      className="badge"
      style={{ background: color + "20", color }}
    >
      {children}
    </span>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      aria-checked={value}
      role="switch"
      className={`toggle ${value ? "toggle--actif" : "toggle--inactif"}`}
    >
      <span className={`toggle__curseur ${value ? "toggle__curseur--actif" : "toggle__curseur--inactif"}`} />
    </button>
  );
}

function ServiceIcon({ service, size = 36 }) {
  const svc = typeof service === "string" ? getService(service) : service;
  if (!svc) return null;
  return (
    <div
      className="service-icone"
      style={{
        width: size,
        height: size,
        background: svc.color,
        fontSize: size * 0.45,
      }}
    >
      {svc.icon}
    </div>
  );
}

// ─── Page de connexion ────────────────────────────────────────────────────────

function PageConnexion({ onConnexion }) {
  const [mode, setMode] = useState("connexion");
  const [form, setForm] = useState({ email: "", motDePasse: "", nom: "" });
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  const soumettre = () => {
    if (!form.email || !form.motDePasse) {
      setErreur("Veuillez remplir tous les champs.");
      return;
    }
    setChargement(true);
    setErreur("");
    setTimeout(() => {
      setChargement(false);
      onConnexion({ email: form.email, name: form.nom || form.email.split("@")[0] });
    }, 900);
  };

  return (
    <div className="page-connexion">
      {/* Grille d'arrière-plan */}
      <div className="page-connexion__grille" />
      <div className="page-connexion__halo" />

      <div className="page-connexion__carte">
        {/* Logo */}
        <div className="page-connexion__logo">
          <div className="page-connexion__logo-wrapper">
            <div className="page-connexion__logo-icone">A</div>
            <span className="page-connexion__logo-texte">AREA</span>
          </div>
          <p className="page-connexion__slogan">
            Connectez vos applications. Automatisez votre vie.
          </p>
        </div>

        {/* Carte */}
        <div className="page-connexion__formulaire">
          {/* Onglets */}
          <div className="page-connexion__onglets">
            {["connexion", "inscription"].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setErreur(""); }}
                className={`page-connexion__onglet ${mode === m ? "page-connexion__onglet--actif" : "page-connexion__onglet--inactif"}`}
              >
                {m === "connexion" ? "Connexion" : "Inscription"}
              </button>
            ))}
          </div>

          {/* Champs */}
          {mode === "inscription" && (
            <div className="page-connexion__champ-groupe">
              <label className="page-connexion__label">Nom</label>
              <input
                type="text"
                placeholder="Votre nom"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="champ-input"
              />
            </div>
          )}

          <div className="page-connexion__champ-groupe">
            <label className="page-connexion__label">E-mail</label>
            <input
              type="email"
              placeholder="vous@exemple.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="champ-input"
            />
          </div>

          <div className="page-connexion__champ-groupe page-connexion__champ-groupe--last">
            <label className="page-connexion__label">Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.motDePasse}
              onChange={(e) => setForm({ ...form, motDePasse: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && soumettre()}
              className="champ-input"
            />
          </div>

          {erreur && <div className="page-connexion__erreur">{erreur}</div>}

          <button
            onClick={soumettre}
            disabled={chargement}
            className={`page-connexion__bouton-principal ${chargement ? "page-connexion__bouton-principal--charge" : "page-connexion__bouton-principal--actif"}`}
          >
            {chargement ? "Chargement…" : mode === "connexion" ? "Se connecter" : "Créer un compte"}
          </button>

          <div className="page-connexion__separateur">
            <div className="page-connexion__separateur-ligne">
              <span className="page-connexion__separateur-texte">ou continuer avec</span>
              <div className="page-connexion__separateur-trait" />
            </div>
            <div className="page-connexion__oauth">
              {["Google", "GitHub"].map((p) => (
                <button
                  key={p}
                  onClick={() => onConnexion({ email: `user@${p.toLowerCase()}.com`, name: "Utilisateur OAuth" })}
                  className="page-connexion__bouton-oauth"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Barre latérale ───────────────────────────────────────────────────────────

function BarreLatérale({ page, setPage, utilisateur, onDeconnexion }) {
  const items = [
    { id: "tableau-de-bord", label: "Tableau de bord", icon: "⊞" },
    { id: "automatisations",  label: "Automatisations",  icon: "⚡" },
    { id: "services",         label: "Services",          icon: "◈" },
    { id: "creation",         label: "Nouvelle automation", icon: "＋", accent: true },
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar__logo">
        <div className="sidebar__logo-icone">A</div>
        <span className="sidebar__logo-texte">AREA</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {items.map((item) => {
          let cls = "sidebar__nav-btn ";
          if (item.accent) cls += "sidebar__nav-btn--accent";
          else if (page === item.id) cls += "sidebar__nav-btn--actif";
          else cls += "sidebar__nav-btn--inactif";

          return (
            <button key={item.id} onClick={() => setPage(item.id)} className={cls}>
              <span className="sidebar__nav-icone">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Utilisateur */}
      <div className="sidebar__utilisateur">
        <div className="sidebar__utilisateur-avatar">
          {utilisateur.name[0].toUpperCase()}
        </div>
        <div className="sidebar__utilisateur-info">
          <p className="sidebar__utilisateur-nom">{utilisateur.name}</p>
          <p className="sidebar__utilisateur-email">{utilisateur.email}</p>
        </div>
        <button onClick={onDeconnexion} title="Se déconnecter" className="sidebar__deconnexion">
          ⇥
        </button>
      </div>
    </aside>
  );
}

// ─── Tableau de bord ──────────────────────────────────────────────────────────

function TableauDeBord({ areas, setPage, servicesSouscrits }) {
  const totalExecutions = areas.reduce((s, a) => s + a.runs, 0);
  const actives = areas.filter((a) => a.active).length;

  const stats = [
    { label: "Automatisations", value: areas.length,              icon: "⚡" },
    { label: "Actives",         value: actives,                   icon: "●" },
    { label: "Exécutions",      value: totalExecutions,           icon: "↺" },
    { label: "Services",        value: servicesSouscrits.length,  icon: "◈" },
  ];

  return (
    <div className="page">
      <div className="page__entete">
        <h1 className="page__titre">Tableau de bord</h1>
        <p className="page__sous-titre">Vue d'ensemble de vos automatisations</p>
      </div>

      {/* Statistiques */}
      <div className="stats-grille">
        {stats.map((s) => (
          <div key={s.label} className="stat-carte">
            <div className="stat-carte__icone">{s.icon}</div>
            <div className="stat-carte__valeur">{s.value}</div>
            <div className="stat-carte__label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Automatisations récentes */}
      <div className="section">
        <div className="section__entete">
          <h2 className="section__titre">Automatisations récentes</h2>
          <button onClick={() => setPage("automatisations")} className="lien-voir-tout">
            Tout voir →
          </button>
        </div>

        {areas.length === 0 ? (
          <EtatVide
            icon="⚡"
            title="Aucune automatisation"
            description="Créez votre première automatisation pour commencer"
            action={{ label: "Créer une automatisation", onClick: () => setPage("creation") }}
          />
        ) : (
          <div className="liste-verticale">
            {areas.slice(0, 3).map((area) => (
              <CarteArea key={area.id} area={area} compact />
            ))}
          </div>
        )}
      </div>

      {/* Démarrage rapide */}
      <div>
        <h2 className="section__titre" style={{ marginBottom: "1rem" }}>Démarrage rapide</h2>
        <div className="demarrage-rapide">
          {[
            { title: "GitHub → Discord", desc: "Alertez votre équipe sur les nouvelles issues", action: "github", reaction: "discor" },
            { title: "Minuteur → Gmail",  desc: "Envoyez des récapitulatifs quotidiens",         action: "timer",  reaction: "gmail" },
            { title: "Gmail → Notion",    desc: "Sauvegardez vos e-mails dans une base",         action: "gmail",  reaction: "notion" },
          ].map((t) => (
            <button key={t.title} onClick={() => setPage("creation")} className="carte-demarrage">
              <div className="carte-demarrage__icones">
                <ServiceIcon service={t.action} size={28} />
                <ServiceIcon service={t.reaction} size={28} />
              </div>
              <p className="carte-demarrage__nom">{t.title}</p>
              <p className="carte-demarrage__desc">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page Automatisations ─────────────────────────────────────────────────────

function PageAutomatisations({ areas, setAreas, setPage }) {
  const basculer = (id) => setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));
  const supprimer = (id) => setAreas((prev) => prev.filter((a) => a.id !== id));

  return (
    <div className="page">
      <div className="page-auto__entete">
        <div>
          <h1 className="page__titre">Automatisations</h1>
          <p className="page__sous-titre">
            {areas.length} automatisation{areas.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={() => setPage("creation")} className="bouton-principal">
          + Nouvelle automatisation
        </button>
      </div>

      {areas.length === 0 ? (
        <EtatVide
          icon="⚡"
          title="Aucune automatisation"
          description="Connectez une Action à une RÉAction et laissez la magie opérer"
          action={{ label: "Créer une automatisation", onClick: () => setPage("creation") }}
        />
      ) : (
        <div className="liste-verticale">
          {areas.map((area) => (
            <CarteArea
              key={area.id}
              area={area}
              onToggle={() => basculer(area.id)}
              onDelete={() => supprimer(area.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CarteArea({ area, compact = false, onToggle, onDelete }) {
  return (
    <div className={`carte-area ${compact ? "carte-area--compact" : "carte-area--normal"}`}>
      <div className="carte-area__icones">
        <ServiceIcon service={area.action.service} size={32} />
        <span className="carte-area__fleche">→</span>
        <ServiceIcon service={area.reaction.service} size={32} />
      </div>

      <div className="carte-area__info">
        <p className="carte-area__nom">{area.name}</p>
        {!compact && (
          <p className="carte-area__detail">
            {area.action.name} → {area.reaction.name}
          </p>
        )}
      </div>

      <div className="carte-area__executions">
        <div className="carte-area__executions-nombre">{area.runs}</div>
        <div className="carte-area__executions-label">exéc.</div>
      </div>

      {!compact && (
        <Badge color={area.active ? "#22c55e" : "#6b7280"}>
          {area.active ? "Actif" : "En pause"}
        </Badge>
      )}

      {onToggle && <Toggle value={area.active} onChange={onToggle} />}
      {onDelete && (
        <button onClick={onDelete} className="carte-area__supprimer" title="Supprimer">
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Page Services ────────────────────────────────────────────────────────────

function PageServices({ servicesSouscrits, setServicesSouscrits }) {
  const basculer = (id) => {
    setServicesSouscrits((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="page">
      <div className="page__entete">
        <h1 className="page__titre">Services</h1>
        <p className="page__sous-titre">
          Connectez vos comptes pour activer les actions et réactions
        </p>
      </div>

      <div className="services-grille">
        {SERVICES.map((svc) => {
          const connecte = servicesSouscrits.includes(svc.id);
          return (
            <div
              key={svc.id}
              className="carte-service"
              style={{ border: connecte ? `1px solid ${svc.color}40` : "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="carte-service__entete">
                <ServiceIcon service={svc} size={44} />
                <Toggle value={connecte} onChange={() => basculer(svc.id)} />
              </div>
              <p className="carte-service__nom">{svc.name}</p>
              <p className="carte-service__desc">{svc.description}</p>

              <div className="carte-service__badges">
                <Badge color="#6366f1">{svc.actions.length} action{svc.actions.length !== 1 ? "s" : ""}</Badge>
                <Badge color="#8b5cf6">{svc.reactions.length} réaction{svc.reactions.length !== 1 ? "s" : ""}</Badge>
              </div>

              {connecte && (
                <div className="carte-service__connexion">
                  <p className="carte-service__connexion-texte">
                    <span className="carte-service__connexion-point" />
                    Connecté
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page Création ────────────────────────────────────────────────────────────

function PageCreation({ servicesSouscrits, setAreas, setPage }) {
  const [etape, setEtape] = useState(0);
  const [actionSelectionnee, setActionSelectionnee] = useState(null);
  const [reactionSelectionnee, setReactionSelectionnee] = useState(null);
  const [nom, setNom] = useState("");
  const [termine, setTermine] = useState(false);

  const servicesConnectes = SERVICES.filter(
    (s) => servicesSouscrits.includes(s.id) || s.id === "timer"
  );
  const avecActions    = servicesConnectes.filter((s) => s.actions.length > 0);
  const avecReactions  = servicesConnectes.filter((s) => s.reactions.length > 0);

  const valider = () => {
    setAreas((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: nom || `${actionSelectionnee.service.name} → ${reactionSelectionnee.service.name}`,
        active: true,
        action:   { service: actionSelectionnee.service.id,   name: actionSelectionnee.action.name },
        reaction: { service: reactionSelectionnee.service.id, name: reactionSelectionnee.action.name },
        runs: 0,
      },
    ]);
    setTermine(true);
    setTimeout(() => setPage("automatisations"), 1800);
  };

  if (termine) {
    return (
      <div className="succes">
        <div className="succes__icone">✓</div>
        <h2 className="succes__titre">Automatisation créée !</h2>
        <p className="succes__message">Redirection en cours…</p>
      </div>
    );
  }

  const etiquettesEtapes = ["Service déclencheur", "Action", "Service de réaction", "Réaction", "Confirmation"];

  return (
    <div className="page-creation">
      <button
        onClick={() => (etape === 0 ? setPage("automatisations") : setEtape(etape - 1))}
        className="bouton-retour"
      >
        ← Retour
      </button>

      <h1 className="page__titre">Nouvelle automatisation</h1>

      {/* Indicateur d'étapes */}
      <div className="indicateur-etapes">
        {etiquettesEtapes.map((s, i) => (
          <div key={s} className="etape">
            <div className={`etape__cercle ${i < etape ? "etape__cercle--passe" : i === etape ? "etape__cercle--actif" : "etape__cercle--futur"}`}>
              {i < etape ? "✓" : i + 1}
            </div>
            <span className={i === etape ? "etape__label--actif" : "etape__label--inactif"}>
              {s}
            </span>
            {i < etiquettesEtapes.length - 1 && <span className="etape__separateur">—</span>}
          </div>
        ))}
      </div>

      {/* Étape 0 : choisir le service déclencheur */}
      {etape === 0 && (
        <SectionEtape title="Choisissez un service déclencheur">
          {avecActions.map((svc) => (
            <CarteServicePicker
              key={svc.id}
              service={svc}
              onClick={() => { setActionSelectionnee({ service: svc, action: null }); setEtape(1); }}
            />
          ))}
        </SectionEtape>
      )}

      {/* Étape 1 : choisir l'action */}
      {etape === 1 && actionSelectionnee && (
        <SectionEtape title={`Choisissez une action depuis ${actionSelectionnee.service.name}`}>
          {actionSelectionnee.service.actions.map((action) => (
            <CarteActionPicker
              key={action.id}
              action={action}
              service={actionSelectionnee.service}
              onClick={() => { setActionSelectionnee({ ...actionSelectionnee, action }); setEtape(2); }}
            />
          ))}
        </SectionEtape>
      )}

      {/* Étape 2 : choisir le service de réaction */}
      {etape === 2 && (
        <SectionEtape title="Choisissez un service de réaction">
          {avecReactions.map((svc) => (
            <CarteServicePicker
              key={svc.id}
              service={svc}
              onClick={() => { setReactionSelectionnee({ service: svc, action: null }); setEtape(3); }}
            />
          ))}
        </SectionEtape>
      )}

      {/* Étape 3 : choisir la réaction */}
      {etape === 3 && reactionSelectionnee && (
        <SectionEtape title={`Choisissez une réaction depuis ${reactionSelectionnee.service.name}`}>
          {reactionSelectionnee.service.reactions.map((action) => (
            <CarteActionPicker
              key={action.id}
              action={action}
              service={reactionSelectionnee.service}
              onClick={() => { setReactionSelectionnee({ ...reactionSelectionnee, action }); setEtape(4); }}
            />
          ))}
        </SectionEtape>
      )}

      {/* Étape 4 : confirmation */}
      {etape === 4 && actionSelectionnee?.action && reactionSelectionnee?.action && (
        <div>
          <div className="confirmation">
            <div className="confirmation__bloc">
              <ServiceIcon service={actionSelectionnee.service} size={48} />
              <p className="confirmation__type">Action</p>
              <p className="confirmation__nom">{actionSelectionnee.action.name}</p>
              <p className="confirmation__service">{actionSelectionnee.service.name}</p>
            </div>

            <div className="confirmation__fleche">→</div>

            <div className="confirmation__bloc">
              <ServiceIcon service={reactionSelectionnee.service} size={48} />
              <p className="confirmation__type">Réaction</p>
              <p className="confirmation__nom">{reactionSelectionnee.action.name}</p>
              <p className="confirmation__service">{reactionSelectionnee.service.name}</p>
            </div>
          </div>

          <div className="confirmation__champ-groupe">
            <label className="confirmation__champ-label">Nom de votre automatisation</label>
            <input
              type="text"
              placeholder={`${actionSelectionnee.service.name} → ${reactionSelectionnee.service.name}`}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="champ-input champ-input--sombre"
            />
          </div>

          <button onClick={valider} className="bouton-creer">
            Créer l'automatisation
          </button>
        </div>
      )}
    </div>
  );
}

function SectionEtape({ title, children }) {
  return (
    <div>
      <h2 className="section-etape__titre">{title}</h2>
      <div className="grille-etape">{children}</div>
    </div>
  );
}

function CarteServicePicker({ service, onClick }) {
  return (
    <button onClick={onClick} className="carte-service-picker">
      <ServiceIcon service={service} size={40} />
      <div>
        <p className="carte-service-picker__nom">{service.name}</p>
        <p className="carte-service-picker__desc">{service.description}</p>
      </div>
    </button>
  );
}

function CarteActionPicker({ action, service, onClick }) {
  return (
    <button onClick={onClick} className="carte-action-picker">
      <div className="carte-action-picker__point" style={{ background: service.color }} />
      <div>
        <p className="carte-action-picker__nom">{action.name}</p>
        <p className="carte-action-picker__desc">{action.description}</p>
      </div>
    </button>
  );
}

// ─── État vide ────────────────────────────────────────────────────────────────

function EtatVide({ icon, title, description, action }) {
  return (
    <div className="etat-vide">
      <div className="etat-vide__icone">{icon}</div>
      <h3 className="etat-vide__titre">{title}</h3>
      <p className="etat-vide__desc">{description}</p>
      {action && (
        <button onClick={action.onClick} className="etat-vide__bouton">
          {action.label}
        </button>
      )}
    </div>
  );
}

// ─── Racine de l'application ──────────────────────────────────────────────────

export default function App() {
  const [utilisateur, setUtilisateur] = useState(null);
  const [page, setPage] = useState("tableau-de-bord");
  const [areas, setAreas] = useState(AUTOMATISATIONS_DEMO);
  const [servicesSouscrits, setServicesSouscrits] = useState(["gmail", "github"]);

  if (!utilisateur) {
    return <PageConnexion onConnexion={(u) => setUtilisateur(u)} />;
  }

  const pages = {
    "tableau-de-bord": <TableauDeBord areas={areas} setPage={setPage} servicesSouscrits={servicesSouscrits} />,
    "automatisations":  <PageAutomatisations areas={areas} setAreas={setAreas} setPage={setPage} />,
    "services":         <PageServices servicesSouscrits={servicesSouscrits} setServicesSouscrits={setServicesSouscrits} />,
    "creation":         <PageCreation servicesSouscrits={servicesSouscrits} setAreas={setAreas} setPage={setPage} />,
  };

  return (
    <div className="app-racine">
      <BarreLatérale
        page={page}
        setPage={setPage}
        utilisateur={utilisateur}
        onDeconnexion={() => setUtilisateur(null)}
      />
      <main className="main-contenu">
        {pages[page] || pages["tableau-de-bord"]}
      </main>
    </div>
  );
}
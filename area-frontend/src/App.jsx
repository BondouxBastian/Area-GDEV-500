import { useState, useEffect, useCallback } from "react";
import "./App.css";
import * as api from "./api";

// Métadonnées visuelles des services (couleur, icône).
// Séparées des données métier qui viennent du serveur.
const SERVICE_VISUAL = {
  gmail:   { color: "#EA4335", icon: "✉" },
  github:  { color: "#24292F", icon: "⌥" },
  discord: { color: "#5865F2", icon: "◈" },
  timer:   { color: "#F59E0B", icon: "◷" },
  notion:  { color: "#000000", icon: "▣" },
};

// Décode le payload d'un JWT sans vérifier la signature.
// Utile côté client pour récupérer les infos utilisateur sans appel réseau.
function decoderJWT(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

// Enrichit les services reçus de l'API avec les métadonnées visuelles locales.
function enrichirService(svc) {
  const visual = SERVICE_VISUAL[svc.id] || {};
  return { ...svc, color: visual.color || "#6366f1", icon: visual.icon || "◈" };
}

// ─── Composants communs ───────────────────────────────────────────────────────

function Badge({ children, color = "#6366f1" }) {
  return (
    <span className="badge" style={{ background: color + "20", color }}>
      {children}
    </span>
  );
}

function Toggle({ value, onChange, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      aria-checked={value}
      role="switch"
      disabled={disabled}
      className={`toggle ${value ? "toggle--actif" : "toggle--inactif"}`}
    >
      <span className={`toggle__curseur ${value ? "toggle__curseur--actif" : "toggle__curseur--inactif"}`} />
    </button>
  );
}

function ServiceIcon({ service, size = 36 }) {
  if (!service) return null;
  const svc = typeof service === "string"
    ? { color: SERVICE_VISUAL[service]?.color || "#6366f1", icon: SERVICE_VISUAL[service]?.icon || "◈" }
    : service;
  return (
    <div
      className="service-icone"
      style={{ width: size, height: size, background: svc.color, fontSize: size * 0.45 }}
    >
      {svc.icon}
    </div>
  );
}

function MessageErreur({ message }) {
  if (!message) return null;
  return <div className="page-connexion__erreur">{message}</div>;
}

// ─── Page de connexion ────────────────────────────────────────────────────────

function PageConnexion({ onConnexion }) {
  const [mode, setMode] = useState("connexion");
  const [form, setForm] = useState({ email: "", motDePasse: "", nom: "" });
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  const soumettre = async () => {
    if (!form.email || !form.motDePasse) {
      setErreur("Veuillez remplir tous les champs.");
      return;
    }
    setChargement(true);
    setErreur("");
    try {
      let data;
      if (mode === "connexion") {
        data = await api.login(form.email, form.motDePasse);
      } else {
        if (!form.nom) {
          setErreur("Le nom est requis.");
          setChargement(false);
          return;
        }
        data = await api.register(form.nom, form.email, form.motDePasse);
      }
      localStorage.setItem("area_token", data.token);
      onConnexion(data.user);
    } catch (err) {
      // Le message d'erreur vient du serveur (identifiants invalides, email déjà pris…)
      setErreur(err.message.replace(/^\d{3} /, ""));
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="page-connexion">
      <div className="page-connexion__grille" />
      <div className="page-connexion__halo" />

      <div className="page-connexion__carte">
        <div className="page-connexion__logo">
          <div className="page-connexion__logo-wrapper">
            <div className="page-connexion__logo-icone">A</div>
            <span className="page-connexion__logo-texte">AREA</span>
          </div>
          <p className="page-connexion__slogan">
            Connectez vos applications. Automatisez votre vie.
          </p>
        </div>

        <div className="page-connexion__formulaire">
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

          <MessageErreur message={erreur} />

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
                  onClick={() => setErreur(`La connexion ${p} nécessite la configuration d'une application OAuth.`)}
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
    { id: "tableau-de-bord",  label: "Tableau de bord",    icon: "" },
    { id: "automatisations",  label: "Automatisations",    icon: "" },
    { id: "services",         label: "Services",           icon: "" },
    { id: "creation",         label: "Nouvelle automation", icon: "", accent: true },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <div className="sidebar__logo-icone">A</div>
        <span className="sidebar__logo-texte">AREA</span>
      </div>

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
    { label: "Automatisations", value: areas.length,             icon: "" },
    { label: "Actives",         value: actives,                  icon: "●" },
    { label: "Exécutions",      value: totalExecutions,          icon: "↺" },
    { label: "Services",        value: servicesSouscrits.length, icon: "◈" },
  ];

  return (
    <div className="page">
      <div className="page__entete">
        <h1 className="page__titre">Tableau de bord</h1>
        <p className="page__sous-titre">Vue d'ensemble de vos automatisations</p>
      </div>

      <div className="stats-grille">
        {stats.map((s) => (
          <div key={s.label} className="stat-carte">
            <div className="stat-carte__icone">{s.icon}</div>
            <div className="stat-carte__valeur">{s.value}</div>
            <div className="stat-carte__label">{s.label}</div>
          </div>
        ))}
      </div>

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

      <div>
        <h2 className="section__titre" style={{ marginBottom: "1rem" }}>Démarrage rapide</h2>
        <div className="demarrage-rapide">
          {[
            { title: "GitHub → Discord", desc: "Alertez votre équipe sur les nouvelles issues", action: "github", reaction: "discord" },
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
  const [erreur, setErreur] = useState("");

  const basculer = async (id, actuel) => {
    try {
      const updated = await api.toggleArea(id, !actuel);
      setAreas((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch {
      setErreur("Impossible de modifier l'automatisation.");
    }
  };

  const supprimer = async (id) => {
    try {
      await api.deleteArea(id);
      setAreas((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setErreur("Impossible de supprimer l'automatisation.");
    }
  };

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

      <MessageErreur message={erreur} />

      {areas.length === 0 ? (
        <EtatVide
          icon=""
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
              onToggle={() => basculer(area.id, area.active)}
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

function PageServices({ services, onBasculer }) {
  const [chargement, setChargement] = useState(null);
  const [erreur, setErreur] = useState("");

  const basculer = async (id, estConnecte) => {
    setChargement(id);
    setErreur("");
    try {
      if (estConnecte) {
        await api.unsubscribeService(id);
      } else {
        await api.subscribeService(id, null);
      }
      onBasculer(id, !estConnecte);
    } catch {
      setErreur("Impossible de modifier la souscription.");
    } finally {
      setChargement(null);
    }
  };

  return (
    <div className="page">
      <div className="page__entete">
        <h1 className="page__titre">Services</h1>
        <p className="page__sous-titre">
          Connectez vos comptes pour activer les actions et réactions
        </p>
      </div>

      <MessageErreur message={erreur} />

      <div className="services-grille">
        {services.map((svc) => (
          <div
            key={svc.id}
            className="carte-service"
            style={{ border: svc.subscribed ? `1px solid ${svc.color}40` : "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="carte-service__entete">
              <ServiceIcon service={svc} size={44} />
              <Toggle
                value={svc.subscribed}
                onChange={() => basculer(svc.id, svc.subscribed)}
                disabled={chargement === svc.id}
              />
            </div>
            <p className="carte-service__nom">{svc.name}</p>
            <p className="carte-service__desc">{svc.description}</p>

            <div className="carte-service__badges">
              <Badge color="#6366f1">{svc.actions.length} action{svc.actions.length !== 1 ? "s" : ""}</Badge>
              <Badge color="#8b5cf6">{svc.reactions.length} réaction{svc.reactions.length !== 1 ? "s" : ""}</Badge>
            </div>

            {svc.subscribed && (
              <div className="carte-service__connexion">
                <p className="carte-service__connexion-texte">
                  <span className="carte-service__connexion-point" />
                  Connecté
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page Création ────────────────────────────────────────────────────────────

function PageCreation({ services, setAreas, setPage }) {
  const [etape, setEtape] = useState(0);
  const [actionSelectionnee, setActionSelectionnee] = useState(null);
  const [reactionSelectionnee, setReactionSelectionnee] = useState(null);
  const [nom, setNom] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [termine, setTermine] = useState(false);

  const avecActions   = services.filter((s) => s.actions.length > 0);
  const avecReactions = services.filter((s) => s.reactions.length > 0);

  const valider = async () => {
    setChargement(true);
    setErreur("");
    try {
      const nouvelleArea = await api.createArea({
        name: nom.trim() || undefined,
        action: {
          service: actionSelectionnee.service.id,
          id: actionSelectionnee.action.id,
          config: {},
        },
        reaction: {
          service: reactionSelectionnee.service.id,
          id: reactionSelectionnee.action.id,
          config: {},
        },
      });
      setAreas((prev) => [nouvelleArea, ...prev]);
      setTermine(true);
      setTimeout(() => setPage("automatisations"), 1800);
    } catch (err) {
      setErreur(err.message.replace(/^\d{3} /, ""));
    } finally {
      setChargement(false);
    }
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

          <MessageErreur message={erreur} />

          <button onClick={valider} disabled={chargement} className="bouton-creer">
            {chargement ? "Création en cours…" : "Créer l'automatisation"}
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
  const [areas, setAreas] = useState([]);
  const [services, setServices] = useState([]);
  const [chargementInitial, setChargementInitial] = useState(true);

  // Charge les données de l'utilisateur (areas + services) après connexion
  const chargerDonnees = useCallback(async () => {
    try {
      const [areasData, servicesData] = await Promise.all([
        api.getAreas(),
        api.getServices(),
      ]);
      setAreas(areasData);
      setServices(servicesData.map(enrichirService));
    } catch {
      // En cas d'erreur réseau, on reste sur des listes vides
    }
  }, []);

  // Restaure la session depuis le token stocké dans le localStorage
  useEffect(() => {
    const token = localStorage.getItem("area_token");
    if (token) {
      const payload = decoderJWT(token);
      // On vérifie que le token n'est pas expiré
      if (payload && payload.exp * 1000 > Date.now()) {
        setUtilisateur({ id: payload.sub, email: payload.email, name: payload.email.split("@")[0] });
      } else {
        localStorage.removeItem("area_token");
      }
    }
    setChargementInitial(false);
  }, []);

  // Dès qu'un utilisateur est identifié, on charge ses données
  useEffect(() => {
    if (utilisateur) chargerDonnees();
  }, [utilisateur, chargerDonnees]);

  const seConnecter = (user) => {
    setUtilisateur(user);
    setPage("tableau-de-bord");
  };

  const seDeconnecter = () => {
    localStorage.removeItem("area_token");
    setUtilisateur(null);
    setAreas([]);
    setServices([]);
    setPage("tableau-de-bord");
  };

  // Met à jour l'état de souscription d'un service sans refetch complet
  const basculerService = (serviceId, nouvelEtat) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, subscribed: nouvelEtat } : s))
    );
  };

  if (chargementInitial) {
    return <div className="page-connexion"><div className="page-connexion__halo" /></div>;
  }

  if (!utilisateur) {
    return <PageConnexion onConnexion={seConnecter} />;
  }

  const servicesSouscrits = services.filter((s) => s.subscribed);

  const pages = {
    "tableau-de-bord": (
      <TableauDeBord areas={areas} setPage={setPage} servicesSouscrits={servicesSouscrits} />
    ),
    "automatisations": (
      <PageAutomatisations areas={areas} setAreas={setAreas} setPage={setPage} />
    ),
    "services": (
      <PageServices services={services} onBasculer={basculerService} />
    ),
    "creation": (
      <PageCreation services={services} setAreas={setAreas} setPage={setPage} />
    ),
  };

  return (
    <div className="app-racine">
      <BarreLatérale
        page={page}
        setPage={setPage}
        utilisateur={utilisateur}
        onDeconnexion={seDeconnecter}
      />
      <main className="main-contenu">
        {pages[page] || pages["tableau-de-bord"]}
      </main>
    </div>
  );
}

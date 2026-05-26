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

function decoderJWT(token) {
  try { return JSON.parse(atob(token.split(".")[1])); }
  catch { return null; }
}

function enrichirService(svc) {
  const v = SERVICE_VISUAL[svc.id] || {};
  return { ...svc, color: v.color || "#6366f1", icon: v.icon || "◈" };
}

// ─── Composants communs ───────────────────────────────────────────────────────

function Badge({ children, color = "#6366f1" }) {
  return <span className="badge" style={{ background: color + "20", color }}>{children}</span>;
}

function Toggle({ value, onChange, disabled }) {
  return (
    <button onClick={() => !disabled && onChange(!value)} aria-checked={value} role="switch"
      disabled={disabled} className={`toggle ${value ? "toggle--actif" : "toggle--inactif"}`}>
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
    <div className="service-icone" style={{ width: size, height: size, background: svc.color, fontSize: size * 0.45 }}>
      {svc.icon}
    </div>
  );
}

function MessageErreur({ message }) {
  if (!message) return null;
  return <div className="page-connexion__erreur">{message}</div>;
}

// Génère dynamiquement les champs d'un formulaire à partir d'un config_schema.
function FormulaireConfig({ schema, values, onChange }) {
  if (!schema || schema.length === 0) return null;
  return (
    <div className="config-schema">
      {schema.map((champ) => (
        <div key={champ.key} className="page-connexion__champ-groupe">
          <label className="page-connexion__label">
            {champ.label}{champ.required && <span style={{ color: "#ef4444" }}> *</span>}
          </label>
          {champ.type === "textarea" ? (
            <textarea
              placeholder={champ.placeholder || ""}
              value={values[champ.key] || ""}
              onChange={(e) => onChange({ ...values, [champ.key]: e.target.value })}
              className="champ-input champ-input--sombre"
              rows={3}
            />
          ) : (
            <input
              type={champ.type || "text"}
              placeholder={champ.placeholder || ""}
              value={values[champ.key] || ""}
              min={champ.min}
              max={champ.max}
              onChange={(e) => onChange({ ...values, [champ.key]: e.target.value })}
              className="champ-input champ-input--sombre"
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Page de connexion ────────────────────────────────────────────────────────

function PageConnexion({ onConnexion }) {
  const [mode, setMode] = useState("connexion");
  const [form, setForm] = useState({ email: "", motDePasse: "", nom: "" });
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  const soumettre = async () => {
    if (!form.email || !form.motDePasse) { setErreur("Veuillez remplir tous les champs."); return; }
    setChargement(true); setErreur("");
    try {
      let data;
      if (mode === "connexion") {
        data = await api.login(form.email, form.motDePasse);
      } else {
        if (!form.nom) { setErreur("Le nom est requis."); setChargement(false); return; }
        data = await api.register(form.nom, form.email, form.motDePasse);
      }
      localStorage.setItem("area_token", data.token);
      onConnexion(data.user);
    } catch (err) {
      setErreur(err.message);
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
          <p className="page-connexion__slogan">Connectez vos applications. Automatisez votre vie.</p>
        </div>

        <div className="page-connexion__formulaire">
          <div className="page-connexion__onglets">
            {["connexion", "inscription"].map((m) => (
              <button key={m} onClick={() => { setMode(m); setErreur(""); }}
                className={`page-connexion__onglet ${mode === m ? "page-connexion__onglet--actif" : "page-connexion__onglet--inactif"}`}>
                {m === "connexion" ? "Connexion" : "Inscription"}
              </button>
            ))}
          </div>

          {mode === "inscription" && (
            <div className="page-connexion__champ-groupe">
              <label className="page-connexion__label">Nom</label>
              <input type="text" placeholder="Votre nom" value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })} className="champ-input" />
            </div>
          )}

          <div className="page-connexion__champ-groupe">
            <label className="page-connexion__label">E-mail</label>
            <input type="email" placeholder="vous@exemple.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} className="champ-input" />
          </div>

          <div className="page-connexion__champ-groupe page-connexion__champ-groupe--last">
            <label className="page-connexion__label">Mot de passe</label>
            <input type="password" placeholder="••••••••" value={form.motDePasse}
              onChange={(e) => setForm({ ...form, motDePasse: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && soumettre()} className="champ-input" />
          </div>

          <MessageErreur message={erreur} />

          <button onClick={soumettre} disabled={chargement}
            className={`page-connexion__bouton-principal ${chargement ? "page-connexion__bouton-principal--charge" : "page-connexion__bouton-principal--actif"}`}>
            {chargement ? "Chargement…" : mode === "connexion" ? "Se connecter" : "Créer un compte"}
          </button>

          <div className="page-connexion__separateur">
            <div className="page-connexion__separateur-ligne">
              <span className="page-connexion__separateur-texte">ou continuer avec</span>
              <div className="page-connexion__separateur-trait" />
            </div>
            <div className="page-connexion__oauth">
              {[{ label: "Google", provider: "google" }, { label: "GitHub", provider: "github" }].map((p) => (
                <button key={p.provider} onClick={() => api.redirectOAuth(p.provider)}
                  className="page-connexion__bouton-oauth">{p.label}</button>
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
    { id: "tableau-de-bord", label: "Tableau de bord",    icon: "" },
    { id: "automatisations", label: "Automatisations",    icon: "" },
    { id: "services",        label: "Services",           icon: "" },
    { id: "creation",        label: "Nouvelle automation", icon: "", accent: true },
    ...(utilisateur.is_admin ? [{ id: "admin", label: "Administration", icon: "" }] : []),
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
              <span className="sidebar__nav-icone">{item.icon}</span>{item.label}
            </button>
          );
        })}
      </nav>
      <div className="sidebar__utilisateur">
        <div className="sidebar__utilisateur-avatar">{utilisateur.name[0].toUpperCase()}</div>
        <div className="sidebar__utilisateur-info">
          <p className="sidebar__utilisateur-nom">{utilisateur.name}</p>
          <p className="sidebar__utilisateur-email">{utilisateur.email}</p>
        </div>
        <button onClick={onDeconnexion} title="Se déconnecter" className="sidebar__deconnexion">⇥</button>
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
          <button onClick={() => setPage("automatisations")} className="lien-voir-tout">Tout voir →</button>
        </div>
        {areas.length === 0 ? (
          <EtatVide icon="⚡" title="Aucune automatisation"
            description="Créez votre première automatisation pour commencer"
            action={{ label: "Créer une automatisation", onClick: () => setPage("creation") }} />
        ) : (
          <div className="liste-verticale">
            {areas.slice(0, 3).map((area) => <CarteArea key={area.id} area={area} compact />)}
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
    } catch { setErreur("Impossible de modifier l'automatisation."); }
  };

  const supprimer = async (id) => {
    try {
      await api.deleteArea(id);
      setAreas((prev) => prev.filter((a) => a.id !== id));
    } catch { setErreur("Impossible de supprimer l'automatisation."); }
  };

  return (
    <div className="page">
      <div className="page-auto__entete">
        <div>
          <h1 className="page__titre">Automatisations</h1>
          <p className="page__sous-titre">{areas.length} automatisation{areas.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setPage("creation")} className="bouton-principal">+ Nouvelle automatisation</button>
      </div>
      <MessageErreur message={erreur} />
      {areas.length === 0 ? (
        <EtatVide icon="" title="Aucune automatisation"
          description="Connectez une Action à une RÉAction et laissez la magie opérer"
          action={{ label: "Créer une automatisation", onClick: () => setPage("creation") }} />
      ) : (
        <div className="liste-verticale">
          {areas.map((area) => (
            <CarteArea key={area.id} area={area}
              onToggle={() => basculer(area.id, area.active)}
              onDelete={() => supprimer(area.id)} />
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
        {!compact && <p className="carte-area__detail">{area.action.name} → {area.reaction.name}</p>}
      </div>
      <div className="carte-area__executions">
        <div className="carte-area__executions-nombre">{area.runs}</div>
        <div className="carte-area__executions-label">exéc.</div>
      </div>
      {!compact && <Badge color={area.active ? "#22c55e" : "#6b7280"}>{area.active ? "Actif" : "En pause"}</Badge>}
      {onToggle && <Toggle value={area.active} onChange={onToggle} />}
      {onDelete && <button onClick={onDelete} className="carte-area__supprimer" title="Supprimer">✕</button>}
    </div>
  );
}

// ─── Page Services ────────────────────────────────────────────────────────────

function PageServices({ services, onBasculer }) {
  const [chargement, setChargement] = useState(null);
  const [erreur, setErreur] = useState("");

  const [modalNotion, setModalNotion] = useState(false);
  const [notionToken, setNotionToken] = useState("");

  const basculer = async (id, estConnecte) => {
    // Notion nécessite un token d'intégration saisi manuellement
    if (id === "notion" && !estConnecte) {
      setModalNotion(true);
      return;
    }
    setChargement(id); setErreur("");
    try {
      if (estConnecte) await api.unsubscribeService(id);
      else await api.subscribeService(id, null);
      onBasculer(id, !estConnecte);
    } catch { setErreur("Impossible de modifier la souscription."); }
    finally { setChargement(null); }
  };

  const confirmerNotion = async () => {
    if (!notionToken.trim()) return;
    setChargement("notion"); setErreur("");
    try {
      await api.subscribeService("notion", notionToken.trim());
      onBasculer("notion", true);
      setModalNotion(false);
      setNotionToken("");
    } catch { setErreur("Token Notion invalide."); }
    finally { setChargement(null); }
  };

  return (
    <div className="page">
      <div className="page__entete">
        <h1 className="page__titre">Services</h1>
        <p className="page__sous-titre">Connectez vos comptes pour activer les actions et réactions</p>
      </div>
      <MessageErreur message={erreur} />

      {modalNotion && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
          <div style={{ background:"#1e1e2e", borderRadius:"1rem", padding:"2rem", width:"100%", maxWidth:"480px" }}>
            <h2 style={{ color:"#fff", marginBottom:"0.5rem" }}>Connecter Notion</h2>
            <p style={{ color:"rgba(255,255,255,0.6)", marginBottom:"1.5rem", fontSize:"0.9rem" }}>
              Créez une intégration sur <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer" style={{color:"#6366f1"}}>notion.so/my-integrations</a> et collez le token ici.
            </p>
            <input type="text" placeholder="secret_xxxxxxxxxxxx"
              value={notionToken} onChange={(e) => setNotionToken(e.target.value)}
              className="champ-input champ-input--sombre" style={{ marginBottom:"1rem" }} />
            <div style={{ display:"flex", gap:"0.75rem" }}>
              <button onClick={confirmerNotion} className="bouton-principal" disabled={!notionToken.trim()}>Connecter</button>
              <button onClick={() => setModalNotion(false)} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.2)", borderRadius:"0.5rem", padding:"0.6rem 1.2rem", color:"rgba(255,255,255,0.7)", cursor:"pointer" }}>Annuler</button>
            </div>
          </div>
        </div>
      )}
      <div className="services-grille">
        {services.map((svc) => (
          <div key={svc.id} className="carte-service"
            style={{ border: svc.subscribed ? `1px solid ${svc.color}40` : "1px solid rgba(255,255,255,0.06)" }}>
            <div className="carte-service__entete">
              <ServiceIcon service={svc} size={44} />
              <Toggle value={svc.subscribed} onChange={() => basculer(svc.id, svc.subscribed)} disabled={chargement === svc.id} />
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
                  <span className="carte-service__connexion-point" />Connecté
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
  const [actionSel, setActionSel] = useState(null);      // { service, action }
  const [reactionSel, setReactionSel] = useState(null);  // { service, reaction }
  const [actionConfig, setActionConfig] = useState({});
  const [reactionConfig, setReactionConfig] = useState({});
  const [nom, setNom] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [termine, setTermine] = useState(false);

  const avecActions   = services.filter((s) => s.actions.length > 0);
  const avecReactions = services.filter((s) => s.reactions.length > 0);

  // Vérifie que tous les champs requis du schema sont remplis
  const configValide = (schema, values) =>
    (schema || []).every((c) => !c.required || (values[c.key] && String(values[c.key]).trim() !== ""));

  const valider = async () => {
    setChargement(true); setErreur("");
    try {
      // Conversion des champs numériques
      const configAction = {};
      (actionSel.action.config_schema || []).forEach((c) => {
        // Les champs datetime-local sont convertis en UTC avant envoi au serveur
        if (c.type === "datetime-local") configAction[c.key] = new Date(actionConfig[c.key]).toISOString();
        else if (c.type === "number") configAction[c.key] = Number(actionConfig[c.key]);
        else configAction[c.key] = actionConfig[c.key];
      });
      const configReaction = {};
      (reactionSel.reaction.config_schema || []).forEach((c) => {
        if (c.type === "datetime-local") configReaction[c.key] = new Date(reactionConfig[c.key]).toISOString();
        else if (c.type === "number") configReaction[c.key] = Number(reactionConfig[c.key]);
        else configReaction[c.key] = reactionConfig[c.key];
      });

      const nouvelleArea = await api.createArea({
        name: nom.trim() || undefined,
        action:   { service: actionSel.service.id,   id: actionSel.action.id,   config: configAction },
        reaction: { service: reactionSel.service.id, id: reactionSel.reaction.id, config: configReaction },
      });
      setAreas((prev) => [nouvelleArea, ...prev]);
      setTermine(true);
      setTimeout(() => setPage("automatisations"), 1800);
    } catch (err) {
      setErreur(err.message);
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

  const etiquettes = ["Service déclencheur", "Action", "Config action", "Service de réaction", "Réaction", "Config réaction", "Confirmation"];

  // Détermine si on peut avancer à l'étape suivante
  const peutAvancer = () => {
    if (etape === 2) return configValide(actionSel?.action?.config_schema, actionConfig);
    if (etape === 5) return configValide(reactionSel?.reaction?.config_schema, reactionConfig);
    return true;
  };

  return (
    <div className="page-creation">
      <button onClick={() => etape === 0 ? setPage("automatisations") : setEtape(etape - 1)} className="bouton-retour">
        ← Retour
      </button>
      <h1 className="page__titre">Nouvelle automatisation</h1>

      <div className="indicateur-etapes">
        {etiquettes.map((s, i) => (
          <div key={s} className="etape">
            <div className={`etape__cercle ${i < etape ? "etape__cercle--passe" : i === etape ? "etape__cercle--actif" : "etape__cercle--futur"}`}>
              {i < etape ? "✓" : i + 1}
            </div>
            <span className={i === etape ? "etape__label--actif" : "etape__label--inactif"}>{s}</span>
            {i < etiquettes.length - 1 && <span className="etape__separateur">—</span>}
          </div>
        ))}
      </div>

      {/* Étape 0 : service déclencheur */}
      {etape === 0 && (
        <SectionEtape title="Choisissez un service déclencheur">
          {avecActions.map((svc) => (
            <CarteServicePicker key={svc.id} service={svc}
              onClick={() => { setActionSel({ service: svc, action: null }); setActionConfig({}); setEtape(1); }} />
          ))}
        </SectionEtape>
      )}

      {/* Étape 1 : action */}
      {etape === 1 && actionSel && (
        <SectionEtape title={`Action depuis ${actionSel.service.name}`}>
          {actionSel.service.actions.map((action) => (
            <CarteActionPicker key={action.id} action={action} service={actionSel.service}
              onClick={() => {
                setActionSel({ ...actionSel, action });
                setActionConfig({});
                // Si pas de config requise, on saute l'étape de config
                setEtape(action.config_schema?.length > 0 ? 2 : 3);
              }} />
          ))}
        </SectionEtape>
      )}

      {/* Étape 2 : config de l'action */}
      {etape === 2 && actionSel?.action && (
        <div>
          <h2 className="section-etape__titre">Configurez l'action</h2>
          <FormulaireConfig schema={actionSel.action.config_schema} values={actionConfig} onChange={setActionConfig} />
          <button onClick={() => peutAvancer() && setEtape(3)} disabled={!peutAvancer()} className="bouton-creer" style={{ marginTop: "1.5rem" }}>
            Continuer →
          </button>
        </div>
      )}

      {/* Étape 3 : service de réaction */}
      {etape === 3 && (
        <SectionEtape title="Choisissez un service de réaction">
          {avecReactions.map((svc) => (
            <CarteServicePicker key={svc.id} service={svc}
              onClick={() => { setReactionSel({ service: svc, reaction: null }); setReactionConfig({}); setEtape(4); }} />
          ))}
        </SectionEtape>
      )}

      {/* Étape 4 : réaction */}
      {etape === 4 && reactionSel && (
        <SectionEtape title={`Réaction depuis ${reactionSel.service.name}`}>
          {reactionSel.service.reactions.map((reaction) => (
            <CarteActionPicker key={reaction.id} action={reaction} service={reactionSel.service}
              onClick={() => {
                setReactionSel({ ...reactionSel, reaction });
                setReactionConfig({});
                setEtape(reaction.config_schema?.length > 0 ? 5 : 6);
              }} />
          ))}
        </SectionEtape>
      )}

      {/* Étape 5 : config de la réaction */}
      {etape === 5 && reactionSel?.reaction && (
        <div>
          <h2 className="section-etape__titre">Configurez la réaction</h2>
          <FormulaireConfig schema={reactionSel.reaction.config_schema} values={reactionConfig} onChange={setReactionConfig} />
          <button onClick={() => peutAvancer() && setEtape(6)} disabled={!peutAvancer()} className="bouton-creer" style={{ marginTop: "1.5rem" }}>
            Continuer →
          </button>
        </div>
      )}

      {/* Étape 6 : confirmation */}
      {etape === 6 && actionSel?.action && reactionSel?.reaction && (
        <div>
          <div className="confirmation">
            <div className="confirmation__bloc">
              <ServiceIcon service={actionSel.service} size={48} />
              <p className="confirmation__type">Action</p>
              <p className="confirmation__nom">{actionSel.action.name}</p>
              <p className="confirmation__service">{actionSel.service.name}</p>
            </div>
            <div className="confirmation__fleche">→</div>
            <div className="confirmation__bloc">
              <ServiceIcon service={reactionSel.service} size={48} />
              <p className="confirmation__type">Réaction</p>
              <p className="confirmation__nom">{reactionSel.reaction.name}</p>
              <p className="confirmation__service">{reactionSel.service.name}</p>
            </div>
          </div>
          <div className="confirmation__champ-groupe">
            <label className="confirmation__champ-label">Nom de votre automatisation</label>
            <input type="text" placeholder={`${actionSel.service.name} → ${reactionSel.service.name}`}
              value={nom} onChange={(e) => setNom(e.target.value)} className="champ-input champ-input--sombre" />
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

// ─── Page Admin ───────────────────────────────────────────────────────────────

function PageAdmin() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const charger = useCallback(async () => {
    try {
      const [u, s] = await Promise.all([api.getUsers(), api.getStats().catch(() => null)]);
      setUsers(u);
      setStats(s);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const supprimer = async (id, nom) => {
    if (!confirm(`Supprimer le compte de ${nom} ?`)) return;
    try {
      await api.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) { setErreur(err.message); }
  };

  const promouvoir = async (id, estAdmin) => {
    try {
      const updated = await api.promoteUser(id, !estAdmin);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_admin: updated.is_admin } : u)));
    } catch (err) { setErreur(err.message); }
  };

  return (
    <div className="page">
      <div className="page__entete">
        <h1 className="page__titre">Administration</h1>
        <p className="page__sous-titre">Gestion des utilisateurs de la plateforme</p>
      </div>

      {stats && (
        <div className="stats-grille" style={{ marginBottom: "2rem" }}>
          {[
            { label: "Utilisateurs", value: stats.users },
            { label: "Automatisations", value: stats.areas },
            { label: "Actives", value: stats.active },
            { label: "Exécutions totales", value: stats.runs },
          ].map((s) => (
            <div key={s.label} className="stat-carte">
              <div className="stat-carte__valeur">{s.value}</div>
              <div className="stat-carte__label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <MessageErreur message={erreur} />

      {chargement ? (
        <p style={{ color: "rgba(255,255,255,0.5)" }}>Chargement…</p>
      ) : (
        <div className="liste-verticale">
          {users.map((u) => (
            <div key={u.id} className="carte-area carte-area--normal">
              <div className="carte-area__info">
                <p className="carte-area__nom">{u.name}</p>
                <p className="carte-area__detail">{u.email} — {u.areas_count} automatisation{u.areas_count !== 1 ? "s" : ""}</p>
              </div>
              <Badge color={u.is_admin ? "#f59e0b" : "#6366f1"}>{u.is_admin ? "Admin" : "Utilisateur"}</Badge>
              <button onClick={() => promouvoir(u.id, u.is_admin)}
                className="bouton-principal" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                {u.is_admin ? "Rétrograder" : "Promouvoir"}
              </button>
              <button onClick={() => supprimer(u.id, u.name)} className="carte-area__supprimer" title="Supprimer">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── État vide ────────────────────────────────────────────────────────────────

function EtatVide({ icon, title, description, action }) {
  return (
    <div className="etat-vide">
      <div className="etat-vide__icone">{icon}</div>
      <h3 className="etat-vide__titre">{title}</h3>
      <p className="etat-vide__desc">{description}</p>
      {action && <button onClick={action.onClick} className="etat-vide__bouton">{action.label}</button>}
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

  const chargerDonnees = useCallback(async () => {
    try {
      const [areasData, servicesData] = await Promise.all([api.getAreas(), api.getServices()]);
      setAreas(areasData);
      setServices(servicesData.map(enrichirService));
    } catch { /* erreur réseau, on garde les listes vides */ }
  }, []);

  useEffect(() => {
    // Lecture du token JWT depuis l'URL (retour OAuth) ou le localStorage
    const params = new URLSearchParams(window.location.search);
    const tokenUrl = params.get("token");
    const erreurOAuth = params.get("oauth_error");

    if (tokenUrl) {
      localStorage.setItem("area_token", tokenUrl);
      // Nettoie l'URL sans recharger la page
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (erreurOAuth) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    const token = localStorage.getItem("area_token");
    if (token) {
      const payload = decoderJWT(token);
      if (payload && payload.exp * 1000 > Date.now()) {
        setUtilisateur({ id: payload.sub, email: payload.email, name: payload.name || payload.email.split("@")[0], is_admin: !!payload.is_admin });
      } else {
        localStorage.removeItem("area_token");
      }
    }
    setChargementInitial(false);
  }, []);

  useEffect(() => {
    if (utilisateur) chargerDonnees();
  }, [utilisateur, chargerDonnees]);

  const seConnecter = (user) => { setUtilisateur(user); setPage("tableau-de-bord"); };
  const seDeconnecter = () => {
    localStorage.removeItem("area_token");
    setUtilisateur(null); setAreas([]); setServices([]);
    setPage("tableau-de-bord");
  };

  const basculerService = (serviceId, nouvelEtat) => {
    setServices((prev) => prev.map((s) => (s.id === serviceId ? { ...s, subscribed: nouvelEtat } : s)));
  };

  if (chargementInitial) return <div className="page-connexion"><div className="page-connexion__halo" /></div>;
  if (!utilisateur) return <PageConnexion onConnexion={seConnecter} />;

  const servicesSouscrits = services.filter((s) => s.subscribed);

  const pages = {
    "tableau-de-bord": <TableauDeBord areas={areas} setPage={setPage} servicesSouscrits={servicesSouscrits} />,
    "automatisations":  <PageAutomatisations areas={areas} setAreas={setAreas} setPage={setPage} />,
    "services":         <PageServices services={services} onBasculer={basculerService} />,
    "creation":         <PageCreation services={services} setAreas={setAreas} setPage={setPage} />,
    "admin":            <PageAdmin />,
  };

  return (
    <div className="app-racine">
      <BarreLatérale page={page} setPage={setPage} utilisateur={utilisateur} onDeconnexion={seDeconnecter} />
      <main className="main-contenu">{pages[page] || pages["tableau-de-bord"]}</main>
    </div>
  );
}

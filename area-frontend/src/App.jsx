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
    description: "Repos, issues, pull requests",
    actions: [
      { id: "new_issue", name: "New issue opened", description: "Triggers when an issue is opened" },
      { id: "new_pr", name: "New pull request", description: "Triggers when a PR is created" },
      { id: "pr_merged", name: "Pull request merged", description: "Triggers when a PR is merged" },
    ],
    reactions: [
      { id: "create_issue", name: "Create an issue", description: "Creates a new issue on a repo" },
      { id: "add_label", name: "Add label to issue", description: "Adds a label to an existing issue" },
    ],
  },
  {
    id: "discord",
    name: "Discord",
    color: "#5865F2",
    icon: "◈",
    description: "Messages, channels, servers",
    actions: [
      { id: "new_message", name: "New message in channel", description: "Triggers on a new message" },
      { id: "new_member", name: "New server member", description: "Triggers when someone joins" },
    ],
    reactions: [
      { id: "send_message", name: "Send a message", description: "Posts a message to a channel" },
      { id: "send_dm", name: "Send a DM", description: "Sends a direct message to a user" },
    ],
  },
  {
    id: "timer",
    name: "Timer",
    color: "#F59E0B",
    icon: "◷",
    description: "Schedules, dates, times",
    actions: [
      { id: "every_day", name: "Every day at time", description: "Triggers daily at a set time" },
      { id: "every_hour", name: "Every X hours", description: "Triggers on an interval" },
      { id: "specific_date", name: "On a specific date", description: "Triggers on a date/time" },
    ],
    reactions: [],
  },
  {
    id: "notion",
    name: "Notion",
    color: "#000000",
    icon: "▣",
    description: "Pages, databases, blocks",
    actions: [
      { id: "new_page", name: "New page created", description: "Triggers when a page is created" },
      { id: "db_item", name: "New database item", description: "Triggers on a new DB entry" },
    ],
    reactions: [
      { id: "create_page", name: "Create a page", description: "Creates a new Notion page" },
      { id: "add_db_item", name: "Add database item", description: "Adds a row to a database" },
    ],
  },
];

const MOCK_AREAS = [
  {
    id: 1,
    name: "GitHub issue → Discord alert",
    active: true,
    action: { service: "github", name: "New issue opened" },
    reaction: { service: "discord", name: "Send a message" },
    runs: 24,
  },
  {
    id: 2,
    name: "Daily email digest",
    active: false,
    action: { service: "timer", name: "Every day at time" },
    reaction: { service: "gmail", name: "Send an email" },
    runs: 7,
  },
];

// ─── Color helpers ────────────────────────────────────────────────────────────
const SERVICE_COLORS = Object.fromEntries(SERVICES.map((s) => [s.id, s.color]));
const getService = (id) => SERVICES.find((s) => s.id === id);

// ─── Components ───────────────────────────────────────────────────────────────

function Badge({ children, color = "#6366f1" }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.04em",
        background: color + "20",
        color: color,
        textTransform: "uppercase",
      }}
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
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: "none",
        background: value ? "#6366f1" : "#e5e7eb",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: value ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}

function ServiceIcon({ service, size = 36 }) {
  const svc = typeof service === "string" ? getService(service) : service;
  if (!svc) return null;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        background: svc.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.45,
        color: "#fff",
        flexShrink: 0,
        fontWeight: 700,
      }}
    >
      {svc.icon}
    </div>
  );
}

// ─── Pages ────────────────────────────────────────────────────────────────────

function LoginPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    setTimeout(() => {
      setLoading(false);
      onLogin({ email: form.email, name: form.name || form.email.split("@")[0] });
    }, 900);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* background grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 420,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 800,
                color: "#fff",
              }}
            >
              A
            </div>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
              AREA
            </span>
          </div>
          <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
            Connect your apps. Automate your life.
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#111118",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            padding: "2rem",
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              background: "#0a0a0f",
              borderRadius: 10,
              padding: 4,
              marginBottom: "1.5rem",
              gap: 4,
            }}
          >
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  border: "none",
                  borderRadius: 8,
                  background: mode === m ? "#6366f1" : "transparent",
                  color: mode === m ? "#fff" : "#6b7280",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13,
                  transition: "all 0.2s",
                  textTransform: "capitalize",
                }}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Fields */}
          {mode === "register" && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
              />
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "rgba(239,68,68,0.1)", borderRadius: 8 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 0",
              border: "none",
              borderRadius: 10,
              background: loading ? "#4f46e5" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "opacity 0.2s",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? "Loading…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>

          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <div style={{ color: "#374151", fontSize: 12, marginBottom: 12, position: "relative" }}>
              <span style={{ background: "#111118", padding: "0 12px", position: "relative", zIndex: 1, color: "#6b7280" }}>
                or continue with
              </span>
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.08)" }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["Google", "GitHub"].map((p) => (
                <button
                  key={p}
                  onClick={() => onLogin({ email: `user@${p.toLowerCase()}.com`, name: "OAuth User" })}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    background: "transparent",
                    color: "#d1d5db",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
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

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  background: "#0a0a0f",
  color: "#fff",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

// ─── Layout / Sidebar ─────────────────────────────────────────────────────────

function Sidebar({ page, setPage, user, onLogout }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "automations", label: "Automations", icon: "⚡" },
    { id: "services", label: "Services", icon: "◈" },
    { id: "create", label: "New automation", icon: "＋", accent: true },
  ];

  return (
    <aside
      style={{
        width: 220,
        minHeight: "100vh",
        background: "#111118",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem 0",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 1.25rem", marginBottom: "2rem" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 800,
            color: "#fff",
          }}
        >
          A
        </div>
        <span style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>AREA</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 0.75rem" }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "9px 12px",
              border: item.accent ? "1px solid rgba(99,102,241,0.4)" : "none",
              borderRadius: 10,
              background:
                item.accent
                  ? "rgba(99,102,241,0.12)"
                  : page === item.id
                  ? "rgba(255,255,255,0.06)"
                  : "transparent",
              color: item.accent ? "#818cf8" : page === item.id ? "#fff" : "#6b7280",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: page === item.id || item.accent ? 600 : 400,
              textAlign: "left",
              marginBottom: 4,
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* User */}
      <div
        style={{
          padding: "1rem 1.25rem",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {user.name[0].toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.name}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email}
          </p>
        </div>
        <button
          onClick={onLogout}
          title="Sign out"
          style={{ background: "transparent", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 16, padding: 4 }}
        >
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

function AreaCard({ area, compact = false, onToggle, onDelete }) {
  const actionSvc = getService(area.action.service);
  const reactionSvc = getService(area.reaction.service);

  return (
    <div
      style={{
        background: "#111118",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14,
        padding: compact ? "1rem 1.25rem" : "1.25rem",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      {/* Service icons */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <ServiceIcon service={area.action.service} size={32} />
        <span style={{ color: "#4b5563", fontSize: 14 }}>→</span>
        <ServiceIcon service={area.reaction.service} size={32} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {area.name}
        </p>
        {!compact && (
          <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
            {area.action.name} → {area.reaction.name}
          </p>
        )}
      </div>

      {/* Runs */}
      <div style={{ textAlign: "center", flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{area.runs}</div>
        <div style={{ fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em" }}>runs</div>
      </div>

      {/* Status */}
      {!compact && (
        <Badge color={area.active ? "#22c55e" : "#6b7280"}>
          {area.active ? "Active" : "Paused"}
        </Badge>
      )}

      {/* Controls */}
      {onToggle && <Toggle value={area.active} onChange={onToggle} />}
      {onDelete && (
        <button
          onClick={onDelete}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#4b5563",
            fontSize: 18,
            padding: 4,
            transition: "color 0.2s",
          }}
          title="Delete"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Services Page ────────────────────────────────────────────────────────────

function ServicesPage({ subscribedServices, setSubscribedServices }) {
  const toggle = (id) => {
    setSubscribedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
          Services
        </h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
          Connect your accounts to enable actions and reactions
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {SERVICES.map((svc) => {
          const connected = subscribedServices.includes(svc.id);
          return (
            <div
              key={svc.id}
              style={{
                background: "#111118",
                border: connected ? `1px solid ${svc.color}40` : "1px solid rgba(255,255,255,0.06)",
                borderRadius: 16,
                padding: "1.5rem",
                transition: "border-color 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <ServiceIcon service={svc} size={44} />
                <Toggle value={connected} onChange={() => toggle(svc.id)} />
              </div>
              <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#fff" }}>{svc.name}</p>
              <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6b7280" }}>{svc.description}</p>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Badge color="#6366f1">{svc.actions.length} actions</Badge>
                <Badge color="#8b5cf6">{svc.reactions.length} reactions</Badge>
              </div>

              {connected && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ margin: 0, fontSize: 11, color: "#22c55e", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                    Connected
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
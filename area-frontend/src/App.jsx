import { useState, useEffect, useRef } from "react";

const SERVICES = [
  {
    id: "gmail",
    name: "Gmail",
    color: "#EA4335",
    icon: "✉",
    description: "Emails, labels, attachments",
    actions: [
      { id: "new_email", name: "New email received", description: "Triggers when a new email arrives" },
      { id: "email_from", name: "Email from specific sender", description: "Triggers on email from a given address" },
      { id: "email_label", name: "Email labeled", description: "Triggers when an email gets a label" },
    ],
    reactions: [
      { id: "send_email", name: "Send an email", description: "Sends an email to a recipient" },
      { id: "create_draft", name: "Create a draft", description: "Creates a draft email" },
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

// ─── Dashboard Page ───────────────────────────────────────────────────────────

function DashboardPage({ areas, setPage, subscribedServices }) {
  const totalRuns = areas.reduce((s, a) => s + a.runs, 0);
  const active = areas.filter((a) => a.active).length;

  const stats = [
    { label: "Automations", value: areas.length, icon: "⚡" },
    { label: "Active", value: active, icon: "●" },
    { label: "Total runs", value: totalRuns, icon: "↺" },
    { label: "Services", value: subscribedServices.length, icon: "◈" },
  ];

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
          Dashboard
        </h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
          Your automation overview
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: "2rem" }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: "#111118",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 14,
              padding: "1.25rem",
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Recent automations */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#fff" }}>Recent automations</h2>
          <button
            onClick={() => setPage("automations")}
            style={{ background: "transparent", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >
            View all →
          </button>
        </div>

        {areas.length === 0 ? (
          <EmptyState
            icon="⚡"
            title="No automations yet"
            description="Create your first automation to get started"
            action={{ label: "Create automation", onClick: () => setPage("create") }}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {areas.slice(0, 3).map((area) => (
              <AreaCard key={area.id} area={area} compact />
            ))}
          </div>
        )}
      </div>

      {/* Quick start */}
      <div>
        <h2 style={{ margin: "0 0 1rem", fontSize: 16, fontWeight: 600, color: "#fff" }}>Quick start</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[
            { title: "GitHub → Discord", desc: "Alert your team on new issues", action: "github", reaction: "discord" },
            { title: "Timer → Gmail", desc: "Send daily digest emails", action: "timer", reaction: "gmail" },
            { title: "Gmail → Notion", desc: "Save emails to a database", action: "gmail", reaction: "notion" },
          ].map((t) => (
            <button
              key={t.title}
              onClick={() => setPage("create")}
              style={{
                background: "#111118",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14,
                padding: "1.25rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "border-color 0.2s",
              }}
            >
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <ServiceIcon service={t.action} size={28} />
                <ServiceIcon service={t.reaction} size={28} />
              </div>
              <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "#fff" }}>{t.title}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{t.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Automations Page ─────────────────────────────────────────────────────────

function AutomationsPage({ areas, setAreas, setPage }) {
  const toggleArea = (id) => {
    setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));
  };
  const deleteArea = (id) => {
    setAreas((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
            Automations
          </h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
            {areas.length} automation{areas.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setPage("create")}
          style={{
            padding: "9px 18px",
            border: "none",
            borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + New automation
        </button>
      </div>

      {areas.length === 0 ? (
        <EmptyState
          icon="⚡"
          title="No automations yet"
          description="Connect your first Action to a REAction and let the magic happen"
          action={{ label: "Create automation", onClick: () => setPage("create") }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {areas.map((area) => (
            <AreaCard key={area.id} area={area} onToggle={() => toggleArea(area.id)} onDelete={() => deleteArea(area.id)} />
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

// ─── Create Automation Page ───────────────────────────────────────────────────

function CreatePage({ subscribedServices, setAreas, setPage }) {
  const [step, setStep] = useState(0); // 0=pick action svc, 1=pick action, 2=pick reaction svc, 3=pick reaction, 4=name+confirm
  const [selectedAction, setSelectedAction] = useState(null); // { service, action }
  const [selectedReaction, setSelectedReaction] = useState(null);
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);

  const connectedServices = SERVICES.filter(
    (s) => subscribedServices.includes(s.id) || s.id === "timer"
  );
  const servicesWithActions = connectedServices.filter((s) => s.actions.length > 0);
  const servicesWithReactions = connectedServices.filter((s) => s.reactions.length > 0);

  const submit = () => {
    setAreas((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: name || `${selectedAction.service.name} → ${selectedReaction.service.name}`,
        active: true,
        action: { service: selectedAction.service.id, name: selectedAction.action.name },
        reaction: { service: selectedReaction.service.id, name: selectedReaction.action.name },
        runs: 0,
      },
    ]);
    setDone(true);
    setTimeout(() => setPage("automations"), 1800);
  };

  if (done) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "rgba(34,197,94,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            animation: "none",
          }}
        >
          ✓
        </div>
        <h2 style={{ margin: 0, color: "#fff", fontSize: 20, fontWeight: 700 }}>Automation created!</h2>
        <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>Redirecting…</p>
      </div>
    );
  }

  const steps = ["Action service", "Action", "Reaction service", "Reaction", "Confirm"];

  return (
    <div style={{ padding: "2rem", maxWidth: 680, margin: "0 auto" }}>
      <button
        onClick={() => (step === 0 ? setPage("automations") : setStep(step - 1))}
        style={{ background: "transparent", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 13, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 6 }}
      >
        ← Back
      </button>

      <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
        New automation
      </h1>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 6, margin: "1.5rem 0 2rem" }}>
        {steps.map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: i < step ? "#6366f1" : i === step ? "rgba(99,102,241,0.2)" : "transparent",
                border: i === step ? "1.5px solid #6366f1" : i < step ? "none" : "1.5px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: i <= step ? "#fff" : "#4b5563",
              }}
            >
              {i < step ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 12, color: i === step ? "#fff" : "#4b5563", fontWeight: i === step ? 600 : 400, display: i < steps.length - 1 ? undefined : undefined }}>
              {s}
            </span>
            {i < steps.length - 1 && <span style={{ color: "#272733", marginLeft: 2 }}>—</span>}
          </div>
        ))}
      </div>

      {/* Step 0: pick action service */}
      {step === 0 && (
        <StepSection title="Choose a trigger service">
          {servicesWithActions.map((svc) => (
            <ServicePickerCard
              key={svc.id}
              service={svc}
              onClick={() => { setSelectedAction({ service: svc, action: null }); setStep(1); }}
            />
          ))}
        </StepSection>
      )}

      {/* Step 1: pick action */}
      {step === 1 && selectedAction && (
        <StepSection title={`Choose an action from ${selectedAction.service.name}`}>
          {selectedAction.service.actions.map((action) => (
            <ActionPickerCard
              key={action.id}
              action={action}
              service={selectedAction.service}
              onClick={() => { setSelectedAction({ ...selectedAction, action }); setStep(2); }}
            />
          ))}
        </StepSection>
      )}

      {/* Step 2: pick reaction service */}
      {step === 2 && (
        <StepSection title="Choose a reaction service">
          {servicesWithReactions.map((svc) => (
            <ServicePickerCard
              key={svc.id}
              service={svc}
              onClick={() => { setSelectedReaction({ service: svc, action: null }); setStep(3); }}
            />
          ))}
        </StepSection>
      )}

      {/* Step 3: pick reaction */}
      {step === 3 && selectedReaction && (
        <StepSection title={`Choose a reaction from ${selectedReaction.service.name}`}>
          {selectedReaction.service.reactions.map((action) => (
            <ActionPickerCard
              key={action.id}
              action={action}
              service={selectedReaction.service}
              onClick={() => { setSelectedReaction({ ...selectedReaction, action }); setStep(4); }}
            />
          ))}
        </StepSection>
      )}

      {/* Step 4: confirm */}
      {step === 4 && selectedAction?.action && selectedReaction?.action && (
        <div>
          <div
            style={{
              background: "#111118",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16,
              padding: "1.5rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}
          >
            <div style={{ flex: 1, textAlign: "center" }}>
              <ServiceIcon service={selectedAction.service} size={48} />
              <p style={{ margin: "10px 0 4px", fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Action</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff" }}>{selectedAction.action.name}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>{selectedAction.service.name}</p>
            </div>

            <div style={{ fontSize: 24, color: "#6366f1" }}>→</div>

            <div style={{ flex: 1, textAlign: "center" }}>
              <ServiceIcon service={selectedReaction.service} size={48} />
              <p style={{ margin: "10px 0 4px", fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Reaction</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff" }}>{selectedReaction.action.name}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>{selectedReaction.service.name}</p>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Name your automation
            </label>
            <input
              type="text"
              placeholder={`${selectedAction.service.name} → ${selectedReaction.service.name}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ ...inputStyle, background: "#111118" }}
            />
          </div>

          <button
            onClick={submit}
            style={{
              width: "100%",
              padding: "14px 0",
              border: "none",
              borderRadius: 12,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Create automation ⚡
          </button>
        </div>
      )}
    </div>
  );
}

function StepSection({ title, children }) {
  return (
    <div>
      <h2 style={{ margin: "0 0 1rem", fontSize: 16, fontWeight: 600, color: "#9ca3af" }}>{title}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function ServicePickerCard({ service, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "#111118",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14,
        padding: "1.25rem",
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color 0.2s",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <ServiceIcon service={service} size={40} />
      <div>
        <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 700, color: "#fff" }}>{service.name}</p>
        <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{service.description}</p>
      </div>
    </button>
  );
}

function ActionPickerCard({ action, service, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "#111118",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14,
        padding: "1rem 1.25rem",
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        transition: "border-color 0.2s",
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: service.color,
          marginTop: 5,
          flexShrink: 0,
        }}
      />
      <div>
        <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: "#fff" }}>{action.name}</p>
        <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{action.description}</p>
      </div>
    </button>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ icon, title, description, action }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 2rem",
        background: "#111118",
        border: "1px dashed rgba(255,255,255,0.1)",
        borderRadius: 16,
        textAlign: "center",
        gap: 12,
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 4 }}>{icon}</div>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 14, color: "#6b7280", maxWidth: 300 }}>{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 8,
            padding: "9px 20px",
            border: "none",
            borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [areas, setAreas] = useState(MOCK_AREAS);
  const [subscribedServices, setSubscribedServices] = useState(["gmail", "github"]);

  if (!user) {
    return <LoginPage onLogin={(u) => setUser(u)} />;
  }

  const pageComponents = {
    dashboard: <DashboardPage areas={areas} setPage={setPage} subscribedServices={subscribedServices} />,
    automations: <AutomationsPage areas={areas} setAreas={setAreas} setPage={setPage} />,
    services: <ServicesPage subscribedServices={subscribedServices} setSubscribedServices={setSubscribedServices} />,
    create: <CreatePage subscribedServices={subscribedServices} setAreas={setAreas} setPage={setPage} />,
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#0a0a0f",
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        color: "#fff",
      }}
    >
      <Sidebar page={page} setPage={setPage} user={user} onLogout={() => setUser(null)} />
      <main style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
        {pageComponents[page] || pageComponents.dashboard}
      </main>
    </div>
  );
}
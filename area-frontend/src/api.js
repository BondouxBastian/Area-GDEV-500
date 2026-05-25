// Couche de communication avec le serveur applicatif (port 8080).
// Toute la logique métier est côté serveur — ce fichier ne fait que du HTTP.

const BASE = import.meta.env.VITE_API_URL || "/api";

async function request(method, path, body) {
  const token = localStorage.getItem("area_token");
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    let message;
    try {
      const data = await res.json();
      message = data.error || res.statusText;
    } catch {
      message = res.statusText;
    }
    throw new Error(message);
  }
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const login = (email, password) =>
  request("POST", "/auth/login", { email, password });

export const register = (name, email, password) =>
  request("POST", "/auth/register", { name, email, password });

// Redirige vers le backend qui initie le flux OAuth côté serveur
export const redirectOAuth = (provider) => {
  window.location.href = `${BASE}/auth/oauth/${provider}/init`;
};

// ── About ─────────────────────────────────────────────────────────────────────

export const getAbout = () => request("GET", "/about.json");

// ── Services ──────────────────────────────────────────────────────────────────

export const getServices = () => request("GET", "/services");
export const subscribeService = (serviceId, oauthToken) =>
  request("POST", `/services/${serviceId}/subscribe`, { oauthToken });
export const unsubscribeService = (serviceId) =>
  request("DELETE", `/services/${serviceId}/subscribe`);

// ── AREAs ─────────────────────────────────────────────────────────────────────

export const getAreas = () => request("GET", "/areas");
export const createArea = (data) => request("POST", "/areas", data);
export const updateArea = (id, data) => request("PUT", `/areas/${id}`, data);
export const deleteArea = (id) => request("DELETE", `/areas/${id}`);
export const toggleArea = (id, active) => request("PATCH", `/areas/${id}`, { active });

// ── Admin ─────────────────────────────────────────────────────────────────────

export const getUsers = () => request("GET", "/admin/users");
export const getStats = () => request("GET", "/admin/stats");
export const deleteUser = (id) => request("DELETE", `/admin/users/${id}`);
export const promoteUser = (id, isAdmin) => request("PATCH", `/admin/users/${id}`, { is_admin: isAdmin });

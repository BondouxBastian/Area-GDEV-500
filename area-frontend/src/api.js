/**
 * API service — communicates with the application server (port 8080)
 * All business logic lives server-side; this is just the HTTP glue layer.
 */

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
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const login = (email, password) =>
  request("POST", "/auth/login", { email, password });

export const register = (name, email, password) =>
  request("POST", "/auth/register", { name, email, password });

export const loginOAuth = (provider, token) =>
  request("POST", `/auth/oauth/${provider}`, { token });

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
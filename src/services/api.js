import { auth } from "./firebase";

async function authHeader() {
  try {
    const u = auth.currentUser;
    if (!u) return {};
    return { Authorization: "Bearer " + (await u.getIdToken()) };
  } catch (e) {
    return {};
  }
}

const BASE_URL = "https://ub3-pay-backend.onrender.com";

async function apiPost(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || "Request failed");
    err.status = res.status;
    err.code = data.error;
    throw err;
  }
  return data;
}

async function apiGet(path) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: await authHeader() });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || "Request failed");
    err.status = res.status;
    err.code = data.error;
    throw err;
  }
  return data;
}

async function apiDelete(path) {
  const res = await fetch(`${BASE_URL}${path}`, { method: "DELETE", headers: await authHeader() });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || "Request failed");
    err.status = res.status;
    err.code = data.error;
    throw err;
  }
  return data;
}

export { apiGet, apiPost, apiDelete, BASE_URL };

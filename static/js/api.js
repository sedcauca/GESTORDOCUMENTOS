import { els } from "./store.js";
import { showLogin } from "./session.js";

export function showToast(message, type) {
  els.toast.hidden = false;
  els.toast.textContent = message;
  els.toast.className = `toast ${type}`;
  window.clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(() => {
    els.toast.hidden = true;
  }, 4200);
}
export async function api(url, options = {}) {
  const opts = {
    ...options,
    credentials: "include",
    headers: { ...(options.headers || {}) },
  };
  const response = await fetch(url, opts);
  let data = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await response.json();
  }
  if (response.status === 401 && !url.includes("/api/auth/login")) {
    showLogin();
    throw new Error("Sesión expirada. Inicie sesión de nuevo.");
  }
  if (!response.ok) {
    const detail = data?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg || JSON.stringify(item)).join("; ")
      : detail || "Ocurrió un error inesperado";
    throw new Error(message);
  }
  return data;
}

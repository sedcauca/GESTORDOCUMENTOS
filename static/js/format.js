export function todayLabel() {
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}
export function auditCell(name, iso, emptyLabel, extraClass = "") {
  const cls = extraClass ? ` ${extraClass}` : "";
  if (!iso) {
    if (!emptyLabel) return `<td class="audit-cell${cls}"></td>`;
    return `<td class="audit-cell${cls}"><span class="audit-empty">${escapeHtml(emptyLabel)}</span></td>`;
  }
  const who = name ? escapeHtml(name) : escapeHtml(emptyLabel);
  return `<td class="audit-cell${cls}"><span class="audit-name">${who}</span><span class="audit-time">${escapeHtml(formatDateTime(iso))}</span></td>`;
}
export function formatDateTime(iso) {
  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
export function formatBytes(bytes) {
  const mb = (Number(bytes) || 0) / (1024 * 1024);
  const text = new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: mb > 0 && mb < 0.01 ? 4 : 2,
  }).format(mb);
  return `${text} MB`;
}
export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
export function pageForIndex(index, size) {
  if (index < 0) return 0;
  return Math.floor(index / size);
}
export function pageWindow(items, page, size) {
  const total = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(0, page || 0), total - 1);
  const start = current * size;
  return {
    items: items.slice(start, start + size),
    current,
    total,
    from: items.length ? start + 1 : 0,
    to: Math.min(start + size, items.length),
    count: items.length,
  };
}
export function documentPhrase(count) {
  const total = Number(count) || 0;
  if (total === 0) return "Carpeta vacía";
  if (total === 1) return "1 documento";
  return `${total} documentos`;
}
export function folderPhrase(count) {
  const total = Number(count) || 0;
  if (total === 1) return "1 carpeta";
  return `${total} carpetas`;
}
export function fillFolderPager(nav, view, onChange) {
  nav.className = "proj-pager";
  nav.setAttribute("aria-label", "Paginación de carpetas");
  nav.replaceChildren();
  nav.hidden = view.total <= 1;
  if (nav.hidden) return nav;
  const info = document.createElement("p");
  info.className = "proj-pager-range";
  info.textContent = `Mostrando ${view.from}–${view.to} de ${view.count} carpetas`;
  const controls = document.createElement("div");
  controls.className = "proj-pager-controls";
  const prev = document.createElement("button");
  prev.type = "button";
  prev.className = "btn btn-secondary";
  prev.textContent = "Anterior";
  prev.disabled = view.current <= 0;
  prev.addEventListener("click", () => onChange(view.current - 1));
  const mark = document.createElement("span");
  mark.className = "proj-pager-mark";
  mark.textContent = `Página ${view.current + 1} de ${view.total}`;
  const next = document.createElement("button");
  next.type = "button";
  next.className = "btn btn-primary";
  next.textContent = "Siguiente";
  next.disabled = view.current >= view.total - 1;
  next.addEventListener("click", () => onChange(view.current + 1));
  controls.append(prev, mark, next);
  nav.append(info, controls);
  return nav;
}
export function fillPager(nav, label, view, onChange) {
  nav.classList.add("pager");
  nav.setAttribute("aria-label", `Paginación de ${label}`);
  nav.replaceChildren();
  nav.hidden = view.total <= 1;
  if (nav.hidden) return nav;
  const title = document.createElement("strong");
  title.className = "pager-title";
  title.textContent = label.charAt(0).toUpperCase() + label.slice(1);
  const info = document.createElement("span");
  info.className = "pager-range";
  info.textContent = `${view.from}–${view.to} de ${view.count}`;
  const prev = document.createElement("button");
  prev.type = "button";
  prev.className = "btn btn-secondary";
  prev.textContent = "Anterior";
  prev.disabled = view.current <= 0;
  prev.addEventListener("click", () => onChange(view.current - 1));
  const mark = document.createElement("span");
  mark.className = "pager-mark";
  mark.textContent = `Página ${view.current + 1} de ${view.total}`;
  const next = document.createElement("button");
  next.type = "button";
  next.className = "btn btn-primary";
  next.textContent = "Siguiente";
  next.disabled = view.current >= view.total - 1;
  next.addEventListener("click", () => onChange(view.current + 1));
  nav.append(title, info, prev, mark, next);
  return nav;
}
export function makePager(label, view, onChange) {
  const nav = document.createElement("nav");
  return fillPager(nav, label, view, onChange);
}

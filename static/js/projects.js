import { state, els, ROLE, box } from "./store.js";
import { selectedProjectDependenciaId, fillProjectDependenciaSelect, dependenciaGroups, loadDependenciaCatalog, userSearchValue } from "./accounts.js";
import { showToast, api } from "./api.js";
import { askConfirm } from "./dialogs.js";
import { loadDocuments } from "./documents.js";
import { currentFolder, projectFolderPanel, renderFolders } from "./folders.js";
import { todayLabel, escapeHtml } from "./format.js";
import { canWrite, canManageProjects, showApp, showLogin } from "./session.js";
import { refreshTrashCount } from "./trash.js";

export function deleteProject(project) {
  if (!project) return;
  if (!canManageProjects()) {
    showToast("No tiene permisos para borrar proyectos.", "err");
    return;
  }
  askConfirm({
    title: "¿Borrar proyecto?",
    message:
      "¿Está seguro de borrar este proyecto? Se moverá a la papelera con todo su contenido. Podrá restaurarlo después si fue un error.",
    confirmLabel: "Sí, borrar proyecto",
    danger: true,
    subject: {
      label1: "Proyecto",
      value1: project.name,
      label2: "BPIN",
      value2: project.bpin,
    },
    onConfirm: async () => {
      await api(`/api/projects/${project.id}`, { method: "DELETE" });
      showToast("Proyecto movido a la papelera.", "ok");
      if (state.currentProject?.id === project.id) {
        state.currentProject = null;
        state.currentFolderId = null;
      }
      await loadProjects();
      await refreshTrashCount();
    },
  });
}
export function confirmRenameProject(project) {
  if (!project) return;
  if (!canManageProjects()) {
    showToast("No tiene permisos para renombrar proyectos.", "err");
    return;
  }
  askConfirm({
    title: "¿Renombrar proyecto?",
    message: "¿Está seguro de renombrar este proyecto? En el siguiente paso podrá editar el nombre y el BPIN.",
    confirmLabel: "Sí, continuar",
    danger: false,
    subject: {
      label1: "Proyecto",
      value1: project.name,
      label2: "BPIN",
      value2: project.bpin,
    },
    onConfirm: () => {
      openProjectDialog("rename", project);
    },
  });
}
export function selectedMemberIds() {
  if (!els.projectMembers) return [];
  const ids = [...els.projectMembers.querySelectorAll("input[type=checkbox]:checked")].map((input) =>
    Number(input.value)
  );
  return [...new Set(ids)];
}
export function projectField(id) {
  return document.getElementById(id);
}
export function setProjectFieldError(input, errorId, message) {
  const errorEl = projectField(errorId);
  if (!input || !errorEl) return;
  if (message) {
    errorEl.hidden = false;
    errorEl.textContent = message;
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", errorId);
  } else {
    errorEl.hidden = true;
    errorEl.textContent = "";
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
  }
}
export function clearProjectFieldErrors() {
  setProjectFieldError(els.projectName, "project-name-error", "");
  setProjectFieldError(els.projectBpin, "project-bpin-error", "");
  setProjectFieldError(els.projectDependencia, "project-dependencia-error", "");
  if (els.projectError) {
    els.projectError.hidden = true;
    els.projectError.textContent = "";
  }
  const note = projectField("project-dependencia-note");
  if (note) {
    note.hidden = true;
    note.textContent = "";
  }
}
export function setProjectGeneralError(message) {
  if (!els.projectError) return;
  if (message) {
    els.projectError.hidden = false;
    els.projectError.textContent = message;
  } else {
    els.projectError.hidden = true;
    els.projectError.textContent = "";
  }
}
export function projectCreateError(error) {
  const editing = state.projectDialogMode === "rename";
  const fallback = editing
    ? "No fue posible guardar el proyecto. Revisa la información e intenta nuevamente."
    : "No fue posible crear el proyecto. Revisa la información e intenta nuevamente.";
  if (error instanceof TypeError) return { general: "No fue posible conectar con el servidor. Intenta nuevamente." };
  const raw = String(error?.message || "").trim();
  if (!raw || raw === "Ocurrió un error inesperado" || raw === "[object Object]") return { general: fallback };
  if (raw.length > 180 || raw.includes("{") || /traceback/i.test(raw)) return { general: fallback };
  if (/ya existe un proyecto con el bpin/i.test(raw)) return { bpin: "Ya existe un proyecto con este BPIN." };
  if (/seleccione una dependencia|dependencia no válida/i.test(raw)) return { dependencia: "Selecciona una dependencia." };
  if (/nombre del proyecto y bpin/i.test(raw)) return { name: "El nombre del proyecto es obligatorio." };
  return { general: raw };
}
export function applyProjectRequestError(error) {
  const mapped = projectCreateError(error);
  if (mapped.name) setProjectFieldError(els.projectName, "project-name-error", mapped.name);
  if (mapped.bpin) setProjectFieldError(els.projectBpin, "project-bpin-error", mapped.bpin);
  if (mapped.dependencia) setProjectFieldError(els.projectDependencia, "project-dependencia-error", mapped.dependencia);
  if (mapped.general) setProjectGeneralError(mapped.general);
  if (mapped.name) els.projectName?.focus();
  else if (mapped.bpin) els.projectBpin?.focus();
  else if (mapped.dependencia) els.projectDependencia?.focus();
  else els.projectError?.focus?.();
}
export function bpinAlreadyUsed(bpin) {
  const currentId = state.projectDialogMode === "rename" ? state.editingProjectId : null;
  return (state.projects || []).some((item) => item.bpin === bpin && item.id !== currentId);
}
export function syncProjectSaveState() {
  if (!els.btnSaveProject || state.projectSaving) return;
  const name = els.projectName?.value.trim() || "";
  const bpin = els.projectBpin?.value.trim() || "";
  const isSuper = state.user?.role === ROLE.SUPER;
  const dependenciaId = selectedProjectDependenciaId();
  const missingDependencia = isSuper && !dependenciaId;
  els.btnSaveProject.disabled = !name || !bpin || missingDependencia;
}
export function setProjectFormLocked(locked) {
  state.projectSaving = locked;
  [els.projectName, els.projectBpin, els.btnCancelProject, projectField("btn-close-project"), projectField("project-members-search")].forEach(
    (control) => {
      if (control) control.disabled = locked;
    }
  );
  if (els.projectDependencia) {
    els.projectDependencia.disabled = locked || state.user?.role !== ROLE.SUPER;
  }
  els.projectMembers?.querySelectorAll("input").forEach((input) => {
    input.disabled = locked;
  });
  if (locked && els.btnSaveProject) els.btnSaveProject.disabled = true;
}
export function updateMemberCount() {
  const countEl = projectField("project-members-count");
  if (!countEl || !els.projectMembers) return;
  const hasOptions = els.projectMembers.querySelector("input[type=checkbox]");
  if (!hasOptions) {
    countEl.hidden = true;
    countEl.textContent = "";
    return;
  }
  const count = selectedMemberIds().length;
  countEl.hidden = false;
  if (count === 1) countEl.textContent = "1 usuario seleccionado";
  else countEl.textContent = `${count} usuarios seleccionados`;
}
export function renderProjectMembers(uploaders, selectedIds) {
  const selected = new Set(selectedIds);
  const search = projectField("project-members-search");
  els.projectMembers.innerHTML = "";
  els.projectMembers.classList.toggle("is-scroll", uploaders.length > 6);
  if (els.projectMembersHint) {
    els.projectMembersHint.textContent =
      "Solo aparecen usuarios con el rol Usuario. Estas cuentas podrán ver el proyecto y cargar documentos.";
  }
  if (!uploaders.length) {
    if (search) search.hidden = true;
    const title = document.createElement("strong");
    title.className = "member-empty-title";
    title.textContent = "No hay usuarios disponibles";
    const text = document.createElement("p");
    text.className = "member-status";
    text.textContent = "Crea primero un usuario con rol Usuario para poder asignarlo a este proyecto.";
    els.projectMembers.append(title, text);
    updateMemberCount();
    return;
  }
  if (search) {
    search.hidden = uploaders.length <= 6;
    search.value = "";
  }
  uploaders.forEach((user) => {
    const label = document.createElement("label");
    label.className = "member-option";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = String(user.id);
    input.checked = selected.has(user.id);
    input.addEventListener("change", () => updateMemberCount());
    const text = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = user.full_name;
    text.appendChild(name);
    if (user.email) {
      const mail = document.createElement("small");
      mail.textContent = user.email;
      text.appendChild(mail);
    }
    label.append(input, text);
    els.projectMembers.appendChild(label);
  });
  updateMemberCount();
}
export async function loadProjectMemberOptions(selectedIds = [], dependenciaId = null) {
  if (!els.projectMembers) return;
  const search = projectField("project-members-search");
  if (search) search.hidden = true;
  const countEl = projectField("project-members-count");
  if (countEl) countEl.hidden = true;
  els.projectMembers.classList.remove("is-scroll");
  els.projectMembers.innerHTML = "";
  const loading = document.createElement("p");
  loading.className = "member-status";
  loading.textContent = "Cargando usuarios...";
  els.projectMembers.appendChild(loading);
  try {
    const users = await api("/api/users");
    const uploaders = users.filter((user) => {
      if (user.role !== ROLE.USER || !user.is_active) return false;
      if (dependenciaId && user.dependencia_id !== Number(dependenciaId)) return false;
      return true;
    });
    const unique = [];
    const seen = new Set();
    uploaders.forEach((user) => {
      if (seen.has(user.id)) return;
      seen.add(user.id);
      unique.push(user);
    });
    renderProjectMembers(unique, selectedIds);
  } catch (error) {
    els.projectMembers.innerHTML = "";
    const title = document.createElement("strong");
    title.className = "member-empty-title";
    title.textContent = "No fue posible cargar los usuarios.";
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "btn btn-secondary";
    retry.textContent = "Reintentar";
    retry.addEventListener("click", () => {
      loadProjectMemberOptions(selectedIds, dependenciaId);
    });
    els.projectMembers.append(title, retry);
    if (!(error instanceof TypeError) && error?.message && error.message.length < 180) {
      const detail = document.createElement("p");
      detail.className = "member-status";
      detail.textContent = error.message;
      els.projectMembers.insertBefore(detail, retry);
    }
  }
}
export function closeProjectDialog() {
  if (state.projectSaving || !els.dialog?.open) return;
  clearProjectFieldErrors();
  els.dialog.close();
}
export function focusAfterProjectDialog() {
  if (state.projectDialogReturn === "rename") {
    document.querySelector(".proj-summary-actions .btn-secondary")?.focus();
    return;
  }
  if (els.btnHeaderNewProject && !els.btnHeaderNewProject.hidden) {
    els.btnHeaderNewProject.focus();
    return;
  }
  document.querySelector(".proj-summary-actions .btn-secondary")?.focus();
}
export async function openProjectDialog(mode = "create", project = null, dependenciaId = null) {
  if (mode === "create" && !canManageProjects()) {
    showToast("No tiene permisos para crear proyectos.", "err");
    return;
  }
  if (mode === "rename" && !canManageProjects()) {
    showToast("No tiene permisos para renombrar proyectos.", "err");
    return;
  }
  state.projectDialogMode = mode;
  state.projectDialogReturn = mode;
  state.projectSaving = false;
  state.editingProjectId = mode === "rename" && project ? project.id : null;
  clearProjectFieldErrors();
  els.projectForm.reset();

  if (mode === "rename" && project) {
    if (els.projectDialogTitle) els.projectDialogTitle.textContent = "Renombrar proyecto";
    if (els.projectDialogHelp) {
      els.projectDialogHelp.textContent =
        "Puede actualizar el nombre y el BPIN. La carpeta en disco se ajustará si cambian.";
    }
    els.projectName.value = project.name;
    els.projectBpin.value = project.bpin;
    els.btnSaveProject.textContent = "Guardar cambios";
  } else {
    if (els.projectDialogTitle) els.projectDialogTitle.textContent = "Crear nuevo proyecto";
    if (els.projectDialogHelp) {
      els.projectDialogHelp.textContent =
        "El nombre y el BPIN definirán la carpeta raíz del proyecto en el servidor.";
    }
    els.btnSaveProject.textContent = "Crear proyecto";
  }
  els.btnSaveProject.disabled = true;
  if (els.projectDependencia) {
    els.projectDependencia.disabled = true;
    els.projectDependencia.innerHTML = "";
    const loadingOption = document.createElement("option");
    loadingOption.value = "";
    loadingOption.textContent = "Cargando dependencias...";
    els.projectDependencia.appendChild(loadingOption);
  }
  document.body.style.overflow = "hidden";
  els.dialog.showModal();
  els.projectName.focus();
  if (mode === "rename") els.projectName.select();

  try {
    await loadDependenciaCatalog(project?.dependencia_id || state.user?.dependencia_id);
    const presetDependencia =
      mode === "rename" && project ? project.dependencia_id : dependenciaId || state.user?.dependencia_id;
    fillProjectDependenciaSelect(presetDependencia);
  if (els.projectDependencia) {
    els.projectDependencia.required = false;
    els.projectDependencia.disabled = state.user?.role !== ROLE.SUPER;
  }
    const note = projectField("project-dependencia-note");
    if (note && state.user?.role === ROLE.SUPER && !state.dependencias.length) {
      note.hidden = false;
      note.textContent = "No hay dependencias disponibles. Crea una dependencia antes de crear el proyecto.";
    }
  } catch (error) {
    const note = projectField("project-dependencia-note");
    if (note) {
      note.hidden = false;
      note.textContent = "No fue posible cargar las dependencias.";
    }
    if (els.projectDependencia) {
      els.projectDependencia.innerHTML = "";
      const emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = "Selecciona una dependencia";
      els.projectDependencia.appendChild(emptyOption);
    }
    if (els.projectMembers) els.projectMembers.innerHTML = "";
  }
  syncProjectSaveState();
}
export function projectQuery() {
  const fromDirectory = (els.directorySearch?.value || "").trim();
  const fromSidebar = (els.projectSearch?.value || "").trim();
  return (fromDirectory || fromSidebar).toLowerCase();
}
export function filteredProjects() {
  const query = projectQuery();
  if (!query) return state.projects;
  return state.projects.filter((project) => {
    const name = String(project.name || "").toLowerCase();
    const bpin = String(project.bpin || "").toLowerCase();
    const dependencia = String(project.dependencia || "").toLowerCase();
    return name.includes(query) || bpin.includes(query) || dependencia.includes(query);
  });
}
export function appendProjectNavRow(project) {
  const row = document.createElement("div");
  row.className = "nav-row";

  const button = document.createElement("button");
  button.type = "button";
  button.className = `nav-item${state.currentProject?.id === project.id ? " active" : ""}`;
  button.innerHTML = `<strong>${escapeHtml(project.name)}</strong><span>BPIN ${escapeHtml(project.bpin)}</span>`;
  button.addEventListener("click", () => selectProject(project.id));

  const actions = document.createElement("div");
  actions.className = "nav-actions";

  if (canManageProjects()) {
    const renameBtn = document.createElement("button");
    renameBtn.type = "button";
    renameBtn.className = "nav-action";
    renameBtn.textContent = "Renombrar proyecto";
    renameBtn.title = "Renombrar proyecto";
    renameBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      confirmRenameProject(project);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "nav-action danger";
    deleteBtn.textContent = "Borrar proyecto";
    deleteBtn.title = "Borrar proyecto";
    deleteBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteProject(project);
    });

    actions.append(renameBtn, deleteBtn);
  }

  row.append(button, actions);
  els.projectList.appendChild(row);
}
export function renderProjects() {
  if (!els.projectList) {
    renderDirectory();
    return;
  }
  els.projectList.innerHTML = "";
  if (!state.projects.length) {
    els.projectList.innerHTML = `<p class="nav-item" style="cursor:default;opacity:.7">No hay proyectos</p>`;
    renderDirectory();
    return;
  }

  const projects = filteredProjects();
  if (!projects.length) {
    els.projectList.innerHTML = `<p class="nav-item" style="cursor:default;opacity:.7">Sin coincidencias</p>`;
    renderDirectory();
    return;
  }

  renderDirectory();

  const query = projectQuery();
  dependenciaGroups(projects, { includeEmpty: canManageProjects() && !query }).forEach((group) => {
    if (!group.items.length) return;
    const label = document.createElement("p");
    label.className = "nav-group-label";
    label.textContent = group.name;
    els.projectList.appendChild(label);
    group.items.forEach((project) => appendProjectNavRow(project));
  });
}
export function placeKebabMenu(toggle, menu) {
  const margin = 8;
  const gap = 6;
  const rect = toggle.getBoundingClientRect();
  menu.style.position = "fixed";
  menu.style.right = "auto";
  menu.style.bottom = "auto";
  menu.hidden = false;
  const width = Math.max(menu.offsetWidth, 180);
  const height = menu.offsetHeight;
  let top = rect.bottom + gap;
  if (top + height > window.innerHeight - margin) {
    top = rect.top - gap - height;
  }
  if (top < margin) top = Math.max(margin, window.innerHeight - margin - height);
  let left = rect.right - width;
  if (left < margin) left = rect.left;
  if (left + width > window.innerWidth - margin) {
    left = window.innerWidth - margin - width;
  }
  if (left < margin) left = margin;
  menu.style.top = `${Math.round(top)}px`;
  menu.style.left = `${Math.round(left)}px`;
  menu.style.minWidth = "180px";
  menu.style.zIndex = "40";
}
export function closeProjectMenus(except) {
  document.querySelectorAll(".proj-kebab.is-open").forEach((node) => {
    if (node === except) return;
    node.classList.remove("is-open");
    const toggle = node.querySelector(".proj-kebab-btn");
    const menu = node.kebabMenu;
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    if (menu) {
      menu.hidden = true;
      if (menu.parentElement !== node) node.appendChild(menu);
    }
  });
  if (!except) box.openKebab = null;
}
export function repositionOpenKebab() {
  if (!box.openKebab?.classList.contains("is-open")) return;
  const toggle = box.openKebab.querySelector(".proj-kebab-btn");
  const menu = box.openKebab.kebabMenu;
  if (!toggle || !menu || menu.hidden) return;
  placeKebabMenu(toggle, menu);
}
export function makeKebab(label, items) {
  const wrap = document.createElement("div");
  wrap.className = "proj-kebab";
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "proj-kebab-btn";
  toggle.setAttribute("aria-label", label);
  toggle.setAttribute("aria-haspopup", "menu");
  toggle.setAttribute("aria-expanded", "false");
  toggle.title = label;
  toggle.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><circle cx="12" cy="5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/></svg>`;
  const menu = document.createElement("div");
  menu.className = "proj-kebab-menu";
  menu.hidden = true;
  menu.setAttribute("role", "menu");
  items.forEach((item) => {
    const action = document.createElement("button");
    action.type = "button";
    action.setAttribute("role", "menuitem");
    if (item.danger) action.className = "is-danger";
    action.textContent = item.label;
    action.addEventListener("click", (event) => {
      event.stopPropagation();
      closeProjectMenus();
      item.onClick();
    });
    menu.appendChild(action);
  });
  menu.addEventListener("keydown", (event) => {
    const entries = [...menu.querySelectorAll("[role='menuitem']")];
    const index = entries.indexOf(document.activeElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      entries[(index + 1) % entries.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      entries[(index - 1 + entries.length) % entries.length]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      entries[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      entries[entries.length - 1]?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeProjectMenus();
      toggle.focus();
    } else if (event.key === "Tab") {
      closeProjectMenus();
    }
  });
  toggle.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" && menu.hidden) {
      event.preventDefault();
      toggle.click();
    }
  });
  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const willOpen = menu.hidden;
    closeProjectMenus(willOpen ? wrap : null);
    if (!willOpen) {
      menu.hidden = true;
      wrap.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      if (menu.parentElement !== wrap) wrap.appendChild(menu);
      box.openKebab = null;
      return;
    }
    document.body.appendChild(menu);
    wrap.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    box.openKebab = wrap;
    placeKebabMenu(toggle, menu);
    menu.querySelector("[role='menuitem']")?.focus();
  });
  wrap.append(toggle, menu);
  wrap.kebabMenu = menu;
  return wrap;
}
export function groupKey(group) {
  return String(group.id ?? group.name);
}
export function renderDirectoryMenus(groups) {
  const dep = els.menuDependencia;
  const proj = els.menuProyecto;
  if (!dep || !proj) return groups[0] || null;
  const selectedId = state.currentProject?.id;
  let active = groups.find((group) => group.items.some((project) => project.id === selectedId));
  if (!active && state.menuDependenciaKey) {
    active = groups.find((group) => groupKey(group) === state.menuDependenciaKey);
  }
  if (!active) active = groups[0];
  state.menuDependenciaKey = groupKey(active);

  dep.replaceChildren();
  groups.forEach((group) => {
    const option = document.createElement("option");
    option.value = groupKey(group);
    option.textContent = group.name;
    dep.appendChild(option);
  });
  dep.value = state.menuDependenciaKey;

  proj.replaceChildren();
  if (!active.items.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Sin proyectos";
    proj.appendChild(option);
    proj.disabled = true;
    return active;
  }
  proj.disabled = false;
  active.items.forEach((project) => {
    const option = document.createElement("option");
    option.value = String(project.id);
    option.textContent = `${project.name} — BPIN ${project.bpin}`;
    proj.appendChild(option);
  });
  const inGroup = active.items.some((project) => project.id === selectedId);
  proj.value = String(inGroup ? selectedId : active.items[0].id);
  return active;
}
export function renderDirectory() {
  if (!els.directoryGroups) return;
  els.directoryGroups.innerHTML = "";
  const projects = filteredProjects();
  const query = projectQuery();
  const groups = dependenciaGroups(projects, { includeEmpty: canManageProjects() && !query });
  if (!groups.length) {
    const empty = document.createElement("p");
    empty.className = "directory-empty";
    empty.textContent = projectQuery()
      ? "Ningún proyecto coincide con la búsqueda."
      : state.user?.role === ROLE.USER
        ? "No tiene proyectos asignados en su dependencia."
        : "No hay dependencias ni proyectos.";
    els.directoryGroups.appendChild(empty);
    if (els.btnHeaderNewProject) els.btnHeaderNewProject.hidden = true;
    return;
  }
  state.directoryGroups = groups;
  const active = renderDirectoryMenus(groups);
  if (!active) return;
  const visibleId = Number(els.menuProyecto?.value) || state.currentProject?.id;
  const visible = active.items.filter((project) => project.id === visibleId);
  const listed = visible[0] || null;
  const current = state.currentProject?.id === listed?.id ? state.currentProject : listed;
  const block = document.createElement("section");
  block.className = "proj-workspace";

  const crumb = document.createElement("p");
  crumb.className = "proj-crumb";
  const crumbLevels = ["Proyectos", active.name];
  if (current?.name) crumbLevels.push(current.name);
  crumbLevels.forEach((level, index) => {
    if (index > 0) {
      const sep = document.createElement("span");
      sep.className = "proj-crumb-sep";
      sep.setAttribute("aria-hidden", "true");
      sep.textContent = "/";
      crumb.appendChild(sep);
    }
    const item = document.createElement("span");
    item.textContent = level;
    if (index === crumbLevels.length - 1) item.className = "is-current";
    crumb.appendChild(item);
  });
  block.appendChild(crumb);

  if (current) {
    const summary = document.createElement("div");
    summary.className = "proj-summary";
    const copy = document.createElement("div");
    copy.className = "proj-summary-copy";
    const eyebrow = document.createElement("span");
    eyebrow.textContent = "Proyecto seleccionado";
    const title = document.createElement("strong");
    title.textContent = current.name;
    const meta = document.createElement("p");
    meta.textContent = `BPIN ${current.bpin || "—"} · ${active.name}`;
    copy.append(eyebrow, title, meta);
    summary.appendChild(copy);
    if (canManageProjects()) {
      const actions = document.createElement("div");
      actions.className = "proj-summary-actions";
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn btn-secondary";
      editBtn.textContent = "Editar proyecto";
      editBtn.addEventListener("click", () => confirmRenameProject(current));
      actions.appendChild(editBtn);
      actions.appendChild(
        makeKebab("Más acciones del proyecto", [
          { label: "Eliminar proyecto", danger: true, onClick: () => deleteProject(current) },
        ])
      );
      summary.appendChild(actions);
    }
    block.appendChild(summary);
  } else {
    const empty = document.createElement("p");
    empty.className = "directory-empty";
    empty.textContent = "Sin proyectos en esta dependencia.";
    block.appendChild(empty);
  }

  if (els.btnHeaderNewProject) {
    els.btnHeaderNewProject.hidden = !(canManageProjects() && active.id);
  }

  if (current && Array.isArray(current.folders)) {
    block.appendChild(projectFolderPanel(current));
  }
  els.directoryGroups.appendChild(block);
}
export async function openProjectManager() {
  if (!canManageProjects()) {
    showToast("No tiene permisos para gestionar proyectos.", "err");
    return;
  }
  if (els.usersPanel) els.usersPanel.hidden = true;
  if (els.dependenciaScreen) els.dependenciaScreen.hidden = true;
  els.appMain?.classList.remove("is-users", "is-dependencias");
  await loadDependenciaCatalog();
  renderDirectory();
  document.getElementById("project-directory")?.scrollIntoView({ behavior: "smooth", block: "start" });
}
export function setHeader() {
  const project = state.currentProject;
  const folder = currentFolder();

  if (!project) {
    if (els.mainHeader) els.mainHeader.hidden = false;
    els.contextEyebrow.textContent = "Sin proyecto seleccionado";
    els.pageTitle.textContent = "Bienvenido";
    if (els.folderSubtitle) {
      els.folderSubtitle.hidden = true;
      els.folderSubtitle.textContent = "";
    }
    els.headerMeta.hidden = false;
    els.headerMeta.textContent = canWrite()
      ? "Cree o seleccione un proyecto para comenzar."
      : "Seleccione un proyecto para consultar documentos.";
    return;
  }

  if (els.mainHeader) els.mainHeader.hidden = true;

  if (folder) {
    if (els.folderSubtitle) {
      els.folderSubtitle.hidden = false;
      els.folderSubtitle.textContent = folder.name;
    }
    els.headerMeta.hidden = true;
    els.headerMeta.textContent = "";
  } else if (!project.folders.length) {
    if (els.folderSubtitle) {
      els.folderSubtitle.hidden = true;
      els.folderSubtitle.textContent = "";
    }
    els.headerMeta.hidden = false;
    els.headerMeta.textContent = canWrite()
      ? "Cree la primera carpeta para este proyecto."
      : "Este proyecto aún no tiene carpetas.";
  } else {
    if (els.folderSubtitle) {
      els.folderSubtitle.hidden = true;
      els.folderSubtitle.textContent = "";
    }
    els.headerMeta.hidden = false;
    els.headerMeta.textContent = "Seleccione una carpeta del proyecto.";
  }
}
export function showWorkspace() {
  const hasProject = Boolean(state.currentProject);
  const hasFolders = Boolean(state.currentProject?.folders?.length);
  const hasFolder = Boolean(state.currentFolderId);

  els.emptyState.hidden = hasProject;
  els.noFoldersState.hidden = !(hasProject && !hasFolders);
  els.docsPanel.hidden = !hasFolder;
}
export async function refreshCurrentProject(preferredFolderId = null) {
  if (!state.currentProject) {
    await refreshTrashCount();
    return;
  }
  const projectId = state.currentProject.id;
  try {
    state.currentProject = await api(`/api/projects/${projectId}`);
  } catch {
    state.currentProject = null;
    state.currentFolderId = null;
    await loadProjects();
    return;
  }

  const stillExists = state.currentProject.folders.some((f) => f.id === preferredFolderId);
  if (preferredFolderId && stillExists) {
    state.currentFolderId = preferredFolderId;
  } else if (!state.currentProject.folders.some((f) => f.id === state.currentFolderId)) {
    state.currentFolderId = state.currentProject.folders[0]?.id || null;
  }

  renderProjects();
  renderFolders();
  setHeader();
  showWorkspace();
  await refreshTrashCount();

  if (state.currentFolderId) {
    els.docDate.value = todayLabel();
    await loadDocuments();
  }
  rememberLocation();
}
export async function loadProjects() {
  state.projects = await api("/api/projects");
  if (canManageProjects()) {
    try {
      state.dependencias = await api("/api/users/dependencias");
    } catch (error) {
      showToast(error.message, "err");
    }
  }
  renderProjects();

  if (!state.projects.length) {
    state.currentProject = null;
    state.currentFolderId = null;
    renderFolders();
    setHeader();
    showWorkspace();
    rememberLocation();
    await refreshTrashCount();
    return;
  }

  const saved = readLocation();
  const savedProjectOk =
    !state.currentProject && saved.projectId && state.projects.some((project) => project.id === saved.projectId);
  const preferredId = state.currentProject?.id || (savedProjectOk ? saved.projectId : state.projects[0].id);
  const preferredFolder = state.currentProject ? state.currentFolderId : savedProjectOk ? saved.folderId : null;

  try {
    await selectProject(preferredId, preferredFolder);
  } catch {
    if (preferredId !== state.projects[0].id) {
      state.currentProject = null;
      state.currentFolderId = null;
      await selectProject(state.projects[0].id);
    }
  }
}
export function readLocation() {
  const params = new URLSearchParams(window.location.search);
  const projectId = Number(params.get("proyecto"));
  const folderId = Number(params.get("carpeta"));
  return {
    projectId: Number.isInteger(projectId) && projectId > 0 ? projectId : null,
    folderId: Number.isInteger(folderId) && folderId > 0 ? folderId : null,
  };
}
export function rememberLocation() {
  const params = new URLSearchParams(window.location.search);
  if (state.currentProject?.id) {
    params.set("proyecto", String(state.currentProject.id));
  } else {
    params.delete("proyecto");
  }
  if (state.currentFolderId) {
    params.set("carpeta", String(state.currentFolderId));
  } else {
    params.delete("carpeta");
  }
  const query = params.toString();
  const next = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) {
    history.replaceState(null, "", next);
  }
}
export async function selectProject(projectId, preferredFolderId = null) {
  state.currentProject = await api(`/api/projects/${projectId}`);
  const firstFolder = state.currentProject.folders[0];
  const keep =
    preferredFolderId &&
    state.currentProject.folders.some((folder) => folder.id === preferredFolderId)
      ? preferredFolderId
      : firstFolder?.id || null;
  state.currentFolderId = keep;
  renderProjects();
  renderFolders();
  setHeader();
  showWorkspace();
  await refreshTrashCount();

  if (state.currentFolderId) {
    els.docDate.value = todayLabel();
    await loadDocuments();
  }
  rememberLocation();
}
export function syncProjectSearch(source) {
  const value = source?.value || "";
  if (els.projectSearch && els.projectSearch !== source) els.projectSearch.value = value;
  if (els.directorySearch && els.directorySearch !== source) els.directorySearch.value = value;
  renderProjects();
}
export function filteredAccounts() {
  const query = userSearchValue();
  const role = document.getElementById("user-filter-role")?.value || "";
  const dep = document.getElementById("user-filter-dependencia")?.value || "";
  const status = document.getElementById("user-filter-status")?.value || "";
  return (state.accounts || []).filter((user) => {
    const haystack = `${user.full_name} ${user.email}`.toLocaleLowerCase("es");
    if (query && !haystack.includes(query)) return false;
    if (role && user.role !== role) return false;
    if (dep === "__none__" && user.dependencia) return false;
    if (dep && dep !== "__none__" && user.dependencia !== dep) return false;
    if (status === "active" && !user.is_active) return false;
    if (status === "inactive" && user.is_active) return false;
    return true;
  });
}
export async function boot() {
  try {
    state.user = await api("/api/auth/me");
    showApp();
    await loadProjects();
  } catch {
    showLogin();
  }
}

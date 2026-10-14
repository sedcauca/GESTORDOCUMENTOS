import { state, els, PAGE, ROLE, box } from "./store.js";
import { showToast, api } from "./api.js";
import { askConfirm } from "./dialogs.js";
import { pageWindow } from "./format.js";
import { makeKebab, loadProjects, filteredAccounts } from "./projects.js";
import { canManageUsers, canManageTargetUser } from "./session.js";

export function selectedProjectDependenciaId() {
  if (state.user?.role === ROLE.SUPER) {
    const value = els.projectDependencia?.value;
    return value ? Number(value) : null;
  }
  return state.user?.dependencia_id || null;
}
export function fillProjectDependenciaSelect(selectedId) {
  const select = els.projectDependencia;
  if (!select) return;
  select.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Selecciona una dependencia";
  select.appendChild(placeholder);
  state.dependencias.forEach((item) => {
    const option = document.createElement("option");
    option.value = String(item.id);
    option.textContent = item.name;
    select.appendChild(option);
  });
  if (selectedId) select.value = String(selectedId);
  else if (state.user?.role !== ROLE.SUPER && state.user?.dependencia_id) {
    select.value = String(state.user.dependencia_id);
  }
  const isSuper = state.user?.role === ROLE.SUPER;
  if (els.projectDependenciaField) els.projectDependenciaField.hidden = !isSuper;
  select.required = isSuper;
}
export function dependenciaGroups(projects, { includeEmpty = false } = {}) {
  const groups = new Map();
  if (includeEmpty) {
    state.dependencias.forEach((item) => {
      groups.set(item.id, { id: item.id, name: item.name, items: [] });
    });
  }
  projects.forEach((project) => {
    const key = project.dependencia_id || `nombre:${project.dependencia || "Sin dependencia"}`;
    if (!groups.has(key)) {
      groups.set(key, {
        id: project.dependencia_id || null,
        name: project.dependencia || "Sin dependencia",
        items: [],
      });
    }
    groups.get(key).items.push(project);
  });
  return [...groups.values()]
    .map((group) => ({
      ...group,
      items: [...group.items].sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""), "es", { sensitivity: "base" })
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
}
export async function fillRoleSelect(preferredRole) {
  state.assignableRoles = await api("/api/users/roles");
  els.userRoleSelect.innerHTML = "";
  const roles = [...state.assignableRoles];
  roles.forEach((role) => {
    const option = document.createElement("option");
    option.value = role.name;
    option.textContent = role.label;
    els.userRoleSelect.appendChild(option);
  });
  const preferred =
    preferredRole &&
    (typeof preferredRole === "string" ? preferredRole : preferredRole.name || preferredRole.role);
  if (preferred && roles.some((role) => role.name === preferred)) {
    els.userRoleSelect.value = preferred;
  } else if (roles.some((role) => role.name === "usuario")) {
    els.userRoleSelect.value = "usuario";
  }
  syncDependenciaRequirement();
}
export function syncDependenciaRequirement() {
  if (!els.userDependencia || !els.userRoleSelect) return;
  const needsDep = els.userRoleSelect.value !== ROLE.SUPER;
  els.userDependencia.required = false;
  const empty = [...els.userDependencia.options].find((option) => option.value === "");
  if (empty) empty.hidden = needsDep;
  if (needsDep && els.userDependencia.value === "" && els.userDependencia.options.length > 1) {
    const first = [...els.userDependencia.options].find((option) => option.value);
    if (first && state.user?.role !== ROLE.SUPER) els.userDependencia.value = first.value;
  }
  const note = document.getElementById("user-dependencia-note");
  if (note) {
    const missing = needsDep && !state.dependencias.length;
    note.hidden = !missing;
    note.textContent = missing ? "No hay dependencias disponibles." : "";
  }
}
export function fillDependenciaSelect(selectedId) {
  const select = els.userDependencia;
  if (!select) return;
  const isSuper = state.user?.role === ROLE.SUPER;
  select.innerHTML = "";
  if (isSuper) {
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "Sin dependencia";
    select.appendChild(empty);
  }
  state.dependencias.forEach((item) => {
    const option = document.createElement("option");
    option.value = String(item.id);
    option.textContent = item.name;
    select.appendChild(option);
  });
  if (selectedId) {
    select.value = String(selectedId);
  } else if (!isSuper && state.dependencias[0]) {
    select.value = String(state.dependencias[0].id);
  }
  select.disabled = !isSuper;
  syncDependenciaRequirement();
}
export async function loadDependenciaCatalog(selectedId) {
  state.dependenciasStatus = "loading";
  state.dependenciasError = "";
  renderDependenciaManager();
  try {
    state.dependencias = await api("/api/users/dependencias");
    state.dependenciasStatus = "ready";
  } catch (error) {
    state.dependenciasStatus = "error";
    state.dependenciasError = error.message || "Intenta nuevamente.";
    renderDependenciaManager();
    throw error;
  }
  const isSuper = state.user?.role === ROLE.SUPER;
  if (els.dependenciasPanel) els.dependenciasPanel.hidden = !isSuper;
  if (els.dependenciaCatalog) {
    els.dependenciaCatalog.innerHTML = "";
    state.dependencias.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item.name;
      els.dependenciaCatalog.appendChild(li);
    });
  }
  fillDependenciaSelect(selectedId);
  renderDependenciaManager();
}
export function dependenciaSaveButton() {
  return document.getElementById("btn-create-dependencia");
}
export function dependenciaCancelButton() {
  return document.getElementById("btn-cancel-dependencia-edit");
}
export function dependenciaFormIsOpen() {
  return Boolean(els.dependenciaForm && !els.dependenciaForm.hidden);
}
export function dependenciaNameValue() {
  return (els.dependenciaNewName?.value || "").trim();
}
export function dependenciaFormDirty() {
  return dependenciaNameValue() !== (state.dependenciaBaseline || "").trim();
}
export function setDependenciaSearchLocked(locked, editing) {
  const input = els.dependenciaSearch;
  if (!input) return;
  input.disabled = locked;
  input.setAttribute("aria-disabled", locked ? "true" : "false");
  if (locked) {
    input.title = editing
      ? "Finaliza o cancela la edición para volver a buscar"
      : "Finaliza o cancela la creación para volver a buscar";
  } else {
    input.removeAttribute("title");
  }
}
export function setDependenciaFieldError(message) {
  const input = els.dependenciaNewName;
  const error = els.dependenciaFormError;
  if (!input || !error) return;
  if (message) {
    error.hidden = false;
    error.textContent = message;
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", "dependencia-form-help dependencia-form-error");
  } else {
    error.hidden = true;
    error.textContent = "";
    input.removeAttribute("aria-invalid");
    input.setAttribute("aria-describedby", "dependencia-form-help");
  }
}
export function syncDependenciaSaveState() {
  const saveBtn = dependenciaSaveButton();
  if (!saveBtn || state.dependenciaSaving) return;
  const name = dependenciaNameValue();
  const editing = Boolean(state.editingDependenciaId);
  const unchanged = editing && name === (state.dependenciaBaseline || "").trim();
  saveBtn.disabled = !name || unchanged;
}
export function setDependenciaFormOpen(open) {
  if (els.dependenciaForm) els.dependenciaForm.hidden = !open;
  if (els.btnShowDependenciaCreate) els.btnShowDependenciaCreate.hidden = open;
  setDependenciaSearchLocked(open, Boolean(state.editingDependenciaId));
  renderDependenciaManager();
}
export function resetDependenciaForm() {
  state.editingDependenciaId = null;
  state.dependenciaBaseline = "";
  state.dependenciaSaving = false;
  if (els.dependenciaNewName) els.dependenciaNewName.value = "";
  setDependenciaFieldError("");
  const title = document.getElementById("dependencia-form-title");
  const help = document.getElementById("dependencia-form-help");
  if (title) title.textContent = "Nueva dependencia";
  if (help) help.textContent = "Ingresa el nombre con el que se identificará la dependencia.";
  if (els.dependenciaNameLabel) els.dependenciaNameLabel.textContent = "Nombre de la dependencia";
  const saveBtn = dependenciaSaveButton();
  const cancelBtn = dependenciaCancelButton();
  if (saveBtn) {
    saveBtn.textContent = "Crear dependencia";
    saveBtn.disabled = true;
  }
  if (cancelBtn) cancelBtn.disabled = false;
  setDependenciaFormOpen(false);
}
export function openDependenciaEditor(item) {
  if (state.dependenciaSaving) return;
  if (dependenciaFormIsOpen() && dependenciaFormDirty()) return;
  state.editingDependenciaId = item.id;
  state.dependenciaBaseline = item.name;
  if (els.dependenciaNewName) els.dependenciaNewName.value = item.name;
  setDependenciaFieldError("");
  const title = document.getElementById("dependencia-form-title");
  const help = document.getElementById("dependencia-form-help");
  if (title) title.textContent = "Editar dependencia";
  if (help) help.textContent = "Actualiza el nombre de la dependencia seleccionada.";
  if (els.dependenciaNameLabel) els.dependenciaNameLabel.textContent = "Nombre de la dependencia";
  const saveBtn = dependenciaSaveButton();
  const cancelBtn = dependenciaCancelButton();
  if (saveBtn) {
    saveBtn.textContent = "Guardar cambios";
    saveBtn.disabled = true;
  }
  if (cancelBtn) cancelBtn.disabled = false;
  setDependenciaFormOpen(true);
  syncDependenciaSaveState();
  els.dependenciaNewName?.focus();
}
export function dependenciaNameTaken(name, exceptId) {
  const key = name.toLocaleLowerCase("es");
  return state.dependencias.some(
    (item) => item.id !== exceptId && item.name.trim().toLocaleLowerCase("es") === key
  );
}
export function dependenciaRequestError(error, editing) {
  const fallback = editing
    ? "No fue posible guardar la dependencia. Intenta nuevamente."
    : "No fue posible crear la dependencia. Intenta nuevamente.";
  if (error instanceof TypeError) return "No fue posible conectar con el servidor. Intenta nuevamente.";
  const raw = String(error?.message || "").trim();
  if (!raw || raw === "Ocurrió un error inesperado" || raw === "[object Object]") return fallback;
  if (/string should have at most 200/i.test(raw) || /max_length/i.test(raw)) {
    return "El nombre no puede superar 200 caracteres.";
  }
  if (raw.length > 180 || raw.includes("{") || /traceback/i.test(raw)) return fallback;
  return raw;
}
export function dependenciaCountPhrase(shown, total, query) {
  if (!total) return "";
  if (query && !shown) return "Sin coincidencias";
  if (query && shown === 1) return "1 dependencia encontrada";
  if (shown === 1) return "1 dependencia";
  return `${shown} dependencias`;
}
export function renderDependenciaManager() {
  if (!els.dependenciaManageList) return;
  els.dependenciaManageList.innerHTML = "";
  const countLine = document.getElementById("dependencia-count-line");
  if (state.dependenciasStatus === "loading") {
    if (countLine) countLine.textContent = "";
    const loading = document.createElement("p");
    loading.className = "dep-status";
    loading.textContent = "Cargando dependencias...";
    els.dependenciaManageList.appendChild(loading);
    return;
  }
  if (state.dependenciasStatus === "error" && !state.dependencias.length) {
    if (countLine) countLine.textContent = "";
    const errorBox = document.createElement("div");
    errorBox.className = "dep-empty";
    const title = document.createElement("strong");
    title.textContent = "No fue posible cargar las dependencias";
    const text = document.createElement("p");
    text.textContent = state.dependenciasError || "Intenta nuevamente.";
    const action = document.createElement("button");
    action.type = "button";
    action.className = "btn btn-secondary";
    action.textContent = "Reintentar";
    action.addEventListener("click", () => {
      loadDependenciaCatalog().catch(() => {});
    });
    errorBox.append(title, text, action);
    els.dependenciaManageList.appendChild(errorBox);
    return;
  }
  const total = state.dependencias.length;
  const formOpen = dependenciaFormIsOpen();
  const query = formOpen ? "" : (els.dependenciaSearch?.value || "").trim().toLocaleLowerCase("es");
  const items = state.dependencias.filter((item) =>
    item.name.toLocaleLowerCase("es").includes(query)
  );
  if (countLine) countLine.textContent = dependenciaCountPhrase(items.length, total, query);
  if (!total) {
    const empty = document.createElement("div");
    empty.className = "dep-empty";
    const title = document.createElement("strong");
    title.textContent = "No hay dependencias registradas";
    const text = document.createElement("p");
    text.textContent = "Crea la primera dependencia para comenzar a organizar los proyectos.";
    const action = document.createElement("button");
    action.type = "button";
    action.className = "btn btn-primary";
    action.textContent = "Nueva dependencia";
    action.addEventListener("click", () => {
      resetDependenciaForm();
      setDependenciaFormOpen(true);
      els.dependenciaNewName?.focus();
    });
    empty.append(title, text, action);
    els.dependenciaManageList.appendChild(empty);
    return;
  }
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "dep-empty";
    const title = document.createElement("strong");
    title.textContent = "No se encontraron dependencias";
    const text = document.createElement("p");
    text.textContent = "Prueba con otro nombre o limpia la búsqueda.";
    const action = document.createElement("button");
    action.type = "button";
    action.className = "btn btn-secondary";
    action.textContent = "Limpiar búsqueda";
    action.addEventListener("click", () => {
      if (els.dependenciaSearch) els.dependenciaSearch.value = "";
      renderDependenciaManager();
      els.dependenciaSearch?.focus();
    });
    empty.append(title, text, action);
    els.dependenciaManageList.appendChild(empty);
    return;
  }
  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "dep-row";
    row.setAttribute("role", "listitem");
    const icon = document.createElement("span");
    icon.className = "dep-row-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 20V6.5A1.5 1.5 0 0 1 5.5 5H10l2 2h6.5A1.5 1.5 0 0 1 20 8.5V20"/><path d="M3 20h18"/></svg>`;
    const name = document.createElement("strong");
    name.className = "dep-row-name";
    name.textContent = item.name;
    name.title = item.name;
    row.append(icon, name);
    const menu = makeKebab(`Más acciones de ${item.name}`, [
        { label: "Editar dependencia", onClick: () => openDependenciaEditor(item) },
        {
          label: "Eliminar dependencia",
          danger: true,
          onClick: () => {
            askConfirm({
              title: "Eliminar dependencia",
              message: `¿Seguro que deseas eliminar la dependencia «${item.name}»?`,
              confirmLabel: "Eliminar dependencia",
              subject: { label1: "Dependencia", value1: item.name, label2: "Acción", value2: "Eliminar" },
              onConfirm: async () => {
                await api(`/api/users/dependencias/${item.id}`, { method: "DELETE" });
                if (state.editingDependenciaId === item.id) resetDependenciaForm();
                await loadDependenciaCatalog();
                await loadProjects();
                showToast("Dependencia eliminada.", "ok");
              },
            });
          },
        },
      ]);
    menu.dataset.dependenciaId = String(item.id);
    row.appendChild(menu);
    els.dependenciaManageList.appendChild(row);
  });
}
export function setUserFieldError(input, errorId, message) {
  const errorEl = document.getElementById(errorId);
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
export function clearUserFieldErrors() {
  setUserFieldError(els.userFullName, "user-name-error", "");
  setUserFieldError(els.userEmail, "user-email-error", "");
  setUserFieldError(els.userRoleSelect, "user-role-error", "");
  setUserFieldError(els.userDependencia, "user-dependencia-error", "");
  setUserFieldError(els.userPassword, "user-password-error", "");
  setUserFieldError(document.getElementById("user-password-confirm"), "user-password-confirm-error", "");
  if (els.userFormError) {
    els.userFormError.hidden = true;
    els.userFormError.textContent = "";
  }
}
export function setUserFormOpen(open) {
  if (els.userForm) els.userForm.hidden = !open;
  const createBtn = document.getElementById("btn-show-user-create");
  if (createBtn) createBtn.hidden = open;
}
export function userEmailLooksValid(value) {
  const email = value.trim();
  if (!email || email.includes(" ") || !email.includes("@")) return false;
  const domain = email.split("@").pop() || "";
  return Boolean(email.split("@")[0] && domain.includes("."));
}
export function userFormSnapshot() {
  return {
    name: els.userFullName?.value.trim() || "",
    email: els.userEmail?.value.trim() || "",
    role: els.userRoleSelect?.value || "",
    dependencia: els.userDependencia?.value || "",
  };
}
export function userFormDirty() {
  const current = userFormSnapshot();
  const base = state.userBaseline || { name: "", email: "", role: "", dependencia: "" };
  const password = els.userPassword?.value || "";
  return (
    current.name !== base.name ||
    current.email !== base.email ||
    current.role !== base.role ||
    current.dependencia !== base.dependencia ||
    Boolean(password)
  );
}
export function syncUserSaveState() {
  if (!els.btnSaveUser || state.userSaving) return;
  const editing = Boolean(state.editingUserId);
  const name = els.userFullName?.value.trim() || "";
  const email = els.userEmail?.value.trim() || "";
  const role = els.userRoleSelect?.value || "";
  const needsDep = role !== ROLE.SUPER;
  const dependencia = els.userDependencia?.value || "";
  const password = els.userPassword?.value || "";
  const confirm = document.getElementById("user-password-confirm")?.value || "";
  let valid = Boolean(name && userEmailLooksValid(email) && role && (!needsDep || dependencia));
  if (!editing) valid = valid && password.length >= 8 && password.length <= 128 && password === confirm;
  if (editing) valid = valid && userFormDirty();
  els.btnSaveUser.disabled = !valid;
}
export function resetPasswordVisibility(inputId, toggleId) {
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  if (input) input.type = "password";
  if (toggle) {
    toggle.setAttribute("aria-label", "Mostrar contraseña");
    toggle.textContent = "Mostrar";
  }
}
export function resetUserForm() {
  state.editingUserId = null;
  state.userSaving = false;
  els.userForm?.reset();
  clearUserFieldErrors();
  resetPasswordVisibility("user-password", "user-password-toggle");
  resetPasswordVisibility("user-password-confirm", "user-password-confirm-toggle");
  if (els.userPassword) {
    els.userPassword.required = false;
    els.userPassword.value = "";
  }
  const confirm = document.getElementById("user-password-confirm");
  if (confirm) confirm.value = "";
  if (els.userPasswordField) els.userPasswordField.hidden = false;
  const confirmField = document.getElementById("user-password-confirm-field");
  if (confirmField) confirmField.hidden = false;
  if (els.userPasswordLabel) els.userPasswordLabel.textContent = "Contraseña";
  if (els.userRoleSelect) els.userRoleSelect.disabled = false;
  const title = document.getElementById("user-form-title");
  const help = document.getElementById("user-form-help");
  if (title) title.textContent = "Nuevo usuario";
  if (help) help.textContent = "Crea una cuenta y asigna su rol y dependencia.";
  if (els.btnSaveUser) {
    els.btnSaveUser.textContent = "Crear usuario";
    els.btnSaveUser.disabled = true;
  }
  if (els.btnCancelUserEdit) els.btnCancelUserEdit.disabled = false;
  state.userBaseline = { name: "", email: "", role: "", dependencia: "" };
  setUserFormOpen(false);
}
export async function openUserCreateForm() {
  if (state.userSaving) return;
  if (els.userForm && !els.userForm.hidden && state.editingUserId && userFormDirty()) return;
  resetUserForm();
  await fillRoleSelect();
  state.userBaseline = userFormSnapshot();
  setUserFormOpen(true);
  syncUserSaveState();
  els.userFullName?.focus();
}
export async function startEditUser(user) {
  if (state.userSaving) return;
  if (els.userForm && !els.userForm.hidden && !state.editingUserId && userFormDirty()) return;
  state.editingUserId = user.id;
  clearUserFieldErrors();
  await fillRoleSelect({ name: user.role, label: user.role_label });
  els.userFullName.value = user.full_name;
  els.userEmail.value = user.email;
  fillDependenciaSelect(user.dependencia_id);
  els.userRoleSelect.value = user.role;
  syncDependenciaRequirement();
  if (els.userPassword) {
    els.userPassword.required = false;
    els.userPassword.value = "";
  }
  if (els.userPasswordField) els.userPasswordField.hidden = true;
  const confirmField = document.getElementById("user-password-confirm-field");
  if (confirmField) confirmField.hidden = true;
  els.userRoleSelect.disabled = user.id === state.user?.id;
  const title = document.getElementById("user-form-title");
  const help = document.getElementById("user-form-help");
  if (title) title.textContent = "Editar usuario";
  if (help) help.textContent = "Actualiza los datos, el rol y la dependencia de la cuenta.";
  if (els.btnSaveUser) {
    els.btnSaveUser.textContent = "Guardar cambios";
    els.btnSaveUser.disabled = true;
  }
  state.userBaseline = userFormSnapshot();
  setUserFormOpen(true);
  syncUserSaveState();
  els.userFullName?.focus();
}
export function openPasswordDialog(user) {
  state.passwordTargetUser = user;
  els.passwordForm.reset();
  els.passwordFormError.hidden = true;
  resetPasswordVisibility("password-new", "password-new-toggle");
  resetPasswordVisibility("password-confirm", "password-confirm-toggle");
  if (els.passwordDialogHelp) {
    els.passwordDialogHelp.textContent = "Define una nueva contraseña para esta cuenta.";
  }
  const account = document.getElementById("password-account-name");
  if (account) account.textContent = user.full_name;
  if (els.btnSavePassword) els.btnSavePassword.textContent = "Actualizar contraseña";
  els.passwordDialog.showModal();
  els.passwordNew.focus();
}
export function userFiltersActive() {
  const role = document.getElementById("user-filter-role")?.value || "";
  const dep = document.getElementById("user-filter-dependencia")?.value || "";
  const status = document.getElementById("user-filter-status")?.value || "";
  return Boolean(role || dep || status);
}
export function userSearchValue() {
  return (document.getElementById("user-search")?.value || "").trim().toLocaleLowerCase("es");
}
export function syncUserFilterButton() {
  const button = document.getElementById("btn-clear-user-filters");
  if (button) button.hidden = !userFiltersActive();
}
export function fillUserFilters() {
  const roleSelect = document.getElementById("user-filter-role");
  const depSelect = document.getElementById("user-filter-dependencia");
  if (!roleSelect || !depSelect) return;
  const roleValue = roleSelect.value;
  const depValue = depSelect.value;
  roleSelect.innerHTML = "";
  const allRoles = document.createElement("option");
  allRoles.value = "";
  allRoles.textContent = "Todos los roles";
  roleSelect.appendChild(allRoles);
  const seenRoles = new Set();
  (state.accounts || []).forEach((user) => {
    if (!user.role || seenRoles.has(user.role)) return;
    seenRoles.add(user.role);
    const option = document.createElement("option");
    option.value = user.role;
    option.textContent = user.role_label || user.role;
    roleSelect.appendChild(option);
  });
  if ([...roleSelect.options].some((option) => option.value === roleValue)) roleSelect.value = roleValue;

  depSelect.innerHTML = "";
  const allDeps = document.createElement("option");
  allDeps.value = "";
  allDeps.textContent = "Todas las dependencias";
  depSelect.appendChild(allDeps);
  const none = document.createElement("option");
  none.value = "__none__";
  none.textContent = "Sin dependencia";
  depSelect.appendChild(none);
  const seenDeps = new Set();
  (state.accounts || []).forEach((user) => {
    if (!user.dependencia || seenDeps.has(user.dependencia)) return;
    seenDeps.add(user.dependencia);
    const option = document.createElement("option");
    option.value = user.dependencia;
    option.textContent = user.dependencia;
    depSelect.appendChild(option);
  });
  if ([...depSelect.options].some((option) => option.value === depValue)) depSelect.value = depValue;
  syncUserFilterButton();
}
export function usersCountPhrase(shown, total, filtering) {
  if (!total) return "";
  if (filtering && !shown) return "Sin coincidencias";
  if (filtering) return `${shown} de ${total} cuentas`;
  if (shown === 1) return "1 cuenta";
  return `${shown} cuentas`;
}
export function fillUsersPager(nav, view, onChange) {
  nav.className = "usr-pager";
  nav.setAttribute("aria-label", "Paginación de cuentas");
  nav.replaceChildren();
  nav.hidden = view.count === 0 || view.total <= 1;
  if (nav.hidden) return;
  const info = document.createElement("p");
  info.className = "usr-pager-range";
  info.textContent = `Mostrando ${view.from}–${view.to} de ${view.count} cuentas`;
  const controls = document.createElement("div");
  controls.className = "usr-pager-controls";
  const prev = document.createElement("button");
  prev.type = "button";
  prev.className = "btn btn-secondary";
  prev.textContent = "Anterior";
  prev.disabled = view.current <= 0;
  prev.addEventListener("click", () => onChange(view.current - 1));
  const mark = document.createElement("span");
  mark.className = "usr-pager-mark";
  mark.textContent = `Página ${view.current + 1} de ${view.total}`;
  const next = document.createElement("button");
  next.type = "button";
  next.className = "btn btn-secondary";
  next.textContent = "Siguiente";
  next.disabled = view.current >= view.total - 1;
  next.addEventListener("click", () => onChange(view.current + 1));
  controls.append(prev, mark, next);
  nav.append(info, controls);
}
export function userListMessage(titleText, bodyText, actionLabel, onAction) {
  const box = document.createElement("div");
  box.className = "usr-empty";
  const title = document.createElement("strong");
  title.textContent = titleText;
  const text = document.createElement("p");
  text.textContent = bodyText;
  box.append(title, text);
  if (actionLabel) {
    const action = document.createElement("button");
    action.type = "button";
    action.className = actionLabel === "Nuevo usuario" ? "btn btn-primary" : "btn btn-secondary";
    action.textContent = actionLabel;
    action.addEventListener("click", onAction);
    box.appendChild(action);
  }
  return box;
}
export async function loadUsersTable() {
  state.usersStatus = "loading";
  state.usersError = "";
  state.accounts = [];
  renderUsersPage();
  try {
    state.accounts = await api("/api/users");
    state.usersStatus = "ready";
    fillUserFilters();
  } catch (error) {
    state.usersStatus = "error";
    state.accounts = [];
    const raw = String(error?.message || "");
    state.usersError = raw.length > 180 || raw.includes("{") ? "" : raw;
    renderUsersPage();
    return;
  }
  renderUsersPage();
}
export function renderUsersPage() {
  if (!els.usersBody) return;
  els.usersBody.innerHTML = "";
  const countEl = document.getElementById("users-count");
  if (state.usersStatus === "loading") {
    if (countEl) countEl.textContent = "";
    if (els.usersPager) els.usersPager.hidden = true;
    const loading = document.createElement("p");
    loading.className = "usr-status";
    loading.textContent = "Cargando cuentas...";
    els.usersBody.appendChild(loading);
    return;
  }
  if (state.usersStatus === "error") {
    if (countEl) countEl.textContent = "";
    if (els.usersPager) els.usersPager.hidden = true;
    els.usersBody.appendChild(
      userListMessage("No fue posible cargar las cuentas", state.usersError || "Intenta nuevamente.", "Reintentar", () => {
        loadUsersTable().catch(() => {});
      })
    );
    return;
  }
  const total = (state.accounts || []).length;
  const filtering = Boolean(userSearchValue() || userFiltersActive());
  const users = filteredAccounts();
  if (countEl) countEl.textContent = usersCountPhrase(users.length, total, filtering);
  if (!total && !filtering) {
    if (els.usersPager) els.usersPager.hidden = true;
    els.usersBody.appendChild(
      userListMessage(
        "No hay cuentas registradas",
        "Crea la primera cuenta para comenzar a administrar el acceso.",
        "Nuevo usuario",
        () => {
          openUserCreateForm().catch((error) => showToast(error.message, "err"));
        }
      )
    );
    return;
  }
  if (!users.length) {
    if (els.usersPager) els.usersPager.hidden = true;
    els.usersBody.appendChild(
      userListMessage(
        "No se encontraron cuentas",
        "Prueba con otro nombre, correo o limpia los filtros.",
        "Limpiar búsqueda y filtros",
        () => {
          const search = document.getElementById("user-search");
          if (search) search.value = "";
          ["user-filter-role", "user-filter-dependencia", "user-filter-status"].forEach((id) => {
            const select = document.getElementById(id);
            if (select) select.value = "";
          });
          state.page.cuentas = 0;
          syncUserFilterButton();
          renderUsersPage();
          search?.focus();
        }
      )
    );
    return;
  }
  const view = pageWindow(users, state.page.cuentas, PAGE.cuentas);
  state.page.cuentas = view.current;
  view.items.forEach((user) => {
    const row = document.createElement("div");
    row.className = "user-row";
    row.setAttribute("role", "listitem");
    const info = document.createElement("div");
    info.className = "user-row-info";
    const top = document.createElement("div");
    top.className = "user-row-top";
    const name = document.createElement("strong");
    name.className = "user-row-name";
    name.textContent = user.full_name;
    name.title = user.full_name;
    const status = document.createElement("span");
    status.className = `status-pill ${user.is_active ? "is-active" : "is-inactive"}`;
    status.textContent = user.is_active ? "Activo" : "Inactivo";
    top.append(name, status);
    const email = document.createElement("span");
    email.className = "user-row-email";
    email.textContent = user.email;
    email.title = user.email;
    const meta = document.createElement("div");
    meta.className = "user-row-meta";
    const role = document.createElement("span");
    role.className = "role-badge";
    role.textContent = user.role_label || user.role;
    role.title = user.role_label || user.role;
    const dep = document.createElement("span");
    dep.className = "user-row-dep";
    dep.textContent = user.dependencia || "Sin dependencia";
    dep.title = dep.textContent;
    meta.append(role, dep);
    info.append(top, email, meta);

    const manageable = canManageTargetUser(user.role);
    const isSelf = user.id === state.user?.id;
    const canEdit = manageable || isSelf;
    const items = [];
    if (canEdit) {
      items.push({
        label: "Editar usuario",
        onClick: () => {
          startEditUser(user).catch((error) => showToast(error.message, "err"));
        },
      });
    }
    if (manageable) {
      items.push({
        label: "Cambiar contraseña",
        onClick: () => openPasswordDialog(user),
      });
    }
    if (!isSelf && manageable) {
      if (user.is_active) {
        items.push({
          label: "Desactivar usuario",
          danger: true,
          onClick: () => {
            askConfirm({
              title: "Desactivar usuario",
              message: "Esta cuenta no podrá acceder al sistema mientras permanezca inactiva.",
              confirmLabel: "Desactivar usuario",
              subject: { label1: "Cuenta", value1: user.full_name, label2: "Estado", value2: "Inactivo" },
              onConfirm: async () => {
                await api(`/api/users/${user.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ is_active: false }),
                });
                await loadUsersTable();
                showToast("Usuario desactivado.", "ok");
              },
            });
          },
        });
      } else {
        items.push({
          label: "Activar usuario",
          onClick: async () => {
            try {
              await api(`/api/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: true }),
              });
              await loadUsersTable();
              showToast("Usuario activado.", "ok");
            } catch (error) {
              showToast(error.message, "err");
            }
          },
        });
      }
    }
    row.appendChild(info);
    if (items.length) {
      const menu = makeKebab(`Más acciones de ${user.full_name}`, items);
      menu.dataset.userId = String(user.id);
      row.appendChild(menu);
    }
    els.usersBody.appendChild(row);
  });
  if (els.usersPager) {
    fillUsersPager(els.usersPager, view, (page) => {
      state.page.cuentas = page;
      renderUsersPage();
    });
  }
}
export async function openUsersDialog() {
  if (!canManageUsers()) return;
  resetUserForm();
  if (els.usersPanel) els.usersPanel.hidden = false;
  if (els.dependenciaScreen) els.dependenciaScreen.hidden = true;
  els.appMain?.classList.remove("is-dependencias");
  els.appMain?.classList.add("is-users");
  state.usersStatus = "loading";
  state.accounts = [];
  renderUsersPage();
  await fillRoleSelect();
  await loadDependenciaCatalog();
  await loadUsersTable();
}
export function bindPasswordToggle(inputId, toggleId) {
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  if (!input || !toggle) return;
  toggle.addEventListener("click", () => {
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    toggle.setAttribute("aria-label", showing ? "Mostrar contraseña" : "Ocultar contraseña");
    toggle.textContent = showing ? "Mostrar" : "Ocultar";
  });
}

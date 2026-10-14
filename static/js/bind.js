import { state, els, ROLE, box } from "./store.js";
import { selectedProjectDependenciaId, syncDependenciaRequirement, loadDependenciaCatalog, dependenciaSaveButton, dependenciaCancelButton, dependenciaFormIsOpen, dependenciaNameValue, setDependenciaFieldError, syncDependenciaSaveState, setDependenciaFormOpen, resetDependenciaForm, dependenciaNameTaken, dependenciaRequestError, renderDependenciaManager, setUserFieldError, clearUserFieldErrors, userEmailLooksValid, syncUserSaveState, resetUserForm, openUserCreateForm, syncUserFilterButton, loadUsersTable, renderUsersPage, openUsersDialog, bindPasswordToggle } from "./accounts.js";
import { showToast, api } from "./api.js";
import { runPendingConfirm } from "./dialogs.js";
import { syncNewFileStatus, openUploadDialog } from "./documents.js";
import { openFolderDialog } from "./folders.js";
import { todayLabel } from "./format.js";
import { selectedMemberIds, projectField, setProjectFieldError, clearProjectFieldErrors, applyProjectRequestError, bpinAlreadyUsed, syncProjectSaveState, setProjectFormLocked, closeProjectDialog, focusAfterProjectDialog, openProjectDialog, closeProjectMenus, repositionOpenKebab, groupKey, renderDirectory, openProjectManager, refreshCurrentProject, loadProjects, rememberLocation, selectProject, syncProjectSearch, boot } from "./projects.js";
import { showLogin, showApp, cancelDependenciaForm, cancelUserForm } from "./session.js";
import { openTrashDialog } from "./trash.js";

/** Solo administrador y super administrador: crear / renombrar / borrar proyectos. */

/** Renombrar / borrar carpetas: admin, super y usuario. Crear carpeta sigue siendo solo admin. */

/** Usuario puede subir docs y usar papelera de los suyos; admin/super tienen escritura plena. */

/** Solo admin / super: borrar definitivamente desde la papelera. */

/** Usuario, administrador y super administrador gestionan cualquier documento. */

/** Alineado con can_manage_target del backend: super gestiona a todos; el resto solo rango inferior. */

els.btnNewProject.addEventListener("click", () => {
  openProjectManager().catch((error) => showToast(error.message, "err"));
});
els.btnNewProjectEmpty.addEventListener("click", () => {
  openProjectManager().catch((error) => showToast(error.message, "err"));
});
els.btnCancelProject.addEventListener("click", () => closeProjectDialog());
projectField("btn-close-project")?.addEventListener("click", () => closeProjectDialog());
els.dialog?.addEventListener("cancel", (event) => {
  if (state.projectSaving) event.preventDefault();
});
els.dialog?.addEventListener("close", () => {
  document.body.style.overflow = "";
  clearProjectFieldErrors();
  focusAfterProjectDialog();
});
els.projectName?.addEventListener("input", () => {
  setProjectFieldError(els.projectName, "project-name-error", "");
  syncProjectSaveState();
});
els.projectBpin?.addEventListener("input", () => {
  setProjectFieldError(els.projectBpin, "project-bpin-error", "");
  syncProjectSaveState();
});
projectField("project-members-search")?.addEventListener("input", (event) => {
  const query = event.target.value.trim().toLocaleLowerCase("es");
  els.projectMembers?.querySelectorAll(".member-option").forEach((label) => {
    label.hidden = Boolean(query) && !label.textContent.toLocaleLowerCase("es").includes(query);
  });
});
projectField("project-members-search")?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") event.preventDefault();
});

els.projectSearch?.addEventListener("input", () => syncProjectSearch(els.projectSearch));
els.directorySearch?.addEventListener("input", () => syncProjectSearch(els.directorySearch));

els.btnHeaderNewProject?.addEventListener("click", () => {
  const group = (state.directoryGroups || []).find((item) => groupKey(item) === state.menuDependenciaKey);
  if (!group?.id) {
    showToast("Seleccione una dependencia para crear el proyecto.", "err");
    return;
  }
  openProjectDialog("create", null, group.id).catch((error) => showToast(error.message, "err"));
});

document.addEventListener("click", () => closeProjectMenus());
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (box.openKebab) {
    const toggle = box.openKebab.querySelector(".proj-kebab-btn");
    closeProjectMenus();
    toggle?.focus();
    return;
  }
  if (document.querySelector("dialog[open]")) return;
  if (els.userForm && !els.userForm.hidden && !state.userSaving) {
    cancelUserForm();
    return;
  }
  if (els.dependenciaForm && !els.dependenciaForm.hidden && !state.dependenciaSaving) {
    cancelDependenciaForm();
  }
});
window.addEventListener("resize", repositionOpenKebab);
window.addEventListener("scroll", repositionOpenKebab, true);

els.menuDependencia?.addEventListener("change", () => {
  state.menuDependenciaKey = els.menuDependencia.value;
  const group = state.directoryGroups.find((item) => groupKey(item) === state.menuDependenciaKey);
  const first = group?.items[0];
  if (first) {
    selectProject(first.id).catch((error) => showToast(error.message, "err"));
    return;
  }
  renderDirectory();
});

els.menuProyecto?.addEventListener("change", () => {
  const projectId = Number(els.menuProyecto.value);
  if (!projectId) return;
  selectProject(projectId).catch((error) => showToast(error.message, "err"));
});

els.btnNewFolder?.addEventListener("click", () => openFolderDialog("create"));
els.btnNewFolderEmpty.addEventListener("click", () => openFolderDialog("create"));
els.btnUploadNewEmpty.addEventListener("click", () => openUploadDialog(true));
els.btnUploadMore.addEventListener("click", () => openUploadDialog(false));
els.btnPickPdf.addEventListener("click", () => els.docFile.click());
els.docFile.addEventListener("change", () => {
  if (state.editingDocumentId) syncNewFileStatus();
});
els.btnCancelFolder.addEventListener("click", () => els.folderDialog.close());
els.btnOpenTrash.addEventListener("click", () => {
  openTrashDialog().catch((error) => showToast(error.message, "err"));
});
els.btnCloseTrash.addEventListener("click", () => els.trashDialog.close());
els.btnCancelDelete.addEventListener("click", () => {
  box.pendingConfirm = null;
  if (els.confirmSubject) els.confirmSubject.hidden = true;
  els.deleteWarningDialog.close();
});
els.deleteWarningForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await runPendingConfirm();
});

els.projectForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (state.projectSaving) return;
  const name = els.projectName.value.trim();
  const bpin = els.projectBpin.value.trim();
  clearProjectFieldErrors();
  let firstInvalid = null;
  if (!name) {
    setProjectFieldError(els.projectName, "project-name-error", "El nombre del proyecto es obligatorio.");
    firstInvalid = els.projectName;
  }
  if (!bpin) {
    setProjectFieldError(els.projectBpin, "project-bpin-error", "El BPIN es obligatorio.");
    firstInvalid = firstInvalid || els.projectBpin;
  } else if (bpinAlreadyUsed(bpin)) {
    setProjectFieldError(els.projectBpin, "project-bpin-error", "Ya existe un proyecto con este BPIN.");
    firstInvalid = firstInvalid || els.projectBpin;
  }
  if (state.user?.role === ROLE.SUPER && !selectedProjectDependenciaId()) {
    setProjectFieldError(els.projectDependencia, "project-dependencia-error", "Selecciona una dependencia.");
    firstInvalid = firstInvalid || els.projectDependencia;
  }
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  const editing = state.projectDialogMode === "rename" && state.editingProjectId;
  els.btnSaveProject.textContent = editing ? "Guardando..." : "Creando...";
  setProjectFormLocked(true);
  try {
    const payload = {
      name,
      bpin,
      dependencia_id: selectedProjectDependenciaId(),
    };
    if (els.projectMembers) payload.member_ids = selectedMemberIds();

    if (editing) {
      const project = await api(`/api/projects/${state.editingProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const editedId = state.editingProjectId;
      state.projectSaving = false;
      els.dialog.close();
      state.projectDialogMode = "create";
      state.editingProjectId = null;
      if (state.currentProject?.id === editedId) {
        state.currentProject = project;
        await refreshCurrentProject(state.currentFolderId);
      }
      await loadProjects();
      showToast("Proyecto actualizado.", "ok");
      document.querySelector(".proj-summary-actions .btn-secondary")?.focus();
    } else {
      const project = await api("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      state.projectSaving = false;
      els.dialog.close();
      state.currentProject = project;
      await loadProjects();
      showToast("Proyecto creado correctamente.", "ok");
    }
  } catch (error) {
    applyProjectRequestError(error);
  } finally {
    if (els.dialog.open) {
      setProjectFormLocked(false);
      els.btnSaveProject.textContent = editing ? "Guardar cambios" : "Crear proyecto";
      syncProjectSaveState();
    }
  }
});

els.folderForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.folderError.hidden = true;
  els.btnSaveFolder.disabled = true;

  const name = els.folderName.value.trim();
  if (!name) {
    els.folderError.hidden = false;
    els.folderError.textContent = "El nombre es obligatorio.";
    els.btnSaveFolder.disabled = false;
    return;
  }

  try {
    if (state.folderDialogMode === "rename" && state.editingFolderId) {
      await api(`/api/folders/${state.editingFolderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      els.folderDialog.close();
      await refreshCurrentProject(state.editingFolderId);
      showToast("Carpeta renombrada.", "ok");
    } else {
      const folder = await api(`/api/projects/${state.currentProject.id}/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      els.folderDialog.close();
      await refreshCurrentProject(folder.id);
      showToast("Carpeta creada.", "ok");
    }
  } catch (error) {
    els.folderError.hidden = false;
    els.folderError.textContent = error.message;
  } finally {
    els.btnSaveFolder.disabled = false;
  }
});

els.uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.currentFolderId && !state.editingDocumentId) return;

  const name = els.docName.value.trim();
  const file = els.docFile.files[0];
  const isEdit = Boolean(state.editingDocumentId);
  els.uploadError.hidden = true;

  if (!name) {
    els.uploadError.hidden = false;
    els.uploadError.textContent = "Indique el nombre del documento.";
    return;
  }
  if (!isEdit && !file) {
    els.uploadError.hidden = false;
    els.uploadError.textContent = "Seleccione un archivo PDF.";
    return;
  }
  if (file && !file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
    els.uploadError.hidden = false;
    els.uploadError.textContent = "Solo se permiten archivos PDF.";
    return;
  }

  const formData = new FormData();
  formData.append("nombre", name);
  if (file) {
    formData.append("file", file, file.name);
  }

  els.btnUpload.disabled = true;
  try {
    const folderId = state.currentFolderId;
    if (isEdit) {
      await api(`/api/documents/${state.editingDocumentId}`, {
        method: "PATCH",
        body: formData,
      });
      showToast(
        file ? "Documento y PDF actualizados." : "Documento actualizado.",
        "ok"
      );
    } else {
      await api(`/api/folders/${folderId}/documents`, {
        method: "POST",
        body: formData,
      });
      showToast("Documento subido correctamente.", "ok");
    }
    els.uploadDialog.close();
    els.uploadForm.reset();
    state.editingDocumentId = null;
    els.docDate.value = todayLabel();
    await refreshCurrentProject(folderId);
  } catch (error) {
    els.uploadError.hidden = false;
    els.uploadError.textContent = error.message;
  } finally {
    els.btnUpload.disabled = false;
  }
});

els.btnCancelUpload.addEventListener("click", () => {
  state.editingDocumentId = null;
  els.uploadDialog.close();
});

els.userRoleSelect?.addEventListener("change", () => syncDependenciaRequirement());

els.btnNewDependencia?.addEventListener("click", () => {
  if (state.user?.role !== ROLE.SUPER) return;
  resetDependenciaForm();
  if (els.usersPanel) els.usersPanel.hidden = true;
  if (els.dependenciaScreen) els.dependenciaScreen.hidden = false;
  els.appMain?.classList.remove("is-users");
  els.appMain?.classList.add("is-dependencias");
  loadDependenciaCatalog().catch((error) => showToast(error.message, "err"));
});

els.dependenciaSearch?.addEventListener("input", () => {
  if (els.dependenciaSearch?.disabled || dependenciaFormIsOpen()) return;
  renderDependenciaManager();
});

els.btnShowDependenciaCreate?.addEventListener("click", () => {
  if (state.dependenciaSaving) return;
  resetDependenciaForm();
  state.dependenciaBaseline = "";
  setDependenciaFormOpen(true);
  syncDependenciaSaveState();
  els.dependenciaNewName?.focus();
});

els.btnCancelDependencia?.addEventListener("click", () => {
  resetDependenciaForm();
  if (els.dependenciaScreen) els.dependenciaScreen.hidden = true;
  els.appMain?.classList.remove("is-dependencias");
});

els.btnCancelDependenciaEdit?.addEventListener("click", () => cancelDependenciaForm());

els.dependenciaNewName?.addEventListener("input", () => {
  setDependenciaFieldError("");
  syncDependenciaSaveState();
});

els.projectDependencia?.addEventListener("change", () => {
  setProjectFieldError(els.projectDependencia, "project-dependencia-error", "");
  syncProjectSaveState();
});

els.dependenciaForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (state.user?.role !== ROLE.SUPER || state.dependenciaSaving) return;
  const name = dependenciaNameValue();
  const editing = Boolean(state.editingDependenciaId);
  const editedId = state.editingDependenciaId;
  if (!name) {
    setDependenciaFieldError("El nombre de la dependencia es obligatorio.");
    els.dependenciaNewName?.focus();
    return;
  }
  if (name.length > 200) {
    setDependenciaFieldError("El nombre no puede superar 200 caracteres.");
    els.dependenciaNewName?.focus();
    return;
  }
  if (dependenciaNameTaken(name, editing ? editedId : null)) {
    setDependenciaFieldError("Ya existe una dependencia con ese nombre");
    els.dependenciaNewName?.focus();
    return;
  }
  if (editing && name === (state.dependenciaBaseline || "").trim()) return;
  setDependenciaFieldError("");
  const saveBtn = dependenciaSaveButton();
  const cancelBtn = dependenciaCancelButton();
  state.dependenciaSaving = true;
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = editing ? "Guardando..." : "Creando...";
  }
  if (cancelBtn) cancelBtn.disabled = true;
  try {
    if (editing) {
      await api(`/api/users/dependencias/${editedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      resetDependenciaForm();
      await loadDependenciaCatalog();
      await loadProjects();
      showToast("Dependencia actualizada.", "ok");
      document.querySelector(`[data-dependencia-id="${editedId}"] .proj-kebab-btn`)?.focus();
    } else {
      const created = await api("/api/users/dependencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      resetDependenciaForm();
      await loadDependenciaCatalog(created.id);
      showToast("Dependencia creada correctamente.", "ok");
      els.btnShowDependenciaCreate?.focus();
    }
  } catch (error) {
    state.dependenciaSaving = false;
    setDependenciaFieldError(dependenciaRequestError(error, editing));
    if (saveBtn) saveBtn.textContent = editing ? "Guardar cambios" : "Crear dependencia";
    if (cancelBtn) cancelBtn.disabled = false;
    syncDependenciaSaveState();
    els.dependenciaNewName?.focus();
  }
});

els.btnOpenUsers?.addEventListener("click", () => {
  openUsersDialog().catch((error) => showToast(error.message, "err"));
});

els.btnCloseUsers?.addEventListener("click", () => {
  resetUserForm();
  if (els.usersPanel) els.usersPanel.hidden = true;
  els.appMain?.classList.remove("is-users");
});

els.btnCancelUserEdit?.addEventListener("click", () => cancelUserForm());
document.getElementById("btn-show-user-create")?.addEventListener("click", () => {
  openUserCreateForm().catch((error) => showToast(error.message, "err"));
});
document.getElementById("user-search")?.addEventListener("input", () => {
  state.page.cuentas = 0;
  renderUsersPage();
});
["user-filter-role", "user-filter-dependencia", "user-filter-status"].forEach((id) => {
  document.getElementById(id)?.addEventListener("change", () => {
    state.page.cuentas = 0;
    syncUserFilterButton();
    renderUsersPage();
  });
});
document.getElementById("btn-clear-user-filters")?.addEventListener("click", () => {
  ["user-filter-role", "user-filter-dependencia", "user-filter-status"].forEach((id) => {
    const select = document.getElementById(id);
    if (select) select.value = "";
  });
  state.page.cuentas = 0;
  syncUserFilterButton();
  renderUsersPage();
});
["user-full-name", "user-email", "user-password", "user-password-confirm"].forEach((id) => {
  document.getElementById(id)?.addEventListener("input", () => {
    const map = {
      "user-full-name": ["user-name-error", els.userFullName],
      "user-email": ["user-email-error", els.userEmail],
      "user-password": ["user-password-error", els.userPassword],
      "user-password-confirm": ["user-password-confirm-error", document.getElementById("user-password-confirm")],
    };
    const [errorId, input] = map[id];
    setUserFieldError(input, errorId, "");
    syncUserSaveState();
  });
});
els.userRoleSelect?.addEventListener("change", () => {
  syncDependenciaRequirement();
  setUserFieldError(els.userRoleSelect, "user-role-error", "");
  syncUserSaveState();
});
els.userDependencia?.addEventListener("change", () => {
  setUserFieldError(els.userDependencia, "user-dependencia-error", "");
  syncUserSaveState();
});
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    bindPasswordToggle("user-password", "user-password-toggle");
bindPasswordToggle("user-password-confirm", "user-password-confirm-toggle");
bindPasswordToggle("password-new", "password-new-toggle");
bindPasswordToggle("password-confirm", "password-confirm-toggle");

els.btnCancelPassword?.addEventListener("click", () => {
  state.passwordTargetUser = null;
  els.passwordDialog.close();
});

els.passwordForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const target = state.passwordTargetUser;
  if (!target) return;

  els.passwordFormError.hidden = true;
  const password = els.passwordNew.value;
  const confirm = els.passwordConfirm.value;
  if (password !== confirm) {
    els.passwordFormError.hidden = false;
    els.passwordFormError.textContent = "Las contraseñas no coinciden.";
    return;
  }
  if (password.length < 8 || password.length > 128) {
    els.passwordFormError.hidden = false;
    els.passwordFormError.textContent = "La contraseña debe tener entre 8 y 128 caracteres.";
    return;
  }

  els.btnSavePassword.disabled = true;
  els.btnCancelPassword.disabled = true;
  els.btnSavePassword.textContent = "Actualizando...";
  try {
    await api(`/api/users/${target.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    state.passwordTargetUser = null;
    els.passwordForm.reset();
    els.passwordDialog.close();
    showToast("Contraseña actualizada correctamente.", "ok");
  } catch (error) {
    const raw = String(error?.message || "");
    els.passwordFormError.hidden = false;
    els.passwordFormError.textContent =
      raw.length > 180 || raw.includes("{") ? "No fue posible actualizar la contraseña." : raw;
  } finally {
    els.btnSavePassword.disabled = false;
    els.btnCancelPassword.disabled = false;
    els.btnSavePassword.textContent = "Actualizar contraseña";
  }
});

els.userForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (state.userSaving) return;
  clearUserFieldErrors();
  const editingId = state.editingUserId;
  const name = els.userFullName.value.trim();
  const email = els.userEmail.value.trim();
  const role = els.userRoleSelect.value;
  const needsDep = role !== ROLE.SUPER;
  const dependenciaId = els.userDependencia?.value ? Number(els.userDependencia.value) : null;
  const password = els.userPassword?.value || "";
  const confirm = document.getElementById("user-password-confirm")?.value || "";
  let first = null;
  if (!name) {
    setUserFieldError(els.userFullName, "user-name-error", "El nombre completo es obligatorio.");
    first = els.userFullName;
  }
  if (!email) {
    setUserFieldError(els.userEmail, "user-email-error", "El correo electrónico es obligatorio.");
    first = first || els.userEmail;
  } else if (!userEmailLooksValid(email)) {
    setUserFieldError(els.userEmail, "user-email-error", "Introduce un correo electrónico válido.");
    first = first || els.userEmail;
  }
  if (!role) {
    setUserFieldError(els.userRoleSelect, "user-role-error", "Selecciona un rol.");
    first = first || els.userRoleSelect;
  }
  if (needsDep && !dependenciaId) {
    setUserFieldError(els.userDependencia, "user-dependencia-error", "Selecciona una dependencia.");
    first = first || els.userDependencia;
  }
  if (!editingId) {
    if (password.length < 8 || password.length > 128) {
      setUserFieldError(els.userPassword, "user-password-error", "La contraseña debe tener entre 8 y 128 caracteres.");
      first = first || els.userPassword;
    }
    if (password !== confirm) {
      setUserFieldError(
        document.getElementById("user-password-confirm"),
        "user-password-confirm-error",
        "Las contraseñas no coinciden."
      );
      first = first || document.getElementById("user-password-confirm");
    }
  }
  if (first) {
    first.focus();
    return;
  }

  state.userSaving = true;
  els.btnSaveUser.disabled = true;
  els.btnCancelUserEdit.disabled = true;
  els.btnSaveUser.textContent = editingId ? "Guardando..." : "Creando...";
  try {
    if (editingId) {
      const payload = {
        full_name: name,
        email,
        dependencia_id: dependenciaId,
      };
      if (!els.userRoleSelect.disabled) payload.role = role;
      await api(`/api/users/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (editingId === state.user?.id) {
        state.user = await api("/api/auth/me");
        if (els.userName) els.userName.textContent = state.user.full_name;
        if (els.userRole) els.userRole.textContent = state.user.role_label;
        renderDirectory();
      }
      state.userSaving = false;
      resetUserForm();
      await loadUsersTable();
      showToast("Usuario actualizado correctamente.", "ok");
      document.querySelector(`[data-user-id="${editingId}"] .proj-kebab-btn`)?.focus();
    } else {
      await api("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name,
          email,
          password,
          role,
          dependencia_id: dependenciaId,
          is_active: true,
        }),
      });
      state.userSaving = false;
      resetUserForm();
      await loadUsersTable();
      showToast("Usuario creado correctamente.", "ok");
      document.getElementById("btn-show-user-create")?.focus();
    }
  } catch (error) {
    const raw = String(error?.message || "");
    const safe = raw.length > 180 || raw.includes("{") || /traceback/i.test(raw);
    if (/correo ya está registrado/i.test(raw)) {
      setUserFieldError(els.userEmail, "user-email-error", "Ya existe una cuenta registrada con este correo.");
      els.userEmail.focus();
    } else if (/contraseña|password/i.test(raw)) {
      setUserFieldError(els.userPassword, "user-password-error", safe ? "La contraseña no cumple las reglas." : raw);
      els.userPassword.focus();
    } else if (/dependencia/i.test(raw)) {
      setUserFieldError(els.userDependencia, "user-dependencia-error", safe ? "Selecciona una dependencia." : raw);
      els.userDependencia.focus();
    } else if (els.userFormError) {
      els.userFormError.hidden = false;
      els.userFormError.textContent = safe
        ? editingId
          ? "No fue posible guardar el usuario. Intenta nuevamente."
          : "No fue posible crear el usuario. Intenta nuevamente."
        : raw || "No fue posible crear el usuario. Intenta nuevamente.";
      els.userFormError.focus();
    }
  } finally {
    state.userSaving = false;
    if (els.userForm && !els.userForm.hidden) {
      els.btnCancelUserEdit.disabled = false;
      els.btnSaveUser.textContent = editingId ? "Guardar cambios" : "Crear usuario";
      syncUserSaveState();
    }
  }
});

els.loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.loginError.hidden = true;
  els.btnLogin.disabled = true;
  try {
    state.user = await api("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: els.loginEmail.value.trim(),
        password: els.loginPassword.value,
      }),
    });
    showApp();
    await loadProjects();
    showToast(`Bienvenido, ${state.user.full_name}.`, "ok");
  } catch (error) {
    els.loginError.hidden = false;
    els.loginError.textContent = error.message;
  } finally {
    els.btnLogin.disabled = false;
  }
});

els.btnLogout?.addEventListener("click", async () => {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } catch {
    /* ignore */
  }
  state.user = null;
  state.projects = [];
  state.currentProject = null;
  state.currentFolderId = null;
  rememberLocation();
  showLogin();
});

els.docDate.value = todayLabel();
boot().catch(() => showLogin());

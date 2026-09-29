(() => {
  const state = {
    user: null,
    projects: [],
    currentProject: null,
    currentFolderId: null,
    folderDialogMode: "create", // create | rename
    editingFolderId: null,
    editingDocumentId: null,
    projectDialogMode: "create", // create | rename
    editingProjectId: null,
    assignableRoles: [],
    passwordTargetUser: null,
    editingUserId: null,
  };

  const ROLE = {
    SUPER: "super_administrador",
    ADMIN: "administrador",
    USER: "usuario",
  };

  const els = {
    loginScreen: document.getElementById("login-screen"),
    appShell: document.getElementById("app-shell"),
    loginForm: document.getElementById("login-form"),
    loginEmail: document.getElementById("login-email"),
    loginPassword: document.getElementById("login-password"),
    loginError: document.getElementById("login-error"),
    btnLogin: document.getElementById("btn-login"),
    btnLogout: document.getElementById("btn-logout"),
    userName: document.getElementById("user-name"),
    userRole: document.getElementById("user-role"),
    btnOpenUsers: document.getElementById("btn-open-users"),
    usersDialog: document.getElementById("users-dialog"),
    userForm: document.getElementById("user-form"),
    userFullName: document.getElementById("user-full-name"),
    userEmail: document.getElementById("user-email"),
    userPassword: document.getElementById("user-password"),
    userPasswordField: document.getElementById("user-password-field"),
    userPasswordLabel: document.getElementById("user-password-label"),
    userRoleSelect: document.getElementById("user-role-select"),
    usersDialogHelp: document.getElementById("users-dialog-help"),
    userFormError: document.getElementById("user-form-error"),
    btnSaveUser: document.getElementById("btn-save-user"),
    btnCancelUserEdit: document.getElementById("btn-cancel-user-edit"),
    usersBody: document.getElementById("users-body"),
    btnCloseUsers: document.getElementById("btn-close-users"),
    passwordDialog: document.getElementById("password-dialog"),
    passwordForm: document.getElementById("password-form"),
    passwordDialogHelp: document.getElementById("password-dialog-help"),
    passwordNew: document.getElementById("password-new"),
    passwordConfirm: document.getElementById("password-confirm"),
    passwordFormError: document.getElementById("password-form-error"),
    btnCancelPassword: document.getElementById("btn-cancel-password"),
    btnSavePassword: document.getElementById("btn-save-password"),
    projectList: document.getElementById("project-list"),
    projectSearch: document.getElementById("project-search"),
    folderList: document.getElementById("folder-list"),
    folderSection: document.getElementById("folder-section"),
    emptyState: document.getElementById("empty-state"),
    noFoldersState: document.getElementById("no-folders-state"),
    docsPanel: document.getElementById("docs-panel"),
    docsBody: document.getElementById("docs-body"),
    docsEmpty: document.getElementById("docs-empty"),
    docsCount: document.getElementById("docs-count"),
    docsTableWrap: document.getElementById("docs-table-wrap"),
    previewDialog: document.getElementById("preview-dialog"),
    previewTitle: document.getElementById("preview-title"),
    previewPages: document.getElementById("preview-pages"),
    btnUploadMore: document.getElementById("btn-upload-more"),
    pageTitle: document.getElementById("page-title"),
    folderSubtitle: document.getElementById("folder-subtitle"),
    contextEyebrow: document.getElementById("context-eyebrow"),
    headerMeta: document.getElementById("header-meta"),
    uploadDialog: document.getElementById("upload-dialog"),
    uploadDialogTitle: document.getElementById("upload-dialog-title"),
    uploadDialogHelp: document.getElementById("upload-dialog-help"),
    uploadForm: document.getElementById("upload-form"),
    uploadError: document.getElementById("upload-error"),
    docName: document.getElementById("doc-name"),
    docDate: document.getElementById("doc-date"),
    docFile: document.getElementById("doc-file"),
    docFileField: document.getElementById("doc-file-field"),
    docFileLabel: document.getElementById("doc-file-label"),
    docFileHint: document.getElementById("doc-file-hint"),
    docCurrentFile: document.getElementById("doc-current-file"),
    docNewFile: document.getElementById("doc-new-file"),
    pdfReplacePanel: document.getElementById("pdf-replace-panel"),
    btnPickPdf: document.getElementById("btn-pick-pdf"),
    btnUpload: document.getElementById("btn-upload"),
    btnCancelUpload: document.getElementById("btn-cancel-upload"),
    btnUploadNewEmpty: document.getElementById("btn-upload-new-empty"),
    btnUploadMore: document.getElementById("btn-upload-more"),
    toast: document.getElementById("toast"),
    dialog: document.getElementById("project-dialog"),
    projectDialogTitle: document.getElementById("project-dialog-title"),
    projectDialogHelp: document.getElementById("project-dialog-help"),
    projectForm: document.getElementById("project-form"),
    projectName: document.getElementById("project-name"),
    projectBpin: document.getElementById("project-bpin"),
    projectError: document.getElementById("project-error"),
    btnNewProject: document.getElementById("btn-new-project"),
    btnNewProjectEmpty: document.getElementById("btn-new-project-empty"),
    btnCancelProject: document.getElementById("btn-cancel-project"),
    btnSaveProject: document.getElementById("btn-save-project"),
    btnNewFolder: document.getElementById("btn-new-folder"),
    btnNewFolderEmpty: document.getElementById("btn-new-folder-empty"),
    folderDialog: document.getElementById("folder-dialog"),
    folderForm: document.getElementById("folder-form"),
    folderName: document.getElementById("folder-name"),
    folderError: document.getElementById("folder-error"),
    folderDialogTitle: document.getElementById("folder-dialog-title"),
    folderDialogHelp: document.getElementById("folder-dialog-help"),
    btnCancelFolder: document.getElementById("btn-cancel-folder"),
    btnSaveFolder: document.getElementById("btn-save-folder"),
    btnOpenTrash: document.getElementById("btn-open-trash"),
    trashCount: document.getElementById("trash-count"),
    trashDialog: document.getElementById("trash-dialog"),
    trashDialogHelp: document.getElementById("trash-dialog-help"),
    trashList: document.getElementById("trash-list"),
    trashEmpty: document.getElementById("trash-empty"),
    btnCloseTrash: document.getElementById("btn-close-trash"),
    deleteWarningDialog: document.getElementById("delete-warning-dialog"),
    deleteWarningForm: document.getElementById("delete-warning-form"),
    deleteWarningTitle: document.getElementById("delete-warning-title"),
    deleteWarningText: document.getElementById("delete-warning-text"),
    confirmSubject: document.getElementById("confirm-subject"),
    confirmSubjectLabel1: document.getElementById("confirm-subject-label-1"),
    confirmSubjectName: document.getElementById("confirm-subject-name"),
    confirmSubjectLabel2: document.getElementById("confirm-subject-label-2"),
    confirmSubjectBpin: document.getElementById("confirm-subject-bpin"),
    btnCancelDelete: document.getElementById("btn-cancel-delete"),
    btnConfirmDelete: document.getElementById("btn-confirm-delete"),
  };

  let pendingConfirm = null;

  function askConfirm({ title, message, confirmLabel = "Confirmar", danger = true, subject = null, onConfirm }) {
    pendingConfirm = { onConfirm };
    els.deleteWarningTitle.textContent = title;
    els.deleteWarningText.textContent = message;
    els.btnConfirmDelete.textContent = confirmLabel;
    els.btnConfirmDelete.className = danger ? "btn btn-danger" : "btn btn-primary";

    if (subject && els.confirmSubject) {
      els.confirmSubject.hidden = false;
      if (els.confirmSubjectLabel1) els.confirmSubjectLabel1.textContent = subject.label1 || "Detalle";
      if (els.confirmSubjectName) els.confirmSubjectName.textContent = subject.value1 || "—";
      if (els.confirmSubjectLabel2) els.confirmSubjectLabel2.textContent = subject.label2 || "Detalle";
      if (els.confirmSubjectBpin) els.confirmSubjectBpin.textContent = subject.value2 || "—";
    } else if (els.confirmSubject) {
      els.confirmSubject.hidden = true;
    }

    els.deleteWarningDialog.showModal();
  }

  async function runPendingConfirm() {
    if (!pendingConfirm?.onConfirm) return;
    const { onConfirm } = pendingConfirm;
    pendingConfirm = null;
    els.btnConfirmDelete.disabled = true;
    els.deleteWarningDialog.close();
    try {
      await onConfirm();
    } catch (error) {
      showToast(error.message, "err");
    } finally {
      els.btnConfirmDelete.disabled = false;
    }
  }

  function askMoveToTrash(type, id, name, message) {
    askConfirm({
      title: "¿Mover a la papelera?",
      message,
      confirmLabel: "Sí, mover a papelera",
      danger: true,
      onConfirm: async () => {
        if (type === "folder") {
          await api(`/api/folders/${id}`, { method: "DELETE" });
          showToast("Carpeta movida a la papelera.", "ok");
          await refreshCurrentProject(null);
        } else if (type === "document") {
          await api(`/api/documents/${id}`, { method: "DELETE" });
          showToast("Documento movido a la papelera.", "ok");
          await refreshCurrentProject(state.currentFolderId);
        } else if (type === "project") {
          await api(`/api/projects/${id}`, { method: "DELETE" });
          showToast("Proyecto movido a la papelera.", "ok");
          state.currentProject = null;
          state.currentFolderId = null;
          await loadProjects();
        }
        await refreshTrashCount();
      },
    });
  }

  function deleteFolder(folder) {
    if (!folder) return;
    if (!canManageFolders()) {
      showToast("No tiene permisos para borrar carpetas.", "err");
      return;
    }
    const project = state.currentProject;
    const documentCount = folder.document_count || 0;
    const message =
      documentCount > 0
        ? `¿Está seguro de borrar esta carpeta? Se moverá a la papelera junto con sus ${documentCount} documento(s). Podrá restaurarlos después si fue un error.`
        : "¿Está seguro de borrar esta carpeta? Se moverá a la papelera. Podrá restaurarla después si fue un error.";
    askConfirm({
      title: "¿Borrar carpeta?",
      message,
      confirmLabel: "Sí, borrar carpeta",
      danger: true,
      subject: {
        label1: "Carpeta",
        value1: folder.name,
        label2: "Proyecto",
        value2: project ? `${project.name} · BPIN ${project.bpin}` : "—",
      },
      onConfirm: async () => {
        await api(`/api/folders/${folder.id}`, { method: "DELETE" });
        showToast("Carpeta movida a la papelera.", "ok");
        await refreshCurrentProject(null);
        await refreshTrashCount();
      },
    });
  }

  function confirmRenameFolder(folder) {
    if (!folder) return;
    if (!canManageFolders()) {
      showToast("No tiene permisos para renombrar carpetas.", "err");
      return;
    }
    const project = state.currentProject;
    askConfirm({
      title: "¿Editar carpeta?",
      message: "¿Está seguro de editar esta carpeta? En el siguiente paso podrá cambiar el nombre.",
      confirmLabel: "Sí, continuar",
      danger: false,
      subject: {
        label1: "Carpeta",
        value1: folder.name,
        label2: "Proyecto",
        value2: project ? `${project.name} · BPIN ${project.bpin}` : "—",
      },
      onConfirm: () => {
        openFolderDialog("rename", folder);
      },
    });
  }

  function deleteProject(project) {
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

  function confirmRenameProject(project) {
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

  function todayLabel() {
    return new Intl.DateTimeFormat("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date());
  }

  function auditCell(name, iso, emptyLabel, extraClass = "") {
    const cls = extraClass ? ` ${extraClass}` : "";
    if (!iso) {
      if (!emptyLabel) return `<td class="audit-cell${cls}"></td>`;
      return `<td class="audit-cell${cls}"><span class="audit-empty">${escapeHtml(emptyLabel)}</span></td>`;
    }
    const who = name ? escapeHtml(name) : escapeHtml(emptyLabel);
    return `<td class="audit-cell${cls}"><span class="audit-name">${who}</span><span class="audit-time">${escapeHtml(formatDateTime(iso))}</span></td>`;
  }

  function formatDateTime(iso) {
    return new Intl.DateTimeFormat("es-CO", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  }

  function formatBytes(bytes) {
    const mb = (Number(bytes) || 0) / (1024 * 1024);
    const text = new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: mb > 0 && mb < 0.01 ? 4 : 2,
    }).format(mb);
    return `${text} MB`;
  }

  function showToast(message, type) {
    els.toast.hidden = false;
    els.toast.textContent = message;
    els.toast.className = `toast ${type}`;
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => {
      els.toast.hidden = true;
    }, 4200);
  }

  function canWrite() {
    const role = state.user?.role;
    return role === ROLE.SUPER || role === ROLE.ADMIN;
  }

  /** Solo administrador y super administrador: crear / renombrar / borrar proyectos. */
  function canManageProjects() {
    return canWrite();
  }

  /** Renombrar / borrar carpetas: admin, super y usuario. Crear carpeta sigue siendo solo admin. */
  function canManageFolders() {
    const role = state.user?.role;
    return role === ROLE.SUPER || role === ROLE.ADMIN || role === ROLE.USER;
  }

  function canManageUsers() {
    const role = state.user?.role;
    return role === ROLE.SUPER || role === ROLE.ADMIN;
  }

  /** Usuario puede subir docs y usar papelera de los suyos; admin/super tienen escritura plena. */
  function canManageDocs() {
    const role = state.user?.role;
    return role === ROLE.SUPER || role === ROLE.ADMIN || role === ROLE.USER;
  }

  function canUseTrash() {
    return canManageDocs();
  }

  /** Solo admin / super: borrar definitivamente desde la papelera. */
  function canPurgeTrash() {
    return canWrite();
  }

  /** Usuario, administrador y super administrador gestionan cualquier documento. */
  function canManageDocument() {
    return canManageDocs();
  }

  const ROLE_RANK = {
    [ROLE.USER]: 1,
    [ROLE.ADMIN]: 2,
    [ROLE.SUPER]: 3,
  };

  /** Alineado con can_manage_target del backend: super gestiona a todos; el resto solo rango inferior. */
  function canManageTargetUser(targetRole) {
    const actorRole = state.user?.role;
    if (!actorRole || !targetRole) return false;
    if (actorRole === ROLE.SUPER) return true;
    return (ROLE_RANK[actorRole] || 0) > (ROLE_RANK[targetRole] || 0);
  }

  function applyPermissions() {
    const write = canWrite();
    const manage = canManageUsers();
    const docs = canManageDocs();
    const trash = canUseTrash();
    const projects = canManageProjects();

    if (els.btnNewProject) els.btnNewProject.hidden = !projects;
    if (els.btnNewProjectEmpty) els.btnNewProjectEmpty.hidden = !projects;
    if (els.btnOpenTrash) els.btnOpenTrash.hidden = !trash;
    if (els.btnOpenUsers) els.btnOpenUsers.hidden = !manage;
    if (els.btnNewFolder) els.btnNewFolder.hidden = !write;
    if (els.btnNewFolderEmpty) els.btnNewFolderEmpty.hidden = !write;
    if (els.btnUploadMore) {
      const hasRows = Boolean(els.docsBody?.children?.length);
      els.btnUploadMore.hidden = !docs || !hasRows;
    }
    if (els.btnUploadNewEmpty) els.btnUploadNewEmpty.hidden = !docs;

    if (state.user) {
      els.userName.textContent = state.user.full_name;
      els.userRole.textContent = state.user.role_label;
    }
  }

  function showLogin() {
    state.user = null;
    els.appShell.hidden = true;
    els.loginScreen.hidden = false;
    els.loginError.hidden = true;
    els.loginPassword.value = "";
    els.loginEmail.focus();
  }

  function showApp() {
    els.loginScreen.hidden = true;
    els.appShell.hidden = false;
    applyPermissions();
  }

  async function api(url, options = {}) {
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

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function currentFolder() {
    return state.currentProject?.folders.find((item) => item.id === state.currentFolderId) || null;
  }

  function openProjectDialog(mode = "create", project = null) {
    if (mode === "create" && !canManageProjects()) {
      showToast("No tiene permisos para crear proyectos.", "err");
      return;
    }
    if (mode === "rename" && !canManageProjects()) {
      showToast("No tiene permisos para renombrar proyectos.", "err");
      return;
    }
    state.projectDialogMode = mode;
    state.editingProjectId = mode === "rename" && project ? project.id : null;
    els.projectError.hidden = true;
    els.projectError.textContent = "";
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
        els.projectDialogHelp.textContent = "El nombre y el BPIN definen la carpeta raíz en el servidor.";
      }
      els.btnSaveProject.textContent = "Crear proyecto";
    }

    els.dialog.showModal();
    els.projectName.focus();
    if (mode === "rename") els.projectName.select();
  }

  function openFolderDialog(mode, folder = null) {
    if (mode === "create" && !canWrite()) {
      showToast("No tiene permisos para crear carpetas.", "err");
      return;
    }
    if (mode === "rename" && !canManageFolders()) {
      showToast("No tiene permisos para renombrar carpetas.", "err");
      return;
    }
    if (!state.currentProject) {
      showToast("Seleccione un proyecto primero.", "err");
      return;
    }
    state.folderDialogMode = mode;
    state.editingFolderId = folder?.id || null;
    els.folderError.hidden = true;
    els.folderError.textContent = "";
    els.folderForm.reset();

    if (mode === "rename" && folder) {
      els.folderDialogTitle.textContent = "Renombrar carpeta";
      els.folderDialogHelp.textContent = "El nombre se actualizará en la interfaz y en el disco.";
      els.folderName.value = folder.name;
      els.btnSaveFolder.textContent = "Guardar nombre";
    } else {
      els.folderDialogTitle.textContent = "Nueva carpeta";
      els.folderDialogHelp.textContent = "Se creará dentro del proyecto seleccionado.";
      els.btnSaveFolder.textContent = "Crear carpeta";
    }

    els.folderDialog.showModal();
    els.folderName.focus();
    els.folderName.select();
  }

  function filteredProjects() {
    const query = (els.projectSearch?.value || "").trim().toLowerCase();
    if (!query) return state.projects;
    return state.projects.filter((project) => {
      const name = String(project.name || "").toLowerCase();
      const bpin = String(project.bpin || "").toLowerCase();
      return name.includes(query) || bpin.includes(query);
    });
  }

  function renderProjects() {
    els.projectList.innerHTML = "";
    if (!state.projects.length) {
      els.projectList.innerHTML = `<p class="nav-item" style="cursor:default;opacity:.7">No hay proyectos</p>`;
      return;
    }

    const projects = filteredProjects();
    if (!projects.length) {
      els.projectList.innerHTML = `<p class="nav-item" style="cursor:default;opacity:.7">Sin coincidencias</p>`;
      return;
    }

    projects.forEach((project) => {
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
    });
  }

  function renderFolders() {
    const project = state.currentProject;
    els.folderList.innerHTML = "";

    if (!project) {
      els.folderSection.hidden = true;
      return;
    }

    els.folderSection.hidden = false;

    if (!project.folders.length) {
      els.folderList.innerHTML = `<p class="nav-item" style="cursor:default;opacity:.7">Sin carpetas</p>`;
      return;
    }

    project.folders.forEach((folder) => {
      const row = document.createElement("div");
      row.className = "nav-row";

      const button = document.createElement("button");
      button.type = "button";
      button.className = `nav-item${state.currentFolderId === folder.id ? " active" : ""}`;
      button.innerHTML = `<strong>${escapeHtml(folder.name)}</strong><span>${folder.document_count} documento(s)</span>`;
      button.addEventListener("click", () => selectFolder(folder.id));

      const actions = document.createElement("div");
      actions.className = "nav-actions";

      if (canManageFolders()) {
        const renameBtn = document.createElement("button");
        renameBtn.type = "button";
        renameBtn.className = "nav-action";
        renameBtn.textContent = "Editar carpeta";
        renameBtn.title = "Renombrar carpeta";
        renameBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          confirmRenameFolder(folder);
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "nav-action danger";
        deleteBtn.textContent = "Borrar carpeta";
        deleteBtn.title = "Eliminar carpeta";
        deleteBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          deleteFolder(folder);
        });

        actions.append(renameBtn, deleteBtn);
      }

      row.append(button, actions);
      els.folderList.appendChild(row);
    });
  }

  function setHeader() {
    const project = state.currentProject;
    const folder = currentFolder();

    if (!project) {
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

    els.contextEyebrow.textContent = `BPIN ${project.bpin}`;
    els.pageTitle.textContent = project.name;

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
      els.headerMeta.textContent = "Seleccione una carpeta en el menú lateral.";
    }
  }

  function showWorkspace() {
    const hasProject = Boolean(state.currentProject);
    const hasFolders = Boolean(state.currentProject?.folders?.length);
    const hasFolder = Boolean(state.currentFolderId);

    els.emptyState.hidden = hasProject;
    els.noFoldersState.hidden = !(hasProject && !hasFolders);
    els.docsPanel.hidden = !hasFolder;
  }

  async function refreshCurrentProject(preferredFolderId = null) {
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

  async function loadProjects() {
    state.projects = await api("/api/projects");
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

  function readLocation() {
    const params = new URLSearchParams(window.location.search);
    const projectId = Number(params.get("proyecto"));
    const folderId = Number(params.get("carpeta"));
    return {
      projectId: Number.isInteger(projectId) && projectId > 0 ? projectId : null,
      folderId: Number.isInteger(folderId) && folderId > 0 ? folderId : null,
    };
  }

  function rememberLocation() {
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

  async function selectProject(projectId, preferredFolderId = null) {
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

  async function selectFolder(folderId) {
    state.currentFolderId = folderId;
    renderFolders();
    setHeader();
    showWorkspace();
    els.docDate.value = todayLabel();
    await loadDocuments();
    rememberLocation();
  }

  async function loadDocuments() {
    if (!state.currentFolderId) return;
    const docs = await api(`/api/folders/${state.currentFolderId}/documents`);
    els.docsCount.textContent = String(docs.length);
    els.docsBody.innerHTML = "";

    const isEmpty = docs.length === 0;
    const table = els.docsTableWrap.querySelector("table");
    if (table) {
      table.classList.toggle("shows-edits", docs.some((doc) => doc.updated_at));
    }
    els.docsEmpty.hidden = !isEmpty;
    els.docsTableWrap.hidden = isEmpty;
    if (els.btnUploadMore) {
      els.btnUploadMore.hidden = isEmpty || !canManageDocs();
    }

    if (isEmpty) return;

    docs.forEach((doc) => {
      const row = document.createElement("tr");
      const actions = document.createElement("td");
      actions.className = "row-actions";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn btn-ghost";
      editBtn.textContent = "Editar";
      editBtn.addEventListener("click", () => openEditDocument(doc));

      const downloadLink = document.createElement("a");
      downloadLink.className = "btn btn-ghost";
      downloadLink.href = `/api/documents/${doc.id}/download`;
      downloadLink.textContent = "Descargar";

      const deleteDocBtn = document.createElement("button");
      deleteDocBtn.type = "button";
      deleteDocBtn.className = "btn btn-ghost danger-text";
      deleteDocBtn.textContent = "Borrar";
      deleteDocBtn.addEventListener("click", () =>
        askMoveToTrash("document", doc.id, doc.name, `«${doc.name}» se moverá a la papelera.`)
      );

      if (canManageDocument(doc)) {
        actions.append(editBtn, downloadLink, deleteDocBtn);
      } else {
        actions.append(downloadLink);
      }

      row.innerHTML = `
        <td>${escapeHtml(doc.name)}</td>
        <td>${escapeHtml(doc.original_filename)}</td>
        ${auditCell(doc.uploaded_by_name, doc.uploaded_at, "No registrado")}
        ${auditCell(doc.updated_by_name, doc.updated_at, "", "col-edited")}
        <td>${escapeHtml(formatBytes(doc.size_bytes))}</td>
      `;

      const previewCell = document.createElement("td");
      previewCell.className = "col-preview";
      const previewBtn = document.createElement("button");
      previewBtn.type = "button";
      previewBtn.className = "doc-preview-btn";
      previewBtn.setAttribute("aria-label", `Vista previa de ${doc.name}`);
      const previewImg = document.createElement("img");
      previewImg.className = "doc-preview";
      previewImg.alt = "";
      previewImg.src = `/api/documents/${doc.id}/preview`;
      previewImg.addEventListener("error", () => {
        previewBtn.disabled = true;
        previewBtn.textContent = "Sin vista";
        previewImg.remove();
      });
      previewBtn.append(previewImg);
      previewBtn.addEventListener("click", () => openPreview(doc));
      previewCell.append(previewBtn);

      row.append(previewCell, actions);
      els.docsBody.appendChild(row);
    });
  }

  async function openPreview(doc) {
    if (!els.previewDialog || !els.previewPages) return;
    els.previewTitle.textContent = doc.name;
    els.previewPages.innerHTML = "";
    els.previewPages.textContent = "Cargando páginas…";
    els.previewDialog.showModal();
    try {
      const info = await api(`/api/documents/${doc.id}/pages`);
      const total = Math.max(1, Number(info.pages) || 1);
      els.previewPages.innerHTML = "";
      for (let page = 1; page <= total; page += 1) {
        const figure = document.createElement("figure");
        figure.className = "preview-page";
        const caption = document.createElement("figcaption");
        caption.textContent = `Página ${page} de ${total}`;
        const image = document.createElement("img");
        image.className = "preview-image";
        image.alt = `Página ${page} de ${doc.name}`;
        image.loading = "lazy";
        image.src = `/api/documents/${doc.id}/preview?page=${page}`;
        figure.append(caption, image);
        els.previewPages.append(figure);
      }
    } catch (error) {
      els.previewPages.textContent = error.message || "No se pudo abrir el PDF.";
    }
  }

  function resetNewFileStatus() {
    els.docNewFile.textContent = "Ningún archivo nuevo seleccionado";
    els.docNewFile.classList.remove("is-ready");
  }

  function syncNewFileStatus() {
    const file = els.docFile.files[0];
    if (!file) {
      resetNewFileStatus();
      return;
    }
    els.docNewFile.textContent = `Se reemplazará por: ${file.name}`;
    els.docNewFile.classList.add("is-ready");
  }

  function openUploadDialog(isNew = false) {
    if (!state.currentFolderId) {
      showToast("Seleccione una carpeta primero.", "err");
      return;
    }
    state.editingDocumentId = null;
    els.uploadError.hidden = true;
    els.uploadError.textContent = "";
    els.uploadForm.reset();
    els.docDate.value = todayLabel();
    els.docFile.required = true;
    els.docFileHint.hidden = true;
    els.pdfReplacePanel.hidden = true;
    els.docFileField.classList.remove("is-edit");
    els.docFileField.classList.add("is-upload");
    els.docFileLabel.textContent = "Archivo (solo PDF)";
    resetNewFileStatus();
    els.uploadDialogHelp.textContent = "Solo archivos PDF. La fecha de carga se asigna automáticamente.";
    els.uploadDialogTitle.textContent = isNew ? "Subir nuevo documento" : "Subir documentos";
    els.btnUpload.textContent = isNew ? "Subir nuevo documento" : "Subir documentos";
    els.uploadDialog.showModal();
    els.docName.focus();
  }

  function openEditDocument(doc) {
    state.editingDocumentId = doc.id;
    els.uploadError.hidden = true;
    els.uploadError.textContent = "";
    els.uploadForm.reset();
    els.docName.value = doc.name;
    els.docDate.value = formatDateTime(doc.uploaded_at);
    els.docFile.required = false;
    els.docFile.value = "";
    els.docFileField.classList.remove("is-upload");
    els.docFileField.classList.add("is-edit");
    els.docFileLabel.textContent = "Archivo PDF";
    els.pdfReplacePanel.hidden = false;
    els.docCurrentFile.textContent = doc.original_filename;
    els.docFileHint.hidden = true;
    resetNewFileStatus();
    els.uploadDialogHelp.textContent =
      "Cambie el nombre si lo necesita. Para cambiar el PDF, use el paso 2.";
    els.uploadDialogTitle.textContent = "Editar documento";
    els.btnUpload.textContent = "Guardar cambios";
    els.uploadDialog.showModal();
    els.docName.focus();
    els.docName.select();
  }

  async function refreshTrashCount() {
    try {
      const items = await api("/api/trash");
      els.trashCount.textContent = String(items.length);
      return items;
    } catch {
      els.trashCount.textContent = "0";
      return [];
    }
  }

  const TYPE_LABELS = { project: "Proyecto", folder: "Carpeta", document: "Documento" };

  async function openTrashDialog() {
    if (els.trashDialogHelp) {
      els.trashDialogHelp.textContent = canPurgeTrash()
        ? "Vista completa: todos los proyectos, carpetas y documentos eliminados por cualquier usuario. Puede restaurarlos o borrarlos definitivamente."
        : "Aparecen las carpetas que usted borró y los documentos de la papelera. Puede restaurarlos. Solo un administrador puede borrar definitivamente.";
    }
    const items = await refreshTrashCount();
    els.trashList.innerHTML = "";

    if (!items.length) {
      els.trashEmpty.hidden = false;
      els.trashDialog.showModal();
      return;
    }

    els.trashEmpty.hidden = true;
    const allowPurge = canPurgeTrash();
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "trash-item";

      const info = document.createElement("div");
      const deletedByLabel = item.deleted_by_name
        ? escapeHtml(item.deleted_by_name)
        : "Desconocido";
      info.innerHTML = `
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(TYPE_LABELS[item.type] || item.type)} · ${escapeHtml(item.detail)} · ${escapeHtml(formatDateTime(item.deleted_at))}</span>
        <span class="trash-deleted-by">Borrado por: <em>${deletedByLabel}</em></span>
      `;

      const actions = document.createElement("div");
      actions.className = "trash-item-actions";

      const restoreBtn = document.createElement("button");
      restoreBtn.type = "button";
      restoreBtn.className = "btn btn-secondary";
      restoreBtn.textContent = "Restaurar";
      restoreBtn.addEventListener("click", () => restoreTrashItem(item));
      actions.append(restoreBtn);

      if (allowPurge) {
        const purgeBtn = document.createElement("button");
        purgeBtn.type = "button";
        purgeBtn.className = "btn btn-danger";
        purgeBtn.textContent = "Borrar definitivo";
        purgeBtn.addEventListener("click", () => purgeTrashItem(item));
        actions.append(purgeBtn);
      }

      row.append(info, actions);
      els.trashList.appendChild(row);
    });

    els.trashDialog.showModal();
  }

  async function restoreTrashItem(item) {
    try {
      await api(`/api/trash/${item.type}s/${item.id}/restore`, { method: "POST" });
      showToast(`${TYPE_LABELS[item.type]} restaurado.`, "ok");
      await loadProjects();
      if (item.type === "folder" || item.type === "document") {
        await refreshCurrentProject(item.type === "folder" ? item.id : state.currentFolderId);
      }
      await openTrashDialog();
    } catch (error) {
      showToast(error.message, "err");
    }
  }

  async function purgeTrashItem(item) {
    if (!canPurgeTrash()) {
      showToast("Solo un administrador puede borrar definitivamente.", "err");
      return;
    }
    if (
      !window.confirm(
        `¿Eliminar definitivamente «${item.name}»? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    try {
      await api(`/api/trash/${item.type}s/${item.id}`, { method: "DELETE" });
      showToast(`${TYPE_LABELS[item.type]} eliminado definitivamente.`, "ok");
      await openTrashDialog();
      await refreshTrashCount();
    } catch (error) {
      showToast(error.message, "err");
    }
  }

  els.btnNewProject.addEventListener("click", () => openProjectDialog("create"));
  els.btnNewProjectEmpty.addEventListener("click", () => openProjectDialog("create"));
  els.btnCancelProject.addEventListener("click", () => els.dialog.close());
  els.projectSearch.addEventListener("input", () => renderProjects());

  els.btnNewFolder.addEventListener("click", () => openFolderDialog("create"));
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
    pendingConfirm = null;
    if (els.confirmSubject) els.confirmSubject.hidden = true;
    els.deleteWarningDialog.close();
  });
  els.deleteWarningForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await runPendingConfirm();
  });

  els.projectForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    els.projectError.hidden = true;
    els.btnSaveProject.disabled = true;

    try {
      const payload = {
        name: els.projectName.value.trim(),
        bpin: els.projectBpin.value.trim(),
      };

      if (state.projectDialogMode === "rename" && state.editingProjectId) {
        const project = await api(`/api/projects/${state.editingProjectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        els.dialog.close();
        const editedId = state.editingProjectId;
        state.projectDialogMode = "create";
        state.editingProjectId = null;
        if (state.currentProject?.id === editedId) {
          state.currentProject = project;
          await refreshCurrentProject(state.currentFolderId);
        }
        await loadProjects();
        showToast("Proyecto actualizado.", "ok");
      } else {
        const project = await api("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        els.dialog.close();
        state.currentProject = project;
        await loadProjects();
        showToast("Proyecto creado. Puede gestionar sus carpetas.", "ok");
      }
    } catch (error) {
      els.projectError.hidden = false;
      els.projectError.textContent = error.message;
    } finally {
      els.btnSaveProject.disabled = false;
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

  async function fillRoleSelect(preferredRole) {
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
    if (els.usersDialogHelp) {
      els.usersDialogHelp.textContent =
        roles.length === 1 && roles[0].name === "usuario"
          ? "Solo puede crear cuentas con el rol Usuario."
          : "Puede crear cuentas de super administrador, administrador y usuario.";
    }
  }

  function resetUserForm() {
    state.editingUserId = null;
    els.userForm.reset();
    els.userFormError.hidden = true;
    els.userPassword.required = true;
    els.userPassword.value = "";
    if (els.userPasswordField) els.userPasswordField.hidden = false;
    if (els.userPasswordLabel) els.userPasswordLabel.textContent = "Contraseña";
    els.userRoleSelect.disabled = false;
    if (els.btnCancelUserEdit) els.btnCancelUserEdit.hidden = true;
    els.btnSaveUser.textContent = "Crear usuario";
  }

  async function startEditUser(user) {
    state.editingUserId = user.id;
    els.userFormError.hidden = true;
    await fillRoleSelect({ name: user.role, label: user.role_label });
    els.userFullName.value = user.full_name;
    els.userEmail.value = user.email;
    els.userRoleSelect.value = user.role;
    // Contraseña se cambia con el botón dedicado; al editar no es obligatoria aquí.
    els.userPassword.required = false;
    els.userPassword.value = "";
    if (els.userPasswordField) els.userPasswordField.hidden = true;
    // No puede cambiar su propio rol (backend lo bloquea).
    els.userRoleSelect.disabled = user.id === state.user?.id;
    if (els.btnCancelUserEdit) els.btnCancelUserEdit.hidden = false;
    els.btnSaveUser.textContent = "Guardar cambios";
    els.userFullName.focus();
    els.userForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function openPasswordDialog(user) {
    state.passwordTargetUser = user;
    els.passwordForm.reset();
    els.passwordFormError.hidden = true;
    if (els.passwordDialogHelp) {
      els.passwordDialogHelp.textContent = `Nueva contraseña para ${user.full_name} (${user.role_label}).`;
    }
    els.passwordDialog.showModal();
    els.passwordNew.focus();
  }

  async function loadUsersTable() {
    const users = await api("/api/users");
    els.usersBody.innerHTML = "";
    const countEl = document.getElementById("users-count");
    if (countEl) countEl.textContent = String(users.length);

    if (!users.length) {
      els.usersBody.innerHTML = `<p class="users-list-empty">No hay cuentas para mostrar.</p>`;
      return;
    }

    users.forEach((user) => {
      const row = document.createElement("div");
      row.className = "user-row";
      row.setAttribute("role", "listitem");

      const info = document.createElement("div");
      info.className = "user-row-info";
      info.innerHTML = `
        <div class="user-row-top">
          <strong class="user-row-name">${escapeHtml(user.full_name)}</strong>
          <span class="status-pill ${user.is_active ? "is-active" : "is-inactive"}">${
            user.is_active ? "Activo" : "Inactivo"
          }</span>
        </div>
        <div class="user-row-meta">
          <span class="user-row-email" title="${escapeHtml(user.email)}">${escapeHtml(user.email)}</span>
          <span class="role-badge">${escapeHtml(user.role_label)}</span>
        </div>
      `;

      const actions = document.createElement("div");
      actions.className = "user-row-actions";
      const manageable = canManageTargetUser(user.role);
      const isSelf = user.id === state.user?.id;
      const canEdit = manageable || isSelf;

      if (canEdit) {
        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "btn btn-secondary btn-user-action";
        editBtn.textContent = "Editar";
        editBtn.addEventListener("click", () => {
          startEditUser(user).catch((error) => showToast(error.message, "err"));
        });
        actions.appendChild(editBtn);
      }

      if (manageable) {
        const passwordBtn = document.createElement("button");
        passwordBtn.type = "button";
        passwordBtn.className = "btn btn-secondary btn-user-action";
        passwordBtn.textContent = "Contraseña";
        passwordBtn.addEventListener("click", () => openPasswordDialog(user));
        actions.appendChild(passwordBtn);
      }

      if (!isSelf && manageable) {
        const toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className = `btn btn-user-action ${user.is_active ? "btn-danger" : "btn-secondary"}`;
        toggleBtn.textContent = user.is_active ? "Desactivar" : "Activar";
        toggleBtn.addEventListener("click", async () => {
          try {
            await api(`/api/users/${user.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ is_active: !user.is_active }),
            });
            await loadUsersTable();
            showToast(user.is_active ? "Usuario desactivado." : "Usuario activado.", "ok");
          } catch (error) {
            showToast(error.message, "err");
          }
        });
        actions.appendChild(toggleBtn);
      }

      row.append(info, actions);
      els.usersBody.appendChild(row);
    });
  }

  async function openUsersDialog() {
    if (!canManageUsers()) return;
    resetUserForm();
    await fillRoleSelect();
    await loadUsersTable();
    els.usersDialog.showModal();
  }

  els.btnOpenUsers?.addEventListener("click", () => {
    openUsersDialog().catch((error) => showToast(error.message, "err"));
  });

  els.btnCloseUsers?.addEventListener("click", () => {
    resetUserForm();
    els.usersDialog.close();
  });

  els.btnCancelUserEdit?.addEventListener("click", async () => {
    resetUserForm();
    try {
      await fillRoleSelect();
    } catch (error) {
      showToast(error.message, "err");
    }
  });

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
    if (password.length < 8) {
      els.passwordFormError.hidden = false;
      els.passwordFormError.textContent = "La contraseña debe tener al menos 8 caracteres.";
      return;
    }

    els.btnSavePassword.disabled = true;
    try {
      await api(`/api/users/${target.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      state.passwordTargetUser = null;
      els.passwordDialog.close();
      showToast(`Contraseña actualizada para ${target.full_name}.`, "ok");
    } catch (error) {
      els.passwordFormError.hidden = false;
      els.passwordFormError.textContent = error.message;
    } finally {
      els.btnSavePassword.disabled = false;
    }
  });

  els.userForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    els.userFormError.hidden = true;
    els.btnSaveUser.disabled = true;
    const editingId = state.editingUserId;
    try {
      if (editingId) {
        const payload = {
          full_name: els.userFullName.value.trim(),
          email: els.userEmail.value.trim(),
        };
        if (!els.userRoleSelect.disabled) {
          payload.role = els.userRoleSelect.value;
        }
        await api(`/api/users/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        // Si editó su propio perfil, refrescar cabecera.
        if (editingId === state.user?.id) {
          state.user = await api("/api/auth/me");
          if (els.userName) els.userName.textContent = state.user.full_name;
          if (els.userRole) els.userRole.textContent = state.user.role_label;
        }
        resetUserForm();
        await fillRoleSelect();
        await loadUsersTable();
        showToast("Usuario actualizado.", "ok");
      } else {
        await api("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: els.userFullName.value.trim(),
            email: els.userEmail.value.trim(),
            password: els.userPassword.value,
            role: els.userRoleSelect.value,
            is_active: true,
          }),
        });
        resetUserForm();
        await fillRoleSelect();
        await loadUsersTable();
        showToast("Usuario creado.", "ok");
      }
    } catch (error) {
      els.userFormError.hidden = false;
      els.userFormError.textContent = error.message;
    } finally {
      els.btnSaveUser.disabled = false;
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

  async function boot() {
    try {
      state.user = await api("/api/auth/me");
      showApp();
      await loadProjects();
    } catch {
      showLogin();
    }
  }

  els.docDate.value = todayLabel();
  boot().catch(() => showLogin());
})();

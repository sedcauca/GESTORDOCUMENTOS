import { state, els, PAGE } from "./store.js";
import { showToast, api } from "./api.js";
import { askConfirm } from "./dialogs.js";
import { loadDocuments } from "./documents.js";
import { todayLabel, escapeHtml, pageForIndex, pageWindow, documentPhrase, folderPhrase, fillFolderPager } from "./format.js";
import { makeKebab, renderDirectory, setHeader, showWorkspace, refreshCurrentProject, rememberLocation } from "./projects.js";
import { canWrite, canManageFolders } from "./session.js";
import { refreshTrashCount } from "./trash.js";

export function deleteFolder(folder) {
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
export function confirmRenameFolder(folder) {
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
export function currentFolder() {
  return state.currentProject?.folders.find((item) => item.id === state.currentFolderId) || null;
}
export function openFolderDialog(mode, folder = null) {
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
export function projectFolderPanel(project) {
  const panel = document.createElement("div");
  panel.className = "proj-folders";
  const head = document.createElement("div");
  head.className = "proj-section-head";
  const titles = document.createElement("div");
  titles.className = "proj-section-copy";
  const label = document.createElement("h3");
  label.textContent = "Carpetas";
  const count = document.createElement("p");
  count.textContent = folderPhrase(project.folders?.length || 0);
  titles.append(label, count);
  head.appendChild(titles);
  if (canWrite()) {
    const createBtn = document.createElement("button");
    createBtn.type = "button";
    createBtn.className = "btn btn-primary";
    createBtn.textContent = "Nueva carpeta";
    createBtn.addEventListener("click", () => openFolderDialog("create"));
    head.appendChild(createBtn);
  }
  panel.appendChild(head);
  const folders = project.folders || [];
  if (state.page.folderProjectId !== project.id || state.page.seenFolderId !== state.currentFolderId) {
    state.page.folderProjectId = project.id;
    state.page.seenFolderId = state.currentFolderId;
    const folderIndex = folders.findIndex((folder) => folder.id === state.currentFolderId);
    state.page.carpetas = pageForIndex(folderIndex, PAGE.carpetas);
  }
  const view = pageWindow(folders, state.page.carpetas, PAGE.carpetas);
  state.page.carpetas = view.current;
  if (!folders.length) {
    const empty = document.createElement("p");
    empty.className = "directory-empty";
    empty.textContent = "Este proyecto no tiene carpetas.";
    panel.appendChild(empty);
    return panel;
  }
  const items = document.createElement("div");
  items.className = "proj-folder-grid";
  view.items.forEach((folder) => {
    const item = document.createElement("article");
    const active = state.currentFolderId === folder.id;
    item.className = `proj-folder${active ? " is-active" : ""}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "proj-folder-hit";
    button.setAttribute("aria-selected", active ? "true" : "false");
    const icon = document.createElement("span");
    icon.className = "proj-folder-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2h7.5A2.5 2.5 0 0 1 21 9.5v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-10Z"/></svg>`;
    const copy = document.createElement("span");
    copy.className = "proj-folder-copy";
    const name = document.createElement("strong");
    name.textContent = folder.name;
    const meta = document.createElement("span");
    meta.textContent = documentPhrase(folder.document_count);
    copy.append(name, meta);
    button.append(icon, copy);
    if (active) {
      const badge = document.createElement("span");
      badge.className = "proj-folder-badge";
      badge.textContent = "Seleccionada";
      button.appendChild(badge);
    }
    button.addEventListener("click", () => selectFolder(folder.id));
    item.appendChild(button);
    if (canManageFolders()) {
      item.appendChild(
        makeKebab(`Más acciones de ${folder.name}`, [
          { label: "Editar", onClick: () => confirmRenameFolder(folder) },
          { label: "Eliminar", danger: true, onClick: () => deleteFolder(folder) },
        ])
      );
    }
    items.appendChild(item);
  });
  panel.appendChild(items);
  const pager = document.createElement("nav");
  panel.appendChild(
    fillFolderPager(pager, view, (page) => {
      state.page.carpetas = page;
      renderDirectory();
    })
  );
  return panel;
}
export function renderFolders() {
  if (!els.folderList || !els.folderSection) return;
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
export async function selectFolder(folderId) {
  state.currentFolderId = folderId;
  renderDirectory();
  renderFolders();
  setHeader();
  showWorkspace();
  els.docDate.value = todayLabel();
  await loadDocuments();
  rememberLocation();
}

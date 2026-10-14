import { state, els, TYPE_LABELS } from "./store.js";
import { showToast, api } from "./api.js";
import { formatDateTime, escapeHtml } from "./format.js";
import { refreshCurrentProject, loadProjects } from "./projects.js";
import { canPurgeTrash } from "./session.js";

export async function refreshTrashCount() {
  try {
    const items = await api("/api/trash");
    els.trashCount.textContent = String(items.length);
    return items;
  } catch {
    els.trashCount.textContent = "0";
    return [];
  }
}
export async function openTrashDialog() {
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
export async function restoreTrashItem(item) {
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
export async function purgeTrashItem(item) {
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

import { state, els, box } from "./store.js";
import { showToast, api } from "./api.js";
import { refreshCurrentProject, loadProjects } from "./projects.js";
import { refreshTrashCount } from "./trash.js";

export function askConfirm({ title, message, confirmLabel = "Confirmar", danger = true, subject = null, onConfirm }) {
  box.pendingConfirm = { onConfirm };
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
export async function runPendingConfirm() {
  if (!box.pendingConfirm?.onConfirm) return;
  const { onConfirm } = box.pendingConfirm;
  box.pendingConfirm = null;
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
export function askMoveToTrash(type, id, name, message) {
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

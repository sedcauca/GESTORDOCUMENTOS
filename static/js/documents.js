import { state, els, PAGE } from "./store.js";
import { showToast, api } from "./api.js";
import { askMoveToTrash } from "./dialogs.js";
import { currentFolder } from "./folders.js";
import { todayLabel, formatDateTime, formatBytes, pageWindow, documentPhrase, fillPager } from "./format.js";
import { makeKebab } from "./projects.js";
import { canManageDocs, canManageDocument } from "./session.js";

export function renderDocumentRows() {
  const docs = state.documents;
  const folder = currentFolder();
  els.docsCount.textContent = String(docs.length);
  const countLine = document.getElementById("docs-count-line");
  if (countLine) countLine.textContent = documentPhrase(docs.length);
  if (els.docsTitle) {
    els.docsTitle.textContent = folder ? `Documentos de «${folder.name}»` : "Documentos";
  }
  els.docsBody.innerHTML = "";
  const isEmpty = docs.length === 0;
  els.docsEmpty.hidden = !isEmpty;
  els.docsTableWrap.hidden = isEmpty;
  if (els.btnUploadMore) {
    els.btnUploadMore.hidden = isEmpty || !canManageDocs();
  }
  if (els.btnUploadNewEmpty) {
    els.btnUploadNewEmpty.hidden = !isEmpty || !canManageDocs();
  }
  if (els.docsPager) els.docsPager.hidden = true;
  if (isEmpty) return;

  if (state.page.docsFolderId !== state.currentFolderId) {
    state.page.docsFolderId = state.currentFolderId;
    state.page.documentos = 0;
  }
  const view = pageWindow(docs, state.page.documentos, PAGE.documentos);
  state.page.documentos = view.current;
  view.items.forEach((doc) => {
    const row = document.createElement("tr");
    const values = [
      ["Documento", doc.name],
      ["Archivo", doc.original_filename],
      ["Subido por", doc.uploaded_by_name || "No registrado"],
      ["Fecha", doc.uploaded_at ? formatDateTime(doc.uploaded_at) : "—"],
      ["Tamaño", formatBytes(doc.size_bytes)],
    ];
    values.forEach(([label, value], index) => {
      const cell = document.createElement("td");
      cell.dataset.label = label;
      cell.textContent = value;
      if (index < 2) {
        cell.className = "proj-clip";
        cell.title = value;
      }
      row.appendChild(cell);
    });

    const previewCell = document.createElement("td");
    previewCell.className = "col-preview";
    previewCell.dataset.label = "Vista previa";
    const previewBtn = document.createElement("button");
    previewBtn.type = "button";
    previewBtn.className = "doc-preview-btn";
    previewBtn.setAttribute("aria-label", `Vista previa de ${doc.name}`);
    const previewImg = document.createElement("img");
    previewImg.className = "doc-preview";
    previewImg.alt = `Vista previa de ${doc.name}`;
    previewImg.src = `/api/documents/${doc.id}/preview`;
    previewImg.addEventListener("error", () => {
      previewBtn.disabled = true;
      previewBtn.textContent = "Sin vista";
      previewImg.remove();
    });
    previewBtn.append(previewImg);
    previewBtn.addEventListener("click", () => openPreview(doc));
    previewCell.append(previewBtn);
    row.appendChild(previewCell);

    const actions = document.createElement("td");
    actions.className = "row-actions";
    actions.dataset.label = "Acciones";
    const menuItems = [
      {
        label: "Descargar",
        onClick: () => {
          window.location.href = `/api/documents/${doc.id}/download`;
        },
      },
    ];
    if (canManageDocument(doc)) {
      menuItems.unshift({ label: "Editar", onClick: () => openEditDocument(doc) });
      menuItems.push({
        label: "Enviar a papelera",
        danger: true,
        onClick: () => askMoveToTrash("document", doc.id, doc.name, `«${doc.name}» se moverá a la papelera.`),
      });
    }
    actions.appendChild(makeKebab(`Más acciones de ${doc.name}`, menuItems));
    row.appendChild(actions);
    els.docsBody.appendChild(row);
  });
  if (els.docsPager) {
    fillPager(els.docsPager, "documentos", view, (page) => {
      state.page.documentos = page;
      renderDocumentRows();
    });
  }
}
export async function loadDocuments() {
  if (!state.currentFolderId) return;
  state.documents = await api(`/api/folders/${state.currentFolderId}/documents`);
  renderDocumentRows();
}
export async function openPreview(doc) {
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
export function resetNewFileStatus() {
  els.docNewFile.textContent = "Ningún archivo nuevo seleccionado";
  els.docNewFile.classList.remove("is-ready");
}
export function syncNewFileStatus() {
  const file = els.docFile.files[0];
  if (!file) {
    resetNewFileStatus();
    return;
  }
  els.docNewFile.textContent = `Se reemplazará por: ${file.name}`;
  els.docNewFile.classList.add("is-ready");
}
export function openUploadDialog(isNew = false) {
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
export function openEditDocument(doc) {
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

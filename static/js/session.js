import { state, els, ROLE, ROLE_RANK } from "./store.js";
import { resetDependenciaForm, resetUserForm } from "./accounts.js";
import { renderDirectory } from "./projects.js";

export function canWrite() {
  const role = state.user?.role;
  return role === ROLE.SUPER || role === ROLE.ADMIN;
}
export function canManageProjects() {
  return canWrite();
}
export function canManageFolders() {
  const role = state.user?.role;
  return role === ROLE.SUPER || role === ROLE.ADMIN || role === ROLE.USER;
}
export function canManageUsers() {
  const role = state.user?.role;
  return role === ROLE.SUPER || role === ROLE.ADMIN;
}
export function canManageDocs() {
  const role = state.user?.role;
  return role === ROLE.SUPER || role === ROLE.ADMIN || role === ROLE.USER;
}
export function canUseTrash() {
  return canManageDocs();
}
export function canPurgeTrash() {
  return canWrite();
}
export function canManageDocument() {
  return canManageDocs();
}
export function canManageTargetUser(targetRole) {
  const actorRole = state.user?.role;
  if (!actorRole || !targetRole) return false;
  if (actorRole === ROLE.SUPER) return true;
  return (ROLE_RANK[actorRole] || 0) > (ROLE_RANK[targetRole] || 0);
}
export function applyPermissions() {
  const write = canWrite();
  const manage = canManageUsers();
  const docs = canManageDocs();
  const trash = canUseTrash();
  const projects = canManageProjects();

  if (els.btnNewDependencia) els.btnNewDependencia.hidden = state.user?.role !== ROLE.SUPER;
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
  if (els.btnUploadNewEmpty) els.btnUploadNewEmpty.hidden = true;

  if (state.user) {
    els.userName.textContent = state.user.full_name;
    els.userRole.textContent = state.user.role_label;
    renderDirectory();
  }
}
export function showLogin() {
  state.user = null;
  els.appShell.hidden = true;
  els.loginScreen.hidden = false;
  els.loginError.hidden = true;
  els.loginPassword.value = "";
  els.loginEmail.focus();
}
export function showApp() {
  els.loginScreen.hidden = true;
  els.appShell.hidden = false;
  applyPermissions();
}
export function cancelDependenciaForm() {
  if (state.dependenciaSaving) return;
  resetDependenciaForm();
  els.btnShowDependenciaCreate?.focus();
}
export function cancelUserForm() {
  if (state.userSaving) return;
  resetUserForm();
  document.getElementById("btn-show-user-create")?.focus();
}

"""Servicio unificado de papelera: proyectos, carpetas y documentos."""
import shutil
from datetime import datetime
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.config import TRASH_DIR, UPLOADS_DIR
from app.deps import can_manage_document
from app.models import Document, Folder, Project, User
from app.roles import ROLE_ADMIN, ROLE_SUPER_ADMIN
from app.services import folder_service, project_service
from app.utils import ensure_dir, project_root_name


def _encode_trash_bpin(project_id: int, bpin: str) -> str:
    return f"__papelera_{project_id}__{bpin}"


def _decode_trash_bpin(project_id: int, bpin: str) -> str:
    prefix = f"__papelera_{project_id}__"
    if bpin.startswith(prefix):
        return bpin[len(prefix) :]
    return bpin


def _relocate_project_tree(project: Project, new_root: Path) -> None:
    """Actualiza root_path, carpetas y documentos bajo la nueva raíz."""
    new_root = Path(new_root)
    project.root_path = str(new_root)
    for folder in project.folders:
        folder_name = Path(folder.path).name
        folder.path = str(new_root / folder_name)
        for document in folder.documents:
            document.file_path = str(Path(folder.path) / document.stored_filename)


def _require_document_access(actor: User, document: Document) -> None:
    if not can_manage_document(actor, document):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puede gestionar documentos que usted subió",
        )


def _deleted_by_fields(entity) -> dict:
    deleted_by = getattr(entity, "deleted_by", None)
    return {
        "deleted_by_id": getattr(entity, "deleted_by_id", None),
        "deleted_by_name": deleted_by.full_name if deleted_by else None,
    }


def _guard_project(db: Session, actor: User, project_id: int) -> None:
    project_service.assert_project_visible(db, actor, project_id, include_trashed=True)


def list_trash_items(db: Session, actor: User) -> list[dict]:
    """Super: papelera completa. Administrador: su dependencia. Usuario: lo suyo en proyectos asignados."""
    items: list[dict] = []
    is_super = actor.role_name == ROLE_SUPER_ADMIN
    is_admin = actor.role_name == ROLE_ADMIN

    if is_super or is_admin:
        project_query = (
            db.query(Project)
            .options(joinedload(Project.deleted_by))
            .filter(Project.deleted_at.is_not(None))
        )
        if is_admin:
            project_query = project_query.filter(Project.dependencia_id == actor.dependencia_id)
        for project in project_query.order_by(Project.deleted_at.desc()).all():
            items.append(
                {
                    "type": "project",
                    "id": project.id,
                    "name": project.name,
                    "detail": f"BPIN {_decode_trash_bpin(project.id, project.bpin)}",
                    "deleted_at": project.deleted_at,
                    **_deleted_by_fields(project),
                }
            )

    folders_query = (
        db.query(Folder)
        .options(
            joinedload(Folder.project),
            joinedload(Folder.documents),
            joinedload(Folder.deleted_by),
        )
        .join(Project)
        .filter(Folder.deleted_at.is_not(None), Project.deleted_at.is_(None))
    )
    if is_admin:
        folders_query = folders_query.filter(Project.dependencia_id == actor.dependencia_id)
    elif not is_super:
        folders_query = (
            folders_query.join(Project.members)
            .filter(
                User.id == actor.id,
                Project.dependencia_id == actor.dependencia_id,
                Folder.deleted_by_id == actor.id,
            )
        )

    for folder in folders_query.order_by(Folder.deleted_at.desc()).all():
        active_docs = len([d for d in folder.documents if d.deleted_at is None])
        items.append(
            {
                "type": "folder",
                "id": folder.id,
                "name": folder.name,
                "detail": f"Proyecto «{folder.project.name}» · {active_docs} documento(s)",
                "deleted_at": folder.deleted_at,
                **_deleted_by_fields(folder),
            }
        )

    docs_query = (
        db.query(Document)
        .options(
            joinedload(Document.folder).joinedload(Folder.project),
            joinedload(Document.deleted_by),
        )
        .join(Folder)
        .join(Project)
        .filter(
            Document.deleted_at.is_not(None),
            Folder.deleted_at.is_(None),
            Project.deleted_at.is_(None),
        )
    )
    if is_admin:
        docs_query = docs_query.filter(Project.dependencia_id == actor.dependencia_id)
    elif not is_super:
        docs_query = (
            docs_query.join(Project.members)
            .filter(
                User.id == actor.id,
                Project.dependencia_id == actor.dependencia_id,
                or_(Document.uploaded_by_id == actor.id, Document.deleted_by_id == actor.id),
            )
        )

    for document in docs_query.order_by(Document.deleted_at.desc()).all():
        items.append(
            {
                "type": "document",
                "id": document.id,
                "name": document.name,
                "detail": (
                    f"{document.original_filename} · "
                    f"«{document.folder.project.name}» / «{document.folder.name}»"
                ),
                "deleted_at": document.deleted_at,
                **_deleted_by_fields(document),
            }
        )

    items.sort(key=lambda item: item["deleted_at"] or datetime.min, reverse=True)
    return items


def move_project_to_trash(db: Session, project_id: int, actor: User | None = None) -> Project:
    project = project_service.get_project(db, project_id, include_trashed=False)
    project = (
        db.query(Project)
        .options(joinedload(Project.folders).joinedload(Folder.documents))
        .filter(Project.id == project_id)
        .first()
    )
    old_root = Path(project.root_path)
    trash_path = TRASH_DIR / "projects" / str(project.id)
    ensure_dir(trash_path.parent)

    if trash_path.exists():
        shutil.rmtree(trash_path, ignore_errors=True)

    if old_root.exists():
        shutil.move(str(old_root), str(trash_path))
    else:
        ensure_dir(trash_path)

    _relocate_project_tree(project, trash_path)
    project.bpin = _encode_trash_bpin(project.id, project.display_bpin)
    project.deleted_at = datetime.now()
    project.deleted_by_id = actor.id if actor else None
    db.commit()
    return project_service.get_project(db, project.id, include_trashed=True)


def restore_project(db: Session, project_id: int, actor: User | None = None) -> Project:
    if actor is not None:
        _guard_project(db, actor, project_id)
    project = (
        db.query(Project)
        .options(joinedload(Project.folders).joinedload(Folder.documents))
        .filter(Project.id == project_id)
        .first()
    )
    if not project or project.deleted_at is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proyecto no encontrado en la papelera",
        )

    original_bpin = _decode_trash_bpin(project.id, project.bpin)
    conflict = (
        db.query(Project)
        .filter(
            Project.bpin == original_bpin,
            Project.deleted_at.is_(None),
            Project.id != project.id,
        )
        .first()
    )
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"No se puede restaurar: ya existe un proyecto activo con BPIN {original_bpin}",
        )

    old_root = Path(project.root_path)
    new_root = UPLOADS_DIR / project_root_name(project.name, original_bpin)
    if new_root.exists() and new_root.resolve() != old_root.resolve():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede restaurar: ya existe esa carpeta de proyecto en disco",
        )

    if old_root.exists():
        shutil.move(str(old_root), str(new_root))
    else:
        ensure_dir(new_root)

    _relocate_project_tree(project, new_root)
    project.bpin = original_bpin
    project.deleted_at = None
    project.deleted_by_id = None
    db.commit()
    return project_service.get_project(db, project.id)


def purge_project(db: Session, project_id: int, actor: User | None = None) -> None:
    if actor is not None:
        _guard_project(db, actor, project_id)
    project = (
        db.query(Project)
        .options(joinedload(Project.folders).joinedload(Folder.documents))
        .filter(Project.id == project_id)
        .first()
    )
    if not project or project.deleted_at is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proyecto no encontrado en la papelera",
        )

    root = Path(project.root_path)
    for folder in list(project.folders):
        for document in list(folder.documents):
            db.delete(document)
        db.delete(folder)
    db.delete(project)
    db.commit()

    if root.exists() and root.is_dir():
        shutil.rmtree(root, ignore_errors=True)


def move_document_to_trash(db: Session, document_id: int, actor: User | None = None) -> Document:
    document = (
        db.query(Document)
        .options(joinedload(Document.folder).joinedload(Folder.project))
        .filter(Document.id == document_id, Document.deleted_at.is_(None))
        .first()
    )
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Documento no encontrado")
    if actor is not None:
        _require_document_access(actor, document)
    if document.folder.deleted_at is not None or document.folder.project.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede mover: la carpeta o el proyecto ya están en papelera",
        )

    old_path = Path(document.file_path)
    trash_dir = ensure_dir(TRASH_DIR / "documents" / str(document.id))
    trash_file = trash_dir / document.stored_filename
    if trash_file.exists():
        trash_file.unlink()
    if old_path.is_file():
        shutil.move(str(old_path), str(trash_file))
    document.file_path = str(trash_file)
    document.deleted_at = datetime.now()
    document.deleted_by_id = actor.id if actor else None
    db.commit()
    db.refresh(document)
    return document


def restore_document(db: Session, document_id: int, actor: User | None = None) -> Document:
    document = (
        db.query(Document)
        .options(joinedload(Document.folder).joinedload(Folder.project))
        .filter(Document.id == document_id)
        .first()
    )
    if not document or document.deleted_at is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado en la papelera",
        )
    if actor is not None:
        _require_document_access(actor, document)
        _guard_project(db, actor, document.folder.project_id)
    if document.folder.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Restaure primero la carpeta del documento",
        )
    if document.folder.project.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Restaure primero el proyecto del documento",
        )

    old_path = Path(document.file_path)
    dest_dir = ensure_dir(Path(document.folder.path))
    dest = dest_dir / document.stored_filename
    if old_path.is_file():
        if dest.exists():
            dest.unlink()
        shutil.move(str(old_path), str(dest))
    document.file_path = str(dest)
    document.deleted_at = None
    document.deleted_by_id = None
    db.commit()
    db.refresh(document)
    return document


def purge_document(db: Session, document_id: int, actor: User | None = None) -> None:
    document = (
        db.query(Document)
        .options(joinedload(Document.folder))
        .filter(Document.id == document_id)
        .first()
    )
    if not document or document.deleted_at is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado en la papelera",
        )
    if actor is not None:
        _require_document_access(actor, document)
        _guard_project(db, actor, document.folder.project_id)
    path = Path(document.file_path)
    db.delete(document)
    db.commit()
    if path.is_file():
        path.unlink(missing_ok=True)
    parent = path.parent
    if parent.exists() and parent.is_dir() and not any(parent.iterdir()):
        try:
            parent.rmdir()
        except OSError:
            pass


def restore_folder(db: Session, folder_id: int, actor: User | None = None) -> Folder:
    folder = folder_service.get_folder(db, folder_id, include_trashed=True)
    if actor is not None:
        _guard_project(db, actor, folder.project_id)
    if folder.project.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Restaure primero el proyecto de la carpeta",
        )
    return folder_service.restore_folder(db, folder_id)


move_folder_to_trash = folder_service.move_folder_to_trash


def purge_folder(db: Session, folder_id: int, actor: User | None = None) -> None:
    folder = folder_service.get_folder(db, folder_id, include_trashed=True)
    if actor is not None:
        _guard_project(db, actor, folder.project_id)
    folder_service.purge_folder(db, folder_id)

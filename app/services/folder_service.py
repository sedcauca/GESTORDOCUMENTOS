"""Servicio de carpetas: crear, renombrar, papelera y eliminación definitiva."""
import shutil
from datetime import datetime
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.config import TRASH_DIR
from app.models import Document, Folder, Project, User
from app.services.project_service import get_project
from app.utils import ensure_dir, safe_dirname


def _unique_name_check(
    db: Session,
    project_id: int,
    name: str,
    exclude_id: int | None = None,
) -> None:
    query = db.query(Folder).filter(
        Folder.project_id == project_id,
        Folder.name == name,
        Folder.deleted_at.is_(None),
    )
    if exclude_id is not None:
        query = query.filter(Folder.id != exclude_id)
    if query.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe una carpeta llamada «{name}» en este proyecto",
        )


def _resolve_folder_path(project: Project, folder_name: str, folder_id: int | None = None) -> Path:
    root = Path(project.root_path)
    base = safe_dirname(folder_name)
    candidate = root / base
    if not candidate.exists():
        return candidate
    if folder_id is not None:
        with_id = root / f"{base}_{folder_id}"
        if not with_id.exists() or with_id == candidate:
            return with_id
    counter = 2
    while True:
        alt = root / f"{base}_{counter}"
        if not alt.exists():
            return alt
        counter += 1


def _sync_document_paths(folder: Folder, new_dir: Path) -> None:
    for document in folder.documents:
        if document.deleted_at is not None:
            continue
        document.file_path = str(new_dir / Path(document.file_path).name)


def get_folder(db: Session, folder_id: int, *, include_trashed: bool = False) -> Folder:
    query = (
        db.query(Folder)
        .options(joinedload(Folder.documents), joinedload(Folder.project))
        .filter(Folder.id == folder_id)
    )
    if not include_trashed:
        query = query.filter(Folder.deleted_at.is_(None))
    folder = query.first()
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carpeta no encontrada")
    return folder


def create_folder(db: Session, project_id: int, name: str) -> Folder:
    name = name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de la carpeta es obligatorio",
        )

    project = get_project(db, project_id)
    _unique_name_check(db, project_id, name)

    max_pos = (
        db.query(func.coalesce(func.max(Folder.position), 0))
        .filter(Folder.project_id == project_id, Folder.deleted_at.is_(None))
        .scalar()
    )
    next_pos = int(max_pos) + 1

    folder = Folder(
        project_id=project.id,
        name=name,
        position=next_pos,
        path="",
    )
    db.add(folder)
    db.flush()

    folder_path = ensure_dir(_resolve_folder_path(project, name, folder.id))
    folder.path = str(folder_path)
    db.commit()
    return get_folder(db, folder.id)


def rename_folder(db: Session, folder_id: int, name: str) -> Folder:
    name = name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de la carpeta es obligatorio",
        )

    folder = get_folder(db, folder_id)
    if folder.name == name:
        return folder

    _unique_name_check(db, folder.project_id, name, exclude_id=folder.id)

    old_path = Path(folder.path)
    project = folder.project
    new_path = _resolve_folder_path(project, name, folder.id)

    if new_path.resolve() != old_path.resolve():
        if new_path.exists():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe una carpeta física con ese nombre",
            )
        if old_path.exists():
            old_path.rename(new_path)
        else:
            ensure_dir(new_path)
        _sync_document_paths(folder, new_path)
        folder.path = str(new_path)

    folder.name = name
    db.commit()
    return get_folder(db, folder.id)


def move_folder_to_trash(db: Session, folder_id: int, actor: User | None = None) -> Folder:
    """Mueve la carpeta a la papelera (recuperable)."""
    folder = get_folder(db, folder_id)
    old_path = Path(folder.path)
    parent = ensure_dir(TRASH_DIR / str(folder.project_id))
    trash_path = parent / str(folder.id)

    if trash_path.exists():
        shutil.rmtree(trash_path, ignore_errors=True)

    if old_path.exists():
        shutil.move(str(old_path), str(trash_path))
    else:
        ensure_dir(trash_path)

    _sync_document_paths(folder, trash_path)
    folder.path = str(trash_path)
    folder.deleted_at = datetime.now()
    folder.deleted_by_id = actor.id if actor else None
    db.commit()
    return get_folder(db, folder.id, include_trashed=True)


def list_trashed_folders(db: Session, project_id: int) -> list[Folder]:
    get_project(db, project_id)
    return (
        db.query(Folder)
        .options(joinedload(Folder.documents))
        .filter(Folder.project_id == project_id, Folder.deleted_at.is_not(None))
        .order_by(Folder.deleted_at.desc())
        .all()
    )


def restore_folder(db: Session, folder_id: int) -> Folder:
    folder = get_folder(db, folder_id, include_trashed=True)
    if not folder.is_trashed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La carpeta no está en la papelera",
        )
    if folder.project.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Restaure primero el proyecto de la carpeta",
        )

    _unique_name_check(db, folder.project_id, folder.name, exclude_id=folder.id)

    project = folder.project
    old_path = Path(folder.path)
    new_path = _resolve_folder_path(project, folder.name, folder.id)

    if old_path.exists():
        if new_path.exists():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="No se puede restaurar: ya existe esa carpeta en disco",
            )
        shutil.move(str(old_path), str(new_path))
    else:
        ensure_dir(new_path)

    _sync_document_paths(folder, new_path)
    folder.path = str(new_path)
    folder.deleted_at = None
    folder.deleted_by_id = None
    db.commit()
    return get_folder(db, folder.id)


def purge_folder(db: Session, folder_id: int) -> None:
    """Elimina definitivamente la carpeta y sus archivos."""
    folder = get_folder(db, folder_id, include_trashed=True)
    if folder.deleted_at is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La carpeta debe estar en la papelera para borrarla definitivamente",
        )
    folder_path = Path(folder.path)

    db.query(Document).filter(Document.folder_id == folder_id).delete()
    db.delete(folder)
    db.commit()

    if folder_path.exists() and folder_path.is_dir():
        shutil.rmtree(folder_path, ignore_errors=True)

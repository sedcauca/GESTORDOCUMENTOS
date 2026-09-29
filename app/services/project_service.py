"""Servicio de proyectos."""
import shutil
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.config import DEFAULT_FOLDERS, UPLOADS_DIR
from app.models import Folder, Project
from app.utils import ensure_dir, project_root_name


def list_projects(db: Session) -> list[Project]:
    return (
        db.query(Project)
        .filter(Project.deleted_at.is_(None))
        .order_by(Project.created_at.desc())
        .all()
    )


def get_project(db: Session, project_id: int, *, include_trashed: bool = False) -> Project:
    query = (
        db.query(Project)
        .options(joinedload(Project.folders).joinedload(Folder.documents))
        .filter(Project.id == project_id)
    )
    if not include_trashed:
        query = query.filter(Project.deleted_at.is_(None))
    project = query.first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado")
    # Solo carpetas activas en la navegación principal
    if not include_trashed or project.deleted_at is None:
        project.folders = [folder for folder in project.folders if folder.deleted_at is None]
    return project


def create_project(db: Session, name: str, bpin: str) -> Project:
    name = name.strip()
    bpin = bpin.strip()
    if not name or not bpin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nombre del proyecto y BPIN son obligatorios",
        )

    existing = (
        db.query(Project)
        .filter(Project.bpin == bpin, Project.deleted_at.is_(None))
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un proyecto con el BPIN {bpin}",
        )

    root_name = project_root_name(name, bpin)
    root_path = ensure_dir(UPLOADS_DIR / root_name)

    project = Project(name=name, bpin=bpin, root_path=str(root_path))
    db.add(project)
    db.flush()

    for index, folder_name in enumerate(DEFAULT_FOLDERS, start=1):
        folder_path = ensure_dir(Path(root_path) / folder_name)
        db.add(
            Folder(
                project_id=project.id,
                name=folder_name,
                position=index,
                path=str(folder_path),
            )
        )

    db.commit()
    return get_project(db, project.id)


def update_project(db: Session, project_id: int, name: str, bpin: str) -> Project:
    name = name.strip()
    bpin = bpin.strip()
    if not name or not bpin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nombre del proyecto y BPIN son obligatorios",
        )

    project = (
        db.query(Project)
        .options(joinedload(Project.folders).joinedload(Folder.documents))
        .filter(Project.id == project_id, Project.deleted_at.is_(None))
        .first()
    )
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado")

    if name == project.name and bpin == project.display_bpin:
        return get_project(db, project.id)

    conflict = (
        db.query(Project)
        .filter(
            Project.bpin == bpin,
            Project.deleted_at.is_(None),
            Project.id != project.id,
        )
        .first()
    )
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un proyecto con el BPIN {bpin}",
        )

    old_root = Path(project.root_path)
    new_root = UPLOADS_DIR / project_root_name(name, bpin)

    if old_root.resolve() != new_root.resolve():
        if new_root.exists():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe una carpeta física con ese nombre de proyecto",
            )
        if old_root.exists():
            shutil.move(str(old_root), str(new_root))
        else:
            ensure_dir(new_root)

        for folder in project.folders:
            if folder.deleted_at is not None:
                continue
            old_folder = Path(folder.path)
            try:
                relative = old_folder.relative_to(old_root)
            except ValueError:
                continue
            folder.path = str(new_root / relative)
            for document in folder.documents:
                if document.deleted_at is not None:
                    continue
                document.file_path = str(Path(folder.path) / document.stored_filename)

        project.root_path = str(new_root)

    project.name = name
    project.bpin = bpin
    db.commit()
    return get_project(db, project.id)

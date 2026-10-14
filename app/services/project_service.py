"""Servicio de proyectos."""
import shutil
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.config import DEFAULT_FOLDERS, UPLOADS_DIR
from app.models import Dependencia, Document, Folder, Project, User
from app.roles import ROLE_ADMIN, ROLE_SUPER_ADMIN, ROLE_USER
from app.utils import ensure_dir, project_root_name


def member_ids_of(project: Project) -> list[int]:
    return [user.id for user in (project.members or [])]


def project_dependencia_name(project: Project) -> str | None:
    if project.dependencia_ref is not None:
        return project.dependencia_ref.name
    return None


def _require_dependencia(db: Session, actor: User, dependencia_id: int | None) -> Dependencia:
    if actor.role_name == ROLE_ADMIN:
        if actor.dependencia_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Su cuenta no tiene dependencia. Pida al super administrador que la asigne.",
            )
        dependencia_id = actor.dependencia_id
    if dependencia_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seleccione una dependencia",
        )
    dependencia = db.query(Dependencia).filter(Dependencia.id == dependencia_id).first()
    if dependencia is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dependencia no válida",
        )
    if actor.role_name == ROLE_ADMIN and dependencia.id != actor.dependencia_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puede usar su propia dependencia",
        )
    return dependencia


def assert_project_visible(db: Session, actor: User, project_id: int, *, include_trashed: bool = False) -> None:
    """Super ve todo. Administrador, solo su dependencia. Usuario, solo proyectos asignados de su dependencia."""
    project = (
        db.query(Project.id, Project.dependencia_id, Project.deleted_at)
        .filter(Project.id == project_id)
        .first()
    )
    if project is None or (project.deleted_at is not None and not include_trashed):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado")
    if actor.role_name == ROLE_SUPER_ADMIN:
        return
    if actor.dependencia_id is None or project.dependencia_id != actor.dependencia_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado")
    if actor.role_name == ROLE_ADMIN:
        return
    linked = (
        db.query(Project.id)
        .join(Project.members)
        .filter(Project.id == project_id, User.id == actor.id)
        .first()
    )
    if linked is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado")


def assert_folder_visible(db: Session, actor: User, folder_id: int) -> None:
    folder = db.query(Folder.project_id).filter(Folder.id == folder_id).first()
    if folder is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carpeta no encontrada")
    assert_project_visible(db, actor, folder.project_id)


def assert_document_visible(db: Session, actor: User, document_id: int) -> None:
    document = db.query(Document.folder_id).filter(Document.id == document_id).first()
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Documento no encontrado")
    assert_folder_visible(db, actor, document.folder_id)


def replace_members(db: Session, project: Project, user_ids: list[int]) -> None:
    unique_ids = list(dict.fromkeys(user_ids))
    if not unique_ids:
        project.members = []
        return

    users = (
        db.query(User)
        .options(joinedload(User.role))
        .filter(User.id.in_(unique_ids))
        .all()
    )
    if len(users) != len(unique_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hay usuarios no válidos en la asignación del proyecto",
        )
    if project.dependencia_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El proyecto no tiene dependencia",
        )
    for user in users:
        if not user.is_active or user.role_name != ROLE_USER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo puede asignar usuarios activos con rol Usuario, que son quienes cargan documentos",
            )
        if user.dependencia_id != project.dependencia_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo puede asignar usuarios de la misma dependencia del proyecto",
            )
    project.members = users


def list_projects(db: Session, actor: User) -> list[Project]:
    stmt = (
        select(Project)
        .options(joinedload(Project.members), joinedload(Project.dependencia_ref))
        .where(Project.deleted_at.is_(None))
    )
    if actor.role_name == ROLE_ADMIN:
        stmt = stmt.where(Project.dependencia_id == actor.dependencia_id)
    elif actor.role_name != ROLE_SUPER_ADMIN:
        stmt = (
            stmt.join(Project.members)
            .where(User.id == actor.id, Project.dependencia_id == actor.dependencia_id)
        )
    stmt = stmt.order_by(Project.created_at.desc())
    return list(db.scalars(stmt).unique().all())


def get_project(db: Session, project_id: int, *, include_trashed: bool = False) -> Project:
    query = (
        db.query(Project)
        .options(
            joinedload(Project.folders).joinedload(Folder.documents),
            joinedload(Project.members),
            joinedload(Project.dependencia_ref),
        )
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


def create_project(
    db: Session,
    actor: User,
    name: str,
    bpin: str,
    dependencia_id: int | None = None,
    member_ids: list[int] | None = None,
) -> Project:
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

    dependencia = _require_dependencia(db, actor, dependencia_id)
    project = Project(
        name=name,
        bpin=bpin,
        root_path=str(root_path),
        dependencia_id=dependencia.id,
    )
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

    replace_members(db, project, member_ids or [])
    db.commit()
    return get_project(db, project.id)


def update_project(
    db: Session,
    actor: User,
    project_id: int,
    name: str,
    bpin: str,
    dependencia_id: int | None = None,
    member_ids: list[int] | None = None,
) -> Project:
    name = name.strip()
    bpin = bpin.strip()
    if not name or not bpin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nombre del proyecto y BPIN son obligatorios",
        )

    project = (
        db.query(Project)
        .options(
            joinedload(Project.folders).joinedload(Folder.documents),
            joinedload(Project.members),
            joinedload(Project.dependencia_ref),
        )
        .filter(Project.id == project_id, Project.deleted_at.is_(None))
        .first()
    )
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proyecto no encontrado")

    assert_project_visible(db, actor, project_id)
    chosen_dependencia = project.dependencia_id if dependencia_id is None else dependencia_id
    dependencia = _require_dependencia(db, actor, chosen_dependencia)
    if project.members and any(user.dependencia_id != dependencia.id for user in project.members):
        if member_ids is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Hay usuarios de otra dependencia. Actualice quién carga documentos.",
            )
    project.dependencia_id = dependencia.id

    if name == project.name and bpin == project.display_bpin:
        if member_ids is not None:
            replace_members(db, project, member_ids)
            db.commit()
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
    if member_ids is not None:
        replace_members(db, project, member_ids)
    db.commit()
    return get_project(db, project.id)

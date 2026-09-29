"""Rutas de proyectos."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_roles
from app.models import User
from app.roles import READ_ROLES, WRITE_ROLES
from app.schemas import FolderOut, ProjectCreate, ProjectOut, ProjectSummary, ProjectUpdate
from app.services import project_service, trash_service

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _folder_out(folder) -> FolderOut:
    docs = folder.documents or []
    active = [d for d in docs if getattr(d, "deleted_at", None) is None]
    return FolderOut(
        id=folder.id,
        name=folder.name,
        position=folder.position,
        document_count=len(active),
        deleted_at=folder.deleted_at,
    )


def _project_out(project) -> ProjectOut:
    return ProjectOut(
        id=project.id,
        name=project.name,
        bpin=project.display_bpin if hasattr(project, "display_bpin") else project.bpin,
        created_at=project.created_at,
        folders=[_folder_out(folder) for folder in project.folders],
    )


@router.get("", response_model=list[ProjectSummary])
def list_projects(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(*READ_ROLES)),
):
    projects = project_service.list_projects(db)
    return [
        ProjectSummary(
            id=p.id,
            name=p.name,
            bpin=p.display_bpin,
            created_at=p.created_at,
        )
        for p in projects
    ]


@router.post("", response_model=ProjectOut, status_code=201)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(*WRITE_ROLES)),
):
    project = project_service.create_project(db, payload.name, payload.bpin)
    return _project_out(project)


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(*READ_ROLES)),
):
    project = project_service.get_project(db, project_id)
    return _project_out(project)


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(*WRITE_ROLES)),
):
    project = project_service.update_project(db, project_id, payload.name, payload.bpin)
    return _project_out(project)


@router.delete("/{project_id}", response_model=ProjectOut)
def move_project_to_trash(
    project_id: int,
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(*WRITE_ROLES)),
):
    project = trash_service.move_project_to_trash(db, project_id, actor=actor)
    return _project_out(project)

"""Rutas de proyectos."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_roles
from app.models import User
from app.roles import READ_ROLES, WRITE_ROLES
from app.schemas import ProjectCreate, ProjectOut, ProjectSummary, ProjectUpdate
from app.services import project_service, trash_service
from app.services.presenters import project_out

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("", response_model=list[ProjectSummary])
def list_projects(
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(*READ_ROLES)),
):
    projects = project_service.list_projects(db, actor)
    return [
        ProjectSummary(
            id=p.id,
            name=p.name,
            bpin=p.display_bpin,
            created_at=p.created_at,
            dependencia_id=p.dependencia_id,
            dependencia=project_service.project_dependencia_name(p),
            member_ids=project_service.member_ids_of(p),
        )
        for p in projects
    ]


@router.post("", response_model=ProjectOut, status_code=201)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(*WRITE_ROLES)),
):
    project = project_service.create_project(
        db, actor, payload.name, payload.bpin, payload.dependencia_id, payload.member_ids
    )
    return project_out(project)


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(*READ_ROLES)),
):
    project_service.assert_project_visible(db, actor, project_id)
    project = project_service.get_project(db, project_id)
    return project_out(project)


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(*WRITE_ROLES)),
):
    project = project_service.update_project(
        db,
        actor,
        project_id,
        payload.name,
        payload.bpin,
        payload.dependencia_id,
        payload.member_ids,
    )
    return project_out(project)


@router.delete("/{project_id}", response_model=ProjectOut)
def move_project_to_trash(
    project_id: int,
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(*WRITE_ROLES)),
):
    project_service.assert_project_visible(db, actor, project_id)
    project = trash_service.move_project_to_trash(db, project_id, actor=actor)
    return project_out(project)

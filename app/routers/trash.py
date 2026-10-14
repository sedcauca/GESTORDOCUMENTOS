"""Rutas de la papelera global."""
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_roles
from app.models import User
from app.roles import FOLDER_MGMT_ROLES, PURGE_ROLES, TRASH_ROLES, WRITE_ROLES
from app.schemas import TrashItemOut
from app.services import trash_service

router = APIRouter(prefix="/api/trash", tags=["trash"])


@router.get("", response_model=list[TrashItemOut])
def list_trash(
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(*TRASH_ROLES)),
):
    return trash_service.list_trash_items(db, actor)


@router.post("/projects/{project_id}/restore", status_code=200)
def restore_project(
    project_id: int,
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(*WRITE_ROLES)),
):
    project = trash_service.restore_project(db, project_id, actor=actor)
    return {"id": project.id, "name": project.name, "bpin": project.bpin}


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def purge_project(
    project_id: int,
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(*PURGE_ROLES)),
):
    trash_service.purge_project(db, project_id, actor=actor)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/folders/{folder_id}/restore", status_code=200)
def restore_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(*FOLDER_MGMT_ROLES)),
):
    folder = trash_service.restore_folder(db, folder_id, actor=actor)
    return {"id": folder.id, "name": folder.name}


@router.delete("/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def purge_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(*PURGE_ROLES)),
):
    trash_service.purge_folder(db, folder_id, actor=actor)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/documents/{document_id}/restore", status_code=200)
def restore_document(
    document_id: int,
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(*TRASH_ROLES)),
):
    document = trash_service.restore_document(db, document_id, actor=actor)
    return {"id": document.id, "name": document.name}


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def purge_document(
    document_id: int,
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(*PURGE_ROLES)),
):
    trash_service.purge_document(db, document_id, actor=actor)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

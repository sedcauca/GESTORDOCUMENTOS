"""Rutas de carpetas."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_roles
from app.models import User
from app.roles import FOLDER_MGMT_ROLES, WRITE_ROLES
from app.schemas import FolderCreate, FolderOut, FolderUpdate
from app.services import folder_service, trash_service

router = APIRouter(prefix="/api", tags=["folders"])


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


@router.post("/projects/{project_id}/folders", response_model=FolderOut, status_code=201)
def create_folder(
    project_id: int,
    payload: FolderCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(*WRITE_ROLES)),
):
    folder = folder_service.create_folder(db, project_id, payload.name)
    return _folder_out(folder)


@router.patch("/folders/{folder_id}", response_model=FolderOut)
def rename_folder(
    folder_id: int,
    payload: FolderUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(*FOLDER_MGMT_ROLES)),
):
    folder = folder_service.rename_folder(db, folder_id, payload.name)
    return _folder_out(folder)


@router.delete("/folders/{folder_id}", response_model=FolderOut)
def move_folder_to_trash(
    folder_id: int,
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(*FOLDER_MGMT_ROLES)),
):
    folder = trash_service.move_folder_to_trash(db, folder_id, actor=actor)
    return _folder_out(folder)

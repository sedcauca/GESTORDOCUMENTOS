"""Rutas de documentos."""
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import can_manage_document, require_roles
from app.models import User
from app.roles import DOC_WRITE_ROLES, READ_ROLES
from app.schemas import DocumentOut
from app.services import document_service, trash_service

router = APIRouter(prefix="/api", tags=["documents"])


@router.get("/folders/{folder_id}/documents", response_model=list[DocumentOut])
def list_documents(
    folder_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(*READ_ROLES)),
):
    return document_service.list_documents(db, folder_id)


@router.post("/folders/{folder_id}/documents", response_model=DocumentOut, status_code=201)
async def upload_document(
    folder_id: int,
    nombre: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(*DOC_WRITE_ROLES)),
):
    return await document_service.upload_document(
        db, folder_id, nombre, file, uploaded_by_id=actor.id
    )


@router.get("/documents/{document_id}/pages")
def document_pages(
    document_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(*READ_ROLES)),
):
    document = document_service.get_document(db, document_id)
    return {"pages": document_service.document_page_count(document)}


@router.get("/documents/{document_id}/preview")
def preview_document(
    document_id: int,
    page: int = 1,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(*READ_ROLES)),
):
    document = document_service.get_document(db, document_id)
    path = document_service.ensure_document_preview(document, page)
    return FileResponse(path=path, media_type="image/png")


@router.get("/documents/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(*READ_ROLES)),
):
    document = document_service.get_document(db, document_id)
    path = document_service.resolve_document_file(document)
    return FileResponse(
        path=path,
        media_type="application/pdf",
        filename=document.original_filename,
    )


@router.patch("/documents/{document_id}", response_model=DocumentOut)
async def update_document(
    document_id: int,
    nombre: str = Form(...),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(*DOC_WRITE_ROLES)),
):
    document = document_service.get_document(db, document_id)
    if not can_manage_document(actor, document):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puede editar documentos que usted subió",
        )
    return await document_service.update_document(
        db, document_id, nombre, file, updated_by_id=actor.id
    )


@router.delete("/documents/{document_id}", response_model=DocumentOut)
def move_document_to_trash(
    document_id: int,
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(*DOC_WRITE_ROLES)),
):
    return trash_service.move_document_to_trash(db, document_id, actor=actor)

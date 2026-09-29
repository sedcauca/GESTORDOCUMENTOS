"""Servicio de carga y consulta de documentos PDF."""
import struct
import threading
import uuid
import zlib
from datetime import datetime
from pathlib import Path

import pypdfium2 as pdfium
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session, joinedload

from app.config import (
    ALLOWED_CONTENT_TYPES,
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE_BYTES,
    MAX_FILE_SIZE_MB,
    PREVIEW_DIR,
)
from app.models import Document
from app.services.folder_service import get_folder

# PDFium no admite abrir el mismo archivo en paralelo.
_pdf_lock = threading.Lock()


def _validate_pdf(file: UploadFile) -> None:
    filename = (file.filename or "").strip()
    if not filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Debe seleccionar un archivo")

    extension = Path(filename).suffix.lower()
    content_type = (file.content_type or "").lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se permiten archivos PDF (.pdf)",
        )
    if content_type and content_type not in ALLOWED_CONTENT_TYPES and content_type != "application/octet-stream":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El tipo de archivo no es PDF",
        )


async def upload_document(
    db: Session,
    folder_id: int,
    document_name: str,
    file: UploadFile,
    uploaded_by_id: int | None = None,
) -> Document:
    name = document_name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre del documento es obligatorio",
        )

    _validate_pdf(file)
    folder = get_folder(db, folder_id)
    folder_path = Path(folder.path)
    folder_path.mkdir(parents=True, exist_ok=True)

    original_filename = Path(file.filename or "documento.pdf").name
    stored_filename = f"{uuid.uuid4().hex}.pdf"
    destination = folder_path / stored_filename

    content = await file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El archivo está vacío")
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El archivo supera el tamaño máximo de {MAX_FILE_SIZE_MB} MB",
        )
    if not content.startswith(b"%PDF"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El contenido del archivo no es un PDF válido",
        )

    destination.write_bytes(content)

    document = Document(
        folder_id=folder.id,
        name=name,
        original_filename=original_filename,
        stored_filename=stored_filename,
        file_path=str(destination),
        uploaded_at=datetime.now(),
        size_bytes=len(content),
        uploaded_by_id=uploaded_by_id,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def list_documents(db: Session, folder_id: int) -> list[Document]:
    get_folder(db, folder_id)
    return (
        db.query(Document)
        .options(joinedload(Document.uploaded_by), joinedload(Document.updated_by))
        .filter(Document.folder_id == folder_id, Document.deleted_at.is_(None))
        .order_by(Document.uploaded_at.desc())
        .all()
    )


def get_document(db: Session, document_id: int, *, include_trashed: bool = False) -> Document:
    query = (
        db.query(Document)
        .options(joinedload(Document.uploaded_by), joinedload(Document.updated_by))
        .filter(Document.id == document_id)
    )
    if not include_trashed:
        query = query.filter(Document.deleted_at.is_(None))
    document = query.first()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Documento no encontrado")
    return document


def resolve_document_file(document: Document) -> Path:
    path = Path(document.file_path)
    if not path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El archivo físico no se encuentra en el servidor",
        )
    return path


def _png_chunk(tag: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + tag
        + data
        + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    )


def _save_bgr_png(path: Path, width: int, height: int, buffer, stride: int) -> None:
    rows = bytearray()
    for y in range(height):
        row = buffer[y * stride : y * stride + width * 3]
        rgb = bytearray(width * 3)
        for i in range(width):
            rgb[i * 3] = row[i * 3 + 2]
            rgb[i * 3 + 1] = row[i * 3 + 1]
            rgb[i * 3 + 2] = row[i * 3]
        rows.append(0)
        rows.extend(rgb)
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + _png_chunk(b"IHDR", ihdr)
        + _png_chunk(b"IDAT", zlib.compress(bytes(rows), 6))
        + _png_chunk(b"IEND", b"")
    )
    path.write_bytes(png)


def _open_pdf(source: Path):
    try:
        return pdfium.PdfDocument(source.read_bytes())
    except pdfium.PdfiumError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No se pudo leer el PDF. El archivo puede estar dañado.",
        ) from error


def document_page_count(document: Document) -> int:
    source = resolve_document_file(document)
    with _pdf_lock:
        pdf = _open_pdf(source)
        try:
            return len(pdf)
        finally:
            pdf.close()


def ensure_document_preview(document: Document, page: int = 1) -> Path:
    source = resolve_document_file(document)
    if page < 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La página no es válida")

    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    dest = PREVIEW_DIR / f"{document.id}-{page}-lg.png"
    if dest.is_file() and dest.stat().st_mtime >= source.stat().st_mtime:
        return dest

    with _pdf_lock:
        if dest.is_file() and dest.stat().st_mtime >= source.stat().st_mtime:
            return dest
        pdf = _open_pdf(source)
        try:
            total = len(pdf)
            if total < 1:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="El PDF no tiene páginas",
                )
            if page > total:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Esa página no existe en el PDF")
            pdf_page = pdf[page - 1]
            width, _height = pdf_page.get_size()
            scale = 1600 / width if width else 1
            scale = min(max(scale, 0.8), 3)
            bitmap = pdf_page.render(scale=scale)
            _save_bgr_png(dest, bitmap.width, bitmap.height, bitmap.buffer, bitmap.stride)
        finally:
            pdf.close()
    return dest


async def update_document(
    db: Session,
    document_id: int,
    document_name: str,
    file: UploadFile | None = None,
    updated_by_id: int | None = None,
) -> Document:
    document = get_document(db, document_id)
    name = document_name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre del documento es obligatorio",
        )

    document.name = name

    has_new_file = (
        file is not None
        and bool((file.filename or "").strip())
        and (file.filename or "").lower() != "undefined"
    )

    if has_new_file:
        _validate_pdf(file)
        content = await file.read()
        if not content:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El archivo está vacío")
        if len(content) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El archivo supera el tamaño máximo de {MAX_FILE_SIZE_MB} MB",
            )
        if not content.startswith(b"%PDF"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El contenido del archivo no es un PDF válido",
            )

        folder = get_folder(db, document.folder_id)
        folder_path = Path(folder.path)
        folder_path.mkdir(parents=True, exist_ok=True)

        old_path = Path(document.file_path)
        stored_filename = f"{uuid.uuid4().hex}.pdf"
        destination = folder_path / stored_filename
        destination.write_bytes(content)

        document.original_filename = Path(file.filename or "documento.pdf").name
        document.stored_filename = stored_filename
        document.file_path = str(destination)
        document.size_bytes = len(content)

        if old_path.is_file() and old_path.resolve() != destination.resolve():
            old_path.unlink(missing_ok=True)

    document.updated_at = datetime.now()
    document.updated_by_id = updated_by_id

    saved_id = document.id
    db.commit()
    return get_document(db, saved_id)

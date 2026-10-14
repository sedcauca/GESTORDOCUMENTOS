"""Armado de respuestas de proyecto y carpeta."""
from app.schemas import FolderOut, ProjectOut
from app.services import project_service


def folder_out(folder) -> FolderOut:
    docs = folder.documents or []
    active = [doc for doc in docs if getattr(doc, "deleted_at", None) is None]
    return FolderOut(
        id=folder.id,
        name=folder.name,
        position=folder.position,
        document_count=len(active),
        deleted_at=folder.deleted_at,
    )


def project_out(project) -> ProjectOut:
    return ProjectOut(
        id=project.id,
        name=project.name,
        bpin=project.display_bpin if hasattr(project, "display_bpin") else project.bpin,
        created_at=project.created_at,
        dependencia_id=project.dependencia_id,
        dependencia=project_service.project_dependencia_name(project),
        member_ids=project_service.member_ids_of(project),
        folders=[folder_out(folder) for folder in project.folders],
    )

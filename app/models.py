"""Modelos SQLite: usuarios, roles, proyectos, carpetas y documentos."""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    users: Mapped[list["User"]] = relationship(back_populates="role")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.now, onupdate=datetime.now
    )

    role: Mapped["Role"] = relationship(back_populates="users")

    @property
    def role_name(self) -> str:
        return self.role.name if self.role else ""


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    bpin: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    root_path: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, default=None)
    deleted_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True, default=None, index=True
    )

    folders: Mapped[list["Folder"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="Folder.position",
    )
    deleted_by: Mapped["User | None"] = relationship("User", foreign_keys=[deleted_by_id])

    @property
    def is_trashed(self) -> bool:
        return self.deleted_at is not None

    @property
    def display_bpin(self) -> str:
        prefix = f"__papelera_{self.id}__"
        if self.bpin.startswith(prefix):
            return self.bpin[len(prefix) :]
        return self.bpin


class Folder(Base):
    __tablename__ = "folders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0)
    path: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, default=None)
    deleted_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True, default=None, index=True
    )

    project: Mapped["Project"] = relationship(back_populates="folders")
    deleted_by: Mapped["User | None"] = relationship("User", foreign_keys=[deleted_by_id])
    documents: Mapped[list["Document"]] = relationship(
        back_populates="folder",
        cascade="all, delete-orphan",
        order_by="Document.uploaded_at.desc()",
    )

    @property
    def is_trashed(self) -> bool:
        return self.deleted_at is not None

    @property
    def active_documents(self) -> list["Document"]:
        return [doc for doc in self.documents if doc.deleted_at is None]


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    folder_id: Mapped[int] = mapped_column(ForeignKey("folders.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(300), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(300), nullable=False)
    file_path: Mapped[str] = mapped_column(String(700), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, default=None)
    uploaded_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True, default=None, index=True
    )
    updated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, default=None)
    updated_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True, default=None, index=True
    )
    deleted_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True, default=None, index=True
    )

    folder: Mapped["Folder"] = relationship(back_populates="documents")
    uploaded_by: Mapped["User | None"] = relationship(
        "User", foreign_keys=[uploaded_by_id]
    )
    updated_by: Mapped["User | None"] = relationship(
        "User", foreign_keys=[updated_by_id]
    )
    deleted_by: Mapped["User | None"] = relationship(
        "User", foreign_keys=[deleted_by_id]
    )

    @property
    def uploaded_by_name(self) -> str | None:
        return self.uploaded_by.full_name if self.uploaded_by else None

    @property
    def updated_by_name(self) -> str | None:
        return self.updated_by.full_name if self.updated_by else None

    @property
    def is_trashed(self) -> bool:
        return self.deleted_at is not None

"""Esquemas Pydantic de entrada/salida."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


def _normalize_email(value: str) -> str:
    email = value.lower().strip()
    if "@" not in email or "." not in email.split("@", 1)[-1]:
        raise ValueError("Correo no válido")
    local, domain = email.rsplit("@", 1)
    if not local or not domain or " " in email:
        raise ValueError("Correo no válido")
    return email


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=1)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return _normalize_email(value)


class RoleOut(BaseModel):
    id: int
    name: str
    description: str | None = None
    label: str

    model_config = {"from_attributes": True}


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    role_label: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=200)
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field(..., min_length=1, max_length=50)
    is_active: bool = True

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return _normalize_email(value)


class UserUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=1, max_length=200)
    email: str | None = Field(None, min_length=3, max_length=255)
    password: str | None = Field(None, min_length=8, max_length=128)
    role: str | None = Field(None, min_length=1, max_length=50)
    is_active: bool | None = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return _normalize_email(value)


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    bpin: str = Field(..., min_length=1, max_length=50)


class ProjectUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    bpin: str = Field(..., min_length=1, max_length=50)


class FolderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)


class FolderUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)


class FolderOut(BaseModel):
    id: int
    name: str
    position: int
    document_count: int = 0
    deleted_at: datetime | None = None

    model_config = {"from_attributes": True}


class ProjectOut(BaseModel):
    id: int
    name: str
    bpin: str
    created_at: datetime
    folders: list[FolderOut] = []

    model_config = {"from_attributes": True}


class ProjectSummary(BaseModel):
    id: int
    name: str
    bpin: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentOut(BaseModel):
    id: int
    name: str
    original_filename: str
    uploaded_at: datetime
    size_bytes: int
    deleted_at: datetime | None = None
    uploaded_by_id: int | None = None
    uploaded_by_name: str | None = None
    updated_at: datetime | None = None
    updated_by_id: int | None = None
    updated_by_name: str | None = None

    model_config = {"from_attributes": True}


class TrashItemOut(BaseModel):
    type: Literal["project", "folder", "document"]
    id: int
    name: str
    detail: str
    deleted_at: datetime
    deleted_by_id: int | None = None
    deleted_by_name: str | None = None

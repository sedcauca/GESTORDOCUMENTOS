"""Errores de negocio que la API ya devuelve al cliente."""
from fastapi import HTTPException


def abort(status_code: int, detail: str, headers: dict[str, str] | None = None) -> None:
    raise HTTPException(status_code=status_code, detail=detail, headers=headers)

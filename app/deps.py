"""Dependencias de autenticación y autorización por rol."""
from collections.abc import Callable

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session, joinedload

from app import config
from app.database import get_db
from app.models import User
from app.roles import ROLE_RANK
from app.security import TokenError, parse_token

bearer_scheme = HTTPBearer(auto_error=False)


def _extract_token(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None,
) -> str | None:
    cookie_token = request.cookies.get(config.COOKIE_NAME)
    if cookie_token:
        return cookie_token
    if credentials and credentials.credentials:
        return credentials.credentials
    return None


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = _extract_token(request, credentials)
    try:
        payload = parse_token(token)
    except TokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        )

    user = (
        db.query(User)
        .options(joinedload(User.role), joinedload(User.dependencia_ref))
        .filter(User.id == int(user_id))
        .first()
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo",
        )
    return user


def require_roles(*allowed: str) -> Callable:
    allowed_set = set(allowed)

    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role_name not in allowed_set:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tiene permisos para esta acción",
            )
        return user

    return dependency


def role_rank(role_name: str) -> int:
    return ROLE_RANK.get(role_name, 0)


def can_manage_target(actor: User, target_role: str) -> bool:
    """Un actor solo puede gestionar roles de rango estrictamente inferior al suyo,
    salvo el super administrador, que puede gestionar cualquier rol."""
    from app.roles import ROLE_SUPER_ADMIN

    if actor.role_name == ROLE_SUPER_ADMIN:
        return True
    return role_rank(actor.role_name) > role_rank(target_role)


def is_full_writer(actor: User) -> bool:
    from app.roles import WRITE_ROLES

    return actor.role_name in WRITE_ROLES


def can_manage_document(actor: User, document) -> bool:
    """Admin, super administrador y usuario pueden editar y mover a papelera cualquier documento."""
    from app.roles import DOC_WRITE_ROLES

    return actor.role_name in DOC_WRITE_ROLES

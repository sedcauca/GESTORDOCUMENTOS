"""CRUD de usuarios (solo administradores)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_roles
from app.models import User
from app.roles import ROLE_LABELS, USER_MGMT_ROLES
from app.schemas import RoleOut, UserCreate, UserOut, UserUpdate
from app.services import auth_service

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(*USER_MGMT_ROLES)),
):
    return [auth_service.user_to_out(u) for u in auth_service.list_users(db)]


@router.get("/roles", response_model=list[RoleOut])
def list_roles(
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(*USER_MGMT_ROLES)),
):
    allowed = set(auth_service.assignable_roles_for(actor))
    roles = []
    for role in auth_service.list_roles(db):
        if role.name not in allowed:
            continue
        roles.append(
            RoleOut(
                id=role.id,
                name=role.name,
                description=role.description,
                label=ROLE_LABELS.get(role.name, role.name),
            )
        )
    return roles


@router.post("", response_model=UserOut, status_code=201)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(*USER_MGMT_ROLES)),
):
    user = auth_service.create_user(db, actor, payload)
    return auth_service.user_to_out(user)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    actor: User = Depends(require_roles(*USER_MGMT_ROLES)),
):
    user = auth_service.update_user(db, actor, user_id, payload)
    return auth_service.user_to_out(user)

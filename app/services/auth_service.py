"""Servicio de autenticación y usuarios."""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models import Role, User
from app.roles import ROLE_LABELS, ROLE_SUPER_ADMIN
from app.schemas import UserCreate, UserOut, UserUpdate
from app.security import create_access_token, hash_password, verify_password
from app.deps import can_manage_target


def user_to_out(user: User) -> UserOut:
    role_name = user.role_name
    return UserOut(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=role_name,
        role_label=ROLE_LABELS.get(role_name, role_name),
        is_active=user.is_active,
        created_at=user.created_at,
    )


def authenticate(db: Session, email: str, password: str) -> tuple[User, str]:
    user = (
        db.query(User)
        .options(joinedload(User.role))
        .filter(User.email == email.lower().strip())
        .first()
    )
    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo",
        )
    token = create_access_token(
        user_id=user.id,
        email=user.email,
        role=user.role_name,
    )
    return user, token


def list_roles(db: Session) -> list[Role]:
    return db.query(Role).order_by(Role.id).all()


def list_users(db: Session) -> list[User]:
    return (
        db.query(User)
        .options(joinedload(User.role))
        .order_by(User.full_name)
        .all()
    )


def _get_role_or_404(db: Session, role_name: str) -> Role:
    role = db.query(Role).filter(Role.name == role_name).first()
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rol no válido",
        )
    return role


def create_user(db: Session, actor: User, payload: UserCreate) -> User:
    if payload.role not in assignable_roles_for(actor):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puede asignar ese rol",
        )

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo ya está registrado",
        )

    role = _get_role_or_404(db, payload.role)
    user = User(
        full_name=payload.full_name.strip(),
        email=payload.email,
        password_hash=hash_password(payload.password),
        role_id=role.id,
        is_active=payload.is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    user = (
        db.query(User)
        .options(joinedload(User.role))
        .filter(User.id == user.id)
        .first()
    )
    return user


def update_user(db: Session, actor: User, user_id: int, payload: UserUpdate) -> User:
    target = (
        db.query(User)
        .options(joinedload(User.role))
        .filter(User.id == user_id)
        .first()
    )
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    if not can_manage_target(actor, target.role_name) and actor.id != target.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puede modificar este usuario",
        )

    # Solo el propio usuario o alguien con rango superior puede tocar datos básicos;
    # cambiar rol/activo requiere poder de gestión.
    data = payload.model_dump(exclude_unset=True)

    if "role" in data or "is_active" in data:
        new_role = data.get("role", target.role_name)
        if "role" in data and data["role"] not in assignable_roles_for(actor):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puede asignar ese rol",
            )
        if not can_manage_target(actor, target.role_name) or not can_manage_target(actor, new_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puede cambiar el rol o el estado de este usuario",
            )
        if actor.id == target.id and "role" in data and data["role"] != target.role_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puede cambiar su propio rol",
            )
        if actor.id == target.id and data.get("is_active") is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No puede desactivarse a sí mismo",
            )

    if "email" in data and data["email"] != target.email:
        clash = db.query(User).filter(User.email == data["email"], User.id != target.id).first()
        if clash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo ya está registrado",
            )
        target.email = data["email"]

    if "full_name" in data:
        target.full_name = data["full_name"].strip()

    if "password" in data and data["password"]:
        # Solo quien puede gestionar al usuario (super → todos los roles) puede
        # cambiar contraseñas ajenas; uno mismo también puede actualizar la suya.
        if actor.id != target.id and not can_manage_target(actor, target.role_name):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puede actualizar la contraseña de este usuario",
            )
        target.password_hash = hash_password(data["password"])

    if "role" in data and data["role"]:
        role = _get_role_or_404(db, data["role"])
        target.role_id = role.id

    if "is_active" in data and data["is_active"] is not None:
        # Impedir dejar el sistema sin super administradores activos
        if (
            target.role_name == ROLE_SUPER_ADMIN
            and data["is_active"] is False
        ):
            active_supers = (
                db.query(User)
                .join(Role)
                .filter(Role.name == ROLE_SUPER_ADMIN, User.is_active.is_(True), User.id != target.id)
                .count()
            )
            if active_supers == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Debe existir al menos un super administrador activo",
                )
        target.is_active = data["is_active"]

    db.commit()
    return (
        db.query(User)
        .options(joinedload(User.role))
        .filter(User.id == user_id)
        .first()
    )


def assignable_roles_for(actor: User) -> list[str]:
    """Roles que el actor puede asignar al crear/editar usuarios."""
    from app.roles import ROLE_ADMIN, ROLE_SUPER_ADMIN, ROLE_USER

    if actor.role_name == ROLE_SUPER_ADMIN:
        return [ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_USER]
    if actor.role_name == ROLE_ADMIN:
        return [ROLE_USER]
    return []

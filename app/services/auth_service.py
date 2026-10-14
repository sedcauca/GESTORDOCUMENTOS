"""Servicio de autenticación y usuarios."""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models import Dependencia, Project, Role, User
from app.roles import ROLE_ADMIN, ROLE_LABELS, ROLE_SUPER_ADMIN, ROLE_USER
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
        dependencia_id=user.dependencia_id,
        dependencia=user.dependencia_name,
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


def list_users(db: Session, actor: User) -> list[User]:
    query = (
        db.query(User)
        .options(joinedload(User.role), joinedload(User.dependencia_ref))
        .order_by(User.full_name)
    )
    if actor.role_name == ROLE_ADMIN:
        query = query.filter(User.dependencia_id == actor.dependencia_id)
    return query.all()


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
    _assign_dependencia(db, actor, user, payload.role, payload.dependencia_id)
    db.add(user)
    db.commit()
    db.refresh(user)
    user = (
        db.query(User)
        .options(joinedload(User.role), joinedload(User.dependencia_ref))
        .filter(User.id == user.id)
        .first()
    )
    return user


def update_user(db: Session, actor: User, user_id: int, payload: UserUpdate) -> User:
    target = (
        db.query(User)
        .options(joinedload(User.role), joinedload(User.dependencia_ref))
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
    if actor.role_name == ROLE_ADMIN and target.dependencia_id != actor.dependencia_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puede modificar un usuario de otra dependencia",
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

    if "dependencia_id" in data or "role" in data:
        next_role = data.get("role", target.role_name)
        next_dep = data["dependencia_id"] if "dependencia_id" in data else target.dependencia_id
        _assign_dependencia(db, actor, target, next_role, next_dep)

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
        .options(joinedload(User.role), joinedload(User.dependencia_ref))
        .filter(User.id == user_id)
        .first()
    )


def list_dependencias(db: Session, actor: User) -> list[Dependencia]:
    query = db.query(Dependencia).order_by(Dependencia.name)
    if actor.role_name == ROLE_SUPER_ADMIN:
        return query.all()
    if actor.role_name == ROLE_ADMIN:
        if actor.dependencia_id is None:
            return []
        return query.filter(Dependencia.id == actor.dependencia_id).all()
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="No tiene permisos para consultar dependencias",
    )


def create_dependencia(db: Session, actor: User, name: str) -> Dependencia:
    if actor.role_name != ROLE_SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo el super administrador puede crear dependencias",
        )
    cleaned = name.strip()
    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de la dependencia es obligatorio",
        )
    existing = db.query(Dependencia).filter(Dependencia.name.ilike(cleaned)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una dependencia con ese nombre",
        )
    row = Dependencia(name=cleaned)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _dependencia_or_404(db: Session, dependencia_id: int) -> Dependencia:
    row = db.query(Dependencia).filter(Dependencia.id == dependencia_id).first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dependencia no encontrada")
    return row


def _require_super(actor: User, action: str) -> None:
    if actor.role_name != ROLE_SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Solo el super administrador puede {action} dependencias",
        )


def update_dependencia(db: Session, actor: User, dependencia_id: int, name: str) -> Dependencia:
    _require_super(actor, "editar")
    row = _dependencia_or_404(db, dependencia_id)
    cleaned = name.strip()
    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de la dependencia es obligatorio",
        )
    clash = (
        db.query(Dependencia)
        .filter(Dependencia.name.ilike(cleaned), Dependencia.id != row.id)
        .first()
    )
    if clash:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una dependencia con ese nombre",
        )
    row.name = cleaned
    db.query(User).filter(User.dependencia_id == row.id).update(
        {User.dependencia: cleaned},
        synchronize_session=False,
    )
    db.commit()
    db.refresh(row)
    return row


def delete_dependencia(db: Session, actor: User, dependencia_id: int) -> None:
    _require_super(actor, "eliminar")
    row = _dependencia_or_404(db, dependencia_id)
    users = db.query(User).filter(User.dependencia_id == row.id).count()
    projects = db.query(Project).filter(Project.dependencia_id == row.id).count()
    if users or projects:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede eliminar: tiene usuarios o proyectos relacionados",
        )
    db.delete(row)
    db.commit()


def _assign_dependencia(
    db: Session,
    actor: User,
    target: User,
    role_name: str,
    dependencia_id: int | None,
) -> None:
    """El super administrador asigna la dependencia. El administrador solo usa la suya."""
    if actor.role_name == ROLE_ADMIN:
        if actor.dependencia_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Su cuenta no tiene dependencia. Pida al super administrador que la asigne.",
            )
        dependencia_id = actor.dependencia_id

    if role_name == ROLE_SUPER_ADMIN and actor.role_name == ROLE_SUPER_ADMIN and dependencia_id is None:
        target.dependencia_id = None
        target.dependencia = None
        return

    if role_name in (ROLE_ADMIN, ROLE_USER) and dependencia_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seleccione una dependencia",
        )

    if dependencia_id is None:
        target.dependencia_id = None
        target.dependencia = None
        return

    dependencia = db.query(Dependencia).filter(Dependencia.id == dependencia_id).first()
    if dependencia is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dependencia no válida",
        )
    if actor.role_name == ROLE_ADMIN and dependencia.id != actor.dependencia_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puede asignar su propia dependencia",
        )
    target.dependencia_id = dependencia.id
    target.dependencia = dependencia.name


def assignable_roles_for(actor: User) -> list[str]:
    """Roles que el actor puede asignar al crear/editar usuarios."""

    if actor.role_name == ROLE_SUPER_ADMIN:
        return [ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_USER]
    if actor.role_name == ROLE_ADMIN:
        return [ROLE_USER]
    return []

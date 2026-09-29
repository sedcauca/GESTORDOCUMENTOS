"""Semilla de roles y super administrador inicial."""
import logging

from sqlalchemy.orm import Session, joinedload

from app import config
from app.models import Role, User
from app.roles import (
    ROLE_ADMIN,
    ROLE_DESCRIPTIONS,
    ROLE_SUPER_ADMIN,
    ROLE_USER,
)
from app.security import hash_password

logger = logging.getLogger(__name__)

DEFAULT_ROLES = (
    (ROLE_SUPER_ADMIN, ROLE_DESCRIPTIONS[ROLE_SUPER_ADMIN]),
    (ROLE_ADMIN, ROLE_DESCRIPTIONS[ROLE_ADMIN]),
    (ROLE_USER, ROLE_DESCRIPTIONS[ROLE_USER]),
)


def seed_roles_and_admin(db: Session) -> None:
    for name, description in DEFAULT_ROLES:
        role = db.query(Role).filter(Role.name == name).first()
        if role is None:
            db.add(Role(name=name, description=description))
        else:
            role.description = description
    db.commit()

    if not config.ADMIN_PASSWORD:
        logger.warning("ADMIN_PASSWORD no definido: no se crea el super administrador inicial")
        return

    existing = (
        db.query(User)
        .options(joinedload(User.role))
        .filter(User.email == config.ADMIN_EMAIL.lower())
        .first()
    )
    if existing:
        return

    super_role = db.query(Role).filter(Role.name == ROLE_SUPER_ADMIN).first()
    if super_role is None:
        logger.error("Rol super_administrador no encontrado tras el seed")
        return

    db.add(
        User(
            full_name=config.ADMIN_NAME,
            email=config.ADMIN_EMAIL.lower().strip(),
            password_hash=hash_password(config.ADMIN_PASSWORD),
            role_id=super_role.id,
            is_active=True,
        )
    )
    db.commit()
    logger.info("Super administrador inicial creado: %s", config.ADMIN_EMAIL)

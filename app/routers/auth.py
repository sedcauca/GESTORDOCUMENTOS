"""Rutas de autenticación."""
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app import config
from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import LoginRequest, UserOut
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=config.COOKIE_NAME,
        value=token,
        httponly=True,
        secure=config.COOKIE_SECURE,
        samesite=config.COOKIE_SAMESITE,
        max_age=config.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )


@router.post("/login", response_model=UserOut)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    user, token = auth_service.authenticate(db, payload.email, payload.password)
    _set_auth_cookie(response, token)
    return auth_service.user_to_out(user)


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key=config.COOKIE_NAME,
        path="/",
        secure=config.COOKIE_SECURE,
        samesite=config.COOKIE_SAMESITE,
    )
    return {"ok": True}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return auth_service.user_to_out(user)

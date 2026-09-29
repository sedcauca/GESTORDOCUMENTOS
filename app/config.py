"""Configuración de la aplicación."""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = BASE_DIR / "uploads"
TRASH_DIR = UPLOADS_DIR / ".trash"
PREVIEW_DIR = DATA_DIR / "previews"
DATABASE_URL = f"sqlite:///{DATA_DIR / 'documentos.db'}"

# Carpetas creadas automáticamente al registrar un proyecto
DEFAULT_FOLDERS = [
    "Carpeta 1",
    "Carpeta 2",
    "Carpeta 3",
    "Carpeta 4",
    "Carpeta 5",
    "Carpeta 6",
    "Carpeta 7",
    "Carpeta 8",
]

MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "50"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"application/pdf"}
ALLOWED_EXTENSIONS = {".pdf"}

# Auth / JWT
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-cambiar-en-produccion")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
COOKIE_NAME = os.getenv("COOKIE_NAME", "gdp_access_token")
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() in ("1", "true", "yes")
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax")
JWT_ALGORITHM = "HS256"

# Seed del primer super administrador
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@local.test")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
ADMIN_NAME = os.getenv("ADMIN_NAME", "Super administrador")

LOGIN_MAX_ATTEMPTS = int(os.getenv("LOGIN_MAX_ATTEMPTS", "5"))
LOGIN_LOCKOUT_MINUTES = int(os.getenv("LOGIN_LOCKOUT_MINUTES", "15"))

DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
TRASH_DIR.mkdir(parents=True, exist_ok=True)
PREVIEW_DIR.mkdir(parents=True, exist_ok=True)

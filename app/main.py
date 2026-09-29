"""Punto de entrada FastAPI."""
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import BASE_DIR
from app.database import SessionLocal, init_db
from app.routers import auth, documents, folders, projects, trash, users
from app.seed import seed_roles_and_admin

app = FastAPI(
    title="Gestor de Documentos de Proyectos",
    description="Carga y gestión documental local con roles",
    version="1.1.0",
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(folders.router)
app.include_router(documents.router)
app.include_router(trash.router)

static_dir = BASE_DIR / "static"
templates_dir = BASE_DIR / "templates"
app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    db = SessionLocal()
    try:
        seed_roles_and_admin(db)
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/")
def index():
    return FileResponse(templates_dir / "index.html")

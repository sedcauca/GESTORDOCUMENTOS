"""Conexión y sesión de SQLite."""
from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _table_columns(conn, table: str) -> set[str]:
    return {row[1] for row in conn.execute(text(f"PRAGMA table_info({table})")).fetchall()}


def _migrate_schema() -> None:
    """Añade columnas y ajusta restricciones sin perder datos."""
    with engine.begin() as conn:
        tables = {
            row[0]
            for row in conn.execute(
                text("SELECT name FROM sqlite_master WHERE type='table'")
            ).fetchall()
        }

        if "projects" in tables:
            cols = _table_columns(conn, "projects")
            if "deleted_at" not in cols:
                conn.execute(text("ALTER TABLE projects ADD COLUMN deleted_at DATETIME"))
            if "deleted_by_id" not in cols:
                conn.execute(text("ALTER TABLE projects ADD COLUMN deleted_by_id INTEGER"))

        if "folders" in tables:
            cols = _table_columns(conn, "folders")
            if "deleted_at" not in cols:
                conn.execute(text("ALTER TABLE folders ADD COLUMN deleted_at DATETIME"))
            if "deleted_by_id" not in cols:
                conn.execute(text("ALTER TABLE folders ADD COLUMN deleted_by_id INTEGER"))

            create_sql = conn.execute(
                text("SELECT sql FROM sqlite_master WHERE type='table' AND name='folders'")
            ).scalar()
            if create_sql and "uq_folder_project_name" in create_sql:
                conn.execute(text("PRAGMA foreign_keys=OFF"))
                conn.execute(
                    text(
                        """
                        CREATE TABLE folders_new (
                            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                            project_id INTEGER NOT NULL,
                            name VARCHAR(200) NOT NULL,
                            position INTEGER,
                            path VARCHAR(500) NOT NULL,
                            created_at DATETIME,
                            deleted_at DATETIME,
                            deleted_by_id INTEGER,
                            FOREIGN KEY(project_id) REFERENCES projects (id),
                            FOREIGN KEY(deleted_by_id) REFERENCES users (id)
                        )
                        """
                    )
                )
                conn.execute(
                    text(
                        """
                        INSERT INTO folders_new
                            (id, project_id, name, position, path, created_at, deleted_at, deleted_by_id)
                        SELECT id, project_id, name, position, path, created_at, deleted_at, deleted_by_id
                        FROM folders
                        """
                    )
                )
                conn.execute(text("DROP TABLE folders"))
                conn.execute(text("ALTER TABLE folders_new RENAME TO folders"))
                conn.execute(text("PRAGMA foreign_keys=ON"))

        if "documents" in tables:
            cols = _table_columns(conn, "documents")
            if "deleted_at" not in cols:
                conn.execute(text("ALTER TABLE documents ADD COLUMN deleted_at DATETIME"))
            if "uploaded_by_id" not in cols:
                conn.execute(text("ALTER TABLE documents ADD COLUMN uploaded_by_id INTEGER"))
            if "deleted_by_id" not in cols:
                conn.execute(text("ALTER TABLE documents ADD COLUMN deleted_by_id INTEGER"))
            if "updated_at" not in cols:
                conn.execute(text("ALTER TABLE documents ADD COLUMN updated_at DATETIME"))
            if "updated_by_id" not in cols:
                conn.execute(text("ALTER TABLE documents ADD COLUMN updated_by_id INTEGER"))


def init_db() -> None:
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _migrate_schema()

"""Ajustes de esquema SQLite sobre bases ya creadas, sin borrar datos."""
from sqlalchemy import text
from sqlalchemy.engine import Engine


def _table_columns(conn, table: str) -> set[str]:
    return {row[1] for row in conn.execute(text(f"PRAGMA table_info({table})")).fetchall()}


def migrate_schema(engine: Engine) -> None:
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

        if "projects" in tables:
            cols = _table_columns(conn, "projects")
            if "dependencia_id" not in cols:
                conn.execute(text("ALTER TABLE projects ADD COLUMN dependencia_id INTEGER"))

        if "users" in tables:
            cols = _table_columns(conn, "users")
            if "dependencia" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN dependencia VARCHAR(200)"))
            if "dependencia_id" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN dependencia_id INTEGER"))
            pending = conn.execute(
                text(
                    """
                    SELECT id, dependencia FROM users
                    WHERE dependencia IS NOT NULL
                      AND trim(dependencia) != ''
                      AND dependencia_id IS NULL
                    """
                )
            ).fetchall()
            for user_id, name in pending:
                cleaned = str(name).strip()
                dep_id = conn.execute(
                    text("SELECT id FROM dependencias WHERE lower(name) = lower(:name)"),
                    {"name": cleaned},
                ).scalar()
                if dep_id is None:
                    inserted = conn.execute(
                        text(
                            "INSERT INTO dependencias (name, created_at) VALUES (:name, CURRENT_TIMESTAMP)"
                        ),
                        {"name": cleaned},
                    )
                    dep_id = inserted.lastrowid
                conn.execute(
                    text("UPDATE users SET dependencia_id = :dep_id WHERE id = :user_id"),
                    {"dep_id": dep_id, "user_id": user_id},
                )

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

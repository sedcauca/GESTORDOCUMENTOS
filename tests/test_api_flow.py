"""Caracterización de la API sobre una base SQLite desechable."""
import os
import shutil
import tempfile
import unittest
from pathlib import Path

_ROOT = Path(tempfile.mkdtemp(prefix="gdp-api-test-"))
os.environ["ADMIN_EMAIL"] = "admin@test.local"
os.environ["ADMIN_PASSWORD"] = "TestAdmin123"
os.environ["ADMIN_NAME"] = "Admin Prueba"
os.environ["SECRET_KEY"] = "test-secret-not-for-production-use"

import app.config as config  # noqa: E402

config.DATA_DIR = _ROOT / "data"
config.UPLOADS_DIR = _ROOT / "uploads"
config.TRASH_DIR = config.UPLOADS_DIR / ".trash"
config.PREVIEW_DIR = config.DATA_DIR / "previews"
config.DATABASE_URL = f"sqlite:///{config.DATA_DIR / 'test.db'}"
config.ADMIN_EMAIL = "admin@test.local"
config.ADMIN_PASSWORD = "TestAdmin123"
config.ADMIN_NAME = "Admin Prueba"
config.SECRET_KEY = "test-secret-not-for-production-use"
for _directory in (config.DATA_DIR, config.UPLOADS_DIR, config.TRASH_DIR, config.PREVIEW_DIR):
    _directory.mkdir(parents=True, exist_ok=True)

import app.database  # noqa: E402,F401
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

_PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"


class ApiFlowTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client_ctx = TestClient(app)
        cls.client = cls.client_ctx.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.client_ctx.__exit__(None, None, None)
        shutil.rmtree(_ROOT, ignore_errors=True)

    def test_health_login_project_folder_pdf_trash_and_forbidden(self):
        client = self.client
        health = client.get("/api/health")
        self.assertEqual(health.status_code, 200, health.text)
        self.assertEqual(health.json(), {"status": "ok"})

        denied = client.post(
            "/api/auth/login",
            json={"email": "admin@test.local", "password": "clave-incorrecta"},
        )
        self.assertEqual(denied.status_code, 401, denied.text)

        logged = client.post(
            "/api/auth/login",
            json={"email": "admin@test.local", "password": "TestAdmin123"},
        )
        self.assertEqual(logged.status_code, 200, logged.text)
        self.assertEqual(logged.json()["role"], "super_administrador")

        dependencia = client.post("/api/users/dependencias", json={"name": "Planeacion"})
        self.assertEqual(dependencia.status_code, 201, dependencia.text)
        dependencia_id = dependencia.json()["id"]

        created = client.post(
            "/api/projects",
            json={
                "name": "Proyecto prueba",
                "bpin": "1234567890",
                "dependencia_id": dependencia_id,
                "member_ids": [],
            },
        )
        self.assertEqual(created.status_code, 201, created.text)
        project = created.json()
        self.assertEqual(project["name"], "Proyecto prueba")
        self.assertGreaterEqual(len(project["folders"]), 1)
        folder_id = project["folders"][0]["id"]

        extra = client.post(f"/api/projects/{project['id']}/folders", json={"name": "Anexos"})
        self.assertEqual(extra.status_code, 201, extra.text)
        self.assertEqual(extra.json()["name"], "Anexos")

        uploaded = client.post(
            f"/api/folders/{folder_id}/documents",
            data={"nombre": "Nota tecnica"},
            files={"file": ("nota.pdf", _PDF, "application/pdf")},
        )
        self.assertEqual(uploaded.status_code, 201, uploaded.text)
        document_id = uploaded.json()["id"]
        self.assertEqual(uploaded.json()["name"], "Nota tecnica")

        listed = client.get(f"/api/folders/{folder_id}/documents")
        self.assertEqual(listed.status_code, 200, listed.text)
        self.assertEqual([row["id"] for row in listed.json()], [document_id])

        trashed = client.delete(f"/api/documents/{document_id}")
        self.assertEqual(trashed.status_code, 200, trashed.text)
        self.assertIsNotNone(trashed.json()["deleted_at"])

        trash = client.get("/api/trash")
        self.assertEqual(trash.status_code, 200, trash.text)
        self.assertTrue(
            any(item["type"] == "document" and item["id"] == document_id for item in trash.json())
        )

        account = client.post(
            "/api/users",
            json={
                "full_name": "Lector prueba",
                "email": "lector@test.local",
                "password": "Lector1234",
                "role": "usuario",
                "dependencia_id": dependencia_id,
                "is_active": True,
            },
        )
        self.assertEqual(account.status_code, 201, account.text)

        logout = client.post("/api/auth/logout")
        self.assertEqual(logout.status_code, 200, logout.text)

        as_user = client.post(
            "/api/auth/login",
            json={"email": "lector@test.local", "password": "Lector1234"},
        )
        self.assertEqual(as_user.status_code, 200, as_user.text)
        forbidden = client.post(
            "/api/projects",
            json={
                "name": "No permitido",
                "bpin": "9999999999",
                "dependencia_id": dependencia_id,
            },
        )
        self.assertEqual(forbidden.status_code, 403, forbidden.text)


if __name__ == "__main__":
    unittest.main()

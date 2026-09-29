"""Utilidades de rutas en disco."""
import re
import unicodedata
from pathlib import Path


def slugify(value: str) -> str:
    """Normaliza texto para nombres de carpeta seguros."""
    normalized = unicodedata.normalize("NFKD", value)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    cleaned = re.sub(r"[^\w\s-]", "", ascii_text).strip()
    cleaned = re.sub(r"[-\s]+", "_", cleaned)
    return cleaned[:80] or "proyecto"


def project_root_name(name: str, bpin: str) -> str:
    return f"{slugify(bpin)}_{slugify(name)}"


def safe_dirname(value: str) -> str:
    """Nombre de carpeta legible y seguro en el sistema de archivos."""
    cleaned = value.replace("/", "-").replace("\\", "-").replace("\0", "").strip()
    cleaned = re.sub(r"[<>:\"|?*]", "", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" .")
    return cleaned[:120] or "Carpeta"


def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path

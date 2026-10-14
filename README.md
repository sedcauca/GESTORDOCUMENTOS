# Gestor de Documentos de Proyectos

Aplicación local para organizar proyectos por BPIN, carpetas y PDF. El servidor es **FastAPI**, los datos viven en **SQLite** y los archivos en `uploads/`. La interfaz que sirve `/` está en `templates/` y `static/`.

Hay otra interfaz en `src/` (portal con Vite). FastAPI no la monta.

## Requisitos

- Linux
- Python 3.10 o superior
- Navegador moderno

## Estructura

```
GESTORDOCUMENTOS/
├── app/                 # API FastAPI, servicios y migraciones SQLite
├── templates/           # Pantalla del gestor
├── static/css/          # Estilos por área (base, shell, listados, diálogos, login, paneles)
├── static/js/           # Módulos del cliente, sin bundler
├── data/                # documentos.db (no se versiona)
├── uploads/             # PDF por proyecto
├── tests/               # Caracterización de la API sobre una base temporal
├── requirements.txt
└── requirements-dev.txt
```

Al crear un proyecto se generan `Carpeta 1` … `Carpeta 8`. Después se pueden crear, renombrar o mover a la papelera. En disco la raíz queda como `uploads/<BPIN>_<NombreProyecto>/`.

El acceso exige sesión. Los roles son super administrador, administrador y usuario. El primer super administrador se crea al arrancar si `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `ADMIN_NAME` están definidos en el entorno o en `.env`.

## Instalación

```bash
cd "$HOME/Documentos/SOFTWARE/GESTOR-DOCUMENTOS/GESTORDOCUMENTOS"

python3 -m venv venv
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

## Ejecutar

```bash
source venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Abra [http://127.0.0.1:8000](http://127.0.0.1:8000).

## Pruebas de la API

Usan una base SQLite temporal. No leen `data/documentos.db` ni `uploads/` del proyecto.

```bash
source venv/bin/activate
python -m unittest tests.test_api_flow -v
```

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Salud del servicio |
| POST | `/api/auth/login` | Inicia sesión y deja la cookie |
| POST | `/api/auth/logout` | Cierra la sesión |
| GET | `/api/auth/me` | Usuario actual |
| GET | `/api/projects` | Listar proyectos visibles |
| POST | `/api/projects` | Crear proyecto |
| GET | `/api/projects/{id}` | Detalle y carpetas |
| POST | `/api/projects/{id}/folders` | Crear carpeta |
| PATCH | `/api/folders/{id}` | Renombrar carpeta |
| DELETE | `/api/folders/{id}` | Mover carpeta a la papelera |
| POST | `/api/folders/{id}/documents` | Subir PDF |
| GET | `/api/documents/{id}/download` | Descargar PDF |
| GET | `/api/trash` | Listar papelera |

## Notas

- Solo se aceptan **PDF** (extensión y contenido).
- Tamaño máximo por archivo: **50 MB**, o el valor de `MAX_FILE_SIZE_MB`.
- La base se crea en `data/documentos.db` al iniciar. Los cambios de columnas de bases ya existentes están en `app/schema_migrate.py`.
- Borrar desde la interfaz mueve a la papelera. El borrado definitivo es otra acción.
- Para detener el servidor: `Ctrl + C`.

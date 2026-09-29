# Gestor de Documentos de Proyectos

Aplicación web local para crear proyectos (nombre + BPIN), generar carpetas automáticamente y cargar documentos PDF. Backend en **FastAPI**, persistencia en **SQLite** y archivos en el sistema de archivos.

## Requisitos

- Kubuntu / Linux
- Python 3.10 o superior
- Navegador web moderno

## Estructura

```
CARGUE DOCUMENTOS/
├── app/                 # Backend FastAPI
├── templates/           # Interfaz HTML
├── static/              # CSS y JavaScript
├── data/                # Base de datos SQLite (documentos.db)
├── uploads/             # PDFs por proyecto/carpeta
├── requirements.txt
└── README.md
```

Al crear un proyecto se generan estas carpetas iniciales:

`Carpeta 1` … `Carpeta 8`

Después puede **crear más carpetas**, **renombrarlas** o **eliminarlas** desde el menú lateral o los botones del encabezado. La carpeta raíz en disco queda como: `uploads/<BPIN>_<NombreProyecto>/`.

## Instalación

Abra una terminal y ejecute:

```bash
cd "$HOME/Documentos/SOFTWARE/CARGUE DOCUMENTOS"

python3 -m venv venv
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
```

> Si ya existe la carpeta `venv`, basta con activarla y reinstalar dependencias:
>
> ```bash
> source venv/bin/activate
> pip install -r requirements.txt
> ```

## Ejecutar el servidor

Desde la carpeta del proyecto, con el entorno virtual activado:

```bash
cd "$HOME/Documentos/SOFTWARE/CARGUE DOCUMENTOS"
source venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Debería ver un mensaje similar a:

```text
Uvicorn running on http://127.0.0.1:8000
```

## Acceder desde el navegador

Abra:

[http://127.0.0.1:8000](http://127.0.0.1:8000)

## Uso rápido

1. Pulse **Nuevo proyecto**.
2. Indique **Nombre del proyecto** y **BPIN** (obligatorios).
3. En el menú lateral elija el proyecto y la carpeta de destino.
4. Complete **Nombre del documento**, revise la **Fecha de carga** (automática) y seleccione un **PDF**.
5. Pulse **Subir documento**.

## API útil

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Salud del servicio |
| GET | `/api/projects` | Listar proyectos |
| POST | `/api/projects` | Crear proyecto |
| GET | `/api/projects/{id}` | Detalle + carpetas |
| POST | `/api/projects/{id}/folders` | Crear carpeta |
| PATCH | `/api/folders/{id}` | Renombrar carpeta |
| DELETE | `/api/folders/{id}` | Eliminar carpeta |
| POST | `/api/folders/{id}/documents` | Subir PDF |
| GET | `/api/documents/{id}/download` | Descargar PDF |

## Notas

- Solo se aceptan archivos **PDF** (validación por extensión y contenido).
- Tamaño máximo por archivo: **50 MB**.
- La base de datos se crea sola en `data/documentos.db` al iniciar.
- Para detener el servidor: `Ctrl + C` en la terminal.

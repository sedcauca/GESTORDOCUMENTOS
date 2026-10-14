"""Constantes y jerarquía de roles del sistema."""

ROLE_SUPER_ADMIN = "super_administrador"
ROLE_ADMIN = "administrador"
ROLE_USER = "usuario"

ROLE_LABELS = {
    ROLE_SUPER_ADMIN: "Super administrador",
    ROLE_ADMIN: "Administrador",
    ROLE_USER: "Usuario",
}

ROLE_DESCRIPTIONS = {
    ROLE_SUPER_ADMIN: "Crea dependencias y cuentas de administrador. Control total del sistema, incluida la papelera completa.",
    ROLE_ADMIN: "Gestiona proyectos y documentos. En usuarios solo puede crear el rol Usuario.",
    ROLE_USER: "Consulta documentos y puede subir, editar, descargar y mover a la papelera cualquier documento. Puede renombrar y borrar carpetas. No crea proyectos ni borra definitivamente.",
}

# Orden de poder: mayor índice = más privilegios
ROLE_RANK = {
    ROLE_USER: 1,
    ROLE_ADMIN: 2,
    ROLE_SUPER_ADMIN: 3,
}

# Acciones de lectura (todos los roles autenticados)
READ_ROLES = (ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_USER)

# Acciones de escritura de estructura de proyectos (crear proyecto, crear carpeta)
WRITE_ROLES = (ROLE_SUPER_ADMIN, ROLE_ADMIN)

# Renombrar / borrar carpetas (incluye usuario)
FOLDER_MGMT_ROLES = (ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_USER)

# Subir, editar, descargar y papelera de documentos (incluye usuario)
DOC_WRITE_ROLES = (ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_USER)

# Ver y restaurar en papelera (usuario solo ve lo suyo en documentos)
TRASH_ROLES = (ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_USER)

# Borrar definitivamente desde papelera (solo admin / super)
PURGE_ROLES = (ROLE_SUPER_ADMIN, ROLE_ADMIN)

# Gestión de usuarios
USER_MGMT_ROLES = (ROLE_SUPER_ADMIN, ROLE_ADMIN)

import os

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

PROPERTY_MARKETPLACE_ENABLED = (
    os.getenv("PROPERTY_MARKETPLACE_ENABLED", "false").lower() == "true"
)

# Origen público desde el que el backend sirve /media (y cualquier otro
# archivo estático). Necesario para construir URLs absolutas: el
# frontend corre en otro origen (Next.js), así que una URL relativa
# como "/media/..." se resolvería contra el propio frontend y nunca
# cargaría la imagen. En despliegue debe ser la URL pública real del
# backend (ej. https://coflow-api.onrender.com), nunca localhost.
BACKEND_PUBLIC_URL = os.getenv("BACKEND_PUBLIC_URL", "http://127.0.0.1:8000")

# URL del frontend desplegado, usada para construir la lista de
# orígenes permitidos por CORS. En local no hace falta definirla:
# localhost:3000 siempre está permitido (ver main.py).
FRONTEND_URL = os.getenv("FRONTEND_URL", "")

# Orígenes adicionales permitidos por CORS, separados por comas (por
# ejemplo, un dominio de vista previa de Vercel además del dominio
# principal). Opcional.
CORS_ALLOWED_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "")

# El almacenamiento local de imágenes (app/services/storage/local.py)
# usa disco efímero: no debe usarse en producción salvo que se marque
# explícitamente para un despliegue de pruebas temporal, sabiendo que
# las imágenes se perderán en cada redeploy/reinicio.
ALLOW_LOCAL_MEDIA_IN_PRODUCTION = (
    os.getenv("ALLOW_LOCAL_MEDIA_IN_PRODUCTION", "false").lower() == "true"
)

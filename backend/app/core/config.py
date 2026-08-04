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

# --- TrueLayer (Open Banking sandbox) ---------------------------------
# Credenciales de la app TrueLayer. Se validan (RuntimeError) solo en el
# momento de usarlas (app/services/truelayer_client.py), no al importar
# este módulo, para no romper el arranque del resto de la app si todavía
# no están configuradas.
TRUELAYER_CLIENT_ID = os.getenv("TRUELAYER_CLIENT_ID", "")
TRUELAYER_CLIENT_SECRET = os.getenv("TRUELAYER_CLIENT_SECRET", "")
TRUELAYER_REDIRECT_URI = os.getenv("TRUELAYER_REDIRECT_URI", "")

# "sandbox" o "live". Determina las URLs base de abajo. TrueLayer separa
# sandbox y producción por dominio (*-sandbox.com vs .com), con datos
# completamente segregados entre ambos.
TRUELAYER_ENVIRONMENT = os.getenv("TRUELAYER_ENVIRONMENT", "sandbox")

if TRUELAYER_ENVIRONMENT == "live":
    TRUELAYER_AUTH_BASE_URL = "https://auth.truelayer.com"
    TRUELAYER_API_BASE_URL = "https://api.truelayer.com"
else:
    TRUELAYER_AUTH_BASE_URL = "https://auth.truelayer-sandbox.com"
    TRUELAYER_API_BASE_URL = "https://api.truelayer-sandbox.com"

# Clave Fernet (cryptography) usada para cifrar en reposo los tokens
# bancarios (access_token/refresh_token de TrueLayer). Independiente de
# SECRET_KEY (JWT de sesión de CoFlow): son secretos con propósitos y
# ciclos de vida distintos. Generarla con:
#   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# Se valida (RuntimeError) al usarse, en app/core/token_encryption.py.
BANK_TOKEN_ENCRYPTION_KEY = os.getenv("BANK_TOKEN_ENCRYPTION_KEY", "")

# Habilita endpoints de diagnóstico del análisis financiero
# (/financial-analysis/debug/*). Estos endpoints solo exponen agregados
# anonimizados (nunca tokens, IBAN, ni movimientos completos), pero son
# una herramienta de desarrollo, no una funcionalidad de producto: están
# activos automáticamente si ENVIRONMENT != "production", y en
# producción permanecen desactivados salvo que se active esta variable
# explícitamente. Preferencia: no activarla en el despliegue real.
ENABLE_FINANCIAL_DEBUG = (
    os.getenv("ENABLE_FINANCIAL_DEBUG", "false").lower() == "true"
)

# Secreto usado para derivar (HMAC-SHA256) el token público de los
# enlaces verificables del Pasaporte de Solvencia. El token NUNCA se
# guarda (ni en claro, ni cifrado, ni como hash): se recalcula bajo
# demanda a partir de esta clave + share_nonce + share_token_version
# (ver app/core/passport_tokens.py). Distinta de BANK_TOKEN_ENCRYPTION_KEY
# y de SECRET_KEY — no reutilizar. Genera un valor con:
#   python -c "import secrets; print(secrets.token_hex(32))"
# Se valida (RuntimeError) al usarse.
PASSPORT_SHARE_SECRET = os.getenv("PASSPORT_SHARE_SECRET", "")

# --- Verificación de email (Resend) -----------------------------------
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
# Remitente transaccional, ej. "CoFlow <verificacion@coflow.app>". Debe
# ser un dominio verificado en Resend en producción.
EMAIL_FROM = os.getenv("EMAIL_FROM", "CoFlow <onboarding@resend.dev>")

# "resend" envía de verdad vía Resend. "console" solo deja constancia en
# el log de que se generó un enlace (sin token ni URL) — útil en local
# sin API key real.
EMAIL_DELIVERY_MODE = os.getenv("EMAIL_DELIVERY_MODE", "resend")

_EMAIL_VERIFICATION_EXPIRY_RAW = os.getenv("EMAIL_VERIFICATION_EXPIRY_MINUTES", "30")
try:
    EMAIL_VERIFICATION_EXPIRY_MINUTES = int(_EMAIL_VERIFICATION_EXPIRY_RAW)
except ValueError:
    EMAIL_VERIFICATION_EXPIRY_MINUTES = 30

# Cuando está activo Y ENVIRONMENT != "production" (doble candado, igual
# que ENABLE_FINANCIAL_DEBUG), /auth/register y /auth/resend-verification
# devuelven además "debug_token" en la respuesta, solo para que los
# tests automatizados puedan verificar el email sin leer Resend. Nunca
# se activa en producción aunque esta variable se ponga en true por
# error.
EMAIL_VERIFICATION_TEST_MODE = (
    os.getenv("EMAIL_VERIFICATION_TEST_MODE", "false").lower() == "true"
)

import os

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Versiones vigentes de los documentos legales que se aceptan al
# registrarse (frontend/src/app/legal/terminos y /privacidad). Se
# guardan junto a cada usuario en el momento del registro para saber
# bajo qué texto exacto dio su consentimiento si estos documentos
# cambian más adelante. Súbelas aquí cuando publiques una revisión.
CURRENT_TERMS_VERSION = "1.0"
CURRENT_PRIVACY_VERSION = "2026-08-15"
# Versión de /legal/condiciones-propietarios aceptada al publicar un
# piso con cobro (ver PropertyBillingConsent) — independiente de
# CURRENT_TERMS_VERSION porque cubre un consentimiento distinto (pago
# recurrente por propiedad), con su propio ciclo de revisiones.
CURRENT_OWNER_TERMS_VERSION = "1.0"

# Edad mínima para registrarse en CoFlow (Política de Privacidad, Términos).
MINIMUM_REGISTRATION_AGE = 14

# Client ID de Google Cloud (OAuth "Web application") usado para
# verificar el id_token que manda el botón de "Iniciar sesión con
# Google" del frontend — ver app/services/auth_service.py::login_with_google.
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

PROPERTY_MARKETPLACE_ENABLED = (
    os.getenv("PROPERTY_MARKETPLACE_ENABLED", "false").lower() == "true"
)

# Bloqueos de lanzamiento: las conexiones bancarias y la facturación de
# propietarios permanecen fuera de la API hasta contar con cobertura
# regulatoria/operativa y hasta que se reabra la monetización.
BANKING_FEATURE_ENABLED = (
    os.getenv("BANKING_FEATURE_ENABLED", "false").lower() == "true"
)
OWNER_BILLING_ENABLED = (
    os.getenv("OWNER_BILLING_ENABLED", "false").lower() == "true"
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

# --- Almacenamiento de imágenes (Cloudflare R2, S3-compatible) --------
# Backend de almacenamiento persistente para avatares, fotos de perfil,
# imágenes de piso e imágenes de comunidad. Si las cinco
# variables están presentes, app/services/storage_service.py usa R2
# para todas las subidas nuevas. En desarrollo puede caer a disco local;
# en producción la aplicación no arranca si falta alguna variable.
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "")
# Dominio público desde el que se sirven los objetos del bucket (el
# dominio r2.dev por defecto, o un dominio propio conectado al bucket).
# Sin barra final, ej. "https://pub-xxxxxxxx.r2.dev".
R2_PUBLIC_BASE_URL = os.getenv("R2_PUBLIC_BASE_URL", "").rstrip("/")

# Tamaños máximos de subida (en bytes), configurables sin tocar código.
MAX_AVATAR_SIZE_BYTES = int(
    os.getenv("MAX_AVATAR_SIZE_BYTES", str(5 * 1024 * 1024))
)
MAX_IMAGE_SIZE_BYTES = int(
    os.getenv("MAX_IMAGE_SIZE_BYTES", str(8 * 1024 * 1024))
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

# --- Verificación de email (Resend) -----------------------------------
# Interruptor temporal de toda la funcionalidad de verificación de
# email. Con "false": los usuarios nuevos se crean ya verificados, no se
# genera ni envía ningún token, require_verified_email deja pasar a
# todo el mundo, y /auth/verify-email y /auth/resend-verification
# devuelven 404 (FEATURE_DISABLED). El código de verificación no se
# borra ni se modifica — solo se deja de ejecutar. Por defecto "true"
# (el comportamiento normal, con Resend activo).
EMAIL_VERIFICATION_ENABLED = (
    os.getenv("EMAIL_VERIFICATION_ENABLED", "true").lower() == "true"
)

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

_PASSWORD_RESET_EXPIRY_RAW = os.getenv("PASSWORD_RESET_EXPIRY_MINUTES", "30")
try:
    PASSWORD_RESET_EXPIRY_MINUTES = int(_PASSWORD_RESET_EXPIRY_RAW)
except ValueError:
    PASSWORD_RESET_EXPIRY_MINUTES = 30

# --- Stripe (suscripción de propietarios) ------------------------------
# Cada piso publicado genera su propia Subscription de Stripe (30 días
# de prueba gratuita desde que el piso pasa a READY, luego
# PROPERTY_SUBSCRIPTION_PRICE_CENTS/mes recurrente). Todas las
# suscripciones de un mismo propietario comparten un único Customer de
# Stripe (una sola tarjeta guardada sirve para todos sus pisos). Se
# validan (RuntimeError) solo al usarse (app/services/billing_service.py),
# no al importar este módulo. Claves de
# https://dashboard.stripe.com/test/apikeys en modo prueba.
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
# Firma del webhook, de https://dashboard.stripe.com/test/webhooks (o de
# `stripe listen` en local). Sin esto, /billing/webhook rechaza todos
# los eventos entrantes: nunca se procesa un webhook sin verificar su
# firma.
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")

PROPERTY_SUBSCRIPTION_PRICE_CENTS = int(
    os.getenv("PROPERTY_SUBSCRIPTION_PRICE_CENTS", "2399")
)
PROPERTY_SUBSCRIPTION_TRIAL_DAYS = int(
    os.getenv("PROPERTY_SUBSCRIPTION_TRIAL_DAYS", "30")
)

# Despliegue de pruebas — CoFlow

Guía paso a paso para el primer despliegue de pruebas: **Neon** (PostgreSQL) + **Render** (backend FastAPI) + **Vercel** (frontend Next.js).

Este documento no contiene secretos. Cada valor real lo generas/copias tú en el paso correspondiente.

---

## 0. Antes de empezar — seguridad del repositorio

`backend/.env` (con valores reales, incluida una contraseña de Postgres local) está **trackeado por git** en este repositorio, igual que `backend/venv/`. Antes de desplegar:

1. Deja de trackear el archivo (esto no borra tu `.env` local, solo lo saca de git):
   ```bash
   git rm --cached backend/.env
   git rm -r --cached backend/venv
   git commit -m "Stop tracking backend/.env and venv"
   ```
2. **Rota el `SECRET_KEY`** y cualquier contraseña de base de datos que haya estado en ese `.env` — ya quedaron en el historial de git aunque dejes de trackearlos ahora. Si el repositorio es privado y de un solo desarrollador el riesgo es bajo, pero es buena práctica no reutilizar esos valores en producción.
3. A partir de ahora `backend/.gitignore` (ya creado) evita que vuelva a pasar.

---

## 1. Base de datos — Neon

1. Crea una cuenta/proyecto en [neon.tech](https://neon.tech).
2. Crea una base de datos (por ejemplo `coflow`).
3. En el dashboard del proyecto, copia el **Connection string** en modo *pooled* (recomendado para Render, que abre varias conexiones concurrentes). Tendrá esta forma:
   ```
   postgresql://usuario:contraseña@ep-xxxx-pooler.region.aws.neon.tech/coflow?sslmode=require
   ```
4. Adáptalo al driver que usa el proyecto (`psycopg`, síncrono):
   ```
   postgresql+psycopg://usuario:contraseña@ep-xxxx-pooler.region.aws.neon.tech/coflow?sslmode=require
   ```
   Este es tu `DATABASE_URL` de producción. Guárdalo, lo necesitas en dos sitios: para aplicar las migraciones (paso 2) y como variable de entorno en Render (paso 3).

## 2. Aplicar las migraciones (manual, una sola vez)

**No configures esto para que se ejecute automáticamente en cada arranque de Render** — si el servicio reinicia o escala mientras una migración está en curso, dos procesos podrían intentar migrar a la vez y corromper el estado de Alembic. La forma recomendada:

**Opción A — desde tu máquina local, apuntando a Neon:**
```bash
cd backend
# Usa una copia temporal del entorno con el DATABASE_URL de Neon,
# sin tocar tu .env local:
DATABASE_URL="postgresql+psycopg://...tu cadena de Neon..." \
  ./venv/Scripts/python.exe -m alembic upgrade head
```
(En PowerShell: `$env:DATABASE_URL="..."; .\venv\Scripts\python.exe -m alembic upgrade head`)

**Opción B — desde la Shell de Render**, una vez creado el servicio (paso 3): en el dashboard del servicio, pestaña *Shell*, ejecuta:
```bash
alembic upgrade head
```
`DATABASE_URL` ya estará en el entorno del servicio, así que no hace falta pasarlo a mano.

Repite `alembic upgrade head` manualmente cada vez que añadas una migración nueva y despliegues — nunca lo pongas en el *Start Command*.

## 3. Backend — Render

1. Crea un nuevo **Web Service** en Render, conectado a este repositorio.
2. **Root Directory**: `backend`.
3. **Build Command**:
   ```
   pip install -r requirements.txt
   ```
4. **Start Command**:
   ```
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
   (`app.main:app` es el módulo real — `backend/app/main.py` define `app = FastAPI(...)` a nivel de módulo; no hay otro punto de entrada).
5. **Variables de entorno** (Render → Environment):

   | Variable | Valor para este despliegue de pruebas |
   |---|---|
   | `DATABASE_URL` | La cadena de Neon del paso 1 |
   | `SECRET_KEY` | Genera una nueva: `python -c "import secrets; print(secrets.token_hex(32))"` |
   | `ALGORITHM` | `HS256` |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` (7 días) o el valor que prefieras |
   | `ENVIRONMENT` | `production` |
   | `FRONTEND_URL` | (déjalo vacío por ahora, se completa en el paso 6 tras conocer la URL de Vercel) |
   | `CORS_ALLOWED_ORIGINS` | (opcional, vacío por ahora) |
   | `BACKEND_PUBLIC_URL` | La URL que Render te asigne al servicio, ej. `https://coflow-api.onrender.com` (la sabrás tras el primer deploy; actualízala después si hace falta) |
   | `PROPERTY_MARKETPLACE_ENABLED` | `false` |
   | `ALLOW_LOCAL_MEDIA_IN_PRODUCTION` | `true` — **solo para este despliegue de pruebas temporal** (ver advertencia de la sección 8) |
   | `TRUELAYER_CLIENT_ID` | El Client ID de tu app en [console.truelayer.com](https://console.truelayer.com) |
   | `TRUELAYER_CLIENT_SECRET` | El Client Secret de esa misma app |
   | `TRUELAYER_REDIRECT_URI` | La URL de callback del frontend, ej. `https://co-flow-eight.vercel.app/pasaporte/callback` — debe coincidir EXACTAMENTE con la configurada en la consola de TrueLayer |
   | `TRUELAYER_ENVIRONMENT` | `sandbox` — no cambiar a `live` en este despliegue de pruebas |
   | `BANK_TOKEN_ENCRYPTION_KEY` | Genera una nueva: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |
   | `PASSPORT_SHARE_SECRET` | Genera una nueva (distinta de las anteriores): `python -c "import secrets; print(secrets.token_hex(32))"` |
   | `ENABLE_FINANCIAL_DEBUG` | `false` (déjalo así salvo que necesites auditar el análisis financiero en este despliegue) |

6. Despliega. Aplica las migraciones (paso 2, opción B) tras el primer despliegue exitoso.

7. **Paso obligatorio antes de compartir enlaces públicos de pasaportes**: el endpoint `GET /public/solvency-passports/{public_id}` recibe el token de verificación por query string (diseño explícito de esta funcionalidad). Los access logs por defecto de uvicorn/Render registran la ruta completa, incluida la query string — eso significa que el token quedaría en esos logs en texto plano. Antes de considerar esta función lista para tráfico real:
   - Desactiva el access log de uvicorn en el *Start Command*: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --no-access-log`, o
   - Si necesitas los logs por otro motivo, filtra/redacta la query string antes de que lleguen a cualquier sistema de logging persistente (Render logs, servicio externo, etc.).
   - No hay rate-limiting en `/public/solvency-passports/*` en este MVP (no existía infraestructura de rate-limiting en el proyecto); si vas a exponer esto a tráfico real, añade uno antes.

## 4. Frontend — Vercel

1. Importa el repositorio en Vercel.
2. **Root Directory**: `frontend`.
3. Framework preset: Next.js (detectado automáticamente).
4. **Variables de entorno** (Vercel → Settings → Environment Variables):

   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | La URL pública de tu servicio de Render, ej. `https://coflow-api.onrender.com` |
   | `NEXT_PUBLIC_APP_URL` | La URL que Vercel te asigne, ej. `https://coflow.vercel.app` (la sabrás tras el primer deploy) |

5. Despliega.

## 5. Cerrar el círculo de CORS

Una vez tengas la URL final de Vercel:

1. En Render, edita la variable `FRONTEND_URL` del backend con esa URL exacta (ej. `https://coflow.vercel.app`, sin barra final).
2. Si usas varios dominios (ej. un dominio de preview de Vercel además del de producción), añádelos a `CORS_ALLOWED_ORIGINS` separados por comas.
3. Guarda y deja que Render haga **redeploy** del backend (o dispáralo manualmente).
4. Si `BACKEND_PUBLIC_URL` no coincidía exactamente con la URL final de Render, corrígela también y vuelve a desplegar — afecta a las URLs de imágenes que se generen a partir de ese momento.

## 6. Verificación

1. **`/health`**: abre `https://<tu-backend>.onrender.com/health` → debe responder `{"status": "ok"}`.
2. **`/docs`**: abre `https://<tu-backend>.onrender.com/docs` → debe cargar la UI de Swagger (no requiere autenticación, y no expone datos, solo el esquema de la API).
3. **Login real desde Vercel**: abre tu URL de Vercel, crea una cuenta o inicia sesión. Si falla con un error de red/CORS en la consola del navegador, revisa que `FRONTEND_URL` en Render coincida EXACTAMENTE (protocolo + dominio, sin barra final) con la URL de Vercel, y que `NEXT_PUBLIC_API_URL` en Vercel apunte a la URL correcta de Render.

## 7. Advertencia — imágenes de propiedades no son persistentes en este despliegue

`ALLOW_LOCAL_MEDIA_IN_PRODUCTION=true` permite subir fotos de pisos usando el disco local del contenedor de Render (`backend/media/`). Esto es **solo para pruebas**:

- Render usa disco efímero: **cada redeploy, reinicio o escalado del servicio borra todo lo que haya en `backend/media/`**.
- Si Render llega a ejecutar más de una instancia, cada una tiene su propio disco — una imagen subida a una instancia no se verá desde otra.
- No hay backups ni replicación de este almacenamiento.

Antes de un despliegue real, sustituir `LocalDiskStorage` (`backend/app/services/storage/local.py`) por una implementación real de `StorageBackend` (S3, Cloudinary, Supabase Storage...) y poner `ALLOW_LOCAL_MEDIA_IN_PRODUCTION=false` (o quitar la variable).

## 8. Rollback básico

- **Render**: pestaña *Events*/*Deploys* del servicio → selecciona un deploy anterior → *Rollback to this deploy*. Restaura el código, no la base de datos.
- **Vercel**: pestaña *Deployments* del proyecto → selecciona un deploy anterior → *Promote to Production*.
- **Base de datos**: si la última migración aplicada tiene un `downgrade()` seguro (todas las migraciones de este proyecto lo tienen), puedes revertirla con:
  ```bash
  alembic downgrade -1
  ```
  ejecutado igual que en el paso 2 (Shell de Render o local apuntando a `DATABASE_URL` de Neon). Si el rollback de código vuelve a una versión anterior del esquema, aplica el `downgrade` correspondiente **antes** de que el código antiguo intente consultar columnas que ya no existirían si además hicieras rollback del código a una versión sin la migración.

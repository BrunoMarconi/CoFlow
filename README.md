# CoFlow

CoFlow ayuda a encontrar personas compatibles para compartir piso, crear una
comunidad de convivencia y hablar antes de tomar una decisión. El lanzamiento
inicial está centrado en Málaga.

## Arquitectura

- `frontend/`: Next.js 16, React 19 y TypeScript.
- `backend/`: FastAPI, SQLAlchemy y Alembic.
- PostgreSQL como base de datos.
- Cloudflare R2 para imágenes en producción.

La documentación funcional y técnica vive en [`docs/`](docs/). La guía de
despliegue está en [`DEPLOYMENT.md`](DEPLOYMENT.md).

## Desarrollo local

Requisitos: Node.js 20+, Python 3.11+ y Docker.

1. Arranca PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

2. Configura y arranca el backend (PowerShell):

   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   Copy-Item .env.example .env
   # En .env usa:
   # DATABASE_URL=postgresql+psycopg://coflow:coflow@localhost:5432/coflow
   python -m alembic upgrade head
   uvicorn app.main:app --reload
   ```

3. En otra terminal, configura y arranca el frontend:

   ```powershell
   cd frontend
   npm ci
   # Crea .env.local con NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   npm run dev
   ```

La web estará en `http://localhost:3000`; la API y su documentación OpenAPI en
`http://127.0.0.1:8000` y `http://127.0.0.1:8000/docs`.

## Comprobaciones

Antes de abrir una PR:

```powershell
cd frontend
npm run lint
npm run typecheck
npm run build

cd ..\backend
python -m pytest -q
```

Los tests de backend usan la base indicada por `DATABASE_URL`, aíslan cada caso
en una transacción y requieren que las migraciones estén aplicadas.

## Variables y funciones opcionales

Parte del producto está detrás de feature flags. `PROPERTY_MARKETPLACE_ENABLED`,
`BANKING_FEATURE_ENABLED` y `OWNER_BILLING_ENABLED` permanecen desactivadas por
defecto. Consulta [`backend/.env.example`](backend/.env.example) antes de
habilitarlas; no subas secretos ni archivos `.env` al repositorio.

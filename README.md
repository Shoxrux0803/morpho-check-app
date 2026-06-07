# MorphoCheck Pro

MorphoCheck Pro is a clinical anthropometry platform for entering patient measurements, calculating BMI and growth indicators, managing clinical recommendations, and generating PDF/DOCX reports.

## Stack

- Frontend: React, CRACO, Material UI, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Pydantic, slowapi
- Database: SQLite for local development, PostgreSQL-ready through SQLAlchemy
- Reports: ReportLab, python-docx, openpyxl
- Deployment: Docker or separate frontend/backend services

## Repository Layout

```text
morpho-check-app/
|-- morphocheck_backend/       FastAPI application
|   |-- main.py                Backend ASGI app
|   |-- models/                Pydantic and SQLAlchemy models
|   |-- routers/               API routers
|   |-- services/              Business logic and report generation
|   |-- utils/                 Database, security and audit helpers
|-- src/                       React application
|-- public/                    Static frontend assets
|-- Dockerfile                 Frontend container image
|-- docker-compose.yml         Local compose stack
|-- package.json               Frontend dependencies and scripts
```

## Requirements

- Node.js 18 or newer
- npm 9 or newer
- Python 3.11 or newer
- Docker and Docker Compose for container deployment

## Configuration

Create backend environment files from the examples:

```powershell
Copy-Item .env.example .env
Copy-Item morphocheck_backend\.env.example morphocheck_backend\.env
```

Important backend variables:

```env
API_PREFIX=/api
DEBUG=false
SECRET_KEY=change-this-in-production
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ALLOWED_HOSTS=localhost,127.0.0.1,testserver
DATABASE_URL=sqlite:///./morphocheck.db
```

Production notes:

- Use a strong unique `SECRET_KEY`.
- Set explicit `CORS_ORIGINS`; wildcard origins are rejected by the app.
- Set `ALLOWED_HOSTS` to the real hostnames served by the API.
- Prefer PostgreSQL for multi-user production deployments.
- Keep `.env`, database files, generated reports, uploads and cache folders out of Git.

## Local Backend Setup

```powershell
cd morphocheck_backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`.

Health check:

```powershell
Invoke-RestMethod http://localhost:8000/api/health
```

## Local Frontend Setup

In a second terminal:

```powershell
npm install
npm start
```

The frontend will be available at `http://localhost:3000`. Development API traffic is proxied to `http://localhost:8000`.

## Docker Compose

```powershell
docker compose up --build
```

After startup, verify the backend:

```powershell
Invoke-RestMethod http://localhost:8000/api/health
```

## Database Initialization

The backend creates missing tables on startup through `init_db`. For existing SQLite deployments, `ensure_schema_updates()` applies small additive schema fixes.

Recommended production flow:

1. Back up the current database.
2. Deploy the new backend image or service.
3. Start the API and verify `/api/health`.
4. Run a smoke test for login, analysis creation and PDF generation.

## Common Commands

```powershell
# Frontend production build
npm run build

# Frontend tests
npm test -- --watchAll=false

# Backend syntax check
cd morphocheck_backend
python -m compileall .

# Run backend directly from repository root
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Deployment Checklist

- Configure production `.env` values.
- Use HTTPS at the reverse proxy.
- Forward only required ports.
- Persist database and uploaded files outside the container filesystem.
- Configure backups for the production database.
- Review generated report storage and retention policy.
- Confirm `CORS_ORIGINS` and `ALLOWED_HOSTS` match production domains.
- Run health, authentication, analysis and PDF smoke tests after release.

## Maintenance

Generated files should not be committed:

- `*.db`, `*.sqlite`, `*.sqlite3`
- `__pycache__/`, `*.pyc`
- `build/`, `dist/`, `out/`
- generated test reports and temporary DOCX/PDF files
- uploads and local backup files unless explicitly required

Use `git status --short` before every release and keep runtime data outside the repository.

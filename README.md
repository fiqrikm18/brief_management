# Fugo Creative — Docker Setup

This project consists of two applications orchestrated with Docker Compose:

- **core** — NestJS backend API (port 3000)
- **client** — Vite + React frontend served via nginx (port 80)
- **db** — PostgreSQL 16 (port 5432)

## Running locally

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (BuildKit enabled)
- [Docker Compose](https://docs.docker.com/compose/install/)

### 1. Prepare environment files

Copy the example files and fill in your secrets (JWT secret, API keys, etc.):

```bash
cp core/.env.example core/.env
cp client/.env.example client/.env
```

### 2. Build and start all services

```bash
# Build all images
docker compose build

# Start all services in detached mode
docker compose up -d

# View logs in real time
docker compose logs -f

# Stop and remove containers
docker compose down

# Rebuild and restart
docker compose up -d --build
```

### 3. Run database migrations

```bash
docker compose exec core bun run db:push
```

### 4. Run tests

```bash
docker compose exec core bun run test
```

## Service URLs

| Service | URL |
|---------|-----|
| Client (frontend) | http://localhost |
| API (backend) | http://localhost:3000/api |
| PostgreSQL | localhost:5432 |

## Environment variables

### `core/.env`

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Application runtime mode | `development` |
| `PORT` | Port used by core | `3000` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:5173` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@db:5432/brief-manager` |
| `JWT_SECRET` | Secret key for signing JWT | random long string |
| `OBSERVE_APP_KEY` | NestJS Observe application key | — |
| `OBSERVE_APP_SECRET` | NestJS Observe application secret | — |
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-...` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Generative AI API key | `AIzaSy...` |

### `client/.env`

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Base API URL called by frontend | `http://localhost:3000/api` |

> Note: `.env` files are listed in `.gitignore` and are not committed. Use `.env.example` as a template.

## Architecture

```
┌─────────┐      ┌─────────┐      ┌─────────┐
│  client │─────►│   core  │─────►│    db   │
│ port 80 │      │ port 3000 │    │ port 5432│
└─────────┘      └─────────┘      └─────────┘
  nginx + Vite     NestJS API     PostgreSQL
```

- **client → core**: all requests starting with `/api` are proxied by nginx to `http://core:3000/api` over the internal Docker network (`app-network`).
- **core → db**: connects to PostgreSQL using hostname `db` (the service name in `docker-compose.yml`).
- All services communicate over the bridge network `app-network`.

## Database schema (Drizzle ORM, PostgreSQL)

Main tables and relationships:

| Table | Description |
|-------|-------------|
| `users` | User accounts (email, name, password_hash) |
| `briefs` | Client briefs (client_name, company_name, requirements, budget_range, target_timeline, pipeline_status) |
| `ai_processing_results` | AI processing result per brief (ai_status, ai_summary, service_category, priority, etc.) |
| `ai_jobs` | Asynchronous AI jobs (provider, status, attempts, max_attempts, error_message) |
| `missing_info_items` | Missing information extracted from AI results (item_text) |

Key relationships:
- `briefs` → `ai_processing_results` (one-to-one, cascade delete)
- `ai_processing_results` → `missing_info_items` (one-to-many, cascade delete)
- `ai_jobs` → `briefs` (many-to-one, cascade delete)

Indexes added on frequently filtered columns: `pipeline_status`, `created_at`, `brief_id`, `status`, `ai_status`, `priority`, `service_category`, `ai_result_id`.

## Technical decisions and trade-offs

| Decision | Reason | Trade-off |
|----------|--------|-----------|
| **Bun** as runtime & package manager | Faster install and build than npm, native ESM support | Smaller ecosystem than Node.js/npm; some tools assume npm |
| **Multi-stage Docker build** | Final image contains only build artifacts + production dependencies, smaller image size | More build steps; development dependencies not available in final image |
| **Nginx for client** | Serves Vite static build with custom config for `/api` proxy | Must maintain separate `nginx.conf`; no HMR in production |
| **PostgreSQL + Drizzle ORM** | Strong typing, type-safe migrations, enum and JSONB support | Requires PostgreSQL; no other database without rewriting schema |
| **`depends_on` with `service_healthy`** | Ensures `db` is ready before `core` starts | Increases startup time; healthcheck must be configured correctly |
| **Env via `env_file` in compose** | `.env` is not copied into the build image (security) | Must prepare `.env` on host before `docker compose up` |

## AI usage log

Tools used to create this setup:

- **`read` / `glob` / `grep`** — explored the project structure (`package.json`, `vite.config.ts`, `drizzle.config.ts`, database schema) before writing the Dockerfile and compose file.
- **`write` / `edit`** — created `docker-compose.yml`, `Dockerfile`, `nginx.conf`, `.dockerignore`, `.env.example`, and `README.md`.
- **`bash`** — validated `docker compose config`, attempted `docker compose build`, and checked Docker/Compose versions.

### Examples of corrections / rejections of AI output

1. **Rejected: `COPY .env .env` in `core/Dockerfile`** — Initially I copied `.env` into the image during the runner stage. The build failed because `.env` is in `.dockerignore`, so it was not available in the build context. I removed that line and rely on `env_file` from `docker-compose.yml` instead, keeping secrets out of the image.

2. **Changed: `npm install` in `client/Dockerfile`** — Initially I used `oven/bun:1-slim` with `npm install`, which failed because the Bun-based image does not include the `npm` binary. I switched to `bun install` for consistency with the Bun runtime, and added `bun.lock` to the copied dependency files.

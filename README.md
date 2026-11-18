# Docker Setup

This project uses Docker Compose to orchestrate three services:

- **db** — PostgreSQL 16 (port 5432)
- **core** — NestJS backend API (port 3000)
- **client** — Vite + React frontend served via nginx (port 80)

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (BuildKit enabled)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Environment files

Before running, copy the example environment files:

```bash
cp core/.env.example core/.env
cp client/.env.example client/.env
```

Edit them with your actual secrets (JWT secret, API keys, etc.).

## Commands

```bash
# Build all images
docker compose build

# Start all services in detached mode
docker compose up -d

# View logs
docker compose logs -f

# Stop and remove containers
docker compose down

# Rebuild and restart
docker compose up -d --build

# Run database migrations (inside the core container)
docker compose exec core bun run db:push

# Run tests
docker compose exec core bun run test
```

## Service URLs

| Service | URL |
|---------|-----|
| Client (frontend) | http://localhost |
| API (backend) | http://localhost:3000/api |
| PostgreSQL | localhost:5432 |

## Architecture

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  client │────►│   core  │────►│    db   │
│  port 80│     │ port 3000 │   │ port 5432│
└─────────┘     └─────────┘     └─────────┘
```

The client container proxies `/api` requests to the `core` service via nginx, so the frontend communicates with the backend over the internal Docker network (`http://core:3000/api`).

## Files

- `docker-compose.yml` — service definitions
- `core/Dockerfile` — NestJS backend (multi-stage build with Bun)
- `client/Dockerfile` — Vite frontend + nginx (multi-stage build)
- `client/nginx.conf` — nginx config serving static files and proxying `/api`
- `core/.dockerignore` / `client/.dockerignore` — exclude build artifacts and `.env`

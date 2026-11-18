# Fugo Creative — Docker Setup

Proyek ini terdiri dari dua aplikasi yang di-orchestrate dengan Docker Compose:

- **core** — Backend NestJS (API, port 3000)
- **client** — Frontend Vite + React disajikan melalui nginx (port 80)
- **db** — PostgreSQL 16 (port 5432)

## Cara menjalankan secara lokal

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (BuildKit diaktifkan)
- [Docker Compose](https://docs.docker.com/compose/install/)

### 1. Siapkan file environment

Salin file contoh dan isi nilai rahasia (JWT secret, API key, dll.):

```bash
cp core/.env.example core/.env
cp client/.env.example client/.env
```

### 2. Build dan jalankan semua layanan

```bash
# Build semua image
docker compose build

# Jalankan semua layanan di background
docker compose up -d

# Lihat log secara real-time
docker compose logs -f

# Matikan dan hapus container
docker compose down

# Build ulang dan restart
docker compose up -d --build
```

### 3. Jalankan migrasi database

```bash
docker compose exec core bun run db:push
```

### 4. Jalankan tes

```bash
docker compose exec core bun run test
```

## URL layanan

| Layanan | URL |
|---------|-----|
| Client (frontend) | http://localhost |
| API (backend) | http://localhost:3000/api |
| PostgreSQL | localhost:5432 |

## Daftar environment variable

### `core/.env`

| Variabel | Deskripsi | Contoh |
|----------|-----------|--------|
| `NODE_ENV` | Mode runtime aplikasi | `development` |
| `PORT` | Port yang digunakan core | `3000` |
| `CORS_ORIGINS` | Origin yang diizinkan CORS | `http://localhost:5173` |
| `DATABASE_URL` | Connection string PostgreSQL | `postgresql://postgres:postgres@db:5432/brief-manager` |
| `JWT_SECRET` | Kunci rahasia untuk signing JWT | string acak panjang |
| `OBSERVE_APP_KEY` | Kunci aplikasi NestJS Observe | — |
| `OBSERVE_APP_SECRET` | Secret aplikasi NestJS Observe | — |
| `OPENAI_API_KEY` | API key OpenAI | `sk-proj-...` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | API key Google Generative AI | `AIzaSy...` |

### `client/.env`

| Variabel | Deskripsi | Contoh |
|----------|-----------|--------|
| `VITE_API_URL` | Base URL API yang dipanggil frontend | `http://localhost:3000/api` |

> Catatan: File `.env` sudah termasuk di `.gitignore` dan tidak dicommit. Gunakan `.env.example` sebagai template.

## Arsitektur

```
┌─────────┐      ┌─────────┐      ┌─────────┐
│  client │─────►│   core  │─────►│    db   │
│ port 80 │      │ port 3000 │    │ port 5432│
└─────────┘      └─────────┘      └─────────┘
  nginx + Vite     NestJS API     PostgreSQL
```

- **client** → `core`: semua request yang diawali `/api` di-proxy oleh nginx ke `http://core:3000/api` melalui jaringan Docker internal (`app-network`).
- **core** → `db`: terhubung ke PostgreSQL melalui hostname `db` (service name di `docker-compose.yml`).
- Semua layanan saling terhubung melalui jaringan bridge `app-network`.

## Skema database (Drizzle ORM, PostgreSQL)

Tabel utama dan relasinya:

| Tabel | Keterangan |
|-------|------------|
| `users` | Akun pengguna (email, name, password_hash) |
| `briefs` | Klien brief (client_name, company_name, requirements, budget_range, target_timeline, pipeline_status) |
| `ai_processing_results` | Hasil pemrosesan AI per brief (ai_status, ai_summary, service_category, priority, dll.) |
| `ai_jobs` | Pekerjaan AI asynchronous (provider, status, attempts, max_attempts, error_message) |
| `missing_info_items` | Informasi yang hilang yang diekstrak dari hasil AI (item_text) |

Relasi utama:
- `briefs` → `ai_processing_results` (one-to-one, cascade delete)
- `ai_processing_results` → `missing_info_items` (one-to-many, cascade delete)
- `ai_jobs` → `briefs` (many-to-one, cascade delete)

Index ditambahkan pada kolom yang sering difilter: `pipeline_status`, `created_at`, `brief_id`, `status`, `ai_status`, `priority`, `service_category`, `ai_result_id`.

## Keputusan teknis dan trade-off

| Keputusan | Alasan | Trade-off |
|-----------|--------|-----------|
| **Bun** sebagai runtime & package manager | Install dan build lebih cepat dari npm, mendukung ESM native | Ecosystem sedikit lebih kecil dari Node.js/npm; beberapa alat masih mengasumsikan npm |
| **Multi-stage Docker build** | Image akhir hanya berisi artifact build + dependency production, ukuran image lebih kecil | Build memerlukan lebih banyak langkah; dependency development tidak tersedia di image akhir |
| **Nginx untuk client** | Serving static file Vite build dengan konfigurasi custom untuk proxy `/api` | Perlu maintain file `nginx.conf` terpisah; tidak ada HMR di production |
| **PostgreSQL + Drizzle ORM** | Tipe data yang kuat, migrasi type-safe, support enum dan JSONB | Memerlukan PostgreSQL; tidak ada opsi database lain tanpa penulisan ulang schema |
| **`depends_on` dengan condition `service_healthy`** | Memastikan `db` siap menerima koneksi sebelum `core` memulai | Menambah waktu startup; healthcheck perlu dikonfigurasi dengan benar |
| **Env via `env_file` di compose** | Tidak menyalin `.env` ke dalam image build (keamanan) | Perlu menyiapkan `.env` di host sebelum `docker compose up` |

## AI usage log

Tools yang digunakan dalam pembuatan setup ini:

- **`read` / `glob` / `grep`** — mengeksplorasi struktur proyek (`package.json`, `vite.config.ts`, `drizzle.config.ts`, skema database) sebelum menulis Dockerfile dan compose.
- **`write` / `edit`** — membuat `docker-compose.yml`, `Dockerfile`, `nginx.conf`, `.dockerignore`, `.env.example`, dan `README.md`.
- **`bash`** — memvalidasi `docker compose config`, mencoba `docker compose build`, dan mengecek versi Docker/Compose.

### Contoh koreksi / penolakan output

1. **Ditolak: `COPY .env .env` di `core/Dockerfile`** — Awalnya saya menyalin `.env` ke dalam image pada stage runner. Build gagal karena `.env` sudah ada di `.dockerignore` sehingga tidak tersedia di konteks build. Saya menghapus baris tersebut dan mengandalkan `env_file` dari `docker-compose.yml` agar secret tidak bocok ke image.

2. **Dikonfigurasi ulang: `npm install` di `client/Dockerfile`** — Awalnya menggunakan `oven/bun:1-slim` dengan `npm install`, yang gagal karena image berbasis Bun tidak menyertakan binary `npm`. Saya mengganti dengan `bun install` agar konsisten dengan runtime yang digunakan, dan menambahkan `bun.lock` ke dalam salinan file dependency.

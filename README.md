# Boilerplate NestJS

NestJS + Prisma + PostgreSQL boilerplate project.

## Tech Stack

- **NestJS** v11 (Node.js framework)
- **Prisma** v7 (ORM)
- **PostgreSQL** 17 (Database)
- **pnpm** (Package manager)

## Prerequisites

- Node.js >= 22
- pnpm >= 10
- PostgreSQL 17 (atau Docker)

---

## Cara 1: Pakai Docker (Recommended)

Tidak perlu install PostgreSQL manual — semua sudah di-handle Docker.

### Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Quick Start

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Build & jalankan semua
make up

# 3. Jalankan seeder (opsional)
make seed
```

App jalan di **http://localhost:3000** | Swagger docs di **http://localhost:3000/api/docs**

### Docker Commands (Makefile)

| Command         | Keterangan                        |
| --------------- | --------------------------------- |
| `make up`       | Build & start semua services      |
| `make down`     | Stop semua services               |
| `make restart`  | Restart semua services            |
| `make logs`     | Lihat log aplikasi                |
| `make logs-db`  | Lihat log database                |
| `make shell`    | Masuk shell container app         |
| `make shell-db` | Masuk psql console                |
| `make migrate`  | Jalankan database migration       |
| `make seed`     | Jalankan database seeder          |
| `make db-reset` | Hapus database & restart fresh    |

---

## Cara 2: Manual (Tanpa Docker)

### Requirements

- Node.js >= 22
- pnpm >= 10
- PostgreSQL 17 sudah terinstall & running

### Quick Start

```bash
# Jalankan script otomatis
chmod +x start.sh
./start.sh
```

### Atau step-by-step manual:

```bash
# 1. Copy & edit environment file
cp .env.example .env
# Sesuaikan DATABASE_URL di .env dengan PostgreSQL lokal kamu

# 2. Install dependencies
pnpm install

# 3. Generate Prisma client
pnpm prisma generate

# 4. Jalankan migration
pnpm prisma:migrate:prod

# 5. Jalankan seeder (opsional)
pnpm prisma:seed

# 6. Start development
pnpm start:dev
```

### Available Scripts

| Command                  | Keterangan                      |
| ------------------------ | ------------------------------- |
| `pnpm start:dev`         | Start development (watch mode)  |
| `pnpm start:prod`        | Start production                |
| `pnpm build`             | Build project                   |
| `pnpm prisma:generate`   | Generate Prisma client          |
| `pnpm prisma:migrate`    | Run migration (development)     |
| `pnpm prisma:migrate:prod` | Run migration (production)    |
| `pnpm prisma:seed`       | Run database seeder             |
| `pnpm prisma:studio`     | Open Prisma Studio (GUI)        |
| `pnpm test`              | Run unit tests                  |
| `pnpm test:e2e`          | Run e2e tests                   |

---

## Environment Variables

Lihat `.env.example` untuk daftar lengkap environment variables yang dibutuhkan.

| Variable              | Keterangan                  | Default                       |
| --------------------- | --------------------------- | ----------------------------- |
| `NODE_ENV`            | Environment                 | `development`                 |
| `APP_PORT`            | Port aplikasi               | `3000`                        |
| `DATABASE_URL`        | PostgreSQL connection string| `postgresql://postgres:postgres@localhost:5432/nestjs_boilerplate` |
| `JWT_ACCESS_SECRET`   | JWT access token secret     | -                             |
| `JWT_REFRESH_SECRET`  | JWT refresh token secret    | -                             |
| `SWAGGER_ENABLED`     | Aktifkan Swagger docs       | `true`                        |

---

## Deploy ke Server (Ubuntu)

```bash
# 1. Install Docker di server
# https://docs.docker.com/engine/install/ubuntu/

# 2. Clone/upload project
git clone <repo-url> ~/app && cd ~/app

# 3. Setup environment
cp .env.example .env
nano .env  # sesuaikan untuk production

# 4. Start
make up
```

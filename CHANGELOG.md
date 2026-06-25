# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-06-25

Rilis awal **Lapak Tani — Backend**. Fondasi boilerplate NestJS dengan arsitektur
**modular monolith** sebagai basis pengembangan modul marketplace berikutnya.

### Arsitektur

- **Modular monolith** — tiap modul punya batas publik (`*Contract` abstrak) + barrel `index.ts`; komunikasi antar-modul hanya lewat contract, bukan internal
- **Pola Contract / Service / Repository** per modul — akses Prisma terkurung di repository pemilik tabel (data ownership)
- **Abstraksi infrastruktur** — `StorageContract` + `LocalDiskStorage` (siap diganti MinIO/S3 tanpa mengubah use-case)
- Konvensi struktur folder-per-peran (`dto/`, `repository/`, `mapper/`, `use-cases/`, `storage/`)

### Modul

- **Auth** — login, refresh token rotation, logout, change password, forgot/reset password, email verification (Passport JWT access + refresh); akses data user via `UserContract`; `AuthRepository` pemilik tabel `refresh_tokens`
- **User** — CRUD user + profil, RBAC (Role/Permission/RolePermission), soft delete, pagination; `UserContract` (termasuk API untuk auth), `UserRepository` pemilik `users`/`profiles`
- **File** — upload & delete file (multipart) dengan validasi mimetype/ukuran; `FileContract` + `FileRepository` pemilik tabel `files`; penyimpanan via `StorageContract`
- **Email** — pengiriman email (Nodemailer), dapat dimatikan via `EMAIL_ENABLED`

### Common & Infrastruktur

- Response interceptor (format seragam `{ status, statusCode, message, data, meta?, links? }`)
- Global exception filter (env-aware: stack trace hanya di dev)
- Roles guard + decorator `@Public()`, `@Roles()`, `@CurrentUser()`, `@ResponseMessage()`
- Pagination DTO (`PageOptionsDto`, `PageMetaDto`, `PageLinksDto`)
- JWT auth guard global, rate limiting (Throttler, default 120 req/menit/IP), Helmet
- Swagger/OpenAPI (`/api/docs`, nonaktif di production kecuali `SWAGGER_ENABLED=true`)
- Pino logger (pretty di dev, JSON di prod), multi-environment (`.env.{NODE_ENV}` + `.env`)

### Database & DevOps

- Prisma 7 + PostgreSQL 17, migration `init`, seeder (permissions + role ADMIN/USER + admin user)
- Docker (`Dockerfile` multi-stage, `docker-compose.yml`, `Makefile`) — `make up` build + migrate + seed otomatis
- Deployment guide (Docker/Caddy & PM2/nginx)

### Tech Stack

- NestJS 11 · Prisma 7 · PostgreSQL 17 · pnpm · Node.js 22

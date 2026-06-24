# Changelog

All notable changes to this project will be documented in this file.

## [3.6.0] - 2026-03-24

### Added

- **Docker support** — `Dockerfile` (multi-stage build), `docker-compose.yml` (app + PostgreSQL), `.dockerignore`
- **Makefile** — quick commands: `make up`, `make down`, `make logs`, `make shell`, `make migrate`, `make seed`, dll
- **`start.sh`** — script untuk setup & jalankan app secara manual tanpa Docker
- **README.md** — rewrite dengan panduan 2 cara deployment (Docker & Manual), environment variables, dan deploy ke Ubuntu

## [3.5.0] - 2026-03-22

### Added

- **Division module** — full CRUD for division management (`/divisions`)
- `Division` Prisma model with team relationships

## [3.4.0] - 2026-03-17

### Added

- **Laporan Kinerja OP** — new report template replacing old "Laporan Kinerja Rutin"
- `ReportLokasi` model (pivot table between Report and WorkLocation) with `kegiatan`, `panjang`, `lebar` fields
- 13 new columns on Report model: `weekNumber`, `deskripsiKegiatan`, `kondisiCuaca`, `waktuMulai`, `waktuSelesai`, 7 peralatan columns (`peralatanCangkul`, `peralatanParang`, `peralatanPes`, `peralatanLori`, `peralatanCatut`, `peralatanPalu`, `peralatanGarpu`), 3 tenaga kerja columns (`tenagaPengawas`, `tenagaPekerja`, `tenagaKorlap`)
- `label` field on ReportPhoto model for photo categorization (Progress 0%/50%/100%, Absen Datang/Pulang)
- Photo slots increased from 6 to 8 (6 progress + 2 absen)
- `ReportLokasiDto` with nested validation in CreateReportDto
- `photoLabels` field in CreateReportDto/UpdateReportDto
- Lokasi array with workLocation name/address in ReportResponseDto

### Changed

- **PDF template (2 pages):** Page 1 — title, meta (minggu ke, tanggal, deskripsi), Section A (Lokasi table), Section B (Peralatan), Section C (Tenaga Kerja), Section D (Waktu Kerja), Section E (Kondisi Cuaca), 4 signatures. Page 2 — kop surat, 6 progress photos (labeled 0%/50%/100%), 2 absen photos
- `ReportService.create()` / `update()` — handle new fields, ReportLokasi CRUD, photo labels, workLocation validation
- `ReportService.mapToResponse()` — include all new fields + lokasi with workLocation details
- PDF preview sample data updated with new template fields
- Reusable `drawTable()` helper in PdfService for all table sections

## [3.3.0] - 2026-03-15

### Added

- `POST /auth/verify-email` — verify email address using token from email (public endpoint)
- `POST /auth/resend-verification` — resend email verification link (public endpoint, never reveals if email exists)
- `SendVerificationEmailUseCase` — generates SHA-256 hashed token with 24h expiry, stores in `EmailVerificationToken` table
- `VerifyEmailUseCase` — validates token, sets `emailVerifiedAt`, marks token as used
- `ResendVerificationUseCase` — resends verification email for unverified users
- `EmailVerificationToken` Prisma model with `token`, `expiresAt`, `usedAt` fields
- `emailVerifiedAt` field on User model
- `sendVerificationEmail()` method on `EmailService`

### Changed

- `RegisterUseCase` — when `EMAIL_ENABLED=true`: sends verification email, returns message instead of JWT tokens. When `false`: auto-verifies user, returns JWT tokens as before
- `LoginUseCase` — blocks login with 403 if email is not verified

## [3.2.0] - 2026-03-15

### Added

- `POST /auth/forgot-password` — request password reset email (public endpoint, never reveals if email exists)
- `POST /auth/reset-password` — reset password using token from email (public endpoint)
- `ForgotPasswordUseCase` — generates SHA-256 hashed token with 30-min expiry, stores in `PasswordResetToken` table
- `ResetPasswordUseCase` — validates token, updates password, marks token as used, revokes all refresh tokens
- `EmailModule` (global) with Nodemailer integration for sending password reset emails
- `EMAIL_ENABLED` env flag — when `false`, logs reset URL to console instead of sending email via SMTP
- `PasswordResetToken` Prisma model with `token`, `expiresAt`, `usedAt` fields
- Email configuration (`email.config.ts`) with SMTP settings
- Environment validation for optional email variables

## [3.1.0] - 2026-03-12

### Added

- `GET /auth/me` — get current authenticated user profile from JWT token
- `PATCH /auth/change-password` — change own password with old password verification, revokes all refresh tokens after change
- `ChangePasswordDto` with old password + new password (min 6 chars) validation

## [3.0.0] - 2026-03-12

### Changed

- **BREAKING:** Refactor all modules from monolithic service to UseCase pattern (`Controller → UseCase.execute()`)
- Auth module: `AuthService` replaced by `RegisterUseCase`, `LoginUseCase`, `RefreshTokenUseCase`, `LogoutUseCase` + shared `TokenService`
- User module: `UserService` replaced by `FindAllUsersUseCase`, `FindUserByIdUseCase`, `CreateUserUseCase`, `UpdateUserUseCase`, `UpdateProfileUseCase`, `RemoveUserUseCase`
- Upload module: `UploadService` replaced by `UploadFileUseCase`, `DeleteFileUseCase`

### Added

- `PATCH /users/me` — update own profile (fullName, phone, address) using JWT token
- `UpdateProfileDto` — dedicated DTO for self-profile update (no email/password/roleId)
- `TokenService` — shared service for JWT generation, refresh token storage, and hashing
- `DEPLOYMENT.md` — deployment guide for PM2, Docker PostgreSQL, and Caddy

### Removed

- `AuthService`, `UserService`, `UploadService` — all logic moved to individual UseCase classes

## [2.2.0] - 2026-03-11

### Added

- Attendance module with check-in / check-out flow
  - `POST /attendance` — submit own attendance
  - `POST /attendance/on-behalf/:userId` — team leader / admin proxy attendance
  - `GET /attendance/me` — own attendance history
  - `GET /attendance` — all records (admin only)
- Operational hours management
  - `GET /attendance/operational-hours` — view schedule
  - `PUT /attendance/operational-hours` — bulk upsert (admin only)
- `Attendance` and `OperationalHour` Prisma models
- Business rules: operational hour validation, duplicate prevention, CHECK_OUT requires CHECK_IN, selfie file ownership check
- `PETUGAS` and `TEAM_LEADER` roles in seed
- Default operational hours seed (Mon–Fri 07:00–17:00)

## [2.1.0] - 2026-03-11

### Added

- File upload module (`POST /upload`, `DELETE /upload/:id`)
- `File` Prisma model with user relation
- Multer disk storage with date-based directories and UUID filenames
- `secureUrl` in upload response (dynamic `protocol://host` prefix)
- Static file serving via `app.useStaticAssets()`
- Storage config (`FILE_UPLOAD_DEST`, `FILE_UPLOAD_MAX_SIZE`)

## [2.0.0] - 2026-03-04

### Changed

- **BREAKING:** Replace `Role` enum with `Role` model (table-based RBAC with permissions)
- **BREAKING:** Move `refreshToken` field from User to separate `RefreshToken` model with expiry and revocation tracking
- **BREAKING:** Move `name` field from User to `Profile.fullName`
- **BREAKING:** Register DTO field `name` renamed to `fullName`
- Refresh token hashing changed from bcrypt to SHA-256 (exact match lookup)
- User delete changed from hard delete to soft delete (`deletedAt`)

### Added

- `Profile` model (1:1 with User): `fullName`, `phone`, `address`, `avatarUrl`, `birthDate`, `gender`
- `Permission` and `RolePermission` models for granular RBAC
- RBAC module with CRUD endpoints for roles and permissions (`/rbac/roles`, `/rbac/permissions`)
- `isActive` and `passwordChangedAt` fields on User
- Seed: 8 default permissions, ADMIN role (all permissions), USER role (`user:read`)
- Active/deleted user checks in auth strategies (login, JWT validation)

## [1.0.1] - 2026-03-04

### Fixed

- Resolve Prisma 7 compatibility issues (driver adapter requirement, ESM/CJS runtime conflicts)
- Switch from custom Prisma output to default `@prisma/client` to fix `exports is not defined` runtime error
- Add env-aware dotenv loading in `prisma.config.ts` and `prisma/seed.ts`
- Switch seed runner from `ts-node` to `tsx` for ESM compatibility
- Add `@ApiBearerAuth()` decorator to auth and user controllers so Swagger sends Authorization header

## [1.0.0] - 2026-03-04

### Added

- Prisma seed with default admin user
- Bootstrap config in `main.ts` (global prefix, validation pipe, CORS)
- NPM scripts for prisma and multi-env workflow
- Swagger UI with env-conditional loading (disabled in production)
- Pino logger with env-aware formatting (pretty for dev, JSON for prod)

### Fixed

- Resolve TypeScript build errors

## [0.4.0] - 2026-03-03

### Added

- User module with full CRUD operations
- Pagination support with `PageOptionsDto`, `PageMetaDto`, `PageLinksDto`
- Role-based access control on create/delete user endpoints (ADMIN only)
- User response mapper for safe serialization

## [0.3.0] - 2026-03-03

### Added

- Auth module with register, login, logout, and refresh endpoints
- JWT access token + refresh token rotation strategy
- Passport strategies for `jwt` and `jwt-refresh`
- Auth DTOs (login, register, refresh token) with validation
- Auth response mapper

## [0.2.0] - 2026-03-03

### Added

- Global HTTP exception filter with consistent error response
- Response interceptor with auto-pagination metadata
- Roles guard for RBAC
- Custom decorators: `@Public()`, `@Roles()`, `@CurrentUser()`, `@ResponseMessage()`
- Pagination DTOs (`PageOptionsDto`, `PageMetaDto`, `PageLinksDto`)

## [0.1.0] - 2026-03-03

### Added

- NestJS project scaffold with core dependencies
- ConfigModule with multi-environment support (`.env.{NODE_ENV}`)
- Config modules for app, database, and JWT settings
- Environment validation schema with Joi
- Prisma setup with user model (id, name, email, password, role, refreshToken)
- PrismaService and PrismaModule (global)

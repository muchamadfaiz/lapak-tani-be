# NestJS Boilerplate Plan

## Context
Membuat NestJS boilerplate dari nol dengan stack modern: PostgreSQL + Prisma, JWT Auth (access + refresh token), RBAC, Swagger, logging, config module, dan **multi-environment support**. Package manager: pnpm.

## Tech Stack
- **Runtime**: Node.js + NestJS 11
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Passport JWT (access + refresh token)
- **Docs**: Swagger/OpenAPI via `@nestjs/swagger`
- **Logger**: Pino (via `nestjs-pino`) — performant, structured JSON logging
- **Config**: `@nestjs/config` + `class-validator` untuk env validation
- **Package Manager**: pnpm

---

## Multi-Environment Strategy

Menggunakan `@nestjs/config` dengan file `.env` per environment:

```
.env                    # Default / shared (di-load selalu)
.env.development        # Dev overrides (local)
.env.staging            # Staging overrides
.env.production         # Production overrides
.env.example            # Template referensi (committed ke git)
```

**Cara kerja:**
- `NODE_ENV` menentukan environment aktif
- `ConfigModule` load `.env` + `.env.{NODE_ENV}` (env-specific override yang shared)
- Semua `.env*` kecuali `.env.example` masuk `.gitignore`
- Env validation via `class-validator` — app gagal start kalau env tidak lengkap
- Config dibagi per domain: `app`, `database`, `jwt` — akses via `configService.get('app.port')`

**Behavior per environment:**
| Feature         | Development        | Staging            | Production         |
|-----------------|--------------------|--------------------|---------------------|
| Swagger         | Enabled            | Enabled            | Disabled            |
| Logger format   | Pretty (colorized) | JSON               | JSON                |
| Log level       | debug              | log                | warn                |
| CORS            | Allow all          | Whitelist          | Whitelist           |
| Stack trace     | Shown in response  | Hidden             | Hidden              |

---

## Struktur Folder

```
src/
├── app.module.ts
├── main.ts
├── common/
│   ├── decorators/            # @Public(), @Roles(), @CurrentUser(), @ResponseMessage()
│   ├── dto/                   # Shared DTOs (PageOptionsDto, PageMetaDto)
│   ├── guards/                # RolesGuard
│   ├── filters/               # HttpExceptionFilter (env-aware: stack trace dev only)
│   ├── interceptors/          # ResponseInterceptor (wrap semua response)
│   └── types/                 # Shared types/interfaces
├── config/
│   ├── app.config.ts          # port, env, cors origins
│   ├── database.config.ts     # DATABASE_URL
│   ├── jwt.config.ts          # secret, access/refresh expiry
│   └── env.validation.ts      # Validate semua env vars saat bootstrap
├── prisma/
│   ├── prisma.module.ts       # Global PrismaModule
│   └── prisma.service.ts      # PrismaService (extends PrismaClient)
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   ├── register.dto.ts
│   │   │   ├── refresh-token.dto.ts
│   │   │   └── auth-response.dto.ts
│   │   ├── mapper/
│   │   │   └── auth.mapper.ts       # User -> AuthResponseDto (tokens + user info)
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── jwt-refresh.strategy.ts
│   │   └── guards/
│   │       └── jwt-auth.guard.ts
│   └── user/
│       ├── user.module.ts
│       ├── user.controller.ts
│       ├── user.service.ts
│       ├── dto/
│       │   ├── create-user.dto.ts
│       │   ├── update-user.dto.ts
│       │   └── user-response.dto.ts
│       └── mapper/
│           └── user.mapper.ts
prisma/
│   ├── schema.prisma          # User model + Role enum
│   └── seed.ts                # Seed admin user
.env.example
.env.development
.env.staging
.env.production
.gitignore
docker-compose.yml             # PostgreSQL service
tsconfig.json
nest-cli.json
package.json
```

---

## Response Format

### Success (tanpa pagination)
```json
{
  "status": true,
  "statusCode": 200,
  "message": "Success get user",
  "data": { "id": "...", "email": "..." }
}
```

### Success (dengan pagination)
```json
{
  "status": true,
  "statusCode": 200,
  "message": "Success get users",
  "data": [],
  "meta": {
    "page": {
      "itemPerPage": 10,
      "currentPage": 1,
      "totalPages": 5,
      "totalData": 50
    }
  },
  "links": {
    "first": "/users?page=1&limit=10",
    "last": "/users?page=5&limit=10",
    "next": "/users?page=2&limit=10",
    "prev": null
  }
}
```

### Error
```json
{
  "status": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["email must be an email"]
}
```

### Cara Pakai di Controller
```ts
@Get()
@ResponseMessage('Success get all users')
findAll(@Query() query: PageOptionsDto) {
  return this.userService.findAll(query);
}
```

---

## Naming Convention
- **Database** (PostgreSQL): `snake_case` — table `users`, kolom `refresh_token`, `created_at`
- **Code** (TypeScript): `camelCase` — `user.refreshToken`, `user.createdAt`
- **API Response** (JSON): `camelCase` — `"refreshToken"`, `"createdAt"`
- Prisma `@map()` dan `@@map()` digunakan untuk bridging DB ↔ code

---

## Git Strategy

### Branch Model
```
main                          # production-ready code
└── develop                   # integration branch
    ├── feature/init-project
    ├── feature/config-env
    ├── feature/prisma-setup
    ├── feature/common-layer
    ├── feature/auth-module
    ├── feature/user-module
    ├── feature/swagger
    ├── feature/logger
    └── feature/seed-scripts
```

### Squash Merge Order ke `develop`
```
1. feature/init-project    → develop  "chore: scaffold nestjs project and install dependencies"
2. feature/config-env      → develop  "feat: add config modules with multi-env support"
3. feature/prisma-setup    → develop  "feat: add prisma setup with user model"
4. feature/common-layer    → develop  "feat: add common layer (interceptor, filter, guards, decorators)"
5. feature/auth-module     → develop  "feat: add auth module with JWT token rotation"
6. feature/user-module     → develop  "feat: add user module with CRUD and pagination"
7. feature/swagger         → develop  "feat: setup swagger with env-conditional loading"
8. feature/logger          → develop  "feat: setup pino logger with env-aware formatting"
9. feature/seed-scripts    → develop  "feat: add seed, bootstrap config, and npm scripts"
10. develop                → main     (release merge)
```

---

## Tagging Strategy

Pakai **Semantic Versioning** (`vMAJOR.MINOR.PATCH`):

| Tag | Kapan | Deskripsi |
|---|---|---|
| `v0.1.0` | Setelah init-project + config-env + prisma-setup merge ke develop | Project foundation |
| `v0.2.0` | Setelah common-layer merge ke develop | Common layer ready |
| `v0.3.0` | Setelah auth-module merge ke develop | Auth system ready |
| `v0.4.0` | Setelah user-module merge ke develop | CRUD example ready |
| `v0.5.0` | Setelah swagger + logger merge ke develop | DX tools ready |
| `v1.0.0` | Setelah seed-scripts merge + develop → main | Boilerplate complete |

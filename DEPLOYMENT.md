# Deployment Guide

## Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- PM2 (`npm install -g pm2`)
- Docker (untuk PostgreSQL)

## 1. Clone Repository

```bash
git clone <repo-url> /var/www/lapak-tani-be
cd /var/www/lapak-tani-be
```

## 2. Jalankan PostgreSQL via Docker

```bash
docker run -d \
  --name postgres-lapak-tani \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=gantiPasswordIni \
  -e POSTGRES_DB=lapak_tani \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  --restart unless-stopped \
  postgres:16
```

## 3. Setup Environment

```bash
cp .env.example .env.production
nano .env.production
```

Isi yang wajib diubah:

```env
NODE_ENV=production
APP_PORT=3000
APP_CORS_ORIGINS=https://domain-frontend.com
SWAGGER_ENABLED=true

DATABASE_URL=postgresql://postgres:gantiPasswordIni@localhost:5432/lapak_tani?schema=public

JWT_ACCESS_SECRET=<generate: openssl rand -hex 32>
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_SECRET=<generate: openssl rand -hex 32>
JWT_REFRESH_EXPIRATION=7d

FILE_UPLOAD_DEST=./uploads
FILE_UPLOAD_MAX_SIZE=5242880
```

> Generate random secret: `openssl rand -hex 32`

## 4. Install, Migrate, Build

```bash
pnpm install --frozen-lockfile
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
pnpm build
mkdir -p uploads
```

## 5. Start dengan PM2

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

Cek status:

```bash
pm2 status
pm2 logs lapak-tani-api
```

## 6. (Optional) Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.domain.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        alias /var/www/lapak-tani-be/uploads/;
    }
}
```

Lalu aktifkan:

```bash
sudo ln -s /etc/nginx/sites-available/lapak-tani-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Update Deployment

```bash
cd /var/www/lapak-tani-be
git pull
pnpm install --frozen-lockfile
npx prisma generate
npx prisma migrate deploy
pnpm build
pm2 restart lapak-tani-api
```

## Useful Commands

| Command | Deskripsi |
|---------|-----------|
| `pm2 status` | Cek status app |
| `pm2 logs lapak-tani-api` | Lihat logs |
| `pm2 restart lapak-tani-api` | Restart app |
| `pm2 stop lapak-tani-api` | Stop app |
| `pm2 delete lapak-tani-api` | Hapus dari PM2 |
| `npx prisma studio` | Buka DB GUI (dev only) |

## Default Admin Login

- **Email**: `admin@example.com`
- **Password**: `admin123`

> Segera ganti password admin setelah deploy!

## Swagger

Akses Swagger UI di: `http://<IP-server>:3000/api/docs`

Untuk disable Swagger, set `SWAGGER_ENABLED=false` di `.env.production` lalu restart PM2.

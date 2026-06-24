#!/bin/bash

# =============================================
#  Boilerplate NestJS - Manual Start (No Docker)
# =============================================

set -e

# Setup .env if not exists
if [ ! -f .env ] || [ ! -s .env ]; then
  echo "[1/5] Creating .env from .env.example..."
  cp .env.example .env
  echo "      Edit .env sesuai kebutuhan: nano .env"
else
  echo "[1/5] .env already exists, skipping..."
fi

# Install dependencies
echo "[2/5] Installing dependencies..."
pnpm install

# Generate Prisma client
echo "[3/5] Generating Prisma client..."
pnpm prisma generate

# Run migrations
echo "[4/5] Running database migrations..."
pnpm prisma:migrate:prod

# Seed database (optional)
read -p "[5/5] Run database seeder? (y/n): " run_seed
if [ "$run_seed" = "y" ]; then
  pnpm prisma:seed
fi

# Start app
echo ""
echo "========================================="
echo "  Starting app in development mode..."
echo "========================================="
pnpm start:dev

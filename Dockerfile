# ---- Base ----
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate
WORKDIR /app

# ---- Build ----
FROM base AS build
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
COPY prisma.config.ts tsconfig.json ./
RUN pnpm install --frozen-lockfile
RUN pnpm prisma generate
COPY . .
RUN pnpm build

# ---- Production ----
FROM node:22-alpine AS production
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY package.json prisma.config.ts tsconfig.json ./
RUN mkdir -p uploads logs

ENV NODE_ENV=production

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && node dist/src/main"]

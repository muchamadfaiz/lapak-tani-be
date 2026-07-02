-- CreateTable
CREATE TABLE "wa_login_sessions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wa_login_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wa_login_sessions_code_key" ON "wa_login_sessions"("code");

-- CreateIndex
CREATE INDEX "wa_login_sessions_status_idx" ON "wa_login_sessions"("status");

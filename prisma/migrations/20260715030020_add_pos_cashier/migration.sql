-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "amountPaid" INTEGER,
ADD COLUMN     "shiftId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'online';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "outletId" TEXT;

-- CreateTable
CREATE TABLE "cashier_shifts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "openingCash" INTEGER NOT NULL DEFAULT 0,
    "closingCash" INTEGER,
    "note" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "cashier_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cashier_shifts_outletId_status_idx" ON "cashier_shifts"("outletId", "status");

-- CreateIndex
CREATE INDEX "cashier_shifts_userId_status_idx" ON "cashier_shifts"("userId", "status");

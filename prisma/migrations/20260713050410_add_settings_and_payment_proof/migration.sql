-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "paymentProofAt" TIMESTAMP(3),
ADD COLUMN     "paymentProofUrl" TEXT;

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

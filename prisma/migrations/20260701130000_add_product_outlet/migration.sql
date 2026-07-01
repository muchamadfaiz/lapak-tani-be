-- CreateTable
CREATE TABLE "product_outlets" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_outlets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_outlets_outletId_idx" ON "product_outlets"("outletId");

-- CreateIndex
CREATE UNIQUE INDEX "product_outlets_productId_outletId_key" ON "product_outlets"("productId", "outletId");

-- AddForeignKey
ALTER TABLE "product_outlets" ADD CONSTRAINT "product_outlets_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill (JANGAN sampai data hilang): buat baris stok untuk SETIAP produk x
-- SETIAP outlet. Outlet asal produk mewarisi stok lama; outlet lain mulai 0.
INSERT INTO "product_outlets" ("id", "productId", "outletId", "stock", "updatedAt")
SELECT gen_random_uuid(), p."id", o."id",
       CASE WHEN o."id" = p."outletId" THEN p."stock" ELSE 0 END,
       NOW()
FROM "products" p
CROSS JOIN "outlets" o;

-- DropIndex
DROP INDEX "products_outletId_idx";

-- AlterTable (kolom lama dibuang SETELAH data dipindahkan)
ALTER TABLE "products" DROP COLUMN "outletId",
DROP COLUMN "stock";

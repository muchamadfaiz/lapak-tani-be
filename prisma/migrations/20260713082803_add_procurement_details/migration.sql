-- CreateTable
CREATE TABLE "stock_procurements" (
    "id" TEXT NOT NULL,
    "procurementNumber" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "supplier" TEXT,
    "invoiceNumber" TEXT,
    "note" TEXT,
    "totalCost" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_procurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_procurement_items" (
    "id" TEXT NOT NULL,
    "procurementId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitCost" INTEGER,
    "subtotalCost" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "stock_procurement_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_procurements_procurementNumber_key" ON "stock_procurements"("procurementNumber");

-- CreateIndex
CREATE INDEX "stock_procurements_outletId_createdAt_idx" ON "stock_procurements"("outletId", "createdAt");

-- CreateIndex
CREATE INDEX "stock_procurement_items_procurementId_idx" ON "stock_procurement_items"("procurementId");

-- AddForeignKey
ALTER TABLE "stock_procurement_items" ADD CONSTRAINT "stock_procurement_items_procurementId_fkey" FOREIGN KEY ("procurementId") REFERENCES "stock_procurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

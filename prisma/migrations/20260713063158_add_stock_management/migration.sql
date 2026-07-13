-- AlterTable
ALTER TABLE "outlets" ADD COLUMN     "isWarehouse" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "stock_shipments" (
    "id" TEXT NOT NULL,
    "shipmentNumber" TEXT NOT NULL,
    "fromOutletId" TEXT NOT NULL,
    "toOutletId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "note" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_shipment_items" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "stock_shipment_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "refType" TEXT,
    "refId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_shipments_shipmentNumber_key" ON "stock_shipments"("shipmentNumber");

-- CreateIndex
CREATE INDEX "stock_shipments_toOutletId_status_idx" ON "stock_shipments"("toOutletId", "status");

-- CreateIndex
CREATE INDEX "stock_shipments_fromOutletId_idx" ON "stock_shipments"("fromOutletId");

-- CreateIndex
CREATE INDEX "stock_shipment_items_shipmentId_idx" ON "stock_shipment_items"("shipmentId");

-- CreateIndex
CREATE INDEX "stock_movements_outletId_createdAt_idx" ON "stock_movements"("outletId", "createdAt");

-- CreateIndex
CREATE INDEX "stock_movements_productId_createdAt_idx" ON "stock_movements"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "outlets_isWarehouse_idx" ON "outlets"("isWarehouse");

-- AddForeignKey
ALTER TABLE "stock_shipment_items" ADD CONSTRAINT "stock_shipment_items_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "stock_shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

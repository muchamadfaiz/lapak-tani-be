import { Injectable } from '@nestjs/common';
import {
  Prisma,
  StockMovement,
  StockProcurement,
  StockProcurementItem,
  StockShipment,
  StockShipmentItem,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export type ShipmentWithItems = StockShipment & { items: StockShipmentItem[] };
export type ProcurementWithItems = StockProcurement & {
  items: StockProcurementItem[];
};

export interface MovementFilter {
  outletId?: string;
  productId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ShipmentFilter {
  toOutletId?: string;
  fromOutletId?: string;
  status?: string;
}

/**
 * Pemilik tunggal tabel `stock_shipments`, `stock_shipment_items`, dan
 * `stock_movements`. Perubahan stok itu sendiri TIDAK di sini — itu milik modul
 * Product (product_outlets), diakses lewat ProductContract.
 */
@Injectable()
export class StockRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Pengadaan ──
  createProcurement(data: {
    procurementNumber: string;
    outletId: string;
    supplier?: string;
    invoiceNumber?: string;
    note?: string;
    totalCost: number;
    items: {
      productId: string;
      productName: string;
      quantity: number;
      unitCost?: number;
      subtotalCost: number;
    }[];
  }): Promise<ProcurementWithItems> {
    return this.prisma.stockProcurement.create({
      data: {
        procurementNumber: data.procurementNumber,
        outletId: data.outletId,
        supplier: data.supplier,
        invoiceNumber: data.invoiceNumber,
        note: data.note,
        totalCost: data.totalCost,
        items: { create: data.items },
      },
      include: { items: true },
    });
  }

  findProcurementsAndCount(
    outletId: string | undefined,
    opts: { skip: number; take: number },
  ): Promise<[ProcurementWithItems[], number]> {
    const where = outletId ? { outletId } : undefined;
    return this.prisma.$transaction([
      this.prisma.stockProcurement.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: opts.skip,
        take: opts.take,
      }),
      this.prisma.stockProcurement.count({ where }),
    ]);
  }

  // ── Kiriman ──
  createShipment(data: {
    shipmentNumber: string;
    fromOutletId: string;
    toOutletId: string;
    note?: string;
    items: { productId: string; productName: string; quantity: number }[];
  }): Promise<ShipmentWithItems> {
    return this.prisma.stockShipment.create({
      data: {
        shipmentNumber: data.shipmentNumber,
        fromOutletId: data.fromOutletId,
        toOutletId: data.toOutletId,
        note: data.note,
        status: 'sent',
        items: { create: data.items },
      },
      include: { items: true },
    });
  }

  findShipmentById(id: string): Promise<ShipmentWithItems | null> {
    return this.prisma.stockShipment.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  findShipmentsAndCount(
    filter: ShipmentFilter,
    opts: { skip: number; take: number },
  ): Promise<[ShipmentWithItems[], number]> {
    const where: Prisma.StockShipmentWhereInput = {
      ...(filter.toOutletId && { toOutletId: filter.toOutletId }),
      ...(filter.fromOutletId && { fromOutletId: filter.fromOutletId }),
      ...(filter.status && { status: filter.status }),
    };
    return this.prisma.$transaction([
      this.prisma.stockShipment.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: opts.skip,
        take: opts.take,
      }),
      this.prisma.stockShipment.count({ where }),
    ]);
  }

  setShipmentStatus(
    id: string,
    status: string,
    at?: Date,
  ): Promise<ShipmentWithItems> {
    return this.prisma.stockShipment.update({
      where: { id },
      data: {
        status,
        ...(status === 'received' && { receivedAt: at ?? new Date() }),
      },
      include: { items: true },
    });
  }

  // ── Buku besar ──
  async recordMovements(
    rows: {
      productId: string;
      outletId: string;
      type: string;
      quantity: number;
      refType?: string;
      refId?: string;
      note?: string;
    }[],
  ): Promise<void> {
    if (rows.length === 0) return;
    await this.prisma.stockMovement.createMany({ data: rows });
  }

  findMovementsAndCount(
    filter: MovementFilter,
    opts: { skip: number; take: number },
  ): Promise<[StockMovement[], number]> {
    const where: Prisma.StockMovementWhereInput = {
      ...(filter.outletId && { outletId: filter.outletId }),
      ...(filter.productId && { productId: filter.productId }),
      ...((filter.dateFrom || filter.dateTo) && {
        createdAt: {
          ...(filter.dateFrom && { gte: filter.dateFrom }),
          ...(filter.dateTo && { lte: filter.dateTo }),
        },
      }),
    };
    return this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: opts.skip,
        take: opts.take,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);
  }
}

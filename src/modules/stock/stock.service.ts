import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StockMovement } from '@prisma/client';
import { OutletContract } from '../outlet';
import { ProductContract } from '../product';
import {
  ProcurementWithItems,
  ShipmentWithItems,
  StockRepository,
} from './repository/stock.repository';
import { StockContract, StockLine } from './stock.contract';
import {
  CreateProcurementDto,
  CreateShipmentDto,
  FindMovementsQueryDto,
  FindShipmentsQueryDto,
  StockItemDto,
} from './dto';

/** LT-SHP-20260713-1234 / LT-PRC-20260713-1234 */
function generateNumber(prefix: string): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LT-${prefix}-${ymd}-${rand}`;
}

/**
 * Manajemen stok (MVP): pengadaan ke gudang, kirim gudang→outlet, terima di
 * outlet, plus buku besar (riwayat).
 *
 * Perubahan stok TIDAK ditulis langsung ke tabel — selalu lewat ProductContract
 * (pemilik product_outlets), agar tak ada dua sumber kebenaran stok.
 */
@Injectable()
export class StockService extends StockContract {
  constructor(
    private readonly repo: StockRepository,
    private readonly outletContract: OutletContract,
    private readonly productContract: ProductContract,
  ) {
    super();
  }

  /**
   * Barang masuk (pengadaan) → simpan nota (supplier + harga modal), stok
   * gudang/outlet naik, lalu catat buku besar.
   */
  async createProcurement(dto: CreateProcurementDto): Promise<ProcurementWithItems> {
    const outlet = await this.outletContract.findById(dto.outletId);
    if (!outlet) throw new NotFoundException('Outlet/gudang tidak ditemukan');

    const resolved = await this.resolveItems(dto.items);
    const items = resolved.map((r, idx) => {
      const unitCost = dto.items[idx].unitCost;
      return {
        ...r,
        unitCost,
        subtotalCost: unitCost ? unitCost * r.quantity : 0,
      };
    });
    const totalCost = items.reduce((s, i) => s + i.subtotalCost, 0);

    const procurement = await this.repo.createProcurement({
      procurementNumber: generateNumber('PRC'),
      outletId: dto.outletId,
      supplier: dto.supplier,
      invoiceNumber: dto.invoiceNumber,
      note: dto.note,
      totalCost,
      items,
    });

    await this.productContract.increaseStock(
      dto.outletId,
      items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    );
    await this.repo.recordMovements(
      items.map((i) => ({
        productId: i.productId,
        outletId: dto.outletId,
        type: 'purchase_in',
        quantity: i.quantity, // positif = masuk
        refType: 'procurement',
        refId: procurement.id,
        note: dto.supplier ? `Supplier: ${dto.supplier}` : dto.note,
      })),
    );
    return procurement;
  }

  findProcurements(outletId?: string): Promise<ProcurementWithItems[]> {
    return this.repo.findProcurements(outletId);
  }

  // ── StockContract: pencatatan penjualan (dipanggil modul Order) ──

  /** Order dibuat → stok outlet turun. Catat agar buku besar cocok dgn stok. */
  async recordSale(
    outletId: string,
    items: StockLine[],
    orderId: string,
  ): Promise<void> {
    await this.repo.recordMovements(
      items.map((i) => ({
        productId: i.productId,
        outletId,
        type: 'sale',
        quantity: -i.quantity, // negatif = keluar (terjual)
        refType: 'order',
        refId: orderId,
      })),
    );
  }

  /** Order dibatalkan → stok dikembalikan. */
  async recordSaleCancel(
    outletId: string,
    items: StockLine[],
    orderId: string,
  ): Promise<void> {
    await this.repo.recordMovements(
      items.map((i) => ({
        productId: i.productId,
        outletId,
        type: 'sale_cancel',
        quantity: i.quantity,
        refType: 'order',
        refId: orderId,
        note: 'Order dibatalkan — stok dikembalikan',
      })),
    );
  }

  /**
   * Kirim barang: stok ASAL langsung turun (barang keluar gudang), stok TUJUAN
   * belum naik — baru naik saat diterima. Jadi barang "di jalan" tidak terhitung
   * dua kali.
   */
  async createShipment(dto: CreateShipmentDto): Promise<ShipmentWithItems> {
    if (dto.fromOutletId === dto.toOutletId) {
      throw new BadRequestException('Outlet asal & tujuan tidak boleh sama');
    }
    const [from, to] = await Promise.all([
      this.outletContract.findById(dto.fromOutletId),
      this.outletContract.findById(dto.toOutletId),
    ]);
    if (!from) throw new NotFoundException('Outlet asal tidak ditemukan');
    if (!to) throw new NotFoundException('Outlet tujuan tidak ditemukan');

    const items = await this.resolveItems(dto.items);

    // Stok asal harus cukup — decrementStock atomik & melempar bila kurang.
    await this.productContract.decrementStock(
      dto.fromOutletId,
      items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    );

    const shipment = await this.repo.createShipment({
      shipmentNumber: generateNumber('SHP'),
      fromOutletId: dto.fromOutletId,
      toOutletId: dto.toOutletId,
      note: dto.note,
      items,
    });

    await this.repo.recordMovements(
      items.map((i) => ({
        productId: i.productId,
        outletId: dto.fromOutletId,
        type: 'transfer_out',
        quantity: -i.quantity, // negatif = keluar
        refType: 'shipment',
        refId: shipment.id,
        note: dto.note,
      })),
    );
    return shipment;
  }

  /** Outlet/kasir menerima kiriman → stok tujuan naik. Idempotent. */
  async receiveShipment(id: string): Promise<ShipmentWithItems> {
    const shipment = await this.repo.findShipmentById(id);
    if (!shipment) throw new NotFoundException('Kiriman tidak ditemukan');
    if (shipment.status === 'received') {
      throw new BadRequestException('Kiriman ini sudah diterima');
    }
    if (shipment.status === 'cancelled') {
      throw new BadRequestException('Kiriman ini sudah dibatalkan');
    }

    await this.productContract.increaseStock(
      shipment.toOutletId,
      shipment.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    );
    await this.repo.recordMovements(
      shipment.items.map((i) => ({
        productId: i.productId,
        outletId: shipment.toOutletId,
        type: 'transfer_in',
        quantity: i.quantity,
        refType: 'shipment',
        refId: shipment.id,
      })),
    );
    return this.repo.setShipmentStatus(id, 'received');
  }

  /** Batalkan kiriman yang belum diterima → stok dikembalikan ke outlet asal. */
  async cancelShipment(id: string): Promise<ShipmentWithItems> {
    const shipment = await this.repo.findShipmentById(id);
    if (!shipment) throw new NotFoundException('Kiriman tidak ditemukan');
    if (shipment.status !== 'sent') {
      throw new BadRequestException(
        'Hanya kiriman yang belum diterima yang bisa dibatalkan',
      );
    }

    await this.productContract.increaseStock(
      shipment.fromOutletId,
      shipment.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      })),
    );
    await this.repo.recordMovements(
      shipment.items.map((i) => ({
        productId: i.productId,
        outletId: shipment.fromOutletId,
        type: 'adjustment',
        quantity: i.quantity,
        refType: 'shipment_cancel',
        refId: shipment.id,
        note: 'Kiriman dibatalkan — stok dikembalikan',
      })),
    );
    return this.repo.setShipmentStatus(id, 'cancelled');
  }

  findShipments(query: FindShipmentsQueryDto): Promise<ShipmentWithItems[]> {
    return this.repo.findShipments(query);
  }

  async findShipmentById(id: string): Promise<ShipmentWithItems> {
    const s = await this.repo.findShipmentById(id);
    if (!s) throw new NotFoundException('Kiriman tidak ditemukan');
    return s;
  }

  findMovements(query: FindMovementsQueryDto): Promise<StockMovement[]> {
    return this.repo.findMovements({
      outletId: query.outletId,
      productId: query.productId,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      // dateTo inklusif sampai akhir hari.
      dateTo: query.dateTo
        ? new Date(`${query.dateTo}T23:59:59.999Z`)
        : undefined,
    });
  }

  /** Validasi produk ada + ambil snapshot nama (untuk riwayat yang terbaca). */
  private async resolveItems(items: StockItemDto[]) {
    const ids = [...new Set(items.map((i) => i.productId))];
    const products = await this.productContract.findByIds(ids);
    const map = new Map(products.map((p) => [p.id, p]));
    return items.map((i) => {
      const p = map.get(i.productId);
      if (!p) {
        throw new BadRequestException(`Produk ${i.productId} tidak ditemukan`);
      }
      return {
        productId: p.id,
        productName: p.name,
        quantity: i.quantity,
      };
    });
  }
}

export interface OrderDetailRef {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  shippingCost: number;
  customerName: string | null;
  phone: string;
  items: { productName: string; price: number; quantity: number }[];
}

/** Hasil satu transaksi penjualan kasir — dipakai POS untuk mencetak struk. */
export interface PosSaleResult {
  id: string;
  orderNumber: string;
  outletId: string;
  items: {
    productName: string;
    price: number;
    quantity: number;
    subtotal: number;
  }[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  /** Uang tunai diterima (null bila non-tunai). */
  amountPaid: number | null;
  /** Kembalian (0 bila non-tunai / pas). */
  changeAmount: number;
  customerName: string | null;
  phone: string | null;
  /** Poin yang dikreditkan (0 bila pelanggan tak memberi No HP). */
  earnedPoints: number;
  createdAt: Date;
}

/** Rekap penjualan satu sesi kasir — untuk tutup kas. */
export interface ShiftSalesSummary {
  transactionCount: number;
  totalSales: number;
  cashSales: number;
  nonCashSales: number;
}

/**
 * Batas publik modul Order. Dipakai modul Payment (membaca order & memperbarui
 * status saat webhook Xendit) dan modul POS (membuat transaksi kasir — tabel
 * `orders` dimiliki modul ini, jadi POS tidak menulis langsung ke sana).
 */
export abstract class OrderContract {
  /** Detail order by id (untuk membuat transaksi pembayaran). */
  abstract getDetailById(orderId: string): Promise<OrderDetailRef | null>;

  /**
   * Ubah status order berdasarkan orderNumber (Xendit memakai orderNumber
   * sebagai order_id). Mengembalikan stok bila status menjadi `cancelled`.
   */
  abstract setStatusByNumber(
    orderNumber: string,
    status: string,
    paymentMethod?: string,
  ): Promise<void>;

  /**
   * Penjualan di kasir (POS): tanpa alamat & ongkir, langsung LUNAS
   * (status `completed`). Stok outlet berkurang, tercatat di buku besar, dan
   * poin dikreditkan bila pelanggan memberi No HP.
   */
  abstract createPosSale(input: {
    outletId: string;
    shiftId: string;
    items: { productId: string; quantity: number }[];
    paymentMethod: string;
    amountPaid?: number;
    phone?: string;
    customerName?: string;
    notes?: string;
  }): Promise<PosSaleResult>;

  /**
   * Cari pelanggan by No HP (dipakai kasir POS untuk konfirmasi identitas &
   * saldo poin saat mengetik nomor). Null bila belum terdaftar.
   */
  abstract findCustomerByPhone(
    phone: string,
  ): Promise<{ phone: string; name: string | null; points: number } | null>;

  /**
   * Penjualan kasir menunggu bayar QRIS: buat order `pending` (stok direservasi),
   * pelunasan lewat webhook. Kembalikan info untuk membuat QR.
   */
  abstract createPosSalePending(input: {
    outletId: string;
    shiftId: string;
    items: { productId: string; quantity: number }[];
    paymentMethod: string;
    phone?: string;
    customerName?: string;
    notes?: string;
  }): Promise<{ id: string; orderNumber: string; total: number }>;

  /** Status ringkas order POS (polling QRIS). Null bila bukan order POS. */
  abstract getPosOrderStatus(
    orderId: string,
  ): Promise<{ status: string; orderNumber: string } | null>;

  /** Hasil transaksi POS lengkap untuk struk (setelah QRIS lunas). */
  abstract getPosSaleResult(orderId: string): Promise<PosSaleResult | null>;

  /** Rekap penjualan satu sesi kasir (untuk tutup kas). */
  abstract summarizeShiftSales(shiftId: string): Promise<ShiftSalesSummary>;

  /** Daftar transaksi satu sesi kasir (riwayat + cetak ulang struk). */
  abstract findShiftSales(shiftId: string): Promise<PosSaleResult[]>;
}

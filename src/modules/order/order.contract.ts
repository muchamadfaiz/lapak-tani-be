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

/**
 * Batas publik modul Order. Dipakai modul Payment untuk membaca order &
 * memperbarui statusnya saat ada notifikasi pembayaran (webhook Xendit).
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
}

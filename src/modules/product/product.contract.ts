/**
 * Referensi produk untuk modul lain (Order: snapshot harga, validasi outlet,
 * cek stok/ketersediaan).
 */
export interface ProductRef {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  outletId: string;
  stock: number;
  isAvailable: boolean;
}

/**
 * Batas publik modul Product. Modul lain bergantung pada kontrak ini, bukan
 * pada repository/use-case internal Product.
 */
export abstract class ProductContract {
  /** Ambil referensi produk by id, null bila tidak ada. */
  abstract findById(id: string): Promise<ProductRef | null>;

  /** Ambil banyak produk sekaligus (hindari N+1 saat Order memproses item). */
  abstract findByIds(ids: string[]): Promise<ProductRef[]>;
}

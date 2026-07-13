/**
 * Referensi produk untuk modul lain (Order: snapshot harga & nama, cek
 * ketersediaan). Stok TIDAK di sini karena bersifat per-outlet — ambil lewat
 * `getStock(outletId, ...)`.
 */
export interface ProductRef {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
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

  /** Stok beberapa produk pada satu outlet → productId → stock (0 bila tak ada). */
  abstract getStock(
    outletId: string,
    productIds: string[],
  ): Promise<Map<string, number>>;

  /**
   * Kurangi stok beberapa produk pada SATU outlet secara atomik (saat order
   * dibuat). Melempar error bila stok tak cukup (semua di-rollback).
   */
  abstract decrementStock(
    outletId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<void>;

  /**
   * Kembalikan stok beberapa produk pada satu outlet (saat order dibatalkan).
   */
  abstract restoreStock(
    outletId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<void>;

  /**
   * Tambah stok pada satu outlet/gudang (barang masuk: pengadaan / terima
   * kiriman). Beda dari restoreStock: baris stok DIBUAT bila belum ada (upsert),
   * sehingga gudang/outlet baru yang belum punya baris tetap bisa diisi.
   */
  abstract increaseStock(
    outletId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<void>;
}

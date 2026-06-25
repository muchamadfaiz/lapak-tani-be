/** Referensi kategori ringan untuk dipakai modul lain (mis. Product). */
export interface CategoryRef {
  id: string;
  name: string;
  icon: string | null;
  imageUrl: string | null;
}

/**
 * Batas publik modul Category. HANYA yang dibutuhkan modul lain — mis. Product
 * memvalidasi `categoryId` saat create/update. Modul lain bergantung pada
 * kontrak ini, bukan pada repository/use-case internal Category.
 */
export abstract class CategoryContract {
  /** Ambil referensi kategori by id, null bila tidak ada. */
  abstract findById(id: string): Promise<CategoryRef | null>;

  /** Lempar NotFoundException bila kategori tidak ada. */
  abstract assertExists(id: string): Promise<void>;
}

/**
 * Referensi outlet ringan untuk modul lain (Product memvalidasi outletId;
 * Order butuh koordinat untuk hitung ongkir).
 */
export interface OutletRef {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  /** Gudang: menyimpan stok, tapi TIDAK bisa dipesan pelanggan. */
  isWarehouse: boolean;
}

/**
 * Batas publik modul Outlet. Modul lain bergantung pada kontrak ini, bukan
 * pada repository/use-case internal Outlet.
 */
export abstract class OutletContract {
  /** Ambil referensi outlet by id, null bila tidak ada. */
  abstract findById(id: string): Promise<OutletRef | null>;

  /** Lempar NotFoundException bila outlet tidak ada. */
  abstract assertExists(id: string): Promise<void>;
}

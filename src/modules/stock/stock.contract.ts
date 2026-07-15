export interface StockLine {
  productId: string;
  quantity: number;
}

/** Ringkasan kiriman untuk modul lain (POS: kasir terima barang). */
export interface StockShipmentView {
  id: string;
  shipmentNumber: string;
  fromOutletId: string;
  toOutletId: string;
  status: string;
  note: string | null;
  sentAt: Date;
  receivedAt: Date | null;
  items: { productId: string; productName: string; quantity: number }[];
}

/**
 * Batas publik modul Stock. Dipakai modul Order untuk MENCATAT pergerakan stok
 * akibat penjualan ke buku besar — tanpa tahu detail tabelnya.
 *
 * Catatan: pengurangan stok fisiknya sendiri tetap dilakukan Order lewat
 * ProductContract. Kontrak ini hanya soal pencatatan riwayat, supaya buku besar
 * cocok dengan stok sebenarnya.
 */
export abstract class StockContract {
  /** Order dibuat → stok outlet berkurang. Catat sebagai `sale` (negatif). */
  abstract recordSale(
    outletId: string,
    items: StockLine[],
    orderId: string,
  ): Promise<void>;

  /** Order dibatalkan → stok dikembalikan. Catat sebagai `sale_cancel` (positif). */
  abstract recordSaleCancel(
    outletId: string,
    items: StockLine[],
    orderId: string,
  ): Promise<void>;

  /** Kiriman yang MENUJU outlet ini & belum diterima (dipakai kasir). */
  abstract listIncomingShipments(
    toOutletId: string,
  ): Promise<StockShipmentView[]>;

  /**
   * Kasir menerima kiriman → stok outlet naik. Menolak (Forbidden) bila kiriman
   * bukan menuju `outletId` kasir tersebut.
   */
  abstract receiveShipmentForOutlet(
    shipmentId: string,
    outletId: string,
  ): Promise<StockShipmentView>;
}

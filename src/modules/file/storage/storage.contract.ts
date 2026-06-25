/**
 * Kontrak penyimpanan file fisik. Modul file bergantung pada abstraksi ini,
 * bukan pada implementasi konkret (disk/cloud). Ganti backend penyimpanan =
 * cukup tambah implementasi baru (mis. MinioStorage) lalu tukar di module,
 * tanpa menyentuh use-case/controller.
 */
export abstract class StorageContract {
  /** Bangun URL relatif publik untuk file yang tersimpan. */
  abstract buildUrl(filename: string, dateDir: string): string;

  /** Hapus file fisik berdasarkan URL relatif publiknya. Aman bila file tidak ada. */
  abstract delete(url: string): Promise<void>;
}

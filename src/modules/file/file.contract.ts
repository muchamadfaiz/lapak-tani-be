/**
 * Referensi file yang aman dibagikan ke modul lain — bentuk ringan,
 * tanpa membocorkan model Prisma mentah.
 */
export interface FileRef {
  id: string;
  originalName: string;
  filename: string;
  url: string;
  mimetype: string;
  size: number;
  createdAt: Date;
}

/**
 * Batas publik (public boundary) modul File. HANYA berisi yang dibutuhkan
 * modul lain — bukan seluruh CRUD file. Modul lain bergantung pada kontrak
 * abstrak ini, bukan pada FileService atau `prisma.file` langsung.
 */
export abstract class FileContract {
  /** Ambil referensi file berdasarkan id, null bila tidak ada. */
  abstract getFileById(id: string): Promise<FileRef | null>;

  /** Lempar NotFoundException bila file tidak ada. Berguna saat modul lain
   *  ingin memvalidasi fileId yang dikirim client (mis. foto produk). */
  abstract assertExists(id: string): Promise<void>;

  /**
   * URL publik untuk file yang SUDAH ditulis multer ke disk. Dipakai modul lain
   * yang menerima unggahan tanpa akun (mis. bukti transfer dari pelanggan tamu),
   * sehingga tak perlu membuat record File milik user.
   */
  abstract buildUploadUrl(file: Express.Multer.File): string;
}

/**
 * Batas publik (public boundary) modul Auth. HANYA berisi yang dibutuhkan
 * modul lain — bukan seluruh use-case/services internal. Modul lain bergantung
 * pada kontrak abstrak ini, bukan pada TokenService atau use-case langsung.
 */
export abstract class AuthContract {
  /** Validasi apakah user aktif & ada (untuk keperluan lintas-modul). */
  abstract validateUser(
    userId: string,
  ): Promise<{ id: string; email: string; role: string } | null>;
}

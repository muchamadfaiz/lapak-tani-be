/**
 * Batas publik untuk perhitungan jarak tempuh. Dibuat async agar provider
 * berbasis API (mis. OpenRouteService) bisa dipasang nanti TANPA mengubah
 * pemanggil (Order/Outlet). Ganti provider cukup di DistanceModule + env.
 */
export abstract class DistanceContract {
  /** Perkiraan jarak tempuh (km) antara dua titik koordinat. */
  abstract distanceKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): Promise<number>;
}

/**
 * Hitung jarak dua titik koordinat (km) dengan formula Haversine.
 * Util murni lintas-modul (shared kernel) — dipakai Outlet (terdekat) & Order (ongkir).
 */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // radius bumi (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Faktor koreksi: jarak jalan biasanya ~1,3× jarak garis lurus (Haversine).
 * Dipakai untuk estimasi ongkir & jarak ke outlet tanpa layanan peta eksternal.
 * (Bisa di-upgrade ke routing asli mis. OpenRouteService nanti.)
 */
export const ROAD_DISTANCE_FACTOR = 1.3;

/** Perkiraan jarak jalan (km) = Haversine × faktor koreksi. */
export function roadDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  return haversineKm(lat1, lon1, lat2, lon2) * ROAD_DISTANCE_FACTOR;
}

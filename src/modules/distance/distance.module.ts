import { Module } from '@nestjs/common';
import { DistanceContract } from './distance.contract';
import { HaversineDistanceService } from './haversine-distance.service';

/**
 * Penyedia perhitungan jarak. Pilih provider via env DISTANCE_PROVIDER
 * (default: 'haversine').
 *
 * Cara menambah OpenRouteService (atau lainnya) nanti — TANPA sentuh Order/Outlet:
 *   1. Buat OrsDistanceService implements DistanceContract (panggil API ORS)
 *   2. Tambahkan ke `providers` + `inject` di bawah
 *   3. Tambah cabang `case 'ors': return ors;`
 *   4. Set DISTANCE_PROVIDER=ors di .env
 */
@Module({
  providers: [
    HaversineDistanceService,
    {
      provide: DistanceContract,
      useFactory: (haversine: HaversineDistanceService) => {
        const provider = process.env.DISTANCE_PROVIDER || 'haversine';
        switch (provider) {
          // case 'ors':
          //   return ors;
          default:
            return haversine;
        }
      },
      inject: [HaversineDistanceService],
    },
  ],
  exports: [DistanceContract],
})
export class DistanceModule {}

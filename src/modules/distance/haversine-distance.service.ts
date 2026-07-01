import { Injectable } from '@nestjs/common';
import { roadDistanceKm } from '../../common';
import { DistanceContract } from './distance.contract';

/**
 * Provider default: Haversine (garis lurus) × faktor jalan (~1,3).
 * Gratis, tanpa API/internet. Cukup untuk estimasi ongkir.
 */
@Injectable()
export class HaversineDistanceService extends DistanceContract {
  async distanceKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): Promise<number> {
    return roadDistanceKm(lat1, lng1, lat2, lng2);
  }
}

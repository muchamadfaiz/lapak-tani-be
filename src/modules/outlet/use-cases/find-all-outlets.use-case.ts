import { Injectable } from '@nestjs/common';
import { OutletRepository } from '../repository/outlet.repository';
import { FindOutletsQueryDto, OutletResponseDto } from '../dto';
import { OutletMapper } from '../mapper/outlet.mapper';
import { haversineKm } from '../geo.util';

@Injectable()
export class FindAllOutletsUseCase {
  constructor(private readonly outletRepository: OutletRepository) {}

  async execute(query: FindOutletsQueryDto): Promise<OutletResponseDto[]> {
    const outlets = await this.outletRepository.findAll();

    // Tanpa lokasi user → urut nama, tanpa jarak.
    if (query.lat === undefined || query.lng === undefined) {
      return outlets.map((o) => OutletMapper.toResponseDto(o));
    }

    // Dengan lokasi user → hitung jarak (km, 1 desimal) lalu urut terdekat.
    return outlets
      .map((o) => ({
        outlet: o,
        distance:
          Math.round(
            haversineKm(query.lat!, query.lng!, o.latitude, o.longitude) * 10,
          ) / 10,
      }))
      .sort((a, b) => a.distance - b.distance)
      .map(({ outlet, distance }) =>
        OutletMapper.toResponseDto(outlet, distance),
      );
  }
}

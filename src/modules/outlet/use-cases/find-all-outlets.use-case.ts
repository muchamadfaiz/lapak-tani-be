import { Injectable } from '@nestjs/common';
import { OutletRepository } from '../repository/outlet.repository';
import { FindOutletsQueryDto, OutletResponseDto } from '../dto';
import { OutletMapper } from '../mapper/outlet.mapper';
import { DistanceContract } from '../../distance';

@Injectable()
export class FindAllOutletsUseCase {
  constructor(
    private readonly outletRepository: OutletRepository,
    private readonly distanceContract: DistanceContract,
  ) {}

  async execute(query: FindOutletsQueryDto): Promise<OutletResponseDto[]> {
    // Gudang hanya tampil bila diminta (admin) — storefront tak boleh melihatnya.
    const outlets = await this.outletRepository.findAll(
      query.includeWarehouse === true,
    );

    // Tanpa lokasi user → urut nama, tanpa jarak.
    if (query.lat === undefined || query.lng === undefined) {
      return outlets.map((o) => OutletMapper.toResponseDto(o));
    }

    // Dengan lokasi user → hitung jarak (km, 1 desimal) lalu urut terdekat.
    const withDistance = await Promise.all(
      outlets.map(async (o) => ({
        outlet: o,
        distance:
          Math.round(
            (await this.distanceContract.distanceKm(
              query.lat!,
              query.lng!,
              o.latitude,
              o.longitude,
            )) * 10,
          ) / 10,
      })),
    );

    return withDistance
      .sort((a, b) => a.distance - b.distance)
      .map(({ outlet, distance }) =>
        OutletMapper.toResponseDto(outlet, distance),
      );
  }
}

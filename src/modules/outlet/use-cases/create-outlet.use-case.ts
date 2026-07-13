import { Injectable } from '@nestjs/common';
import { OutletRepository } from '../repository/outlet.repository';
import { CreateOutletDto, OutletResponseDto } from '../dto';
import { OutletMapper } from '../mapper/outlet.mapper';

@Injectable()
export class CreateOutletUseCase {
  constructor(private readonly outletRepository: OutletRepository) {}

  async execute(dto: CreateOutletDto): Promise<OutletResponseDto> {
    const outlet = await this.outletRepository.create({
      name: dto.name,
      address: dto.address,
      latitude: dto.latitude,
      longitude: dto.longitude,
      phone: dto.phone,
      imageUrl: dto.imageUrl,
      isActive: dto.isActive,
      isWarehouse: dto.isWarehouse,
    });
    return OutletMapper.toResponseDto(outlet);
  }
}

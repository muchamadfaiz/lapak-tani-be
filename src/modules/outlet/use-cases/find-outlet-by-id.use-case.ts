import { Injectable, NotFoundException } from '@nestjs/common';
import { OutletRepository } from '../repository/outlet.repository';
import { OutletResponseDto } from '../dto';
import { OutletMapper } from '../mapper/outlet.mapper';

@Injectable()
export class FindOutletByIdUseCase {
  constructor(private readonly outletRepository: OutletRepository) {}

  async execute(id: string): Promise<OutletResponseDto> {
    const outlet = await this.outletRepository.findById(id);
    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }
    return OutletMapper.toResponseDto(outlet);
  }
}

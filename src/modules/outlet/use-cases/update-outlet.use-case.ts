import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OutletRepository } from '../repository/outlet.repository';
import { UpdateOutletDto, OutletResponseDto } from '../dto';
import { OutletMapper } from '../mapper/outlet.mapper';

@Injectable()
export class UpdateOutletUseCase {
  constructor(private readonly outletRepository: OutletRepository) {}

  async execute(id: string, dto: UpdateOutletDto): Promise<OutletResponseDto> {
    const existing = await this.outletRepository.findById(id);
    if (!existing) {
      throw new NotFoundException('Outlet not found');
    }

    // PENGAMAN: gudang disembunyikan dari storefront. Kalau SEMUA outlet dijadikan
    // gudang, pelanggan tidak melihat outlet mana pun → toko mati total tanpa
    // pesan error apa pun. Jadi outlet jualan terakhir tidak boleh dikonversi.
    if (dto.isWarehouse === true && !existing.isWarehouse) {
      const sellingLeft = await this.outletRepository.countSellingOutlets(id);
      if (sellingLeft === 0) {
        throw new BadRequestException(
          'Minimal harus ada satu outlet jualan. Outlet ini tidak bisa dijadikan gudang karena akan membuat aplikasi pelanggan kosong.',
        );
      }
    }

    const outlet = await this.outletRepository.update(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.latitude !== undefined && { latitude: dto.latitude }),
      ...(dto.longitude !== undefined && { longitude: dto.longitude }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.isWarehouse !== undefined && { isWarehouse: dto.isWarehouse }),
    });
    return OutletMapper.toResponseDto(outlet);
  }
}

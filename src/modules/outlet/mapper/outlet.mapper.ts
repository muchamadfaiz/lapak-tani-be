import { Outlet } from '@prisma/client';
import { OutletResponseDto } from '../dto';

export class OutletMapper {
  static toResponseDto(outlet: Outlet, distance?: number): OutletResponseDto {
    return {
      id: outlet.id,
      name: outlet.name,
      address: outlet.address,
      latitude: outlet.latitude,
      longitude: outlet.longitude,
      phone: outlet.phone,
      imageUrl: outlet.imageUrl,
      isActive: outlet.isActive,
      isWarehouse: outlet.isWarehouse,
      ...(distance !== undefined && { distance }),
      createdAt: outlet.createdAt,
      updatedAt: outlet.updatedAt,
    };
  }
}

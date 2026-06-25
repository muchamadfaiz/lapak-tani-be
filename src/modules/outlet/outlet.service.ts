import { Injectable, NotFoundException } from '@nestjs/common';
import { Outlet } from '@prisma/client';
import { OutletRepository } from './repository/outlet.repository';
import { OutletContract, OutletRef } from './outlet.contract';

/**
 * Implementasi OutletContract — memenuhi janji lintas-modul. CRUD outlet milik
 * modul ini sendiri (endpoint /outlets) tetap di use-case.
 */
@Injectable()
export class OutletService extends OutletContract {
  constructor(private readonly outletRepository: OutletRepository) {
    super();
  }

  async findById(id: string): Promise<OutletRef | null> {
    const outlet = await this.outletRepository.findById(id);
    return outlet ? OutletService.toRef(outlet) : null;
  }

  async assertExists(id: string): Promise<void> {
    const outlet = await this.outletRepository.findById(id);
    if (!outlet) {
      throw new NotFoundException('Outlet not found');
    }
  }

  private static toRef(outlet: Outlet): OutletRef {
    return {
      id: outlet.id,
      name: outlet.name,
      address: outlet.address,
      latitude: outlet.latitude,
      longitude: outlet.longitude,
      isActive: outlet.isActive,
    };
  }
}

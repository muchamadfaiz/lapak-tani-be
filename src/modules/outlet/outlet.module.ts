import { Module } from '@nestjs/common';
import { DistanceModule } from '../distance';
import { OutletController } from './outlet.controller';
import { OutletRepository } from './repository/outlet.repository';
import { OutletContract } from './outlet.contract';
import { OutletService } from './outlet.service';
import {
  CreateOutletUseCase,
  FindAllOutletsUseCase,
  FindOutletByIdUseCase,
  UpdateOutletUseCase,
  RemoveOutletUseCase,
} from './use-cases';

@Module({
  imports: [DistanceModule],
  controllers: [OutletController],
  providers: [
    OutletRepository,
    { provide: OutletContract, useClass: OutletService },
    CreateOutletUseCase,
    FindAllOutletsUseCase,
    FindOutletByIdUseCase,
    UpdateOutletUseCase,
    RemoveOutletUseCase,
  ],
  // Hanya kontrak publik yang diekspos ke modul lain (Product, Order).
  exports: [OutletContract],
})
export class OutletModule {}

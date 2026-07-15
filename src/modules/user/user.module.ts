import { Module } from '@nestjs/common';
import { OutletModule } from '../outlet';
import { UserController } from './user.controller';
import { CashierController } from './cashier.controller';
import { CashierService } from './cashier.service';
import { UserRepository } from './repository/user.repository';
import { UserContract } from './user.contract';
import { UserService } from './user.service';
import {
  FindAllUsersUseCase,
  FindUserByIdUseCase,
  CreateUserUseCase,
  UpdateUserUseCase,
  UpdateProfileUseCase,
  RemoveUserUseCase,
} from './use-cases';

@Module({
  // OutletContract untuk validasi & nama outlet saat kelola kasir.
  imports: [OutletModule],
  controllers: [UserController, CashierController],
  providers: [
    UserRepository,
    { provide: UserContract, useClass: UserService },
    CashierService,
    FindAllUsersUseCase,
    FindUserByIdUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
    UpdateProfileUseCase,
    RemoveUserUseCase,
  ],
  // Hanya kontrak publik yang diekspos ke modul lain.
  exports: [UserContract],
})
export class UserModule {}

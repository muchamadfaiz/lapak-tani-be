import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
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
  controllers: [UserController],
  providers: [
    UserRepository,
    { provide: UserContract, useClass: UserService },
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

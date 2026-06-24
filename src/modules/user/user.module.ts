import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
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
    FindAllUsersUseCase,
    FindUserByIdUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
    UpdateProfileUseCase,
    RemoveUserUseCase,
  ],
  exports: [FindUserByIdUseCase],
})
export class UserModule {}

import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../repository/user.repository';
import { UserResponseDto } from '../dto';
import { UserMapper } from '../mapper/user.mapper';

@Injectable()
export class FindUserByIdUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findByIdWithRelations(id);

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    return UserMapper.toResponseDto(user);
  }
}

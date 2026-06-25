import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../repository/user.repository';
import { UpdateProfileDto, UserResponseDto } from '../dto';
import { UserMapper } from '../mapper/user.mapper';

@Injectable()
export class UpdateProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: {
    userId: string;
    dto: UpdateProfileDto;
  }): Promise<UserResponseDto> {
    const { userId, dto } = input;

    const user = await this.userRepository.findById(userId);
    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const { fullName, phone, address } = dto;

    const updated = await this.userRepository.updateWithProfile(userId, {}, {
      fullName,
      phone,
      address,
    });

    return UserMapper.toResponseDto(updated);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { UserRepository } from '../repository/user.repository';
import { UpdateUserDto, UserResponseDto } from '../dto';
import { UserMapper } from '../mapper/user.mapper';

@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: {
    id: string;
    dto: UpdateUserDto;
  }): Promise<UserResponseDto> {
    const { id, dto } = input;

    const existing = await this.userRepository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const { fullName, phone, address, roleId, password, ...userData } = dto;

    const userUpdateData: Prisma.UserUpdateInput = { ...userData };
    if (roleId) {
      userUpdateData.role = { connect: { id: roleId } };
    }
    if (password) {
      userUpdateData.password = await bcrypt.hash(password, 10);
      userUpdateData.passwordChangedAt = new Date();
    }

    const hasProfileChange =
      fullName !== undefined || phone !== undefined || address !== undefined;

    const user = await this.userRepository.updateWithProfile(
      id,
      userUpdateData,
      hasProfileChange ? { fullName, phone, address } : null,
    );

    return UserMapper.toResponseDto(user);
  }
}

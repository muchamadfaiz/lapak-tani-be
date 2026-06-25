import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../repository/user.repository';
import { CreateUserDto, UserResponseDto } from '../dto';
import { UserMapper } from '../mapper/user.mapper';

@Injectable()
export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    let roleId = dto.roleId;
    if (!roleId) {
      const defaultRole = await this.userRepository.findRoleByName('USER');
      if (!defaultRole) {
        throw new BadRequestException(
          'Default role not found. Run seed first.',
        );
      }
      roleId = defaultRole.id;
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.userRepository.createWithProfile({
      email: dto.email,
      password: hashedPassword,
      roleId,
      profile: {
        fullName: dto.fullName,
        phone: dto.phone,
        address: dto.address,
      },
    });

    return UserMapper.toResponseDto(user);
  }
}

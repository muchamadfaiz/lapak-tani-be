import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserDto, UserResponseDto } from '../dto';
import { UserMapper } from '../mapper/user.mapper';

const USER_INCLUDE = { role: true, profile: true } as const;

@Injectable()
export class CreateUserUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    let roleId = dto.roleId;
    if (!roleId) {
      const defaultRole = await this.prisma.role.findUnique({
        where: { name: 'USER' },
      });
      if (!defaultRole) {
        throw new BadRequestException(
          'Default role not found. Run seed first.',
        );
      }
      roleId = defaultRole.id;
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          roleId,
          emailVerifiedAt: new Date(),
        },
      });

      await tx.profile.create({
        data: {
          userId: created.id,
          fullName: dto.fullName,
          phone: dto.phone,
          address: dto.address,
        },
      });

      return tx.user.findUniqueOrThrow({
        where: { id: created.id },
        include: USER_INCLUDE,
      });
    });

    return UserMapper.toResponseDto(user);
  }
}

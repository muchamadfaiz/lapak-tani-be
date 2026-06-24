import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateUserDto, UserResponseDto } from '../dto';
import { UserMapper } from '../mapper/user.mapper';

const USER_INCLUDE = { role: true, profile: true } as const;

@Injectable()
export class UpdateUserUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: {
    id: string;
    dto: UpdateUserDto;
  }): Promise<UserResponseDto> {
    const { id, dto } = input;

    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const { fullName, phone, address, roleId, password, ...userData } = dto;

    const userUpdateData: Record<string, any> = { ...userData };
    if (roleId) {
      userUpdateData.roleId = roleId;
    }
    if (password) {
      userUpdateData.password = await bcrypt.hash(password, 10);
      userUpdateData.passwordChangedAt = new Date();
    }

    const user = await this.prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({ where: { id }, data: userUpdateData });
      }

      if (
        fullName !== undefined ||
        phone !== undefined ||
        address !== undefined
      ) {
        await tx.profile.upsert({
          where: { userId: id },
          update: {
            ...(fullName !== undefined && { fullName }),
            ...(phone !== undefined && { phone }),
            ...(address !== undefined && { address }),
          },
          create: {
            userId: id,
            fullName: fullName ?? '',
            phone,
            address,
          },
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id },
        include: USER_INCLUDE,
      });
    });

    return UserMapper.toResponseDto(user);
  }
}

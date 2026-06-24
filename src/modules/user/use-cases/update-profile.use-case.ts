import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateProfileDto, UserResponseDto } from '../dto';
import { UserMapper } from '../mapper/user.mapper';

const USER_INCLUDE = { role: true, profile: true } as const;

@Injectable()
export class UpdateProfileUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: {
    userId: string;
    dto: UpdateProfileDto;
  }): Promise<UserResponseDto> {
    const { userId, dto } = input;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const { fullName, phone, address } = dto;

    await this.prisma.profile.upsert({
      where: { userId },
      update: {
        ...(fullName !== undefined && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
      },
      create: {
        userId,
        fullName: fullName ?? '',
        phone,
        address,
      },
    });

    const updated = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: USER_INCLUDE,
    });

    return UserMapper.toResponseDto(updated);
  }
}

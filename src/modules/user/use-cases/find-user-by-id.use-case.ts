import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserResponseDto } from '../dto';
import { UserMapper } from '../mapper/user.mapper';

const USER_INCLUDE = { role: true, profile: true } as const;

@Injectable()
export class FindUserByIdUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: USER_INCLUDE,
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    return UserMapper.toResponseDto(user);
  }
}

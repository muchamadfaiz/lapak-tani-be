import { Prisma } from '@prisma/client';
import { UserResponseDto } from '../dto';

type UserWithRelations = Prisma.UserGetPayload<{
  include: { role: true; profile: true };
}>;

export class UserMapper {
  static toResponseDto(user: UserWithRelations): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      role: { id: user.role.id, name: user.role.name },
      profile: user.profile
        ? {
            fullName: user.profile.fullName,
            phone: user.profile.phone ?? undefined,
            address: user.profile.address ?? undefined,
            avatarUrl: user.profile.avatarUrl ?? undefined,
          }
        : undefined,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  static toResponseDtoList(users: UserWithRelations[]): UserResponseDto[] {
    return users.map((user) => UserMapper.toResponseDto(user));
  }
}

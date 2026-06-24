import { Prisma } from '@prisma/client';
import { AuthResponseDto } from '../dto';

type UserWithRelations = Prisma.UserGetPayload<{
  include: { role: true; profile: true };
}>;

export class AuthMapper {
  static toResponseDto(
    user: UserWithRelations,
    accessToken: string,
    refreshToken: string,
  ): AuthResponseDto {
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.profile?.fullName ?? '',
        role: user.role.name,
      },
    };
  }

  static toTokensDto(
    accessToken: string,
    refreshToken: string,
  ): Omit<AuthResponseDto, 'user'> {
    return {
      accessToken,
      refreshToken,
    };
  }
}

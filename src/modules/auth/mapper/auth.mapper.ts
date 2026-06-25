import { AuthResponseDto } from '../dto';
import { UserForAuth } from '../../user/user.contract';

export class AuthMapper {
  static toResponseDto(
    user: UserForAuth,
    accessToken: string,
    refreshToken: string,
  ): AuthResponseDto {
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
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

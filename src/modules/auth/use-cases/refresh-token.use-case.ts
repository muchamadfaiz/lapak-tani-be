import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthRepository } from '../repository/auth.repository';
import { AuthResponseDto } from '../dto';
import { AuthMapper } from '../mapper/auth.mapper';
import { TokenService } from '../services/token.service';
import { UserContract } from '../../user/user.contract';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenService: TokenService,
    private readonly userContract: UserContract,
  ) {}

  async execute(input: {
    userId: string;
    currentRefreshToken: string;
  }): Promise<AuthResponseDto> {
    const { userId, currentRefreshToken } = input;

    const hashedToken = this.tokenService.hashToken(currentRefreshToken);

    const tokenRecord = await this.authRepository.findRefreshToken(hashedToken);

    if (
      !tokenRecord ||
      tokenRecord.userId !== userId ||
      tokenRecord.revokedAt ||
      tokenRecord.expiredAt < new Date()
    ) {
      throw new ForbiddenException('Access denied');
    }

    await this.authRepository.revokeRefreshToken(tokenRecord.id);

    const user = await this.userContract.findByIdForAuth(userId);

    if (!user || !user.isActive || user.deletedAt) {
      throw new ForbiddenException('Access denied');
    }

    const tokens = await this.tokenService.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role.name,
    });

    await this.tokenService.storeRefreshToken(user.id, tokens.refreshToken);

    return AuthMapper.toTokensDto(
      tokens.accessToken,
      tokens.refreshToken,
    ) as AuthResponseDto;
  }
}

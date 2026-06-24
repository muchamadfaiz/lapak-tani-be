import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthResponseDto } from '../dto';
import { AuthMapper } from '../mapper/auth.mapper';
import { TokenService } from '../services/token.service';

const USER_INCLUDE = { role: true, profile: true } as const;

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: {
    userId: string;
    currentRefreshToken: string;
  }): Promise<AuthResponseDto> {
    const { userId, currentRefreshToken } = input;

    const hashedToken = this.tokenService.hashToken(currentRefreshToken);

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: hashedToken },
    });

    if (
      !tokenRecord ||
      tokenRecord.userId !== userId ||
      tokenRecord.revokedAt ||
      tokenRecord.expiredAt < new Date()
    ) {
      throw new ForbiddenException('Access denied');
    }

    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: USER_INCLUDE,
    });

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

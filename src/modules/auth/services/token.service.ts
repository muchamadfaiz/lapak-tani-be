import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import jwtConfig from '../../../config/jwt.config';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtPayload } from '../strategies/jwt.strategy';

@Injectable()
export class TokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtCfg: ConfigType<typeof jwtConfig>,
  ) {}

  async generateTokens(payload: JwtPayload) {
    const plainPayload = { ...payload };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(plainPayload, {
        secret: this.jwtCfg.accessSecret,
        expiresIn: this.jwtCfg.accessExpiration as any,
      }),
      this.jwtService.signAsync(plainPayload, {
        secret: this.jwtCfg.refreshSecret,
        expiresIn: this.jwtCfg.refreshExpiration as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async storeRefreshToken(userId: string, rawToken: string): Promise<void> {
    const hashedToken = this.hashToken(rawToken);
    const expiredAt = new Date(
      Date.now() +
        this.parseExpiration(this.jwtCfg.refreshExpiration as string),
    );

    await this.prisma.refreshToken.create({
      data: {
        token: hashedToken,
        userId,
        expiredAt,
      },
    });
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  parseExpiration(exp: string): number {
    const match = exp.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * multipliers[unit];
  }
}

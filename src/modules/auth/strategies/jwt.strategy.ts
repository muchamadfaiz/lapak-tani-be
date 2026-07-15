import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwtConfig from '../../../config/jwt.config';
import { UserContract } from '../../user/user.contract';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtCfg: ConfigType<typeof jwtConfig>,
    private readonly userContract: UserContract,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtCfg.accessSecret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userContract.findByIdForAuth(payload.sub);

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException();
    }

    // outletId dibaca dari DB (bukan dari token) agar perubahan penugasan kasir
    // langsung berlaku tanpa menunggu token lama kedaluwarsa.
    return {
      id: user.id,
      email: user.email,
      role: user.role.name,
      outletId: user.outletId,
    };
  }
}

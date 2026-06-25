import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from '../repository/auth.repository';
import { AuthResponseDto, LoginDto } from '../dto';
import { AuthMapper } from '../mapper/auth.mapper';
import { TokenService } from '../services/token.service';
import { UserContract } from '../../user/user.contract';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenService: TokenService,
    private readonly userContract: UserContract,
  ) {}

  async execute(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userContract.findByEmailForAuth(dto.email);

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException('Email not verified. Please check your inbox.');
    }

    const tokens = await this.tokenService.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role.name,
    });

    await this.tokenService.storeRefreshToken(user.id, tokens.refreshToken);

    return AuthMapper.toResponseDto(
      user,
      tokens.accessToken,
      tokens.refreshToken,
    );
  }
}

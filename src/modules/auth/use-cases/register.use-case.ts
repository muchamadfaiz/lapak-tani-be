import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from '../repository/auth.repository';
import { AuthResponseDto, RegisterDto } from '../dto';
import { AuthMapper } from '../mapper/auth.mapper';
import { TokenService } from '../services/token.service';
import { EmailContract } from '../../email/email.contract';
import { SendVerificationEmailUseCase } from './send-verification-email.use-case';
import { UserContract } from '../../user/user.contract';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenService: TokenService,
    private readonly emailContract: EmailContract,
    private readonly sendVerificationEmailUseCase: SendVerificationEmailUseCase,
    private readonly userContract: UserContract,
  ) {}

  async execute(dto: RegisterDto): Promise<AuthResponseDto | { message: string }> {
    // 1. Check email uniqueness
    const existingUser = await this.userContract.findByEmailForAuth(dto.email);

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const emailEnabled = this.emailContract.isEnabled;

    // 3. Create user via UserContract
    const user = await this.userContract.createForAuth({
      email: dto.email,
      passwordHash: hashedPassword,
      fullName: dto.fullName,
      emailVerifiedAt: emailEnabled ? null : new Date(),
    });

    // 4. If email enabled, send verification email instead of tokens
    if (emailEnabled) {
      await this.sendVerificationEmailUseCase.execute(user.id, user.email);
      return { message: 'Please check your email to verify your account' };
    }

    // 5. Email disabled — auto-verified, generate tokens
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

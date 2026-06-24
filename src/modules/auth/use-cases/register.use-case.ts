import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthResponseDto, RegisterDto } from '../dto';
import { AuthMapper } from '../mapper/auth.mapper';
import { TokenService } from '../services/token.service';
import { EmailService } from '../../email/email.service';
import { SendVerificationEmailUseCase } from './send-verification-email.use-case';

const USER_INCLUDE = { role: true, profile: true } as const;

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly sendVerificationEmailUseCase: SendVerificationEmailUseCase,
  ) {}

  async execute(dto: RegisterDto): Promise<AuthResponseDto | { message: string }> {
    // 1. Check email uniqueness
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // 2. Find default role
    const defaultRole = await this.prisma.role.findUnique({
      where: { name: 'USER' },
    });

    if (!defaultRole) {
      throw new BadRequestException('Default role not found. Run seed first.');
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const emailEnabled = this.emailService.isEnabled;

    // 4. Create user + profile in transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          roleId: defaultRole.id,
          emailVerifiedAt: emailEnabled ? null : new Date(),
        },
      });

      await tx.profile.create({
        data: {
          userId: created.id,
          fullName: dto.fullName,
        },
      });

      return tx.user.findUniqueOrThrow({
        where: { id: created.id },
        include: USER_INCLUDE,
      });
    });

    // 5. If email enabled, send verification email instead of tokens
    if (emailEnabled) {
      await this.sendVerificationEmailUseCase.execute(user.id, user.email);
      return { message: 'Please check your email to verify your account' };
    }

    // 6. Email disabled — auto-verified, generate tokens
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

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { ForgotPasswordDto } from '../dto';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Always return OK — don't reveal if email exists
    if (!user || user.deletedAt || !user.isActive) {
      return;
    }

    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
      },
    });

    const frontendUrl = this.configService.get<string>(
      'email.frontendUrl',
      'http://localhost:3000',
    );
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    await this.emailService.sendPasswordResetEmail(user.email, resetUrl);
  }
}

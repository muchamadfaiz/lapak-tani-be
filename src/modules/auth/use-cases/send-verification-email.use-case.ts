import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';

@Injectable()
export class SendVerificationEmailUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async execute(userId: string, email: string): Promise<void> {
    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        token: hashedToken,
        expiresAt,
      },
    });

    const frontendUrl = this.configService.get<string>(
      'email.frontendUrl',
      'http://localhost:3000',
    );
    const verificationUrl = `${frontendUrl}/verify-email?token=${rawToken}`;

    await this.emailService.sendVerificationEmail(email, verificationUrl);
  }
}

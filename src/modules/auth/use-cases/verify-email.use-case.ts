import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { VerifyEmailDto } from '../dto';

@Injectable()
export class VerifyEmailUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: VerifyEmailDto): Promise<void> {
    const hashedToken = createHash('sha256').update(dto.token).digest('hex');

    const tokenRecord = await this.prisma.emailVerificationToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: tokenRecord.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);
  }
}

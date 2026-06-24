import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResetPasswordDto } from '../dto';

@Injectable()
export class ResetPasswordUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: ResetPasswordDto): Promise<void> {
    const hashedToken = createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const tokenRecord = await this.prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
    });

    if (
      !tokenRecord ||
      tokenRecord.usedAt ||
      tokenRecord.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.$transaction([
      // Update password
      this.prisma.user.update({
        where: { id: tokenRecord.userId },
        data: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
        },
      }),
      // Mark token as used
      this.prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all refresh tokens
      this.prisma.refreshToken.updateMany({
        where: { userId: tokenRecord.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }
}

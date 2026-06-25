import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Pemilik data tabel-tabel auth: `refresh_tokens`, `password_reset_tokens`,
 * `email_verification_tokens`. Modul ini tidak lagi mengakses tabel user/profile/role.
 *
 * Satu-satunya tempat di module auth yang boleh mengakses PrismaService.
 */
@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Refresh tokens ──────────────────────────────────────────────

  createRefreshToken(data: {
    token: string;
    userId: string;
    expiredAt: Date;
  }) {
    return this.prisma.refreshToken.create({ data });
  }

  findRefreshToken(hashedToken: string) {
    return this.prisma.refreshToken.findUnique({
      where: { token: hashedToken },
    });
  }

  revokeRefreshToken(id: string) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  revokeAllRefreshTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ─── Password reset tokens ───────────────────────────────────────

  createPasswordResetToken(data: {
    userId: string;
    token: string;
    expiresAt: Date;
  }) {
    return this.prisma.passwordResetToken.create({ data });
  }

  findPasswordResetToken(hashedToken: string) {
    return this.prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
    });
  }

  markPasswordResetTokenUsed(id: string) {
    return this.prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  // ─── Email verification tokens ───────────────────────────────────

  createEmailVerificationToken(data: {
    userId: string;
    token: string;
    expiresAt: Date;
  }) {
    return this.prisma.emailVerificationToken.create({ data });
  }

  findEmailVerificationToken(hashedToken: string) {
    return this.prisma.emailVerificationToken.findUnique({
      where: { token: hashedToken },
    });
  }

  markEmailVerificationTokenUsed(id: string) {
    return this.prisma.emailVerificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }
}

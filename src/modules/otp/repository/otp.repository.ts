import { Injectable } from '@nestjs/common';
import { OtpCode } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

/** Pemilik data tabel `otp_codes`. */
@Injectable()
export class OtpRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    phone: string;
    codeHash: string;
    purpose: string;
    expiresAt: Date;
  }): Promise<OtpCode> {
    return this.prisma.otpCode.create({ data });
  }

  /** OTP terbaru yang masih aktif (belum dipakai & belum kadaluarsa). */
  findActive(phone: string, purpose: string): Promise<OtpCode | null> {
    return this.prisma.otpCode.findFirst({
      where: { phone, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** OTP terbaru apa pun (untuk cek cooldown kirim ulang). */
  findMostRecent(phone: string, purpose: string): Promise<OtpCode | null> {
    return this.prisma.otpCode.findFirst({
      where: { phone, purpose },
      orderBy: { createdAt: 'desc' },
    });
  }

  incrementAttempts(id: string): Promise<OtpCode> {
    return this.prisma.otpCode.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  }

  consume(id: string): Promise<OtpCode> {
    return this.prisma.otpCode.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { WaLoginSession } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Pemilik tabel `wa_login_sessions`. Satu-satunya tempat yang mengakses
 * `prisma.waLoginSession`.
 */
@Injectable()
export class WaLoginRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: { code: string; expiresAt: Date }): Promise<WaLoginSession> {
    return this.prisma.waLoginSession.create({ data });
  }

  findByCode(code: string): Promise<WaLoginSession | null> {
    return this.prisma.waLoginSession.findUnique({ where: { code } });
  }

  /** Sesi pending & belum kedaluwarsa untuk kode tsb. */
  findPendingByCode(code: string): Promise<WaLoginSession | null> {
    return this.prisma.waLoginSession.findFirst({
      where: { code, status: 'pending', expiresAt: { gt: new Date() } },
    });
  }

  markVerified(id: string, phone: string): Promise<WaLoginSession> {
    return this.prisma.waLoginSession.update({
      where: { id },
      data: { status: 'verified', phone },
    });
  }
}

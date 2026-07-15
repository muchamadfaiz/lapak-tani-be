import { Injectable } from '@nestjs/common';
import { CashierShift } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

/** Pemilik tunggal tabel `cashier_shifts`. */
@Injectable()
export class ShiftRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOpenByUser(userId: string): Promise<CashierShift | null> {
    return this.prisma.cashierShift.findFirst({
      where: { userId, status: 'open' },
    });
  }

  findById(id: string): Promise<CashierShift | null> {
    return this.prisma.cashierShift.findUnique({ where: { id } });
  }

  /** Riwayat shift (laporan admin), filter outlet + rentang tanggal (openedAt). */
  findMany(filter: {
    outletId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<CashierShift[]> {
    return this.prisma.cashierShift.findMany({
      where: {
        ...(filter.outletId && { outletId: filter.outletId }),
        ...((filter.dateFrom || filter.dateTo) && {
          openedAt: {
            ...(filter.dateFrom && { gte: filter.dateFrom }),
            ...(filter.dateTo && { lte: filter.dateTo }),
          },
        }),
      },
      orderBy: { openedAt: 'desc' },
      take: 200,
    });
  }

  open(data: {
    userId: string;
    outletId: string;
    openingCash: number;
  }): Promise<CashierShift> {
    return this.prisma.cashierShift.create({
      data: {
        userId: data.userId,
        outletId: data.outletId,
        openingCash: data.openingCash,
        status: 'open',
      },
    });
  }

  close(id: string, closingCash: number, note?: string): Promise<CashierShift> {
    return this.prisma.cashierShift.update({
      where: { id },
      data: { status: 'closed', closingCash, note, closedAt: new Date() },
    });
  }
}

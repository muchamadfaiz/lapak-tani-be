import { Injectable } from '@nestjs/common';
import { Customer, PointTransaction } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Pemilik data tabel `customers` + `point_transactions` (loyalty adalah bagian
 * dari agregat Customer). Pelanggan "otomatis terdata" lewat No HP.
 */
@Injectable()
export class CustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Cari customer by HP, atau buat baru. Update nama bila dikirim. */
  upsertByPhone(phone: string, name?: string): Promise<Customer> {
    return this.prisma.customer.upsert({
      where: { phone },
      update: { ...(name !== undefined && { name }) },
      create: { phone, name },
    });
  }

  findById(id: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({ where: { id } });
  }

  findByPhone(phone: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({ where: { phone } });
  }

  /**
   * Tambah poin untuk satu order (idempotent: 1 earn per orderId).
   * Atomik: increment saldo + catat di buku besar.
   */
  async awardPoints(
    customerId: string,
    orderId: string,
    points: number,
  ): Promise<void> {
    if (points <= 0) return;
    await this.prisma.$transaction(async (tx) => {
      const already = await tx.pointTransaction.findFirst({
        where: { orderId, type: 'earn' },
      });
      if (already) return; // sudah pernah diberi poin untuk order ini
      const customer = await tx.customer.update({
        where: { id: customerId },
        data: { points: { increment: points } },
      });
      await tx.pointTransaction.create({
        data: {
          customerId,
          orderId,
          type: 'earn',
          amount: points,
          balanceAfter: customer.points,
          note: 'Poin dari order',
        },
      });
    });
  }

  getPointHistory(customerId: string): Promise<PointTransaction[]> {
    return this.prisma.pointTransaction.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}

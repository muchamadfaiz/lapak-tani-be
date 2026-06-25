import { Injectable } from '@nestjs/common';
import { Customer } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Pemilik data tabel `customers`. Pelanggan "otomatis terdata" lewat No HP.
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
}

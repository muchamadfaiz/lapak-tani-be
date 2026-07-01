import { Injectable } from '@nestjs/common';
import { Banner, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class BannerRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.BannerCreateInput): Promise<Banner> {
    return this.prisma.banner.create({ data });
  }

  findById(id: string): Promise<Banner | null> {
    return this.prisma.banner.findUnique({ where: { id } });
  }

  findAll(): Promise<Banner[]> {
    return this.prisma.banner.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  findAllActive(): Promise<Banner[]> {
    const now = new Date();
    return this.prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  update(id: string, data: Prisma.BannerUpdateInput): Promise<Banner> {
    return this.prisma.banner.update({ where: { id }, data });
  }

  delete(id: string): Promise<Banner> {
    return this.prisma.banner.delete({ where: { id } });
  }
}

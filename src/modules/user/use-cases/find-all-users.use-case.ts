import { Injectable } from '@nestjs/common';
import { PageMetaDto, PageOptionsDto } from '../../../common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserResponseDto } from '../dto';
import { UserMapper } from '../mapper/user.mapper';

const USER_INCLUDE = { role: true, profile: true } as const;

@Injectable()
export class FindAllUsersUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    query: PageOptionsDto,
  ): Promise<{ data: UserResponseDto[]; meta: PageMetaDto }> {
    // ponytail: list ini hanya dipakai halaman "Kelola Staff" (petugas). Admin dibuat
    // di luar app, jadi disembunyikan dari daftar.
    const where = { deletedAt: null, role: { name: { not: 'ADMIN' } } };

    const [users, totalData] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: USER_INCLUDE,
        skip: query.skip,
        take: query.limit,
        orderBy: query.sortBy
          ? { [query.sortBy]: query.order }
          : { createdAt: query.order },
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = UserMapper.toResponseDtoList(users);
    const meta = new PageMetaDto({
      page: query.page,
      limit: query.limit,
      totalData,
    });

    return { data, meta };
  }
}

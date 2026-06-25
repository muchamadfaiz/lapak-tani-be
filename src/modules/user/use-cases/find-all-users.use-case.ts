import { Injectable } from '@nestjs/common';
import { PageMetaDto, PageOptionsDto } from '../../../common';
import { UserRepository } from '../repository/user.repository';
import { UserResponseDto } from '../dto';
import { UserMapper } from '../mapper/user.mapper';

@Injectable()
export class FindAllUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    query: PageOptionsDto,
  ): Promise<{ data: UserResponseDto[]; meta: PageMetaDto }> {
    // ponytail: list ini hanya dipakai halaman "Kelola Staff" (petugas). Admin dibuat
    // di luar app, jadi disembunyikan dari daftar.
    const where = { deletedAt: null, role: { name: { not: 'ADMIN' } } };

    const [users, totalData] = await Promise.all([
      this.userRepository.findManyWithRelations({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: query.sortBy
          ? { [query.sortBy]: query.order }
          : { createdAt: query.order },
      }),
      this.userRepository.count(where),
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

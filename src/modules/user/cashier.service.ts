import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from './repository/user.repository';
import { OutletContract } from '../outlet';
import {
  CashierResponseDto,
  CreateCashierDto,
  UpdateCashierDto,
} from './dto/cashier.dto';

/**
 * Pengelolaan akun kasir oleh admin. Kasir = User ber-role KASIR + outletId.
 * Reuse UserRepository; OutletContract untuk validasi & nama outlet.
 */
@Injectable()
export class CashierService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly outletContract: OutletContract,
  ) {}

  async list(): Promise<CashierResponseDto[]> {
    const cashiers = await this.userRepository.findByRole('KASIR');
    // Ambil nama outlet sekali (hindari N+1).
    const cache = new Map<string, string | null>();
    const nameOf = async (id: string | null) => {
      if (!id) return null;
      if (cache.has(id)) return cache.get(id)!;
      const o = await this.outletContract.findById(id);
      cache.set(id, o?.name ?? null);
      return o?.name ?? null;
    };
    return Promise.all(cashiers.map((c) => this.toDto(c, nameOf)));
  }

  async create(dto: CreateCashierDto): Promise<CashierResponseDto> {
    if (await this.userRepository.findByEmail(dto.email)) {
      throw new BadRequestException('Email sudah dipakai');
    }
    const outlet = await this.outletContract.findById(dto.outletId);
    if (!outlet) throw new BadRequestException('Outlet tidak ditemukan');

    const role = await this.userRepository.findRoleByName('KASIR');
    if (!role) {
      throw new BadRequestException('Role KASIR belum ada. Jalankan seed dulu.');
    }

    const user = await this.userRepository.createWithProfile({
      email: dto.email,
      password: await bcrypt.hash(dto.password, 10),
      roleId: role.id,
      outletId: dto.outletId,
      profile: { fullName: dto.fullName },
    });
    return this.toDto(user, async () => outlet.name);
  }

  async update(id: string, dto: UpdateCashierDto): Promise<CashierResponseDto> {
    const existing = await this.userRepository.findByIdWithRelations(id);
    if (!existing || existing.role?.name !== 'KASIR') {
      throw new NotFoundException('Kasir tidak ditemukan');
    }
    if (dto.outletId) {
      const o = await this.outletContract.findById(dto.outletId);
      if (!o) throw new BadRequestException('Outlet tidak ditemukan');
    }

    const userData: Record<string, unknown> = {};
    if (dto.outletId !== undefined) userData.outletId = dto.outletId;
    if (dto.isActive !== undefined) userData.isActive = dto.isActive;
    if (dto.password) userData.password = await bcrypt.hash(dto.password, 10);

    const updated = await this.userRepository.updateWithProfile(
      id,
      userData,
      dto.fullName !== undefined ? { fullName: dto.fullName } : null,
    );
    return this.toDto(updated, async (oid) => {
      if (!oid) return null;
      const o = await this.outletContract.findById(oid);
      return o?.name ?? null;
    });
  }

  private async toDto(
    user: {
      id: string;
      email: string;
      isActive: boolean;
      outletId: string | null;
      createdAt: Date;
      profile?: { fullName: string | null } | null;
    },
    nameOf: (outletId: string | null) => Promise<string | null>,
  ): Promise<CashierResponseDto> {
    return {
      id: user.id,
      email: user.email,
      fullName: user.profile?.fullName ?? '',
      outletId: user.outletId ?? null,
      outletName: await nameOf(user.outletId ?? null),
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }
}

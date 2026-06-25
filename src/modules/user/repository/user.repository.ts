import { Injectable } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

const USER_INCLUDE = { role: true, profile: true } as const;

export type UserWithRelations = Prisma.UserGetPayload<{
  include: typeof USER_INCLUDE;
}>;

/**
 * Pemilik data tabel `users` & `profiles`. Satu-satunya tempat yang boleh
 * mengakses `prisma.user`/`prisma.profile`. Modul lain TIDAK boleh query
 * tabel ini langsung — gunakan UserContract.
 */
@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByIdWithRelations(id: string): Promise<UserWithRelations | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: USER_INCLUDE,
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findRoleByName(name: string): Promise<Role | null> {
    return this.prisma.role.findUnique({ where: { name } });
  }

  async findIdsByRole(roleName: string): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null, role: { name: roleName } },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  findManyWithRelations(args: {
    where: Prisma.UserWhereInput;
    skip?: number;
    take?: number;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<UserWithRelations[]> {
    return this.prisma.user.findMany({ ...args, include: USER_INCLUDE });
  }

  count(where: Prisma.UserWhereInput): Promise<number> {
    return this.prisma.user.count({ where });
  }

  createWithProfile(data: {
    email: string;
    password: string;
    roleId: string;
    profile: { fullName: string; phone?: string; address?: string };
  }): Promise<UserWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: data.email,
          password: data.password,
          roleId: data.roleId,
          emailVerifiedAt: new Date(),
        },
      });

      await tx.profile.create({
        data: {
          userId: created.id,
          fullName: data.profile.fullName,
          phone: data.profile.phone,
          address: data.profile.address,
        },
      });

      return tx.user.findUniqueOrThrow({
        where: { id: created.id },
        include: USER_INCLUDE,
      });
    });
  }

  /**
   * Update user dan/atau profile dalam satu transaksi.
   * - `userData`: diterapkan ke tabel users bila ada key-nya.
   * - `profile`: bila tidak null, di-upsert ke tabel profiles.
   */
  updateWithProfile(
    id: string,
    userData: Prisma.UserUpdateInput,
    profile: { fullName?: string; phone?: string; address?: string } | null,
  ): Promise<UserWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length > 0) {
        await tx.user.update({ where: { id }, data: userData });
      }

      if (profile) {
        await tx.profile.upsert({
          where: { userId: id },
          update: {
            ...(profile.fullName !== undefined && {
              fullName: profile.fullName,
            }),
            ...(profile.phone !== undefined && { phone: profile.phone }),
            ...(profile.address !== undefined && { address: profile.address }),
          },
          create: {
            userId: id,
            fullName: profile.fullName ?? '',
            phone: profile.phone,
            address: profile.address,
          },
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id },
        include: USER_INCLUDE,
      });
    });
  }

  /**
   * Soft delete user + cabut semua refresh token aktifnya (cascade lifecycle).
   * Catatan: modul user tidak boleh bergantung pada modul auth (auth → user),
   * jadi revoke token dilakukan di sini sebagai bagian dari lifecycle user.
   */
  async softDelete(id: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    ]);
  }

  findByEmailWithRelations(email: string): Promise<UserWithRelations | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: USER_INCLUDE,
    });
  }

  createWithProfileForAuth(data: {
    email: string;
    passwordHash: string;
    roleId: string;
    emailVerifiedAt: Date | null;
    fullName: string;
  }): Promise<UserWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: data.email,
          password: data.passwordHash,
          roleId: data.roleId,
          emailVerifiedAt: data.emailVerifiedAt,
        },
      });

      await tx.profile.create({
        data: {
          userId: created.id,
          fullName: data.fullName,
        },
      });

      return tx.user.findUniqueOrThrow({
        where: { id: created.id },
        include: USER_INCLUDE,
      });
    });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
        passwordChangedAt: new Date(),
      },
    });
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
  }
}

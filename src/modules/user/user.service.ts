import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './repository/user.repository';
import { UserContract, UserForAuth } from './user.contract';
import { UserResponseDto } from './dto';
import { UserMapper } from './mapper/user.mapper';

/**
 * Implementasi UserContract — memenuhi janji lintas-modul. CRUD user milik
 * modul ini sendiri (endpoint /users) tetap di use-case.
 */
@Injectable()
export class UserService extends UserContract {
  constructor(private readonly userRepository: UserRepository) {
    super();
  }

  async getById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findByIdWithRelations(id);
    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }
    return UserMapper.toResponseDto(user);
  }

  async findByEmailForAuth(email: string): Promise<UserForAuth | null> {
    const user = await this.userRepository.findByEmailWithRelations(email);
    if (!user) return null;
    return this.mapToUserForAuth(user);
  }

  async findByPhoneForAuth(phone: string): Promise<UserForAuth | null> {
    const user = await this.userRepository.findByPhoneWithRelations(phone);
    if (!user) return null;
    return this.mapToUserForAuth(user);
  }

  async findByIdForAuth(id: string): Promise<UserForAuth | null> {
    const user = await this.userRepository.findByIdWithRelations(id);
    if (!user) return null;
    return this.mapToUserForAuth(user);
  }

  async createForAuth(data: {
    email: string;
    phone: string;
    passwordHash: string;
    fullName: string;
    emailVerifiedAt: Date | null;
  }): Promise<UserForAuth> {
    const defaultRole = await this.userRepository.findRoleByName('USER');
    if (!defaultRole) {
      throw new BadRequestException('Default role USER not found');
    }

    const user = await this.userRepository.createWithProfileForAuth({
      email: data.email,
      phone: data.phone,
      passwordHash: data.passwordHash,
      roleId: defaultRole.id,
      emailVerifiedAt: data.emailVerifiedAt,
      fullName: data.fullName,
    });

    return this.mapToUserForAuth(user);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.userRepository.updatePassword(userId, passwordHash);
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.userRepository.markEmailVerified(userId);
  }

  getAdminIds(): Promise<string[]> {
    return this.userRepository.findIdsByRole('ADMIN');
  }

  private mapToUserForAuth(user: any): UserForAuth {
    return {
      id: user.id,
      email: user.email,
      phone: user.profile?.phone ?? '',
      fullName: user.profile?.fullName ?? '',
      passwordHash: user.password,
      isActive: user.isActive,
      deletedAt: user.deletedAt,
      emailVerifiedAt: user.emailVerifiedAt,
      role: {
        id: user.role.id,
        name: user.role.name,
      },
    };
  }
}

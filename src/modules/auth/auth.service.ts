import { Injectable } from '@nestjs/common';
import { AuthContract } from './auth.contract';
import { UserContract } from '../user/user.contract';

/**
 * Implementasi AuthContract — memenuhi janji lintas-modul.
 * Auth flow internal (login, register, dsb) tetap di use-case.
 */
@Injectable()
export class AuthService extends AuthContract {
  constructor(private readonly userContract: UserContract) {
    super();
  }

  async validateUser(
    userId: string,
  ): Promise<{ id: string; email: string; role: string } | null> {
    const user = await this.userContract.findByIdForAuth(userId);

    if (!user || !user.isActive || user.deletedAt) {
      return null;
    }

    return { id: user.id, email: user.email, role: user.role.name };
  }
}

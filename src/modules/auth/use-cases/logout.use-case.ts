import { Injectable } from '@nestjs/common';
import { AuthRepository } from '../repository/auth.repository';

@Injectable()
export class LogoutUseCase {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(userId: string): Promise<void> {
    await this.authRepository.revokeAllRefreshTokens(userId);
  }
}

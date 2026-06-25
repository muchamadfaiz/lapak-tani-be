import { Injectable } from '@nestjs/common';
import { AuthRepository } from '../repository/auth.repository';
import { ResendVerificationDto } from '../dto';
import { SendVerificationEmailUseCase } from './send-verification-email.use-case';
import { UserContract } from '../../user/user.contract';

@Injectable()
export class ResendVerificationUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly sendVerificationEmailUseCase: SendVerificationEmailUseCase,
    private readonly userContract: UserContract,
  ) {}

  async execute(dto: ResendVerificationDto): Promise<void> {
    const user = await this.userContract.findByEmailForAuth(dto.email);

    // Don't reveal if email exists or is already verified
    if (!user || user.deletedAt || !user.isActive || user.emailVerifiedAt) {
      return;
    }

    await this.sendVerificationEmailUseCase.execute(user.id, user.email);
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { AuthRepository } from '../repository/auth.repository';
import { VerifyEmailDto } from '../dto';
import { UserContract } from '../../user/user.contract';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly userContract: UserContract,
  ) {}

  async execute(dto: VerifyEmailDto): Promise<void> {
    const hashedToken = createHash('sha256').update(dto.token).digest('hex');

    const tokenRecord = await this.authRepository.findEmailVerificationToken(hashedToken);

    if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Mark email as verified in User module
    await this.userContract.markEmailVerified(tokenRecord.userId);

    // Mark email verification token as used in Auth module
    await this.authRepository.markEmailVerificationTokenUsed(tokenRecord.id);
  }
}

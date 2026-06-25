import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from '../repository/auth.repository';
import { ResetPasswordDto } from '../dto';
import { UserContract } from '../../user/user.contract';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly userContract: UserContract,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<void> {
    const hashedToken = createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const tokenRecord = await this.authRepository.findPasswordResetToken(hashedToken);

    if (
      !tokenRecord ||
      tokenRecord.usedAt ||
      tokenRecord.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // Update user password
    await this.userContract.updatePassword(tokenRecord.userId, hashedPassword);

    // Mark password reset token as used
    await this.authRepository.markPasswordResetTokenUsed(tokenRecord.id);

    // Revoke all refresh tokens for security
    await this.authRepository.revokeAllRefreshTokens(tokenRecord.userId);
  }
}

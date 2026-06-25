import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { AuthRepository } from '../repository/auth.repository';
import { EmailContract } from '../../email/email.contract';
import { ForgotPasswordDto } from '../dto';
import { UserContract } from '../../user/user.contract';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly emailContract: EmailContract,
    private readonly configService: ConfigService,
    private readonly userContract: UserContract,
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.userContract.findByEmailForAuth(dto.email);

    // Always return OK — don't reveal if email exists
    if (!user || user.deletedAt || !user.isActive) {
      return;
    }

    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await this.authRepository.createPasswordResetToken({
      userId: user.id,
      token: hashedToken,
      expiresAt,
    });

    const frontendUrl = this.configService.get<string>(
      'email.frontendUrl',
      'http://localhost:3000',
    );
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    await this.emailContract.sendPasswordResetEmail(user.email, resetUrl);
  }
}

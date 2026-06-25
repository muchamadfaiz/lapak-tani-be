import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from '../repository/auth.repository';
import { ChangePasswordDto } from '../dto';
import { UserContract } from '../../user/user.contract';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly userContract: UserContract,
  ) {}

  async execute(input: {
    userId: string;
    dto: ChangePasswordDto;
  }): Promise<void> {
    const { userId, dto } = input;

    const user = await this.userContract.findByIdForAuth(userId);

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const isOldPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.passwordHash,
    );

    if (!isOldPasswordValid) {
      throw new BadRequestException('Old password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.userContract.updatePassword(userId, hashedPassword);

    // Revoke all refresh tokens for security
    await this.authRepository.revokeAllRefreshTokens(userId);
  }
}

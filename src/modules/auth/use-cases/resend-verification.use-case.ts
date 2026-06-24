import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResendVerificationDto } from '../dto';
import { SendVerificationEmailUseCase } from './send-verification-email.use-case';

@Injectable()
export class ResendVerificationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sendVerificationEmailUseCase: SendVerificationEmailUseCase,
  ) {}

  async execute(dto: ResendVerificationDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Don't reveal if email exists or is already verified
    if (!user || user.deletedAt || !user.isActive || user.emailVerifiedAt) {
      return;
    }

    await this.sendVerificationEmailUseCase.execute(user.id, user.email);
  }
}

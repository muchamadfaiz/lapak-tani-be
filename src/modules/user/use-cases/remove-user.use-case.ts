import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../repository/user.repository';

@Injectable()
export class RemoveUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.softDelete(id);
  }
}

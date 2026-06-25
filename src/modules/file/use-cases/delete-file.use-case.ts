import { Injectable, NotFoundException } from '@nestjs/common';
import { FileRepository } from '../repository/file.repository';
import { StorageContract } from '../storage/storage.contract';

@Injectable()
export class DeleteFileUseCase {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly storage: StorageContract,
  ) {}

  async execute(id: string): Promise<void> {
    const file = await this.fileRepository.findById(id);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    await this.storage.delete(file.url);
    await this.fileRepository.deleteById(id);
  }
}

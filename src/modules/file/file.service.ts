import { Injectable, NotFoundException } from '@nestjs/common';
import { File } from '@prisma/client';
import { FileRepository } from './repository/file.repository';
import { FileContract, FileRef } from './file.contract';

/**
 * Implementasi FileContract. Memenuhi janji lintas-modul (getFileById,
 * assertExists). CRUD file milik modul ini sendiri (tulis/hapus dari
 * endpoint) tetap di use-case, bukan di sini.
 */
@Injectable()
export class FileService extends FileContract {
  constructor(private readonly fileRepository: FileRepository) {
    super();
  }

  async getFileById(id: string): Promise<FileRef | null> {
    const file = await this.fileRepository.findById(id);
    return file ? FileService.toRef(file) : null;
  }

  async assertExists(id: string): Promise<void> {
    const file = await this.fileRepository.findById(id);
    if (!file) {
      throw new NotFoundException('File not found');
    }
  }

  private static toRef(file: File): FileRef {
    return {
      id: file.id,
      originalName: file.originalName,
      filename: file.filename,
      url: file.url,
      mimetype: file.mimetype,
      size: file.size,
      createdAt: file.createdAt,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { FileRepository } from '../repository/file.repository';
import { StorageContract } from '../storage/storage.contract';
import { FileResponseDto } from '../dto';
import { mapFileToResponse } from '../mapper/file.mapper';

@Injectable()
export class UploadFileUseCase {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly storage: StorageContract,
  ) {}

  async execute(input: {
    file: Express.Multer.File;
    userId: string;
    baseUrl: string;
  }): Promise<FileResponseDto> {
    const { file, userId, baseUrl } = input;
    const dateDir = new Date().toISOString().split('T')[0];
    const url = this.storage.buildUrl(file.filename, dateDir);

    const record = await this.fileRepository.create({
      userId,
      originalName: file.originalname,
      filename: file.filename,
      url,
      mimetype: file.mimetype,
      size: file.size,
    });

    return mapFileToResponse(record, baseUrl);
  }
}

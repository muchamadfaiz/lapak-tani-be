import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UploadResponseDto } from '../dto';
import { mapFileToResponse } from '../mapper/upload.mapper';

@Injectable()
export class UploadFileUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(input: {
    file: Express.Multer.File;
    userId: string;
    baseUrl: string;
  }): Promise<UploadResponseDto> {
    const { file, userId, baseUrl } = input;
    const dateDir = new Date().toISOString().split('T')[0];
    const url = `/uploads/${dateDir}/${file.filename}`;

    const record = await this.prisma.file.create({
      data: {
        userId,
        originalName: file.originalname,
        filename: file.filename,
        url,
        mimetype: file.mimetype,
        size: file.size,
      },
    });

    return mapFileToResponse(record, baseUrl);
  }
}

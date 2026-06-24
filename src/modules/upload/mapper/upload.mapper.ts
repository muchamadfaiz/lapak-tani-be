import { File as PrismaFile } from '@prisma/client';
import { UploadResponseDto } from '../dto';

export function mapFileToResponse(file: PrismaFile, baseUrl: string): UploadResponseDto {
  return {
    id: file.id,
    originalName: file.originalName,
    filename: file.filename,
    url: file.url,
    secureUrl: `${baseUrl}${file.url}`,
    mimetype: file.mimetype,
    size: file.size,
    createdAt: file.createdAt,
  };
}

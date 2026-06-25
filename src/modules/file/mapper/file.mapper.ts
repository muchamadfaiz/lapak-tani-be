import { File } from '@prisma/client';
import { FileResponseDto } from '../dto';

/** Map row Prisma `File` → response HTTP, menambah `secureUrl` (full URL). */
export function mapFileToResponse(
  file: File,
  baseUrl: string,
): FileResponseDto {
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

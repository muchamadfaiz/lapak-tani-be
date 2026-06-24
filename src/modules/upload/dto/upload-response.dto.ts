import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({ description: 'File UUID' })
  id: string;

  @ApiProperty({ description: 'Original file name from client', example: 'selfie.jpg' })
  originalName: string;

  @ApiProperty({ description: 'Stored file name on disk', example: 'a1b2c3d4.jpg' })
  filename: string;

  @ApiProperty({ description: 'Relative URL path', example: '/uploads/2026-03-11/a1b2c3d4.jpg' })
  url: string;

  @ApiProperty({ description: 'Full URL ready to use', example: 'http://localhost:3000/uploads/2026-03-11/a1b2c3d4.jpg' })
  secureUrl: string;

  @ApiProperty({ description: 'MIME type', example: 'image/jpeg' })
  mimetype: string;

  @ApiProperty({ description: 'File size in bytes', example: 245760 })
  size: number;

  @ApiProperty({ description: 'Upload timestamp' })
  createdAt: Date;
}

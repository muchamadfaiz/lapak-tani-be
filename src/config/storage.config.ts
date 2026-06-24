import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  uploadDest: process.env.FILE_UPLOAD_DEST || './uploads',
  maxFileSize:
    parseInt(process.env.FILE_UPLOAD_MAX_SIZE, 10) || 5 * 1024 * 1024, // 5MB
}));

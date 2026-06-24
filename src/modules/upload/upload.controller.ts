import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, ResponseMessage, Roles } from '../../common';
import { UploadFileUseCase, DeleteFileUseCase } from './use-cases';

@ApiBearerAuth()
@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadFileUseCase: UploadFileUseCase,
    private readonly deleteFileUseCase: DeleteFileUseCase,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size exceeded' })
  @ResponseMessage('Success upload file')
  upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Req() req: Request,
  ) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.uploadFileUseCase.execute({ file, userId, baseUrl });
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a file (Admin only)' })
  @ApiParam({ name: 'id', description: 'File UUID' })
  @ApiResponse({ status: 204, description: 'File deleted' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage('Success delete file')
  remove(@Param('id') id: string) {
    return this.deleteFileUseCase.execute(id);
  }
}

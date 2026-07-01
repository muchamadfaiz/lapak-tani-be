import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public, ResponseMessage, Roles } from '../../common';
import { CreateBannerDto, UpdateBannerDto } from './dto';
import {
  CreateBannerUseCase,
  FindAllBannersUseCase,
  FindBannerByIdUseCase,
  UpdateBannerUseCase,
  RemoveBannerUseCase,
} from './use-cases';

@ApiTags('Banners')
@Controller('banners')
export class BannerController {
  constructor(
    private readonly createBannerUseCase: CreateBannerUseCase,
    private readonly findAllBannersUseCase: FindAllBannersUseCase,
    private readonly findBannerByIdUseCase: FindBannerByIdUseCase,
    private readonly updateBannerUseCase: UpdateBannerUseCase,
    private readonly removeBannerUseCase: RemoveBannerUseCase,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List semua banner (publik)' })
  @ApiQuery({ name: 'active', required: false, type: Boolean, description: 'Filter hanya banner aktif & dalam jadwal' })
  @ApiResponse({ status: 200, description: 'Daftar banner' })
  @ResponseMessage('Success get banners')
  findAll(@Query('active') active?: string) {
    return this.findAllBannersUseCase.execute(active === 'true');
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detail banner (publik)' })
  @ApiParam({ name: 'id', description: 'Banner UUID' })
  @ApiResponse({ status: 200, description: 'Banner ditemukan' })
  @ApiResponse({ status: 404, description: 'Banner tidak ditemukan' })
  @ResponseMessage('Success get banner')
  findById(@Param('id') id: string) {
    return this.findBannerByIdUseCase.execute(id);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Post()
  @ApiOperation({ summary: 'Buat banner (Admin)' })
  @ApiResponse({ status: 201, description: 'Banner dibuat' })
  @ApiResponse({ status: 403, description: 'Akses ditolak' })
  @ResponseMessage('Success create banner')
  create(@Body() dto: CreateBannerDto) {
    return this.createBannerUseCase.execute(dto);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Patch(':id')
  @ApiOperation({ summary: 'Update banner (Admin)' })
  @ApiParam({ name: 'id', description: 'Banner UUID' })
  @ApiResponse({ status: 200, description: 'Banner diperbarui' })
  @ApiResponse({ status: 404, description: 'Banner tidak ditemukan' })
  @ResponseMessage('Success update banner')
  update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.updateBannerUseCase.execute(id, dto);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hapus banner (Admin)' })
  @ApiParam({ name: 'id', description: 'Banner UUID' })
  @ApiResponse({ status: 204, description: 'Banner dihapus' })
  @ApiResponse({ status: 404, description: 'Banner tidak ditemukan' })
  @ResponseMessage('Success delete banner')
  remove(@Param('id') id: string) {
    return this.removeBannerUseCase.execute(id);
  }
}

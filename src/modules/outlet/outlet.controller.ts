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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public, ResponseMessage, Roles } from '../../common';
import {
  CreateOutletDto,
  UpdateOutletDto,
  FindOutletsQueryDto,
} from './dto';
import {
  CreateOutletUseCase,
  FindAllOutletsUseCase,
  FindOutletByIdUseCase,
  UpdateOutletUseCase,
  RemoveOutletUseCase,
} from './use-cases';

@ApiTags('Outlets')
@Controller('outlets')
export class OutletController {
  constructor(
    private readonly createOutletUseCase: CreateOutletUseCase,
    private readonly findAllOutletsUseCase: FindAllOutletsUseCase,
    private readonly findOutletByIdUseCase: FindOutletByIdUseCase,
    private readonly updateOutletUseCase: UpdateOutletUseCase,
    private readonly removeOutletUseCase: RemoveOutletUseCase,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List outlet (publik). Kirim lat & lng untuk urut terdekat + jarak',
  })
  @ApiResponse({ status: 200, description: 'Daftar outlet' })
  @ResponseMessage('Success get outlets')
  findAll(@Query() query: FindOutletsQueryDto) {
    return this.findAllOutletsUseCase.execute(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detail outlet (publik)' })
  @ApiParam({ name: 'id', description: 'Outlet UUID' })
  @ApiResponse({ status: 200, description: 'Outlet ditemukan' })
  @ApiResponse({ status: 404, description: 'Outlet tidak ditemukan' })
  @ResponseMessage('Success get outlet')
  findById(@Param('id') id: string) {
    return this.findOutletByIdUseCase.execute(id);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Post()
  @ApiOperation({ summary: 'Buat outlet (Admin)' })
  @ApiResponse({ status: 201, description: 'Outlet dibuat' })
  @ApiResponse({ status: 403, description: 'Akses ditolak' })
  @ResponseMessage('Success create outlet')
  create(@Body() dto: CreateOutletDto) {
    return this.createOutletUseCase.execute(dto);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Patch(':id')
  @ApiOperation({ summary: 'Update outlet (Admin)' })
  @ApiParam({ name: 'id', description: 'Outlet UUID' })
  @ApiResponse({ status: 200, description: 'Outlet diperbarui' })
  @ApiResponse({ status: 404, description: 'Outlet tidak ditemukan' })
  @ResponseMessage('Success update outlet')
  update(@Param('id') id: string, @Body() dto: UpdateOutletDto) {
    return this.updateOutletUseCase.execute(id, dto);
  }

  @ApiBearerAuth()
  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hapus outlet (Admin)' })
  @ApiParam({ name: 'id', description: 'Outlet UUID' })
  @ApiResponse({ status: 204, description: 'Outlet dihapus' })
  @ApiResponse({ status: 404, description: 'Outlet tidak ditemukan' })
  @ResponseMessage('Success delete outlet')
  remove(@Param('id') id: string) {
    return this.removeOutletUseCase.execute(id);
  }
}

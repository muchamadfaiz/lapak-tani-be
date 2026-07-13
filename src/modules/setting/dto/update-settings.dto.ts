import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Aktifkan pembayaran online (Xendit). false = hanya transfer/cash.',
  })
  @IsOptional()
  @IsBoolean()
  onlinePaymentEnabled?: boolean;

  @ApiPropertyOptional({ example: 'BCA' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  bankName?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  bankAccountNumber?: string;

  @ApiPropertyOptional({ example: 'Lapak Tani' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankAccountName?: string;
}

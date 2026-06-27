import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({ example: '081234567890' })
  @IsString()
  @Matches(/^[0-9+]{8,16}$/, { message: 'Nomor HP tidak valid' })
  phone: string;

  @ApiPropertyOptional({ example: 'verify', default: 'verify' })
  @IsOptional()
  @IsString()
  purpose?: string;
}

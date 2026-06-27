import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '081234567890' })
  @IsString()
  @Matches(/^[0-9+]{8,16}$/, { message: 'Nomor HP tidak valid' })
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^[0-9]{4,8}$/, { message: 'Kode OTP tidak valid' })
  code: string;

  @ApiPropertyOptional({ example: 'verify', default: 'verify' })
  @IsOptional()
  @IsString()
  purpose?: string;
}

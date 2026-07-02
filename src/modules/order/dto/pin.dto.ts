import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

const PIN_REGEX = /^[0-9]{6}$/;

export class SetPinDto {
  @ApiProperty({ example: '123456', description: 'PIN 6 angka' })
  @IsString()
  @Matches(PIN_REGEX, { message: 'PIN harus 6 angka' })
  pin: string;
}

export class VerifyPinDto {
  @ApiProperty({ example: '081234567890' })
  @IsString()
  @Matches(/^[0-9+]{8,16}$/, { message: 'Nomor HP tidak valid' })
  phone: string;

  @ApiProperty({ example: '123456', description: 'PIN 6 angka' })
  @IsString()
  @Matches(PIN_REGEX, { message: 'PIN harus 6 angka' })
  pin: string;
}

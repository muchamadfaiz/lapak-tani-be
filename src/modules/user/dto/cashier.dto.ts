import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateCashierDto {
  @ApiProperty({ example: 'kasir.ilir@lapaktani.store' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'rahasia123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Siti Kasir' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'Outlet tempat kasir bertugas' })
  @IsUUID()
  outletId: string;
}

export class UpdateCashierDto {
  @ApiPropertyOptional({ example: 'Siti Kasir' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Pindahkan kasir ke outlet lain' })
  @IsOptional()
  @IsUUID()
  outletId?: string;

  @ApiPropertyOptional({ description: 'Aktif/nonaktifkan akun kasir' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Reset password (min 6)', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

export class CashierResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty({ nullable: true })
  outletId: string | null;

  @ApiProperty({ nullable: true })
  outletName: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;
}

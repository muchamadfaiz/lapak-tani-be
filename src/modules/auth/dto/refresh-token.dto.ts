import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'The refresh token issued during login or previous refresh', example: 'eyJhbGciOiJIUzI1NiIs...' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

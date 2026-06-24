import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty({ description: 'Full name of the user', example: 'John Doe' })
  fullName: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+6281234567890' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Address', example: 'Jakarta, Indonesia' })
  address?: string;

  @ApiPropertyOptional({ description: 'Avatar image URL' })
  avatarUrl?: string;
}

export class RoleResponseDto {
  @ApiProperty({ description: 'Role UUID' })
  id: string;

  @ApiProperty({ description: 'Role name', example: 'ADMIN' })
  name: string;
}

export class UserResponseDto {
  @ApiProperty({ description: 'User UUID' })
  id: string;

  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'Assigned role', type: RoleResponseDto })
  role: RoleResponseDto;

  @ApiPropertyOptional({ description: 'User profile information', type: ProfileResponseDto })
  profile?: ProfileResponseDto;

  @ApiProperty({ description: 'Whether the user account is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Account creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

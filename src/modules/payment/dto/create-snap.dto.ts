import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateSnapDto {
  @ApiProperty({ description: 'ID order yang akan dibayar' })
  @IsUUID()
  orderId: string;
}

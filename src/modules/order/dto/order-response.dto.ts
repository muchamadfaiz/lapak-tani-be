import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemResponseDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  subtotal: number;
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'ORD-20260625-1234' })
  orderNumber: string;

  @ApiProperty()
  outletId: string;

  @ApiProperty({ example: 'pending' })
  status: string;

  @ApiProperty()
  customerName: string | null;

  @ApiProperty({ example: '081234567890' })
  phone: string;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  shippingCost: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  paymentMethod: string;

  @ApiProperty()
  shippingAddress: string;

  @ApiProperty({ nullable: true })
  notes: string | null;

  @ApiProperty({ nullable: true, description: 'Jarak outlet→tujuan (km)' })
  distanceKm: number | null;

  @ApiPropertyOptional({
    description: 'Link WhatsApp ke admin untuk konfirmasi pembayaran manual',
  })
  whatsappUrl?: string;

  @ApiProperty({
    nullable: true,
    description: 'Batas waktu bayar untuk order pending (auto-cancel bila lewat)',
  })
  expiresAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FileContract } from '../../file';
import { OrderRepository } from '../repository/order.repository';
import { OrderMapper } from '../mapper/order.mapper';
import { OrderResponseDto } from '../dto';

/**
 * Pelanggan (tamu) mengunggah bukti transfer untuk order-nya. Otorisasi cukup
 * dari orderId (UUID, tak bisa ditebak) + order harus masih `pending`.
 * Admin yang memverifikasi (ubah status → confirmed).
 */
@Injectable()
export class UploadPaymentProofUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly fileContract: FileContract,
  ) {}

  async execute(
    orderId: string,
    file: Express.Multer.File,
  ): Promise<OrderResponseDto> {
    if (!file) {
      throw new BadRequestException('Bukti transfer wajib diunggah');
    }
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order tidak ditemukan');
    }
    if (order.status !== 'pending') {
      throw new BadRequestException('Order ini sudah diproses');
    }
    const url = this.fileContract.buildUploadUrl(file);
    const updated = await this.orderRepository.setPaymentProof(orderId, url);
    return OrderMapper.toResponseDto(updated);
  }
}

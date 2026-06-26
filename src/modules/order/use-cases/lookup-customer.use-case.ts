import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderRepository } from '../repository/order.repository';
import { CustomerRepository } from '../repository/customer.repository';
import { OrderMapper } from '../mapper/order.mapper';
import { CustomerLookupDto } from '../dto';
import { normalizePhone } from '../order.util';

/**
 * Lookup pelanggan by No HP (publik, tanpa login) — tampilkan saldo poin,
 * riwayat order, dan riwayat poin. Identitas = No HP yang dinormalisasi.
 */
@Injectable()
export class LookupCustomerUseCase {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(rawPhone: string): Promise<CustomerLookupDto> {
    const phone = normalizePhone(rawPhone || '');
    if (phone.length < 8) {
      throw new BadRequestException('Nomor HP tidak valid');
    }

    const customer = await this.customerRepository.findByPhone(phone);
    if (!customer) {
      throw new NotFoundException(
        'Nomor HP belum terdaftar. Yuk belanja dulu untuk mulai kumpulkan poin!',
      );
    }

    const [orders, history] = await Promise.all([
      this.orderRepository.findByCustomerId(customer.id),
      this.customerRepository.getPointHistory(customer.id),
    ]);

    return {
      phone: customer.phone,
      name: customer.name,
      points: customer.points,
      orders: OrderMapper.toResponseDtoList(orders),
      pointHistory: history.map((h) => ({
        type: h.type,
        amount: h.amount,
        balanceAfter: h.balanceAfter,
        orderId: h.orderId,
        note: h.note,
        createdAt: h.createdAt,
      })),
    };
  }
}

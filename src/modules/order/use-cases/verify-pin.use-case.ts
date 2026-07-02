import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { OtpContract } from '../../otp';
import { CustomerRepository } from '../repository/customer.repository';
import { normalizePhone } from '../order.util';

/**
 * Login cepat dengan PIN (tanpa WA). Cocokkan PIN ke hash tersimpan; bila valid
 * terbitkan token sesi-HP (sama seperti hasil verifikasi WA).
 */
@Injectable()
export class VerifyPinUseCase {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly otpContract: OtpContract,
  ) {}

  async execute(
    rawPhone: string,
    pin: string,
  ): Promise<{ valid: boolean; token: string }> {
    const phone = normalizePhone(rawPhone || '');
    const customer = await this.customerRepository.findByPhone(phone);
    // Pesan seragam untuk hindari bocor "nomor terdaftar atau tidak".
    const fail = () => new UnauthorizedException('Nomor HP atau PIN salah');
    if (!customer || !customer.pinHash) {
      throw fail();
    }
    const ok = await bcrypt.compare(pin, customer.pinHash);
    if (!ok) {
      throw fail();
    }
    return { valid: true, token: this.otpContract.issuePhoneToken(phone) };
  }
}

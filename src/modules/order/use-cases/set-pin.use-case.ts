import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { OtpContract } from '../../otp';
import { CustomerRepository } from '../repository/customer.repository';
import { normalizePhone } from '../order.util';

/**
 * Set/replace PIN login cepat. Otorisasi = token sesi-HP (dari login WA instan),
 * jadi PIN hanya bisa diset oleh pemilik nomor yang sudah terverifikasi WA.
 */
@Injectable()
export class SetPinUseCase {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly otpContract: OtpContract,
  ) {}

  async execute(pin: string, otpToken?: string): Promise<{ ok: boolean; phone: string }> {
    const verified = otpToken ? this.otpContract.verifyPhoneToken(otpToken) : null;
    if (!verified) {
      throw new ForbiddenException('Sesi tidak valid, verifikasi WhatsApp dulu');
    }
    if (!/^[0-9]{6}$/.test(pin)) {
      throw new BadRequestException('PIN harus 6 angka');
    }
    const phone = normalizePhone(verified.phone);
    const pinHash = await bcrypt.hash(pin, 10);
    await this.customerRepository.setPinHash(phone, pinHash);
    return { ok: true, phone };
  }
}

import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import paymentConfig from '../../config/payment.config';

// midtrans-client adalah CommonJS tanpa tipe — pakai require.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const midtransClient = require('midtrans-client');

export interface SnapResult {
  token: string;
  redirectUrl: string;
}

export interface PaymentStatus {
  orderNumber: string;
  status: string; // status order hasil mapping
}

/**
 * Wrapper Midtrans Snap. Detail internal modul Payment.
 * Aktif bila MIDTRANS_ENABLED=true & MIDTRANS_SERVER_KEY terisi.
 */
@Injectable()
export class MidtransService {
  private readonly logger = new Logger(MidtransService.name);
  private readonly snap: {
    createTransaction: (p: unknown) => Promise<{ token: string; redirect_url: string }>;
    transaction: { notification: (b: unknown) => Promise<Record<string, string>> };
  };

  constructor(
    @Inject(paymentConfig.KEY)
    private readonly cfg: ConfigType<typeof paymentConfig>,
  ) {
    this.snap = new midtransClient.Snap({
      isProduction: cfg.isProduction,
      serverKey: cfg.serverKey,
      clientKey: cfg.clientKey,
    });
  }

  get enabled(): boolean {
    return this.cfg.enabled && !!this.cfg.serverKey;
  }

  async createTransaction(params: {
    orderNumber: string;
    grossAmount: number;
    customerName?: string | null;
    phone: string;
  }): Promise<SnapResult> {
    const res = await this.snap.createTransaction({
      transaction_details: {
        order_id: params.orderNumber,
        gross_amount: params.grossAmount,
      },
      customer_details: {
        first_name: params.customerName || 'Pelanggan',
        phone: params.phone,
      },
    });
    return { token: res.token, redirectUrl: res.redirect_url };
  }

  /** Verifikasi & baca webhook, kembalikan orderNumber + status order terpetakan. */
  async readNotification(body: unknown): Promise<PaymentStatus> {
    const stat = await this.snap.transaction.notification(body);
    const tx = stat.transaction_status;
    const fraud = stat.fraud_status;

    let status = 'pending';
    if (tx === 'capture') status = fraud === 'accept' ? 'confirmed' : 'pending';
    else if (tx === 'settlement') status = 'confirmed';
    else if (tx === 'pending') status = 'pending';
    else if (['deny', 'cancel', 'expire', 'failure'].includes(tx)) status = 'cancelled';

    return { orderNumber: stat.order_id, status };
  }
}

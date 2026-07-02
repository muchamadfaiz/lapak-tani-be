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
    transaction: { status: (orderId: string) => Promise<Record<string, string>> };
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
    shippingCost: number;
    customerName?: string | null;
    phone: string;
    items: { productName: string; price: number; quantity: number }[];
  }): Promise<SnapResult> {
    // item_details WAJIB dikirim & totalnya harus PERSIS = gross_amount, kalau
    // tidak beberapa channel (mis. OCTO Clicks, VA, direct debit) menolak dgn
    // "Invalid payment data". Channel toleran (kartu/QRIS) jalan walau tanpa ini.
    const itemDetails: {
      id: string;
      price: number;
      quantity: number;
      name: string;
    }[] = params.items.map((i, idx) => ({
      id: `ITEM-${idx + 1}`,
      price: i.price,
      quantity: i.quantity,
      name: i.productName.slice(0, 50), // Midtrans batas 50 char
    }));
    if (params.shippingCost > 0) {
      itemDetails.push({
        id: 'SHIPPING',
        price: params.shippingCost,
        quantity: 1,
        name: 'Ongkos Kirim',
      });
    }
    // Jaring pengaman: pastikan jumlah item_details == gross_amount.
    const sum = itemDetails.reduce((s, it) => s + it.price * it.quantity, 0);
    if (sum !== params.grossAmount) {
      itemDetails.push({
        id: 'ADJUSTMENT',
        price: params.grossAmount - sum,
        quantity: 1,
        name: 'Penyesuaian',
      });
    }

    const digits = params.phone.replace(/[^0-9]/g, '');
    const res = await this.snap.createTransaction({
      transaction_details: {
        order_id: params.orderNumber,
        gross_amount: params.grossAmount,
      },
      item_details: itemDetails,
      customer_details: {
        first_name: params.customerName || 'Pelanggan',
        phone: params.phone,
        // Sebagian channel butuh email valid; disintesis dari No HP.
        email: `${digits || 'guest'}@lapaktani.store`,
      },
    });
    return { token: res.token, redirectUrl: res.redirect_url };
  }

  /**
   * Baca webhook: ambil order_id dari body lalu tanyakan status OTORITATIF ke
   * Midtrans (jangan percaya body mentah — juga menghindari bug method
   * `transaction.notification()` di midtrans-client yang bisa 404).
   */
  async readNotification(body: unknown): Promise<PaymentStatus> {
    const b = (body ?? {}) as Record<string, unknown>;
    const orderId = String(b.order_id ?? '');
    if (!orderId) {
      throw new Error('Notifikasi tanpa order_id');
    }
    const stat = await this.snap.transaction.status(orderId);
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

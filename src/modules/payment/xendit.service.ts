import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import xenditConfig from '../../config/xendit.config';

const XENDIT_API = 'https://api.xendit.co';

/** Hasil buat invoice: URL halaman bayar Xendit + id invoice. */
export interface CheckoutResult {
  paymentUrl: string;
  referenceId: string;
}

/** Status pembayaran yang sudah dipetakan ke istilah order kita. */
export interface PaymentStatus {
  orderNumber: string;
  /** confirmed = lunas, cancelled = kedaluwarsa/gagal, pending = belum bayar. */
  status: 'confirmed' | 'cancelled' | 'pending';
  /** Channel asli, mis. "BCA", "OVO", "QRIS" — disimpan ke order.paymentMethod. */
  paymentMethod?: string;
}

interface XenditInvoice {
  id: string;
  external_id: string;
  status: string; // PENDING | PAID | SETTLED | EXPIRED
  invoice_url?: string;
  payment_method?: string;
  payment_channel?: string;
}

/** QR dinamis Xendit (QR Codes API v2022-07-31). */
export interface QrResult {
  qrId: string;
  qrString: string; // di-render jadi gambar QR di layar kasir
  referenceId: string; // = orderNumber
  amount: number;
  expiresAt: string | null;
}

interface XenditQr {
  id: string;
  reference_id: string;
  qr_string: string;
  amount?: number;
  status?: string;
  expires_at?: string;
}

// Payload webhook pembayaran QR: { event:'qr.payment', data:{ qr_id, reference_id, status, amount } }
interface XenditQrCallback {
  event?: string;
  data?: {
    id?: string;
    qr_id?: string;
    reference_id?: string;
    status?: string; // SUCCEEDED / COMPLETED
    amount?: number;
  };
}

const QR_API_VERSION = '2022-07-31';

@Injectable()
export class XenditService {
  private readonly logger = new Logger(XenditService.name);

  constructor(
    @Inject(xenditConfig.KEY)
    private readonly cfg: ConfigType<typeof xenditConfig>,
  ) {}

  get enabled(): boolean {
    return this.cfg.enabled && !!this.cfg.secretKey;
  }

  /** True bila memakai kunci sandbox Xendit (xnd_development_*). */
  get sandbox(): boolean {
    return this.cfg.secretKey.startsWith('xnd_development');
  }

  /** Header Basic Auth: secretKey sebagai username, password kosong. */
  private authHeader(): string {
    const basic = Buffer.from(`${this.cfg.secretKey}:`).toString('base64');
    return `Basic ${basic}`;
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    let res: Response;
    try {
      res = await fetch(`${XENDIT_API}${path}`, {
        method,
        headers: {
          Authorization: this.authHeader(),
          'Content-Type': 'application/json',
          ...extraHeaders,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const msg = (json.message as string) || `Xendit error ${res.status}`;
      this.logger.warn(`Xendit ${method} ${path} → ${res.status}: ${msg}`);
      throw new BadRequestException(msg);
    }
    return json as T;
  }

  /**
   * Buat invoice → pelanggan diarahkan ke `invoice_url` (halaman bayar Xendit).
   * `external_id` = orderNumber, sehingga webhook & polling bisa mencocokkan
   * kembali ke order kita tanpa menyimpan kolom tambahan.
   */
  async createInvoice(data: {
    orderNumber: string;
    amount: number;
    shippingCost: number;
    customerName: string | null;
    phone: string;
    items: { productName: string; price: number; quantity: number }[];
  }): Promise<CheckoutResult> {
    const items = [
      ...data.items.map((i) => ({
        name: i.productName.slice(0, 100),
        quantity: i.quantity,
        price: i.price,
      })),
      ...(data.shippingCost > 0
        ? [{ name: 'Ongkos Kirim', quantity: 1, price: data.shippingCost }]
        : []),
    ];

    const invoice = await this.request<XenditInvoice>('POST', '/v2/invoices', {
      external_id: data.orderNumber,
      amount: data.amount,
      currency: 'IDR',
      description: `Pembayaran pesanan ${data.orderNumber} — Lapak Tani`,
      // Xendit mewajibkan email; pakai placeholder bila pelanggan tak punya.
      payer_email: 'noreply@lapaktani.store',
      customer: {
        given_names: data.customerName || 'Pelanggan',
        mobile_number: data.phone,
      },
      items,
      invoice_duration: this.cfg.invoiceDurationSec,
      ...(this.cfg.successRedirectUrl && {
        success_redirect_url: this.cfg.successRedirectUrl,
      }),
      ...(this.cfg.failureRedirectUrl && {
        failure_redirect_url: this.cfg.failureRedirectUrl,
      }),
    });

    if (!invoice.invoice_url) {
      throw new BadRequestException('Xendit tidak mengembalikan URL pembayaran');
    }
    return { paymentUrl: invoice.invoice_url, referenceId: invoice.id };
  }

  /**
   * Buat QRIS dinamis (nominal terkunci) untuk transaksi kasir. `reference_id`
   * = orderNumber, sehingga webhook `qr.payment` bisa dicocokkan balik ke order.
   */
  async createQr(data: {
    orderNumber: string;
    amount: number;
    expiresSec?: number;
  }): Promise<QrResult> {
    const expires_at = new Date(
      Date.now() + (data.expiresSec ?? 900) * 1000,
    ).toISOString();
    const qr = await this.request<XenditQr>(
      'POST',
      '/qr_codes',
      {
        reference_id: data.orderNumber,
        type: 'DYNAMIC',
        currency: 'IDR',
        amount: data.amount,
        expires_at,
      },
      { 'api-version': QR_API_VERSION },
    );
    if (!qr.qr_string) {
      throw new BadRequestException('Xendit tidak mengembalikan QR');
    }
    return {
      qrId: qr.id,
      qrString: qr.qr_string,
      referenceId: qr.reference_id,
      amount: qr.amount ?? data.amount,
      expiresAt: qr.expires_at ?? expires_at,
    };
  }

  /** Cek status invoice by orderNumber (dipakai polling & self-heal). */
  async getStatusByOrderNumber(orderNumber: string): Promise<PaymentStatus> {
    const list = await this.request<XenditInvoice[]>(
      'GET',
      `/v2/invoices?external_id=${encodeURIComponent(orderNumber)}`,
    );
    const invoice = Array.isArray(list) ? list[0] : undefined;
    if (!invoice) {
      throw new BadRequestException('Invoice tidak ditemukan di Xendit');
    }
    return XenditService.toPaymentStatus(invoice);
  }

  /**
   * Verifikasi & baca callback Xendit. Wajib menyertakan header
   * `x-callback-token` yang cocok, kalau tidak → tolak (anti-pemalsuan).
   */
  readCallback(token: string | undefined, body: unknown): PaymentStatus {
    if (!this.cfg.callbackToken || token !== this.cfg.callbackToken) {
      throw new BadRequestException('Callback token tidak valid');
    }
    // Dua bentuk payload: (1) QR payment (event 'qr.payment', punya data.reference_id)
    // atau (2) Invoice (punya external_id di root).
    const qr = body as XenditQrCallback;
    if (qr?.data?.reference_id) {
      const s = (qr.data.status || '').toUpperCase();
      const status: PaymentStatus['status'] =
        s === 'SUCCEEDED' || s === 'COMPLETED' || s === 'PAID'
          ? 'confirmed'
          : s === 'EXPIRED' || s === 'FAILED'
            ? 'cancelled'
            : 'pending';
      return { orderNumber: qr.data.reference_id, status, paymentMethod: 'qris' };
    }
    const inv = body as XenditInvoice;
    if (!inv?.external_id || !inv?.status) {
      throw new BadRequestException('Payload callback tidak dikenal');
    }
    return XenditService.toPaymentStatus(inv);
  }

  private static toPaymentStatus(inv: XenditInvoice): PaymentStatus {
    const s = (inv.status || '').toUpperCase();
    const status: PaymentStatus['status'] =
      s === 'PAID' || s === 'SETTLED'
        ? 'confirmed'
        : s === 'EXPIRED'
          ? 'cancelled'
          : 'pending';
    return {
      orderNumber: inv.external_id,
      status,
      paymentMethod: XenditService.channelLabel(inv),
    };
  }

  /** "BCA" / "OVO" / "QRIS" — channel lebih informatif daripada method. */
  private static channelLabel(inv: XenditInvoice): string | undefined {
    const channel = inv.payment_channel?.trim();
    const method = inv.payment_method?.trim();
    if (!channel && !method) return undefined;
    if (!channel) return method;
    // BANK_TRANSFER + BCA → "BCA VA"; sisanya pakai channel apa adanya.
    return method === 'BANK_TRANSFER' ? `${channel} VA` : channel;
  }
}

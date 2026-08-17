import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SettingContract, XenditCredentials } from '../setting';

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

  constructor(private readonly settings: SettingContract) {}

  /**
   * Kredensial dibaca dari pengaturan SETIAP kali dipakai, bukan sekali saat
   * booting. Konsekuensinya kunci yang baru disimpan admin langsung berlaku
   * tanpa restart — dan tidak ada cache yang bisa membuat webhook diverifikasi
   * dengan token lama. Operasi pembayaran jarang, jadi satu query tambahan
   * tidak berarti apa-apa.
   */
  private creds(): Promise<XenditCredentials> {
    return this.settings.getXenditCredentials();
  }

  /** True bila gerbang dinyalakan admin DAN kuncinya sudah terisi. */
  async isEnabled(): Promise<boolean> {
    const c = await this.creds();
    return c.enabled && !!c.secretKey;
  }

  /** True bila memakai kunci sandbox Xendit (xnd_development_*). */
  async isSandbox(): Promise<boolean> {
    const c = await this.creds();
    return c.secretKey.startsWith('xnd_development');
  }

  /** Header Basic Auth: secretKey sebagai username, password kosong. */
  private static authHeader(secretKey: string): string {
    const basic = Buffer.from(`${secretKey}:`).toString('base64');
    return `Basic ${basic}`;
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    secretKey: string,
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
          Authorization: XenditService.authHeader(secretKey),
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
      // Pesan asli Xendit berbahasa Inggris dan menyebut istilah internal
      // ("API key", "secret key"). Itu berguna untuk kita, tapi jangan pernah
      // sampai ke layar pelanggan yang sedang checkout — dia tidak bisa
      // berbuat apa-apa soal API key, dan pesan begitu hanya membuat panik.
      // Detailnya masuk log; yang dilempar keluar adalah kalimat yang bisa
      // ditindaklanjuti pemakai.
      this.logger.warn(`Xendit ${method} ${path} → ${res.status}: ${msg}`);
      throw new BadRequestException(XenditService.pesanRamah(res.status));
    }
    return json as T;
  }

  /**
   * Terjemahan status HTTP Xendit ke kalimat yang boleh dibaca siapa pun.
   * Sengaja tidak menyebut "API key": pembacanya bisa jadi pelanggan.
   */
  private static pesanRamah(status: number): string {
    if (status === 401 || status === 403) {
      return 'Pembayaran online sedang tidak tersedia. Silakan pilih metode pembayaran lain atau hubungi admin toko.';
    }
    if (status === 400 || status === 404) {
      return 'Pembayaran ini tidak bisa diproses. Silakan coba lagi atau hubungi admin toko.';
    }
    if (status >= 500) {
      return 'Layanan pembayaran sedang bermasalah. Coba beberapa saat lagi.';
    }
    return 'Pembayaran online sedang bermasalah. Silakan coba lagi atau pilih metode lain.';
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

    const cfg = await this.creds();
    const invoice = await this.request<XenditInvoice>(
      'POST',
      '/v2/invoices',
      cfg.secretKey,
      {
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
        invoice_duration: cfg.invoiceDurationSec,
        ...(cfg.successRedirectUrl && {
          success_redirect_url: cfg.successRedirectUrl,
        }),
        ...(cfg.failureRedirectUrl && {
          failure_redirect_url: cfg.failureRedirectUrl,
        }),
      },
    );

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
    const cfg = await this.creds();
    const qr = await this.request<XenditQr>(
      'POST',
      '/qr_codes',
      cfg.secretKey,
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
    const cfg = await this.creds();
    const list = await this.request<XenditInvoice[]>(
      'GET',
      `/v2/invoices?external_id=${encodeURIComponent(orderNumber)}`,
      cfg.secretKey,
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
  async readCallback(
    token: string | undefined,
    body: unknown,
  ): Promise<PaymentStatus> {
    const { callbackToken } = await this.creds();
    if (!callbackToken || token !== callbackToken) {
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

  /**
   * Uji kredensial dengan membaca daftar invoice (1 baris).
   *
   * Sengaja BUKAN endpoint saldo: `/balance` menuntut izin "Balance: read" yang
   * sering tidak dinyalakan pada API key, sehingga kunci yang sebenarnya sehat
   * bisa dilaporkan gagal. Endpoint invoice adalah yang benar-benar dipakai
   * fitur ini, jadi lolosnya uji berarti pembayaran memang akan jalan.
   * `secretKeyOverride`
   * dipakai tombol "Tes Koneksi" agar admin bisa memeriksa kunci yang baru
   * diketik SEBELUM menyimpannya dan mungkin mematikan pembayaran yang
   * sedang jalan.
   */
  async testConnection(
    secretKeyOverride?: string,
  ): Promise<{ ok: boolean; mode: 'test' | 'live' | 'unset'; message: string }> {
    const secretKey =
      secretKeyOverride?.trim() || (await this.creds()).secretKey;
    const mode: 'test' | 'live' | 'unset' = !secretKey
      ? 'unset'
      : secretKey.startsWith('xnd_development')
        ? 'test'
        : 'live';
    if (!secretKey) {
      return { ok: false, mode, message: 'Secret Key belum diisi' };
    }

    // Fetch sendiri, bukan lewat `request()`: di sini pembacanya admin yang
    // memang perlu tahu PERSIS apa yang salah dan apa langkah berikutnya,
    // sedangkan `request()` sengaja meratakan semua kegagalan jadi satu
    // kalimat aman untuk pelanggan.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch(`${XENDIT_API}/v2/invoices?limit=1`, {
        method: 'GET',
        headers: {
          Authorization: XenditService.authHeader(secretKey),
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      if (res.ok) {
        return {
          ok: true,
          mode,
          message:
            mode === 'test'
              ? 'Kunci valid — mode Test. Pembayaran di mode ini tidak memakai uang sungguhan.'
              : 'Kunci valid — mode Live. Pembayaran akan memakai uang sungguhan.',
        };
      }
      const json = (await res.json().catch(() => ({}))) as { message?: string };
      this.logger.warn(`Tes kunci Xendit → ${res.status}: ${json.message ?? ''}`);
      return { ok: false, mode, message: XenditService.pesanTesGagal(res.status) };
    } catch (e) {
      const err = e as Error;
      this.logger.warn(`Tes kunci Xendit gagal: ${err.message}`);
      return {
        ok: false,
        mode,
        message:
          err.name === 'AbortError'
            ? 'Xendit tidak menjawab dalam 15 detik. Periksa koneksi internet server, lalu coba lagi.'
            : 'Tidak bisa menghubungi Xendit. Periksa koneksi internet server, lalu coba lagi.',
      };
    } finally {
      clearTimeout(timer);
    }
  }

  /** Diagnosis untuk admin — sebutkan penyebab DAN langkah berikutnya. */
  private static pesanTesGagal(status: number): string {
    if (status === 401) {
      return 'Kunci ditolak Xendit. Kemungkinan salah salin, sudah dihapus, atau tertukar antara akun Test dan Live. Salin ulang dari dashboard Xendit → Settings → API Keys.';
    }
    if (status === 403) {
      return 'Kunci dikenali, tetapi izinnya kurang. Di dashboard Xendit → Settings → API Keys, beri kunci ini izin "Invoices: read" dan "Invoices: write".';
    }
    if (status === 429) {
      return 'Terlalu banyak permintaan ke Xendit. Tunggu sebentar, lalu coba lagi.';
    }
    if (status >= 500) {
      return 'Server Xendit sedang bermasalah. Ini di pihak mereka — coba lagi beberapa saat lagi.';
    }
    return `Xendit menolak permintaan (kode ${status}). Coba salin ulang kunci dari dashboard Xendit.`;
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

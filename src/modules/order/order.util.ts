// Tarif ongkir (Rupiah). Sesuaikan bila perlu.
export const MIN_ONGKIR = 5000;

/** Opsi pengiriman + tarif per km. Instan langsung (mahal), jadwal batch (murah). */
export const DELIVERY_OPTIONS = [
  'instant',
  'scheduled_morning',
  'scheduled_afternoon',
] as const;
export type DeliveryOption = (typeof DELIVERY_OPTIONS)[number];

export const DELIVERY_RATE_PER_KM: Record<DeliveryOption, number> = {
  instant: 10000,
  scheduled_morning: 2000,
  scheduled_afternoon: 2000,
};

// Backward-compat: tarif instan = tarif lama.
export const ONGKIR_PER_KM = DELIVERY_RATE_PER_KM.instant;

/**
 * Ongkir = jarak(km) × tarif opsi, dibulatkan ke kelipatan 1.000, min Rp5.000.
 * Default opsi `instant` (perilaku lama).
 */
export function calcShippingCost(
  distanceKm: number,
  option: DeliveryOption = 'instant',
  // Tarif dari pengaturan admin. Bila tak diberi, pakai bawaan lama supaya
  // pemanggil lama (dan uji) tetap berjalan seperti sebelumnya.
  rules?: { shippingMin: number; rateInstant: number; rateScheduled: number },
): number {
  const rate = rules
    ? option === 'instant'
      ? rules.rateInstant
      : rules.rateScheduled
    : (DELIVERY_RATE_PER_KM[option] ?? DELIVERY_RATE_PER_KM.instant);
  const min = rules ? rules.shippingMin : MIN_ONGKIR;
  const raw = Math.round((distanceKm * rate) / 1000) * 1000;
  return Math.max(min, raw);
}

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'completed',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Poin loyalty: 1 poin per Rp1.000 belanja (dari total order). */
export const POINT_PER_RUPIAH = 1000;
export function calcEarnedPoints(total: number, perRupiah?: number): number {
  return Math.floor(
    total / (perRupiah && perRupiah > 0 ? perRupiah : POINT_PER_RUPIAH),
  );
}

// normalizePhone dipindah ke common (shared kernel) — dipakai juga modul OTP.
export { normalizePhone } from '../../common';

/** Nomor order: ORD-YYYYMMDD-XXXX (XXXX acak). */
export function generateOrderNumber(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
    d.getDate(),
  ).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${ymd}-${rand}`;
}

/** Label opsi pengiriman untuk tampilan (WA, admin, dll). */
export function deliveryOptionLabel(option: string): string {
  switch (option) {
    case 'instant':
      return 'Instan';
    case 'scheduled_morning':
      return 'Jadwal Pagi';
    case 'scheduled_afternoon':
      return 'Jadwal Sore';
    default:
      return option;
  }
}

/** Bangun link WhatsApp ke admin berisi ringkasan order (pembayaran manual). */
export function buildWhatsappUrl(
  adminNumber: string,
  data: {
    orderNumber: string;
    customerName?: string | null;
    phone: string;
    items: { productName: string; quantity: number; subtotal: number }[];
    subtotal: number;
    shippingCost: number;
    total: number;
    paymentMethod: string;
    deliveryOption: string;
    shippingAddress: string;
  },
): string {
  const rupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;
  const lines = [
    `Halo Admin LapakTani, saya mau konfirmasi pesanan:`,
    ``,
    `No. Order: ${data.orderNumber}`,
    `Nama: ${data.customerName || '-'}`,
    `HP: ${data.phone}`,
    ``,
    `Pesanan:`,
    ...data.items.map(
      (i) => `- ${i.productName} x${i.quantity} = ${rupiah(i.subtotal)}`,
    ),
    ``,
    `Subtotal: ${rupiah(data.subtotal)}`,
    `Ongkir: ${rupiah(data.shippingCost)}`,
    `Total: ${rupiah(data.total)}`,
    `Metode bayar: ${data.paymentMethod}`,
    `Pengiriman: ${deliveryOptionLabel(data.deliveryOption)}`,
    `Alamat: ${data.shippingAddress}`,
  ];
  return `https://wa.me/${adminNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
}

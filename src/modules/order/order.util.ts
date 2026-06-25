// Tarif ongkir (Rupiah). Sesuaikan bila perlu.
export const ONGKIR_PER_KM = 10000;
export const MIN_ONGKIR = 5000;

/**
 * Ongkir = jarak(km) × Rp10.000, dibulatkan ke kelipatan 1.000, minimal Rp5.000.
 * (Logika sama dengan FE; perhitungan dipindah ke BE.)
 */
export function calcShippingCost(distanceKm: number): number {
  const raw = Math.round((distanceKm * ONGKIR_PER_KM) / 1000) * 1000;
  return Math.max(MIN_ONGKIR, raw);
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

/** Nomor order: ORD-YYYYMMDD-XXXX (XXXX acak). */
export function generateOrderNumber(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
    d.getDate(),
  ).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${ymd}-${rand}`;
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
    `Alamat: ${data.shippingAddress}`,
  ];
  return `https://wa.me/${adminNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
}

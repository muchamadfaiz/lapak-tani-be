/**
 * Normalisasi No HP ke format kanonik (62...) agar konsisten dipakai sebagai
 * kunci pelanggan, akumulasi poin, dan target pengiriman OTP/WhatsApp.
 * "0812.."→"62812..", "+62812.."→"62812..", "62812.."→tetap, "812.."→"62812..".
 */
export function normalizePhone(raw: string): string {
  let d = (raw || '').replace(/\D/g, ''); // sisakan angka saja
  if (d.startsWith('0')) d = '62' + d.slice(1);
  else if (d.startsWith('8')) d = '62' + d; // tanpa awalan, asumsikan Indonesia
  return d; // sudah '62...' → biarkan
}

/**
 * Serialisasi & parsing CSV (RFC 4180) untuk ekspor/impor produk.
 *
 * Ditulis manual (tanpa dependensi) karena kebutuhannya sempit: satu tabel
 * datar, tanpa streaming. Yang penting ditangani: field bertanda kutip, koma
 * dan baris baru di dalam field, kutip ganda (""), CRLF, serta BOM yang
 * ditambahkan Excel saat menyimpan file.
 */

/** Excel di Windows butuh BOM agar karakter non-ASCII (mis. °, é) tak rusak. */
export const CSV_BOM = '﻿';

/** Excel versi Indonesia memakai titik koma sebagai pemisah kolom. */
const SEPARATOR = ',';

/** Pemisah antar-nilai di dalam satu sel (dipakai kolom `tags`). */
export const MULTI_VALUE_SEPARATOR = ';';

function escapeField(value: string): string {
  // Kutip hanya bila perlu — file lebih mudah dibaca manusia.
  if (!/[",\r\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

/** Susun matriks (baris × kolom) jadi teks CSV. Baris dipisah CRLF (Excel). */
export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(escapeField).join(SEPARATOR)).join('\r\n');
}

/**
 * Pecah teks CSV jadi matriks. Baris kosong dilewati agar newline di akhir file
 * (hampir selalu ada) tidak jadi baris hantu yang gagal validasi.
 */
export function parseCsv(text: string): string[][] {
  const input = text.startsWith(CSV_BOM) ? text.slice(1) : text;

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    // Baris dianggap kosong bila semua selnya kosong.
    if (row.some((cell) => cell.trim() !== '')) rows.push(row);
    row = [];
  };

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (quoted) {
      if (char === '"') {
        // "" di dalam field bertanda kutip = satu karakter kutip literal.
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"' && field === '') {
      quoted = true;
    } else if (char === SEPARATOR) {
      endField();
    } else if (char === '\n') {
      endRow();
    } else if (char === '\r') {
      // CRLF: '\r' diabaikan, '\n' yang menutup baris.
      if (input[i + 1] !== '\n') endRow();
    } else {
      field += char;
    }
  }

  // File yang tidak diakhiri newline: baris terakhir belum ditutup.
  if (field !== '' || row.length > 0) endRow();

  return rows;
}

/** `ya`/`tidak` lebih jelas untuk admin daripada true/false di Excel. */
export function boolToCsv(value: boolean | null | undefined): string {
  return value ? 'ya' : 'tidak';
}

const TRUTHY = ['ya', 'y', 'true', '1', 'yes', 'aktif'];
const FALSY = ['tidak', 't', 'false', '0', 'no', 'n', 'nonaktif'];

/**
 * Terima gaya penulisan apa pun yang masuk akal (ya/true/1/aktif). Kembalikan
 * `undefined` bila sel kosong (artinya "tidak diubah"/pakai default), dan
 * `null` bila isinya tidak dikenali (pemanggil yang memutuskan itu error).
 */
export function csvToBool(
  value: string | undefined,
): boolean | null | undefined {
  const v = (value ?? '').trim().toLowerCase();
  if (v === '') return undefined;
  if (TRUTHY.includes(v)) return true;
  if (FALSY.includes(v)) return false;
  return null;
}

/**
 * Angka rupiah/stok dari sel CSV. Toleran terhadap format yang biasa muncul
 * dari Excel/copy-paste: "Rp 78.000", "78,000", "78 000".
 * `undefined` = sel kosong, `null` = bukan angka yang sah.
 */
export function csvToInt(value: string | undefined): number | null | undefined {
  const raw = (value ?? '').trim();
  if (raw === '') return undefined;
  const cleaned = raw.replace(/rp/gi, '').replace(/[.,\s]/g, '');
  if (!/^-?\d+$/.test(cleaned)) return null;
  return Number(cleaned);
}

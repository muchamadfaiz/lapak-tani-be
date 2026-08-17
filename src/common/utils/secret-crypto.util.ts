import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { Logger } from '@nestjs/common';

/**
 * Enkripsi nilai pengaturan yang rahasia (mis. Secret Key Xendit) sebelum
 * disimpan ke tabel `settings`.
 *
 * Alasan: kolom `settings.value` adalah TEXT biasa. Siapa pun yang bisa
 * membaca database — dump, backup, staf DB — otomatis memegang kunci gerbang
 * pembayaran, yang setara dengan akses ke uang. Kunci master disimpan di env
 * `SETTINGS_ENCRYPTION_KEY` (milik developer, bukan kredensial milik klien),
 * sehingga bocornya database saja tidak cukup untuk membuka isinya.
 *
 * Format simpan: `enc:v1:<iv-b64>:<tag-b64>:<ciphertext-b64>`.
 * Nilai tanpa awalan `enc:v1:` dianggap teks biasa dan dikembalikan apa adanya,
 * sehingga baris lama (atau baris yang tersimpan sebelum kunci dipasang) tetap
 * terbaca dan tidak ada yang rusak saat fitur ini dipasang.
 */

const PREFIX = 'enc:v1:';
const ALGO = 'aes-256-gcm';
const IV_LEN = 12; // ukuran nonce yang direkomendasikan untuk GCM
const logger = new Logger('SecretCrypto');

let peringatanSudahDicatat = false;

/**
 * Kunci 32 byte dari env. Nilai env boleh berupa hex 64 digit ATAU kalimat
 * bebas — keduanya di-hash SHA-256 supaya panjangnya selalu benar.
 * Mengembalikan null bila env belum diisi.
 */
function kunci(): Buffer | null {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  return createHash('sha256').update(raw).digest();
}

/** True bila enkripsi aktif (kunci master tersedia). */
export function enkripsiAktif(): boolean {
  return kunci() !== null;
}

/**
 * Enkripsi nilai rahasia untuk disimpan.
 *
 * Bila kunci master belum dipasang, nilai dikembalikan APA ADANYA (teks biasa)
 * agar fitur tetap bisa dipakai — tetapi dicatat sebagai peringatan, dan status
 * ini juga dilaporkan ke dashboard admin lewat flag `encryptionActive`.
 */
export function enkripsiRahasia(plain: string): string {
  if (!plain) return '';
  const key = kunci();
  if (!key) {
    if (!peringatanSudahDicatat) {
      logger.warn(
        'SETTINGS_ENCRYPTION_KEY belum diset — kredensial pembayaran disimpan ' +
          'sebagai teks biasa di database. Isi env tersebut untuk mengaktifkan enkripsi.',
      );
      peringatanSudahDicatat = true;
    }
    return plain;
  }
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

/**
 * Kebalikan dari `enkripsiRahasia`. Nilai tanpa awalan dikembalikan apa adanya
 * (teks biasa lama). Bila pembongkaran gagal — kunci master berganti atau data
 * rusak — kembalikan string kosong, bukan melempar: gerbang pembayaran cukup
 * dianggap "belum dikonfigurasi" daripada menjatuhkan seluruh permintaan.
 */
export function dekripsiRahasia(stored: string | undefined): string {
  if (!stored) return '';
  if (!stored.startsWith(PREFIX)) return stored;
  const key = kunci();
  if (!key) {
    logger.warn(
      'Ada kredensial terenkripsi di database tetapi SETTINGS_ENCRYPTION_KEY ' +
        'belum diset — nilai tidak bisa dibaca.',
    );
    return '';
  }
  try {
    const [ivB64, tagB64, dataB64] = stored.slice(PREFIX.length).split(':');
    const decipher = createDecipheriv(
      ALGO,
      key,
      Buffer.from(ivB64, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    logger.error(
      'Gagal membuka kredensial terenkripsi — kemungkinan SETTINGS_ENCRYPTION_KEY ' +
        'berganti. Simpan ulang kredensial dari dashboard admin.',
    );
    return '';
  }
}

/**
 * Bentuk aman untuk ditampilkan di dashboard: hanya 4 karakter terakhir.
 * Nilai penuh TIDAK PERNAH dikirim keluar server, bahkan ke admin.
 */
export function samarkanRahasia(plain: string): string {
  if (!plain) return '';
  const ekor = plain.slice(-4);
  return `••••••••${ekor}`;
}

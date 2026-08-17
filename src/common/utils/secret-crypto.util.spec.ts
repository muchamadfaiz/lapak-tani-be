import {
  dekripsiRahasia,
  enkripsiAktif,
  enkripsiRahasia,
  samarkanRahasia,
} from './secret-crypto.util';

describe('secret-crypto.util', () => {
  const asli = process.env.SETTINGS_ENCRYPTION_KEY;

  afterEach(() => {
    if (asli === undefined) delete process.env.SETTINGS_ENCRYPTION_KEY;
    else process.env.SETTINGS_ENCRYPTION_KEY = asli;
  });

  describe('dengan kunci master', () => {
    beforeEach(() => {
      process.env.SETTINGS_ENCRYPTION_KEY = 'kunci-uji-coba-yang-cukup-panjang';
    });

    it('bolak-balik menghasilkan nilai yang sama', () => {
      const rahasia = 'xnd_development_abc123XYZ';
      const tersimpan = enkripsiRahasia(rahasia);
      expect(tersimpan).not.toContain(rahasia);
      expect(tersimpan.startsWith('enc:v1:')).toBe(true);
      expect(dekripsiRahasia(tersimpan)).toBe(rahasia);
    });

    it('menghasilkan ciphertext berbeda tiap kali (IV acak)', () => {
      expect(enkripsiRahasia('sama')).not.toBe(enkripsiRahasia('sama'));
    });

    it('mengembalikan kosong bila kunci master berganti — bukan melempar', () => {
      const tersimpan = enkripsiRahasia('xnd_production_rahasia');
      process.env.SETTINGS_ENCRYPTION_KEY = 'kunci-yang-berbeda-sama-sekali';
      expect(dekripsiRahasia(tersimpan)).toBe('');
    });

    it('membaca nilai lama yang masih teks biasa apa adanya', () => {
      expect(dekripsiRahasia('xnd_production_lama')).toBe(
        'xnd_production_lama',
      );
    });

    it('enkripsiAktif true', () => {
      expect(enkripsiAktif()).toBe(true);
    });
  });

  describe('tanpa kunci master', () => {
    beforeEach(() => {
      delete process.env.SETTINGS_ENCRYPTION_KEY;
    });

    it('menyimpan apa adanya sehingga fitur tetap jalan', () => {
      expect(enkripsiRahasia('xnd_development_x')).toBe('xnd_development_x');
      expect(dekripsiRahasia('xnd_development_x')).toBe('xnd_development_x');
    });

    it('enkripsiAktif false', () => {
      expect(enkripsiAktif()).toBe(false);
    });
  });

  it('samarkanRahasia hanya menyisakan 4 karakter terakhir', () => {
    expect(samarkanRahasia('xnd_development_abcd1234')).toBe('••••••••1234');
    expect(samarkanRahasia('')).toBe('');
  });

  it('nilai kosong tidak ikut dienkripsi', () => {
    process.env.SETTINGS_ENCRYPTION_KEY = 'apa-saja';
    expect(enkripsiRahasia('')).toBe('');
    expect(dekripsiRahasia('')).toBe('');
    expect(dekripsiRahasia(undefined)).toBe('');
  });
});

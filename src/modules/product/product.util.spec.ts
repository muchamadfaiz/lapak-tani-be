import { normalizeProductBarcode } from './product.util';

describe('normalizeProductBarcode', () => {
  it('mengubah input kosong menjadi null', () => {
    expect(normalizeProductBarcode(undefined)).toBeNull();
    expect(normalizeProductBarcode('')).toBeNull();
    expect(normalizeProductBarcode('   ')).toBeNull();
  });

  it('merapikan tepi tanpa menghilangkan nol depan atau kapitalisasi', () => {
    expect(normalizeProductBarcode(' 00123-AbC ')).toBe('00123-AbC');
  });
});

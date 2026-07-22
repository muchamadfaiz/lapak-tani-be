import { BadRequestException } from '@nestjs/common';

/**
 * Harga coret harus DI ATAS harga jual, kalau tidak diskonnya jadi 0% atau
 * negatif di storefront. Validasi ini lintas-field (butuh price sekaligus
 * originalPrice), jadi tak bisa ditaruh sebagai decorator di DTO — apalagi
 * pada update parsial, di mana salah satunya bisa saja tidak dikirim.
 *
 * `originalPrice` null/undefined berarti "tidak promo" dan selalu sah.
 */
export function assertOriginalPriceAbovePrice(
  originalPrice: number | null | undefined,
  price: number,
): void {
  if (originalPrice === null || originalPrice === undefined) return;
  if (originalPrice <= price) {
    throw new BadRequestException(
      'Harga coret harus lebih besar dari harga jual',
    );
  }
}

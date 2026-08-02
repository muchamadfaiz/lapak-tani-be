import { buildProductWhere } from './product.repository';

describe('buildProductWhere', () => {
  it('mempertahankan filter lama dan mencari nama atau barcode', () => {
    expect(
      buildProductWhere({
        search: '899123',
        categoryId: 'category-1',
        available: true,
      }),
    ).toEqual({
      deletedAt: null,
      categoryId: 'category-1',
      isAvailable: true,
      OR: [
        { name: { contains: '899123', mode: 'insensitive' } },
        { barcode: { contains: '899123', mode: 'insensitive' } },
      ],
    });
  });
});

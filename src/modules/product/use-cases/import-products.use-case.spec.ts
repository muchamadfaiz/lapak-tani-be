import { ProductRepository } from '../repository/product.repository';
import { ImportProductsUseCase } from './import-products.use-case';

describe('ImportProductsUseCase barcode', () => {
  it('melaporkan barcode ganda di dalam satu file saat dry-run', async () => {
    const productRepository = {
      findActiveByBarcode: jest.fn().mockResolvedValue(null),
    } as unknown as ProductRepository;
    const categoryContract = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: '00000000-0000-4000-8000-000000000001',
          name: 'Minuman',
        },
      ]),
    };
    const useCase = new ImportProductsUseCase(
      productRepository,
      categoryContract as never,
    );
    const csv = Buffer.from(
      [
        'nama,harga,kategori,barcode',
        'Produk A,10000,Minuman,899123',
        'Produk B,12000,Minuman,899123',
      ].join('\n'),
    );

    const result = await useCase.execute(csv, true);

    expect(result).toMatchObject({
      total: 2,
      created: 1,
      updated: 0,
      failed: 1,
      dryRun: true,
    });
    expect(result.errors[0]).toMatchObject({
      row: 3,
      name: 'Produk B',
    });
    expect(result.errors[0].message).toContain('juga digunakan pada baris 2');
  });
});

import { ConflictException } from '@nestjs/common';
import { UpdateProductDto } from '../dto';
import { ProductRepository } from '../repository/product.repository';
import { UpdateProductUseCase } from './update-product.use-case';

describe('UpdateProductUseCase barcode', () => {
  it('menolak barcode milik produk aktif yang berbeda', async () => {
    const findById = jest.fn().mockResolvedValue({
      id: 'product-current',
      price: 10000,
      originalPrice: null,
      barcode: null,
    });
    const findActiveByBarcode = jest.fn().mockResolvedValue({
      id: 'product-other',
      name: 'Produk Lain',
    });
    const update = jest.fn();
    const productRepository = {
      findById,
      findActiveByBarcode,
      update,
    } as unknown as ProductRepository;
    const useCase = new UpdateProductUseCase(
      productRepository,
      {} as never,
      {} as never,
    );
    const dto = { barcode: '899123' } as UpdateProductDto;

    await expect(
      useCase.execute('product-current', dto),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(findActiveByBarcode).toHaveBeenCalledWith('899123');
    expect(update).not.toHaveBeenCalled();
  });
});

import { ConflictException } from '@nestjs/common';
import { CreateProductDto } from '../dto';
import { ProductRepository } from '../repository/product.repository';
import { CreateProductUseCase } from './create-product.use-case';

describe('CreateProductUseCase barcode', () => {
  it('menolak barcode yang sudah dipakai produk aktif', async () => {
    const findActiveByBarcode = jest.fn().mockResolvedValue({
      id: 'product-existing',
      name: 'Produk Lama',
    });
    const create = jest.fn();
    const productRepository = {
      findActiveByBarcode,
      create,
    } as unknown as ProductRepository;
    const categoryContract = {
      assertExists: jest.fn().mockResolvedValue(undefined),
    };
    const outletContract = {};
    const useCase = new CreateProductUseCase(
      productRepository,
      categoryContract as never,
      outletContract as never,
    );
    const dto = {
      name: 'Produk Baru',
      price: 10000,
      categoryId: '00000000-0000-4000-8000-000000000001',
      barcode: ' 899123 ',
    } as CreateProductDto;

    await expect(useCase.execute(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(findActiveByBarcode).toHaveBeenCalledWith('899123');
    expect(create).not.toHaveBeenCalled();
  });
});

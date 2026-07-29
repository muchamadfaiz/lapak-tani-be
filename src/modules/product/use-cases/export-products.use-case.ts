import { Injectable } from '@nestjs/common';
import { CategoryContract } from '../../category';
import { OutletContract } from '../../outlet';
import { ProductRepository } from '../repository/product.repository';
import { ExportProductsQueryDto } from '../dto';
import {
  CSV_BOM,
  MULTI_VALUE_SEPARATOR,
  boolToCsv,
  toCsv,
} from '../product-csv.util';
import {
  PRODUCT_CSV_COLUMNS,
  PRODUCT_CSV_SAMPLE_ROW,
} from '../product-csv.schema';

/** Isi file CSV siap kirim ke browser. */
export interface CsvFile {
  filename: string;
  content: string;
}

@Injectable()
export class ExportProductsUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryContract: CategoryContract,
    private readonly outletContract: OutletContract,
  ) {}

  /** File berisi header + satu baris contoh, untuk admin yang mulai dari nol. */
  template(): CsvFile {
    return {
      filename: 'template-produk.csv',
      content:
        CSV_BOM + toCsv([[...PRODUCT_CSV_COLUMNS], PRODUCT_CSV_SAMPLE_ROW]),
    };
  }

  async execute(query: ExportProductsQueryDto): Promise<CsvFile> {
    const [products, categories, warehouseIds] = await Promise.all([
      this.productRepository.findAllFiltered({
        categoryId: query.categoryId,
        search: query.search,
        available: query.available,
        featured: query.featured,
      }),
      this.categoryContract.findAll(),
      this.outletContract.findWarehouseIds(),
    ]);

    const categoryName = new Map(categories.map((c) => [c.id, c.name]));

    const rows = products.map((p) => {
      // Sama seperti tampilan admin: stok gudang tak dihitung (belum bisa dijual).
      const stock = p.outletStocks
        .filter((s) => !warehouseIds.includes(s.outletId))
        .reduce((sum, s) => sum + s.stock, 0);

      return [
        p.id,
        p.name,
        p.description ?? '',
        // Fallback ke id bila kategori sudah dihapus — data tetap terbawa utuh.
        categoryName.get(p.categoryId) ?? p.categoryId,
        String(p.price),
        p.costPrice === null ? '' : String(p.costPrice),
        p.originalPrice === null ? '' : String(p.originalPrice),
        p.unit ?? '',
        p.barcode ?? '',
        p.tags.join(MULTI_VALUE_SEPARATOR),
        p.imageUrl ?? '',
        boolToCsv(p.isAvailable),
        boolToCsv(p.isFeatured),
        boolToCsv(p.soldByWeight),
        String(stock),
      ];
    });

    const date = new Date().toISOString().split('T')[0];
    return {
      filename: `produk-${date}.csv`,
      content: CSV_BOM + toCsv([[...PRODUCT_CSV_COLUMNS], ...rows]),
    };
  }
}

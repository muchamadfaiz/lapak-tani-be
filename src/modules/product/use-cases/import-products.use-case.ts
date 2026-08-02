import { BadRequestException, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CategoryContract } from '../../category';
import { ProductRepository } from '../repository/product.repository';
import {
  CreateProductDto,
  ImportProductsResultDto,
  ImportRowErrorDto,
  UpdateProductDto,
} from '../dto';
import {
  MULTI_VALUE_SEPARATOR,
  csvToBool,
  csvToInt,
  parseCsv,
} from '../product-csv.util';
import {
  MAX_IMPORT_ROWS,
  PRODUCT_CSV_COLUMNS,
  ProductCsvColumn,
  ProductCsvRow,
  REQUIRED_CSV_COLUMNS,
  matchColumn,
} from '../product-csv.schema';

/** Baris yang lolos validasi, siap ditulis ke DB. */
interface PreparedRow {
  row: number;
  name: string;
  /** Ada = perbarui produk ini; kosong = buat produk baru. */
  productId?: string;
  data: {
    name: string;
    description?: string;
    price: number;
    costPrice?: number;
    originalPrice: number | null;
    tags?: string[];
    unit?: string;
    barcode?: string;
    imageUrl?: string;
    categoryId: string;
    isAvailable?: boolean;
    isFeatured?: boolean;
    soldByWeight?: boolean;
  };
}

/** Kesalahan satu baris — dikumpulkan, tidak menghentikan baris lain. */
class RowError extends Error {}

@Injectable()
export class ImportProductsUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryContract: CategoryContract,
  ) {}

  /**
   * Impor bersifat per-baris (bukan satu transaksi besar): baris yang sah tetap
   * tersimpan, baris bermasalah dilaporkan lengkap dengan nomor barisnya.
   * Admin bisa memperbaiki file lalu mengimpor ulang — baris yang sudah masuk
   * akan ter-update (bukan terduplikasi) selama kolom `id` ikut terbawa.
   *
   * Kolom `stok` diabaikan: perubahan stok hanya lewat menu Stok agar tercatat
   * di buku besar.
   */
  async execute(
    fileContent: Buffer,
    dryRun = false,
  ): Promise<ImportProductsResultDto> {
    const rows = parseCsv(fileContent.toString('utf8'));
    if (rows.length === 0) {
      throw new BadRequestException('File CSV kosong');
    }

    const columns = this.readHeader(rows[0]);
    const dataRows = rows.slice(1);

    if (dataRows.length === 0) {
      throw new BadRequestException('File CSV hanya berisi header, tanpa data');
    }
    if (dataRows.length > MAX_IMPORT_ROWS) {
      throw new BadRequestException(
        `Maksimal ${MAX_IMPORT_ROWS} baris per impor (file ini ${dataRows.length} baris). Bagi file menjadi beberapa bagian.`,
      );
    }

    // Peta kategori dimuat sekali; pencocokan by nama (case-insensitive) atau id.
    const categories = await this.categoryContract.findAll();
    const categoryByName = new Map(
      categories.map((c) => [c.name.trim().toLowerCase(), c.id]),
    );
    const categoryIds = new Set(categories.map((c) => c.id));

    const errors: ImportRowErrorDto[] = [];
    const prepared: PreparedRow[] = [];
    const barcodeRows = new Map<string, number>();

    for (let i = 0; i < dataRows.length; i++) {
      // +2: baris 1 adalah header, dan penomoran Excel mulai dari 1.
      const rowNumber = i + 2;
      const cells = this.toRowObject(columns, dataRows[i]);
      try {
        prepared.push(
          await this.prepareRow(
            rowNumber,
            cells,
            categoryByName,
            categoryIds,
            barcodeRows,
          ),
        );
      } catch (e) {
        errors.push({
          row: rowNumber,
          name: (cells.nama ?? '').trim(),
          message: e instanceof Error ? e.message : 'Baris tidak valid',
        });
      }
    }

    let created = 0;
    let updated = 0;

    if (!dryRun) {
      for (const item of prepared) {
        try {
          if (item.productId) {
            await this.productRepository.update(item.productId, item.data);
            updated++;
          } else {
            await this.productRepository.create(item.data);
            created++;
          }
        } catch (error) {
          errors.push({
            row: item.row,
            name: item.name,
            message:
              error instanceof Error
                ? error.message
                : 'Gagal menyimpan ke database',
          });
        }
      }
    }

    // Urutkan agar admin membaca kesalahan sesuai urutan baris di file.
    errors.sort((a, b) => a.row - b.row);

    return {
      total: dataRows.length,
      created: dryRun ? prepared.filter((p) => !p.productId).length : created,
      updated: dryRun ? prepared.filter((p) => p.productId).length : updated,
      failed: errors.length,
      dryRun,
      errors,
    };
  }

  /** Header → daftar kolom per posisi. Kolom tak dikenal diabaikan (null). */
  private readHeader(header: string[]): (ProductCsvColumn | null)[] {
    const columns = header.map(matchColumn);
    const missing = REQUIRED_CSV_COLUMNS.filter((c) => !columns.includes(c));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Kolom wajib tidak ditemukan: ${missing.join(', ')}. ` +
          `Kolom yang dikenali: ${PRODUCT_CSV_COLUMNS.join(', ')}.`,
      );
    }
    return columns;
  }

  private toRowObject(
    columns: (ProductCsvColumn | null)[],
    cells: string[],
  ): ProductCsvRow {
    const row: ProductCsvRow = {};
    columns.forEach((col, idx) => {
      if (col) row[col] = cells[idx] ?? '';
    });
    return row;
  }

  private async prepareRow(
    rowNumber: number,
    cells: ProductCsvRow,
    categoryByName: Map<string, string>,
    categoryIds: Set<string>,
    barcodeRows: Map<string, number>,
  ): Promise<PreparedRow> {
    const name = (cells.nama ?? '').trim();
    if (name === '') throw new RowError('Kolom nama wajib diisi');

    const categoryRaw = (cells.kategori ?? '').trim();
    if (categoryRaw === '') throw new RowError('Kolom kategori wajib diisi');
    const categoryId = categoryIds.has(categoryRaw)
      ? categoryRaw
      : categoryByName.get(categoryRaw.toLowerCase());
    if (!categoryId) {
      throw new RowError(
        `Kategori "${categoryRaw}" tidak ditemukan. Buat kategorinya dulu di menu Kategori.`,
      );
    }

    const price = this.number(cells.harga, 'harga');
    if (price === undefined) throw new RowError('Kolom harga wajib diisi');
    const costPrice = this.number(cells.hargaModal, 'hargaModal');
    const originalPriceRaw = this.number(cells.hargaCoret, 'hargaCoret');

    const tags = (cells.tags ?? '')
      .split(MULTI_VALUE_SEPARATOR)
      .map((t) => t.trim())
      .filter((t) => t !== '');

    const productId = (cells.id ?? '').trim() || undefined;

    // Update: harga coret dibandingkan dengan harga jual SETELAH perubahan.
    // Sel kosong pada baris update berarti "hapus promo" (null) — sama dengan
    // perilaku form produk yang mengirim null untuk mengakhiri promo.
    const originalPrice = originalPriceRaw ?? null;
    if (originalPrice !== null && originalPrice <= price) {
      throw new RowError(
        'Harga coret harus lebih besar dari harga jual (kosongkan bila tidak promo)',
      );
    }

    const data: PreparedRow['data'] = {
      name,
      description: (cells.deskripsi ?? '').trim() || undefined,
      price,
      costPrice,
      originalPrice,
      tags,
      unit: (cells.satuan ?? '').trim() || undefined,
      barcode: (cells.barcode ?? '').trim() || undefined,
      imageUrl: (cells.imageUrl ?? '').trim() || undefined,
      categoryId,
      isAvailable: this.bool(cells.tersedia, 'tersedia'),
      isFeatured: this.bool(cells.unggulan, 'unggulan'),
      soldByWeight: this.bool(cells.timbangan, 'timbangan'),
    };

    // Validasi akhir memakai DTO yang sama dengan endpoint create/update, jadi
    // batas nilai (mis. harga maks, maksimal 5 tag) tak perlu ditulis dua kali.
    await this.assertValidDto(data, Boolean(productId));

    if (productId) {
      const existing = await this.productRepository.findById(productId);
      if (!existing) {
        throw new RowError(
          `Produk dengan id "${productId}" tidak ditemukan. Kosongkan kolom id bila ingin membuat produk baru.`,
        );
      }
    }

    const barcode = data.barcode;
    if (barcode) {
      const firstRow = barcodeRows.get(barcode);
      if (firstRow !== undefined) {
        throw new RowError(
          `Barcode/SKU "${barcode}" juga digunakan pada baris ${firstRow}`,
        );
      }

      const owner = await this.productRepository.findActiveByBarcode(barcode);
      if (owner && owner.id !== productId) {
        throw new RowError(
          `Barcode/SKU "${barcode}" sudah digunakan oleh produk "${owner.name}"`,
        );
      }
      barcodeRows.set(barcode, rowNumber);
    }

    return { row: rowNumber, name, productId, data };
  }

  private async assertValidDto(
    data: PreparedRow['data'],
    isUpdate: boolean,
  ): Promise<void> {
    const instance = plainToInstance(
      isUpdate ? UpdateProductDto : CreateProductDto,
      data,
    );
    const failures = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });
    if (failures.length > 0) {
      const messages = failures.flatMap((f) =>
        Object.values(f.constraints ?? {}),
      );
      throw new RowError(messages.join('; '));
    }
  }

  private number(
    value: string | undefined,
    column: string,
  ): number | undefined {
    const parsed = csvToInt(value);
    if (parsed === null) {
      throw new RowError(`Kolom ${column} harus berupa angka (contoh: 78000)`);
    }
    return parsed;
  }

  private bool(value: string | undefined, column: string): boolean | undefined {
    const parsed = csvToBool(value);
    if (parsed === null) {
      throw new RowError(`Kolom ${column} harus diisi "ya" atau "tidak"`);
    }
    return parsed;
  }
}

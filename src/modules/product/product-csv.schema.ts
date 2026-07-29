/**
 * Kontrak kolom file CSV produk — dipakai bersama oleh ekspor, template, dan
 * impor. Satu sumber kebenaran supaya file hasil ekspor selalu bisa diimpor
 * kembali (alur: ekspor → sunting di Excel → impor).
 */

export const PRODUCT_CSV_COLUMNS = [
  'id',
  'nama',
  'deskripsi',
  'kategori',
  'harga',
  'hargaModal',
  'hargaCoret',
  'satuan',
  'barcode',
  'tags',
  'imageUrl',
  'tersedia',
  'unggulan',
  'timbangan',
  'stok',
] as const;

export type ProductCsvColumn = (typeof PRODUCT_CSV_COLUMNS)[number];

/** Satu baris CSV yang sudah dipetakan header → nilai (nilai selalu string). */
export type ProductCsvRow = Partial<Record<ProductCsvColumn, string>>;

/**
 * Kolom yang WAJIB ada di header file impor. `id` tidak wajib: baris tanpa id
 * dianggap produk baru.
 */
export const REQUIRED_CSV_COLUMNS: ProductCsvColumn[] = [
  'nama',
  'harga',
  'kategori',
];

/**
 * `stok` sengaja tidak ikut diimpor. Perubahan stok hanya boleh lewat menu Stok
 * (pengadaan/kiriman/koreksi) agar tercatat di buku besar stok — kolom ini
 * hanya untuk informasi saat file dibuka admin.
 */
export const EXPORT_ONLY_CSV_COLUMNS: ProductCsvColumn[] = ['stok'];

/** Contoh baris untuk file template, supaya admin tahu format tiap kolom. */
export const PRODUCT_CSV_SAMPLE_ROW: string[] = [
  '', // id dikosongkan → produk baru
  'Beras Premium Pandan Wangi 5kg',
  'Beras putih premium, harum dan pulen',
  'Sembako',
  '78000',
  '65000',
  '85000',
  'kg',
  '8991234567890',
  'Organik;Manis',
  '',
  'ya',
  'tidak',
  'tidak',
  '', // stok diabaikan saat impor
];

/** Batas baris per file impor — menjaga request tetap selesai cepat. */
export const MAX_IMPORT_ROWS = 2000;

/** Normalisasi nama kolom agar "Harga Modal"/"hargamodal" tetap dikenali. */
export function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, '');
}

const HEADER_LOOKUP = new Map<string, ProductCsvColumn>(
  PRODUCT_CSV_COLUMNS.map((c) => [normalizeHeader(c), c]),
);

/** Nama kolom alternatif yang lazim ditulis admin (termasuk versi Inggris). */
const HEADER_ALIASES: Record<string, ProductCsvColumn> = {
  name: 'nama',
  namaproduk: 'nama',
  description: 'deskripsi',
  category: 'kategori',
  kategoriproduk: 'kategori',
  price: 'harga',
  hargajual: 'harga',
  costprice: 'hargaModal',
  hargapokok: 'hargaModal',
  modal: 'hargaModal',
  originalprice: 'hargaCoret',
  hargasebelumdiskon: 'hargaCoret',
  unit: 'satuan',
  sku: 'barcode',
  label: 'tags',
  gambar: 'imageUrl',
  urlgambar: 'imageUrl',
  isavailable: 'tersedia',
  aktif: 'tersedia',
  isfeatured: 'unggulan',
  produkpilihan: 'unggulan',
  soldbyweight: 'timbangan',
  dijualperberat: 'timbangan',
  stock: 'stok',
};

/** Cocokkan satu header file ke kolom yang dikenal; null bila tak dikenali. */
export function matchColumn(header: string): ProductCsvColumn | null {
  const key = normalizeHeader(header);
  return HEADER_LOOKUP.get(key) ?? HEADER_ALIASES[key] ?? null;
}

BEGIN;

-- Samakan data lama dengan aturan input baru. BTRIM hanya membuang spasi di
-- tepi; nol di depan dan kapitalisasi kode tetap dipertahankan.
UPDATE "products"
SET "barcode" = NULLIF(BTRIM("barcode"), '')
WHERE "barcode" IS NOT NULL;

-- Jangan memilih produk secara otomatis jika produksi ternyata punya kode
-- ganda. Gagalkan migration dan biarkan seluruh perubahan di atas rollback.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "products"
    WHERE "deletedAt" IS NULL AND "barcode" IS NOT NULL
    GROUP BY "barcode"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Migration dibatalkan: ada barcode/SKU duplikat pada produk aktif';
  END IF;
END $$;

-- Partial unique index: produk aktif wajib unik, tetapi barcode dari produk
-- yang sudah dihapus boleh digunakan kembali tanpa menghapus riwayatnya.
CREATE UNIQUE INDEX "products_active_barcode_key"
ON "products" ("barcode")
WHERE "deletedAt" IS NULL AND "barcode" IS NOT NULL;

COMMIT;

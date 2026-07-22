-- AlterTable
ALTER TABLE "products" ADD COLUMN     "originalPrice" INTEGER,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "banners" ALTER COLUMN "title" DROP NOT NULL;
ALTER TABLE "banners" ADD COLUMN     "overlayEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "overlayOpacity" INTEGER NOT NULL DEFAULT 55;

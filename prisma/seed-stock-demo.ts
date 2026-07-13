/**
 * Seed DEMO manajemen stok — gudang, pengadaan, kiriman, dan buku besar.
 *
 * SENGAJA TERPISAH dari `seed.ts`, karena seed.ts dijalankan otomatis tiap
 * container start (docker-entrypoint.sh). Skrip ini HANYA dijalankan manual:
 *
 *   npx tsx prisma/seed-stock-demo.ts
 *
 * Idempotent: tiap blok dijaga guard "sudah pernah dibuat?", jadi menjalankannya
 * berkali-kali TIDAK menggandakan stok.
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

const env = process.env.NODE_ENV || 'development';
dotenv.config({
  path: path.resolve(process.cwd(), `.env.${env}`),
  override: true,
});
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// UUID tetap agar idempotent.
const WAREHOUSE_ID = 'a2000000-0000-4000-8000-0000000000f1';
const PRC_ID = 'e5000000-0000-4000-8000-000000000001';
const SHP_RECEIVED_ID = 'f6000000-0000-4000-8000-000000000001';
const SHP_INTRANSIT_ID = 'f6000000-0000-4000-8000-000000000002';

// Outlet tujuan (dari seed.ts).
const OUT_ILIR = 'a2000000-0000-4000-8000-000000000001';
const OUT_BUKIT = 'a2000000-0000-4000-8000-000000000002';

const PRC_QTY = 100;
const SHIP1_QTY = 20;
const SHIP2_QTY = 15;

/** Tambah/kurangi stok (upsert). Dipanggil di dalam guard → hanya sekali. */
async function addStock(outletId: string, productId: string, qty: number) {
  await prisma.productOutlet.upsert({
    where: { productId_outletId: { productId, outletId } },
    update: { stock: { increment: qty } },
    create: { productId, outletId, stock: Math.max(0, qty) },
  });
}

async function main() {
  // Ambil 6 produk pertama sebagai bahan demo.
  const products = await prisma.product.findMany({
    orderBy: { id: 'asc' },
    take: 6,
    select: { id: true, name: true, price: true },
  });
  if (products.length === 0) {
    throw new Error('Belum ada produk. Jalankan `npx tsx prisma/seed.ts` dulu.');
  }

  // 1. Gudang Pusat (outlet dengan isWarehouse=true → tak tampil di storefront).
  await prisma.outlet.upsert({
    where: { id: WAREHOUSE_ID },
    update: {},
    create: {
      id: WAREHOUSE_ID,
      name: 'Gudang Pusat Lapak Tani',
      address: 'Jl. Pergudangan Raya No. 1, Palembang',
      latitude: -2.9761,
      longitude: 104.7754,
      phone: '0711-900001',
      isWarehouse: true,
    },
  });
  console.log('✓ Gudang Pusat Lapak Tani');

  // 2. Pengadaan: 6 produk @100 masuk gudang, dgn harga modal (±70% harga jual).
  if (!(await prisma.stockProcurement.findUnique({ where: { id: PRC_ID } }))) {
    const items = products.map((p) => {
      const unitCost = Math.floor(p.price * 0.7);
      return {
        productId: p.id,
        productName: p.name,
        quantity: PRC_QTY,
        unitCost,
        subtotalCost: unitCost * PRC_QTY,
      };
    });
    await prisma.stockProcurement.create({
      data: {
        id: PRC_ID,
        procurementNumber: 'LT-PRC-SEED-0001',
        outletId: WAREHOUSE_ID,
        supplier: 'CV Tani Makmur',
        invoiceNumber: 'INV-SEED-0001',
        note: 'Pengadaan awal (demo)',
        totalCost: items.reduce((s, i) => s + i.subtotalCost, 0),
        items: { create: items },
      },
    });
    for (const i of items) await addStock(WAREHOUSE_ID, i.productId, i.quantity);
    await prisma.stockMovement.createMany({
      data: items.map((i) => ({
        productId: i.productId,
        outletId: WAREHOUSE_ID,
        type: 'purchase_in',
        quantity: i.quantity,
        refType: 'procurement',
        refId: PRC_ID,
        note: 'Supplier: CV Tani Makmur',
      })),
    });
    console.log(`✓ Pengadaan: ${items.length} produk @${PRC_QTY} masuk gudang`);
  }

  // 3. Kiriman #1 — SUDAH DITERIMA di Ilir Barat.
  const ship1 = products.slice(0, 3);
  if (!(await prisma.stockShipment.findUnique({ where: { id: SHP_RECEIVED_ID } }))) {
    await prisma.stockShipment.create({
      data: {
        id: SHP_RECEIVED_ID,
        shipmentNumber: 'LT-SHP-SEED-0001',
        fromOutletId: WAREHOUSE_ID,
        toOutletId: OUT_ILIR,
        status: 'received',
        note: 'Kiriman rutin (demo)',
        receivedAt: new Date(),
        items: {
          create: ship1.map((p) => ({
            productId: p.id,
            productName: p.name,
            quantity: SHIP1_QTY,
          })),
        },
      },
    });
    for (const p of ship1) {
      await addStock(WAREHOUSE_ID, p.id, -SHIP1_QTY); // keluar gudang
      await addStock(OUT_ILIR, p.id, SHIP1_QTY); // masuk outlet
    }
    await prisma.stockMovement.createMany({
      data: [
        ...ship1.map((p) => ({
          productId: p.id,
          outletId: WAREHOUSE_ID,
          type: 'transfer_out',
          quantity: -SHIP1_QTY,
          refType: 'shipment',
          refId: SHP_RECEIVED_ID,
        })),
        ...ship1.map((p) => ({
          productId: p.id,
          outletId: OUT_ILIR,
          type: 'transfer_in',
          quantity: SHIP1_QTY,
          refType: 'shipment',
          refId: SHP_RECEIVED_ID,
        })),
      ],
    });
    console.log('✓ Kiriman #1 (diterima) → Ilir Barat');
  }

  // 4. Kiriman #2 — MASIH DI JALAN ke Bukit Baru (stok gudang sudah turun,
  //    stok outlet belum naik) → bisa dipakai mendemokan tombol "Terima".
  const ship2 = products.slice(0, 2);
  if (!(await prisma.stockShipment.findUnique({ where: { id: SHP_INTRANSIT_ID } }))) {
    await prisma.stockShipment.create({
      data: {
        id: SHP_INTRANSIT_ID,
        shipmentNumber: 'LT-SHP-SEED-0002',
        fromOutletId: WAREHOUSE_ID,
        toOutletId: OUT_BUKIT,
        status: 'sent',
        note: 'Menunggu diterima outlet (demo)',
        items: {
          create: ship2.map((p) => ({
            productId: p.id,
            productName: p.name,
            quantity: SHIP2_QTY,
          })),
        },
      },
    });
    for (const p of ship2) await addStock(WAREHOUSE_ID, p.id, -SHIP2_QTY);
    await prisma.stockMovement.createMany({
      data: ship2.map((p) => ({
        productId: p.id,
        outletId: WAREHOUSE_ID,
        type: 'transfer_out',
        quantity: -SHIP2_QTY,
        refType: 'shipment',
        refId: SHP_INTRANSIT_ID,
      })),
    });
    console.log('✓ Kiriman #2 (dalam perjalanan) → Bukit Baru');
  }

  console.log('\nSelesai. Buka /admin/stock untuk melihat hasilnya.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

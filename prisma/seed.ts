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
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PERMISSIONS = [
  'user:read',
  'user:create',
  'user:update',
  'user:delete',
  'role:read',
  'role:create',
  'role:update',
  'role:delete',
];

async function main() {
  // 1. Seed permissions
  const permissions = await Promise.all(
    PERMISSIONS.map((name) =>
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );
  console.log(`Seeded ${permissions.length} permissions`);

  // 2. Seed roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: { name: 'USER' },
  });
  console.log('Seeded roles: ADMIN, USER');

  // 3. Assign permissions to roles
  // ADMIN gets all permissions
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  // USER gets only user:read
  const userReadPerm = permissions.find((p) => p.name === 'user:read')!;
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: userRole.id,
        permissionId: userReadPerm.id,
      },
    },
    update: {},
    create: { roleId: userRole.id, permissionId: userReadPerm.id },
  });
  console.log('Assigned permissions to roles');

  // 4. Seed admin user + profile
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      roleId: adminRole.id,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.profile.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      fullName: 'Admin',
    },
  });

  console.log('Seeded admin user:', admin.email);

  // ── 5. Seed Marketplace (kategori, outlet, produk pertanian) ──
  // UUID tetap + upsert by id agar idempotent (seed jalan tiap container start).

  // 5a. Kategori
  const CATEGORIES = [
    { id: 'c1000000-0000-4000-8000-000000000001', name: 'Sayuran', icon: '🥬', sortOrder: 1 },
    { id: 'c1000000-0000-4000-8000-000000000002', name: 'Buah-buahan', icon: '🍎', sortOrder: 2 },
    { id: 'c1000000-0000-4000-8000-000000000003', name: 'Beras & Biji-bijian', icon: '🌾', sortOrder: 3 },
    { id: 'c1000000-0000-4000-8000-000000000004', name: 'Rempah & Bumbu', icon: '🌶️', sortOrder: 4 },
    { id: 'c1000000-0000-4000-8000-000000000005', name: 'Pupuk & Sarana Tani', icon: '🧪', sortOrder: 5 },
  ];
  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { id: c.id },
      update: { name: c.name, icon: c.icon, sortOrder: c.sortOrder },
      create: c,
    });
  }
  const [CAT_SAYUR, CAT_BUAH, CAT_BERAS, CAT_REMPAH, CAT_PUPUK] = CATEGORIES.map((c) => c.id);
  console.log(`Seeded ${CATEGORIES.length} categories`);

  // 5b. Outlet (Palembang)
  const OUTLETS = [
    { id: 'a2000000-0000-4000-8000-000000000001', name: 'LapakTani Ilir Barat', address: 'Jl. Jenderal Sudirman No. 10, Ilir Barat, Palembang', latitude: -2.9735, longitude: 104.772, phone: '0711-111001' },
    { id: 'a2000000-0000-4000-8000-000000000002', name: 'LapakTani Bukit Baru', address: 'Jl. Angkatan 45 No. 33, Bukit Baru, Palembang', latitude: -2.9689, longitude: 104.7801, phone: '0711-111002' },
    { id: 'a2000000-0000-4000-8000-000000000003', name: 'LapakTani Jakabaring', address: 'Jl. Gubernur H.A. Bastari No. 5, Jakabaring', latitude: -2.9845, longitude: 104.769, phone: '0711-111003' },
    { id: 'a2000000-0000-4000-8000-000000000004', name: 'LapakTani Sako', address: 'Jl. Sako Raya No. 18, Sako, Palembang', latitude: -2.958, longitude: 104.785, phone: '0711-111004' },
  ];
  for (const o of OUTLETS) {
    await prisma.outlet.upsert({ where: { id: o.id }, update: o, create: o });
  }
  const [OUT_ILIR, OUT_BUKIT, OUT_JAKA, OUT_SAKO] = OUTLETS.map((o) => o.id);
  console.log(`Seeded ${OUTLETS.length} outlets`);

  // 5c. Produk
  const PRODUCTS = [
    // Outlet Ilir Barat
    { id: 'b3000000-0000-4000-8000-000000000001', name: 'Beras Premium Pandan Wangi 5kg', description: 'Beras putih premium, harum dan pulen', price: 78000, categoryId: CAT_BERAS, outletId: OUT_ILIR, stock: 60 },
    { id: 'b3000000-0000-4000-8000-000000000002', name: 'Bayam Hijau Segar 500g', description: 'Bayam organik lokal, dipanen pagi hari', price: 8000, categoryId: CAT_SAYUR, outletId: OUT_ILIR, stock: 40 },
    { id: 'b3000000-0000-4000-8000-000000000003', name: 'Cabai Merah Keriting 1kg', description: 'Cabai segar tingkat kepedasan sedang', price: 32000, categoryId: CAT_REMPAH, outletId: OUT_ILIR, stock: 25 },
    { id: 'b3000000-0000-4000-8000-000000000004', name: 'Pupuk NPK Mutiara 1kg', description: 'Pupuk majemuk untuk semua jenis tanaman', price: 18000, categoryId: CAT_PUPUK, outletId: OUT_ILIR, stock: 80 },
    // Outlet Bukit Baru
    { id: 'b3000000-0000-4000-8000-000000000005', name: 'Jagung Manis 3 Buah', description: 'Jagung manis segar siap rebus atau bakar', price: 12000, categoryId: CAT_SAYUR, outletId: OUT_BUKIT, stock: 50 },
    { id: 'b3000000-0000-4000-8000-000000000006', name: 'Pisang Kepok 1 Sisir', description: 'Pisang kepok matang, manis dan legit', price: 15000, categoryId: CAT_BUAH, outletId: OUT_BUKIT, stock: 35 },
    { id: 'b3000000-0000-4000-8000-000000000007', name: 'Bawang Merah 500g', description: 'Bawang merah lokal Brebes, aroma tajam', price: 22000, categoryId: CAT_REMPAH, outletId: OUT_BUKIT, stock: 45 },
    { id: 'b3000000-0000-4000-8000-000000000008', name: 'Beras Merah Organik 2kg', description: 'Beras merah organik tanpa pestisida', price: 42000, categoryId: CAT_BERAS, outletId: OUT_BUKIT, stock: 20 },
    // Outlet Jakabaring
    { id: 'b3000000-0000-4000-8000-000000000009', name: 'Kangkung Segar 500g', description: 'Kangkung hidroponik segar', price: 6000, categoryId: CAT_SAYUR, outletId: OUT_JAKA, stock: 55 },
    { id: 'b3000000-0000-4000-8000-000000000010', name: 'Pepaya California 1kg', description: 'Pepaya California manis dan segar', price: 14000, categoryId: CAT_BUAH, outletId: OUT_JAKA, stock: 30 },
    { id: 'b3000000-0000-4000-8000-000000000011', name: 'Tomat Merah 1kg', description: 'Tomat segar merah matang', price: 10000, categoryId: CAT_SAYUR, outletId: OUT_JAKA, stock: 0, isAvailable: false },
    { id: 'b3000000-0000-4000-8000-000000000012', name: 'Pestisida Organik Neem Oil 500ml', description: 'Pestisida alami berbahan dasar minyak nimba', price: 35000, categoryId: CAT_PUPUK, outletId: OUT_JAKA, stock: 15 },
    // Outlet Sako
    { id: 'b3000000-0000-4000-8000-000000000013', name: 'Wortel Baby 500g', description: 'Wortel baby premium, manis dan renyah', price: 18000, categoryId: CAT_SAYUR, outletId: OUT_SAKO, stock: 40 },
    { id: 'b3000000-0000-4000-8000-000000000014', name: 'Mangga Harum Manis 1kg', description: 'Mangga harum manis Indramayu super', price: 25000, categoryId: CAT_BUAH, outletId: OUT_SAKO, stock: 28 },
    { id: 'b3000000-0000-4000-8000-000000000015', name: 'Bawang Putih 250g', description: 'Bawang putih lokal kualitas pilihan', price: 16000, categoryId: CAT_REMPAH, outletId: OUT_SAKO, stock: 60 },
    { id: 'b3000000-0000-4000-8000-000000000016', name: 'Pupuk Kompos Organik 5kg', description: 'Kompos organik untuk menyuburkan tanah', price: 25000, categoryId: CAT_PUPUK, outletId: OUT_SAKO, stock: 50 },
  ];
  for (const p of PRODUCTS) {
    await prisma.product.upsert({ where: { id: p.id }, update: p, create: p });
  }
  console.log(`Seeded ${PRODUCTS.length} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Ganti kredensial akun admin (email + password) dengan AMAN.
 *
 * Password TIDAK ditulis di file mana pun — dibaca dari environment saat
 * dijalankan, lalu di-hash bcrypt sebelum masuk DB.
 *
 * Cara pakai (jalankan di tempat DATABASE_URL prod bisa diakses):
 *
 *   DATABASE_URL='postgresql://...prod...' \
 *   ADMIN_OLD_EMAIL='admin@example.com' \
 *   ADMIN_EMAIL='admin@lapaktani.com' \
 *   ADMIN_PASSWORD='password-kuat-di-sini' \
 *   npx tsx prisma/set-admin.ts
 *
 * ADMIN_OLD_EMAIL opsional (default admin@example.com). Hanya email & password
 * yang diubah; peran & status admin tetap.
 */
import * as dotenv from 'dotenv';
// Tidak override: DATABASE_URL yang di-set inline (mis. arahkan ke prod) menang.
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const oldEmail = process.env.ADMIN_OLD_EMAIL || 'admin@example.com';
  const newEmail = process.env.ADMIN_EMAIL?.trim();
  const newPassword = process.env.ADMIN_PASSWORD;

  if (!newEmail || !newPassword) {
    throw new Error(
      'Wajib set ADMIN_EMAIL dan ADMIN_PASSWORD di environment.',
    );
  }
  if (newPassword.length < 12) {
    throw new Error('ADMIN_PASSWORD terlalu pendek (minimal 12 karakter).');
  }

  const user = await prisma.user.findUnique({ where: { email: oldEmail } });
  if (!user) {
    throw new Error(
      `Admin lama "${oldEmail}" tidak ditemukan. Cek ADMIN_OLD_EMAIL & DATABASE_URL.`,
    );
  }

  // Bila email baru sudah dipakai user lain, hentikan (email itu unik).
  if (newEmail !== oldEmail) {
    const bentrok = await prisma.user.findUnique({ where: { email: newEmail } });
    if (bentrok) {
      throw new Error(`Email "${newEmail}" sudah dipakai user lain — batal.`);
    }
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      email: newEmail,
      password: hashed,
      // Tandai waktu ganti password — token lama (jika ada) bisa dianggap basi.
      passwordChangedAt: new Date(),
    },
  });

  console.log(`✅ Admin diperbarui: ${oldEmail} -> ${newEmail} (password diganti).`);
}

main()
  .catch((e) => {
    console.error(`❌ ${(e as Error).message}`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

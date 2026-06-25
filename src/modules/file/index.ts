// Barrel publik modul File — satu-satunya pintu impor untuk modul lain.
// Hanya kontrak + tipe yang dibutuhkan lintas-modul. JANGAN ekspor
// FileService, use-case, atau repository dari sini.
export { FileModule } from './file.module';
export { FileContract } from './file.contract';
export type { FileRef } from './file.contract';

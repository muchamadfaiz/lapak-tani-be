// Barrel publik modul Email — satu-satunya pintu impor untuk modul lain.
// Hanya kontrak + tipe lintas-modul. JANGAN ekspor EmailService dari sini.
export { EmailModule } from './email.module';
export { EmailContract } from './email.contract';

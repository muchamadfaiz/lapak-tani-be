// Barrel publik modul User — satu-satunya pintu impor untuk modul lain.
// Hanya kontrak + tipe lintas-modul. JANGAN ekspor UserService, use-case,
// atau repository dari sini.
export { UserModule } from './user.module';
export { UserContract } from './user.contract';
export { UserResponseDto } from './dto';

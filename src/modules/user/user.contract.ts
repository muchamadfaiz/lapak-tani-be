import { UserResponseDto } from './dto';

export interface UserForAuth {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  isActive: boolean;
  deletedAt: Date | null;
  emailVerifiedAt: Date | null;
  role: {
    id: string;
    name: string;
  };
}

/**
 * Batas publik modul User. HANYA berisi yang dibutuhkan modul lain
 * (mis. auth `GET /auth/me`) — bukan seluruh CRUD user. Modul lain bergantung
 * pada kontrak abstrak ini, bukan pada use-case/repository internal user.
 */
export abstract class UserContract {
  /** Ambil user (beserta role & profile) by id. Lempar NotFound bila tidak ada. */
  abstract getById(id: string): Promise<UserResponseDto>;

  /** Cari user berdasarkan email untuk keperluan autentikasi. */
  abstract findByEmailForAuth(email: string): Promise<UserForAuth | null>;

  /** Cari user berdasarkan ID untuk keperluan token refresh/validasi JWT. */
  abstract findByIdForAuth(id: string): Promise<UserForAuth | null>;

  /** Membuat user baru beserta profil default (USER role). */
  abstract createForAuth(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    emailVerifiedAt: Date | null;
  }): Promise<UserForAuth>;

  /** Mengupdate password user. */
  abstract updatePassword(userId: string, passwordHash: string): Promise<void>;

  /** Menandai email user telah terverifikasi. */
  abstract markEmailVerified(userId: string): Promise<void>;
}

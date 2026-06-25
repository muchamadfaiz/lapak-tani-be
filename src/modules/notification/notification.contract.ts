export interface NotifyInput {
  title: string;
  message: string;
  type?: string;
  data?: Record<string, unknown>;
}

/**
 * Batas publik modul Notification. Modul lain memakai ini untuk membuat
 * notifikasi (mis. Order memberi tahu admin saat ada pesanan baru).
 */
export abstract class NotificationContract {
  /** Kirim notifikasi ke satu user. */
  abstract notifyUser(userId: string, input: NotifyInput): Promise<void>;

  /** Kirim notifikasi ke semua admin. */
  abstract notifyAdmins(input: NotifyInput): Promise<void>;
}

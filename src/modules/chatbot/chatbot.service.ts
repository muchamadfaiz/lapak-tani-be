import { Injectable, Logger } from '@nestjs/common';
import { ProductContract } from '../product';
import { SettingContract } from '../setting';
import { GeminiClient, GeminiTool } from './gemini.client';

/** Alat yang boleh dipanggil model. Hanya BACA — tak ada yang mengubah data. */
const TOOLS: GeminiTool[] = [
  {
    type: 'function',
    name: 'cari_produk',
    description:
      'Cari produk yang dijual Lapak Tani berdasarkan kata kunci nama. ' +
      'WAJIB dipakai sebelum menyebut harga, stok, atau ketersediaan apa pun.',
    parameters: {
      type: 'object',
      properties: {
        kata_kunci: {
          type: 'string',
          description:
            'Nama atau sebagian nama produk, mis. "bayam" atau "beras"',
        },
      },
      required: ['kata_kunci'],
    },
  },
];

/**
 * Asisten CS. Aturan pentingnya bukan soal gaya bahasa, melainkan: model TIDAK
 * BOLEH menyebut harga/stok dari ingatannya. Semua angka harus datang dari
 * `cari_produk`, yang membacanya langsung dari database.
 */
@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private readonly gemini: GeminiClient,
    private readonly productContract: ProductContract,
    private readonly settingContract: SettingContract,
  ) {}

  get isEnabled(): boolean {
    return this.gemini.isConfigured;
  }

  private async systemInstruction(): Promise<string> {
    const bayar = await this.settingContract.getPublicPaymentSettings();
    const transfer = bayar.bankName
      ? `Transfer ke ${bayar.bankName} ${bayar.bankAccountNumber} a.n. ${bayar.bankAccountName}`
      : 'Transfer manual (rekening dikonfirmasi admin lewat WhatsApp)';

    return [
      'Kamu asisten customer service Lapak Tani, toko sayur & kebutuhan harian di Palembang.',
      'Jawab dalam Bahasa Indonesia yang ramah, singkat, dan langsung ke inti. Maksimal 4 kalimat.',
      '',
      'ATURAN KERAS:',
      '1. JANGAN PERNAH menyebut harga, stok, atau ketersediaan dari ingatanmu.',
      '   Selalu panggil cari_produk dulu, dan pakai HANYA angka dari hasilnya.',
      '2. Bila cari_produk tidak menemukan apa pun, katakan terus terang produknya',
      '   belum ada. Jangan menawarkan barang yang tidak ada di hasil.',
      '3. Kamu TIDAK punya akses data pesanan pelanggan. Bila ditanya status pesanan,',
      '   arahkan ke menu "Pesanan & Poin" di aplikasi (perlu verifikasi nomor HP),',
      '   atau ke admin WhatsApp. JANGAN meminta nomor HP, alamat, atau data pribadi.',
      '4. Jangan menjanjikan diskon, promo, atau waktu pengiriman yang tidak',
      '   tercantum di data yang kamu terima.',
      '',
      'FAKTA TOKO:',
      '- Belanja lewat aplikasi: pilih produk, masukkan keranjang, lalu checkout.',
      '- Pesanan diambil dari outlet terdekat dengan lokasi pelanggan.',
      '- Ongkir dihitung otomatis dari jarak, minimal Rp5.000.',
      `- Pembayaran: ${transfer}, atau bayar tunai saat barang diterima (COD).`,
      '- Poin: 1 poin per Rp1.000 belanja, masuk setelah pesanan berstatus Selesai.',
      '- Jam layanan admin: Senin–Sabtu 08.00–17.00.',
    ].join('\n');
  }

  private async runTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<string> {
    if (name !== 'cari_produk') {
      return JSON.stringify({ error: `Alat "${name}" tidak dikenal` });
    }
    // Argumen dari model tak bisa dipercaya bentuknya; kalau bukan string,
    // perlakukan sebagai pencarian kosong daripada mengirim "[object Object]".
    const raw: unknown = args.kata_kunci;
    const kata = typeof raw === 'string' ? raw.trim() : '';
    if (!kata) return JSON.stringify({ hasil: [] });

    const hasil = await this.productContract.search(kata, 8);
    return JSON.stringify({
      hasil: hasil.map((p) => ({
        nama: p.name,
        harga: p.price,
        harga_coret: p.originalPrice,
        satuan: p.unit,
        label: p.tags,
        stok: p.stock,
        bisa_dibeli: p.isAvailable && p.stock > 0,
      })),
    });
  }

  /**
   * Satu giliran percakapan. `previousInteractionId` merantai giliran di sisi
   * Gemini, jadi kita tidak perlu menyimpan riwayat chat sendiri.
   */
  async chat(
    message: string,
    previousInteractionId?: string | null,
  ): Promise<{ reply: string; interactionId: string | null }> {
    const systemInstruction = await this.systemInstruction();

    let res = await this.gemini.send({
      input: message,
      systemInstruction,
      tools: TOOLS,
      previousInteractionId,
    });

    // Model boleh memanggil alat beberapa kali; dibatasi agar tak berputar tanpa henti.
    for (
      let putaran = 0;
      putaran < 3 && res.functionCalls.length > 0;
      putaran++
    ) {
      const hasil = await Promise.all(
        res.functionCalls.map(async (call) => ({
          type: 'function_result' as const,
          name: call.name,
          call_id: call.id,
          result: [
            {
              type: 'text' as const,
              text: await this.runTool(call.name, call.arguments),
            },
          ],
        })),
      );
      res = await this.gemini.send({
        input: hasil,
        systemInstruction,
        tools: TOOLS,
        previousInteractionId: res.interactionId,
      });
    }

    if (!res.text) {
      this.logger.warn('Gemini tidak mengembalikan teks jawaban');
      return {
        reply:
          'Maaf, saya belum bisa menjawab itu. Silakan hubungi admin lewat WhatsApp ya.',
        interactionId: res.interactionId,
      };
    }
    return { reply: res.text, interactionId: res.interactionId };
  }
}

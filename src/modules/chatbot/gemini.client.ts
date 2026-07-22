import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

/**
 * Pembungkus tipis Gemini Interactions API (REST, tanpa SDK tambahan).
 * Sengaja dipisah dari service supaya urusan HTTP/bentuk payload tidak
 * bercampur dengan aturan bisnis asisten.
 *
 * Dokumen: https://ai.google.dev/gemini-api/docs/function-calling
 */

/** Deklarasi alat yang boleh dipanggil model. */
export interface GeminiTool {
  type: 'function';
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/** Permintaan model untuk menjalankan sebuah alat. */
export interface GeminiFunctionCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface GeminiReply {
  interactionId: string | null;
  /** Teks jawaban; kosong bila model justru meminta pemanggilan alat. */
  text: string;
  functionCalls: GeminiFunctionCall[];
}

/** Satu blok masukan: teks biasa, atau hasil eksekusi alat. */
export type GeminiInput =
  | string
  | Array<{
      type: 'function_result';
      name: string;
      call_id: string;
      result: Array<{ type: 'text'; text: string }>;
    }>;

interface InteractionStep {
  type?: string;
  id?: string;
  name?: string;
  arguments?: Record<string, unknown>;
  content?: Array<{ type?: string; text?: string }>;
  text?: string;
}

@Injectable()
export class GeminiClient {
  private readonly logger = new Logger(GeminiClient.name);

  private get apiKey(): string | undefined {
    return process.env.GEMINI_API_KEY;
  }

  private get model(): string {
    return process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  }

  private get baseUrl(): string {
    return (
      process.env.GEMINI_BASE_URL ||
      'https://generativelanguage.googleapis.com/v1beta'
    );
  }

  /** true bila kunci API sudah dipasang; dipakai untuk mematikan fitur dengan rapi. */
  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  async send(params: {
    input: GeminiInput;
    systemInstruction?: string;
    tools?: GeminiTool[];
    previousInteractionId?: string | null;
  }): Promise<GeminiReply> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        'Asisten belum aktif (GEMINI_API_KEY belum diisi)',
      );
    }

    const body: Record<string, unknown> = {
      model: this.model,
      input: params.input,
    };
    if (params.systemInstruction) {
      body.system_instruction = params.systemInstruction;
    }
    if (params.tools?.length) body.tools = params.tools;
    if (params.previousInteractionId) {
      body.previous_interaction_id = params.previousInteractionId;
    }

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/interactions`, {
        method: 'POST',
        headers: {
          'x-goog-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        // Jangan biarkan pelanggan menunggu tanpa batas bila Gemini lambat.
        signal: AbortSignal.timeout(20_000),
      });
    } catch (err) {
      this.logger.error(`Gagal menghubungi Gemini: ${String(err)}`);
      throw new ServiceUnavailableException(
        'Asisten sedang tidak bisa dihubungi',
      );
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      // Kunci API tidak boleh ikut ter-log.
      this.logger.error(`Gemini balas ${res.status}: ${detail.slice(0, 400)}`);
      throw new ServiceUnavailableException(
        'Asisten sedang tidak bisa dihubungi',
      );
    }

    return GeminiClient.parse(await res.json());
  }

  /**
   * Bentuk respons dibaca defensif: `output_text` dipakai bila ada, kalau tidak
   * teksnya dirangkai dari `steps`. Struktur API bisa berubah — lebih baik
   * jawabannya kosong daripada seluruh permintaan meledak.
   */
  private static parse(raw: unknown): GeminiReply {
    const data = (raw ?? {}) as {
      id?: string;
      output_text?: string;
      steps?: InteractionStep[];
    };
    const steps = Array.isArray(data.steps) ? data.steps : [];

    const functionCalls: GeminiFunctionCall[] = steps
      .filter((s) => s.type === 'function_call' && s.name)
      .map((s) => ({
        id: s.id ?? '',
        name: s.name,
        arguments: s.arguments ?? {},
      }));

    let text = data.output_text ?? '';
    if (!text) {
      text = steps
        .flatMap((s) => s.content ?? (s.text ? [{ text: s.text }] : []))
        .map((c) => c.text ?? '')
        .join('')
        .trim();
    }

    return { interactionId: data.id ?? null, text, functionCalls };
  }
}

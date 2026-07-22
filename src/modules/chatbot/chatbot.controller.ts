import { Body, Controller, Get, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public, ResponseMessage } from '../../common';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';
import { ChatbotService } from './chatbot.service';

@ApiTags('Chatbot')
@Controller('chat')
export class ChatbotController {
  constructor(private readonly svc: ChatbotService) {}

  @Public()
  @Get('status')
  @ApiOperation({
    summary:
      'Cek apakah asisten aktif (storefront menyembunyikan menu bila mati)',
  })
  @ResponseMessage('Success get chat status')
  async status(): Promise<{ enabled: boolean; language: string }> {
    return {
      enabled: this.svc.isEnabled,
      // Frontend memakainya untuk sapaan & contoh pertanyaan di panel chat,
      // supaya bahasanya tidak berbeda dengan jawaban botnya.
      language: await this.svc.language(),
    };
  }

  @Public()
  // Endpoint ini memanggil API berbayar per permintaan, jadi dibatasi jauh
  // lebih ketat daripada default: tanpa ini, satu skrip bisa menghabiskan
  // kuota/tagihan Gemini.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post()
  @ApiOperation({ summary: 'Kirim pesan ke asisten customer service' })
  @ResponseMessage('Success send chat')
  chat(@Body() dto: ChatRequestDto): Promise<ChatResponseDto> {
    return this.svc.chat(dto.message, dto.previousInteractionId);
  }
}

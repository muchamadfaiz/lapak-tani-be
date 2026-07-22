import { Module } from '@nestjs/common';
import { ProductModule } from '../product';
import { SettingModule } from '../setting';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { GeminiClient } from './gemini.client';

@Module({
  // Data produk & pengaturan diambil lewat contract, bukan repository modul lain.
  imports: [ProductModule, SettingModule],
  controllers: [ChatbotController],
  providers: [GeminiClient, ChatbotService],
})
export class ChatbotModule {}

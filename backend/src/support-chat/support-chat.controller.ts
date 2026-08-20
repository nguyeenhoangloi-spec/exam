import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { SupportChatMessageDto } from './dto/support-chat-message.dto';
import { SupportChatService } from './support-chat.service';

@Controller('support-chat')
export class SupportChatController {
  constructor(private readonly supportChatService: SupportChatService) {}

  @Public()
  @Post('message')
  @HttpCode(HttpStatus.OK)
  sendMessage(@Body() dto: SupportChatMessageDto) {
    return this.supportChatService.answer(dto.message);
  }
}

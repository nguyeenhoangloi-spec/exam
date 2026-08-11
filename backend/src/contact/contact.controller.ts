import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { ContactService } from './contact.service';
import { ContactMessageDto } from './dto/contact.dto';

@Controller('contact')
export class ContactController {
    constructor(private readonly contactService: ContactService) { }

  @Post('send')
  @Public()
    async sendContactMessage(@Body() dto: ContactMessageDto) {
        return this.contactService.handleContactMessage(dto);
    }
}

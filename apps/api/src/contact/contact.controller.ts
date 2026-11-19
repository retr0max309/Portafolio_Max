import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';
import { ContactDto } from './contact.dto';
import { ContactService } from './contact.service';

@Controller('contact')
export class ContactController {
  constructor(@Inject(ContactService) private readonly contact: ContactService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() dto: ContactDto) {
    if (!dto.website) await this.contact.create(dto);
    return { ok: true };
  }
}

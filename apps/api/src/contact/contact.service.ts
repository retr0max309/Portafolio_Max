import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database.service';
import { ContactDto } from './contact.dto';

@Injectable()
export class ContactService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async create(dto: ContactDto): Promise<void> {
    await this.database.saveContact({
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      message: dto.message.trim(),
    });
  }
}

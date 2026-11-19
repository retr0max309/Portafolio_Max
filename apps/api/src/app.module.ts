import { Module } from '@nestjs/common';
import { ContactController } from './contact/contact.controller';
import { ContactService } from './contact/contact.service';
import { DatabaseService } from './database.service';
import { HealthController } from './health.controller';
import { ProjectsController } from './projects/projects.controller';
import { ProjectsService } from './projects/projects.service';

@Module({
  controllers: [ProjectsController, ContactController, HealthController],
  providers: [DatabaseService, ProjectsService, ContactService],
})
export class AppModule {}

import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database.service';
import { mapProject, Project } from './project';

@Injectable()
export class ProjectsService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async listPublished(): Promise<Project[]> {
    return (await this.database.listPublishedProjects()).map(mapProject);
  }
}

import { describe, expect, it, vi } from 'vitest';
import { DatabaseService } from '../../src/database.service';
import { ContactService } from '../../src/contact/contact.service';
import { mapProject, ProjectRow } from '../../src/projects/project';
import { ProjectsService } from '../../src/projects/projects.service';

const row: ProjectRow = {
  id: '1',
  slug: 'demo',
  title: 'Demo',
  kind: 'Proyecto individual',
  year_label: '2026',
  summary: 'Resumen',
  contribution: 'Frontend',
  technologies: ['Next.js'],
  site_url: null,
  repository_url: null,
  note: null,
};

describe('portfolio services', () => {
  it('maps database columns into the public project contract', () => {
    expect(mapProject(row)).toMatchObject({ slug: 'demo', yearLabel: '2026', technologies: ['Next.js'] });
  });

  it('queries only published projects in display order', async () => {
    const listPublishedProjects = vi.fn().mockResolvedValue([row]);
    const service = new ProjectsService({ listPublishedProjects } as unknown as DatabaseService);
    expect(await service.listPublished()).toHaveLength(1);
    expect(listPublishedProjects).toHaveBeenCalledOnce();
  });

  it('normalizes email and trims contact data before storing it', async () => {
    const saveContact = vi.fn().mockResolvedValue(undefined);
    const service = new ContactService({ saveContact } as unknown as DatabaseService);
    await service.create({ name: ' Max ', email: ' MAX@Example.COM ', message: ' Hola mundo ' });
    expect(saveContact).toHaveBeenCalledWith({ name: 'Max', email: 'max@example.com', message: 'Hola mundo' });
  });
});

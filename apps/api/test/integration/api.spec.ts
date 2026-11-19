import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prepareTestDatabase, getTestDatabaseUrl } from '../../../../scripts/test-database';
import { AppModule } from '../../src/app.module';

describe('portfolio API with PostgreSQL', () => {
  let app: INestApplication;
  let pool: Pool;

  beforeAll(async () => {
    process.env.DATABASE_PROVIDER = 'postgres';
    process.env.DATABASE_URL = getTestDatabaseUrl();
    pool = await prepareTestDatabase();
    await pool.query('truncate table public.contact_messages, public.projects restart identity');
    await pool.query(`insert into public.projects
      (slug, title, kind, year_label, summary, contribution, technologies, published, display_order)
      values
      ('second', 'Segundo', 'Individual', '2026', 'Resumen dos', 'Autor', '{}', true, 2),
      ('first', 'Primero', 'Individual', '2026', 'Resumen uno', 'Autor', '{}', true, 1),
      ('draft', 'Borrador', 'Individual', '2026', 'No mostrar', 'Autor', '{}', false, 0)`);
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (pool) await pool.end();
  });

  it('returns published projects in display order', async () => {
    const response = await request(app.getHttpServer()).get('/api/projects').expect(200);
    expect(response.body.map((project: { slug: string }) => project.slug)).toEqual(['first', 'second']);
  });

  it('saves a valid contact message', async () => {
    await request(app.getHttpServer()).post('/api/contact').send({
      name: ' Visitante ', email: ' TEST@EXAMPLE.COM ', message: 'Este es un mensaje de prueba.'
    }).expect(201, { ok: true });
    const result = await pool.query('select name, email from public.contact_messages');
    expect(result.rows).toEqual([{ name: 'Visitante', email: 'test@example.com' }]);
  });

  it('rejects invalid messages without inserting a row', async () => {
    await request(app.getHttpServer()).post('/api/contact').send({
      name: 'X', email: 'invalid', message: 'short'
    }).expect(400);
    const result = await pool.query('select count(*)::int as total from public.contact_messages');
    expect(result.rows[0].total).toBe(1);
  });
});

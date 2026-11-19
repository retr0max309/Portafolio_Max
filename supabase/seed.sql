insert into public.projects
  (slug, title, kind, year_label, summary, contribution, technologies,
   site_url, repository_url, note, published, display_order)
values
  (
    'barbara-ocasion', 'Barbara Ocasión', 'Proyecto individual', '2026',
    'Sitio web para un salón de eventos en Sucre. Desarrollé páginas de servicios, eventos y contacto, con adaptación móvil, optimización de recursos e indexación.',
    'Diseño e implementación individual; mejoras de rendimiento y SEO.',
    array['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
    'https://www.barbaraocasion.com/', 'https://github.com/retr0max309/Barbara-Ocasi-n',
    null, true, 1
  ),
  (
    'sucreexpress', 'SucreExpress', 'Proyecto colaborativo', '2026',
    'Sistema de gestión de paquetería con frontend en Next.js y API en NestJS. Incluye autenticación, paquetes, repartidores, rutas e incidencias.',
    'Interfaz y ajustes de integración, incluidos cambios para SSR y CORS.',
    array['Next.js', 'NestJS', 'TypeScript', 'Supabase'],
    null, 'https://github.com/SucrExpress/Sucrexpress',
    null, true, 2
  ),
  (
    'ceipi', 'CEIPI', 'Proyecto colaborativo', 'En desarrollo',
    'Sitio institucional para un centro de psicología, con servicios, especialistas e información de contacto para pacientes.',
    'En desarrollo; repositorio privado por decisión de su creador.',
    array[]::text[], null, null,
    'Los detalles técnicos y mi contribución específica están pendientes de documentar.',
    true, 3
  )
on conflict (slug) do update set
  title = excluded.title,
  kind = excluded.kind,
  year_label = excluded.year_label,
  summary = excluded.summary,
  contribution = excluded.contribution,
  technologies = excluded.technologies,
  site_url = excluded.site_url,
  repository_url = excluded.repository_url,
  note = excluded.note,
  published = excluded.published,
  display_order = excluded.display_order,
  updated_at = now();

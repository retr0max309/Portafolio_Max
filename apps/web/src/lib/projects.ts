export interface Project {
  id: string | number;
  slug: string;
  title: string;
  kind: string;
  yearLabel: string;
  summary: string;
  contribution: string;
  technologies: string[];
  siteUrl: string | null;
  repositoryUrl: string | null;
  note: string | null;
}

// Keeps the portfolio readable during local setup or a temporary API outage.
export const fallbackProjects: Project[] = [
  {
    id: 1,
    slug: 'barbara-ocasion',
    title: 'Barbara Ocasión',
    kind: 'Proyecto individual',
    yearLabel: '2026',
    summary: 'Sitio web para un salón de eventos en Sucre. Desarrollé páginas de servicios, eventos y contacto, con adaptación móvil, optimización de recursos e indexación.',
    contribution: 'Diseño e implementación individual; mejoras de rendimiento y SEO.',
    technologies: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
    siteUrl: 'https://www.barbaraocasion.com/',
    repositoryUrl: 'https://github.com/retr0max309/Barbara-Ocasi-n',
    note: null,
  },
  {
    id: 2,
    slug: 'sucreexpress',
    title: 'SucreExpress',
    kind: 'Proyecto colaborativo',
    yearLabel: '2026',
    summary: 'Sistema de gestión de paquetería con frontend en Next.js y API en NestJS. Incluye autenticación, paquetes, repartidores, rutas e incidencias.',
    contribution: 'Interfaz y ajustes de integración, incluidos cambios para SSR y CORS.',
    technologies: ['Next.js', 'NestJS', 'TypeScript', 'Supabase'],
    siteUrl: null,
    repositoryUrl: 'https://github.com/SucrExpress/Sucrexpress',
    note: null,
  },
  {
    id: 3,
    slug: 'ceipi',
    title: 'CEIPI',
    kind: 'Proyecto colaborativo',
    yearLabel: 'En desarrollo',
    summary: 'Sitio institucional para un centro de psicología, con servicios, especialistas e información de contacto para pacientes.',
    contribution: 'En desarrollo; repositorio privado por decisión de su creador.',
    technologies: [],
    siteUrl: null,
    repositoryUrl: null,
    note: 'Los detalles técnicos y mi contribución específica están pendientes de documentar.',
  },
];

export async function getProjects(): Promise<Project[]> {
  try {
    const baseUrl = process.env.API_INTERNAL_URL || 'http://localhost:3001';
    const response = await fetch(`${baseUrl}/api/projects`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const projects: unknown = await response.json();
    if (!Array.isArray(projects)) throw new Error('Invalid projects response');
    return projects as Project[];
  } catch (error) {
    console.error('Could not load projects from API:', error);
    return fallbackProjects;
  }
}

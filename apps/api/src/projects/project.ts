export interface ProjectRow {
  id: string;
  slug: string;
  title: string;
  kind: string;
  year_label: string;
  summary: string;
  contribution: string;
  technologies: string[];
  site_url: string | null;
  repository_url: string | null;
  note: string | null;
}

export interface Project {
  id: string;
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

export function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    kind: row.kind,
    yearLabel: row.year_label,
    summary: row.summary,
    contribution: row.contribution,
    technologies: row.technologies,
    siteUrl: row.site_url,
    repositoryUrl: row.repository_url,
    note: row.note,
  };
}

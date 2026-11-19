import { ContactForm } from '../components/contact-form';
import { Navigation } from '../components/navigation';
import { getProjects, Project } from '../lib/projects';

export const dynamic = 'force-dynamic';

function ProjectCard({ project, number }: { project: Project; number: number }) {
  return <article className="project-card">
    <div className="project-topline"><span className="project-number">{String(number).padStart(2, '0')} / {project.kind}</span><span className="project-year">{project.yearLabel}</span></div>
    <h3>{project.title}</h3>
    <p>{project.summary}</p>
    <div className="project-detail"><strong>{project.slug === 'ceipi' ? 'Estado' : 'Mi aporte'}</strong><span>{project.contribution}</span></div>
    {project.technologies.length > 0 && <ul className="tags" aria-label="Tecnologías">{project.technologies.map(item => <li key={item}>{item}</li>)}</ul>}
    {(project.siteUrl || project.repositoryUrl) && <div className="project-links">
      {project.siteUrl && <a className="project-link" href={project.siteUrl} target="_blank" rel="noopener noreferrer">Visitar sitio ↗</a>}
      {project.repositoryUrl && <a className="project-link" href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">Ver código ↗</a>}
    </div>}
    {project.note && <span className="project-note">{project.note}</span>}
  </article>;
}

export default async function Home() {
  const projects = await getProjects();
  const year = new Date().getFullYear();

  return <>
    <a className="skip-link" href="#contenido">Ir al contenido</a>
    <Navigation />
    <main id="contenido">
      <section id="inicio" className="hero" aria-labelledby="nombre">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow"><span className="availability-dot" aria-hidden="true" />Abierto a oportunidades junior</p>
            <h1 id="nombre">Maximiliano<br /><span>Turdera Colque</span></h1>
            <p className="role">Desarrollador de software junior</p>
            <p className="lead">Estudio Ingeniería en Sistemas Informáticos en Univalle y busco mi primera oportunidad para desarrollar software en equipo. He trabajado en proyectos web individuales y colaborativos. Mi interés a largo plazo es especializarme en inteligencia artificial.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#proyectos">Ver proyectos <span aria-hidden="true">↗</span></a>
              <a className="button button-secondary" href="/Maximiliano_Turdera_Colque_CV.pdf" download>Descargar CV (PDF)</a>
            </div>
            <ul className="quick-facts" aria-label="Datos principales">
              <li>Sucre, Bolivia</li><li>Ing. en Sistemas Informáticos · en curso</li>
              <li><a href="mailto:maximilianoturdera@gmail.com">maximilianoturdera@gmail.com</a></li>
              <li><a href="https://github.com/retr0max309" target="_blank" rel="noopener noreferrer">GitHub: retr0max309</a></li>
            </ul>
          </div>
          <aside className="focus-card" aria-label="Enfoque profesional">
            <span className="focus-label">Mi enfoque</span>
            <h2>Construir, aprender y aportar desde el primer día.</h2>
            <p>Hoy me enfoco en desarrollo web y fundamentos de programación. Quiero fortalecer mi experiencia profesional antes de orientar mi carrera hacia IA.</p>
            <a href="#habilidades">Ver habilidades <span aria-hidden="true">→</span></a>
          </aside>
        </div>
      </section>

      <section id="proyectos" className="section section-light" aria-labelledby="proyectos-title">
        <div className="container">
          <div className="section-heading"><div><p className="section-kicker">Trabajo seleccionado</p><h2 id="proyectos-title">Proyectos</h2></div><p>Qué problema aborda cada proyecto, cuál fue mi participación y con qué tecnologías trabajé.</p></div>
          <div className="projects-grid">{projects.map((project, index) => <ProjectCard key={project.id} project={project} number={index + 1} />)}</div>
        </div>
      </section>

      <section id="habilidades" className="section" aria-labelledby="habilidades-title">
        <div className="container">
          <div className="section-heading"><div><p className="section-kicker">Capacidades técnicas</p><h2 id="habilidades-title">Habilidades</h2></div><p>Distingo las herramientas usadas en los proyectos mostrados de las que sigo practicando.</p></div>
          <div className="skills-grid">
            <div className="skill-panel"><span className="skill-icon" aria-hidden="true">&lt;/&gt;</span><h3>Aplicadas en proyectos</h3><p>TypeScript, React, Next.js, NestJS, HTML, CSS y Supabase. Los repositorios de Barbara Ocasión y SucreExpress muestran su uso.</p></div>
            <div className="skill-panel"><span className="skill-icon" aria-hidden="true">{'{ }'}</span><h3>En formación y práctica</h3><p>Python y SQL. Continúo reforzando fundamentos de programación, bases de datos y desarrollo de software.</p></div>
            <div className="skill-panel"><span className="skill-icon" aria-hidden="true">↗</span><h3>Próximo paso</h3><p>Construir un proyecto público de datos o IA con código, decisiones técnicas y resultados reproducibles.</p></div>
          </div>
        </div>
      </section>

      <section id="formacion" className="section section-light" aria-labelledby="formacion-title">
        <div className="container">
          <div className="section-heading"><div><p className="section-kicker">Aprendizaje continuo</p><h2 id="formacion-title">Formación</h2></div></div>
          <div className="education-grid">
            <div className="education-card"><span className="card-label">Universidad · 2024 – actualidad</span><h3>Ingeniería en Sistemas Informáticos</h3><p>Universidad del Valle (Univalle), Sucre, Bolivia · estudios en curso.</p></div>
            <div className="education-card"><span className="card-label">Idiomas · 2023 – 2025</span><h3>Inglés B2+</h3><p>Formación en el Centro Boliviano Americano.</p></div>
          </div>
          <h3 className="cert-heading">Formación complementaria relevante</h3>
          <ul className="cert-list">
            <li><strong>Fundamentos de Python 1</strong><span>Cisco Networking Academy · 2024</span></li>
            <li><strong>Introducción a la IA moderna</strong><span>Cisco Networking Academy · 2025</span></li>
            <li><strong>CCNA: Introducción a las redes</strong><span>Cisco Networking Academy · 2026</span></li>
            <li><strong>SQL Developer y Java JDK</strong><span>Oracle Academy</span></li>
          </ul>
        </div>
      </section>

      <section id="contacto" className="contact-section" aria-labelledby="contacto-title">
        <div className="container contact-layout">
          <div><p className="section-kicker">Contacto</p><h2 id="contacto-title">Hablemos de una oportunidad junior.</h2><p>Me interesa aprender con un equipo de desarrollo y aportar en proyectos reales.</p><p>También puedes escribirme directamente a <a href="mailto:maximilianoturdera@gmail.com">maximilianoturdera@gmail.com</a>.</p></div>
          <ContactForm />
        </div>
      </section>
    </main>
    <footer className="site-footer"><div className="container footer-inner"><span>© {year} Maximiliano Turdera Colque</span><a href="#inicio">Volver arriba ↑</a></div></footer>
  </>;
}

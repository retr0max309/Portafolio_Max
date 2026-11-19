'use client';

import { useEffect, useState } from 'react';

const links = [
  ['#proyectos', 'Proyectos'],
  ['#habilidades', 'Habilidades'],
  ['#formacion', 'Formación'],
  ['#contacto', 'Contacto'],
];

export function Navigation() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return <header className="site-header">
    <div className="container nav-wrap">
      <a className="brand" href="#inicio" aria-label="Maximiliano Turdera Colque, inicio" onClick={() => setOpen(false)}>Maximiliano<span>.</span></a>
      <button className="menu-toggle" type="button" disabled={!ready} aria-controls="site-nav" aria-expanded={open} aria-label={open ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setOpen(!open)}>Menú</button>
      <nav id="site-nav" className={`site-nav${open ? ' is-open' : ''}`} aria-label="Navegación principal">
        {links.map(([href, label]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
        <a className="nav-cv" href="/Maximiliano_Turdera_Colque_CV.pdf" download>Descargar CV</a>
      </nav>
    </div>
  </header>;
}

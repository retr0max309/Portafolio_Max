import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Maximiliano Turdera Colque | Desarrollador junior',
  description: 'Portafolio de Maximiliano Turdera Colque, estudiante de Ingeniería en Sistemas Informáticos en Sucre, Bolivia. Proyectos web, habilidades y formación.',
  openGraph: {
    type: 'website',
    title: 'Maximiliano Turdera Colque | Desarrollador junior',
    description: 'Proyectos de desarrollo web, habilidades y formación de Maximiliano Turdera Colque.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Some browser extensions add attributes to body before React hydrates it.
  return <html lang="es"><body suppressHydrationWarning>{children}</body></html>;
}

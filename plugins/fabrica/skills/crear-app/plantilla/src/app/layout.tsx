import type { Metadata } from 'next';
import { configuracion } from '@/lib/configuracion';
import './globals.css';

export const metadata: Metadata = {
  title: { default: configuracion.nombre, template: `%s · ${configuracion.nombre}` },
  description: configuracion.descripcion,
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}

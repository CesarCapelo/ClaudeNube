import type { Metadata } from 'next';
import { EnlaceBoton } from '@/components/ui/boton';

export const metadata: Metadata = { title: 'Sin permiso' };

export default function Prohibido() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-bold">No tienes permiso para ver esta página</h1>
      <p className="text-tinta-suave">Si crees que es un error, contacta con la administración.</p>
      <EnlaceBoton href="/agenda">Volver a la agenda</EnlaceBoton>
    </main>
  );
}

'use client';

import { Boton } from '@/components/ui/boton';

export default function ErrorGlobal({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-bold">Algo ha fallado</h1>
      <p className="text-tinta-suave">Inténtalo de nuevo. Si se repite, avisa al soporte.</p>
      <Boton onClick={() => reset()}>Reintentar</Boton>
    </main>
  );
}

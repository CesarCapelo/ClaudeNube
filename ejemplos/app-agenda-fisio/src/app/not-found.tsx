import { EnlaceBoton } from '@/components/ui/boton';

export default function NoEncontrado() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-semibold text-marca-700">Error 404</p>
      <h1 className="text-3xl font-bold">No encontramos esta página</h1>
      <EnlaceBoton href="/">Ir al inicio</EnlaceBoton>
    </main>
  );
}

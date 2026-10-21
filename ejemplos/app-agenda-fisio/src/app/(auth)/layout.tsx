import { configuracion } from '@/lib/configuracion';

export default function LayoutAcceso({ children }: LayoutProps<'/'>) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="mb-8 text-center text-lg font-bold text-tinta">{configuracion.nombre}</p>
        <div className="rounded-2xl bg-superficie p-8 shadow-sm ring-1 ring-borde">{children}</div>
      </div>
    </main>
  );
}

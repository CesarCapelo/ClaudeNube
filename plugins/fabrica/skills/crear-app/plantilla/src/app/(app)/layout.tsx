import Link from 'next/link';
import { configuracion } from '@/lib/configuracion';
import { exigirUsuario } from '@/lib/sesion';
import { BotonSalir } from './boton-salir';
import { Navegacion } from './navegacion';

export default async function LayoutAplicacion({ children }: LayoutProps<'/'>) {
  const usuario = await exigirUsuario();
  const enlaces = [
    { href: '/panel', texto: 'Panel' },
    { href: '/clientes', texto: 'Clientes' },
    ...(usuario.role === 'admin' ? [{ href: '/usuarios', texto: 'Usuarios' }] : []),
  ];

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[15rem_1fr]">
      <a
        href="#contenido"
        className="sr-only z-50 rounded-lg bg-marca-800 px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>
      <aside className="border-b border-borde bg-superficie md:min-h-dvh md:border-r md:border-b-0">
        <div className="flex items-center justify-between gap-4 px-5 py-4 md:block">
          <Link href="/panel" className="text-lg font-bold text-tinta">
            {configuracion.nombre}
          </Link>
          <div className="md:mt-6">
            <Navegacion enlaces={enlaces} />
          </div>
        </div>
        <div className="hidden border-t border-borde px-5 py-4 md:block">
          <p className="truncate text-sm font-semibold">{usuario.name}</p>
          <p className="truncate text-xs text-tinta-suave">{usuario.email}</p>
          <div className="mt-3">
            <BotonSalir />
          </div>
        </div>
      </aside>
      <main id="contenido" className="px-5 py-8 md:px-10 md:py-10">
        {children}
        <div className="mt-12 border-t border-borde pt-4 md:hidden">
          <p className="text-sm text-tinta-suave">{usuario.email}</p>
          <BotonSalir />
        </div>
      </main>
    </div>
  );
}

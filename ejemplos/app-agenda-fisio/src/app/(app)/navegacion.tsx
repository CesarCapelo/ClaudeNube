'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navegacion({ enlaces }: { enlaces: { href: string; texto: string }[] }) {
  const ruta = usePathname();
  const coincide = (href: string) => ruta === href || ruta.startsWith(`${href}/`);
  // Con enlaces anidados (/pacientes y /pacientes/sin-volver) solo se marca el más específico.
  const actualHref = enlaces
    .filter((e) => coincide(e.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav aria-label="Principal">
      <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {enlaces.map((enlace) => {
          const actual = enlace.href === actualHref;
          return (
            <li key={enlace.href}>
              <Link
                href={enlace.href}
                aria-current={actual ? 'page' : undefined}
                className="block rounded-lg border-b-2 border-transparent px-3 py-2.5 text-sm font-medium whitespace-nowrap text-tinta-suave hover:bg-marca-50 hover:text-tinta aria-[current=page]:border-marca-700 aria-[current=page]:bg-marca-100 aria-[current=page]:font-semibold aria-[current=page]:text-marca-800 md:border-b-0 md:border-l-4"
              >
                {enlace.texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

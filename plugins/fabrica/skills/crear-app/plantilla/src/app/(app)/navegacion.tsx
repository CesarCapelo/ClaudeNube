'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navegacion({ enlaces }: { enlaces: { href: string; texto: string }[] }) {
  const ruta = usePathname();
  return (
    <nav aria-label="Principal">
      <ul className="flex flex-wrap gap-1 md:flex-col">
        {enlaces.map((enlace) => {
          const actual = ruta === enlace.href || ruta.startsWith(`${enlace.href}/`);
          return (
            <li key={enlace.href}>
              <Link
                href={enlace.href}
                aria-current={actual ? 'page' : undefined}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-tinta-suave hover:bg-marca-50 hover:text-tinta aria-[current=page]:bg-marca-50 aria-[current=page]:text-marca-800"
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

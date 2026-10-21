import Link from 'next/link';
import type { ComponentProps } from 'react';

const variantes = {
  primario: 'bg-marca-700 text-white hover:bg-marca-800 disabled:bg-marca-400',
  secundario: 'bg-superficie text-tinta ring-1 ring-borde ring-inset hover:bg-fondo',
  peligro: 'bg-peligro text-white hover:opacity-90',
  fantasma: 'text-tinta-suave hover:bg-marca-50 hover:text-tinta',
} as const;

type Variante = keyof typeof variantes;

const base =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed';

export function Boton({
  variante = 'primario',
  className = '',
  ...props
}: ComponentProps<'button'> & { variante?: Variante }) {
  return <button className={`${base} ${variantes[variante]} ${className}`} {...props} />;
}

export function EnlaceBoton({
  variante = 'primario',
  className = '',
  ...props
}: ComponentProps<typeof Link> & { variante?: Variante }) {
  return <Link className={`${base} ${variantes[variante]} ${className}`} {...props} />;
}

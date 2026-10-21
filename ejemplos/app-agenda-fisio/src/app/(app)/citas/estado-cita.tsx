import { Ban, CalendarClock, CircleCheck, Clock, UserX } from 'lucide-react';
import type { EstadoCita } from '@/lib/db/esquema';

export const ETIQUETAS_ESTADO: Record<EstadoCita, string> = {
  programada: 'Programada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  no_presentado: 'No se presentó',
};

const ESTILOS = {
  programada: { icono: CalendarClock, clases: 'bg-marca-50 text-marca-900 ring-marca-300' },
  realizada: { icono: CircleCheck, clases: 'bg-green-50 text-green-900 ring-green-300' },
  cancelada: { icono: Ban, clases: 'bg-white text-tinta-suave ring-borde' },
  no_presentado: { icono: UserX, clases: 'bg-amber-50 text-amber-900 ring-amber-300' },
} as const;

const base =
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap';

/** Estado de la cita con texto e icono (no solo color). */
export function InsigniaEstado({ estado }: { estado: EstadoCita }) {
  const { icono: Icono, clases } = ESTILOS[estado];
  return (
    <span className={`${base} ${clases}`}>
      <Icono aria-hidden="true" className="size-3.5 shrink-0" />
      {ETIQUETAS_ESTADO[estado]}
    </span>
  );
}

export function InsigniaPendiente() {
  return (
    <span className={`${base} bg-amber-100 text-amber-900 ring-amber-300`}>
      <Clock aria-hidden="true" className="size-3.5 shrink-0" />
      Pendiente de marcar
    </span>
  );
}

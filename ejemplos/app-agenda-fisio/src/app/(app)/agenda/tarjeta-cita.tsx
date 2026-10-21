import Link from 'next/link';
import type { EstadoCita } from '@/lib/db/esquema';
import { formatearHora } from '@/lib/fechas';
import { BotonesEstado } from '../citas/botones-estado';
import { InsigniaEstado, InsigniaPendiente } from '../citas/estado-cita';

export type CitaAgenda = {
  id: string;
  pacienteNombre: string;
  inicio: Date;
  fin: Date;
  estado: EstadoCita;
};

/** Una cita en la agenda: hora, paciente (enlace al detalle) y estado. Nunca muestra el motivo. */
export function TarjetaCita({
  cita,
  ahora,
  volverA,
  compacta = false,
}: {
  cita: CitaAgenda;
  ahora: Date;
  volverA: string;
  compacta?: boolean;
}) {
  const empezada = cita.inicio < ahora;
  const pendiente = cita.estado === 'programada' && empezada;
  const cancelada = cita.estado === 'cancelada';
  const botones: EstadoCita[] = empezada ? ['realizada', 'no_presentado', 'cancelada'] : ['cancelada'];

  return (
    <li
      className={`min-w-0 rounded-xl p-3 ring-1 ring-inset ${
        cancelada
          ? 'border border-dashed border-borde bg-transparent text-tinta-suave ring-0'
          : 'bg-white ring-borde'
      } ${compacta ? 'text-xs' : 'text-sm'}`}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-semibold tabular-nums">
          {formatearHora(cita.inicio)}–{formatearHora(cita.fin)}
        </span>
        <Link
          href={`/citas/${cita.id}`}
          className={`font-semibold wrap-anywhere underline ${cancelada ? 'line-through' : 'text-marca-800'}`}
        >
          {cita.pacienteNombre}
        </Link>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <InsigniaEstado estado={cita.estado} />
        {pendiente && <InsigniaPendiente />}
      </div>
      {!compacta && cita.estado === 'programada' && (
        <div className="mt-3">
          <BotonesEstado
            citaId={cita.id}
            actual={cita.estado}
            volverA={volverA}
            botones={botones}
            rapido
            paciente={cita.pacienteNombre}
          />
        </div>
      )}
    </li>
  );
}

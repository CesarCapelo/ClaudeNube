'use client';

import { useActionState } from 'react';
import { Aviso } from '@/components/ui/aviso';
import { Boton } from '@/components/ui/boton';
import type { EstadoCita } from '@/lib/db/esquema';
import { cambiarEstadoAccion, type EstadoFormulario } from './acciones';

const ETIQUETAS_DETALLE: Record<EstadoCita, string> = {
  programada: 'Programada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  no_presentado: 'No se presentó',
};
const ETIQUETAS_RAPIDAS: Record<EstadoCita, string> = { ...ETIQUETAS_DETALLE, cancelada: 'Cancelar' };

/**
 * Botones para cambiar el estado de una cita. En el detalle (`rapido` falso) se muestran los cuatro estados
 * y el actual queda deshabilitado; en la agenda (`rapido`) solo los indicados, con «Cancelar» como verbo.
 */
export function BotonesEstado({
  citaId,
  actual,
  volverA,
  botones,
  rapido = false,
  paciente,
}: {
  citaId: string;
  actual: EstadoCita;
  volverA: string;
  botones: EstadoCita[];
  rapido?: boolean;
  paciente?: string;
}) {
  const [estado, accion, pendiente] = useActionState<EstadoFormulario, FormData>(
    cambiarEstadoAccion.bind(null, citaId, volverA),
    {},
  );
  const etiquetas = rapido ? ETIQUETAS_RAPIDAS : ETIQUETAS_DETALLE;
  return (
    <form action={accion} className="space-y-2">
      {estado.mensaje && <Aviso tono="error">{estado.mensaje}</Aviso>}
      <div className="flex flex-wrap gap-2">
        {botones.map((boton) => (
          <Boton
            key={boton}
            type="submit"
            name="estado"
            value={boton}
            variante="secundario"
            className="min-h-11"
            disabled={pendiente || boton === actual}
          >
            {etiquetas[boton]}
            {paciente && <span className="sr-only"> la cita de {paciente}</span>}
          </Boton>
        ))}
      </div>
    </form>
  );
}

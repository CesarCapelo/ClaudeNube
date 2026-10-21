import type { Metadata } from 'next';
import { listarActividad } from '@/lib/datos/actividad';
import { formatearFecha, formatearHora } from '@/lib/fechas';
import { exigirAdmin } from '@/lib/sesion';

export const metadata: Metadata = { title: 'Actividad' };

const ACCIONES: Record<string, string> = {
  'paciente.crear': 'Alta de paciente',
  'paciente.editar': 'Edición de paciente',
  'paciente.eliminar': 'Eliminación de paciente',
  'paciente.exportar': 'Exportación de datos de un paciente',
  'cita.crear': 'Alta de cita',
  'cita.reprogramar': 'Cambio de fecha u hora de una cita',
  'cita.estado': 'Cambio de estado de una cita',
  'cita.eliminar': 'Eliminación de cita',
};

export default async function Actividad() {
  const admin = await exigirAdmin();
  const filas = await listarActividad(admin);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Actividad</h1>
        <p className="mt-2 text-tinta-suave">
          Últimas acciones sobre pacientes y citas (hasta 100). Solo se guardan identificadores, nunca datos
          personales.
        </p>
      </div>
      {filas.length === 0 ? (
        <div className="rounded-xl bg-superficie p-10 text-center ring-1 ring-borde">
          <p className="font-semibold">Todavía no hay actividad registrada.</p>
        </div>
      ) : (
        <div
          className="overflow-x-auto rounded-xl bg-superficie ring-1 ring-borde"
          role="region"
          aria-label="Registro de actividad"
          tabIndex={0}
        >
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Registro de actividad</caption>
            <thead className="border-b border-borde text-tinta-suave">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Fecha
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Persona
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Acción
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Registro
                </th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr key={fila.id} className="border-b border-borde last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatearFecha(fila.creadoEn)} {formatearHora(fila.creadoEn)}
                  </td>
                  <td className="px-4 py-3">{fila.usuario}</td>
                  <td className="px-4 py-3">{ACCIONES[fila.accion] ?? fila.accion}</td>
                  <td className="px-4 py-3 font-mono text-xs text-tinta-suave">
                    {fila.tipo} {fila.registroId.slice(0, 8)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Aviso } from '@/components/ui/aviso';
import { Boton } from '@/components/ui/boton';
import { obtenerCita } from '@/lib/datos/citas';
import { listarFisioterapeutas } from '@/lib/datos/profesionales';
import { fechaLocal, formatearFechaLarga, formatearHora, horaLocal } from '@/lib/fechas';
import { puede } from '@/lib/permisos';
import { exigirUsuario } from '@/lib/sesion';
import { esUuid } from '@/lib/validacion/citas';
import { eliminarCitaAccion } from '../acciones';
import { BotonesEstado } from '../botones-estado';
import { InsigniaEstado } from '../estado-cita';
import { FormularioCita } from '../formulario-cita';

export const metadata: Metadata = { title: 'Detalle de la cita' };

const AVISOS: Record<string, string> = { guardada: 'Cita guardada', actualizada: 'Cita actualizada' };

export default async function DetalleCita({ params, searchParams }: PageProps<'/citas/[id]'>) {
  const usuario = await exigirUsuario();
  const { id } = await params;
  if (!esUuid(id)) notFound();
  const cita = await obtenerCita(usuario, id);
  if (!cita) notFound();
  const { aviso } = await searchParams;
  const textoAviso = typeof aviso === 'string' ? AVISOS[aviso] : undefined;
  const activos = await listarFisioterapeutas(usuario);
  // La cita puede ser de alguien ya bloqueado: se mantiene como opción para poder cambiar solo la hora.
  const fisioterapeutas = activos.some((f) => f.id === cita.fisioterapeutaId)
    ? activos
    : [...activos, { id: cita.fisioterapeutaId, nombre: cita.fisioterapeutaNombre }];
  const fecha = fechaLocal(cita.inicio);
  const enlaceAgenda = `/agenda?${new URLSearchParams({ fecha, fisio: cita.fisioterapeutaId })}`;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href={enlaceAgenda} className="text-sm font-semibold text-marca-800 underline">
          Volver a la agenda
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Cita de {cita.pacienteNombre}</h1>
      </div>

      {textoAviso && <Aviso tono="exito">{textoAviso}</Aviso>}

      <section aria-labelledby="titulo-datos" className="rounded-xl bg-superficie p-6 ring-1 ring-borde">
        <h2 id="titulo-datos" className="mb-4 text-lg font-semibold">
          Datos de la cita
        </h2>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="font-semibold text-tinta-suave">Paciente</dt>
          <dd>
            <Link href={`/pacientes/${cita.pacienteId}`} className="font-semibold text-marca-800 underline">
              {cita.pacienteNombre}
            </Link>
            <span className="text-tinta-suave"> · {cita.pacienteTelefono}</span>
          </dd>
          <dt className="font-semibold text-tinta-suave">Fisioterapeuta</dt>
          <dd>{cita.fisioterapeutaNombre}</dd>
          <dt className="font-semibold text-tinta-suave">Fecha</dt>
          <dd className="first-letter:uppercase">{formatearFechaLarga(fecha)}</dd>
          <dt className="font-semibold text-tinta-suave">Hora</dt>
          <dd>
            {formatearHora(cita.inicio)}–{formatearHora(cita.fin)} ({cita.duracionMin} min)
          </dd>
          <dt className="font-semibold text-tinta-suave">Estado</dt>
          <dd>
            <InsigniaEstado estado={cita.estado} />
          </dd>
          <dt className="font-semibold text-tinta-suave">Motivo</dt>
          <dd className="whitespace-pre-line">{cita.motivo || 'Sin motivo indicado'}</dd>
        </dl>
      </section>

      <section aria-labelledby="titulo-estado" className="space-y-3">
        <h2 id="titulo-estado" className="text-lg font-semibold">
          Cambiar el estado
        </h2>
        <BotonesEstado
          citaId={cita.id}
          actual={cita.estado}
          volverA={`/citas/${cita.id}`}
          botones={['programada', 'realizada', 'cancelada', 'no_presentado']}
        />
      </section>

      <section aria-labelledby="titulo-reprogramar" className="space-y-3">
        <h2 id="titulo-reprogramar" className="text-lg font-semibold">
          Reprogramar
        </h2>
        <FormularioCita
          modo="reprogramar"
          citaId={cita.id}
          fisioterapeutas={fisioterapeutas}
          inicial={{
            fisioterapeutaId: cita.fisioterapeutaId,
            fecha,
            hora: horaLocal(cita.inicio),
            duracionMin: String(cita.duracionMin),
            motivo: '',
          }}
        />
      </section>

      {puede(usuario, 'citas:eliminar') && (
        <section aria-label="Eliminar la cita" className="border-t border-borde pt-6">
          <details className="rounded-xl ring-1 ring-red-200">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-peligro">
              Eliminar cita
            </summary>
            <form action={eliminarCitaAccion.bind(null, cita.id)} className="space-y-3 px-4 pb-4">
              <p className="text-sm">
                La cita se borrará de forma definitiva. Lo habitual es marcarla como cancelada para conservar
                el historial.
              </p>
              <Boton type="submit" variante="peligro">
                Eliminar definitivamente
              </Boton>
            </form>
          </details>
        </section>
      )}
    </div>
  );
}

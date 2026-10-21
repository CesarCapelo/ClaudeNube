import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Boton, EnlaceBoton } from '@/components/ui/boton';
import { citasDePaciente, contarCitas, obtener } from '@/lib/datos/pacientes';
import { formatearFecha, formatearHora } from '@/lib/fechas';
import { puede } from '@/lib/permisos';
import { exigirUsuario } from '@/lib/sesion';
import { actualizarPaciente, eliminarPaciente } from '../acciones';
import { FormularioPaciente } from '../formulario-paciente';

export const metadata: Metadata = { title: 'Ficha del paciente' };

const ESTADOS = {
  programada: 'Programada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  no_presentado: 'No presentado',
} as const;

export default async function Ficha({ params }: PageProps<'/pacientes/[id]'>) {
  const usuario = await exigirUsuario();
  const { id } = await params;
  const paciente = await obtener(usuario, id);
  if (!paciente) notFound();

  const lista = await citasDePaciente(usuario, id);
  const esAdmin = puede(usuario, 'pacientes:eliminar');
  const total = esAdmin ? await contarCitas(usuario, id) : 0;

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{paciente.nombre}</h1>
        <div className="flex flex-wrap gap-2">
          <EnlaceBoton href={`/citas/nueva?paciente=${paciente.id}`}>Nueva cita</EnlaceBoton>
          {puede(usuario, 'pacientes:exportar') && (
            <EnlaceBoton
              href={`/api/exportar/paciente/${paciente.id}`}
              variante="secundario"
              prefetch={false}
            >
              Exportar datos
            </EnlaceBoton>
          )}
        </div>
      </div>

      <section aria-labelledby="titulo-datos" className="rounded-xl bg-superficie p-6 ring-1 ring-borde">
        <h2 id="titulo-datos" className="mb-4 text-lg font-semibold">
          Datos del paciente
        </h2>
        <FormularioPaciente
          accion={actualizarPaciente.bind(null, paciente.id)}
          inicial={{
            nombre: paciente.nombre,
            telefono: paciente.telefono,
            email: paciente.email ?? '',
            fechaNacimiento: paciente.fechaNacimiento ?? '',
            notasClinicas: paciente.notasClinicas ?? '',
          }}
        />
      </section>

      <section aria-labelledby="titulo-citas">
        <h2 id="titulo-citas" className="mb-4 text-lg font-semibold">
          Citas ({lista.length})
        </h2>
        {lista.length === 0 ? (
          <p className="text-tinta-suave">Este paciente todavía no tiene citas.</p>
        ) : (
          <div
            className="overflow-x-auto rounded-xl bg-superficie ring-1 ring-borde"
            role="region"
            aria-label="Citas del paciente"
            tabIndex={0}
          >
            <table className="w-full text-left text-sm">
              <thead className="border-b border-borde text-tinta-suave">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Fecha y hora
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Fisioterapeuta
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {lista.map((c) => (
                  <tr key={c.id} className="border-b border-borde last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/citas/${c.id}`} className="font-medium text-marca-800 underline">
                        {formatearFecha(c.inicio)} {formatearHora(c.inicio)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{c.fisioterapeuta}</td>
                    <td className="px-4 py-3">{ESTADOS[c.estado]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {esAdmin && (
        <section aria-labelledby="titulo-eliminar" className="rounded-xl ring-1 ring-borde">
          <details className="p-4">
            <summary id="titulo-eliminar" className="cursor-pointer font-semibold text-peligro">
              Eliminar paciente
            </summary>
            <form action={eliminarPaciente.bind(null, paciente.id)} className="mt-4 space-y-4">
              <p className="text-sm">
                Se eliminarán el paciente y {total === 1 ? 'su única cita' : `sus ${total} citas`}. Esta
                acción no se puede deshacer.
              </p>
              <Boton type="submit" variante="peligro">
                Confirmar eliminación
              </Boton>
            </form>
          </details>
        </section>
      )}
    </div>
  );
}

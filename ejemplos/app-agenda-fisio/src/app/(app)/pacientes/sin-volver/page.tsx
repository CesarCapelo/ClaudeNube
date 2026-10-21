import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sinVolver } from '@/lib/datos/pacientes';
import { formatearFecha } from '@/lib/fechas';
import { puede } from '@/lib/permisos';
import { exigirUsuario } from '@/lib/sesion';

export const metadata: Metadata = { title: 'Pacientes sin volver' };

export default async function SinVolver({ searchParams }: PageProps<'/pacientes/sin-volver'>) {
  const usuario = await exigirUsuario();
  if (!puede(usuario, 'pacientes:sin-volver')) redirect('/prohibido');
  const { pagina: crudo } = await searchParams;
  const pagina = Number.parseInt(typeof crudo === 'string' ? crudo : '', 10) || 1;
  const { filas, total, paginas, pagina: actual } = await sinVolver(usuario, { pagina });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Pacientes sin volver</h1>
      <p className="max-w-2xl text-tinta-suave">
        Pacientes sin cita programada cuya última cita realizada (o su alta, si nunca vinieron) fue hace más
        de 60 días.
      </p>

      {filas.length === 0 ? (
        <p className="rounded-xl bg-superficie p-6 ring-1 ring-borde">
          Nadie lleva más de 60 días sin volver.
        </p>
      ) : (
        <>
          <p className="text-sm text-tinta-suave">
            {total} {total === 1 ? 'paciente' : 'pacientes'}
          </p>
          <div
            className="overflow-x-auto rounded-xl bg-superficie ring-1 ring-borde"
            role="region"
            aria-label="Pacientes sin volver"
            tabIndex={0}
          >
            <table className="w-full text-left text-sm">
              <thead className="border-b border-borde text-tinta-suave">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Nombre
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Teléfono
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Última cita realizada
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Días sin volver
                  </th>
                </tr>
              </thead>
              <tbody>
                {filas.map((p) => (
                  <tr key={p.id} className="border-b border-borde last:border-0">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/pacientes/${p.id}`} className="text-marca-800 underline">
                        {p.nombre}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`tel:${p.telefono.replace(/[^\d+]/g, '')}`}
                        className="text-marca-800 underline"
                      >
                        {p.telefono}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      {p.ultimaRealizada
                        ? formatearFecha(p.ultimaRealizada)
                        : `Sin citas realizadas (alta el ${formatearFecha(p.creadoEn)})`}
                    </td>
                    <td className="px-4 py-3">{p.dias}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {paginas > 1 && (
            <nav aria-label="Paginación" className="flex items-center gap-4 text-sm">
              {actual > 1 && (
                <Link
                  href={`/pacientes/sin-volver?pagina=${actual - 1}`}
                  className="font-semibold text-marca-800 underline"
                >
                  Anterior
                </Link>
              )}
              <span>
                Página {actual} de {paginas}
              </span>
              {actual < paginas && (
                <Link
                  href={`/pacientes/sin-volver?pagina=${actual + 1}`}
                  className="font-semibold text-marca-800 underline"
                >
                  Siguiente
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

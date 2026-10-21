import type { Metadata } from 'next';
import Link from 'next/link';
import { Aviso } from '@/components/ui/aviso';
import { Boton, EnlaceBoton } from '@/components/ui/boton';
import { listar } from '@/lib/datos/pacientes';
import { exigirUsuario } from '@/lib/sesion';

export const metadata: Metadata = { title: 'Pacientes' };

const AVISOS: Record<string, string> = { guardado: 'Paciente guardado', eliminado: 'Paciente eliminado' };

export default async function Pacientes({ searchParams }: PageProps<'/pacientes'>) {
  const usuario = await exigirUsuario();
  const params = await searchParams;
  const texto = (v: string | string[] | undefined) => (typeof v === 'string' ? v : '');
  const busqueda = texto(params.q).slice(0, 120);
  const pagina = Number.parseInt(texto(params.pagina), 10) || 1;
  const aviso = AVISOS[texto(params.aviso)];

  const { filas, total, paginas, pagina: actual } = await listar(usuario, { busqueda, pagina });
  const enlace = (p: number) => {
    const qs = new URLSearchParams();
    if (busqueda) qs.set('q', busqueda);
    if (p > 1) qs.set('pagina', String(p));
    const s = qs.toString();
    return s ? `/pacientes?${s}` : '/pacientes';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Pacientes</h1>
        <EnlaceBoton href="/pacientes/nuevo">Nuevo paciente</EnlaceBoton>
      </div>

      {aviso && <Aviso tono="exito">{aviso}</Aviso>}

      <form action="/pacientes" method="get" role="search" className="flex max-w-xl gap-2">
        <label htmlFor="buscar" className="sr-only">
          Buscar por nombre o teléfono
        </label>
        <input
          id="buscar"
          name="q"
          type="search"
          defaultValue={busqueda}
          placeholder="Buscar por nombre o teléfono"
          className="block min-h-10 w-full rounded-lg border border-tinta-suave/60 bg-white px-3 py-2 text-base focus:border-marca-500 focus:ring-2 focus:ring-marca-200 focus:outline-none"
        />
        <Boton type="submit" variante="secundario">
          Buscar
        </Boton>
      </form>

      {filas.length === 0 ? (
        <div className="max-w-xl space-y-4 rounded-xl bg-superficie p-6 ring-1 ring-borde">
          <p>{busqueda ? 'Ningún paciente coincide con la búsqueda.' : 'Todavía no hay pacientes.'}</p>
          <EnlaceBoton href="/pacientes/nuevo">Nuevo paciente</EnlaceBoton>
        </div>
      ) : (
        <>
          <p className="text-sm text-tinta-suave">
            {total} {total === 1 ? 'paciente' : 'pacientes'}
          </p>
          <div
            className="overflow-x-auto rounded-xl bg-superficie ring-1 ring-borde"
            role="region"
            aria-label="Listado de pacientes"
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
                    Correo
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
                    <td className="px-4 py-3">{p.telefono}</td>
                    <td className="px-4 py-3">{p.email ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {paginas > 1 && (
            <nav aria-label="Paginación" className="flex items-center gap-4 text-sm">
              {actual > 1 && (
                <Link href={enlace(actual - 1)} className="font-semibold text-marca-800 underline">
                  Anterior
                </Link>
              )}
              <span>
                Página {actual} de {paginas}
              </span>
              {actual < paginas && (
                <Link href={enlace(actual + 1)} className="font-semibold text-marca-800 underline">
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

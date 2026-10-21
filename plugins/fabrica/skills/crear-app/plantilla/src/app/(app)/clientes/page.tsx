import type { Metadata } from 'next';
import Link from 'next/link';
import { exigirUsuario } from '@/lib/sesion';
import { listarClientes } from '@/lib/datos/clientes';
import { Aviso } from '@/components/ui/aviso';
import { Boton, EnlaceBoton } from '@/components/ui/boton';

export const metadata: Metadata = { title: 'Clientes' };

const avisos: Record<string, string> = {
  guardado: 'Cliente guardado.',
  eliminado: 'Cliente eliminado.',
};

export default async function Clientes({ searchParams }: PageProps<'/clientes'>) {
  await exigirUsuario();
  const parametros = await searchParams;
  const busqueda = typeof parametros.q === 'string' ? parametros.q : '';
  const pagina = Math.max(1, Number(parametros.pagina) || 1);
  const aviso = typeof parametros.aviso === 'string' ? avisos[parametros.aviso] : undefined;
  const { filas, total, paginas } = await listarClientes({ busqueda, pagina });

  const enlacePagina = (numero: number) =>
    `/clientes?${new URLSearchParams({ ...(busqueda && { q: busqueda }), pagina: String(numero) })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <EnlaceBoton href="/clientes/nuevo">Añadir cliente</EnlaceBoton>
      </div>

      {aviso && <Aviso tono="exito">{aviso}</Aviso>}

      <form role="search" className="flex max-w-md gap-2">
        <label htmlFor="busqueda" className="sr-only">
          Buscar clientes
        </label>
        <input
          id="busqueda"
          name="q"
          type="search"
          defaultValue={busqueda}
          placeholder="Nombre, correo o teléfono"
          className="block w-full rounded-lg border border-borde bg-superficie px-3 py-2 focus:border-marca-500 focus:ring-2 focus:ring-marca-200 focus:outline-none"
        />
        <Boton type="submit" variante="secundario">
          Buscar
        </Boton>
      </form>

      {filas.length === 0 ? (
        <div className="rounded-xl bg-superficie p-10 text-center ring-1 ring-borde">
          <p className="font-semibold">
            {busqueda ? 'No hay resultados para esa búsqueda.' : 'Todavía no hay clientes.'}
          </p>
          {!busqueda && <p className="mt-1 text-tinta-suave">Añade el primero para empezar.</p>}
        </div>
      ) : (
        <div
          className="overflow-x-auto rounded-xl bg-superficie ring-1 ring-borde"
          role="region"
          aria-label="Listado de clientes"
          tabIndex={0}
        >
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Listado de clientes ({total})</caption>
            <thead className="border-b border-borde text-tinta-suave">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Nombre
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Correo
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Teléfono
                </th>
              </tr>
            </thead>
            <tbody>
              {filas.map((cliente) => (
                <tr key={cliente.id} className="border-b border-borde last:border-0 hover:bg-fondo">
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/clientes/${cliente.id}`}
                      className="text-marca-700 underline-offset-2 hover:underline"
                    >
                      {cliente.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{cliente.email ?? '—'}</td>
                  <td className="px-4 py-3">{cliente.telefono ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {paginas > 1 && (
        <nav aria-label="Paginación" className="flex items-center gap-3 text-sm">
          {pagina > 1 && (
            <Link href={enlacePagina(pagina - 1)} className="text-marca-700 underline">
              Anterior
            </Link>
          )}
          <span>
            Página {pagina} de {paginas}
          </span>
          {pagina < paginas && (
            <Link href={enlacePagina(pagina + 1)} className="text-marca-700 underline">
              Siguiente
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

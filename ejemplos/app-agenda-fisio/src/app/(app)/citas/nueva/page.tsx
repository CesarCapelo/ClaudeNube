import type { Metadata } from 'next';
import Link from 'next/link';
import { Aviso } from '@/components/ui/aviso';
import { Boton, EnlaceBoton } from '@/components/ui/boton';
import { buscarPacientes, obtenerPacienteParaCita } from '@/lib/datos/citas';
import { listarFisioterapeutas } from '@/lib/datos/profesionales';
import { esFechaValida, hoy } from '@/lib/fechas';
import { exigirUsuario } from '@/lib/sesion';
import { FormularioCita } from '../formulario-cita';

export const metadata: Metadata = { title: 'Nueva cita' };

const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function NuevaCita({ searchParams }: PageProps<'/citas/nueva'>) {
  const usuario = await exigirUsuario();
  const parametros = await searchParams;
  const q = (uno(parametros.q) ?? '').trim();
  const idPaciente = uno(parametros.paciente);
  const fisioterapeutas = await listarFisioterapeutas(usuario);
  const fisioParam = uno(parametros.fisio);
  const fisioInicial =
    fisioterapeutas.find((f) => f.id === fisioParam)?.id ??
    fisioterapeutas.find((f) => f.id === usuario.id)?.id ??
    fisioterapeutas[0]?.id ??
    '';
  const fechaParam = uno(parametros.fecha);
  const fecha = fechaParam && esFechaValida(fechaParam) ? fechaParam : hoy();

  const paciente = idPaciente ? await obtenerPacienteParaCita(usuario, idPaciente) : null;
  const resultados = !paciente && q ? await buscarPacientes(usuario, q) : [];

  // Se conservan fecha y fisioterapeuta al elegir o cambiar de paciente.
  const conservar = new URLSearchParams();
  if (fechaParam && esFechaValida(fechaParam)) conservar.set('fecha', fechaParam);
  if (fisioParam && fisioterapeutas.some((f) => f.id === fisioParam)) conservar.set('fisio', fisioParam);
  const enlaceCambiar = `/citas/nueva${conservar.size ? `?${conservar}` : ''}`;
  const enlaceElegir = (id: string) => {
    const p = new URLSearchParams(conservar);
    p.set('paciente', id);
    return `/citas/nueva?${p}`;
  };

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-3xl font-bold">Nueva cita</h1>

      <section aria-labelledby="titulo-paciente" className="space-y-4">
        <h2 id="titulo-paciente" className="text-lg font-semibold">
          Paciente
        </h2>
        {idPaciente && !paciente && <Aviso tono="error">El paciente elegido no existe. Busca otro.</Aviso>}
        {paciente ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-superficie p-4 ring-1 ring-borde">
            <p>
              <span className="font-semibold">{paciente.nombre}</span>
              <span className="text-tinta-suave"> · {paciente.telefono}</span>
            </p>
            <EnlaceBoton href={enlaceCambiar} variante="secundario">
              Cambiar paciente
            </EnlaceBoton>
          </div>
        ) : (
          <>
            <form
              action="/citas/nueva"
              method="get"
              role="search"
              aria-label="Buscar paciente"
              className="space-y-3"
            >
              {[...conservar].map(([nombre, valor]) => (
                <input key={nombre} type="hidden" name={nombre} value={valor} />
              ))}
              <div>
                <label htmlFor="campo-q" className="block text-sm font-semibold">
                  Buscar paciente por nombre o teléfono
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    id="campo-q"
                    name="q"
                    type="search"
                    defaultValue={q}
                    autoComplete="off"
                    className="block w-full rounded-lg border border-tinta-suave/60 bg-white px-3 py-2 text-base focus:border-marca-500 focus:ring-2 focus:ring-marca-200 focus:outline-none"
                  />
                  <Boton type="submit" className="min-h-11">
                    Buscar
                  </Boton>
                </div>
              </div>
            </form>

            {q && (
              <div aria-live="polite">
                {resultados.length > 0 ? (
                  <ul
                    aria-label="Resultados de la búsqueda"
                    className="divide-y divide-borde rounded-xl ring-1 ring-borde"
                  >
                    {resultados.map((p) => (
                      <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                        <span>
                          <span className="font-semibold">{p.nombre}</span>
                          <span className="text-tinta-suave"> · {p.telefono}</span>
                        </span>
                        <EnlaceBoton href={enlaceElegir(p.id)} variante="secundario" className="min-h-11">
                          Elegir<span className="sr-only"> a {p.nombre}</span>
                        </EnlaceBoton>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-tinta-suave">No hay pacientes que coincidan con «{q}».</p>
                )}
              </div>
            )}
            <p className="text-sm">
              ¿No está en la lista?{' '}
              <Link href="/pacientes/nuevo?siguiente=cita" className="font-semibold text-marca-800 underline">
                Nuevo paciente
              </Link>
            </p>
          </>
        )}
      </section>

      {paciente && (
        <section aria-labelledby="titulo-datos" className="space-y-4">
          <h2 id="titulo-datos" className="text-lg font-semibold">
            Datos de la cita
          </h2>
          {fisioterapeutas.length === 0 ? (
            <Aviso tono="error">
              No hay fisioterapeutas activos. Pide a la administración que marque una cuenta como «Atiende
              citas».
            </Aviso>
          ) : (
            <FormularioCita
              modo="crear"
              pacienteId={paciente.id}
              fisioterapeutas={fisioterapeutas}
              inicial={{ fisioterapeutaId: fisioInicial, fecha, hora: '', duracionMin: '50', motivo: '' }}
            />
          )}
        </section>
      )}
    </div>
  );
}

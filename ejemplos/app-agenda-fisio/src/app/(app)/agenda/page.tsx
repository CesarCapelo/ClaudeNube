import type { Metadata } from 'next';
import Link from 'next/link';
import { Aviso } from '@/components/ui/aviso';
import { Boton, EnlaceBoton } from '@/components/ui/boton';
import { listarCitasDeRango } from '@/lib/datos/citas';
import { listarFisioterapeutas } from '@/lib/datos/profesionales';
import {
  esFechaValida,
  fechaLocal,
  formatearFechaCorta,
  formatearFechaLarga,
  hoy,
  lunesDe,
  rangoDias,
  sumarDias,
} from '@/lib/fechas';
import { exigirUsuario } from '@/lib/sesion';
import { TarjetaCita, type CitaAgenda } from './tarjeta-cita';

export const metadata: Metadata = { title: 'Agenda' };

const AVISOS: Record<string, string> = {
  guardada: 'Cita guardada',
  actualizada: 'Cita actualizada',
  eliminada: 'Cita eliminada',
};

const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

type Parametros = { vista: 'dia' | 'semana'; fecha: string; fisio: string };
const url = (p: Parametros, cambios: Partial<Parametros> & { aviso?: string } = {}) =>
  `/agenda?${new URLSearchParams({ ...p, ...cambios })}`;

export default async function Agenda({ searchParams }: PageProps<'/agenda'>) {
  const usuario = await exigirUsuario();
  const parametros = await searchParams;
  const ahora = new Date();
  const fisioterapeutas = await listarFisioterapeutas(usuario);
  const aviso = uno(parametros.aviso);
  const textoAviso = aviso ? AVISOS[aviso] : undefined;

  if (fisioterapeutas.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Agenda</h1>
        <Aviso tono="info">
          No hay fisioterapeutas activos. Pide a la administración que marque una cuenta como «Atiende citas»
          en Usuarios.
        </Aviso>
      </div>
    );
  }

  const fechaParam = uno(parametros.fecha);
  const fisioParam = uno(parametros.fisio);
  const p: Parametros = {
    vista: uno(parametros.vista) === 'semana' ? 'semana' : 'dia',
    fecha: fechaParam && esFechaValida(fechaParam) ? fechaParam : hoy(ahora),
    fisio:
      fisioterapeutas.find((f) => f.id === fisioParam)?.id ??
      fisioterapeutas.find((f) => f.id === usuario.id)?.id ??
      fisioterapeutas[0].id,
  };
  const fisioActual = fisioterapeutas.find((f) => f.id === p.fisio)!;
  const pasoDias = p.vista === 'semana' ? 7 : 1;
  const primerDia = p.vista === 'semana' ? lunesDe(p.fecha) : p.fecha;
  const diasMostrados = Array.from({ length: pasoDias }, (_, i) => sumarDias(primerDia, i));
  const { inicio, fin } = rangoDias(primerDia, pasoDias);
  const filas = await listarCitasDeRango(usuario, { fisioterapeutaId: p.fisio, desde: inicio, hasta: fin });

  const porDia = new Map<string, CitaAgenda[]>(diasMostrados.map((d) => [d, []]));
  for (const f of filas) porDia.get(fechaLocal(f.inicio))?.push(f);

  const hoyTexto = hoy(ahora);
  const enlaceNueva = `/citas/nueva?${new URLSearchParams({ fecha: p.fecha, fisio: p.fisio })}`;
  const titulo =
    p.vista === 'semana'
      ? `Semana del ${formatearFechaCorta(primerDia)} al ${formatearFechaCorta(sumarDias(primerDia, 6))}`
      : formatearFechaLarga(p.fecha);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Agenda</h1>
        <EnlaceBoton href={enlaceNueva}>Nueva cita</EnlaceBoton>
      </div>

      {textoAviso && <Aviso tono="exito">{textoAviso}</Aviso>}

      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <nav aria-label="Navegación de la agenda" className="flex gap-2">
          <EnlaceBoton
            href={url(p, { fecha: sumarDias(p.fecha, -pasoDias) })}
            variante="secundario"
            className="min-h-11"
          >
            Anterior
          </EnlaceBoton>
          <EnlaceBoton href={url(p, { fecha: hoyTexto })} variante="secundario" className="min-h-11">
            Hoy
          </EnlaceBoton>
          <EnlaceBoton
            href={url(p, { fecha: sumarDias(p.fecha, pasoDias) })}
            variante="secundario"
            className="min-h-11"
          >
            Siguiente
          </EnlaceBoton>
        </nav>

        <nav
          aria-label="Vista de la agenda"
          className="flex gap-1 rounded-lg bg-superficie p-1 ring-1 ring-borde"
        >
          {(['dia', 'semana'] as const).map((vista) => (
            <Link
              key={vista}
              href={url(p, { vista })}
              aria-current={p.vista === vista ? 'page' : undefined}
              className="inline-flex min-h-11 items-center rounded-md px-4 text-sm font-semibold text-tinta-suave hover:bg-marca-50 aria-[current=page]:bg-marca-700 aria-[current=page]:text-white"
            >
              {vista === 'dia' ? 'Día' : 'Semana'}
            </Link>
          ))}
        </nav>

        <form action="/agenda" method="get" className="flex items-end gap-2">
          <input type="hidden" name="vista" value={p.vista} />
          <input type="hidden" name="fecha" value={p.fecha} />
          <div>
            <label htmlFor="campo-fisio" className="block text-sm font-semibold">
              Fisioterapeuta
            </label>
            <select
              id="campo-fisio"
              name="fisio"
              defaultValue={p.fisio}
              className="mt-1.5 block min-h-11 rounded-lg border border-tinta-suave/60 bg-white px-3 py-2 text-base"
            >
              {fisioterapeutas.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nombre}
                </option>
              ))}
            </select>
          </div>
          <Boton type="submit" variante="secundario" className="min-h-11">
            Ver agenda
          </Boton>
        </form>
      </div>

      <h2 className="text-xl font-semibold first-letter:uppercase">
        {titulo}
        <span className="sr-only"> · agenda de {fisioActual.nombre}</span>
      </h2>

      {p.vista === 'dia' ? (
        <section aria-label={`Citas del día ${formatearFechaLarga(p.fecha)}`}>
          {filas.length === 0 ? (
            <div className="rounded-xl bg-superficie p-6 text-center ring-1 ring-borde">
              <p className="font-semibold">Sin citas este día</p>
              <p className="mt-3">
                <EnlaceBoton href={enlaceNueva}>Nueva cita</EnlaceBoton>
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filas.map((cita) => (
                <TarjetaCita key={cita.id} cita={cita} ahora={ahora} volverA={url(p)} />
              ))}
            </ul>
          )}
        </section>
      ) : (
        <div className="grid gap-4 xl:grid-cols-7">
          {diasMostrados.map((dia) => {
            const citasDelDia = porDia.get(dia) ?? [];
            const esHoy = dia === hoyTexto;
            return (
              <section
                key={dia}
                aria-labelledby={`dia-${dia}`}
                className={`min-w-0 rounded-xl p-3 ring-1 ${esHoy ? 'bg-marca-50 ring-marca-400' : 'bg-superficie ring-borde'}`}
              >
                <h3 id={`dia-${dia}`} className="mb-2 text-sm font-semibold first-letter:uppercase">
                  <Link href={url(p, { vista: 'dia', fecha: dia })} className="underline">
                    {formatearFechaCorta(dia)}
                  </Link>
                  {esHoy && <span> (hoy)</span>}
                </h3>
                {citasDelDia.length === 0 ? (
                  <p className="text-sm text-tinta-suave">Sin citas</p>
                ) : (
                  <ul className="space-y-2">
                    {citasDelDia.map((cita) => (
                      <TarjetaCita key={cita.id} cita={cita} ahora={ahora} volverA={url(p)} compacta />
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

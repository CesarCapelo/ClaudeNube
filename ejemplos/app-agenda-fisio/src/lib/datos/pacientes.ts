import 'server-only';
import { and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { citas, pacientes, user } from '@/lib/db/esquema';
import { exigirPermiso, type UsuarioPermisos } from '@/lib/permisos';
import { diasEntre, fechaLocal, hoy, instanteDesdeLocal, sumarDias } from '@/lib/fechas';
import { registrar } from '@/lib/datos/actividad';
import { esUuid, type DatosPaciente } from '@/lib/validacion/pacientes';

export const POR_PAGINA = 20;
const DIA_MS = 86_400_000;

type Usuario = UsuarioPermisos;

/** Escapa los comodines de LIKE para tratarlos como texto. */
export const escaparLike = (texto: string) => texto.replace(/[\\%_]/g, '\\$&');

const paginaValida = (p: number | undefined) => (p && Number.isInteger(p) && p > 0 ? p : 1);

/** Listado paginado. No selecciona las notas clínicas. */
export async function listar(usuario: Usuario, opciones: { busqueda?: string; pagina?: number } = {}) {
  exigirPermiso(usuario, 'pacientes:ver');
  const pagina = paginaValida(opciones.pagina);
  const q = opciones.busqueda?.trim();
  const patron = q ? `%${escaparLike(q)}%` : null;
  const filtro = patron ? or(ilike(pacientes.nombre, patron), ilike(pacientes.telefono, patron)) : undefined;
  const [{ total }] = await db.select({ total: count() }).from(pacientes).where(filtro);
  const filas = await db
    .select({
      id: pacientes.id,
      nombre: pacientes.nombre,
      telefono: pacientes.telefono,
      email: pacientes.email,
    })
    .from(pacientes)
    .where(filtro)
    .orderBy(asc(pacientes.nombre), asc(pacientes.id))
    .limit(POR_PAGINA)
    .offset((pagina - 1) * POR_PAGINA);
  return { filas, total, pagina, paginas: Math.max(1, Math.ceil(total / POR_PAGINA)) };
}

/** Un paciente con sus notas clínicas; null si el id no es válido o no existe. */
export async function obtener(usuario: Usuario, id: string) {
  exigirPermiso(usuario, 'pacientes:ver');
  if (!esUuid(id)) return null;
  const [fila] = await db.select().from(pacientes).where(eq(pacientes.id, id)).limit(1);
  return fila ?? null;
}

export async function crear(usuario: Usuario & { id: string }, datos: DatosPaciente) {
  exigirPermiso(usuario, 'pacientes:editar');
  return db.transaction(async (tx) => {
    const [fila] = await tx
      .insert(pacientes)
      .values({ ...datos, creadoPor: usuario.id })
      .returning({ id: pacientes.id });
    await registrar(usuario, 'paciente.crear', 'paciente', fila.id, tx);
    return fila.id;
  });
}

/** Devuelve false si el paciente no existe. */
export async function actualizar(usuario: Usuario & { id: string }, id: string, datos: DatosPaciente) {
  exigirPermiso(usuario, 'pacientes:editar');
  if (!esUuid(id)) return false;
  return db.transaction(async (tx) => {
    const filas = await tx
      .update(pacientes)
      .set(datos)
      .where(eq(pacientes.id, id))
      .returning({ id: pacientes.id });
    if (!filas.length) return false;
    await registrar(usuario, 'paciente.editar', 'paciente', id, tx);
    return true;
  });
}

export async function contarCitas(usuario: Usuario, pacienteId: string) {
  exigirPermiso(usuario, 'citas:ver');
  if (!esUuid(pacienteId)) return 0;
  const [{ total }] = await db.select({ total: count() }).from(citas).where(eq(citas.pacienteId, pacienteId));
  return total;
}

/** Elimina el paciente y, por cascada del esquema, sus citas. Devuelve false si no existe. */
export async function eliminar(usuario: Usuario & { id: string }, id: string) {
  exigirPermiso(usuario, 'pacientes:eliminar');
  if (!esUuid(id)) return false;
  return db.transaction(async (tx) => {
    const filas = await tx.delete(pacientes).where(eq(pacientes.id, id)).returning({ id: pacientes.id });
    if (!filas.length) return false;
    await registrar(usuario, 'paciente.eliminar', 'paciente', id, tx);
    return true;
  });
}

/** Citas de un paciente, más recientes primero, sin el motivo. */
export async function citasDePaciente(usuario: Usuario, pacienteId: string) {
  exigirPermiso(usuario, 'citas:ver');
  if (!esUuid(pacienteId)) return [];
  return db
    .select({
      id: citas.id,
      inicio: citas.inicio,
      duracionMin: citas.duracionMin,
      estado: citas.estado,
      fisioterapeuta: user.name,
    })
    .from(citas)
    .innerJoin(user, eq(user.id, citas.fisioterapeutaId))
    .where(eq(citas.pacienteId, pacienteId))
    .orderBy(desc(citas.inicio));
}

/** Datos completos para exportar (incluye notas y motivos). Registra la exportación. */
export async function exportar(usuario: Usuario & { id: string }, id: string) {
  exigirPermiso(usuario, 'pacientes:exportar');
  if (!esUuid(id)) return null;
  return db.transaction(async (tx) => {
    const [paciente] = await tx.select().from(pacientes).where(eq(pacientes.id, id)).limit(1);
    if (!paciente) return null;
    const lista = await tx
      .select({
        inicio: citas.inicio,
        duracionMin: citas.duracionMin,
        estado: citas.estado,
        motivo: citas.motivo,
        fisioterapeuta: user.name,
      })
      .from(citas)
      .innerJoin(user, eq(user.id, citas.fisioterapeutaId))
      .where(eq(citas.pacienteId, id))
      .orderBy(asc(citas.inicio));
    await registrar(usuario, 'paciente.exportar', 'paciente', id, tx);
    return { paciente, citas: lista };
  });
}

/**
 * RN5: pacientes sin cita programada futura cuya referencia (última cita realizada o fecha de alta)
 * es anterior a `ahora` menos 60 días exactos. Orden: referencia ascendente.
 */
export async function sinVolver(usuario: Usuario, opciones: { pagina?: number; ahora?: Date } = {}) {
  exigirPermiso(usuario, 'pacientes:sin-volver');
  const ahora = opciones.ahora ?? new Date();
  const pagina = paginaValida(opciones.pagina);
  // «Más de 60 días» en días de calendario de Madrid: la referencia debe ser anterior a las 00:00 locales
  // de hoy menos 60 días (así, 60 días exactos no cuentan y el cambio de hora no desplaza el límite).
  const hoyLocal = hoy(ahora);
  const limite =
    instanteDesdeLocal(sumarDias(hoyLocal, -60), '00:00') ?? new Date(ahora.getTime() - 60 * DIA_MS);
  const ts = (d: Date) => sql`${d.toISOString()}::timestamptz`;

  const ultimaRealizada = sql<Date | null>`(select max(c.inicio) from citas c where c.paciente_id = pacientes.id and c.estado = 'realizada')`;
  const referencia = sql`coalesce(${ultimaRealizada}, pacientes.creado_en)`;
  const filtro = and(
    sql`not exists (select 1 from citas c where c.paciente_id = pacientes.id and c.estado = 'programada' and c.inicio > ${ts(ahora)})`,
    sql`${referencia} < ${ts(limite)}`,
  );

  const [{ total }] = await db.select({ total: count() }).from(pacientes).where(filtro);
  const filas = await db
    .select({
      id: pacientes.id,
      nombre: pacientes.nombre,
      telefono: pacientes.telefono,
      creadoEn: pacientes.creadoEn,
      ultimaRealizada: ultimaRealizada.mapWith((v) => (v ? new Date(v as string | Date) : null)),
    })
    .from(pacientes)
    .where(filtro)
    .orderBy(asc(referencia), asc(pacientes.id))
    .limit(POR_PAGINA)
    .offset((pagina - 1) * POR_PAGINA);

  return {
    filas: filas.map((f) => {
      const ref = f.ultimaRealizada ?? f.creadoEn;
      return { ...f, dias: diasEntre(fechaLocal(ref), hoyLocal) };
    }),
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
  };
}

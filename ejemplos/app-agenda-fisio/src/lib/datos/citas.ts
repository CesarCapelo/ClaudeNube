import 'server-only';
import { and, asc, eq, gt, gte, ilike, inArray, lt, ne, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { citas, pacientes, user, type EstadoCita } from '@/lib/db/esquema';
import { exigirPermiso, type UsuarioPermisos } from '@/lib/permisos';
import { formatearHora } from '@/lib/fechas';
import { esUuid } from '@/lib/validacion/citas';
import { registrar } from './actividad';
import { ErrorNegocio } from './errores';
import { esFisioterapeutaActivo } from './profesionales';

// Capa de datos de citas. RN1 (sin solapes) se garantiza con una transacción que toma un bloqueo
// por fisioterapeuta (`pg_advisory_xact_lock`), comprueba el solape y solo entonces escribe.

/** Error de negocio asociado a un campo del formulario (para mostrarlo junto al campo). */
export class ErrorCampoCita extends ErrorNegocio {
  constructor(
    public campo: 'pacienteId' | 'fisioterapeutaId' | 'hora' | 'fecha',
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ErrorCampoCita';
  }
}

type Transaccion = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type DatosCita = {
  pacienteId: string;
  fisioterapeutaId: string;
  inicio: Date;
  duracionMin: number;
  motivo?: string | null;
};
export type DatosHorario = Pick<DatosCita, 'fisioterapeutaId' | 'inicio' | 'duracionMin'>;

const MENSAJE_RN2 = 'Solo se puede marcar así una cita que ya ha empezado.';
const ESTADOS_QUE_BLOQUEAN: EstadoCita[] = ['programada', 'realizada'];
const MIN = 60_000;
const DURACION_MAXIMA_MIN = 180;

async function bloquearFisioterapeuta(tx: Transaccion, fisioterapeutaId: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${fisioterapeutaId}))`);
}

/** RN1: lanza ErrorNegocio si el fisioterapeuta ya tiene una cita programada o realizada en la franja. */
async function comprobarSolape(tx: Transaccion, h: DatosHorario, excluirId?: string) {
  const fin = new Date(h.inicio.getTime() + h.duracionMin * MIN);
  const [choque] = await tx
    .select({ inicio: citas.inicio, fin: citas.fin })
    .from(citas)
    .where(
      and(
        eq(citas.fisioterapeutaId, h.fisioterapeutaId),
        inArray(citas.estado, ESTADOS_QUE_BLOQUEAN),
        // Acota el índice (fisioterapeuta, inicio): ninguna cita dura más de DURACION_MAXIMA_MIN.
        gte(citas.inicio, new Date(h.inicio.getTime() - DURACION_MAXIMA_MIN * MIN)),
        lt(citas.inicio, fin),
        gt(citas.fin, h.inicio),
        excluirId ? ne(citas.id, excluirId) : undefined,
      ),
    )
    .orderBy(asc(citas.inicio))
    .limit(1);
  if (choque) {
    throw new ErrorNegocio(
      `Ese fisioterapeuta ya tiene una cita de ${formatearHora(choque.inicio)} a ${formatearHora(choque.fin)}`,
    );
  }
}

async function exigirFisioterapeuta(id: string, ejecutor: Pick<Transaccion, 'select'> = db) {
  if (!(await esFisioterapeutaActivo(id, ejecutor))) {
    throw new ErrorCampoCita('fisioterapeutaId', 'Elige un fisioterapeuta que atienda citas.');
  }
}

function validarHorario(h: DatosHorario) {
  if (!Number.isInteger(h.duracionMin) || h.duracionMin < 10 || h.duracionMin > DURACION_MAXIMA_MIN) {
    throw new ErrorNegocio('La duración debe estar entre 10 y 180 minutos.');
  }
  if (Number.isNaN(h.inicio.getTime())) throw new ErrorCampoCita('fecha', 'Escribe una fecha válida.');
}

export async function crearCita(usuario: UsuarioPermisos, datos: DatosCita) {
  exigirPermiso(usuario, 'citas:editar');
  validarHorario(datos);
  await exigirFisioterapeuta(datos.fisioterapeutaId);
  const fin = new Date(datos.inicio.getTime() + datos.duracionMin * MIN);
  return db.transaction(async (tx) => {
    const [paciente] = esUuid(datos.pacienteId)
      ? await tx
          .select({ id: pacientes.id })
          .from(pacientes)
          .where(eq(pacientes.id, datos.pacienteId))
          .limit(1)
      : [];
    if (!paciente) throw new ErrorCampoCita('pacienteId', 'El paciente no existe.');
    await bloquearFisioterapeuta(tx, datos.fisioterapeutaId);
    await comprobarSolape(tx, datos);
    const [cita] = await tx
      .insert(citas)
      .values({
        pacienteId: datos.pacienteId,
        fisioterapeutaId: datos.fisioterapeutaId,
        inicio: datos.inicio,
        fin,
        duracionMin: datos.duracionMin,
        motivo: datos.motivo || null,
        creadoPor: usuario.id,
      })
      .returning({ id: citas.id });
    await registrar(usuario, 'cita.crear', 'cita', cita.id, tx);
    return cita.id;
  });
}

/**
 * Lee la cita tras bloquear a su fisioterapeuta (y al de destino si cambia). Los bloqueos se toman siempre
 * en orden de id para que dos reprogramaciones cruzadas (A→B y B→A) no se bloqueen entre sí.
 */
async function leerCitaBloqueada(tx: Transaccion, id: string, destinoId?: string) {
  if (!esUuid(id)) throw new ErrorNegocio('La cita no existe.');
  const [previa] = await tx.select().from(citas).where(eq(citas.id, id)).limit(1);
  if (!previa) throw new ErrorNegocio('La cita no existe.');
  const ids = [...new Set([previa.fisioterapeutaId, destinoId ?? previa.fisioterapeutaId])].sort();
  for (const fisio of ids) await bloquearFisioterapeuta(tx, fisio);
  const [cita] = await tx.select().from(citas).where(eq(citas.id, id)).limit(1);
  if (!cita || cita.fisioterapeutaId !== previa.fisioterapeutaId) {
    throw new ErrorNegocio('La cita ha cambiado mientras se guardaba. Inténtalo de nuevo.');
  }
  return cita;
}

/** Cambia fecha, hora, duración o fisioterapeuta aplicando RN1 (y RN2 si la cita ya está marcada). */
export async function reprogramarCita(
  usuario: UsuarioPermisos,
  id: string,
  datos: DatosHorario,
  ahora: Date = new Date(),
) {
  exigirPermiso(usuario, 'citas:editar');
  validarHorario(datos);
  const fin = new Date(datos.inicio.getTime() + datos.duracionMin * MIN);
  await db.transaction(async (tx) => {
    const actual = await leerCitaBloqueada(tx, id, datos.fisioterapeutaId);
    // Solo se exige que atienda citas si se cambia de fisioterapeuta: una cita de quien ya está bloqueado
    // puede cambiar de hora sin reasignarla (RN4: el historial se conserva).
    if (datos.fisioterapeutaId !== actual.fisioterapeutaId)
      await exigirFisioterapeuta(datos.fisioterapeutaId, tx);
    if ((actual.estado === 'realizada' || actual.estado === 'no_presentado') && datos.inicio >= ahora) {
      throw new ErrorNegocio(MENSAJE_RN2);
    }
    if (ESTADOS_QUE_BLOQUEAN.includes(actual.estado)) await comprobarSolape(tx, datos, id);
    await tx
      .update(citas)
      .set({
        fisioterapeutaId: datos.fisioterapeutaId,
        inicio: datos.inicio,
        fin,
        duracionMin: datos.duracionMin,
      })
      .where(eq(citas.id, id));
    await registrar(usuario, 'cita.reprogramar', 'cita', id, tx);
  });
}

/** Cambia el estado (RN2: realizada y no presentado solo si la cita ya ha empezado; RN1 al volver a bloquear). */
export async function cambiarEstadoCita(
  usuario: UsuarioPermisos,
  id: string,
  estado: EstadoCita,
  ahora: Date = new Date(),
) {
  exigirPermiso(usuario, 'citas:editar');
  await db.transaction(async (tx) => {
    const actual = await leerCitaBloqueada(tx, id);
    if (actual.estado === estado) return;
    if ((estado === 'realizada' || estado === 'no_presentado') && actual.inicio >= ahora) {
      throw new ErrorNegocio(MENSAJE_RN2);
    }
    if (ESTADOS_QUE_BLOQUEAN.includes(estado)) {
      await comprobarSolape(
        tx,
        { fisioterapeutaId: actual.fisioterapeutaId, inicio: actual.inicio, duracionMin: actual.duracionMin },
        id,
      );
    }
    await tx.update(citas).set({ estado }).where(eq(citas.id, id));
    await registrar(usuario, 'cita.estado', 'cita', id, tx);
  });
}

/** Elimina una cita (solo administración; lo normal es cancelarla). */
export async function eliminarCita(usuario: UsuarioPermisos, id: string) {
  exigirPermiso(usuario, 'citas:eliminar');
  if (!esUuid(id)) throw new ErrorNegocio('La cita no existe.');
  await db.transaction(async (tx) => {
    const [borrada] = await tx.delete(citas).where(eq(citas.id, id)).returning({ id: citas.id });
    if (!borrada) throw new ErrorNegocio('La cita no existe.');
    await registrar(usuario, 'cita.eliminar', 'cita', id, tx);
  });
}

/** Detalle de una cita, con motivo (dato de salud: solo aquí). Null si no existe. */
export async function obtenerCita(usuario: UsuarioPermisos, id: string) {
  exigirPermiso(usuario, 'citas:ver');
  if (!esUuid(id)) return null;
  const [fila] = await db
    .select({
      id: citas.id,
      pacienteId: citas.pacienteId,
      pacienteNombre: pacientes.nombre,
      pacienteTelefono: pacientes.telefono,
      fisioterapeutaId: citas.fisioterapeutaId,
      fisioterapeutaNombre: user.name,
      inicio: citas.inicio,
      fin: citas.fin,
      duracionMin: citas.duracionMin,
      estado: citas.estado,
      motivo: citas.motivo,
    })
    .from(citas)
    .innerJoin(pacientes, eq(pacientes.id, citas.pacienteId))
    .innerJoin(user, eq(user.id, citas.fisioterapeutaId))
    .where(eq(citas.id, id))
    .limit(1);
  return fila ?? null;
}

/** Citas de un fisioterapeuta con inicio en [desde, hasta). Sin motivo ni notas clínicas. */
export async function listarCitasDeRango(
  usuario: UsuarioPermisos,
  filtro: { fisioterapeutaId: string; desde: Date; hasta: Date },
) {
  exigirPermiso(usuario, 'citas:ver');
  return db
    .select({
      id: citas.id,
      pacienteId: citas.pacienteId,
      pacienteNombre: pacientes.nombre,
      inicio: citas.inicio,
      fin: citas.fin,
      estado: citas.estado,
    })
    .from(citas)
    .innerJoin(pacientes, eq(pacientes.id, citas.pacienteId))
    .where(
      and(
        eq(citas.fisioterapeutaId, filtro.fisioterapeutaId),
        gte(citas.inicio, filtro.desde),
        lt(citas.inicio, filtro.hasta),
      ),
    )
    .orderBy(asc(citas.inicio), asc(citas.fin));
}

const escaparLike = (texto: string) => texto.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Busca pacientes por nombre o teléfono para elegirlos al crear una cita (máximo 10; sin notas clínicas). */
export async function buscarPacientes(usuario: UsuarioPermisos, q: string) {
  exigirPermiso(usuario, 'citas:editar');
  const texto = q.trim().slice(0, 100);
  if (!texto) return [];
  const patron = `%${escaparLike(texto)}%`;
  return db
    .select({ id: pacientes.id, nombre: pacientes.nombre, telefono: pacientes.telefono })
    .from(pacientes)
    .where(or(ilike(pacientes.nombre, patron), ilike(pacientes.telefono, patron)))
    .orderBy(asc(pacientes.nombre), asc(pacientes.id))
    .limit(10);
}

/** Datos mínimos de un paciente para el formulario de cita (id, nombre y teléfono). */
export async function obtenerPacienteParaCita(usuario: UsuarioPermisos, id: string) {
  exigirPermiso(usuario, 'citas:editar');
  if (!esUuid(id)) return null;
  const [fila] = await db
    .select({ id: pacientes.id, nombre: pacientes.nombre, telefono: pacientes.telefono })
    .from(pacientes)
    .where(eq(pacientes.id, id))
    .limit(1);
  return fila ?? null;
}

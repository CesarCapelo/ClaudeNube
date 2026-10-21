import 'server-only';
import { desc, eq, lt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { registroActividad, user } from '@/lib/db/esquema';
import { exigirPermiso, type UsuarioPermisos } from '@/lib/permisos';

// Registro de actividad sobre datos de salud (art. 32 RGPD): solo identificadores, sin datos personales.

export type Accion =
  | 'paciente.crear'
  | 'paciente.editar'
  | 'paciente.eliminar'
  | 'paciente.exportar'
  | 'cita.crear'
  | 'cita.reprogramar'
  | 'cita.estado'
  | 'cita.eliminar';

/** Cliente de base de datos o transacción: permite registrar dentro de la misma transacción que la operación. */
type Ejecutor = Pick<typeof db, 'insert'>;

export async function registrar(
  usuario: { id: string },
  accion: Accion,
  tipo: 'paciente' | 'cita',
  registroId: string,
  ejecutor: Ejecutor = db,
) {
  await ejecutor.insert(registroActividad).values({ usuarioId: usuario.id, accion, tipo, registroId });
}

/** Últimas acciones registradas (solo administración). */
export async function listarActividad(usuario: UsuarioPermisos, limite = 100) {
  exigirPermiso(usuario, 'actividad:ver');
  return db
    .select({
      id: registroActividad.id,
      accion: registroActividad.accion,
      tipo: registroActividad.tipo,
      registroId: registroActividad.registroId,
      creadoEn: registroActividad.creadoEn,
      usuario: user.name,
    })
    .from(registroActividad)
    .innerJoin(user, eq(user.id, registroActividad.usuarioId))
    .orderBy(desc(registroActividad.creadoEn))
    .limit(Math.min(Math.max(1, limite), 100));
}

/** Elimina el registro anterior a `antesDe` (conservación de 24 meses). Lo llama la tarea programada. */
export async function purgarActividad(antesDe: Date) {
  const borradas = await db
    .delete(registroActividad)
    .where(lt(registroActividad.creadoEn, antesDe))
    .returning({ id: registroActividad.id });
  return borradas.length;
}

import 'server-only';
import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { profesionales, user } from '@/lib/db/esquema';
import { exigirPermiso, type UsuarioPermisos } from '@/lib/permisos';

// Fisioterapeutas = cuentas con fila en `profesionales` (marca «atiende citas», RN4).

/** Cuentas activas que atienden citas, para elegirlas al crear una cita y en la agenda. */
export async function listarFisioterapeutas(usuario: UsuarioPermisos) {
  exigirPermiso(usuario, 'citas:ver');
  return db
    .select({ id: user.id, nombre: user.name })
    .from(profesionales)
    .innerJoin(user, eq(user.id, profesionales.usuarioId))
    .where(sql`coalesce(${user.banned}, false) = false`)
    .orderBy(asc(user.name));
}

/** Ids de todas las cuentas marcadas como fisioterapeutas (activas o no), para la gestión de cuentas. */
export async function idsProfesionales(usuario: UsuarioPermisos) {
  exigirPermiso(usuario, 'cuentas:gestionar');
  const filas = await db.select({ id: profesionales.usuarioId }).from(profesionales);
  return new Set(filas.map((f) => f.id));
}

/** `ejecutor` permite consultar dentro de una transacción abierta. */
export async function esFisioterapeutaActivo(id: string, ejecutor: Pick<typeof db, 'select'> = db) {
  const [fila] = await ejecutor
    .select({ id: user.id })
    .from(profesionales)
    .innerJoin(user, eq(user.id, profesionales.usuarioId))
    .where(and(eq(profesionales.usuarioId, id), sql`coalesce(${user.banned}, false) = false`))
    .limit(1);
  return !!fila;
}

/** Marca o desmarca «atiende citas». Las citas ya creadas se conservan. */
export async function marcarFisioterapeuta(usuario: UsuarioPermisos, cuentaId: string, atiende: boolean) {
  exigirPermiso(usuario, 'cuentas:gestionar');
  const [cuenta] = await db.select({ id: user.id }).from(user).where(eq(user.id, cuentaId)).limit(1);
  if (!cuenta) return; // cuenta inexistente: nada que marcar
  if (atiende) await db.insert(profesionales).values({ usuarioId: cuentaId }).onConflictDoNothing();
  else await db.delete(profesionales).where(eq(profesionales.usuarioId, cuentaId));
}

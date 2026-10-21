import 'server-only';
import { count, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { clientes } from '@/lib/db/esquema';
import type { DatosCliente } from '@/lib/validacion/clientes';

// Capa de acceso a datos de clientes. Las comprobaciones de permisos viven aquí,
// junto a la operación que protegen, para que ninguna acción o página se las salte.

export const TAMANO_PAGINA = 20;

export class ErrorPermiso extends Error {
  constructor(mensaje = 'No tienes permiso para esta operación.') {
    super(mensaje);
  }
}

type Usuario = { id: string; role?: string | null };

const escaparLike = (texto: string) => texto.replace(/[\\%_]/g, (c) => `\\${c}`);

export async function listarClientes({ busqueda = '', pagina = 1 }: { busqueda?: string; pagina?: number }) {
  const filtro = busqueda.trim()
    ? or(
        ilike(clientes.nombre, `%${escaparLike(busqueda.trim())}%`),
        ilike(clientes.email, `%${escaparLike(busqueda.trim())}%`),
        ilike(clientes.telefono, `%${escaparLike(busqueda.trim())}%`),
      )
    : undefined;

  const [filas, [{ total }]] = await Promise.all([
    db
      .select()
      .from(clientes)
      .where(filtro)
      .orderBy(desc(clientes.creadoEn))
      .limit(TAMANO_PAGINA)
      .offset((Math.max(1, pagina) - 1) * TAMANO_PAGINA),
    db.select({ total: count() }).from(clientes).where(filtro),
  ]);

  return { filas, total, paginas: Math.max(1, Math.ceil(total / TAMANO_PAGINA)) };
}

export async function contarClientes() {
  const [{ total }] = await db.select({ total: count() }).from(clientes);
  return total;
}

export async function obtenerCliente(id: string) {
  const [cliente] = await db.select().from(clientes).where(eq(clientes.id, id)).limit(1);
  return cliente ?? null;
}

export async function crearCliente(datos: DatosCliente, usuario: Usuario) {
  const [cliente] = await db
    .insert(clientes)
    .values({ ...datos, creadoPor: usuario.id })
    .returning();
  return cliente;
}

export async function actualizarCliente(id: string, datos: DatosCliente) {
  const [cliente] = await db.update(clientes).set(datos).where(eq(clientes.id, id)).returning();
  return cliente ?? null;
}

/** Solo la administración puede eliminar clientes. */
export async function eliminarCliente(id: string, usuario: Usuario) {
  if (usuario.role !== 'admin') throw new ErrorPermiso();
  await db.delete(clientes).where(eq(clientes.id, id));
}

import 'server-only';
import { migrate as migrarPg } from 'drizzle-orm/node-postgres/migrator';
import { migrate as migrarPglite } from 'drizzle-orm/pglite/migrator';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { db, esPglite } from '.';

// Aplica las migraciones pendientes de la carpeta drizzle/.
export async function migrar() {
  const opciones = { migrationsFolder: 'drizzle' };
  if (esPglite) await migrarPglite(db as unknown as PgliteDatabase, opciones);
  else await migrarPg(db, opciones);
}

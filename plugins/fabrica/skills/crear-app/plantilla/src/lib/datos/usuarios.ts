import 'server-only';
import { count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { user } from '@/lib/db/esquema';

/** Se puede registrar quien quiera si el registro está abierto o si aún no hay ninguna cuenta. */
export async function registroPermitido() {
  if (process.env.REGISTRO_ABIERTO === 'true') return true;
  const [{ total }] = await db.select({ total: count() }).from(user);
  return total === 0;
}

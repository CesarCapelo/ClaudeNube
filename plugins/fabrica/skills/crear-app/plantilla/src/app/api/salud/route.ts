import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

// Comprobación de salud para el monitor de disponibilidad.
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ estado: 'ok' });
  } catch {
    return Response.json({ estado: 'error' }, { status: 503 });
  }
}

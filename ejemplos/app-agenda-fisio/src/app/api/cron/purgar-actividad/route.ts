import { timingSafeEqual } from 'node:crypto';
import { purgarActividad } from '@/lib/datos/actividad';

// Tarea programada (vercel.json): borra el registro de actividad de más de 24 meses.
// Protegida con CRON_SECRET (Vercel envía `Authorization: Bearer <CRON_SECRET>`). Se puede repetir sin efectos
// duplicados.
const MESES_CONSERVACION = 24;

function autorizado(peticion: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) return false;
  const recibido = Buffer.from(peticion.headers.get('authorization') ?? '');
  const esperado = Buffer.from(`Bearer ${secreto}`);
  return recibido.length === esperado.length && timingSafeEqual(recibido, esperado);
}

async function purgar(peticion: Request) {
  if (!autorizado(peticion)) return Response.json({ error: { codigo: 'no_autorizado' } }, { status: 401 });
  const limite = new Date();
  limite.setUTCMonth(limite.getUTCMonth() - MESES_CONSERVACION);
  return Response.json({ eliminadas: await purgarActividad(limite) });
}

export const GET = purgar;
export const POST = purgar;

// Fechas de la agenda. En base de datos todo va en UTC; la persona usuaria trabaja en hora de Madrid.
// Las fechas «de calendario» viajan como texto AAAA-MM-DD y las horas como HH:MM (hora local de Madrid).

export const ZONA = 'Europe/Madrid';

const formatoPartes = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONA,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

function partes(instante: Date) {
  const mapa: Record<string, string> = {};
  for (const p of formatoPartes.formatToParts(instante)) mapa[p.type] = p.value;
  return { fecha: `${mapa.year}-${mapa.month}-${mapa.day}`, hora: `${mapa.hour}:${mapa.minute}` };
}

export const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;
export const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Comprueba que el texto es una fecha de calendario real (rechaza 2026-02-30). */
export function esFechaValida(fecha: string) {
  if (!REGEX_FECHA.test(fecha)) return false;
  const [a, m, d] = fecha.split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1, d));
  return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
}

/**
 * Convierte una fecha y hora locales de Madrid en un instante. Devuelve null si no es válida o si esa hora
 * no existe (salto de hora de marzo). En la hora repetida de octubre se elige la primera.
 */
export function instanteDesdeLocal(fecha: string, hora: string): Date | null {
  if (!esFechaValida(fecha) || !REGEX_HORA.test(hora)) return null;
  const [a, m, d] = fecha.split('-').map(Number);
  const [h, min] = hora.split(':').map(Number);
  const pared = Date.UTC(a, m - 1, d, h, min);
  for (const desfaseMin of [120, 60]) {
    const candidato = new Date(pared - desfaseMin * 60_000);
    const p = partes(candidato);
    if (p.fecha === fecha && p.hora === hora) return candidato;
  }
  return null;
}

export const fechaLocal = (instante: Date) => partes(instante).fecha;
export const horaLocal = (instante: Date) => partes(instante).hora;
export const hoy = (ahora = new Date()) => fechaLocal(ahora);

/** Suma días a una fecha de calendario (aritmética de calendario, sin zonas horarias). */
export function sumarDias(fecha: string, dias: number) {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

/** Días de calendario entre dos fechas AAAA-MM-DD (b - a). */
export function diasEntre(a: string, b: string) {
  const t = (f: string) => {
    const [y, m, d] = f.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((t(b) - t(a)) / 86_400_000);
}

/** Lunes de la semana de la fecha dada. */
export function lunesDe(fecha: string) {
  const [a, m, d] = fecha.split('-').map(Number);
  const diaSemana = new Date(Date.UTC(a, m - 1, d)).getUTCDay(); // 0 = domingo
  return sumarDias(fecha, -((diaSemana + 6) % 7));
}

/** Intervalo [inicio, fin) en UTC que cubre `dias` días de calendario locales desde `fecha`. */
export function rangoDias(fecha: string, dias: number) {
  const inicio = instanteDesdeLocal(fecha, '00:00') ?? new Date(fecha);
  const fin = instanteDesdeLocal(sumarDias(fecha, dias), '00:00') ?? new Date(sumarDias(fecha, dias));
  return { inicio, fin };
}

const fmtHora = new Intl.DateTimeFormat('es-ES', {
  timeZone: ZONA,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const fmtFechaLarga = new Intl.DateTimeFormat('es-ES', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const fmtFechaCorta = new Intl.DateTimeFormat('es-ES', {
  timeZone: 'UTC',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});
const fmtFecha = new Intl.DateTimeFormat('es-ES', {
  timeZone: ZONA,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const comoUtc = (fecha: string) => new Date(`${fecha}T12:00:00Z`);

export const formatearHora = (instante: Date) => fmtHora.format(instante);
export const formatearFecha = (instante: Date) => fmtFecha.format(instante);
export const formatearFechaLarga = (fecha: string) => fmtFechaLarga.format(comoUtc(fecha));
export const formatearFechaCorta = (fecha: string) => fmtFechaCorta.format(comoUtc(fecha));

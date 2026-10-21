import { z } from 'zod';
import { ESTADOS_CITA } from '@/lib/db/esquema';
import { esFechaValida, instanteDesdeLocal, REGEX_HORA } from '@/lib/fechas';

// Validación de los formularios de cita. Fecha y hora llegan como texto local de Madrid
// (AAAA-MM-DD y HH:MM) y se convierten en un instante con `instanteDesdeLocal`.

export const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const esUuid = (valor: unknown): valor is string =>
  typeof valor === 'string' && REGEX_UUID.test(valor);

const texto = (mensaje: string) => z.string({ error: mensaje }).trim();

const camposHorario = {
  fisioterapeutaId: texto('Elige un fisioterapeuta.').min(1, 'Elige un fisioterapeuta.'),
  fecha: texto('Indica la fecha.')
    .min(1, { error: 'Indica la fecha.', abort: true })
    .refine(esFechaValida, 'Escribe una fecha válida (día, mes y año).'),
  hora: texto('Indica la hora.')
    .min(1, { error: 'Indica la hora.', abort: true })
    .regex(REGEX_HORA, { error: 'Escribe una hora válida (HH:MM).', abort: true })
    .refine((h) => Number(h.slice(3)) % 5 === 0, 'Los minutos deben ser múltiplos de 5.'),
  duracionMin: z.preprocess(
    (v) => (typeof v === 'string' ? (v.trim() === '' ? 50 : /^\d+$/.test(v.trim()) ? Number(v) : NaN) : v),
    z
      .number({ error: 'La duración debe ser un número entero de minutos.' })
      .int('La duración debe ser un número entero de minutos.')
      .min(10, 'La duración mínima es de 10 minutos.')
      .max(180, 'La duración máxima es de 180 minutos.'),
  ),
};

type Horario = { fecha: string; hora: string };

/** Convierte fecha y hora locales en instante; si esa hora no existe (cambio de hora) añade el error. */
function conInicio<T extends Horario>(datos: T, ctx: z.RefinementCtx) {
  const inicio = instanteDesdeLocal(datos.fecha, datos.hora);
  if (!inicio) {
    ctx.addIssue({ code: 'custom', path: ['hora'], message: 'Esa hora no existe (cambio de hora).' });
    return z.NEVER;
  }
  return { ...datos, inicio };
}

export const esquemaNuevaCita = z
  .object({
    pacienteId: texto('Elige un paciente.').refine(esUuid, 'Elige un paciente.'),
    ...camposHorario,
    motivo: z
      .string()
      .trim()
      .max(300, 'El motivo admite como máximo 300 caracteres.')
      .optional()
      .transform((m) => m || null),
  })
  .transform(conInicio);

export const esquemaReprogramar = z.object(camposHorario).transform(conInicio);

export const esquemaEstado = z.enum(ESTADOS_CITA, { error: 'Estado no válido.' });

export type DatosNuevaCita = z.output<typeof esquemaNuevaCita>;
export type DatosReprogramar = z.output<typeof esquemaReprogramar>;

import { z } from 'zod';
import { esFechaValida, hoy } from '@/lib/fechas';

export const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const esUuid = (valor: string) => REGEX_UUID.test(valor);

const vacioANull = (v: string) => (v === '' ? null : v);

/** Esquema del formulario de paciente. `ahora` permite probar la regla de fecha futura. */
export function crearEsquemaPaciente(ahora = new Date()) {
  return z.object({
    nombre: z
      .string('Escribe el nombre.')
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres.')
      .max(120, 'El nombre no puede superar los 120 caracteres.'),
    telefono: z
      .string('Escribe el teléfono.')
      .trim()
      .min(1, 'Escribe el teléfono.')
      .max(20, 'El teléfono no puede superar los 20 caracteres.')
      .regex(/^[0-9\s+\-.()]+$/, 'El teléfono solo puede llevar dígitos, espacios y + - . ( ).')
      .refine((v) => v.replace(/\D/g, '').length >= 9, 'El teléfono debe tener al menos 9 dígitos.'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(254, 'El correo no puede superar los 254 caracteres.')
      .refine((v) => v === '' || z.email().safeParse(v).success, 'Escribe un correo válido.')
      .transform(vacioANull),
    fechaNacimiento: z
      .string()
      .trim()
      .refine((v) => v === '' || esFechaValida(v), 'Escribe una fecha válida.')
      .refine(
        (v) => v === '' || !esFechaValida(v) || v >= '1900-01-01',
        'La fecha no puede ser anterior a 1900.',
      )
      .refine(
        (v) => v === '' || !esFechaValida(v) || v <= hoy(ahora),
        'La fecha de nacimiento no puede ser futura.',
      )
      .transform(vacioANull),
    notasClinicas: z
      .string()
      .trim()
      .max(2000, 'Las notas no pueden superar los 2000 caracteres.')
      .transform(vacioANull),
  });
}

export type DatosPaciente = z.output<ReturnType<typeof crearEsquemaPaciente>>;

export type ResultadoValidacion =
  { ok: true; datos: DatosPaciente } | { ok: false; errores: Partial<Record<string, string[]>> };

/** Valida los datos de un formulario (los campos de texto ausentes cuentan como vacíos). */
export function validarPaciente(entrada: Record<string, unknown>, ahora = new Date()): ResultadoValidacion {
  const texto = (campo: string) => (typeof entrada[campo] === 'string' ? entrada[campo] : '');
  const r = crearEsquemaPaciente(ahora).safeParse({
    nombre: texto('nombre'),
    telefono: texto('telefono'),
    email: texto('email'),
    fechaNacimiento: texto('fechaNacimiento'),
    notasClinicas: texto('notasClinicas'),
  });
  if (r.success) return { ok: true, datos: r.data };
  return { ok: false, errores: z.flattenError(r.error).fieldErrors };
}

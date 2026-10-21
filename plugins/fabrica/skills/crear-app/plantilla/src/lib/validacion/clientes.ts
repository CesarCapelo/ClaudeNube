import { z } from 'zod';

const opcional = (esquema: z.ZodString) => esquema.transform((valor) => (valor === '' ? null : valor));

// Validación compartida por el servidor (acciones) y las pruebas unitarias.
export const esquemaCliente = z.object({
  nombre: z.string().trim().min(2, 'Escribe al menos 2 caracteres.').max(120, 'Máximo 120 caracteres.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => v === '' || z.email().safeParse(v).success, 'Escribe un correo válido.')
    .transform((v) => (v === '' ? null : v)),
  telefono: opcional(
    z
      .string()
      .trim()
      .max(30, 'Máximo 30 caracteres.')
      .regex(/^[+\d\s().-]*$/, 'Usa solo números, espacios, paréntesis, guiones y +.'),
  ),
  notas: opcional(z.string().trim().max(2000, 'Máximo 2.000 caracteres.')),
});

export type DatosCliente = z.output<typeof esquemaCliente>;

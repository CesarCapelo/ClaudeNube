'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { exigirAdmin } from '@/lib/sesion';

export type EstadoAlta = { errores?: Partial<Record<string, string[]>>; mensaje?: string; ok?: boolean };

const esquemaAlta = z.object({
  name: z.string().trim().min(2, 'Escribe el nombre.'),
  email: z.email('Escribe un correo válido.'),
  password: z.string().min(10, 'Mínimo 10 caracteres.'),
  role: z.enum(['user', 'admin']),
});

export async function crearUsuario(_estado: EstadoAlta, formulario: FormData): Promise<EstadoAlta> {
  await exigirAdmin();
  const resultado = esquemaAlta.safeParse(Object.fromEntries(formulario));
  if (!resultado.success) {
    return { errores: z.flattenError(resultado.error).fieldErrors, mensaje: 'Revisa los campos marcados.' };
  }
  try {
    await auth.api.createUser({ body: resultado.data, headers: await headers() });
  } catch (error) {
    return { mensaje: error instanceof Error ? error.message : 'No se ha podido crear la cuenta.' };
  }
  revalidatePath('/usuarios');
  return { ok: true, mensaje: `Cuenta creada para ${resultado.data.email}.` };
}

export async function cambiarBloqueo(userId: string, bloquear: boolean) {
  const admin = await exigirAdmin();
  if (admin.id === userId) return; // nadie puede bloquearse a sí mismo
  const opciones = { body: { userId }, headers: await headers() };
  if (bloquear) await auth.api.banUser(opciones);
  else await auth.api.unbanUser(opciones);
  revalidatePath('/usuarios');
}

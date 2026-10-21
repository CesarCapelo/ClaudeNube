'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { marcarFisioterapeuta } from '@/lib/datos/profesionales';
import { exigirAdmin } from '@/lib/sesion';

export type EstadoAlta = { errores?: Partial<Record<string, string[]>>; mensaje?: string; ok?: boolean };

const esquemaAlta = z.object({
  name: z.string().trim().min(2, 'Escribe el nombre.'),
  email: z.email('Escribe un correo válido.'),
  password: z.string().min(10, 'Mínimo 10 caracteres.'),
  role: z.enum(['user', 'admin']),
  atiendeCitas: z.preprocess((v) => v === 'on', z.boolean()),
});

export async function crearUsuario(_estado: EstadoAlta, formulario: FormData): Promise<EstadoAlta> {
  const admin = await exigirAdmin();
  const resultado = esquemaAlta.safeParse(Object.fromEntries(formulario));
  if (!resultado.success) {
    return { errores: z.flattenError(resultado.error).fieldErrors, mensaje: 'Revisa los campos marcados.' };
  }
  const { atiendeCitas, ...cuenta } = resultado.data;
  try {
    const creada = await auth.api.createUser({ body: cuenta, headers: await headers() });
    if (atiendeCitas) await marcarFisioterapeuta(admin, creada.user.id, true);
  } catch (error) {
    // El detalle técnico queda en el registro del servidor; la persona ve un mensaje genérico.
    console.error('Error al crear la cuenta', error instanceof Error ? error.message : error);
    const duplicada = error instanceof Error && /exist|already|duplicate/i.test(error.message);
    return {
      mensaje: duplicada
        ? 'Ya existe una cuenta con ese correo.'
        : 'No se ha podido crear la cuenta. Si el problema continúa, avisa al soporte técnico.',
    };
  }
  revalidatePath('/usuarios');
  return { ok: true, mensaje: `Cuenta creada para ${resultado.data.email}.` };
}

const esquemaId = z.string().min(1).max(64);

export async function cambiarBloqueo(userId: string, bloquear: boolean) {
  const admin = await exigirAdmin();
  if (!esquemaId.safeParse(userId).success) return;
  if (admin.id === userId) return; // nadie puede bloquearse a sí mismo
  const opciones = { body: { userId }, headers: await headers() };
  if (bloquear) await auth.api.banUser(opciones);
  else await auth.api.unbanUser(opciones);
  revalidatePath('/usuarios');
}

export async function cambiarRol(userId: string, rol: 'user' | 'admin') {
  const admin = await exigirAdmin();
  if (!esquemaId.safeParse(userId).success) return;
  if (admin.id === userId) return; // nadie puede quitarse a sí mismo la administración
  if (rol !== 'user' && rol !== 'admin') return;
  await auth.api.setRole({ body: { userId, role: rol }, headers: await headers() });
  revalidatePath('/usuarios');
}

export async function cambiarMarcaFisio(userId: string, atiende: boolean) {
  const admin = await exigirAdmin();
  if (!esquemaId.safeParse(userId).success) return;
  await marcarFisioterapeuta(admin, userId, atiende);
  revalidatePath('/usuarios');
}

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { exigirUsuario } from '@/lib/sesion';
import { actualizarCliente, crearCliente, eliminarCliente } from '@/lib/datos/clientes';
import { esquemaCliente } from '@/lib/validacion/clientes';

export type EstadoFormulario = {
  errores?: Partial<Record<string, string[]>>;
  mensaje?: string;
  valores?: Record<string, string>;
};

// Patrón de toda acción de servidor: 1) exigir sesión, 2) validar, 3) operar por la capa de datos,
// 4) revalidar y redirigir. Nunca confíes en datos del cliente sin validarlos aquí.
export async function guardarCliente(
  id: string | null,
  _estado: EstadoFormulario,
  formulario: FormData,
): Promise<EstadoFormulario> {
  const usuario = await exigirUsuario();
  const valores = Object.fromEntries(
    ['nombre', 'email', 'telefono', 'notas'].map((campo) => [campo, String(formulario.get(campo) ?? '')]),
  );
  const resultado = esquemaCliente.safeParse(valores);
  if (!resultado.success) {
    return {
      errores: z.flattenError(resultado.error).fieldErrors,
      mensaje: 'Revisa los campos marcados.',
      valores,
    };
  }

  if (id) {
    const cliente = await actualizarCliente(id, resultado.data);
    if (!cliente) return { mensaje: 'El cliente ya no existe.', valores };
  } else {
    await crearCliente(resultado.data, usuario);
  }

  revalidatePath('/clientes');
  redirect('/clientes?aviso=guardado');
}

export async function borrarCliente(id: string) {
  const usuario = await exigirUsuario();
  await eliminarCliente(id, usuario);
  revalidatePath('/clientes');
  redirect('/clientes?aviso=eliminado');
}

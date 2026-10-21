'use server';

import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { actualizar, crear, eliminar } from '@/lib/datos/pacientes';
import { ErrorPermiso } from '@/lib/datos/errores';
import { exigirUsuario } from '@/lib/sesion';
import { validarPaciente } from '@/lib/validacion/pacientes';

export type EstadoPaciente = {
  errores?: Partial<Record<string, string[]>>;
  mensaje?: string;
  valores?: Record<string, string>;
};

const CAMPOS = ['nombre', 'telefono', 'email', 'fechaNacimiento', 'notasClinicas'];

function valoresDe(formulario: FormData) {
  return Object.fromEntries(CAMPOS.map((c) => [c, String(formulario.get(c) ?? '')]));
}

export async function crearPaciente(_estado: EstadoPaciente, formulario: FormData): Promise<EstadoPaciente> {
  const usuario = await exigirUsuario();
  const valores = valoresDe(formulario);
  const resultado = validarPaciente(valores);
  if (!resultado.ok) return { errores: resultado.errores, mensaje: 'Revisa los campos marcados.', valores };

  let id: string;
  try {
    id = await crear(usuario, resultado.datos);
  } catch (error) {
    if (error instanceof ErrorPermiso) redirect('/prohibido');
    throw error;
  }
  revalidatePath('/pacientes');
  // Solo se admite el valor «cita»: nunca se redirige a una URL recibida.
  if (formulario.get('siguiente') === 'cita') redirect(`/citas/nueva?paciente=${id}`);
  redirect('/pacientes?aviso=guardado');
}

export async function actualizarPaciente(
  id: string,
  _estado: EstadoPaciente,
  formulario: FormData,
): Promise<EstadoPaciente> {
  const usuario = await exigirUsuario();
  const valores = valoresDe(formulario);
  const resultado = validarPaciente(valores);
  if (!resultado.ok) return { errores: resultado.errores, mensaje: 'Revisa los campos marcados.', valores };

  let existe: boolean;
  try {
    existe = await actualizar(usuario, id, resultado.datos);
  } catch (error) {
    if (error instanceof ErrorPermiso) redirect('/prohibido');
    throw error;
  }
  if (!existe) notFound();
  revalidatePath('/pacientes');
  redirect('/pacientes?aviso=guardado');
}

export async function eliminarPaciente(id: string) {
  const usuario = await exigirUsuario();
  let existe: boolean;
  try {
    existe = await eliminar(usuario, id);
  } catch (error) {
    if (error instanceof ErrorPermiso) redirect('/prohibido');
    throw error;
  }
  if (!existe) notFound();
  revalidatePath('/pacientes');
  redirect('/pacientes?aviso=eliminado');
}

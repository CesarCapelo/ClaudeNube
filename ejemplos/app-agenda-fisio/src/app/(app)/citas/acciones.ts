'use server';

import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import {
  cambiarEstadoCita,
  crearCita,
  eliminarCita,
  ErrorCampoCita,
  obtenerCita,
  reprogramarCita,
} from '@/lib/datos/citas';
import { ErrorNegocio, ErrorPermiso } from '@/lib/datos/errores';
import { fechaLocal } from '@/lib/fechas';
import { exigirUsuario } from '@/lib/sesion';
import { esquemaEstado, esquemaNuevaCita, esquemaReprogramar, esUuid } from '@/lib/validacion/citas';

export type EstadoFormulario = {
  errores?: Partial<Record<string, string[]>>;
  mensaje?: string;
  valores?: Record<string, string>;
};

const CAMPOS = ['pacienteId', 'fisioterapeutaId', 'fecha', 'hora', 'duracionMin', 'motivo'] as const;

function valoresDe(formulario: FormData) {
  const valores: Record<string, string> = {};
  for (const campo of CAMPOS) {
    const v = formulario.get(campo);
    if (typeof v === 'string') valores[campo] = v;
  }
  return valores;
}

function traducirError(error: unknown, valores: Record<string, string>): EstadoFormulario {
  if (error instanceof ErrorPermiso) redirect('/prohibido');
  if (error instanceof ErrorCampoCita) return { errores: { [error.campo]: [error.message] }, valores };
  if (error instanceof ErrorNegocio) return { mensaje: error.message, valores };
  throw error;
}

function urlAgenda(fecha: string, fisioterapeutaId: string, aviso: string) {
  const p = new URLSearchParams({ fecha, fisio: fisioterapeutaId, aviso });
  return `/agenda?${p.toString()}`;
}

export async function crearCitaAccion(
  _estado: EstadoFormulario,
  formulario: FormData,
): Promise<EstadoFormulario> {
  const usuario = await exigirUsuario();
  const valores = valoresDe(formulario);
  const resultado = esquemaNuevaCita.safeParse(valores);
  if (!resultado.success) {
    return {
      errores: z.flattenError(resultado.error).fieldErrors,
      mensaje: 'Revisa los campos marcados.',
      valores,
    };
  }
  const datos = resultado.data;
  try {
    await crearCita(usuario, datos);
  } catch (error) {
    return traducirError(error, valores);
  }
  revalidatePath('/agenda');
  redirect(urlAgenda(datos.fecha, datos.fisioterapeutaId, 'guardada'));
}

export async function reprogramarCitaAccion(
  id: string,
  _estado: EstadoFormulario,
  formulario: FormData,
): Promise<EstadoFormulario> {
  const usuario = await exigirUsuario();
  const valores = valoresDe(formulario);
  const resultado = esquemaReprogramar.safeParse(valores);
  if (!resultado.success) {
    return {
      errores: z.flattenError(resultado.error).fieldErrors,
      mensaje: 'Revisa los campos marcados.',
      valores,
    };
  }
  try {
    await reprogramarCita(usuario, id, resultado.data);
  } catch (error) {
    return traducirError(error, valores);
  }
  revalidatePath('/agenda');
  revalidatePath(`/citas/${id}`);
  redirect(`/citas/${id}?aviso=actualizada`);
}

/** Solo se vuelve a /agenda o al detalle de una cita (nunca a una URL recibida sin comprobar). */
function destinoSeguro(volverA: string, id: string) {
  const valido = /^\/(agenda|citas\/[0-9a-f-]{36})(\?[\w=&%-]*)?$/i.test(volverA);
  const url = new URL(valido ? volverA : `/citas/${id}`, 'http://interno');
  url.searchParams.set('aviso', 'actualizada');
  return `${url.pathname}${url.search}`;
}

export async function cambiarEstadoAccion(
  id: string,
  volverA: string,
  _estado: EstadoFormulario,
  formulario: FormData,
): Promise<EstadoFormulario> {
  const usuario = await exigirUsuario();
  const estado = esquemaEstado.safeParse(formulario.get('estado'));
  if (!estado.success) return { mensaje: 'Estado no válido.' };
  try {
    await cambiarEstadoCita(usuario, id, estado.data);
  } catch (error) {
    return traducirError(error, {});
  }
  revalidatePath('/agenda');
  revalidatePath(`/citas/${id}`);
  redirect(destinoSeguro(volverA, id));
}

export async function eliminarCitaAccion(id: string) {
  const usuario = await exigirUsuario();
  if (!esUuid(id)) notFound();
  const cita = await obtenerCita(usuario, id);
  if (!cita) notFound();
  try {
    await eliminarCita(usuario, id);
  } catch (error) {
    if (error instanceof ErrorPermiso) redirect('/prohibido');
    if (error instanceof ErrorNegocio) notFound();
    throw error;
  }
  revalidatePath('/agenda');
  redirect(urlAgenda(fechaLocal(cita.inicio), cita.fisioterapeutaId, 'eliminada'));
}

import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { auth } from './auth';

// Capa de acceso a la sesión: todas las páginas, acciones y rutas protegidas pasan por aquí.

/** Sesión actual o null. Se memoriza durante la petición. */
export const obtenerSesion = cache(async () => auth.api.getSession({ headers: await headers() }));

/** Exige sesión iniciada; si no la hay, redirige a /entrar. */
export async function exigirUsuario() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect('/entrar');
  if (sesion.user.banned) redirect('/entrar?bloqueado=1');
  return sesion.user;
}

/** Exige el rol de administración; si no, devuelve 403 mediante la página de prohibido. */
export async function exigirAdmin() {
  const usuario = await exigirUsuario();
  if (usuario.role !== 'admin') redirect('/prohibido');
  return usuario;
}

import { redirect } from 'next/navigation';
import { obtenerSesion } from '@/lib/sesion';

export default async function Inicio() {
  const sesion = await obtenerSesion();
  redirect(sesion ? '/panel' : '/entrar');
}

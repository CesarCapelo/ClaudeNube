import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { obtenerSesion } from '@/lib/sesion';
import { registroPermitido } from '@/lib/datos/usuarios';
import { Aviso } from '@/components/ui/aviso';
import { FormularioAcceso } from '../formulario-acceso';

export const metadata: Metadata = { title: 'Entrar' };

export default async function Entrar({ searchParams }: PageProps<'/entrar'>) {
  if (await obtenerSesion()) redirect('/panel');
  const { bloqueado } = await searchParams;
  return (
    <div className="space-y-4">
      {bloqueado && <Aviso tono="error">Tu cuenta está bloqueada. Contacta con la administración.</Aviso>}
      <FormularioAcceso modo="entrar" puedeRegistrarse={await registroPermitido()} />
    </div>
  );
}

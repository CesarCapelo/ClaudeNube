import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { obtenerSesion } from '@/lib/sesion';
import { registroPermitido } from '@/lib/datos/usuarios';
import { Aviso } from '@/components/ui/aviso';
import { EnlaceBoton } from '@/components/ui/boton';
import { FormularioAcceso } from '../formulario-acceso';

export const metadata: Metadata = { title: 'Crear cuenta' };

export default async function Registro() {
  if (await obtenerSesion()) redirect('/agenda');
  if (!(await registroPermitido())) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-bold">Registro cerrado</h1>
        <Aviso>Las cuentas las crea una persona administradora. Pídele que te dé de alta.</Aviso>
        <EnlaceBoton href="/entrar" variante="secundario" className="w-full">
          Volver a entrar
        </EnlaceBoton>
      </div>
    );
  }
  return <FormularioAcceso modo="registro" puedeRegistrarse />;
}

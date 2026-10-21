import type { Metadata } from 'next';
import { exigirUsuario } from '@/lib/sesion';
import { contarClientes } from '@/lib/datos/clientes';
import { EnlaceBoton } from '@/components/ui/boton';

export const metadata: Metadata = { title: 'Panel' };

export default async function Panel() {
  const usuario = await exigirUsuario();
  const totalClientes = await contarClientes();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Hola, {usuario.name}</h1>
        <p className="mt-1 text-tinta-suave">Resumen de la actividad.</p>
      </div>
      <dl className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-superficie p-5 ring-1 ring-borde">
          <dt className="text-sm text-tinta-suave">Clientes</dt>
          <dd className="mt-1 text-3xl font-bold">{totalClientes}</dd>
        </div>
      </dl>
      <EnlaceBoton href="/clientes/nuevo">Añadir cliente</EnlaceBoton>
    </div>
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { exigirUsuario } from '@/lib/sesion';
import { obtenerCliente } from '@/lib/datos/clientes';
import { Boton } from '@/components/ui/boton';
import { FormularioCliente } from '../formulario-cliente';
import { borrarCliente } from '../acciones';

export const metadata: Metadata = { title: 'Editar cliente' };

export default async function EditarCliente({ params }: PageProps<'/clientes/[id]'>) {
  const usuario = await exigirUsuario();
  const { id } = await params;
  const cliente = await obtenerCliente(id);
  if (!cliente) notFound();

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-3xl font-bold">{cliente.nombre}</h1>
      <FormularioCliente cliente={cliente} />
      {usuario.role === 'admin' && (
        <details className="rounded-xl p-5 ring-1 ring-red-200">
          <summary className="cursor-pointer font-semibold text-peligro">Eliminar cliente</summary>
          <p className="mt-3 text-sm text-tinta-suave">Esta acción no se puede deshacer.</p>
          <form action={borrarCliente.bind(null, cliente.id)} className="mt-4">
            <Boton type="submit" variante="peligro">
              Eliminar definitivamente
            </Boton>
          </form>
        </details>
      )}
    </div>
  );
}

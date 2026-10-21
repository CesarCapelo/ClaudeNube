import type { Metadata } from 'next';
import { exigirUsuario } from '@/lib/sesion';
import { FormularioCliente } from '../formulario-cliente';

export const metadata: Metadata = { title: 'Nuevo cliente' };

export default async function NuevoCliente() {
  await exigirUsuario();
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Nuevo cliente</h1>
      <FormularioCliente />
    </div>
  );
}

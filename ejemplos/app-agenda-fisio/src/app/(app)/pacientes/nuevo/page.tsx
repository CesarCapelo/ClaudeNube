import type { Metadata } from 'next';
import { exigirUsuario } from '@/lib/sesion';
import { crearPaciente } from '../acciones';
import { FormularioPaciente } from '../formulario-paciente';

export const metadata: Metadata = { title: 'Nuevo paciente' };

export default async function NuevoPaciente({ searchParams }: PageProps<'/pacientes/nuevo'>) {
  await exigirUsuario();
  const { siguiente } = await searchParams;
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Nuevo paciente</h1>
      <div className="rounded-xl bg-superficie p-6 ring-1 ring-borde">
        <FormularioPaciente accion={crearPaciente} siguiente={siguiente === 'cita' ? 'cita' : undefined} />
      </div>
    </div>
  );
}

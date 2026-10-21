'use client';

import { useActionState } from 'react';
import { Aviso } from '@/components/ui/aviso';
import { Boton } from '@/components/ui/boton';
import { Campo } from '@/components/ui/campo';
import type { EstadoPaciente } from './acciones';

type Valores = {
  nombre: string;
  telefono: string;
  email: string;
  fechaNacimiento: string;
  notasClinicas: string;
};

const VACIOS: Valores = { nombre: '', telefono: '', email: '', fechaNacimiento: '', notasClinicas: '' };

export function FormularioPaciente({
  accion,
  inicial = VACIOS,
  siguiente,
}: {
  accion: (estado: EstadoPaciente, formulario: FormData) => Promise<EstadoPaciente>;
  inicial?: Valores;
  /** Solo se admite «cita»: tras el alta se continúa con la nueva cita. */
  siguiente?: 'cita';
}) {
  const [estado, enviar, pendiente] = useActionState<EstadoPaciente, FormData>(accion, {});
  const v = { ...inicial, ...estado.valores };
  return (
    <form action={enviar} className="space-y-4" noValidate>
      {estado.mensaje && <Aviso tono="error">{estado.mensaje}</Aviso>}
      {siguiente && <input type="hidden" name="siguiente" value={siguiente} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Nombre"
          nombre="nombre"
          required
          autoComplete="off"
          defaultValue={v.nombre}
          error={estado.errores?.nombre}
        />
        <Campo
          etiqueta="Teléfono"
          nombre="telefono"
          type="tel"
          required
          autoComplete="off"
          defaultValue={v.telefono}
          error={estado.errores?.telefono}
        />
        <Campo
          etiqueta="Correo electrónico"
          nombre="email"
          type="email"
          autoComplete="off"
          defaultValue={v.email}
          error={estado.errores?.email}
        />
        <Campo
          etiqueta="Fecha de nacimiento"
          nombre="fechaNacimiento"
          type="date"
          defaultValue={v.fechaNacimiento}
          error={estado.errores?.fechaNacimiento}
        />
      </div>
      <Campo
        etiqueta="Notas clínicas"
        nombre="notasClinicas"
        multilinea
        defaultValue={v.notasClinicas}
        ayuda="Dato de salud: solo se ve en la ficha del paciente. Máximo 2000 caracteres."
        error={estado.errores?.notasClinicas}
      />
      <Boton type="submit" disabled={pendiente}>
        {pendiente ? 'Guardando…' : 'Guardar paciente'}
      </Boton>
    </form>
  );
}

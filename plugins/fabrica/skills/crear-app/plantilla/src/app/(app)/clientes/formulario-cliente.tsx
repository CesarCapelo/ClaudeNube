'use client';

import { useActionState } from 'react';
import type { Cliente } from '@/lib/db/esquema';
import { Boton, EnlaceBoton } from '@/components/ui/boton';
import { Campo } from '@/components/ui/campo';
import { Aviso } from '@/components/ui/aviso';
import { guardarCliente, type EstadoFormulario } from './acciones';

export function FormularioCliente({ cliente }: { cliente?: Cliente }) {
  const [estado, accion, pendiente] = useActionState<EstadoFormulario, FormData>(
    guardarCliente.bind(null, cliente?.id ?? null),
    {},
  );
  const valor = (campo: keyof Cliente) =>
    estado.valores?.[campo] ?? (cliente?.[campo] as string | null | undefined) ?? '';

  return (
    <form action={accion} className="space-y-5" noValidate>
      {estado.mensaje && <Aviso tono="error">{estado.mensaje}</Aviso>}
      <Campo
        etiqueta="Nombre"
        nombre="nombre"
        required
        defaultValue={valor('nombre')}
        error={estado.errores?.nombre}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Campo
          etiqueta="Correo electrónico"
          nombre="email"
          type="email"
          defaultValue={valor('email')}
          error={estado.errores?.email}
        />
        <Campo
          etiqueta="Teléfono"
          nombre="telefono"
          type="tel"
          defaultValue={valor('telefono')}
          error={estado.errores?.telefono}
        />
      </div>
      <Campo
        etiqueta="Notas"
        nombre="notas"
        multilinea
        defaultValue={valor('notas')}
        error={estado.errores?.notas}
      />
      <div className="flex gap-3">
        <Boton type="submit" disabled={pendiente}>
          {pendiente ? 'Guardando…' : 'Guardar'}
        </Boton>
        <EnlaceBoton href="/clientes" variante="secundario">
          Cancelar
        </EnlaceBoton>
      </div>
    </form>
  );
}

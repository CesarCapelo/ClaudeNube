'use client';

import { useActionState } from 'react';
import { Boton } from '@/components/ui/boton';
import { Campo } from '@/components/ui/campo';
import { Aviso } from '@/components/ui/aviso';
import { crearUsuario, type EstadoAlta } from './acciones';

export function FormularioAlta() {
  const [estado, accion, pendiente] = useActionState<EstadoAlta, FormData>(crearUsuario, {});
  return (
    <form action={accion} className="space-y-4" noValidate>
      {estado.mensaje && <Aviso tono={estado.ok ? 'exito' : 'error'}>{estado.mensaje}</Aviso>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre" nombre="name" required error={estado.errores?.name} />
        <Campo
          etiqueta="Correo electrónico"
          nombre="email"
          type="email"
          required
          error={estado.errores?.email}
        />
        <Campo
          etiqueta="Contraseña inicial"
          nombre="password"
          type="password"
          required
          autoComplete="new-password"
          ayuda="Mínimo 10 caracteres. Pide a la persona que la cambie."
          error={estado.errores?.password}
        />
        <div>
          <label htmlFor="campo-role" className="block text-sm font-semibold">
            Rol
          </label>
          <select
            id="campo-role"
            name="role"
            defaultValue="user"
            className="mt-1.5 block w-full rounded-lg border border-tinta-suave/60 bg-white px-3 py-2"
          >
            <option value="user">Usuario</option>
            <option value="admin">Administración</option>
          </select>
        </div>
      </div>
      <label className="flex items-center gap-3 text-sm font-semibold">
        <input type="checkbox" name="atiendeCitas" className="size-5 accent-marca-700" />
        Atiende citas (fisioterapeuta)
      </label>
      <Boton type="submit" disabled={pendiente}>
        {pendiente ? 'Creando…' : 'Crear cuenta'}
      </Boton>
    </form>
  );
}

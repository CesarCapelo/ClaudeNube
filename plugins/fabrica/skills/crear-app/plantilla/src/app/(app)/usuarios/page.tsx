import type { Metadata } from 'next';
import { asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { user } from '@/lib/db/esquema';
import { exigirAdmin } from '@/lib/sesion';
import { Boton } from '@/components/ui/boton';
import { FormularioAlta } from './formulario-alta';
import { cambiarBloqueo } from './acciones';

export const metadata: Metadata = { title: 'Usuarios' };

export default async function Usuarios() {
  const admin = await exigirAdmin();
  const usuarios = await db.select().from(user).orderBy(asc(user.createdAt));

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold">Usuarios</h1>

      <section
        aria-labelledby="titulo-alta"
        className="max-w-2xl rounded-xl bg-superficie p-6 ring-1 ring-borde"
      >
        <h2 id="titulo-alta" className="mb-4 text-lg font-semibold">
          Dar de alta una cuenta
        </h2>
        <FormularioAlta />
      </section>

      <section aria-labelledby="titulo-cuentas">
        <h2 id="titulo-cuentas" className="mb-4 text-lg font-semibold">
          Cuentas ({usuarios.length})
        </h2>
        <div
          className="overflow-x-auto rounded-xl bg-superficie ring-1 ring-borde"
          role="region"
          aria-label="Listado de cuentas"
          tabIndex={0}
        >
          <table className="w-full text-left text-sm">
            <thead className="border-b border-borde text-tinta-suave">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Nombre
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Correo
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Rol
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Estado
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-borde last:border-0">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.role === 'admin' ? 'Administración' : 'Usuario'}</td>
                  <td className="px-4 py-3">{u.banned ? 'Bloqueada' : 'Activa'}</td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== admin.id && (
                      <form action={cambiarBloqueo.bind(null, u.id, !u.banned)}>
                        <Boton type="submit" variante="secundario">
                          {u.banned ? 'Desbloquear' : 'Bloquear'}
                          <span className="sr-only"> a {u.name}</span>
                        </Boton>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

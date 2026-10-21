import type { Metadata } from 'next';
import { asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { user } from '@/lib/db/esquema';
import { exigirAdmin } from '@/lib/sesion';
import { Boton } from '@/components/ui/boton';
import { FormularioAlta } from './formulario-alta';
import { idsProfesionales } from '@/lib/datos/profesionales';
import { cambiarBloqueo, cambiarMarcaFisio, cambiarRol } from './acciones';

export const metadata: Metadata = { title: 'Usuarios' };

export default async function Usuarios() {
  const admin = await exigirAdmin();
  const usuarios = await db.select().from(user).orderBy(asc(user.createdAt));
  const fisios = await idsProfesionales(admin);

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
        <ul className="space-y-3" aria-label="Listado de cuentas">
          {usuarios.map((u) => (
            <li key={u.id} className="rounded-xl bg-superficie p-4 ring-1 ring-borde">
              <p className="font-semibold">{u.name}</p>
              <p className="text-sm break-all text-tinta-suave">{u.email}</p>
              <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <div className="flex gap-1">
                  <dt className="text-tinta-suave">Rol:</dt>
                  <dd>{u.role === 'admin' ? 'Administración' : 'Usuario'}</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="text-tinta-suave">Atiende citas:</dt>
                  <dd>{fisios.has(u.id) ? 'Sí' : 'No'}</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="text-tinta-suave">Estado:</dt>
                  <dd>{u.banned ? 'Bloqueada' : 'Activa'}</dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={cambiarMarcaFisio.bind(null, u.id, !fisios.has(u.id))}>
                  <Boton type="submit" variante="secundario">
                    {fisios.has(u.id) ? 'Quitar de fisioterapeutas' : 'Marcar como fisioterapeuta'}
                    <span className="sr-only"> a {u.name}</span>
                  </Boton>
                </form>
                {u.id !== admin.id && (
                  <>
                    <form action={cambiarRol.bind(null, u.id, u.role === 'admin' ? 'user' : 'admin')}>
                      <Boton type="submit" variante="secundario">
                        {u.role === 'admin' ? 'Quitar administración' : 'Dar rol de administración'}
                        <span className="sr-only"> a {u.name}</span>
                      </Boton>
                    </form>
                    <form action={cambiarBloqueo.bind(null, u.id, !u.banned)}>
                      <Boton type="submit" variante={u.banned ? 'secundario' : 'peligro'}>
                        {u.banned ? 'Desbloquear' : 'Bloquear'}
                        <span className="sr-only"> a {u.name}</span>
                      </Boton>
                    </form>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

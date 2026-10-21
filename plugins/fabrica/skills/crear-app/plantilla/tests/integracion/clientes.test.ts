import { beforeAll, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { migrar } from '@/lib/db/migrar';
import { user } from '@/lib/db/esquema';
import {
  ErrorPermiso,
  crearCliente,
  eliminarCliente,
  listarClientes,
  obtenerCliente,
} from '@/lib/datos/clientes';

// Pruebas de la capa de datos contra PostgreSQL real (embebido): consultas, filtros y permisos.
const admin = { id: 'u-admin', role: 'admin' };
const miembro = { id: 'u-miembro', role: 'user' };

beforeAll(async () => {
  await migrar();
  await db.insert(user).values([
    { id: admin.id, name: 'Admin', email: 'admin@test.local', role: 'admin' },
    { id: miembro.id, name: 'Miembro', email: 'miembro@test.local', role: 'user' },
  ]);
});

describe('capa de datos de clientes', () => {
  it('crea y recupera un cliente', async () => {
    const cliente = await crearCliente({ nombre: 'Taller Gómez', email: null, telefono: null, notas: null }, miembro);
    expect(await obtenerCliente(cliente.id)).toMatchObject({ nombre: 'Taller Gómez', creadoPor: miembro.id });
  });

  it('busca sin interpretar comodines del usuario', async () => {
    await crearCliente({ nombre: 'Descuento 100% Ruiz', email: null, telefono: null, notas: null }, miembro);
    const { filas } = await listarClientes({ busqueda: '100%' });
    expect(filas.map((f) => f.nombre)).toEqual(['Descuento 100% Ruiz']);
    const { total } = await listarClientes({ busqueda: '%' });
    expect(total).toBe(1);
  });

  it('solo la administración puede eliminar', async () => {
    const cliente = await crearCliente({ nombre: 'Para borrar', email: null, telefono: null, notas: null }, miembro);
    await expect(eliminarCliente(cliente.id, miembro)).rejects.toBeInstanceOf(ErrorPermiso);
    await eliminarCliente(cliente.id, admin);
    expect(await obtenerCliente(cliente.id)).toBeNull();
  });
});

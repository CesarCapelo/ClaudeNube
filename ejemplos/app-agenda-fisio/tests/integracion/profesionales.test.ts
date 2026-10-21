import { beforeAll, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { migrar } from '@/lib/db/migrar';
import { user } from '@/lib/db/esquema';
import { ErrorPermiso } from '@/lib/datos/errores';
import {
  esFisioterapeutaActivo,
  idsProfesionales,
  listarFisioterapeutas,
  marcarFisioterapeuta,
} from '@/lib/datos/profesionales';

const admin = { id: 'u-admin', role: 'admin' };
const recepcion = { id: 'u-recepcion', role: 'user' };

beforeAll(async () => {
  await migrar();
  await db.insert(user).values([
    { id: 'u-admin', name: 'Ana Admin', email: 'ana@test.local', role: 'admin' },
    { id: 'u-recepcion', name: 'Rosa Recepción', email: 'rosa@test.local', role: 'user' },
    { id: 'u-felix', name: 'Félix Fisio', email: 'felix@test.local', role: 'user' },
    { id: 'u-bea', name: 'Bea Bloqueada', email: 'bea@test.local', role: 'user', banned: true },
  ]);
});

describe('fisioterapeutas (marca «atiende citas»)', () => {
  it('solo la administración puede marcar o desmarcar', async () => {
    await expect(marcarFisioterapeuta(recepcion, 'u-felix', true)).rejects.toBeInstanceOf(ErrorPermiso);
    await expect(idsProfesionales(recepcion)).rejects.toBeInstanceOf(ErrorPermiso);
  });

  it('lista a los marcados y activos, y no a la recepcionista ni a las cuentas bloqueadas', async () => {
    await marcarFisioterapeuta(admin, 'u-admin', true);
    await marcarFisioterapeuta(admin, 'u-felix', true);
    await marcarFisioterapeuta(admin, 'u-bea', true);
    const lista = await listarFisioterapeutas(recepcion);
    expect(lista.map((f) => f.nombre)).toEqual(['Ana Admin', 'Félix Fisio']);
    expect(await esFisioterapeutaActivo('u-bea')).toBe(false);
    expect(await esFisioterapeutaActivo('u-recepcion')).toBe(false);
    expect((await idsProfesionales(admin)).has('u-bea')).toBe(true);
  });

  it('marcar dos veces no falla y desmarcar quita a la persona de la lista', async () => {
    await marcarFisioterapeuta(admin, 'u-felix', true);
    await marcarFisioterapeuta(admin, 'u-felix', false);
    expect((await listarFisioterapeutas(admin)).map((f) => f.id)).toEqual(['u-admin']);
  });
});

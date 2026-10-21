import { beforeAll, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { migrar } from '@/lib/db/migrar';
import { registroActividad, user } from '@/lib/db/esquema';
import { listarActividad, purgarActividad, registrar } from '@/lib/datos/actividad';
import { ErrorPermiso } from '@/lib/datos/errores';

beforeAll(async () => {
  await migrar();
  await db.insert(user).values({ id: 'u1', name: 'Ana', email: 'ana@t.local', role: 'admin' });
});

describe('registro de actividad', () => {
  it('solo la administración lo lee', async () => {
    await expect(listarActividad({ id: 'x', role: 'user' })).rejects.toBeInstanceOf(ErrorPermiso);
  });

  it('purga lo anterior al límite y conserva lo reciente; repetirlo no tiene efecto', async () => {
    await registrar({ id: 'u1' }, 'paciente.crear', 'paciente', 'p-reciente');
    await db.insert(registroActividad).values({
      usuarioId: 'u1',
      accion: 'paciente.crear',
      tipo: 'paciente',
      registroId: 'p-viejo',
      creadoEn: new Date('2020-01-01T00:00:00Z'),
    });
    const limite = new Date('2024-01-01T00:00:00Z');
    expect(await purgarActividad(limite)).toBe(1);
    expect(await purgarActividad(limite)).toBe(0);
    const filas = await listarActividad({ id: 'u1', role: 'admin' });
    expect(filas.map((f) => f.registroId)).toEqual(['p-reciente']);
  });
});

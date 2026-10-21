import { describe, expect, it } from 'vitest';
import { exigirPermiso, puede, type Permiso } from '@/lib/permisos';
import { ErrorPermiso } from '@/lib/datos/errores';

const admin = { id: 'a', role: 'admin' };
const miembro = { id: 'u', role: 'user' };

describe('matriz de permisos', () => {
  const soloAdmin: Permiso[] = [
    'pacientes:eliminar',
    'pacientes:exportar',
    'pacientes:sin-volver',
    'citas:eliminar',
    'actividad:ver',
    'cuentas:gestionar',
  ];
  const ambos: Permiso[] = ['pacientes:ver', 'pacientes:editar', 'citas:ver', 'citas:editar'];

  it.each(soloAdmin)('%s es solo de administración', (permiso) => {
    expect(puede(admin, permiso)).toBe(true);
    expect(puede(miembro, permiso)).toBe(false);
    expect(() => exigirPermiso(miembro, permiso)).toThrow(ErrorPermiso);
  });

  it.each(ambos)('%s lo tienen administración y usuarios', (permiso) => {
    expect(puede(admin, permiso)).toBe(true);
    expect(puede(miembro, permiso)).toBe(true);
  });

  it('sin rol o con la cuenta bloqueada no se puede nada', () => {
    expect(puede({ id: 'x', role: null }, 'pacientes:ver')).toBe(false);
    expect(puede({ id: 'x', role: 'admin', banned: true }, 'pacientes:ver')).toBe(false);
  });
});

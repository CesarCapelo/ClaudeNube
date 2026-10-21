import { describe, expect, it } from 'vitest';
import { esUuid, validarPaciente } from '@/lib/validacion/pacientes';

const AHORA = new Date('2026-10-21T10:00:00Z');
const valido = { nombre: 'Ana Pérez', telefono: '600 123 456' };

describe('validación de pacientes', () => {
  it('acepta nombre y teléfono y normaliza los opcionales a null', () => {
    const r = validarPaciente(valido, AHORA);
    expect(r).toEqual({
      ok: true,
      datos: { ...valido, email: null, fechaNacimiento: null, notasClinicas: null },
    });
  });

  it('recorta espacios y pone el correo en minúsculas', () => {
    const r = validarPaciente({ ...valido, nombre: '  Ana  ', email: ' ANA@Correo.ES ' }, AHORA);
    expect(r.ok && r.datos.nombre).toBe('Ana');
    expect(r.ok && r.datos.email).toBe('ana@correo.es');
  });

  it('rechaza nombre vacío o de 1 carácter y de más de 120', () => {
    for (const nombre of ['', ' ', 'A', 'x'.repeat(121)]) {
      const r = validarPaciente({ ...valido, nombre }, AHORA);
      expect(!r.ok && r.errores.nombre?.length).toBeGreaterThan(0);
    }
    expect(validarPaciente({ ...valido, nombre: 'Al' }, AHORA).ok).toBe(true);
    expect(validarPaciente({ ...valido, nombre: 'x'.repeat(120) }, AHORA).ok).toBe(true);
  });

  it('rechaza teléfonos con menos de 9 dígitos, con letras o demasiado largos', () => {
    for (const telefono of [
      '',
      '12345678',
      '600 12 34 5',
      '60012345a',
      '600-123-ABC',
      '+34 600 123 456 789 000',
    ]) {
      const r = validarPaciente({ ...valido, telefono }, AHORA);
      expect(!r.ok && r.errores.telefono?.length).toBeGreaterThan(0);
    }
    for (const telefono of ['600123456', '+34 (600) 123-456', '600.123.456']) {
      expect(validarPaciente({ ...valido, telefono }, AHORA).ok).toBe(true);
    }
  });

  it('rechaza correos mal formados', () => {
    const r = validarPaciente({ ...valido, email: 'sin-arroba' }, AHORA);
    expect(!r.ok && r.errores.email).toBeDefined();
  });

  it('valida la fecha de nacimiento: no futura, no anterior a 1900, real', () => {
    const f = (fechaNacimiento: string) => validarPaciente({ ...valido, fechaNacimiento }, AHORA).ok;
    expect(f('1985-05-20')).toBe(true);
    expect(f('2026-10-21')).toBe(true);
    expect(f('2026-10-22')).toBe(false);
    expect(f('1899-12-31')).toBe(false);
    expect(f('1900-01-01')).toBe(true);
    expect(f('2026-02-30')).toBe(false);
    expect(f('no-es-fecha')).toBe(false);
  });

  it('limita las notas clínicas a 2000 caracteres', () => {
    expect(validarPaciente({ ...valido, notasClinicas: 'x'.repeat(2000) }, AHORA).ok).toBe(true);
    const r = validarPaciente({ ...valido, notasClinicas: 'x'.repeat(2001) }, AHORA);
    expect(!r.ok && r.errores.notasClinicas).toBeDefined();
  });

  it('esUuid distingue identificadores válidos', () => {
    expect(esUuid(crypto.randomUUID())).toBe(true);
    expect(esUuid('abc')).toBe(false);
    expect(esUuid("1' or '1'='1")).toBe(false);
  });
});

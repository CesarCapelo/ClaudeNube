import { describe, expect, it } from 'vitest';
import { esquemaEstado, esquemaNuevaCita, esquemaReprogramar, esUuid } from '@/lib/validacion/citas';

const PACIENTE = '3f2b1c3e-7a41-4f0e-9d3a-0a6f6f0c1b11';
const base = {
  pacienteId: PACIENTE,
  fisioterapeutaId: 'fisio-1',
  fecha: '2026-07-15',
  hora: '10:00',
  duracionMin: '50',
  motivo: '',
};

function errores(datos: Record<string, unknown>) {
  const r = esquemaNuevaCita.safeParse(datos);
  if (r.success) return {};
  const campos: Record<string, string[]> = {};
  for (const i of r.error.issues) (campos[String(i.path[0])] ??= []).push(i.message);
  return campos;
}

describe('validación de citas', () => {
  it('acepta una cita válida y calcula el instante UTC de Madrid', () => {
    const r = esquemaNuevaCita.parse({ ...base, motivo: '  Lumbalgia  ' });
    expect(r.inicio.toISOString()).toBe('2026-07-15T08:00:00.000Z');
    expect(r.duracionMin).toBe(50);
    expect(r.motivo).toBe('Lumbalgia');
  });

  it('la duración vacía vale 50 y el motivo vacío es null', () => {
    const r = esquemaNuevaCita.parse({ ...base, duracionMin: '', motivo: undefined });
    expect(r.duracionMin).toBe(50);
    expect(r.motivo).toBeNull();
  });

  it('rechaza fechas vacías o imposibles', () => {
    expect(errores({ ...base, fecha: '' }).fecha).toBeDefined();
    expect(errores({ ...base, fecha: '2026-02-30' }).fecha).toBeDefined();
    expect(errores({ ...base, fecha: '15/07/2026' }).fecha).toBeDefined();
  });

  it('rechaza horas mal formadas y minutos que no son múltiplos de 5', () => {
    expect(errores({ ...base, hora: '' }).hora).toBeDefined();
    expect(errores({ ...base, hora: '25:00' }).hora).toBeDefined();
    expect(errores({ ...base, hora: '10:03' }).hora).toEqual(['Los minutos deben ser múltiplos de 5.']);
    expect(esquemaNuevaCita.safeParse({ ...base, hora: '10:05' }).success).toBe(true);
  });

  it('valida los límites de la duración', () => {
    expect(errores({ ...base, duracionMin: '9' }).duracionMin).toBeDefined();
    expect(errores({ ...base, duracionMin: '181' }).duracionMin).toBeDefined();
    expect(errores({ ...base, duracionMin: 'abc' }).duracionMin).toBeDefined();
    expect(errores({ ...base, duracionMin: '50,5' }).duracionMin).toBeDefined();
    expect(esquemaNuevaCita.parse({ ...base, duracionMin: '10' }).duracionMin).toBe(10);
    expect(esquemaNuevaCita.parse({ ...base, duracionMin: '180' }).duracionMin).toBe(180);
  });

  it('limita el motivo a 300 caracteres', () => {
    expect(errores({ ...base, motivo: 'a'.repeat(301) }).motivo).toBeDefined();
    expect(esquemaNuevaCita.safeParse({ ...base, motivo: 'a'.repeat(300) }).success).toBe(true);
  });

  it('exige paciente (UUID) y fisioterapeuta', () => {
    expect(errores({ ...base, pacienteId: '' }).pacienteId).toBeDefined();
    expect(errores({ ...base, pacienteId: 'no-es-uuid' }).pacienteId).toBeDefined();
    expect(errores({ ...base, fisioterapeutaId: '' }).fisioterapeutaId).toBeDefined();
  });

  it('rechaza la hora que no existe en el cambio de hora de marzo', () => {
    expect(errores({ ...base, fecha: '2026-03-29', hora: '02:30' }).hora).toEqual([
      'Esa hora no existe (cambio de hora).',
    ]);
    expect(esquemaNuevaCita.safeParse({ ...base, fecha: '2026-03-29', hora: '03:30' }).success).toBe(true);
  });

  it('la reprogramación valida los mismos campos de horario', () => {
    const ok = esquemaReprogramar.parse({
      fisioterapeutaId: 'f',
      fecha: '2026-10-25',
      hora: '10:00',
      duracionMin: '60',
    });
    expect(ok.inicio.toISOString()).toBe('2026-10-25T09:00:00.000Z');
    expect(esquemaReprogramar.safeParse({ fisioterapeutaId: 'f', fecha: '', hora: '10:00' }).success).toBe(
      false,
    );
  });

  it('valida estados y UUID', () => {
    expect(esquemaEstado.safeParse('realizada').success).toBe(true);
    expect(esquemaEstado.safeParse('borrada').success).toBe(false);
    expect(esUuid(PACIENTE)).toBe(true);
    expect(esUuid('123')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import {
  esFechaValida,
  fechaLocal,
  horaLocal,
  instanteDesdeLocal,
  lunesDe,
  rangoDias,
  sumarDias,
} from '@/lib/fechas';

describe('fechas en hora de Madrid', () => {
  it('convierte hora local de verano e invierno a UTC', () => {
    expect(instanteDesdeLocal('2026-07-15', '10:00')?.toISOString()).toBe('2026-07-15T08:00:00.000Z');
    expect(instanteDesdeLocal('2026-01-15', '10:00')?.toISOString()).toBe('2026-01-15T09:00:00.000Z');
  });

  it('rechaza fechas y horas imposibles', () => {
    expect(instanteDesdeLocal('2026-02-30', '10:00')).toBeNull();
    expect(instanteDesdeLocal('2026-07-15', '25:00')).toBeNull();
    expect(esFechaValida('2026-13-01')).toBe(false);
    expect(esFechaValida('2026-02-28')).toBe(true);
  });

  it('el 29 de marzo de 2026 no existe la hora 02:30 y el día dura 23 horas', () => {
    expect(instanteDesdeLocal('2026-03-29', '02:30')).toBeNull();
    const { inicio, fin } = rangoDias('2026-03-29', 1);
    expect((fin.getTime() - inicio.getTime()) / 3_600_000).toBe(23);
    expect(horaLocal(instanteDesdeLocal('2026-03-29', '03:30')!)).toBe('03:30');
  });

  it('el 25 de octubre de 2026 el día dura 25 horas y 02:30 es la primera', () => {
    const { inicio, fin } = rangoDias('2026-10-25', 1);
    expect((fin.getTime() - inicio.getTime()) / 3_600_000).toBe(25);
    expect(instanteDesdeLocal('2026-10-25', '02:30')?.toISOString()).toBe('2026-10-25T00:30:00.000Z');
  });

  it('una cita a las 23:30 locales pertenece a ese día aunque en UTC sea el mismo o el anterior', () => {
    const instante = instanteDesdeLocal('2026-07-15', '00:30')!; // 22:30Z del día 14
    expect(instante.toISOString()).toBe('2026-07-14T22:30:00.000Z');
    expect(fechaLocal(instante)).toBe('2026-07-15');
  });

  it('calcula lunes y suma días por calendario', () => {
    expect(lunesDe('2026-10-21')).toBe('2026-10-19'); // miércoles
    expect(lunesDe('2026-10-25')).toBe('2026-10-19'); // domingo
    expect(lunesDe('2026-10-19')).toBe('2026-10-19');
    expect(sumarDias('2026-10-25', 1)).toBe('2026-10-26');
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('la semana que contiene el cambio de hora de octubre dura 7 días y 1 hora', () => {
    const { inicio, fin } = rangoDias('2026-10-19', 7);
    expect((fin.getTime() - inicio.getTime()) / 3_600_000).toBe(7 * 24 + 1);
  });
});

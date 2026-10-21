import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { migrar } from '@/lib/db/migrar';
import { citas, pacientes, registroActividad, user, type EstadoCita } from '@/lib/db/esquema';
import { ErrorPermiso } from '@/lib/datos/errores';
import {
  actualizar,
  citasDePaciente,
  contarCitas,
  crear,
  eliminar,
  exportar,
  listar,
  obtener,
  sinVolver,
} from '@/lib/datos/pacientes';

const AHORA = new Date('2026-10-21T10:00:00Z');
const DIA = 86_400_000;
const haceDias = (n: number) => new Date(AHORA.getTime() - n * DIA);
const enDias = (n: number) => new Date(AHORA.getTime() + n * DIA);

const admin = { id: 'u-admin', role: 'admin' };
const recepcion = { id: 'u-recepcion', role: 'user' };
const fisio = { id: 'u-fisio', role: 'user' };

async function paciente(nombre: string, creadoEn: Date = haceDias(500)) {
  const [fila] = await db
    .insert(pacientes)
    .values({ nombre, telefono: '600123456', creadoPor: admin.id, creadoEn })
    .returning({ id: pacientes.id });
  return fila.id;
}

async function cita(pacienteId: string, estado: EstadoCita, inicio: Date) {
  await db.insert(citas).values({
    pacienteId,
    fisioterapeutaId: fisio.id,
    inicio,
    fin: new Date(inicio.getTime() + 50 * 60_000),
    estado,
    motivo: 'Dolor lumbar',
    creadoPor: admin.id,
  });
}

const datos = (nombre: string) => ({
  nombre,
  telefono: '600123456',
  email: null,
  fechaNacimiento: null,
  notasClinicas: 'Nota reservada',
});

const nombresSinVolver = async (pagina = 1) =>
  (await sinVolver(admin, { ahora: AHORA, pagina })).filas.map((f) => f.nombre);

beforeAll(async () => {
  await migrar();
  for (const u of [admin, recepcion, fisio]) {
    await db.insert(user).values({ id: u.id, name: u.id, email: `${u.id}@pruebas.local`, role: u.role });
  }
});

describe('permisos', () => {
  it('user puede crear, listar, obtener y editar, pero no eliminar, exportar ni ver sin-volver', async () => {
    const id = await crear(recepcion, datos('Permisos Uno'));
    expect((await obtener(recepcion, id))?.nombre).toBe('Permisos Uno');
    expect(await actualizar(recepcion, id, datos('Permisos Dos'))).toBe(true);
    expect((await listar(recepcion)).total).toBeGreaterThan(0);
    await expect(eliminar(recepcion, id)).rejects.toBeInstanceOf(ErrorPermiso);
    await expect(exportar(recepcion, id)).rejects.toBeInstanceOf(ErrorPermiso);
    await expect(sinVolver(recepcion)).rejects.toBeInstanceOf(ErrorPermiso);
    expect(await obtener(admin, id)).not.toBeNull();
  });

  it('un usuario bloqueado o sin rol no puede nada', async () => {
    const bloqueado = { id: 'x', role: 'admin', banned: true };
    await expect(listar(bloqueado)).rejects.toBeInstanceOf(ErrorPermiso);
    await expect(crear({ id: 'x', role: null }, datos('Nadie Uno'))).rejects.toBeInstanceOf(ErrorPermiso);
  });

  it('crear, editar y eliminar registran actividad sin datos personales', async () => {
    const id = await crear(admin, datos('Actividad Uno'));
    await actualizar(admin, id, datos('Actividad Dos'));
    await eliminar(admin, id);
    const filas = await db.select().from(registroActividad).where(eq(registroActividad.registroId, id));
    expect(filas.map((f) => f.accion).sort()).toEqual([
      'paciente.crear',
      'paciente.editar',
      'paciente.eliminar',
    ]);
    expect(JSON.stringify(filas)).not.toContain('Actividad');
  });

  it('exportar (admin) devuelve notas y motivo y registra la exportación', async () => {
    const id = await crear(admin, datos('Exporta Uno'));
    await cita(id, 'realizada', haceDias(3));
    const r = await exportar(admin, id);
    expect(r?.paciente.notasClinicas).toBe('Nota reservada');
    expect(r?.citas[0].motivo).toBe('Dolor lumbar');
    const acciones = await db.select().from(registroActividad).where(eq(registroActividad.registroId, id));
    expect(acciones.map((a) => a.accion)).toContain('paciente.exportar');
  });
});

describe('listado y búsqueda', () => {
  it('ordena por nombre, no devuelve notas clínicas y busca por nombre o teléfono sin mayúsculas', async () => {
    await crear(admin, { ...datos('Zeta Orden'), telefono: '611000111' });
    await crear(admin, { ...datos('Alfa Orden'), telefono: '622000222' });
    const todos = await listar(admin, { busqueda: ' orden ' });
    expect(todos.filas.map((f) => f.nombre)).toEqual(['Alfa Orden', 'Zeta Orden']);
    expect(Object.keys(todos.filas[0])).not.toContain('notasClinicas');
    expect((await listar(admin, { busqueda: 'ALFA' })).total).toBe(1);
    expect((await listar(admin, { busqueda: '622000' })).filas[0].nombre).toBe('Alfa Orden');
  });

  it('trata % _ y \\ como texto', async () => {
    await crear(admin, datos('Cien%Por Ciento'));
    await crear(admin, datos('Guion_Bajo'));
    await crear(admin, datos('Guionxbajo'));
    await crear(admin, datos('Barra\\Inversa'));
    expect((await listar(admin, { busqueda: '%' })).filas.map((f) => f.nombre)).toEqual(['Cien%Por Ciento']);
    expect((await listar(admin, { busqueda: 'guion_' })).filas.map((f) => f.nombre)).toEqual(['Guion_Bajo']);
    expect((await listar(admin, { busqueda: '\\' })).filas.map((f) => f.nombre)).toEqual(['Barra\\Inversa']);
    expect((await listar(admin, { busqueda: 'zzz%' })).total).toBe(0);
  });

  it('pagina de 20 en 20', async () => {
    for (let i = 0; i < 25; i++) await crear(admin, datos(`Pagina ${String(i).padStart(2, '0')}`));
    const p1 = await listar(admin, { busqueda: 'Pagina ', pagina: 1 });
    const p2 = await listar(admin, { busqueda: 'Pagina ', pagina: 2 });
    expect(p1.filas).toHaveLength(20);
    expect(p2.filas).toHaveLength(5);
    expect(p1.paginas).toBe(2);
    expect(p2.filas[0].nombre).toBe('Pagina 20');
  });

  it('obtener devuelve null con ids no válidos o inexistentes', async () => {
    expect(await obtener(admin, 'no-es-uuid')).toBeNull();
    expect(await obtener(admin, crypto.randomUUID())).toBeNull();
    expect(await actualizar(admin, crypto.randomUUID(), datos('Nadie Dos'))).toBe(false);
    expect(await eliminar(admin, crypto.randomUUID())).toBe(false);
  });
});

describe('RN5 · pacientes sin volver', () => {
  it('aplica la regla de los 60 días exactos con la última cita realizada', async () => {
    const p61 = await paciente('Dias 61');
    await cita(p61, 'realizada', haceDias(61));
    const p60 = await paciente('Dias 60');
    await cita(p60, 'realizada', haceDias(60));
    const p59 = await paciente('Dias 59');
    await cita(p59, 'realizada', haceDias(59));
    const nombres = await nombresSinVolver();
    expect(nombres).toContain('Dias 61');
    expect(nombres).not.toContain('Dias 60');
    expect(nombres).not.toContain('Dias 59');
  });

  it('una cita programada futura lo excluye; una programada pasada no', async () => {
    const futura = await paciente('Con futura');
    await cita(futura, 'realizada', haceDias(90));
    await cita(futura, 'programada', enDias(2));
    const pasada = await paciente('Con programada pasada');
    await cita(pasada, 'realizada', haceDias(90));
    await cita(pasada, 'programada', haceDias(30));
    const nombres = await nombresSinVolver();
    expect(nombres).not.toContain('Con futura');
    expect(nombres).toContain('Con programada pasada');
  });

  it('sin citas cuenta la fecha de alta: reciente no, antigua sí', async () => {
    await paciente('Alta reciente', haceDias(10));
    await paciente('Alta antigua', haceDias(61));
    await paciente('Alta justo 60', haceDias(60));
    const nombres = await nombresSinVolver();
    expect(nombres).not.toContain('Alta reciente');
    expect(nombres).toContain('Alta antigua');
    expect(nombres).not.toContain('Alta justo 60');
  });

  it('canceladas y no presentado no cuentan; una realizada reciente sí cuenta', async () => {
    const canceladas = await paciente('Solo canceladas', haceDias(200));
    await cita(canceladas, 'cancelada', haceDias(5));
    await cita(canceladas, 'no_presentado', haceDias(4));
    const realizada = await paciente('Realizada reciente', haceDias(200));
    await cita(realizada, 'realizada', haceDias(5));
    const nombres = await nombresSinVolver();
    expect(nombres).toContain('Solo canceladas');
    expect(nombres).not.toContain('Realizada reciente');
  });

  it('ordena por referencia ascendente y calcula los días', async () => {
    const a = await paciente('Orden antiguo');
    await cita(a, 'realizada', haceDias(300));
    const b = await paciente('Orden medio');
    await cita(b, 'realizada', haceDias(250));
    const r = await sinVolver(admin, { ahora: AHORA });
    const nombres = r.filas.map((f) => f.nombre);
    expect(nombres.indexOf('Orden antiguo')).toBeLessThan(nombres.indexOf('Orden medio'));
    expect(r.filas.find((f) => f.nombre === 'Orden antiguo')?.dias).toBe(300);
    expect(r.filas.find((f) => f.nombre === 'Orden antiguo')?.ultimaRealizada).toEqual(haceDias(300));
  });

  it('pagina de 20 en 20', async () => {
    for (let i = 0; i < 21; i++) await paciente(`Antiguo pag ${i}`, haceDias(1000));
    const p1 = await sinVolver(admin, { ahora: AHORA, pagina: 1 });
    const p2 = await sinVolver(admin, { ahora: AHORA, pagina: 2 });
    expect(p1.filas).toHaveLength(20);
    expect(p2.filas.length).toBeGreaterThan(0);
    expect(p1.paginas).toBeGreaterThanOrEqual(2);
  });
});

describe('eliminación', () => {
  it('borra el paciente y sus citas en cascada; la ficha no incluye motivo', async () => {
    const id = await paciente('Cascada');
    await cita(id, 'realizada', haceDias(5));
    await cita(id, 'programada', enDias(5));
    expect(await contarCitas(admin, id)).toBe(2);
    const lista = await citasDePaciente(admin, id);
    expect(lista).toHaveLength(2);
    expect(Object.keys(lista[0])).not.toContain('motivo');
    expect(lista[0].fisioterapeuta).toBe(fisio.id);
    expect(await eliminar(admin, id)).toBe(true);
    expect(await obtener(admin, id)).toBeNull();
    expect(await db.select().from(citas).where(eq(citas.pacienteId, id))).toHaveLength(0);
  });
});

describe('RN5 · límite en días de calendario de Madrid', () => {
  it('60 días y unos minutos de reloj siguen siendo «60 días»; el día 61 cuenta desde las 00:00 locales', async () => {
    // AHORA = 21/10/2026 12:00 en Madrid. «Hoy menos 60 días» = 22/08/2026.
    const p1 = await paciente('Limite A');
    await cita(p1, 'realizada', new Date('2026-08-22T06:00:00Z')); // 22/08 08:00 local: 60 días → no
    const p2 = await paciente('Limite B');
    await cita(p2, 'realizada', new Date('2026-08-21T21:59:00Z')); // 21/08 23:59 local: 61 días → sí
    const todas = [];
    for (let pagina = 1, paginas = 1; pagina <= paginas; pagina++) {
      const r = await sinVolver(admin, { ahora: AHORA, pagina });
      todas.push(...r.filas);
      paginas = r.paginas;
    }
    const nombres = todas.map((f) => f.nombre);
    expect(nombres).not.toContain('Limite A');
    expect(nombres).toContain('Limite B');
    expect(todas.find((f) => f.nombre === 'Limite B')?.dias).toBe(61);
  });
});

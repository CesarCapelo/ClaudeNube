import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { migrar } from '@/lib/db/migrar';
import { citas, pacientes, profesionales, registroActividad, user } from '@/lib/db/esquema';
import {
  buscarPacientes,
  cambiarEstadoCita,
  crearCita,
  eliminarCita,
  listarCitasDeRango,
  obtenerCita,
  reprogramarCita,
} from '@/lib/datos/citas';
import { ErrorNegocio, ErrorPermiso } from '@/lib/datos/errores';
import { instanteDesdeLocal, rangoDias, horaLocal } from '@/lib/fechas';

const admin = { id: 'u-admin', role: 'admin' };
const recepcion = { id: 'u-recepcion', role: 'user' };
const fisioA = 'u-fisio-a';
const fisioB = 'u-fisio-b';
let paciente: string;
let otroPaciente: string;

const local = (fecha: string, hora: string) => instanteDesdeLocal(fecha, hora)!;
const cita = (fisio: string, fecha: string, hora: string, duracionMin = 50, pacienteId = paciente) => ({
  pacienteId,
  fisioterapeutaId: fisio,
  inicio: local(fecha, hora),
  duracionMin,
});

beforeAll(async () => {
  await migrar();
  await db.insert(user).values([
    { id: admin.id, name: 'Admin', email: 'admin@t.local', role: 'admin' },
    { id: recepcion.id, name: 'Recepción', email: 'rec@t.local', role: 'user' },
    { id: fisioA, name: 'Fisio A', email: 'a@t.local', role: 'user' },
    { id: fisioB, name: 'Fisio B', email: 'b@t.local', role: 'user' },
    { id: 'u-bloqueado', name: 'Fisio bloqueado', email: 'bl@t.local', role: 'user', banned: true },
  ]);
  await db
    .insert(profesionales)
    .values([{ usuarioId: fisioA }, { usuarioId: fisioB }, { usuarioId: 'u-bloqueado' }]);
  const filas = await db
    .insert(pacientes)
    .values([
      { nombre: 'Paciente Uno', telefono: '600111222', notasClinicas: 'SECRETO', creadoPor: admin.id },
      { nombre: 'Paciente Dos', telefono: '600333444', creadoPor: admin.id },
      { nombre: '100% Raro_Nombre', telefono: '600555666', creadoPor: admin.id },
      { nombre: '100X Raro-Nombre', telefono: '600777888', creadoPor: admin.id },
    ])
    .returning({ id: pacientes.id });
  paciente = filas[0].id;
  otroPaciente = filas[1].id;
});

describe('RN1 · solapes', () => {
  it('rechaza un solape parcial con el mensaje de horas y sin nombres', async () => {
    await crearCita(recepcion, cita(fisioA, '2030-01-07', '10:00'));
    const error = await crearCita(recepcion, cita(fisioA, '2030-01-07', '10:30', 50, otroPaciente)).catch(
      (e) => e,
    );
    expect(error).toBeInstanceOf(ErrorNegocio);
    expect(error.message).toBe('Ese fisioterapeuta ya tiene una cita de 10:00 a 10:50');
    expect(error.message).not.toContain('Paciente');
  });

  it('rechaza una cita contenida en otra y una que contiene a otra', async () => {
    await crearCita(recepcion, cita(fisioA, '2030-01-08', '10:00', 60));
    await expect(crearCita(recepcion, cita(fisioA, '2030-01-08', '10:10', 20))).rejects.toThrow(ErrorNegocio);
    await expect(crearCita(recepcion, cita(fisioA, '2030-01-08', '09:30', 120))).rejects.toThrow(
      ErrorNegocio,
    );
  });

  it('permite una cita contigua (10:00-10:50 y 10:50) y la anterior que termina justo al empezar', async () => {
    await crearCita(recepcion, cita(fisioA, '2030-01-09', '10:00'));
    await expect(crearCita(recepcion, cita(fisioA, '2030-01-09', '10:50'))).resolves.toBeTruthy();
    await expect(crearCita(recepcion, cita(fisioA, '2030-01-09', '09:10'))).resolves.toBeTruthy();
  });

  it('permite la misma hora con otro fisioterapeuta', async () => {
    await crearCita(recepcion, cita(fisioA, '2030-01-10', '10:00'));
    await expect(crearCita(recepcion, cita(fisioB, '2030-01-10', '10:00'))).resolves.toBeTruthy();
  });

  it('una cita cancelada libera la franja y una no presentada tampoco bloquea', async () => {
    const id = await crearCita(recepcion, cita(fisioA, '2030-01-11', '10:00'));
    await cambiarEstadoCita(recepcion, id, 'cancelada');
    const otra = await crearCita(recepcion, cita(fisioA, '2030-01-11', '10:00'));
    expect(otra).toBeTruthy();
    const pasada = await crearCita(recepcion, cita(fisioA, '2020-01-11', '10:00'));
    await cambiarEstadoCita(recepcion, pasada, 'no_presentado', new Date('2030-01-01T00:00:00Z'));
    await expect(crearCita(recepcion, cita(fisioA, '2020-01-11', '10:00'))).resolves.toBeTruthy();
  });

  it('una cita realizada sí bloquea la franja', async () => {
    const id = await crearCita(recepcion, cita(fisioA, '2020-02-03', '10:00'));
    await cambiarEstadoCita(recepcion, id, 'realizada', new Date('2030-01-01T00:00:00Z'));
    await expect(crearCita(recepcion, cita(fisioA, '2020-02-03', '10:20'))).rejects.toThrow(ErrorNegocio);
  });

  it('reprogramar contra otra cita se rechaza, pero no contra sí misma', async () => {
    await crearCita(recepcion, cita(fisioA, '2030-01-14', '10:00'));
    const id = await crearCita(recepcion, cita(fisioA, '2030-01-14', '12:00'));
    await expect(reprogramarCita(recepcion, id, cita(fisioA, '2030-01-14', '10:30'))).rejects.toThrow(
      'Ese fisioterapeuta ya tiene una cita de 10:00 a 10:50',
    );
    // Solaparse con su propia franja anterior es válido (se desplaza 10 minutos).
    await reprogramarCita(recepcion, id, cita(fisioA, '2030-01-14', '12:10'));
    const [fila] = await db.select().from(citas).where(eq(citas.id, id));
    expect(horaLocal(fila.inicio)).toBe('12:10');
    expect(horaLocal(fila.fin)).toBe('13:00');
  });

  it('reprogramar a otro fisioterapeuta aplica RN1 sobre el nuevo', async () => {
    await crearCita(recepcion, cita(fisioB, '2030-01-15', '10:00'));
    const id = await crearCita(recepcion, cita(fisioA, '2030-01-15', '10:00'));
    await expect(reprogramarCita(recepcion, id, cita(fisioB, '2030-01-15', '10:00'))).rejects.toThrow(
      ErrorNegocio,
    );
    await reprogramarCita(recepcion, id, cita(fisioB, '2030-01-15', '11:00'));
    expect((await obtenerCita(recepcion, id))?.fisioterapeutaId).toBe(fisioB);
  });

  it('volver a programada o a realizada con solape se rechaza', async () => {
    const ahora = new Date('2030-06-01T00:00:00Z');
    const id = await crearCita(recepcion, cita(fisioA, '2030-01-16', '10:00'));
    await cambiarEstadoCita(recepcion, id, 'cancelada');
    await crearCita(recepcion, cita(fisioA, '2030-01-16', '10:20'));
    await expect(cambiarEstadoCita(recepcion, id, 'programada', ahora)).rejects.toThrow(
      /^Ese fisioterapeuta ya tiene una cita de 10:20 a 11:10$/,
    );
    await expect(cambiarEstadoCita(recepcion, id, 'realizada', ahora)).rejects.toThrow(ErrorNegocio);
    expect((await obtenerCita(recepcion, id))?.estado).toBe('cancelada');
  });

  it('dos creaciones simultáneas de la misma franja: solo una se guarda', async () => {
    const resultados = await Promise.allSettled([
      crearCita(recepcion, cita(fisioB, '2030-02-04', '10:00')),
      crearCita(recepcion, cita(fisioB, '2030-02-04', '10:00', 50, otroPaciente)),
    ]);
    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rechazada = resultados.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect(rechazada.reason).toBeInstanceOf(ErrorNegocio);
    const { inicio, fin } = rangoDias('2030-02-04', 1);
    const guardadas = await listarCitasDeRango(admin, {
      fisioterapeutaId: fisioB,
      desde: inicio,
      hasta: fin,
    });
    expect(guardadas).toHaveLength(1);
  });
});

describe('RN2 · estados', () => {
  const ahora = new Date('2030-03-10T12:00:00Z');

  it('realizada y no_presentado solo si la cita ya ha empezado', async () => {
    const futura = await crearCita(recepcion, cita(fisioA, '2030-03-10', '14:00')); // 13:00Z > ahora
    const mensaje = 'Solo se puede marcar así una cita que ya ha empezado.';
    await expect(cambiarEstadoCita(recepcion, futura, 'realizada', ahora)).rejects.toThrow(mensaje);
    await expect(cambiarEstadoCita(recepcion, futura, 'no_presentado', ahora)).rejects.toThrow(mensaje);
    const pasada = await crearCita(recepcion, cita(fisioA, '2030-03-10', '10:00')); // 09:00Z < ahora
    await cambiarEstadoCita(recepcion, pasada, 'realizada', ahora);
    expect((await obtenerCita(recepcion, pasada))?.estado).toBe('realizada');
  });

  it('cancelada se admite siempre y el cambio de estado queda registrado sin datos personales', async () => {
    const id = await crearCita(recepcion, cita(fisioA, '2030-03-11', '14:00'));
    await cambiarEstadoCita(recepcion, id, 'cancelada', ahora);
    const registros = await db.select().from(registroActividad).where(eq(registroActividad.registroId, id));
    expect(registros.map((r) => r.accion).sort()).toEqual(['cita.crear', 'cita.estado']);
    expect(JSON.stringify(registros)).not.toContain('Paciente');
  });

  it('una cita ya realizada no se puede mover al futuro', async () => {
    const id = await crearCita(recepcion, cita(fisioA, '2030-03-09', '10:00'));
    await cambiarEstadoCita(recepcion, id, 'realizada', ahora);
    await expect(reprogramarCita(recepcion, id, cita(fisioA, '2030-03-12', '10:00'), ahora)).rejects.toThrow(
      ErrorNegocio,
    );
  });

  it('una cita inexistente o con id inválido falla con error de negocio', async () => {
    await expect(cambiarEstadoCita(recepcion, 'no-uuid', 'cancelada')).rejects.toThrow(ErrorNegocio);
    await expect(cambiarEstadoCita(recepcion, crypto.randomUUID(), 'cancelada')).rejects.toThrow(
      ErrorNegocio,
    );
    expect(await obtenerCita(recepcion, 'no-uuid')).toBeNull();
    expect(await obtenerCita(recepcion, crypto.randomUUID())).toBeNull();
  });
});

describe('permisos y validaciones de datos', () => {
  it('solo la administración elimina citas', async () => {
    const id = await crearCita(recepcion, cita(fisioA, '2030-04-01', '10:00'));
    await expect(eliminarCita(recepcion, id)).rejects.toThrow(ErrorPermiso);
    expect(await obtenerCita(recepcion, id)).not.toBeNull();
    await eliminarCita(admin, id);
    expect(await obtenerCita(admin, id)).toBeNull();
    const registros = await db.select().from(registroActividad).where(eq(registroActividad.registroId, id));
    expect(registros.map((r) => r.accion)).toContain('cita.eliminar');
  });

  it('rechaza roles sin permiso y cuentas bloqueadas', async () => {
    const sinRol = { id: 'x', role: null };
    await expect(crearCita(sinRol, cita(fisioA, '2030-04-02', '10:00'))).rejects.toThrow(ErrorPermiso);
    await expect(
      listarCitasDeRango(sinRol, { fisioterapeutaId: fisioA, desde: new Date(), hasta: new Date() }),
    ).rejects.toThrow(ErrorPermiso);
    await expect(
      crearCita({ ...recepcion, banned: true }, cita(fisioA, '2030-04-02', '10:00')),
    ).rejects.toThrow(ErrorPermiso);
  });

  it('el fisioterapeuta debe existir, atender citas y no estar bloqueado', async () => {
    await expect(crearCita(recepcion, cita('no-existe', '2030-04-03', '10:00'))).rejects.toThrow(
      ErrorNegocio,
    );
    await expect(crearCita(recepcion, cita(recepcion.id, '2030-04-03', '10:00'))).rejects.toThrow(
      ErrorNegocio,
    );
    await expect(crearCita(recepcion, cita('u-bloqueado', '2030-04-03', '10:00'))).rejects.toThrow(
      ErrorNegocio,
    );
  });

  it('el paciente debe existir y la duración estar entre 10 y 180', async () => {
    await expect(
      crearCita(recepcion, cita(fisioA, '2030-04-04', '10:00', 50, crypto.randomUUID())),
    ).rejects.toThrow('El paciente no existe.');
    await expect(crearCita(recepcion, cita(fisioA, '2030-04-04', '10:00', 50, 'no-uuid'))).rejects.toThrow(
      ErrorNegocio,
    );
    await expect(crearCita(recepcion, cita(fisioA, '2030-04-04', '10:00', 5))).rejects.toThrow(ErrorNegocio);
    await expect(crearCita(recepcion, cita(fisioA, '2030-04-04', '10:00', 181))).rejects.toThrow(
      ErrorNegocio,
    );
  });

  it('obtenerCita devuelve el motivo y los datos del paciente y del fisioterapeuta', async () => {
    const id = await crearCita(recepcion, { ...cita(fisioA, '2030-04-05', '10:00'), motivo: 'Cervicalgia' });
    const detalle = await obtenerCita(recepcion, id);
    expect(detalle).toMatchObject({
      motivo: 'Cervicalgia',
      pacienteNombre: 'Paciente Uno',
      fisioterapeutaNombre: 'Fisio A',
      duracionMin: 50,
      estado: 'programada',
    });
  });
});

describe('agenda y búsqueda', () => {
  it('listarCitasDeRango ordena por hora y no devuelve motivo ni notas', async () => {
    await crearCita(recepcion, { ...cita(fisioA, '2030-05-06', '12:00'), motivo: 'MOTIVO SECRETO' });
    await crearCita(recepcion, cita(fisioA, '2030-05-06', '09:00', 50, otroPaciente));
    const { inicio, fin } = rangoDias('2030-05-06', 1);
    const filas = await listarCitasDeRango(recepcion, {
      fisioterapeutaId: fisioA,
      desde: inicio,
      hasta: fin,
    });
    expect(filas.map((f) => horaLocal(f.inicio))).toEqual(['09:00', '12:00']);
    expect(JSON.stringify(filas)).not.toMatch(/SECRETO|motivo/);
    expect(Object.keys(filas[0]).sort()).toEqual([
      'estado',
      'fin',
      'id',
      'inicio',
      'pacienteId',
      'pacienteNombre',
    ]);
  });

  it('el 29 de marzo y el 25 de octubre de 2026 las citas salen en el día y la hora correctos', async () => {
    for (const [fecha, horas] of [
      ['2026-03-29', ['00:30', '01:30', '03:00', '23:30']],
      ['2026-10-25', ['00:30', '02:00', '02:30', '23:30']],
    ] as const) {
      for (const h of horas) await crearCita(recepcion, cita(fisioB, fecha, h, 30));
      const { inicio, fin } = rangoDias(fecha, 1);
      const filas = await listarCitasDeRango(recepcion, {
        fisioterapeutaId: fisioB,
        desde: inicio,
        hasta: fin,
      });
      expect(filas.map((f) => horaLocal(f.inicio))).toEqual([...horas]);
      // Ninguna se cuela en el día anterior ni en el siguiente.
      const dia = (d: string) => rangoDias(d, 1);
      const [anterior, siguiente] = [
        dia(fecha === '2026-03-29' ? '2026-03-28' : '2026-10-24'),
        dia(fecha === '2026-03-29' ? '2026-03-30' : '2026-10-26'),
      ];
      for (const r of [anterior, siguiente]) {
        expect(
          await listarCitasDeRango(recepcion, { fisioterapeutaId: fisioB, desde: r.inicio, hasta: r.fin }),
        ).toHaveLength(0);
      }
    }
  });

  it('buscarPacientes busca por nombre o teléfono, escapa % y _ y limita a 10', async () => {
    expect((await buscarPacientes(recepcion, 'paciente uno')).map((p) => p.nombre)).toEqual(['Paciente Uno']);
    expect((await buscarPacientes(recepcion, '600333')).map((p) => p.nombre)).toEqual(['Paciente Dos']);
    expect((await buscarPacientes(recepcion, '100%')).map((p) => p.nombre)).toEqual(['100% Raro_Nombre']);
    expect((await buscarPacientes(recepcion, 'Raro_N')).map((p) => p.nombre)).toEqual(['100% Raro_Nombre']);
    expect(await buscarPacientes(recepcion, '   ')).toEqual([]);
    const resultado = await buscarPacientes(recepcion, 'Paciente Uno');
    expect(Object.keys(resultado[0]).sort()).toEqual(['id', 'nombre', 'telefono']);
    await db.insert(pacientes).values(
      Array.from({ length: 12 }, (_, i) => ({
        nombre: `Masivo ${i}`,
        telefono: '699000000',
        creadoPor: admin.id,
      })),
    );
    expect(await buscarPacientes(recepcion, 'Masivo')).toHaveLength(10);
  });
});

describe('RN3 y RN4 · pasado y fisioterapeutas bloqueados', () => {
  it('se puede crear una cita en el pasado y queda programada', async () => {
    const id = await crearCita(recepcion, cita(fisioA, '2020-05-04', '09:00'));
    const [fila] = await db.select().from(citas).where(eq(citas.id, id));
    expect(fila.estado).toBe('programada');
  });

  it('una cita de un fisioterapeuta bloqueado puede cambiar de hora, pero no reasignarse a otro bloqueado', async () => {
    const [{ id }] = await db
      .insert(citas)
      .values({
        pacienteId: paciente,
        fisioterapeutaId: 'u-bloqueado',
        inicio: local('2030-03-04', '10:00'),
        fin: local('2030-03-04', '10:50'),
        creadoPor: admin.id,
      })
      .returning({ id: citas.id });
    await reprogramarCita(recepcion, id, cita('u-bloqueado', '2030-03-04', '11:00'));
    expect(horaLocal((await obtenerCita(recepcion, id))!.inicio)).toBe('11:00');
    await expect(crearCita(recepcion, cita('u-bloqueado', '2030-03-05', '11:00'))).rejects.toThrow(
      'Elige un fisioterapeuta que atienda citas.',
    );
  });

  it('dos reprogramaciones cruzadas (A→B y B→A) a la vez no se bloquean entre sí', async () => {
    const deA = await crearCita(recepcion, cita(fisioA, '2030-04-01', '10:00'));
    const deB = await crearCita(recepcion, cita(fisioB, '2030-04-01', '12:00', 50, otroPaciente));
    const resultados = await Promise.allSettled([
      reprogramarCita(recepcion, deA, cita(fisioB, '2030-04-01', '15:00')),
      reprogramarCita(recepcion, deB, cita(fisioA, '2030-04-01', '15:00', 50, otroPaciente)),
    ]);
    expect(resultados.map((r) => r.status)).toEqual(['fulfilled', 'fulfilled']);
  });
});

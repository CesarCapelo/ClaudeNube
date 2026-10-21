// Esquema de la base de datos (Drizzle ORM sobre PostgreSQL).
// Las tablas de autenticación están en esquema-auth.ts (generadas para Better Auth).
// Cada cambio se acompaña de su migración: `npm run db:generar -- --name <cambio>`.
import { sql } from 'drizzle-orm';
import { check, date, index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './esquema-auth';

export * from './esquema-auth';

export const ESTADOS_CITA = ['programada', 'realizada', 'cancelada', 'no_presentado'] as const;
export type EstadoCita = (typeof ESTADOS_CITA)[number];

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const marcasDeTiempo = {
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** Cuentas que atienden citas (fisioterapeutas). Una cuenta sin fila aquí no aparece al crear citas. */
export const profesionales = pgTable('profesionales', {
  usuarioId: text('usuario_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
});

/** Pacientes. `notasClinicas` es un dato de salud: nunca se selecciona en listados ni se registra. */
export const pacientes = pgTable(
  'pacientes',
  {
    id: id(),
    nombre: text('nombre').notNull(),
    telefono: text('telefono').notNull(),
    email: text('email'),
    fechaNacimiento: date('fecha_nacimiento', { mode: 'string' }),
    notasClinicas: text('notas_clinicas'),
    creadoPor: text('creado_por')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    ...marcasDeTiempo,
  },
  (tabla) => [
    index('pacientes_nombre_idx').on(tabla.nombre),
    index('pacientes_telefono_idx').on(tabla.telefono),
  ],
);

/** Citas. Al borrar un paciente se borran sus citas (derecho de supresión). */
export const citas = pgTable(
  'citas',
  {
    id: id(),
    pacienteId: text('paciente_id')
      .notNull()
      .references(() => pacientes.id, { onDelete: 'cascade' }),
    fisioterapeutaId: text('fisioterapeuta_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    inicio: timestamp('inicio', { withTimezone: true }).notNull(),
    /** inicio + duración, guardado para consultar solapes sin aritmética en cada consulta. */
    fin: timestamp('fin', { withTimezone: true }).notNull(),
    duracionMin: integer('duracion_min').notNull().default(50),
    estado: text('estado', { enum: ESTADOS_CITA }).notNull().default('programada'),
    motivo: text('motivo'),
    creadoPor: text('creado_por')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    ...marcasDeTiempo,
  },
  (tabla) => [
    index('citas_fisio_inicio_idx').on(tabla.fisioterapeutaId, tabla.inicio),
    index('citas_paciente_inicio_idx').on(tabla.pacienteId, tabla.inicio),
    check('citas_duracion_ck', sql`${tabla.duracionMin} between 10 and 180`),
    check('citas_fin_ck', sql`${tabla.fin} > ${tabla.inicio}`),
    check('citas_estado_ck', sql`${tabla.estado} in ('programada','realizada','cancelada','no_presentado')`),
  ],
);

/** Registro de actividad sobre datos de salud: solo identificadores, nunca datos personales. */
export const registroActividad = pgTable(
  'registro_actividad',
  {
    id: id(),
    usuarioId: text('usuario_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    accion: text('accion').notNull(),
    tipo: text('tipo').notNull(),
    registroId: text('registro_id').notNull(),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (tabla) => [index('registro_actividad_creado_idx').on(tabla.creadoEn)],
);

export type Paciente = typeof pacientes.$inferSelect;
export type NuevoPaciente = typeof pacientes.$inferInsert;
export type Cita = typeof citas.$inferSelect;
export type NuevaCita = typeof citas.$inferInsert;

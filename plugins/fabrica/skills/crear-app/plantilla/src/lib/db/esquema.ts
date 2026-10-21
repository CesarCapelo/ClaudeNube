// Esquema de la base de datos (Drizzle ORM sobre PostgreSQL).
// Las tablas de autenticación están en esquema-auth.ts (generadas para Better Auth).
// Cada tabla de negocio nueva se define aquí y se genera su migración con `npm run db:generar`.
import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './esquema-auth';

export * from './esquema-auth';

// Ejemplo de entidad de negocio: sirve de patrón para las demás (ver src/app/(app)/clientes).
export const clientes = pgTable(
  'clientes',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    nombre: text('nombre').notNull(),
    email: text('email'),
    telefono: text('telefono'),
    notas: text('notas'),
    creadoPor: text('creado_por')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
    actualizadoEn: timestamp('actualizado_en', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (tabla) => [index('clientes_nombre_idx').on(tabla.nombre)],
);

export type Cliente = typeof clientes.$inferSelect;
export type NuevoCliente = typeof clientes.$inferInsert;

import 'server-only';
import { mkdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePg, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { Pool } from 'pg';
import * as esquema from './esquema';

// DATABASE_URL decide el motor:
// - postgres://… o postgresql://…  → PostgreSQL real (producción, Supabase, Neon…)
// - pglite://<carpeta>             → PostgreSQL embebido en disco (desarrollo y pruebas)
// - pglite://memoria               → PostgreSQL embebido en memoria
export const urlBaseDatos = process.env.DATABASE_URL ?? 'pglite://.datos/desarrollo';
export const esPglite = !urlBaseDatos.startsWith('postgres');

type BaseDatos = NodePgDatabase<typeof esquema>;

function crearConexion(): BaseDatos {
  if (!esPglite) {
    const pool = new Pool({ connectionString: urlBaseDatos, max: 10 });
    return drizzlePg(pool, { schema: esquema });
  }
  const destino = urlBaseDatos.replace(/^pglite:\/\//, '');
  if (destino !== 'memoria') mkdirSync(destino, { recursive: true });
  const cliente = destino === 'memoria' ? new PGlite() : new PGlite(destino);
  // La API de consultas es la misma; solo cambia el controlador.
  return drizzlePglite(cliente, { schema: esquema }) as unknown as BaseDatos;
}

// Una única conexión por proceso (también entre recargas del servidor de desarrollo), creada
// en la primera consulta: así compilar la aplicación no abre la base de datos.
const global = globalThis as unknown as { __baseDatos?: BaseDatos };
const conexion = () => (global.__baseDatos ??= crearConexion());

export const db = new Proxy({} as BaseDatos, {
  get(_destino, propiedad) {
    const real = conexion();
    const valor = Reflect.get(real, propiedad, real);
    return typeof valor === 'function' ? valor.bind(real) : valor;
  },
});

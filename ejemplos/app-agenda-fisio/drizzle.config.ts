import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL ?? 'pglite://.datos/desarrollo';
const pglite = !url.startsWith('postgres');

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/db/esquema.ts',
  out: './drizzle',
  casing: 'snake_case',
  ...(pglite
    ? { driver: 'pglite', dbCredentials: { url: url.replace(/^pglite:\/\//, '') } }
    : { dbCredentials: { url } }),
});

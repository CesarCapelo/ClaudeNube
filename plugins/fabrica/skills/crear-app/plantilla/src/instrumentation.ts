// Se ejecuta una vez al arrancar el servidor de Next.js.
// Con PGlite (desarrollo y pruebas) aplica las migraciones automáticamente.
// En producción (PostgreSQL), las migraciones se aplican en el despliegue con `npm run db:migrar`.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  const { esPglite } = await import('./lib/db');
  if (!esPglite) return;
  const { migrar } = await import('./lib/db/migrar');
  await migrar();
}

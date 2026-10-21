#!/usr/bin/env node
// Auditoría completa de la aplicación compilada, con sesión de administración.
// 1. Arranca `next start` con una base de datos en memoria.
// 2. Crea la cuenta administradora con la preparación de Playwright y guarda la sesión.
// 3. Ejecuta scripts/auditar-ui.mjs sobre las rutas indicadas (capturas, accesibilidad, Lighthouse…).
// 4. Para el servidor.
//
// Uso: npm run build && node scripts/auditar-app.mjs [--rutas /panel,/clientes] [--lighthouse] [otras opciones de auditar-ui]
// Requiere haber compilado antes (npm run build).
import { spawn, spawnSync } from 'node:child_process';

const PUERTO = process.env.PUERTO_PRUEBAS ?? '3100';
const URL_BASE = `http://localhost:${PUERTO}`;
const RUTAS_POR_DEFECTO = '/panel,/clientes,/clientes/nuevo,/usuarios,/entrar,/privacidad';

const argumentos = process.argv.slice(2);
if (!argumentos.includes('--rutas')) argumentos.push('--rutas', RUTAS_POR_DEFECTO);

const entorno = {
  ...process.env,
  DATABASE_URL: 'pglite://memoria',
  BETTER_AUTH_SECRET: 'secreto-solo-para-pruebas-automaticas-0000',
  BETTER_AUTH_URL: URL_BASE,
  PRUEBAS_E2E: 'true',
  PUERTO_PRUEBAS: PUERTO,
};

const servidor = spawn('npx', ['next', 'start', '-p', PUERTO], {
  env: entorno,
  stdio: 'ignore',
  detached: true,
});
const parar = () => {
  try {
    process.kill(-servidor.pid);
  } catch {}
};
process.on('exit', parar);

let listo = false;
for (let i = 0; i < 60 && !listo; i++) {
  await new Promise((r) => setTimeout(r, 1000));
  listo = await fetch(`${URL_BASE}/api/salud`).then(
    (r) => r.ok,
    () => false,
  );
}
if (!listo) {
  console.error('El servidor no arrancó. ¿Has ejecutado npm run build?');
  process.exit(2);
}

const preparacion = spawnSync('npx', ['playwright', 'test', '--project=preparacion', '--reporter=line'], {
  env: entorno,
  stdio: 'inherit',
});
if (preparacion.status !== 0) {
  console.error('No se pudo preparar la sesión de administración.');
  process.exit(2);
}

const auditoria = spawnSync(
  'node',
  [
    'scripts/auditar-ui.mjs',
    '--url',
    URL_BASE,
    '--estado-sesion',
    'tests/e2e/.auth/admin.json',
    ...argumentos,
  ],
  { env: entorno, stdio: 'inherit' },
);
process.exit(auditoria.status ?? 2);

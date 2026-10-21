import { existsSync } from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const puerto = Number(process.env.PUERTO_PRUEBAS ?? 3100);
const url = `http://localhost:${puerto}`;

// Chromium a usar: PW_CHROMIUM_PATH, o el «chromium» preinstalado en PLAYWRIGHT_BROWSERS_PATH
// (entornos en la nube), o el que instala `npx playwright install chromium`.
const preinstalado = process.env.PLAYWRIGHT_BROWSERS_PATH
  ? path.join(process.env.PLAYWRIGHT_BROWSERS_PATH, 'chromium')
  : null;
const chromiumLocal =
  process.env.PW_CHROMIUM_PATH || (preinstalado && existsSync(preinstalado) ? preinstalado : undefined);

export const SESION_ADMIN = 'tests/e2e/.auth/admin.json';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: url,
    locale: 'es-ES',
    trace: 'retain-on-failure',
    ...(chromiumLocal && { launchOptions: { executablePath: chromiumLocal } }),
  },
  projects: [
    { name: 'preparacion', testMatch: /preparacion\.setup\.ts/ },
    {
      name: 'escritorio',
      use: { ...devices['Desktop Chrome'], storageState: SESION_ADMIN },
      dependencies: ['preparacion'],
    },
    {
      name: 'movil',
      use: { ...devices['Pixel 7'], storageState: SESION_ADMIN },
      dependencies: ['preparacion'],
    },
  ],
  // La aplicación compilada (npm run build) con una base de datos en memoria, vacía en cada arranque.
  webServer: {
    command: `npm run start -- -p ${puerto}`,
    url: `${url}/api/salud`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: 'pglite://memoria',
      BETTER_AUTH_SECRET: 'secreto-solo-para-pruebas-automaticas-0000',
      BETTER_AUTH_URL: url,
      PRUEBAS_E2E: 'true',
    },
  },
});

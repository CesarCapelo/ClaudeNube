import { existsSync } from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const puerto = Number(process.env.PUERTO_PRUEBAS ?? 4321);
// Chromium a usar: PW_CHROMIUM_PATH, o el «chromium» preinstalado en PLAYWRIGHT_BROWSERS_PATH
// (entornos en la nube), o el que instala `npx playwright install chromium`.
const preinstalado = process.env.PLAYWRIGHT_BROWSERS_PATH
  ? path.join(process.env.PLAYWRIGHT_BROWSERS_PATH, 'chromium')
  : null;
const chromiumLocal =
  process.env.PW_CHROMIUM_PATH ||
  (preinstalado && existsSync(preinstalado) ? preinstalado : undefined);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${puerto}`,
    trace: 'retain-on-failure',
    ...(chromiumLocal && { launchOptions: { executablePath: chromiumLocal } }),
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'movil', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // --ignore-lock mantiene el servidor en primer plano: Astro lo manda a segundo plano si detecta un agente.
    command: `npm run preview -- --port ${puerto} --ignore-lock`,
    url: `http://localhost:${puerto}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});

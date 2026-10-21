import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PRIVADAS = [
  '/agenda',
  '/pacientes',
  '/pacientes/nuevo',
  '/pacientes/sin-volver',
  '/citas/nueva',
  '/usuarios',
  '/actividad',
];
const PUBLICAS = ['/entrar', '/privacidad'];

async function comprobar(page: Page, ruta: string) {
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errores.push(m.text());
  });
  await page.goto(ruta);
  await expect(page.locator('h1')).toHaveCount(1);
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const graves = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(graves.map((v) => `${v.id}: ${v.help} → ${v.nodes[0]?.target}`)).toEqual([]);
  expect(errores).toEqual([]);
}

for (const ruta of PRIVADAS) {
  test(`${ruta} es accesible y no tiene errores`, async ({ page }) => comprobar(page, ruta));
}

test.describe('páginas públicas', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  for (const ruta of PUBLICAS) {
    test(`${ruta} es accesible y no tiene errores`, async ({ page }) => comprobar(page, ruta));
  }
});

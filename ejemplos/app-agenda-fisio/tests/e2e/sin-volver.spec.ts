import { test, expect } from '@playwright/test';
import { SESION_RECEPCION } from '../../playwright.config';
import { unico } from './datos';

// Los casos de fechas (61, 60, 59 días…) se prueban en la integración con `ahora` inyectable.

test('H5 · la administración ve la página y un paciente recién creado no aparece', async ({ page }) => {
  const nombre = unico('Paciente Reciente');
  await page.goto('/pacientes/nuevo');
  await page.getByLabel('Nombre').fill(nombre);
  await page.getByLabel('Teléfono').fill('600 000 111');
  await page.getByRole('button', { name: 'Guardar paciente' }).click();
  await expect(page).toHaveURL(/\/pacientes\?aviso=guardado$/);

  await page.goto('/pacientes/sin-volver');
  await expect(page.getByRole('heading', { level: 1, name: 'Pacientes sin volver' })).toBeVisible();
  await expect(page.getByRole('link', { name: nombre })).toHaveCount(0);
  await expect(
    page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Sin volver' }),
  ).toBeVisible();
});

test.describe('recepción (rol user)', () => {
  test.use({ storageState: SESION_RECEPCION });

  test('H5 · es redirigida a prohibido y no ve el enlace', async ({ page }) => {
    await page.goto('/pacientes');
    await expect(
      page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Sin volver' }),
    ).toHaveCount(0);
    await page.goto('/pacientes/sin-volver');
    await expect(page).toHaveURL(/\/prohibido$/);
  });
});

test.describe('sin sesión', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('H5 · lleva a entrar', async ({ page }) => {
    await page.goto('/pacientes/sin-volver');
    await expect(page).toHaveURL(/\/entrar$/);
  });
});

test('T2 · la administración descarga el CSV del paciente', async ({ page }) => {
  const nombre = unico('Paciente Exporta');
  await page.goto('/pacientes/nuevo');
  await page.getByLabel('Nombre').fill(nombre);
  await page.getByLabel('Teléfono').fill('600 222 333');
  await page.getByLabel('Notas clínicas').fill('=SUMA(1;1)');
  await page.getByRole('button', { name: 'Guardar paciente' }).click();
  await page.goto(`/pacientes?q=${encodeURIComponent(nombre)}`);
  await page.getByRole('link', { name: nombre }).click();
  const enlace = page.getByRole('link', { name: 'Exportar datos' });
  const href = await enlace.getAttribute('href');

  const respuesta = await page.request.get(href!);
  expect(respuesta.status()).toBe(200);
  expect(respuesta.headers()['content-type']).toContain('text/csv');
  expect(respuesta.headers()['content-disposition']).toMatch(
    /^attachment; filename="paciente-[0-9a-f-]{36}\.csv"$/,
  );
  const cuerpo = await respuesta.body();
  expect([...cuerpo.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  const texto = cuerpo.toString('utf8');
  expect(texto).toContain(nombre);
  // Protección contra inyección de fórmulas: la nota que empieza por «=» sale con apóstrofo previo.
  expect(texto).toContain("'=SUMA(1;1)");
  expect(texto).not.toMatch(/;=SUMA/);
});

test.describe('T2 · permisos', () => {
  const ruta = '/api/exportar/paciente/00000000-0000-4000-8000-000000000000';

  test.describe('recepción', () => {
    test.use({ storageState: SESION_RECEPCION });
    test('recibe 403', async ({ page }) => {
      expect((await page.request.get(ruta)).status()).toBe(403);
    });
  });

  test.describe('sin sesión', () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    test('recibe 401', async ({ page }) => {
      expect((await page.request.get(ruta)).status()).toBe(401);
    });
  });

  test('un id inexistente da 404 a la administración', async ({ page }) => {
    expect((await page.request.get(ruta)).status()).toBe(404);
  });
});

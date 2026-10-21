import { test, expect, type Page } from '@playwright/test';
import { SESION_RECEPCION } from '../../playwright.config';
import { unico } from './datos';

async function altaPaciente(page: Page, nombre: string, telefono = '600 123 456') {
  await page.goto('/pacientes/nuevo');
  await page.getByLabel('Nombre').fill(nombre);
  await page.getByLabel('Teléfono').fill(telefono);
  await page.getByRole('button', { name: 'Guardar paciente' }).click();
  await expect(page).toHaveURL(/\/pacientes\?aviso=guardado$/);
}

async function abrirFicha(page: Page, nombre: string) {
  await page.goto(`/pacientes?q=${encodeURIComponent(nombre)}`);
  await page.getByRole('link', { name: nombre }).click();
  await expect(page.getByRole('heading', { level: 1, name: nombre })).toBeVisible();
}

test.describe('sin sesión', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('H1 · las pantallas de pacientes redirigen a entrar', async ({ page }) => {
    for (const ruta of ['/pacientes', '/pacientes/nuevo']) {
      await page.goto(ruta);
      await expect(page).toHaveURL(/\/entrar$/);
    }
  });
});

test('H1 · el formulario muestra un error por campo sin perder lo escrito', async ({ page }) => {
  await page.goto('/pacientes/nuevo');
  await page.getByLabel('Nombre').fill('A');
  await page.getByLabel('Teléfono').fill('12ab');
  await page.getByLabel('Correo electrónico').fill('no-es-un-correo');
  await page.getByRole('button', { name: 'Guardar paciente' }).click();

  await expect(page.getByText('El nombre debe tener al menos 2 caracteres.')).toBeVisible();
  await expect(page.getByText('El teléfono solo puede llevar dígitos')).toBeVisible();
  await expect(page.getByText('Escribe un correo válido.')).toBeVisible();
  await expect(page).toHaveURL(/\/pacientes\/nuevo$/);
  await expect(page.getByLabel('Nombre')).toHaveValue('A');
  await expect(page.getByLabel('Teléfono')).toHaveValue('12ab');
  await expect(page.getByLabel('Correo electrónico')).toHaveValue('no-es-un-correo');
  await expect(page.getByLabel('Nombre')).toHaveAttribute('aria-invalid', 'true');

  await page.getByLabel('Teléfono').fill('1234');
  await page.getByRole('button', { name: 'Guardar paciente' }).click();
  await expect(page.getByText('El teléfono debe tener al menos 9 dígitos.')).toBeVisible();
});

test('H1 · se da de alta un paciente, aparece el aviso y se localiza buscándolo', async ({ page }) => {
  const nombre = unico('Paciente Alta');
  await altaPaciente(page, nombre);
  await expect(page.getByText('Paciente guardado')).toBeVisible();

  await page.goto(`/pacientes?q=${encodeURIComponent(nombre.toUpperCase())}`);
  await expect(page.getByRole('link', { name: nombre })).toBeVisible();
  await expect(page.getByRole('cell', { name: '600 123 456' })).toBeVisible();
  // Una búsqueda con comodines se trata como texto y no encuentra nada.
  await page.goto('/pacientes?q=%25%25');
  await expect(page.getByText('Ningún paciente coincide con la búsqueda.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Nuevo paciente' }).last()).toBeVisible();
});

test('H1 · el alta con ?siguiente=cita continúa en la nueva cita', async ({ page }) => {
  const nombre = unico('Paciente Siguiente');
  await page.goto('/pacientes/nuevo?siguiente=cita');
  await page.getByLabel('Nombre').fill(nombre);
  await page.getByLabel('Teléfono').fill('699888777');
  await page.getByRole('button', { name: 'Guardar paciente' }).click();
  await expect(page).toHaveURL(/\/citas\/nueva\?paciente=[0-9a-f-]{36}$/);
});

test('H1 · el listado se busca por nombre y por teléfono', async ({ page }) => {
  const nombre = unico('Paciente Busca');
  await altaPaciente(page, nombre, '655 444 333');
  await page.goto('/pacientes');
  await page.getByLabel('Buscar por nombre o teléfono').fill('655 444 333');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByRole('link', { name: nombre }).first()).toBeVisible();
});

test('H1 · se edita un paciente y el admin lo elimina tras confirmar', async ({ page }) => {
  const nombre = unico('Paciente Edita');
  await altaPaciente(page, nombre);
  await abrirFicha(page, nombre);

  await expect(page.getByRole('link', { name: 'Nueva cita' })).toHaveAttribute(
    'href',
    /\/citas\/nueva\?paciente=[0-9a-f-]{36}$/,
  );
  await expect(page.getByRole('link', { name: 'Exportar datos' })).toBeVisible();
  await expect(page.getByText('Este paciente todavía no tiene citas.')).toBeVisible();

  const nuevo = `${nombre} editado`;
  await page.getByLabel('Nombre').fill(nuevo);
  await page.getByLabel('Notas clínicas').fill('Lumbalgia crónica');
  await page.getByRole('button', { name: 'Guardar paciente' }).click();
  await expect(page.getByText('Paciente guardado')).toBeVisible();

  await abrirFicha(page, nuevo);
  await expect(page.getByLabel('Notas clínicas')).toHaveValue('Lumbalgia crónica');

  await page.getByText('Eliminar paciente').click();
  await expect(page.getByText('Se eliminarán el paciente y sus 0 citas.')).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar eliminación' }).click();
  await expect(page.getByText('Paciente eliminado')).toBeVisible();
  await page.goto(`/pacientes?q=${encodeURIComponent(nuevo)}`);
  await expect(page.getByText('Ningún paciente coincide con la búsqueda.')).toBeVisible();
});

test('H1 · un id que no existe o no es válido da 404', async ({ page }) => {
  for (const id of ['no-es-uuid', '00000000-0000-4000-8000-000000000000']) {
    const respuesta = await page.goto(`/pacientes/${id}`);
    expect(respuesta?.status()).toBe(404);
  }
});

test.describe('recepción (rol user)', () => {
  test.use({ storageState: SESION_RECEPCION });

  test('H1 · puede dar de alta y editar, pero no ve «Eliminar» ni «Exportar datos»', async ({ page }) => {
    const nombre = unico('Paciente Recepcion');
    await altaPaciente(page, nombre);
    await abrirFicha(page, nombre);
    await expect(page.getByLabel('Nombre')).toBeVisible();
    await expect(page.getByText('Eliminar paciente')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Confirmar eliminación' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Exportar datos' })).toHaveCount(0);
  });
});

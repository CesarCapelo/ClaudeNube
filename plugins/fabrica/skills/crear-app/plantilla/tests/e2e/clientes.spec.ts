import { test, expect } from '@playwright/test';
import { unico } from './datos';

test('valida el formulario y no guarda datos incorrectos', async ({ page }) => {
  await page.goto('/clientes/nuevo');
  await page.getByLabel('Correo electrónico').fill('esto-no-es-un-correo');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Revisa los campos marcados.')).toBeVisible();
  await expect(page.getByText('Escribe al menos 2 caracteres.')).toBeVisible();
  await expect(page.getByText('Escribe un correo válido.')).toBeVisible();
});

test('crea, busca, edita y elimina un cliente', async ({ page }) => {
  const nombre = unico('Cliente');
  await page.goto('/clientes/nuevo');
  await page.getByLabel('Nombre').fill(nombre);
  await page.getByLabel('Correo electrónico').fill('cliente@ejemplo.com');
  await page.getByLabel('Teléfono').fill('+34 600 000 000');
  await page.getByRole('button', { name: 'Guardar' }).click();

  await expect(page).toHaveURL(/\/clientes\?aviso=guardado/);
  await expect(page.getByText('Cliente guardado.')).toBeVisible();

  const buscar = async () => {
    await page.getByLabel('Buscar clientes').fill(nombre);
    await page.getByRole('button', { name: 'Buscar' }).click();
  };

  await buscar();
  await page.getByRole('link', { name: nombre }).click();
  await page.getByLabel('Notas').fill('Prefiere que le llamen por la mañana.');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Cliente guardado.')).toBeVisible();

  await buscar();
  await page.getByRole('link', { name: nombre }).click();
  await expect(page.getByLabel('Notas')).toHaveValue('Prefiere que le llamen por la mañana.');

  await page.getByText('Eliminar cliente').click();
  await page.getByRole('button', { name: 'Eliminar definitivamente' }).click();
  await expect(page.getByText('Cliente eliminado.')).toBeVisible();
  await buscar();
  await expect(page.getByText('No hay resultados para esa búsqueda.')).toBeVisible();
});

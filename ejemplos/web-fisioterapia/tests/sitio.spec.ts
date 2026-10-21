import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Páginas que deben existir siempre. La skill añade aquí cada página nueva del proyecto.
const PAGINAS = [
  '/',
  '/contacto',
  '/fisioterapia-deportiva',
  '/suelo-pelvico',
  '/dolor-de-espalda-y-cuello',
  '/sobre-mi',
  '/aviso-legal',
  '/politica-privacidad',
  '/politica-cookies',
  '/accesibilidad',
];

for (const ruta of PAGINAS) {
  test(`${ruta} carga sin errores y es accesible`, async ({ page }) => {
    const errores: string[] = [];
    page.on('pageerror', (error) => errores.push(error.message));
    page.on('console', (mensaje) => {
      if (mensaje.type() === 'error') errores.push(mensaje.text());
    });

    const respuesta = await page.goto(ruta);
    expect(respuesta?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page).toHaveTitle(/.{10,70}/);
    expect(await page.locator('meta[name="description"]').getAttribute('content')).toBeTruthy();

    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const graves = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(graves.map((v) => `${v.id}: ${v.help}`)).toEqual([]);

    expect(errores).toEqual([]);
  });
}

test('la página 404 responde con su contenido', async ({ page }) => {
  await page.goto('/esta-pagina-no-existe');
  await expect(page.locator('h1')).toContainText(/no encontramos/i);
});

test('el formulario exige los campos obligatorios y el consentimiento', async ({ page }) => {
  await page.goto('/contacto');
  const formulario = page.locator('form[name="contacto"]');
  await expect(formulario.locator('input[name="nombre"]')).toHaveAttribute('required', '');
  await expect(formulario.locator('input[name="email"]')).toHaveAttribute('required', '');
  await expect(formulario.locator('textarea[name="mensaje"]')).toHaveAttribute('required', '');
  await expect(formulario.locator('input[name="acepta_privacidad"]')).toHaveAttribute(
    'required',
    '',
  );
  const valido = await formulario.evaluate((f: HTMLFormElement) => f.checkValidity());
  expect(valido).toBe(false);
});

test('el menú móvil se abre y se cierra', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Solo en móvil');
  await page.goto('/');
  const boton = page.locator('[data-menu-boton]');
  await boton.click();
  await expect(boton).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#menu-movil')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(boton).toHaveAttribute('aria-expanded', 'false');
});

test('la navegación con teclado empieza en el enlace para saltar al contenido', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
});

for (const ruta of PAGINAS) {
  test(`${ruta} no desborda en horizontal a 360 px`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto(ruta);
    const sobra = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(sobra).toBeLessThanOrEqual(0);
  });
}

test('el botón de WhatsApp apunta al número del sitio', async ({ page }) => {
  await page.goto('/');
  const href = await page
    .getByRole('link', { name: 'Escríbeme por WhatsApp' })
    .getAttribute('href');
  expect(href).toContain('https://wa.me/34600123456');
});

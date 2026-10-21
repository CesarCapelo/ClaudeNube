// Genera public/og.png (1200×630) y public/apple-touch-icon.png (180×180)
// a partir de public/favicon.svg y de los datos de src/config/sitio.ts.
// Uso: npm run imagenes  (requiere Node 22.18+ para importar TypeScript y Chromium de Playwright)
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { sitio } from '../src/config/sitio.ts';

const raiz = new URL('../', import.meta.url);
const favicon = await readFile(new URL('public/favicon.svg', raiz), 'utf8');
const css = await readFile(new URL('src/styles/global.css', raiz), 'utf8');

// Toma los colores de marca de los tokens para que la imagen social siga la identidad visual.
const token = (nombre, porDefecto) =>
  css.match(new RegExp(`--color-${nombre}:\\s*([^;]+);`))?.[1]?.trim() ?? porDefecto;
const fondo = token('marca-900', '#1e293b');
const acento = token('marca-300', '#93c5fd');

const escapar = (texto) =>
  String(texto).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  );

const preinstalado = process.env.PLAYWRIGHT_BROWSERS_PATH
  ? path.join(process.env.PLAYWRIGHT_BROWSERS_PATH, 'chromium')
  : null;
const navegador = await chromium.launch({
  executablePath:
    process.env.PW_CHROMIUM_PATH ||
    (preinstalado && existsSync(preinstalado) ? preinstalado : undefined),
});
const pagina = await navegador.newPage();

await pagina.setViewportSize({ width: 1200, height: 630 });
await pagina.setContent(`<!doctype html><html><body style="margin:0">
  <div style="width:1200px;height:630px;box-sizing:border-box;padding:80px;display:flex;flex-direction:column;justify-content:space-between;background:${fondo};color:#fff;font-family:system-ui,-apple-system,'Segoe UI',sans-serif">
    <div style="width:96px;height:96px">${favicon.replace('<svg', '<svg width="96" height="96"')}</div>
    <div>
      <div style="font-size:72px;font-weight:800;line-height:1.05;letter-spacing:-0.02em">${escapar(sitio.nombre)}</div>
      <div style="margin-top:24px;font-size:34px;line-height:1.3;color:${acento}">${escapar(sitio.eslogan)}</div>
    </div>
  </div></body></html>`);
await pagina.screenshot({ path: new URL('public/og.png', raiz).pathname });

await pagina.setViewportSize({ width: 180, height: 180 });
await pagina.setContent(`<!doctype html><html><body style="margin:0;background:#fff">
  ${favicon.replace('<svg', '<svg width="180" height="180"')}</body></html>`);
await pagina.screenshot({ path: new URL('public/apple-touch-icon.png', raiz).pathname });

await navegador.close();
console.log('Generadas public/og.png y public/apple-touch-icon.png');

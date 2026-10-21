#!/usr/bin/env node
// Auditoría automática de una web o aplicación en marcha.
//
// Recorre las páginas, hace capturas en móvil, tableta y escritorio, y comprueba:
// errores de consola y de red, desbordamiento horizontal, accesibilidad (axe, WCAG 2.2 AA),
// SEO básico, enlaces rotos, imágenes, datos estructurados, textos de relleno pendientes
// y, opcionalmente, las puntuaciones de Lighthouse.
//
// Usa los paquetes instalados en el proyecto (cwd): @playwright/test o playwright,
// @axe-core/playwright y, para --lighthouse, lighthouse.
//
// Uso:
//   node auditar-ui.mjs --url http://localhost:4321 [--rutas /,/contacto] [--max-paginas 40]
//        [--salida .fabrica/auditoria] [--lighthouse] [--lighthouse-rutas /,/contacto]
//        [--umbral-lighthouse 90] [--lighthouse-categorias performance,accessibility,best-practices,seo]
//        [--externos] [--estricto] [--sin-capturas]
//        [--estado-sesion tests/.auth/usuario.json] [--viewports movil,tableta,escritorio]
//        [--ignorar-texto "regex"]
//
// Salida: <salida>/informe.json, <salida>/informe.md y <salida>/capturas/*.png
// Código de salida: 0 sin fallos bloqueantes, 1 con fallos bloqueantes, 2 error de ejecución.

import { createRequire } from 'node:module';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const fallar = (e) => {
  console.error(`Error ejecutando la auditoría: ${e?.stack ?? e}`);
  process.exit(2);
};
process.on('uncaughtException', fallar);
process.on('unhandledRejection', fallar);

// ---------------------------------------------------------------- argumentos

const args = process.argv.slice(2);
const opcion = (nombre, porDefecto) => {
  const i = args.indexOf(`--${nombre}`);
  if (i === -1) return porDefecto;
  const valor = args[i + 1];
  return valor === undefined || valor.startsWith('--') ? true : valor;
};

const BASE = String(opcion('url', 'http://localhost:4321')).replace(/\/$/, '');
const RUTAS = opcion('rutas', null);
const MAX_PAGINAS = Number(opcion('max-paginas', 40));
const SALIDA = path.resolve(String(opcion('salida', '.fabrica/auditoria')));
const CON_LIGHTHOUSE = Boolean(opcion('lighthouse', false));
const RUTAS_LIGHTHOUSE = opcion('lighthouse-rutas', null);
const UMBRAL_LH = Number(opcion('umbral-lighthouse', 90));
const CATEGORIAS_LH = String(
  opcion('lighthouse-categorias', 'performance,accessibility,best-practices,seo'),
).split(',');
const COMPROBAR_EXTERNOS = Boolean(opcion('externos', false));
const ESTRICTO = Boolean(opcion('estricto', false));
const SIN_CAPTURAS = Boolean(opcion('sin-capturas', false));
const ESTADO_SESION = opcion('estado-sesion', null);
const IGNORAR_TEXTO = opcion('ignorar-texto', null);
const VIEWPORTS_ELEGIDOS = String(opcion('viewports', 'movil,tableta,escritorio')).split(',');

const VIEWPORTS = {
  movil: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  tableta: { width: 820, height: 1180, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  escritorio: { width: 1440, height: 900, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
};

// Textos que delatan contenido sin terminar.
const PATRON_RELLENO =
  /\bPENDIENTE\b|lorem ipsum|\bTODO\b|\bFIXME\b|\bXXX\b|ejemplo\.es|Nombre del negocio|Titular que dice|Servicio (uno|dos|tres)\b/i;

// ---------------------------------------------------------------- utilidades

const requireProyecto = createRequire(path.join(process.cwd(), 'package.json'));

async function importarDelProyecto(nombre) {
  try {
    return await import(pathToFileURL(requireProyecto.resolve(nombre)).href);
  } catch {
    // Paquetes solo ESM: se resuelve a mano su punto de entrada.
    const dir = path.join(process.cwd(), 'node_modules', nombre);
    const pkg = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'));
    const exp = pkg.exports?.['.'] ?? pkg.exports;
    const entrada =
      (typeof exp === 'string' ? exp : (exp?.import?.default ?? exp?.import ?? exp?.default)) ??
      pkg.module ??
      pkg.main ??
      'index.js';
    return import(pathToFileURL(path.join(dir, entrada)).href);
  }
}

async function cargarPlaywright() {
  for (const nombre of ['@playwright/test', 'playwright']) {
    try {
      const mod = await importarDelProyecto(nombre);
      return mod.chromium ?? mod.default?.chromium;
    } catch {}
  }
  throw new Error(
    'No se encuentra Playwright en el proyecto. Instálalo con: npm i -D @playwright/test',
  );
}

const slug = (ruta) =>
  (ruta === '/' ? 'inicio' : ruta.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '-')) || 'inicio';

function normalizar(url) {
  const u = new URL(url);
  u.hash = '';
  u.search = '';
  return u.href;
}

const esInterno = (url) => new URL(url).origin === new URL(BASE).origin;
const pareceDocumento = (url) =>
  !/\.(png|jpe?g|webp|avif|gif|svg|ico|pdf|zip|xml|txt|json|css|js|mp4|webm|woff2?)$/i.test(
    new URL(url).pathname,
  );

// ---------------------------------------------------------------- auditoría

const chromium = await cargarPlaywright();
const { default: AxeBuilder } = await importarDelProyecto('@axe-core/playwright').catch(() => ({
  default: null,
}));

// Chromium a usar: PW_CHROMIUM_PATH, o el «chromium» preinstalado en PLAYWRIGHT_BROWSERS_PATH
// (entornos en la nube), o el que instala Playwright por defecto.
const preinstalado = process.env.PLAYWRIGHT_BROWSERS_PATH
  ? path.join(process.env.PLAYWRIGHT_BROWSERS_PATH, 'chromium')
  : null;
const rutaChromium =
  process.env.PW_CHROMIUM_PATH ||
  (preinstalado && existsSync(preinstalado) ? preinstalado : undefined);
const navegador = await chromium.launch({ executablePath: rutaChromium });

await rm(path.join(SALIDA, 'capturas'), { recursive: true, force: true });
await mkdir(path.join(SALIDA, 'capturas'), { recursive: true });

const resultado = {
  base: BASE,
  fecha: new Date().toISOString(),
  paginas: [],
  enlacesRotos: [],
  duplicados: { titulos: [], descripciones: [] },
  lighthouse: [],
  bloqueantes: [],
  avisos: [],
};

const pendientes = RUTAS
  ? String(RUTAS)
      .split(',')
      .map((r) => normalizar(BASE + r.trim()))
  : [normalizar(BASE + '/')];
const visitadas = new Set();
const enlacesEncontrados = new Map(); // url -> páginas donde aparece

const contextoBase = {
  ...(ESTADO_SESION && existsSync(ESTADO_SESION) && { storageState: ESTADO_SESION }),
  locale: 'es-ES',
};

while (pendientes.length > 0 && visitadas.size < MAX_PAGINAS) {
  const url = pendientes.shift();
  if (visitadas.has(url)) continue;
  visitadas.add(url);
  const ruta = new URL(url).pathname;
  const pagina = { ruta, estado: null, viewports: {}, seo: null, axe: [], problemas: [] };
  resultado.paginas.push(pagina);

  for (const nombreVp of VIEWPORTS_ELEGIDOS) {
    const vp = VIEWPORTS[nombreVp];
    if (!vp) continue;
    const contexto = await navegador.newContext({
      ...contextoBase,
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch,
      deviceScaleFactor: vp.deviceScaleFactor,
    });
    const p = await contexto.newPage();
    const errores = [];
    const fallosRed = [];
    p.on('pageerror', (e) => errores.push(`Excepción: ${e.message}`));
    p.on('console', (m) => {
      if (m.type() === 'error') errores.push(`Consola: ${m.text()}`);
    });
    p.on('response', (r) => {
      if (r.status() >= 400 && esInterno(r.url())) fallosRed.push(`${r.status()} ${r.url()}`);
    });

    let respuesta;
    try {
      respuesta = await p.goto(url, { waitUntil: 'networkidle', timeout: 45_000 });
    } catch (e) {
      pagina.problemas.push({ tipo: 'carga', grave: true, detalle: `${nombreVp}: ${e.message}` });
      await contexto.close();
      continue;
    }
    pagina.estado = respuesta?.status() ?? null;

    // Desbordamiento horizontal: el error de maquetación móvil más común.
    const desborde = await p.evaluate(() => {
      const ancho = window.innerWidth;
      if (document.documentElement.scrollWidth <= ancho + 1) return null;
      const culpables = [...document.querySelectorAll('body *')]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.right > ancho + 1;
        })
        .slice(0, 5)
        .map((el) => {
          const id = el.id ? `#${el.id}` : '';
          const clase =
            typeof el.className === 'string' && el.className
              ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
              : '';
          return `${el.tagName.toLowerCase()}${id}${clase}`;
        });
      return { anchoDocumento: document.documentElement.scrollWidth, ancho, culpables };
    });

    if (!SIN_CAPTURAS) {
      // Fuerza la carga de imágenes diferidas antes de la captura de página completa.
      await p.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
      });
      await p.waitForTimeout(250);
      await p.screenshot({
        path: path.join(SALIDA, 'capturas', `${slug(ruta)}-${nombreVp}.png`),
        fullPage: true,
      });
    }

    let violaciones = [];
    if (AxeBuilder && nombreVp !== 'tableta') {
      const axe = await new AxeBuilder({ page: p })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();
      violaciones = axe.violations.map((v) => ({
        id: v.id,
        impacto: v.impact,
        ayuda: v.help,
        url: v.helpUrl,
        elementos: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
        viewport: nombreVp,
      }));
    }

    pagina.viewports[nombreVp] = { errores, fallosRed, desborde, axe: violaciones.length };
    for (const v of violaciones) {
      if (!pagina.axe.some((x) => x.id === v.id)) pagina.axe.push(v);
    }

    if (nombreVp === VIEWPORTS_ELEGIDOS.at(-1) || nombreVp === 'escritorio') {
      pagina.seo = await p.evaluate(() => {
        const meta = (sel) => document.querySelector(sel)?.getAttribute('content') ?? null;
        return {
          titulo: document.title,
          descripcion: meta('meta[name="description"]'),
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
          robots: meta('meta[name="robots"]'),
          lang: document.documentElement.getAttribute('lang'),
          viewport: meta('meta[name="viewport"]'),
          ogImagen: meta('meta[property="og:image"]'),
          h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()),
          niveles: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) =>
            Number(h.tagName[1]),
          ),
          imagenesSinAlt: [...document.images]
            .filter((i) => !i.hasAttribute('alt'))
            .map((i) => i.currentSrc || i.src),
          imagenesSinDimensiones: [...document.images]
            .filter((i) => !i.getAttribute('width') || !i.getAttribute('height'))
            .map((i) => i.currentSrc || i.src),
          imagenesSobredimensionadas: [...document.images]
            .filter(
              (i) =>
                i.clientWidth > 0 &&
                !/\.svg(\?|$)/i.test(i.currentSrc || i.src) &&
                i.naturalWidth > i.clientWidth * window.devicePixelRatio * 2.5,
            )
            .map((i) => `${i.currentSrc || i.src} (${i.naturalWidth}px para ${i.clientWidth}px)`),
          jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => {
            try {
              const datos = JSON.parse(s.textContent);
              return { valido: true, tipo: datos['@type'] ?? 'desconocido' };
            } catch {
              return { valido: false, tipo: null };
            }
          }),
          texto: document.body.innerText,
          enlaces: [...document.querySelectorAll('a[href]')].map((a) => ({
            href: a.href,
            texto: (
              a.innerText ||
              a.getAttribute('aria-label') ||
              a.getAttribute('title') ||
              a.querySelector('img')?.getAttribute('alt') ||
              ''
            ).trim(),
            nuevaPestana: a.target === '_blank',
            rel: a.rel,
          })),
        };
      });
    }

    await contexto.close();
  }

  // Descubre nuevas páginas a partir de los enlaces.
  for (const enlace of pagina.seo?.enlaces ?? []) {
    let destino;
    try {
      destino = new URL(enlace.href);
    } catch {
      continue;
    }
    if (!['http:', 'https:'].includes(destino.protocol)) continue;
    const limpio = normalizar(destino.href);
    if (!enlacesEncontrados.has(limpio)) enlacesEncontrados.set(limpio, new Set());
    enlacesEncontrados.get(limpio).add(ruta);
    if (!RUTAS && esInterno(limpio) && pareceDocumento(limpio) && !visitadas.has(limpio)) {
      if (!pendientes.includes(limpio)) pendientes.push(limpio);
    }
  }
}

// ---------------------------------------------------------------- enlaces rotos

const peticiones = await navegador.newContext({ ...contextoBase });
for (const [url, origenes] of enlacesEncontrados) {
  const interno = esInterno(url);
  if (!interno && !COMPROBAR_EXTERNOS) continue;
  if (interno && visitadas.has(url)) {
    const pag = resultado.paginas.find((p) => normalizar(BASE + p.ruta) === url);
    if (pag?.estado && pag.estado < 400) continue;
  }
  let estado;
  try {
    const r = await peticiones.request.get(url, { timeout: 20_000, maxRedirects: 5 });
    estado = r.status();
  } catch (e) {
    estado = `error: ${e.message.split('\n')[0]}`;
  }
  if (typeof estado !== 'number' || estado >= 400) {
    resultado.enlacesRotos.push({ url, estado, interno, en: [...origenes] });
  }
}
await peticiones.close();
await navegador.close();

// ---------------------------------------------------------------- Lighthouse

if (CON_LIGHTHOUSE) {
  try {
    const { default: lighthouse } = await importarDelProyecto('lighthouse');
    const { launch } = await importarDelProyecto('chrome-launcher');
    const chrome = await launch({
      chromePath: rutaChromium ?? chromium.executablePath(),
      chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
    });
    const rutasLh = RUTAS_LIGHTHOUSE
      ? String(RUTAS_LIGHTHOUSE).split(',')
      : resultado.paginas.slice(0, 5).map((p) => p.ruta);
    // Con sesión guardada, Lighthouse envía sus cookies para medir las páginas privadas y no la de acceso.
    let cabeceras;
    if (ESTADO_SESION && existsSync(ESTADO_SESION)) {
      const { cookies = [] } = JSON.parse(await readFile(ESTADO_SESION, 'utf8'));
      const host = new URL(BASE).hostname;
      const propias = cookies.filter((c) => host.endsWith(c.domain.replace(/^\./, '')));
      if (propias.length)
        cabeceras = { Cookie: propias.map((c) => `${c.name}=${c.value}`).join('; ') };
    }
    for (const ruta of rutasLh) {
      const informe = await lighthouse(BASE + ruta, {
        port: chrome.port,
        output: 'json',
        logLevel: 'error',
        onlyCategories: CATEGORIAS_LH,
        ...(cabeceras && { extraHeaders: cabeceras }),
      });
      const lhr = informe.lhr;
      const puntuaciones = Object.fromEntries(
        Object.entries(lhr.categories).map(([k, c]) => [k, Math.round((c.score ?? 0) * 100)]),
      );
      const mejoras = Object.values(lhr.audits)
        .filter(
          (a) =>
            a.score !== null &&
            a.score < 0.9 &&
            a.scoreDisplayMode !== 'informative' &&
            a.scoreDisplayMode !== 'notApplicable',
        )
        .slice(0, 12)
        .map((a) => `${a.title}${a.displayValue ? ` (${a.displayValue})` : ''}`);
      resultado.lighthouse.push({ ruta, movil: puntuaciones, mejoras });
    }
    await chrome.kill();
  } catch (e) {
    resultado.avisos.push(`Lighthouse no se pudo ejecutar: ${e.message}`);
  }
}

// ---------------------------------------------------------------- evaluación

const bloquea = (texto) => resultado.bloqueantes.push(texto);
const avisa = (texto) => resultado.avisos.push(texto);
const ignorar = IGNORAR_TEXTO ? new RegExp(String(IGNORAR_TEXTO), 'i') : null;

const titulos = new Map();
const descripciones = new Map();
const relleno = new Map(); // texto -> páginas

for (const pag of resultado.paginas) {
  const r = pag.ruta;
  for (const prob of pag.problemas) (prob.grave ? bloquea : avisa)(`${r}: ${prob.detalle}`);
  if (pag.estado && pag.estado >= 400 && !/404/.test(r))
    bloquea(`${r}: responde con estado ${pag.estado}`);

  for (const [vp, datos] of Object.entries(pag.viewports)) {
    for (const e of datos.errores) bloquea(`${r} (${vp}): ${e}`);
    for (const f of datos.fallosRed) bloquea(`${r} (${vp}): recurso con error ${f}`);
    if (datos.desborde)
      bloquea(
        `${r} (${vp}): desbordamiento horizontal (${datos.desborde.anchoDocumento}px en ${datos.desborde.ancho}px). Elementos: ${datos.desborde.culpables.join(', ')}`,
      );
  }

  for (const v of pag.axe) {
    const texto = `${r}: accesibilidad [${v.impacto}] ${v.id} — ${v.ayuda} → ${v.elementos.join(' | ')}`;
    if (v.impacto === 'serious' || v.impacto === 'critical') bloquea(texto);
    else avisa(texto);
  }

  const s = pag.seo;
  if (!s) continue;
  const indexable = !/noindex/i.test(s.robots ?? '');
  if (s.h1.length !== 1) bloquea(`${r}: debe tener exactamente un h1 (tiene ${s.h1.length})`);
  if (!s.lang) bloquea(`${r}: falta el atributo lang en <html>`);
  if (!s.viewport) bloquea(`${r}: falta la meta viewport`);
  if (indexable) {
    if (!s.titulo || s.titulo.length < 10 || s.titulo.length > 65)
      avisa(
        `${r}: título de ${s.titulo?.length ?? 0} caracteres (recomendado 10–65): «${s.titulo}»`,
      );
    if (!s.descripcion) bloquea(`${r}: falta la meta descripción`);
    else if (s.descripcion.length < 70 || s.descripcion.length > 160)
      avisa(`${r}: meta descripción de ${s.descripcion.length} caracteres (recomendado 70–160)`);
    if (!s.canonical) avisa(`${r}: falta la URL canónica`);
    if (!s.ogImagen) avisa(`${r}: falta la imagen para redes sociales (og:image)`);
    if (s.titulo) titulos.set(s.titulo, [...(titulos.get(s.titulo) ?? []), r]);
    if (s.descripcion)
      descripciones.set(s.descripcion, [...(descripciones.get(s.descripcion) ?? []), r]);
  }
  for (let i = 1; i < s.niveles.length; i++) {
    if (s.niveles[i] > s.niveles[i - 1] + 1) {
      avisa(`${r}: salto de encabezado de h${s.niveles[i - 1]} a h${s.niveles[i]}`);
      break;
    }
  }
  for (const img of s.imagenesSinAlt) bloquea(`${r}: imagen sin atributo alt: ${img}`);
  for (const img of s.imagenesSinDimensiones)
    avisa(`${r}: imagen sin width/height (provoca saltos de maquetación): ${img}`);
  for (const img of s.imagenesSobredimensionadas)
    avisa(`${r}: imagen mucho mayor de lo necesario: ${img}`);
  for (const j of s.jsonLd) if (!j.valido) bloquea(`${r}: bloque JSON-LD con JSON no válido`);
  for (const e of s.enlaces) {
    if (!e.texto) bloquea(`${r}: enlace sin texto accesible → ${e.href}`);
    if (e.nuevaPestana && !/noopener/.test(e.rel))
      avisa(`${r}: enlace en nueva pestaña sin rel="noopener": ${e.href}`);
  }

  const lineas = s.texto
    .split('\n')
    .filter((l) => PATRON_RELLENO.test(l) && !(ignorar && ignorar.test(l)));
  const marcadores = [s.titulo, s.descripcion].filter((t) => t && PATRON_RELLENO.test(t));
  for (const l of new Set([...lineas, ...marcadores])) {
    const clave = l.trim().slice(0, 140);
    relleno.set(clave, [...(relleno.get(clave) ?? []), r]);
  }
}

// Cada texto de relleno se informa una sola vez, con las páginas donde aparece.
for (const [texto, rutas] of relleno) {
  const donde = rutas.length > 3 ? `${rutas.length} páginas` : rutas.join(', ');
  (ESTRICTO ? bloquea : avisa)(`Contenido pendiente o de relleno en ${donde}: «${texto}»`);
}

for (const [titulo, rutas] of titulos)
  if (rutas.length > 1) {
    resultado.duplicados.titulos.push({ titulo, rutas });
    avisa(`Título duplicado en ${rutas.join(', ')}: «${titulo}»`);
  }
for (const [descripcion, rutas] of descripciones)
  if (rutas.length > 1) {
    resultado.duplicados.descripciones.push({ descripcion, rutas });
    avisa(`Meta descripción duplicada en ${rutas.join(', ')}`);
  }
for (const e of resultado.enlacesRotos) {
  (e.interno ? bloquea : avisa)(
    `Enlace roto (${e.estado}) ${e.url} — aparece en ${e.en.join(', ')}`,
  );
}
for (const lh of resultado.lighthouse) {
  for (const [categoria, nota] of Object.entries(lh.movil)) {
    if (nota < UMBRAL_LH)
      bloquea(
        `${lh.ruta}: Lighthouse móvil ${categoria} = ${nota} (mínimo ${UMBRAL_LH}). Mejoras: ${lh.mejoras.slice(0, 5).join('; ')}`,
      );
  }
}

// ---------------------------------------------------------------- informe

for (const pag of resultado.paginas) if (pag.seo) delete pag.seo.texto;
await writeFile(path.join(SALIDA, 'informe.json'), JSON.stringify(resultado, null, 2));

const md = [];
md.push(`# Informe de auditoría`, '');
md.push(
  `- Sitio: ${BASE}`,
  `- Fecha: ${resultado.fecha}`,
  `- Páginas auditadas: ${resultado.paginas.length}`,
);
md.push(
  `- Resultado: **${resultado.bloqueantes.length === 0 ? 'APTO' : 'NO APTO'}** (${resultado.bloqueantes.length} fallos bloqueantes, ${resultado.avisos.length} avisos)`,
  '',
);
if (resultado.lighthouse.length) {
  const nombres = {
    performance: 'Rendimiento',
    accessibility: 'Accesibilidad',
    'best-practices': 'Buenas prácticas',
    seo: 'SEO',
  };
  md.push(
    '## Lighthouse (móvil)',
    '',
    `| Página | ${CATEGORIAS_LH.map((c) => nombres[c] ?? c).join(' | ')} |`,
    `| --- |${CATEGORIAS_LH.map(() => ' --- |').join('')}`,
  );
  for (const lh of resultado.lighthouse)
    md.push(`| ${lh.ruta} | ${CATEGORIAS_LH.map((c) => lh.movil[c] ?? '—').join(' | ')} |`);
  md.push('');
}
md.push(
  '## Fallos bloqueantes',
  '',
  ...(resultado.bloqueantes.length ? resultado.bloqueantes.map((b) => `- ${b}`) : ['Ninguno.']),
  '',
);
md.push(
  '## Avisos',
  '',
  ...(resultado.avisos.length ? resultado.avisos.map((a) => `- ${a}`) : ['Ninguno.']),
  '',
);
md.push(
  '## Páginas',
  '',
  '| Página | Estado | Título | Problemas de accesibilidad |',
  '| --- | --- | --- | --- |',
);
for (const pag of resultado.paginas)
  md.push(
    `| ${pag.ruta} | ${pag.estado ?? '—'} | ${(pag.seo?.titulo ?? '').replace(/\|/g, '\\|')} | ${pag.axe.length} |`,
  );
md.push('');
if (!SIN_CAPTURAS) {
  md.push(
    '## Capturas',
    '',
    `En \`${path.relative(process.cwd(), path.join(SALIDA, 'capturas'))}/\`: una por página y tamaño de pantalla (${VIEWPORTS_ELEGIDOS.join(', ')}). Revísalas una a una.`,
    '',
  );
}
await writeFile(path.join(SALIDA, 'informe.md'), md.join('\n'));

console.log(md.slice(0, 6).join('\n'));
console.log(`\nInforme completo: ${path.relative(process.cwd(), path.join(SALIDA, 'informe.md'))}`);
process.exit(resultado.bloqueantes.length === 0 ? 0 : 1);

#!/usr/bin/env node
// Instala la fábrica dentro de un proyecto (en su carpeta .claude/), sin usar el sistema de plugins.
//
// Sirve para las sesiones de Claude Code en la nube (web y app móvil), que no cargan plugins
// de un marketplace pero sí las skills, los agentes y los hooks que están en el repositorio.
// También vale para usar la fábrica en un ordenador sin instalar el plugin.
//
// Uso: node instalar.mjs <carpeta-del-proyecto>
// Resultado en el proyecto:
//   .claude/skills/crear-web/, .claude/skills/crear-app/   (las skills, invocables como /crear-web y /crear-app)
//   .claude/agents/revisor-*.md                            (los agentes revisores)
//   .claude/fabrica/{scripts,hooks,referencia}/            (herramientas compartidas)
//   .claude/settings.json                                  (hooks añadidos, sin borrar lo que hubiera)

import { cp, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const origen = path.join(path.dirname(fileURLToPath(import.meta.url)), 'plugins', 'fabrica');
const destino = path.resolve(process.argv[2] ?? '');

if (!process.argv[2]) {
  console.error('Uso: node instalar.mjs <carpeta-del-proyecto>');
  process.exit(1);
}
await mkdir(destino, { recursive: true });

const claude = path.join(destino, '.claude');
const base = path.join(claude, 'fabrica');
const IGNORAR = new Set(['node_modules', 'dist', '.astro', '.next', '.datos', 'test-results', 'playwright-report']);
const filtro = (ruta) => !IGNORAR.has(path.basename(ruta)) && !ruta.endsWith('.env.local') && !ruta.endsWith('.tsbuildinfo');

await mkdir(base, { recursive: true });
for (const carpeta of ['scripts', 'hooks', 'referencia']) {
  await cp(path.join(origen, carpeta), path.join(base, carpeta), { recursive: true, filter: filtro });
}
for (const skill of ['crear-web', 'crear-app']) {
  await cp(path.join(origen, 'skills', skill), path.join(claude, 'skills', skill), { recursive: true, filter: filtro });
}
await cp(path.join(origen, 'agents'), path.join(claude, 'agents'), { recursive: true });

// Las rutas y nombres del plugin se traducen a los de una instalación dentro del proyecto.
const RAIZ = '${CLAUDE_PROJECT_DIR}/.claude/fabrica';
const traducir = (texto) =>
  texto
    .replaceAll('${CLAUDE_PLUGIN_ROOT}', RAIZ)
    .replaceAll('fabrica:revisor-', 'revisor-')
    .replaceAll('/fabrica:crear-web', '/crear-web')
    .replaceAll('/fabrica:crear-app', '/crear-app')
    .replaceAll('/fabrica:${skill}', '/${skill}')
    .replaceAll('/fabrica:<skill>', '/<skill>');

async function traducirMarkdown(directorio) {
  for (const entrada of await readdir(directorio)) {
    const ruta = path.join(directorio, entrada);
    if ((await stat(ruta)).isDirectory()) {
      if (entrada !== 'plantilla') await traducirMarkdown(ruta);
    } else if (/\.(md|mjs)$/.test(entrada)) {
      const texto = await readFile(ruta, 'utf8');
      const nuevo = traducir(texto);
      if (nuevo !== texto) await writeFile(ruta, nuevo);
    }
  }
}
await traducirMarkdown(path.join(claude, 'skills', 'crear-web'));
await traducirMarkdown(path.join(claude, 'skills', 'crear-app'));
await traducirMarkdown(path.join(claude, 'agents'));
await traducirMarkdown(base);

// Hooks en .claude/settings.json (se conservan los ajustes existentes).
const ficheroAjustes = path.join(claude, 'settings.json');
const ajustes = existsSync(ficheroAjustes) ? JSON.parse(await readFile(ficheroAjustes, 'utf8')) : {};
ajustes.hooks ??= {};
const hook = (script) => ({
  type: 'command',
  command: `node "$CLAUDE_PROJECT_DIR/.claude/fabrica/hooks/${script}"`,
  timeout: 20,
});
const anadir = (evento, entrada) => {
  const lista = (ajustes.hooks[evento] ??= []);
  const ya = lista.some((e) => e.hooks?.some((h) => h.command === entrada.hooks[0].command));
  if (!ya) lista.push(entrada);
};
anadir('Stop', { hooks: [hook('continuar.mjs')] });
anadir('SessionStart', { hooks: [hook('contexto.mjs')] });
anadir('PreToolUse', { matcher: 'Bash|Read|Edit|Write|MultiEdit|NotebookEdit', hooks: [hook('proteger.mjs')] });
await writeFile(ficheroAjustes, JSON.stringify(ajustes, null, 2) + '\n');

console.log(`Fábrica instalada en ${claude}`);
console.log('Abre Claude Code en esa carpeta y ejecuta /crear-web o /crear-app.');
console.log('Para usarla en la nube, haz commit y push de la carpeta .claude/ del proyecto.');

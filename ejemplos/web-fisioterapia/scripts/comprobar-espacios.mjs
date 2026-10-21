#!/usr/bin/env node
// Detecta espacios que se perderán al compilar ficheros .astro.
//
// En Astro (como en JSX), el salto de línea entre un texto y un elemento en línea
// (<a>, <strong>, <em>, <span>…) o una expresión {…} NO produce espacio en la página:
// «escríbenos a\n<a>correo</a>» se ve como «escríbenos acorreo».
// La solución es escribir {' '} al final de la línea o mantener todo en la misma línea.
//
// Uso: node scripts/comprobar-espacios.mjs [directorio=src]  (npm run espacios)
// Código de salida: 0 sin problemas, 1 con problemas.

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const raiz = path.resolve(process.argv[2] ?? 'src');
const EN_LINEA = '(?:a|strong|em|b|i|span|code|abbr|time|small|mark)';
const patrones = [
  // texto⏎<a …>   o   texto⏎{expresión}
  {
    re: new RegExp(
      `[\\p{L}\\p{N},;:)»”]\\n[ \\t]*(<${EN_LINEA}[\\s>]|\\{(?!\\s*\\/\\*|' '\\}))`,
      'gu',
    ),
    tipo: 'texto seguido de elemento o expresión en la línea siguiente',
  },
  // </a>⏎texto   o   }⏎texto   (cuando la línea siguiente empieza por letra o número)
  {
    re: new RegExp(`(</${EN_LINEA}>|(?<!\\{' ')\\})\\n[ \\t]*[\\p{L}\\p{N}¿¡«“(]`, 'gu'),
    tipo: 'elemento o expresión seguido de texto en la línea siguiente',
  },
];

async function* ficheros(dir) {
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const ruta = path.join(dir, entrada.name);
    if (entrada.isDirectory()) yield* ficheros(ruta);
    else if (entrada.name.endsWith('.astro')) yield ruta;
  }
}

let total = 0;
for await (const fichero of ficheros(raiz)) {
  const fuente = await readFile(fichero, 'utf8');
  // Solo el marcado: se ignoran el frontmatter y los bloques <script> y <style>.
  const inicioMarcado = fuente.startsWith('---') ? fuente.indexOf('---', 3) + 3 : 0;
  const marcado = fuente
    .slice(inicioMarcado)
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/g, (m) => m.replace(/[^\n]/g, ' '));
  const lineaBase = fuente.slice(0, inicioMarcado).split('\n').length - 1;
  for (const { re, tipo } of patrones) {
    for (const m of marcado.matchAll(re)) {
      // Dentro de una etiqueta de apertura (atributos) no hay texto visible.
      const antes = marcado.slice(0, m.index);
      if (antes.lastIndexOf('<') > antes.lastIndexOf('>')) continue;
      const linea = lineaBase + antes.split('\n').length;
      const fragmento = marcado
        .slice(m.index, m.index + m[0].length + 30)
        .split('\n')
        .map((l) => l.trim())
        .join('⏎');
      console.log(`${path.relative(process.cwd(), fichero)}:${linea} — ${tipo}: «${fragmento}»`);
      total++;
    }
  }
}

if (total > 0) {
  console.log(
    `\n${total} posibles espacios perdidos. Añade {' '} al final de la línea o une las líneas.`,
  );
  process.exit(1);
}
console.log('Sin espacios perdidos en los ficheros .astro.');

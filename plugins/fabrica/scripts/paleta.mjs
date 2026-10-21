#!/usr/bin/env node
// Genera una escala de color de marca de 11 tonos (50–950) en OKLCH a partir de un color base,
// con neutros teñidos del mismo tono, y comprueba los contrastes WCAG de las combinaciones habituales.
//
// Uso:
//   node paleta.mjs --marca "#2f6f4e" [--acento "#d98e04"] [--nombre marca]
//   node paleta.mjs --tono 150 --croma 0.12        (sin color de partida: tono 0–360)
//
// Imprime el bloque para pegar dentro de @theme en src/styles/global.css (web)
// o en el CSS de tema de la aplicación, y la tabla de contrastes. Sale con código 1
// si alguna combinación obligatoria no alcanza 4,5:1.

const args = process.argv.slice(2);
const opcion = (n) => {
  const i = args.indexOf(`--${n}`);
  return i === -1 ? undefined : args[i + 1];
};

// ---------- conversiones sRGB <-> OKLab <-> OKLCH

const aLineal = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const aGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function hexARgb(hex) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
}

function rgbAOklch([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map(aLineal);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(A, B);
  const H = ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return { L, C, H };
}

function oklchARgb({ L, C, H }) {
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map(aGamma);
}

const dentroDeGama = (rgb) => rgb.every((c) => c >= -0.0005 && c <= 1.0005);

// Reduce el croma hasta que el color quepa en sRGB (mantiene luminosidad y tono).
function ajustarGama(color) {
  let { C } = color;
  while (C > 0 && !dentroDeGama(oklchARgb({ ...color, C }))) C -= 0.002;
  return { ...color, C: Math.max(C, 0) };
}

const rgbAHex = (rgb) =>
  '#' + rgb.map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, '0')).join('');

function luminancia(rgb) {
  const [r, g, b] = rgb.map((c) => aLineal(Math.min(1, Math.max(0, c))));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a, b) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const css = ({ L, C, H }) => `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(3)} ${H.toFixed(1)})`;

// ---------- escala

const LUMINOSIDADES = { 50: 0.975, 100: 0.94, 200: 0.885, 300: 0.8, 400: 0.7, 500: 0.6, 600: 0.52, 700: 0.45, 800: 0.38, 900: 0.31, 950: 0.23 };
// El croma es máximo en los tonos medios y se reduce en los extremos.
const FACTOR_CROMA = { 50: 0.18, 100: 0.32, 200: 0.52, 300: 0.75, 400: 0.92, 500: 1, 600: 1, 700: 0.92, 800: 0.8, 900: 0.66, 950: 0.5 };

function escala(base) {
  const salida = {};
  for (const [paso, L] of Object.entries(LUMINOSIDADES)) {
    salida[paso] = ajustarGama({ L, C: base.C * FACTOR_CROMA[paso], H: base.H });
  }
  return salida;
}

function colorDe(valor, porDefecto) {
  if (!valor) return porDefecto;
  return rgbAOklch(hexARgb(valor));
}

const nombre = opcion('nombre') ?? 'marca';
const marcaBase = opcion('marca')
  ? colorDe(opcion('marca'))
  : { L: 0.55, C: Number(opcion('croma') ?? 0.13), H: Number(opcion('tono') ?? 250) };
if (marcaBase.C < 0.03) marcaBase.C = 0.03; // un gris puro no da una escala útil

const marca = escala(marcaBase);
const acentoBase = opcion('acento')
  ? colorDe(opcion('acento'))
  : ajustarGama({ L: 0.7, C: Math.max(marcaBase.C, 0.14), H: (marcaBase.H + 150) % 360 });
const acento = { 500: ajustarGama({ ...acentoBase, L: Math.max(acentoBase.L, 0.62) }), 600: ajustarGama({ ...acentoBase, L: Math.min(acentoBase.L, 0.55) }) };

const neutros = {
  tinta: ajustarGama({ L: 0.23, C: 0.02, H: marcaBase.H }),
  'tinta-suave': ajustarGama({ L: 0.45, C: 0.02, H: marcaBase.H }),
  fondo: ajustarGama({ L: 0.99, C: 0.004, H: marcaBase.H }),
  superficie: ajustarGama({ L: 0.965, C: 0.008, H: marcaBase.H }),
  borde: ajustarGama({ L: 0.89, C: 0.012, H: marcaBase.H }),
};

// ---------- salida

const lineas = [];
lineas.push(`  /* Paleta generada con paleta.mjs a partir de ${opcion('marca') ?? `tono ${marcaBase.H.toFixed(0)}`} */`);
for (const [paso, c] of Object.entries(marca)) lineas.push(`  --color-${nombre}-${paso}: ${css(c)}; /* ${rgbAHex(oklchARgb(c))} */`);
lineas.push('');
for (const [paso, c] of Object.entries(acento)) lineas.push(`  --color-acento-${paso}: ${css(c)}; /* ${rgbAHex(oklchARgb(c))} */`);
lineas.push('');
for (const [n, c] of Object.entries(neutros)) lineas.push(`  --color-${n}: ${css(c)}; /* ${rgbAHex(oklchARgb(c))} */`);

console.log('Bloque para @theme:\n');
console.log(lineas.join('\n'));

const blanco = [1, 1, 1];
const rgb = (c) => oklchARgb(c);
const pruebas = [
  ['Texto principal (tinta) sobre fondo', rgb(neutros.tinta), rgb(neutros.fondo), 4.5, true],
  ['Texto secundario (tinta-suave) sobre fondo', rgb(neutros['tinta-suave']), rgb(neutros.fondo), 4.5, true],
  ['Texto secundario sobre superficie', rgb(neutros['tinta-suave']), rgb(neutros.superficie), 4.5, true],
  [`Texto blanco sobre ${nombre}-700 (botón principal)`, blanco, rgb(marca[700]), 4.5, true],
  [`Texto blanco sobre ${nombre}-600`, blanco, rgb(marca[600]), 4.5, false],
  [`Texto ${nombre}-800 sobre ${nombre}-50 (botón secundario, etiquetas)`, rgb(marca[800]), rgb(marca[50]), 4.5, true],
  [`Enlaces ${nombre}-700 sobre fondo`, rgb(marca[700]), rgb(neutros.fondo), 4.5, true],
  [`Texto ${nombre}-100 sobre ${nombre}-900 (secciones oscuras)`, rgb(marca[100]), rgb(marca[900]), 4.5, true],
  ['Texto tinta sobre acento-500 (botón de acento)', rgb(neutros.tinta), rgb(acento[500]), 4.5, false],
  ['Texto blanco sobre acento-600', blanco, rgb(acento[600]), 4.5, false],
  ['Borde sobre fondo (elementos de interfaz, mínimo 3:1 si el borde es la única pista)', rgb(neutros.borde), rgb(neutros.fondo), 3, false],
];

console.log('\nContrastes (WCAG 2.2: 4,5:1 texto normal, 3:1 texto grande e interfaz):\n');
let fallos = 0;
for (const [texto, a, b, minimo, obligatorio] of pruebas) {
  const valor = contraste(a, b);
  const ok = valor >= minimo;
  if (!ok && obligatorio) fallos++;
  console.log(`  ${ok ? '✔' : obligatorio ? '✘' : '·'} ${valor.toFixed(2)}:1  ${texto}${!ok && !obligatorio ? ' (no usar esta combinación para texto)' : ''}`);
}
console.log(fallos ? `\n${fallos} combinaciones obligatorias no cumplen. Elige un color base más oscuro o con menos croma.` : '\nTodas las combinaciones obligatorias cumplen.');
process.exit(fallos ? 1 : 0);

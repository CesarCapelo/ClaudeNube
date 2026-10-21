# Diseño visual

Una web de pyme bien hecha transmite tres cosas en 5 segundos: **qué hace el negocio, para quién y cómo contactar**. El diseño está al servicio de eso. Debe parecer cuidada y cara, pero cercana; nunca una plantilla genérica.

## 1. Elegir la dirección visual

Parte de la personalidad de marca del brief y del sector. Si el cliente tiene logotipo o colores, mandan sus colores; la tabla solo orienta.

| Sector | Paleta orientativa | Tipografías (títulos + texto) | Formas e imagen |
| --- | --- | --- | --- |
| Salud, clínicas, fisioterapia, bienestar | Verde salvia, azul petróleo o turquesa suave, neutros cálidos | Manrope o Figtree + Inter | Radios amplios (1–1,5 rem), fotos luminosas de espacios y manos, nunca de quirófano |
| Asesoría, despacho legal, finanzas, seguros | Azul marino, verde botella o granate, grises | Source Serif 4 o Newsreader + Inter o Public Sans | Radios pequeños (0,375 rem), mucho blanco, retratos del equipo |
| Reformas, construcción, oficios, talleres | Naranja, amarillo industrial o azul acero con grafito | Bricolage Grotesque o Work Sans (negrita) + Inter | Radios pequeños, antes y después, fotos de obra real |
| Restauración, hostelería, alimentación | Terracota, mostaza, burdeos, verde oliva, crema | Fraunces o Playfair Display + DM Sans | Fotos de producto grandes, texturas cálidas |
| Belleza, estética, moda | Neutros cálidos (arena, crema) con un acento (rosa empolvado, dorado, negro) | Cormorant Garamond o Playfair Display + Figtree | Mucho aire, fotos editoriales, líneas finas |
| Tecnología, consultoría digital, startups | Azul eléctrico, violeta o verde lima sobre oscuro o blanco | Space Grotesk, Sora o Geist + Inter | Radios medios, capturas de producto, diagramas |
| Educación, academias, actividades infantiles | Colores vivos y amables (coral, azul cielo, amarillo) | Nunito u Outfit + Nunito | Radios grandes, ilustraciones, fotos de grupo con permiso |
| Inmobiliaria, arquitectura, interiorismo | Negro, piedra y un acento sobrio (verde oscuro, latón) | Instrument Sans o Manrope + Inter | Fotos a sangre, cuadrícula ordenada |
| Turismo, casas rurales, ocio | Verdes y tierras, azul mar | Lora o Literata + Figtree | Paisajes reales a gran tamaño, mapas |

Todas esas tipografías existen como `@fontsource-variable/<nombre-en-minúsculas-con-guiones>`, y su familia CSS es `'<Nombre> Variable'` (por ejemplo, `'Source Serif 4 Variable'`). Usa como máximo dos familias.

Escribe la dirección elegida en `.fabrica/diseno.md`: personalidad en 3 adjetivos, paleta con el porqué, tipografías, estilo de forma, estilo de imagen y 3 cosas que la web NO debe parecer.

## 2. Paleta

Genera la escala con el script del plugin. Comprueba los contrastes y sale con error si alguno obligatorio falla:

```bash
node .fabrica/herramientas/paleta.mjs --marca "#2f6f4e" --acento "#d98e04"
node .fabrica/herramientas/paleta.mjs --tono 150 --croma 0.12   # sin color de partida
```

- Pega el bloque en `@theme` de `src/styles/global.css`, sustituyendo los tokens de ejemplo.
- Si el color corporativo es muy claro (amarillo, lima, cian), úsalo como **acento** y elige como marca un tono oscuro que combine (azul noche, grafito, verde bosque). Un amarillo oscurecido acaba pareciendo marrón.
- Elige el acento a propósito (complementario cálido o análogo); el valor por defecto del script es solo un punto de partida.
- Uso: `marca-700` en botones principales y enlaces; `marca-50` y `marca-100` en fondos suaves; `marca-900` en la sección oscura (como máximo una por página); el acento, solo en detalles y como mucho en un botón por pantalla.
- Los neutros (`tinta`, `tinta-suave`, `fondo`, `superficie`, `borde`) van teñidos del tono de marca. Así la web se percibe coherente sin que se note por qué.

## 3. Tipografía

- Escala fluida: h1 de 2,25 rem en móvil a 3,75 rem en escritorio (`text-4xl md:text-6xl`), h2 de 1,875 a 2,25 rem, h3 de 1,25 a 1,5 rem y cuerpo de 1 a 1,125 rem. Nunca por debajo de 16 px en el cuerpo de texto.
- Interlineado de 1,6 a 1,7 en párrafos y de 1,1 a 1,2 en titulares. Ancho de línea de 60 a 75 caracteres (`max-w-prose` o `max-w-xl`).
- Los títulos llevan `text-wrap: balance` (ya está en la base). Evita las palabras huérfanas en los titulares cortos.
- Instala la fuente (`npm i @fontsource-variable/<fuente>`), impórtala en `global.css` y actualiza `--font-sans` y `--font-display`.

## 4. Estructura de la página de inicio

Orden recomendado. Elimina lo que no aporte, pero mantén el orden lógico (quién, qué, prueba, cómo, acción):

1. **Hero:** titular con qué haces, para quién y dónde; subtítulo con el beneficio y una prueba concreta; acción principal y alternativa (llamar o WhatsApp); imagen real o composición. En móvil, el titular y la acción principal se ven sin hacer scroll.
2. **Barra de confianza** (solo con datos reales): años, colegiación, sellos, marcas con las que trabaja y valoración de Google con su número real.
3. **Servicios:** de 3 a 6 tarjetas con beneficio, no solo con nombre. Cada una enlaza a su página si existe.
4. **Por qué nosotros o cómo trabajamos:** proceso en 3 o 4 pasos numerados, o diferenciadores concretos.
5. **Prueba social:** testimonios reales con nombre (y permiso), casos o galería de trabajos.
6. **Preguntas frecuentes:** de 4 a 8 preguntas reales del sector, con `<details>` accesible y datos estructurados FAQPage.
7. **Llamada a la acción final** y **contacto** (teléfono, horario, zona y formulario o enlace a la página de contacto).

Ritmo: secciones con `py-16 md:py-24`, contenedor de 72 rem (`contenedor`) y alternancia de `fondo` y `superficie` para separar bloques. Un único estilo de tarjeta, de radio y de sombra en toda la web.

## 5. Imágenes

Orden de preferencia:

1. **Fotos reales del cliente.** Optimízalas siempre con `<Image />` de `astro:assets` (formatos modernos, `widths` y `sizes`). La imagen principal lleva `loading="eager"` y `fetchpriority="high"`; el resto se carga en diferido.
2. **Composiciones gráficas propias**: degradados suaves de la paleta, formas geométricas, patrones SVG, iconos de Lucide grandes sobre fondos de marca o capturas o mapas reales. Bien hechas, se ven mejor que una foto de banco genérica.
3. **Bancos libres** (Unsplash, Pexels), solo si el brief lo permite. Descarga la imagen al proyecto (nunca la enlaces en caliente), elige fotos que no parezcan de banco y anota la fuente y la licencia en `.fabrica/imagenes.md`.

Prohibido: fotos generadas por IA que parezcan el equipo, el local o los trabajos reales del cliente (inducen a error), imágenes con marcas de agua o con derechos dudosos, y la típica foto de banco de un apretón de manos.

Donde haga falta una foto real que aún no existe, usa un hueco con buen aspecto (composición gráfica) y registra con `pendiente-cliente` qué foto se necesita, con encuadre y orientación.

## 6. Movimiento e interacción

- Transiciones de 150 a 250 ms solo en color, sombra y transformaciones leves (hover y focus). Respeta `prefers-reduced-motion` (ya está en la base).
- Sin carruseles automáticos ni sliders en el hero: empeoran la accesibilidad y la conversión. Usa cuadrículas.
- Sin animaciones al hacer scroll que retrasen la aparición del contenido.
- Foco visible en todos los elementos interactivos (la base lo define) y objetivos táctiles de al menos 44 × 44 px.

## 7. Señales de «web hecha con IA» que hay que evitar

- Titulares vacíos («Bienvenidos a nuestra web», «Soluciones integrales de calidad», «Tu socio de confianza»).
- Emojis como iconos, manchas de degradado por todas partes y brillos sin función.
- Tres tarjetas idénticas con icono, título y dos líneas en todas las secciones.
- Contadores inventados («+1000 clientes satisfechos») y testimonios genéricos sin nombre.
- Párrafos largos centrados, texto gris claro con poco contraste y todo en mayúsculas.
- Botones «Saber más» repetidos que no dicen adónde llevan.
- Mezcla de radios, sombras y estilos de botón.

## 8. Rúbrica de revisión visual

Puntúa cada captura (móvil y escritorio de cada página) de 1 a 5 en cada criterio. Objetivo: **nada por debajo de 4** y una media de 4,3 o más. Anota las puntuaciones y los cambios en la bitácora.

| # | Criterio | Qué es un 5 |
| --- | --- | --- |
| 1 | Primera impresión | En 5 segundos se entiende quién es, qué ofrece, dónde y cómo contactar, también en móvil sin hacer scroll |
| 2 | Jerarquía | Un foco claro por sección; titulares, subtítulos y texto se distinguen a simple vista |
| 3 | Consistencia | Mismos radios, sombras, espaciados, estilos de botón e iconos en toda la web |
| 4 | Legibilidad | Contraste holgado, cuerpo de 16 px o más, líneas de longitud cómoda y sin palabras huérfanas en los titulares |
| 5 | Respiración | Espacio en blanco generoso y regular; nada apretado ni desequilibrado |
| 6 | Imagen | Imágenes nítidas, coherentes con la marca y sin aspecto de banco genérico; los huecos pendientes tienen buen aspecto |
| 7 | Móvil | Sin desbordes, botones cómodos para el pulgar, menú usable y acción principal siempre a mano |
| 8 | Personalidad | Se reconoce la personalidad del brief y no parece una plantilla |
| 9 | Acción | La acción principal es evidente y se repite donde toca, sin agobiar |
| 10 | Acabado | Alineaciones exactas, iconos centrados, sin textos cortados ni elementos que se solapan, estados de foco y hover cuidados |

# Requisitos y calidad

## 1. Plantilla de `.fabrica/requisitos.md`

Se escribe en la fase de preparación a partir del brief. Cada criterio de aceptación debe poder comprobarse con un comando, una captura o una lectura objetiva.

```markdown
# Requisitos: <cliente>

## Objetivo
- Objetivo de negocio: <p. ej. conseguir peticiones de presupuesto de reformas en Valencia>
- Acción principal del visitante: <llamar | WhatsApp | formulario | reservar | comprar>
- Público: <…>

## Mapa del sitio
| Ruta | Página | Objetivo | Secciones | Palabra clave principal |
| --- | --- | --- | --- | --- |
| / | Inicio | … | Hero, servicios, proceso, preguntas, contacto | … |

## Funcionalidades
| Id | Funcionalidad | Criterio de aceptación |
| --- | --- | --- |
| F1 | Formulario de contacto | Campos nombre, correo, teléfono opcional y mensaje; casilla de privacidad obligatoria; envío por <modo>; página /gracias |
| F2 | Botón de WhatsApp | Visible en todas las páginas; abre wa.me con mensaje predefinido |

## Requisitos no funcionales
- Lighthouse móvil de 90 o más en rendimiento, accesibilidad, buenas prácticas y SEO en todas las páginas.
- WCAG 2.2 AA: 0 fallos graves o críticos en axe y navegación completa con teclado.
- Sin desbordamiento horizontal desde 360 px de ancho.
- Textos legales conformes con la LSSI y el RGPD; sin cookies no exentas sin consentimiento.
- Sin errores en consola ni recursos rotos.

## Fuera de alcance
- <lo que no se hará, para que nadie lo espere>

## Pendientes del cliente
- <lo registrado con pendiente-cliente>
```

## 2. Puertas de calidad

Para dar la fase de calidad por terminada deben cumplirse todas:

| # | Comprobación | Cómo | Umbral |
| --- | --- | --- | --- |
| 1 | Formato, espacios, tipos, compilación y tests | `npm run verificar` | En verde |
| 2 | Auditoría automática | `node scripts/auditar-ui.mjs --lighthouse` con la vista previa en marcha | APTO (0 bloqueantes) |
| 3 | Lighthouse móvil | Incluido en la auditoría; pasa todas las rutas con `--lighthouse-rutas` si hay más de 5 | 90 o más en las 4 categorías, en todas las páginas |
| 4 | Accesibilidad | axe en la auditoría y los tests | 0 graves o críticos; avisos revisados |
| 5 | Enlaces | Auditoría | 0 internos rotos; externos revisados con `--externos` en la vuelta final |
| 6 | Revisión visual | Capturas de móvil y escritorio con la rúbrica de `diseno.md` | Ningún criterio por debajo de 4 y media de 4,3 o más |
| 7 | Requisitos | `fabrica:revisor-requisitos` | Todos los criterios cumplidos o justificados |
| 8 | Código | `fabrica:revisor-codigo` | Ningún hallazgo de severidad alta |
| 9 | Contenido de relleno | Auditoría | Solo quedan marcadores `PENDIENTE(cliente)` registrados; ningún texto de ejemplo de la plantilla |

En la vuelta final ejecuta la auditoría con `--estricto --ignorar-texto "PENDIENTE\(cliente\)"` para que cualquier otro resto de relleno bloquee.

## 3. Encargos para los revisores

Lánzalos en paralelo (varias llamadas a Agent en el mismo mensaje, sin segundo plano), con la vista previa en marcha y las capturas ya generadas. No les pidas que arreglen nada: solo que informen.

**`fabrica:revisor-requisitos`**

```text
Revisa si la web cumple lo acordado. Lee .fabrica/brief.md, .fabrica/requisitos.md y .fabrica/contenido.md.
La web está en marcha en http://localhost:<puerto> y las capturas en .fabrica/auditoria/capturas/.
Comprueba cada página del mapa del sitio y cada criterio de aceptación; busca también datos inventados
(cifras, testimonios, años, premios que no estén en el brief).
Responde con una tabla: requisito | cumple / parcial / no cumple | evidencia | arreglo propuesto, y una lista
de datos que parezcan inventados.
```

**`fabrica:revisor-visual`**

```text
Eres director de arte. Revisa las capturas de .fabrica/auditoria/capturas/ (móvil y escritorio de cada página)
con la dirección de .fabrica/diseno.md y la rúbrica de 10 criterios que te paso: <pega la tabla de la rúbrica>.
Puntúa cada página y criterio de 1 a 5 y da los 10 cambios concretos que más mejorarían el resultado,
ordenados por impacto, indicando página, zona y qué cambiar (no «mejorar el diseño»).
```

**`fabrica:revisor-codigo`**

```text
Revisa el código de la web (git diff <commit-base>..HEAD, sin package-lock.json). Busca errores, accesibilidad
en el marcado, datos del negocio escritos fuera de src/config/sitio.ts, colores sueltos fuera de los tokens,
imágenes sin dimensiones u optimización, scripts de terceros sin declarar, y cualquier riesgo de seguridad.
Clasifica cada hallazgo como alta, media o baja, con fichero, línea y arreglo propuesto.
```

Integra los hallazgos: arregla todo lo de severidad alta y media, y lo bajo que sea barato. Registra como decisión lo que descartes y por qué. **Después de corregir, vuelve a generar las capturas y a pedir la puntuación visual**: la nota que va a la entrega es la de la versión final, no la de una vuelta anterior.

## 4. Pruebas adicionales que se añaden a `tests/sitio.spec.ts`

- Cada página nueva, en `PAGINAS`.
- Cada funcionalidad con un criterio comprobable: menú, galería (abre y cierra con Esc), selector de idioma (lleva a la página equivalente), botón de compra (enlaza a un enlace de pago o a contacto) y redirecciones (si el alojamiento las sirve en local; si no, anótalo).
- Si el formulario usa `endpoint`, una prueba que intercepte la petición (`page.route`) y compruebe el mensaje de éxito y el de error.

## 5. Definición de terminado

**Contenido**
- [ ] Todas las páginas del mapa del sitio existen y tienen su contenido definitivo.
- [ ] Ningún dato inventado; los pendientes están marcados y registrados.
- [ ] Ortografía y estilo de castellano de España revisados.

**Diseño**
- [ ] Rúbrica visual aprobada en móvil y escritorio.
- [ ] Favicon, icono de Apple e imagen social generados con la identidad final.
- [ ] Sin páginas de ejemplo de la plantilla ni la guía de estilo enlazada (la guía se puede quedar con noindex o borrarse).

**Técnica**
- [ ] `npm run verificar` en verde.
- [ ] Auditoría APTO en modo estricto (ignorando solo los `PENDIENTE(cliente)`).
- [ ] Lighthouse móvil de 90 o más en todas las páginas.
- [ ] `sitio.url` con el dominio definitivo, o pendiente si aún no existe.
- [ ] 404 personalizada, `robots.txt` y sitemap correctos.

**SEO**
- [ ] Title y meta descripción únicos, h1 único, URLs limpias y enlaces internos.
- [ ] Datos estructurados válidos (LocalBusiness, más Service, FAQPage o Product según la web).
- [ ] Redirecciones 301 de la web antigua, si existía.

**Legal**
- [ ] Aviso legal, privacidad, cookies y accesibilidad coherentes con lo que hace la web.
- [ ] Sin cookies no exentas sin consentimiento previo.
- [ ] Tienda: condiciones de venta y desistimiento.

**Entrega**
- [ ] `ENTREGA.md`, `README.md` y `docs/` completos.
- [ ] Commit final y etiqueta `v1.0`.

# Entrevista inicial (fase 0)

El objetivo es reunir **en una sola conversación** todo lo necesario para trabajar horas sin volver a preguntar. Una pregunta que falte ahora se convierte después en una decisión a ciegas.

## Cómo preguntar

- Antes de preguntar, aprovecha lo que ya hay: `$ARGUMENTS`, `brief.md` o `.fabrica/brief.md` y la web actual del cliente si se conoce la URL (WebFetch). **No preguntes lo que ya sabes.**
- Pregunta con `AskUserQuestion`, en rondas de hasta 4 preguntas. Pon como primera opción la recomendada, con «(Recomendado)» al final de su etiqueta.
- Para respuestas libres (nombre, dirección, URLs, rutas de ficheros), indica en la pregunta que se escriben en «Otro».
- Si el usuario responde «decide tú», aplica el valor por defecto de la tabla final y regístralo como decisión.
- No termines el turno durante la entrevista: todas las preguntas van por `AskUserQuestion`.
- Si el usuario aporta ficheros (logo, fotos, textos), pide la ruta dentro de la carpeta del proyecto y comprueba que existen con `ls`.

## Rondas

Salta las preguntas cuya respuesta ya conozcas. Si una ronda queda vacía, sáltala.

### Ronda 1 — El negocio y el objetivo

1. **Negocio** (respuesta libre): «Describe el negocio: nombre, a qué se dedica, ciudad o zona, a quién se dirige y qué lo diferencia. Escríbelo en «Otro».» Opciones: «Está en el brief» (lo tienes en `brief.md`) y «Sácalo de su web actual» (la URL va en «Otro»).
2. **Objetivo principal de la web** (multiselección): conseguir llamadas o mensajes de WhatsApp; recibir peticiones de presupuesto por formulario; reservas o citas online; vender online.
3. **Web actual**: no tiene; tiene y hay que aprovechar contenidos y redirigir sus URLs (la URL va en «Otro»); tiene, pero se descarta entera.
4. **Público**: particulares; empresas; ambos; turistas o visitantes de otras zonas.

### Ronda 2 — Alcance

1. **Tipo de web**:
   - Web Esencial (Recomendado para empezar): una sola página con hasta 6 secciones y página de contacto.
   - Web Profesional: hasta 10 páginas, con servicios detallados y blog opcional.
   - Web Avanzada: tienda online, sistema de reservas o área privada.
2. **Páginas o secciones** (multiselección, la descripción explica cada una): servicios con página propia; sobre nosotros y equipo; galería o portfolio de trabajos; blog o noticias. Añade en la descripción que en «Otro» puede pedir más (preguntas frecuentes, tarifas, testimonios, zonas de servicio, trabaja con nosotros).
3. **Idiomas**: solo castellano (Recomendado); castellano e inglés; castellano y lengua cooficial (catalán, euskera, gallego o valenciano); otros (en «Otro»).
4. **Funcionalidades extra** (multiselección): botón de WhatsApp; mapa de ubicación; reservas o citas online (indica en «Otro» si ya usa Calendly, Cal.com, Google Calendar u otra herramienta); boletín de noticias.

### Ronda 3 — Marca y estilo

1. **Identidad visual**: tiene logotipo y colores (rutas de ficheros en «Otro»); solo tiene logotipo; no tiene nada (se crea un logotipo tipográfico, un monograma y una paleta).
2. **Personalidad de marca**: cercana y cálida; profesional y sobria; moderna y tecnológica; elegante y premium.
3. **Referencias**: webs que le gustan y qué le gusta de cada una (URLs en «Otro»); sin referencias, decide tú (Recomendado).
4. **Fotos**: aporta fotos propias (ruta de la carpeta en «Otro»); no tiene fotos, usa ilustraciones y composiciones gráficas y marca los huecos para fotos reales (Recomendado); usa bancos de imágenes libres de derechos.

### Ronda 4 — Contenido y datos

1. **Textos**: los redacta Claude a partir del brief y la investigación (Recomendado); el cliente aporta los textos (ruta en «Otro»); se aprovechan los de la web actual y se mejoran.
2. **Datos de contacto y del titular** (para la web y los textos legales): los escribo ahora (teléfono, correo, dirección, horario, razón social, NIF y domicilio en «Otro»); déjalos como pendientes y los confirmo antes de publicar.
3. **Opiniones de clientes**: tiene testimonios reales con permiso para publicarlos (ruta o texto en «Otro»); no se incluyen (Recomendado si no hay). Recuerda en la descripción que nunca se inventan.
4. **Precios en la web**: no se muestran (Recomendado); se muestran «desde» un importe; se muestra la lista completa (ruta o texto en «Otro»).

### Ronda 5 — Técnica, permisos y entrega

1. **Alojamiento**: Netlify (Recomendado: formularios sin programar y plan gratuito con uso comercial); Cloudflare; Vercel; solo entregar el código.
2. **Dominio**: ya tiene dominio (escríbelo en «Otro»); aún no tiene; se decidirá más adelante.
3. **Permisos durante el trabajo autónomo** (multiselección):
   - Subir el código a un repositorio remoto (debe estar configurado como `origin`; la URL va en «Otro» si no lo está).
   - Publicar una versión de prueba (requiere la variable de entorno con el token del proveedor).
   - Publicar en producción. Desaconsejado: lo normal es que una persona revise antes.
4. **Analítica**: sin cookies, con Plausible o Umami (Recomendado: no requiere aviso de cookies); ninguna; Google Analytics (obliga a poner un aviso de consentimiento de cookies).

### Ronda final — Confirmación

1. Escribe `.fabrica/brief.md` con la plantilla de abajo.
2. Muestra un resumen de 6 a 10 líneas: tipo de web, páginas, objetivo, estilo, contenido, alojamiento, permisos y lo que queda como pendiente del cliente.
3. Pregunta con `AskUserQuestion`: «¿Empiezo? A partir de aquí trabajaré de forma autónoma hasta entregar, sin hacerte más preguntas.» Opciones: «Sí, empieza» y «Quiero cambiar algo» (qué, en «Otro»).
4. Registra los permisos: `estado.mjs permiso push si|no` y `estado.mjs permiso produccion si|no`.

## Valores por defecto

Úsalos cuando el usuario diga «decide tú», cuando una respuesta falte o en sesiones no interactivas. Cada uno que apliques se registra como decisión.

| Tema | Valor por defecto |
| --- | --- |
| Tipo de web | Profesional si se mencionan 3 o más servicios; si no, Esencial |
| Objetivo | Contacto por teléfono, WhatsApp (si se conoce el número) y formulario |
| Páginas (Profesional) | Inicio, Servicios (con una página por servicio si son 3 a 6), Sobre nosotros, Contacto y legales |
| Idioma | Castellano de España |
| Personalidad | Según el sector (tabla de `diseno.md`) |
| Fotos | Ilustraciones y composiciones gráficas, con huecos marcados para fotos reales |
| Textos | Los redacta Claude |
| Datos del titular | `PENDIENTE(cliente)` |
| Testimonios | No se incluyen |
| Precios | No se muestran |
| Alojamiento | Netlify |
| Analítica | Ninguna (se deja preparada Plausible en `sitio.ts`) |
| Permisos | Sin push ni publicación |

## Plantilla de `.fabrica/brief.md`

```markdown
# Brief: <nombre del negocio>

Fecha: <AAAA-MM-DD> · Fuente: <entrevista | brief del comercial | mixto>

## Negocio
- Nombre comercial:
- Actividad:
- Ciudad o zona de servicio:
- Público:
- Diferenciación (lo que dice el cliente, sin adornar):
- Web actual: <URL o «no tiene»> — <aprovechar | descartar>

## Objetivo de la web
- Objetivo principal:
- Acción principal que debe hacer el visitante (llamar, escribir, reservar, comprar):

## Alcance
- Tipo de web: <Esencial | Profesional | Avanzada>
- Páginas:
- Idiomas:
- Funcionalidades:

## Marca y estilo
- Logotipo y colores:
- Personalidad:
- Referencias (URL y qué gusta):
- Fotos:

## Contenido
- Textos:
- Servicios (nombre y descripción breve de cada uno):
- Testimonios reales:
- Precios:

## Datos de contacto y del titular
- Teléfono / WhatsApp / correo:
- Dirección / horario:
- Redes sociales:
- Razón social / NIF / domicilio social / datos registrales:

## Técnica y permisos
- Alojamiento:
- Dominio:
- Subir el código a un remoto: <sí | no> (remoto: …)
- Publicar versión de prueba: <sí | no>
- Publicar en producción: <sí | no>
- Analítica:

## Pendientes del cliente
- …
```

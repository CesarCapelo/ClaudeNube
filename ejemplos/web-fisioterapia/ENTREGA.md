# Entrega: web de Fisioterapia Lucía Martín

2026-10-21 · versión v1.0 · Producida de forma autónoma con la fábrica de webs. **Pendiente de revisión humana.**

## Resumen

Web profesional de una clínica de fisioterapia en Getafe (Sector III) con tres líneas: fisioterapia deportiva, suelo pélvico (embarazo y posparto) y dolor de espalda y cuello. Once páginas: inicio, tres de servicio, sobre mí, contacto, gracias y cuatro legales, más 404 y una guía de estilo interna (`noindex`). La acción principal es escribir por WhatsApp o llamar; hay también formulario y mapa de carga diferida. Estado: **lista para revisar, no para publicar**: faltan datos del titular, fotos y la confirmación de los textos sanitarios (ver pendientes).

## Cómo verla

- En local: `npm ci && npm run build && npx astro preview` y abrir http://localhost:4321
- Versión de prueba: no publicada (el brief no autoriza publicar y no hay token de Netlify).

## Qué incluye

| Página                    | Ruta                                                                          | Objetivo                                            |
| ------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------- |
| Inicio                    | `/`                                                                           | Presentar la clínica y llevar a pedir cita          |
| Fisioterapia deportiva    | `/fisioterapia-deportiva`                                                     | Captar corredores y deportistas populares           |
| Suelo pélvico             | `/suelo-pelvico`                                                              | Captar mujeres en embarazo y posparto               |
| Dolor de espalda y cuello | `/dolor-de-espalda-y-cuello`                                                  | Captar personas con dolor de espalda o cuello       |
| Sobre mí                  | `/sobre-mi`                                                                   | Dar confianza: quién atiende y cómo trabaja         |
| Contacto                  | `/contacto`                                                                   | WhatsApp, llamada, formulario, horario y mapa       |
| Gracias                   | `/gracias`                                                                    | Confirmación del formulario (`noindex`)             |
| Legales                   | `/aviso-legal`, `/politica-privacidad`, `/politica-cookies`, `/accesibilidad` | LSSI y RGPD                                         |
| Guía de estilo (interna)  | `/guia-estilo`                                                                | Referencia de diseño (`noindex`, fuera del sitemap) |

Funcionalidades: formulario con Netlify Forms (honeypot y casilla de privacidad), botón flotante de WhatsApp y icono de llamada en la cabecera móvil, mapa que no carga Google hasta que se pulsa, datos estructurados (Physiotherapy, Service, BreadcrumbList y FAQPage), sitemap, `robots.txt` y 404 propia. Sin analítica ni cookies.

## Resultados de calidad

| Comprobación                              | Resultado                                                                                                                                                                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tests de navegador (escritorio y móvil)   | 49 superados, 1 omitido a propósito (menú móvil en escritorio)                                                                                                                                                                                   |
| Lighthouse móvil (10 páginas indexables)  | 100 · 100 · 100 · 100 en todas. `/gracias` no se mide en SEO (`noindex` intencionado)                                                                                                                                                            |
| Accesibilidad (axe)                       | 0 fallos graves o críticos                                                                                                                                                                                                                       |
| Enlaces internos rotos                    | 0 (Instagram devuelve 429 a la auditoría; comprobar a mano)                                                                                                                                                                                      |
| Desbordamiento horizontal a 360 px        | 0 páginas con desborde (prueba automática en las 10 páginas)                                                                                                                                                                                     |
| Revisión visual (rúbrica de 10 criterios) | **3,7/5 en la 3.ª vuelta del revisor: no alcanza el objetivo de 4,3.** Notas bajas por los huecos de foto (Imagen y Personalidad en 3) y por las páginas legales; después se corrigieron tablas, mapa y puntos de servicio, sin nueva puntuación |
| Revisores de requisitos y de código       | Sin hallazgos de severidad alta; los medios se corrigieron (ver decisiones)                                                                                                                                                                      |

Informe completo: `.fabrica/auditoria/informe.md` (se regenera con `npm run auditar`). Los avisos que quedan en la auditoría son los marcadores intencionados «Foto pendiente» y `PENDIENTE(cliente)`.

## Decisiones tomadas sin consultar

- No hubo entrevista interactiva: se trabajó con el brief del comercial, que cubría todo, y con valores por defecto.
- Navegación plana, rutas de servicio en la raíz y sin página índice de servicios.
- Dirección visual: verde salvia con acento terracota; Figtree (títulos) e Inter (texto); monograma «LM» provisional como logotipo.
- Sin precios, testimonios, años de experiencia ni cifras: el brief no las da.
- Huecos de foto visibles y etiquetados («Foto pendiente: …») en lugar de fotos de banco.
- Textos sanitarios sin promesas de curación ni plazos; invitación a consultar al médico ante síntomas de alarma.
- Política de privacidad ampliada con datos de salud (no pedirlos por formulario ni WhatsApp) y WhatsApp.
- La guía de estilo se mantiene publicada con `noindex` y sin formulario.
- `sitio.url = https://fisioluciamartin.es` (sin `www`; dominio aún sin comprar).

El resto, en `.fabrica/decisiones.md`.

## Pendientes del cliente

Detalle en `.fabrica/pendientes-cliente.md`:

1. Fotos de la clínica y de Lucía (hay seis huecos marcados).
2. Número de colegiada y colegio profesional; número de autorización sanitaria del centro.
3. Razón social o nombre completo, NIF y domicilio del titular.
4. Comprar el dominio `fisioluciamartin.es` y crear el sitio en Netlify.
5. Confirmar o sustituir el monograma provisional.
6. Validar los textos sanitarios y «Sobre mí»; confirmar si trabaja con seguros o mutuas y si exigen derivación.
7. Revisión de los textos legales por un asesor y política específica para la historia clínica.

## Limitaciones y lo que no se pudo verificar

- El envío real del formulario no se ha probado: requiere desplegar en Netlify y configurar el destino de las notificaciones.
- No se publicó ninguna versión de prueba (sin permiso ni token), así que la auditoría se hizo en local.
- La investigación de competencia salió de fichas de directorios, no de las webs de las clínicas; no hay volúmenes de búsqueda, así que las palabras clave son hipótesis.
- La conformidad con la normativa de publicidad sanitaria no se ha podido contrastar con una norma específica: hay que confirmarla con el colegio profesional.
- Los textos legales son de plantilla ajustada; no sustituyen la revisión de un asesor. Plazo de conservación (un año) y menores de 14 años son valores por defecto de la plantilla.
- No se hizo una prueba manual con lector de pantalla; la accesibilidad se verificó con axe, Lighthouse y pruebas automáticas de teclado.
- Enlaces externos: solo se comprobó Instagram, que responde 429 a la auditoría automática; verificar a mano que el perfil `fisioluciamartin` existe.
- La puerta visual (media ≥ 4,3) no se alcanzó: depende en buena parte de las fotos reales y del logotipo definitivo, que son pendientes del cliente.

## Revisión humana recomendada (unos 60 minutos)

- [ ] Recorrer todas las páginas en un móvil real y en un ordenador.
- [ ] Leer los textos completos buscando tono, errores o afirmaciones que Lucía no haya confirmado.
- [ ] Comprobar teléfono, correo, dirección y horario contra el brief.
- [ ] Revisar las decisiones tomadas sin consultar y cambiar las que no convenzan.
- [ ] Navegar solo con teclado (Tab, Mayús+Tab, Intro, Esc) por inicio y contacto.
- [ ] Revisar los textos legales con los datos del titular.
- [ ] Decidir con Lucía los pendientes y la fecha de publicación.

## Cómo publicar

Ver `docs/puesta-en-produccion.md`.

## Mantenimiento recomendado

Revisión trimestral de textos, horario y datos legales; añadir fotos reales en cuanto lleguen; valorar un blog con preguntas reales de pacientes y analítica sin cookies (Plausible) cuando la clínica quiera medir resultados.

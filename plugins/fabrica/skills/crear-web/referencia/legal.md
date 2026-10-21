# Cumplimiento legal en España

La plantilla trae aviso legal, privacidad, cookies y declaración de accesibilidad, generados desde `sitio.ts`. Esta guía explica qué ajustar según lo que haga cada web. No sustituye a un abogado: en la entrega se recomienda siempre que el cliente o su asesor revise los textos antes de publicar.

## 1. Lo que toda web lleva (ya incluido)

| Página | Norma | Qué revisar |
| --- | --- | --- |
| Aviso legal | LSSI, art. 10 | Titular, NIF, domicilio, correo y teléfono. Si es sociedad, datos registrales (Registro Mercantil, tomo, folio, hoja). Si es una profesión regulada, colegio, número de colegiado, título y Estado que lo expidió |
| Política de privacidad | RGPD y LOPDGDD | Tabla de tratamientos: añade una fila por cada formulario o herramienta nueva (reservas, boletín, tienda, chat). Lista de encargados (alojamiento, formularios, reservas, correo) |
| Política de cookies | LSSI, art. 22.2 y guía de la AEPD | Inventario real de cookies (ver sección 2) |
| Accesibilidad | Buenas prácticas; obligatoria en algunos casos (sección 6) | Que lo declarado se corresponda con la auditoría |

La información básica de protección de datos junto al formulario (primera capa) y la casilla de aceptación sin marcar ya están en `FormularioContacto.astro`.

## 2. Cookies: evita el banner si puedes

Sin cookies ni rastreadores no exentos, no hace falta aviso de consentimiento. Es la opción por defecto y la recomendada:

- **Analítica sin cookies**: Plausible o Umami (`sitio.analitica`).
- **Mapas, vídeos y widgets diferidos**: el mapa ya usa `MapaDiferido.astro`, que no carga Google hasta que se pulsa. Haz lo mismo con YouTube (`youtube-nocookie.com` y carga al pulsar) y con cualquier widget de terceros.
- **Fuentes autoalojadas**: Fontsource ya sirve las tipografías desde la propia web, sin pedir nada a Google Fonts.

Si el cliente exige Google Analytics, el píxel de Meta, un chat de terceros u otra herramienta con cookies no exentas:

1. Hace falta un sistema de consentimiento que **bloquee** esas cookies hasta que se acepten, con «Rechazar» igual de visible que «Aceptar» en la primera capa, opciones por finalidad, nada premarcado y un enlace permanente para cambiar la elección.
2. Usa una solución de código abierto ligera (por ejemplo, la librería CookieConsent de Orest Bida) y el modo de consentimiento de Google en estado «denegado» por defecto. Lee su documentación vigente con WebFetch antes de implementarla.
3. Actualiza la tabla de cookies (nombre, titular, finalidad, duración) y la política de privacidad.
4. Regístralo como decisión y como aviso en la entrega: el cliente asume más obligaciones.

## 3. Formularios, boletín y comunicaciones comerciales

- La finalidad «responder a tu consulta» no incluye enviar publicidad. Si el cliente quiere enviar novedades, añade una **segunda casilla, opcional y separada**: «Quiero recibir novedades y ofertas por correo» (LSSI, art. 21).
- **Boletín**: doble confirmación (el proveedor envía un correo de verificación), enlace de baja en cada envío y proveedor con contrato de encargado del tratamiento (Brevo o MailerLite, por ejemplo). Añádelo a la política de privacidad.
- Si el público son **menores de 14 años**, el consentimiento lo dan sus padres o tutores (LOPDGDD, art. 7). Indícalo en el formulario y en la política.

## 4. Tienda online

Además de lo anterior:

- **Condiciones generales de contratación** (`/condiciones-de-venta`): identidad del vendedor; precios con IVA incluido y gastos de envío; formas de pago; plazos y zonas de entrega; derecho de desistimiento de 14 días naturales con sus excepciones; garantía legal de conformidad de 3 años para bienes; atención al cliente y reclamaciones; ley aplicable. Marca con `PENDIENTE(cliente)` lo que dependa de su operativa.
- **Formulario de desistimiento** descargable o en una página.
- El botón final de compra debe dejar claro que implica pagar («Pagar» o «Pedido con obligación de pago»). Stripe Checkout ya cumple.
- Información de pago y de envío visible **antes** de la compra.
- Nunca se guardan datos de tarjetas en la web: el cobro va siempre por la pasarela.

## 5. Reservas y citas

La herramienta de reservas (Cal.com, Calendly u otra) es encargada del tratamiento: añádela a la tabla y a la lista de destinatarios de la política de privacidad. Si se piden datos de salud (motivo de la consulta en una clínica), recoge solo lo imprescindible y avisa en los pendientes de que el cliente debe valorar ese tratamiento de categoría especial.

## 6. Accesibilidad

- El objetivo de la fábrica es WCAG 2.2 AA en todas las webs.
- Desde el 28 de junio de 2025, la Ley 11/2023 (transposición del Acta Europea de Accesibilidad) exige accesibilidad a los servicios de comercio electrónico dirigidos a consumidores, salvo a las microempresas (menos de 10 personas empleadas y hasta 2 millones de euros de volumen de negocio o de balance). Si una tienda no es de una microempresa, menciónalo en la entrega: la declaración de accesibilidad pasa a ser obligatoria.

## 7. Contenido e imágenes

- Las imágenes y los textos de terceros solo se usan con licencia; anota la fuente en `.fabrica/imagenes.md`.
- Las imágenes sintéticas no pueden hacerse pasar por fotos reales del negocio. Si se usa alguna imagen generada por IA de aspecto realista, se etiqueta como tal.
- Testimonios, reseñas y valoraciones solo pueden ser reales y verificables.

## 8. Pendientes legales típicos para el cliente

Regístralos con `pendiente-cliente` cuando apliquen:

- Confirmar razón social, NIF, domicilio y datos registrales o colegiales.
- Confirmar los encargados del tratamiento y firmar sus contratos (alojamiento, formularios, reservas, boletín).
- Revisar las condiciones de venta (tienda) y la operativa de devoluciones.
- Validar los textos de sectores regulados (salud, legal, financiero, alimentación).
- Revisión de todos los textos legales por su asesor antes de publicar.

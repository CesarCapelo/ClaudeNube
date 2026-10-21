# Puesta en producción

## Antes de publicar

- [ ] Revisión humana de `ENTREGA.md` completada.
- [ ] Pendientes del cliente resueltos (`.fabrica/pendientes-cliente.md`); `grep -rn "PENDIENTE" src` no da resultados.
- [ ] Fotos reales de la clínica y de Lucía en `src/assets/`, sustituyendo los huecos de `HuecoFoto` por `<Image />` con `width` y `height`.
- [ ] `sitio.url` en `src/config/sitio.ts` con el dominio definitivo (ahora `https://fisioluciamartin.es`).
- [ ] Titular, NIF, domicilio, número de colegiada y colegio rellenados en `sitio.titular`.
- [ ] Textos legales y sanitarios revisados por Lucía y, si es posible, por un asesor.
- [ ] Autorización sanitaria del centro confirmada (la publicidad sanitaria debe ajustarse a ella).

## Alojamiento (Netlify)

- [ ] Sitio creado en la cuenta del cliente y conectado al repositorio (despliegue automático desde `main`). `netlify.toml` ya incluye comando, carpeta, Node 24 y cabeceras de seguridad.
- [ ] En Netlify, **Forms → Notifications**: enviar los mensajes del formulario «contacto» a `hola@fisioluciamartin.es`.
- [ ] Activar la detección de formularios (Site configuration → Forms) y hacer un envío de prueba.

## Dominio

- [ ] Comprar `fisioluciamartin.es` (aún no está comprado) y añadirlo en Netlify con el DNS que indique.
- [ ] Certificado HTTPS activo y redirección de `www` a la versión canónica (sin `www`).
- [ ] Si se usa el correo `hola@fisioluciamartin.es`: registros SPF, DKIM y DMARC del proveedor de correo.

## Después de publicar

- [ ] `node scripts/auditar-ui.mjs --url https://fisioluciamartin.es --lighthouse --externos` en verde.
- [ ] Envío real del formulario recibido en el correo.
- [ ] Google Search Console: propiedad verificada y sitemap enviado (`https://fisioluciamartin.es/sitemap-index.xml`).
- [ ] Ficha de Google Business Profile con la URL de la web y los mismos nombre, dirección y teléfono.
- [ ] Monitor de disponibilidad (por ejemplo, UptimeRobot) avisando a `hola@fisioluciamartin.es`.
- [ ] Sin analítica configurada: si se quiere medir visitas, activar Plausible o Umami en `sitio.analitica` y actualizar la política de privacidad.

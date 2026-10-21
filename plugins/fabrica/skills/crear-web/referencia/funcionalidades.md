# Funcionalidades

Recetas para lo que pida el brief. Antes de implementar una integración de terceros, si hay red, consulta su documentación vigente con WebFetch: las APIs cambian. Cada funcionalidad añadida se refleja en la política de privacidad y en la de cookies (`legal.md`) y en `tests/sitio.spec.ts`.

## Formularios según el alojamiento

`sitio.formulario.modo` decide cómo se envía el formulario de `FormularioContacto.astro`.

| Alojamiento | Modo | Qué hacer |
| --- | --- | --- |
| Netlify | `netlify` (por defecto) | Nada más: Netlify detecta el formulario al desplegar. En la entrega, indica que active las notificaciones por correo en *Forms → Notifications*. Proveedor en la política: «Netlify, Inc.» |
| Cloudflare | `endpoint` | Crea `functions/api/contacto.ts` (abajo). Variables en Cloudflare: `BREVO_API_KEY`, `CONTACTO_DESTINO`, `CONTACTO_REMITENTE` |
| Vercel | `endpoint` | Función en `api/contacto.ts` con la misma lógica (`export async function POST(request: Request)`) |
| Solo código | `endpoint` hacia un servicio de formularios (Web3Forms, Formspree) o `mailto` | Regístralo como decisión; el servicio elegido va a la política de privacidad |

Función de Cloudflare Pages con Brevo, un proveedor europeo de correo transaccional:

```ts
// functions/api/contacto.ts
interface Env {
  BREVO_API_KEY: string;
  CONTACTO_DESTINO: string;
  CONTACTO_REMITENTE: string;
}

const escapar = (t: string) =>
  t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const esJson = request.headers.get('content-type')?.includes('application/json');
  const datos = esJson
    ? ((await request.json()) as Record<string, string>)
    : Object.fromEntries(await request.formData());
  const { nombre = '', email = '', telefono = '', mensaje = '', empresa_web, acepta_privacidad } =
    datos as Record<string, string>;

  if (empresa_web) return Response.json({ ok: true }); // trampa para bots
  if (!nombre || !/^\S+@\S+\.\S+$/.test(email) || !mensaje || !acepta_privacidad) {
    return Response.json({ ok: false, error: 'Datos incompletos' }, { status: 400 });
  }

  const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      sender: { email: env.CONTACTO_REMITENTE, name: 'Web' },
      to: [{ email: env.CONTACTO_DESTINO }],
      replyTo: { email, name: nombre },
      subject: `Nuevo mensaje de ${nombre} desde la web`,
      htmlContent: `<p><b>Nombre:</b> ${escapar(nombre)}<br><b>Correo:</b> ${escapar(email)}<br><b>Teléfono:</b> ${escapar(telefono)}</p><p>${escapar(mensaje).replace(/\n/g, '<br>')}</p>`,
    }),
  });

  if (!respuesta.ok) return Response.json({ ok: false }, { status: 502 });
  return esJson ? Response.json({ ok: true }) : Response.redirect(new URL('/gracias', request.url), 303);
};
```

Sin credenciales no se puede probar el envío real: compila, prueba la validación y anota en los pendientes que hay que configurar las variables y hacer un envío de prueba.

## Blog

Viene en la plantilla (`src/content.config.ts`, `src/pages/blog/`). Para activarlo:

1. Añade «Blog» a `sitio.navegacion`.
2. Escribe los artículos en `src/content/blog/<slug>.md` con `borrador: false`. Escribe artículos iniciales solo si el brief los pide, con las reglas de `contenido-seo.md`.
3. Borra el artículo de ejemplo `bienvenida.md`.
4. Añade `/blog` y un artículo a `PAGINAS` en los tests.

Si no hay blog, borra `src/pages/blog`, `src/content` y `src/content.config.ts`.

## Edición por el cliente (CMS)

Por defecto no se instala CMS: los cambios se hacen dentro del plan de mantenimiento. Si el brief pide que el cliente edite contenidos (normalmente el blog):

- Usa **Pages CMS** (pagescms.org): no añade código a la web, solo un fichero `.pages.yml` en la raíz. El cliente entra con su cuenta y edita el repositorio de GitHub. Consulta su documentación vigente con WebFetch antes de escribir la configuración.

  ```yaml
  media:
    input: src/assets/blog
    output: /src/assets/blog
  content:
    - name: blog
      label: Blog
      type: collection
      path: src/content/blog
      filename: '{fields.titulo}.md'
      fields:
        - { name: titulo, label: Título, type: string, required: true }
        - { name: descripcion, label: Descripción para buscadores, type: text, required: true }
        - { name: fecha, label: Fecha, type: date, required: true }
        - { name: borrador, label: Borrador, type: boolean, default: false }
        - { name: body, label: Contenido, type: rich-text }
  ```

- Documenta en `docs/manual-cliente.md` cómo entrar, crear un artículo y publicarlo (cada cambio en GitHub vuelve a desplegar la web).

## Reservas y citas

- **Opción recomendada:** un botón que abre la página de reservas de la herramienta del cliente (Cal.com, Calendly, la agenda de citas de Google Calendar…) en una pestaña nueva. No carga cookies en la web.
- Si el brief quiere el calendario incrustado, cárgalo solo al pulsar (como `MapaDiferido.astro`) y declara la herramienta en las políticas de privacidad y cookies.
- Sin herramienta en el brief: botón a la página de contacto y pendiente del cliente «Elegir herramienta de reservas».

## Tienda sencilla (hasta unos 50 productos)

Con Stripe Payment Links: el cliente crea los productos y sus enlaces de pago en su cuenta de Stripe, y la web solo los muestra. No se maneja ningún dato de pago.

1. Colección de productos:

   ```ts
   // src/content.config.ts (además de blog, si existe)
   import { file } from 'astro/loaders';
   const productos = defineCollection({
     loader: file('src/content/productos.json'),
     schema: ({ image }) =>
       z.object({
         id: z.string(),
         nombre: z.string(),
         descripcion: z.string(),
         precio: z.number().positive(), // con IVA, en euros
         imagen: image(),
         enlacePago: z.string().url().or(z.literal('PENDIENTE')),
         disponible: z.boolean().default(true),
       }),
   });
   ```

2. Página `/tienda` en cuadrícula y una página por producto con datos estructurados `Product` (con `offers`, `price` y `priceCurrency: 'EUR'`).
3. Botón «Comprar» al enlace de pago. Si el enlace es `PENDIENTE`, se muestra «Consultar disponibilidad», que lleva al contacto, y se registra el pendiente.
4. Páginas legales de tienda (`legal.md`, sección 4) y enlace a ellas en el pie.

Para catálogos grandes, inventario o envíos complejos, recomienda en la entrega Shopify y enlaza desde la web: no se construye un comercio electrónico a medida dentro de este paquete.

## Varios idiomas

Astro tiene enrutado por idioma integrado:

```js
// astro.config.mjs
i18n: {
  locales: ['es', 'en'],
  defaultLocale: 'es',
  routing: { prefixDefaultLocale: false },
},
```

- Las páginas en inglés van en `src/pages/en/` con las mismas rutas traducidas.
- Textos de interfaz (menú, botones, pie) en `src/i18n/textos.ts` con un objeto por idioma. `sitio.ts` añade los campos traducibles (`eslogan`, `descripcion`, `navegacion`) por idioma.
- El layout recibe el idioma y pone `lang`, las etiquetas `<link rel="alternate" hreflang="…">` recíprocas y `x-default`, y un selector de idioma en la cabecera que enlaza a la página equivalente (`getRelativeLocaleUrl` de `astro:i18n`).
- Los textos legales también se traducen. Las traducciones las redacta Claude con calidad nativa, no de forma literal.
- La auditoría debe recorrer ambos idiomas; pasa las rutas con `--rutas` si el selector no enlaza todas.

## Redirecciones desde la web antigua

Con la lista de URLs antiguas de la investigación, crea redirecciones 301 a su equivalente nueva (o a la sección más cercana; nunca todo al inicio):

- Netlify y Cloudflare Pages: `public/_redirects`, con una línea por redirección: `/antigua-url /nueva-url 301`.
- Vercel: `vercel.json` → `{ "redirects": [{ "source": "/antigua-url", "destination": "/nueva-url", "permanent": true }] }`.

## Otras piezas frecuentes

| Pieza | Cómo |
| --- | --- |
| WhatsApp | `sitio.contacto.whatsapp` con el número internacional sin «+» (el botón ya existe) |
| Mapa | `MapaDiferido.astro` (ya existe). Si hay coordenadas, rellena `sitio.geo` |
| Horario | `sitio.horario` (texto y formato schema.org) |
| Galería | Cuadrícula de `<Image />` con `alt` descriptivo; ampliación con `<dialog>` nativo accesible (cierre con Esc y foco devuelto) |
| Preguntas frecuentes | `<details>`/`<summary>` estilizados y FAQPage en JSON-LD (`contenido-seo.md`) |
| Vídeo | Imagen de portada y carga al pulsar; `youtube-nocookie.com` |
| Testimonios | Solo reales: cita, nombre (o iniciales si el cliente lo pide) y contexto; sin estrellas inventadas |
| Página de equipo | Fotos reales o, si faltan, iniciales en círculos de color de marca y pendiente del cliente |
| Trabaja con nosotros | Formulario con adjunto: mejor un correo de candidaturas y su cláusula de privacidad específica |

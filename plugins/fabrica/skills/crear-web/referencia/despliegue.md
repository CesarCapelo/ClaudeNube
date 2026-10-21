# Publicación

Regla: en modo autónomo solo se publica una **versión de prueba**, y solo si el brief lo autoriza y hay credenciales. La publicación en producción la hace una persona tras revisar, salvo permiso expreso registrado (`permiso produccion si`). El hook de protección bloquea lo demás.

Las credenciales nunca se escriben en ficheros del proyecto: se leen de variables de entorno ya definidas en la sesión. Comprueba si existen sin mostrarlas: `test -n "$NETLIFY_AUTH_TOKEN" && echo hay-token`.

## Cabeceras de seguridad y caché

Añade siempre la configuración del alojamiento elegido, aunque no se despliegue ahora.

**Netlify** (`netlify.toml` en la raíz):

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "24"

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "SAMEORIGIN"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"

[[headers]]
  for = "/_astro/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

**Cloudflare** (`public/_headers`):

```text
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/_astro/*
  Cache-Control: public, max-age=31536000, immutable
```

**Vercel** (`vercel.json`): las mismas cabeceras en `headers`, y `"framework": "astro"`.

## Versión de prueba por proveedor

| Proveedor | Variables necesarias | Comando de prueba | Producción (solo con permiso) |
| --- | --- | --- | --- |
| Netlify | `NETLIFY_AUTH_TOKEN` y `NETLIFY_SITE_ID` (o crear el sitio con `npx netlify-cli sites:create --name <slug>`) | `npx netlify-cli deploy --dir dist --message "Prueba"` | `… --prod` |
| Cloudflare Pages | `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` | `npx wrangler pages deploy dist --project-name <slug> --branch prueba` | `--branch main` |
| Vercel | `VERCEL_TOKEN` | `npx vercel deploy --yes --token "$VERCEL_TOKEN"` | `… --prod` |

Después de desplegar:

1. Guarda la URL: `estado.mjs dato url-prueba "<url>"`.
2. Audita la versión publicada: `node scripts/auditar-ui.mjs --url <url> --lighthouse --salida .fabrica/auditoria-publicada`.
3. Si el formulario depende del alojamiento (Netlify Forms, funciones), anota en los pendientes que hay que hacer un envío de prueba real y configurar el destino de las notificaciones.

Si un despliegue falla por credenciales o permisos, no insistas: regístralo y continúa con la entrega.

## Subir el código

Solo con `permiso push si`:

```bash
git remote -v                       # debe existir origin
git push -u origin HEAD --follow-tags
```

Si no hay remoto, no lo crees por tu cuenta: anótalo en la entrega.

## Contenido de `docs/puesta-en-produccion.md`

Es la checklist para la persona que publique. Adáptala al proveedor y al proyecto:

```markdown
# Puesta en producción

## Antes de publicar
- [ ] Revisión humana de ENTREGA.md completada.
- [ ] Pendientes del cliente resueltos (.fabrica/pendientes-cliente.md); buscar «PENDIENTE» en el código no da resultados.
- [ ] `sitio.url` en src/config/sitio.ts con el dominio definitivo.
- [ ] Textos legales revisados por el cliente o su asesor.

## Alojamiento (<proveedor>)
- [ ] Sitio creado en la cuenta del cliente y conectado al repositorio (despliegue automático desde main).
- [ ] Versión de Node 24 en la configuración de compilación.
- [ ] Variables de entorno de producción configuradas: <lista>.
- [ ] Notificaciones del formulario enviadas a <correo>.

## Dominio
- [ ] Dominio añadido en el proveedor y DNS apuntando según sus instrucciones (registros A/ALIAS o CNAME).
- [ ] Certificado HTTPS activo y redirección de http a https y de la versión sin www (o con www) a la canónica.
- [ ] Si el formulario envía correo con dominio propio: registros SPF, DKIM y DMARC del proveedor de correo.

## Después de publicar
- [ ] `node scripts/auditar-ui.mjs --url https://<dominio> --lighthouse --externos` en verde.
- [ ] Envío real del formulario recibido.
- [ ] Google Search Console: propiedad verificada y sitemap enviado (https://<dominio>/sitemap-index.xml).
- [ ] Ficha de Google Business Profile con la URL de la web y el mismo NAP.
- [ ] Analítica recibiendo visitas (si se configuró).
- [ ] Monitor de disponibilidad (por ejemplo, UptimeRobot o Better Stack) avisando a <correo>.
- [ ] Redirecciones 301 de la web antigua comprobadas.
```

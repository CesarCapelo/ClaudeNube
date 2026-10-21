# Despliegue

Regla: en modo autónomo solo se despliega una **versión de prueba**, con su propia base de datos de prueba, si el brief lo autoriza y hay credenciales en variables de entorno. Producción la despliega una persona tras revisar, salvo permiso expreso (`permiso produccion si`). **Nunca se toca una base de datos de producción.**

## 1. Arquitectura de despliegue recomendada

| Pieza | Recomendado | Alternativas |
| --- | --- | --- |
| Aplicación | Vercel, región de Fráncfort (`fra1`) | Railway, Render o Fly.io (con Docker), o un VPS con Node 24 y `next start` detrás de un proxy |
| Base de datos | Neon o Supabase (PostgreSQL), región UE | Cualquier PostgreSQL 15 o superior gestionado con copias diarias |
| Correo | Brevo (UE) o Resend | |
| Archivos | Cloudflare R2 o Supabase Storage | |
| Errores | Sentry (región UE), opcional | |
| Disponibilidad | Monitor externo sobre `/api/salud` (UptimeRobot, Better Stack) | |

Todas las cuentas se crean **a nombre del cliente**; la empresa entra con acceso delegado.

## 2. Variables de entorno

Documentadas en `.env.example`. En el proveedor, como mínimo:

| Variable | Producción |
| --- | --- |
| `DATABASE_URL` | `postgres://…` del proveedor, con SSL (`?sslmode=require`) |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32`, distinto en cada entorno |
| `BETTER_AUTH_URL` | URL pública definitiva (https) |
| `REGISTRO_ABIERTO` | Solo `true` si la app tiene registro público |
| `CORREO_PROVEEDOR`, `BREVO_API_KEY`, `CORREO_REMITENTE` | Si hay correo real |
| `CRON_SECRET` | Si hay tareas programadas |
| Claves de integraciones | Según la especificación |

`PRUEBAS_E2E` no se define nunca fuera de las pruebas: desactiva el límite de intentos.

## 3. Migraciones

En producción las migraciones no se aplican al arrancar (solo con PGlite). Se aplican en el despliegue, antes de servir la nueva versión:

```bash
DATABASE_URL="<url de la base de datos del entorno>" npm run db:migrar
```

En Vercel se puede encadenar en el comando de compilación (`npm run db:migrar && npm run build`) o ejecutar desde una tarea de CI. Las migraciones que borran o transforman datos se revisan a mano y con copia de seguridad previa: anótalo en la entrega.

## 4. Versión de prueba (si hay permiso y credenciales)

**Vercel** (`VERCEL_TOKEN`, y una base de datos de prueba en `DATABASE_URL_PRUEBA`):

```bash
DATABASE_URL="$DATABASE_URL_PRUEBA" npm run db:migrar
npx vercel deploy --yes --token "$VERCEL_TOKEN" \
  --env DATABASE_URL="$DATABASE_URL_PRUEBA" --env BETTER_AUTH_SECRET="$(openssl rand -base64 32)" \
  --env BETTER_AUTH_URL=<se ajusta tras conocer la URL> --regions fra1
```

Si el proyecto aún no existe en Vercel, el primer `vercel deploy` lo crea en la cuenta del token. Después del despliegue:

1. Guarda la URL (`estado.mjs dato url-prueba "<url>"`) y corrige `BETTER_AUTH_URL` si hace falta (`npx vercel env add …` y nuevo despliegue).
2. Comprueba `/api/salud`, crea la cuenta administradora de prueba y audita: `node scripts/auditar-ui.mjs --url <url> --rutas /entrar,/privacidad`.
3. Anota en la entrega las credenciales de la cuenta de prueba **solo en el fichero local `.fabrica/accesos-prueba.md`** (ignorado por git), nunca en `ENTREGA.md`.

Sin credenciales: deja `vercel.json` (región `fra1`, `crons` si los hay) y la guía de puesta en producción. No es un fallo.

## 5. Contenido de `docs/puesta-en-produccion.md`

```markdown
# Puesta en producción

## Cuentas (a nombre del cliente)
- [ ] Alojamiento (Vercel u otro) con la empresa como miembro del equipo.
- [ ] Base de datos PostgreSQL en la UE, con copias de seguridad diarias activadas.
- [ ] Proveedores de integraciones: <lista>.

## Configuración
- [ ] Variables de entorno de producción (ver .env.example), con secretos nuevos.
- [ ] Migraciones aplicadas: `DATABASE_URL=… npm run db:migrar`.
- [ ] Dominio y HTTPS; `BETTER_AUTH_URL` con el dominio definitivo.
- [ ] Remitente de correo verificado (SPF, DKIM, DMARC).

## Arranque
- [ ] Crear la cuenta administradora (la primera que se registra) y comprobar que el registro queda cerrado.
- [ ] Importar los datos iniciales, si los hay, y verificar recuentos.
- [ ] Prueba completa de las historias principales en producción con una cuenta de prueba, que se borra después.

## Operación
- [ ] Monitor de disponibilidad sobre /api/salud.
- [ ] Alertas de errores (Sentry u otro), si se contrata.
- [ ] Restauración de una copia de seguridad probada al menos una vez.
- [ ] Contratos de encargo del tratamiento firmados con los proveedores.
```

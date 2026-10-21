# App móvil con Expo

La app móvil es un cliente más de la misma aplicación: la lógica, los datos y los permisos siguen en Next.js (API `/api/v1`), y la app de Expo los consume. Así hay una sola fuente de verdad, una sola base de datos y un solo sitio donde comprobar los permisos.

## 1. Antes de empezar

- Expo cambia en cada versión del SDK. **No programes de memoria**: lee el `AGENTS.md` que genera la plantilla de Expo y la documentación de la versión instalada (`https://docs.expo.dev/versions/v<major>.0.0/` y el índice `https://docs.expo.dev/llms.txt`).
- Instala siempre los paquetes con `npx expo install <paquete>` (elige versiones compatibles con el SDK), nunca con `npm install`.
- La API de Next.js que la app necesita debe estar terminada y probada antes de construir la pantalla que la usa.

## 2. Crear el proyecto

Dentro del repositorio de la aplicación, en la carpeta `movil/`:

```bash
npx create-expo-app@latest movil --template default --yes
cd movil && npx expo-doctor && npx expo lint && npx tsc --noEmit
```

Si la plantilla trae errores de tipos o pantallas de ejemplo, elimina las pantallas de ejemplo (el proyecto incluye un script `reset-project`; léelo antes de usarlo) y deja la base en verde antes de seguir.

Configura `app.json`: `name`, `slug`, `scheme`, `ios.bundleIdentifier` y `android.package` (formato `es.<cliente>.<app>`), icono y pantalla de inicio con la marca. Anota en los pendientes del cliente las cuentas de Apple Developer (99 USD al año) y Google Play (25 USD, pago único), a su nombre.

## 3. Arquitectura de la app

- **Navegación**: Expo Router (`src/app/`, un fichero por pantalla y `_layout.tsx` para los navegadores). Pestañas para las 3 a 5 secciones principales.
- **Autenticación**: Better Auth con su integración para Expo (`@better-auth/expo` en el servidor y en el cliente, con almacenamiento seguro `expo-secure-store`). Lee su documentación vigente; añade el `scheme` de la app a los orígenes de confianza del servidor.
- **API**: un cliente en `movil/src/lib/api.ts` con tipos compartidos. Las respuestas se validan con los mismos esquemas Zod; si hace falta compartir código, crea `compartido/` en la raíz y regístralo como decisión.
- **Estado del servidor**: peticiones con reintento y estados de carga, error y vacío en cada pantalla.
- **Diseño**: mismos tokens de color que la web; tamaños táctiles de 44 puntos o más; texto que respeta el tamaño de letra del sistema.
- **Accesibilidad**: `accessibilityLabel` en iconos y botones sin texto, `accessibilityRole` correcto y contraste suficiente.
- **Funciones nativas** (cámara, ubicación, notificaciones): solo si la especificación las pide, con los textos de permiso en castellano en `app.json`.

## 4. Verificación sin dispositivo

En modo autónomo no hay un móvil a mano. Se verifica así:

1. `npx expo-doctor`, `npx expo lint` y `npx tsc --noEmit` en verde.
2. Pruebas unitarias de la lógica (con el ejecutor que traiga la plantilla de Expo o con Vitest para la lógica pura en `movil/src/lib`).
3. **Exportación web**: `npx expo export --platform web --output-dir dist-web`, servida con `npx expo serve` (o un servidor estático), y recorrida con Playwright en viewport de móvil: navegación, inicio de sesión contra la API local y cada historia de usuario móvil. Haz capturas con `auditar-ui.mjs` y revísalas.
4. Si hay `EXPO_TOKEN` y permiso de despliegue de prueba: `npx eas-cli build --profile preview --platform android` para generar un APK instalable, y anota el enlace. iOS necesita la cuenta de Apple del cliente: queda como pendiente.

Lo que solo se puede comprobar en un dispositivo real (cámara, notificaciones push, rendimiento, aspecto en iOS) se lista en la entrega como **pruebas manuales pendientes**, con los pasos exactos.

## 5. Publicación en tiendas

Nunca en modo autónomo (`eas submit` está bloqueado por el hook). Documenta en `docs/puesta-en-produccion.md`: cuentas de desarrollador, `eas.json` con los perfiles `preview` y `production`, capturas y textos de la ficha de la tienda (los redacta Claude), política de privacidad pública (URL de la web), cuestionario de seguridad de datos de Google Play y etiquetas de privacidad de Apple según el inventario de datos personales.

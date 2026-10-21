# Seguridad y protección de datos

Una aplicación de pyme guarda datos de sus clientes y de su equipo. Un fallo de seguridad tiene consecuencias legales (RGPD) y de reputación, para el cliente y para la empresa que la construyó. Esta guía es de obligado cumplimiento; `fabrica:revisor-seguridad` la usa como lista de comprobación.

## 1. Lista de comprobación (basada en OWASP Top 10)

**Control de acceso**
- [ ] Toda página privada llama a `exigirUsuario()` o a `exigirAdmin()`; toda acción de servidor y toda ruta de API comprueban la sesión por sí mismas, aunque la página ya lo haga.
- [ ] Los permisos y el ámbito (organización, cliente, propietario) se comprueban en la capa de datos, en cada operación, con el usuario de la sesión. Nunca con identificadores que lleguen del formulario.
- [ ] Cada prueba de extremo a extremo de una operación protegida incluye el caso «sin permiso» (otro rol u otra organización).
- [ ] Los identificadores son UUID aleatorios (no secuenciales).

**Validación y datos de entrada**
- [ ] Toda entrada (formularios, parámetros de URL, cuerpos de API, ficheros, webhooks) se valida en el servidor con Zod.
- [ ] Las búsquedas `LIKE` escapan `%`, `_` y `\`. Nunca se construye SQL concatenando texto: solo Drizzle o `sql` con parámetros.
- [ ] No se usa `dangerouslySetInnerHTML` con contenido de usuarios. Si hay texto enriquecido, se sanea en el servidor.
- [ ] Ficheros subidos: lista blanca de tipos MIME comprobada por contenido (no solo por la extensión), tamaño máximo, nombre generado por el servidor y almacenamiento fuera de `public/`.
- [ ] Redirecciones solo a rutas internas (nunca a una URL recibida sin comprobar).

**Autenticación y sesiones**
- [ ] Contraseñas de 10 caracteres o más (configurado en Better Auth); no se registran ni se muestran.
- [ ] Límite de intentos activo en producción (configurado; las pruebas lo desactivan con `PRUEBAS_E2E`, que nunca se define en producción).
- [ ] Mensajes de acceso que no revelan si un correo existe.
- [ ] Bloquear una cuenta impide su acceso inmediato (`exigirUsuario` comprueba `banned`).
- [ ] Si se añade recuperación de contraseña o verificación de correo, va con el adaptador de correo y caducidad de los enlaces.

**Secretos y configuración**
- [ ] Ningún secreto en el código ni en git: variables de entorno, con `.env.example` documentado. `BETTER_AUTH_SECRET` largo y aleatorio en cada entorno.
- [ ] Cabeceras de seguridad activas (`next.config.ts`).
- [ ] Mensajes de error genéricos para el usuario; el detalle técnico solo en el registro del servidor.
- [ ] `npm audit --omit=dev` sin vulnerabilidades altas ni críticas; dependencias nuevas mantenidas activamente y con licencia permisiva.

**Integraciones**
- [ ] Webhooks (Stripe, etc.) verificados por firma, e idempotentes.
- [ ] Rutas de tareas programadas protegidas con `CRON_SECRET`.
- [ ] Las claves de API de terceros solo se usan en el servidor (nunca en variables `NEXT_PUBLIC_`).

**Registro y supervisión**
- [ ] Los registros no contienen contraseñas, tokens ni datos personales innecesarios.
- [ ] `/api/salud` responde para el monitor de disponibilidad.

## 2. Protección de datos (RGPD y LOPDGDD)

El cliente es el **responsable del tratamiento**; la empresa que mantiene la app y los proveedores de alojamiento son **encargados**. La aplicación debe facilitar al cliente cumplir sus obligaciones:

- **Minimización**: cada campo personal de la especificación tiene una finalidad en el inventario. Si no la tiene, no se pide.
- **Información**: la página `/privacidad` describe los tratamientos reales de la app (adáptala; la plantilla trae un texto base) y se enlaza desde el acceso y desde la navegación.
- **Derechos de las personas**: para los datos de terceros (clientes del cliente), la administración debe poder exportar y suprimir los datos de una persona. Si la app gestiona personas, incluye esas dos operaciones.
- **Conservación**: si la especificación fija plazos, añade una tarea programada de supresión o anonimización.
- **Seguridad**: lo de la sección 1, copias de seguridad diarias del proveedor de base de datos y cifrado en tránsito (HTTPS).
- **Ubicación**: base de datos y alojamiento en la UE (Fráncfort o Irlanda) por defecto. Si algún proveedor está fuera, anótalo en la entrega (transferencia internacional).
- **Datos de categorías especiales** (salud, menores, biométricos…) o tratamiento a gran escala: anota en los pendientes que el cliente debe valorar una evaluación de impacto (EIPD) y revisar el diseño con su delegado de protección de datos o su asesor.
- **Correos comerciales**: solo con consentimiento específico y opción de baja (LSSI, art. 21).

## 3. Inteligencia artificial dentro de la aplicación

- Avisa a las personas de que interactúan con un sistema de IA (Reglamento europeo de IA, art. 50) cuando la IA conversa con ellas o genera contenido que se les muestra como propio.
- No uses IA para decisiones de alto riesgo (selección de personal, crédito, acceso a servicios esenciales): están fuera del alcance de la fábrica.
- Envía al modelo solo los datos necesarios; nunca credenciales ni categorías especiales de datos.
- Las respuestas de la IA se validan antes de guardarse o de actuar con ellas (esquema, límites, revisión humana en lo importante).
- Registra el uso (tokens o coste por día) y pon límites para evitar facturas inesperadas.

## 4. Encargo para `fabrica:revisor-seguridad`

```text
Audita la seguridad de esta aplicación Next.js. Comprueba cada punto de esta lista contra el código:
<pega aquí la sección 1 de datos-seguridad.md>
Revisa src/lib/, src/app/
(acciones, páginas, rutas de API) y la configuración. Busca especialmente operaciones sin comprobación de
sesión o de permisos, consultas sin filtro de ámbito, entradas sin validar, secretos en el código y datos
personales en registros. Ejecuta `npm audit --omit=dev`.
Para cada hallazgo: severidad (alta, media o baja), fichero y línea, cómo se explotaría y arreglo concreto.
No modifiques nada.
```

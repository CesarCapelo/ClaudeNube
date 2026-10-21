# Web de cliente — guía para Claude Code

Web estática hecha con Astro 7, Tailwind CSS 4 y TypeScript. Producida por la fábrica de webs; el histórico del proyecto está en `.fabrica/` (brief, requisitos, decisiones y bitácora).

## Comandos

- `npm run dev`: servidor de desarrollo. Astro lo manda a segundo plano si lo lanza un agente; se para con `npx astro dev stop`.
- `npm run build`: compila en `dist/`.
- `npm run verificar`: formato, espacios, tipos, compilación y tests de navegador. Debe pasar antes de cada commit.
- `npx astro preview --background` y `npm run auditar`: auditoría completa (capturas, accesibilidad, SEO, enlaces y Lighthouse) en `.fabrica/auditoria/informe.md`. Después, `npx astro preview stop`.
- `npm run imagenes`: regenera `public/og.png` y `public/apple-touch-icon.png` desde el favicon y los datos del sitio.

## Reglas del proyecto

- Los datos del negocio (nombre, contacto, dirección, horario, titular, redes, navegación) viven solo en `src/config/sitio.ts`. Nunca los escribas a mano en una página.
- Los tokens de diseño (colores, tipografías, radios) viven en `src/styles/global.css` (`@theme`). Usa las clases de esos tokens (`bg-marca-700`, `text-tinta-suave`…), no colores sueltos.
- **Espacios en `.astro`:** un salto de línea entre texto y un elemento en línea (`<a>`, `<strong>`) o una expresión `{…}` NO genera espacio. Escribe `{' '}` al final de la línea. `npm run espacios` lo comprueba.
- Cada página nueva se añade a la lista `PAGINAS` de `tests/sitio.spec.ts`.
- Accesibilidad: un solo `h1` por página, sin saltos de nivel de encabezado, `alt` en todas las imágenes (vacío si es decorativa) y objetivos táctiles de 44 px o más.
- No se añaden cookies ni scripts de terceros sin actualizar la política de cookies y, si no son exentas, sin un sistema de consentimiento previo.
- Las imágenes van en `src/assets/` y se muestran con `<Image />` de `astro:assets`, con `width` y `height`.
- No inventes datos del negocio, testimonios ni reseñas. Lo que falte se marca con `PENDIENTE(cliente): …`.

# Web de Fisioterapia Lucía Martín

Web estática de una clínica de fisioterapia en Getafe. Astro 7, Tailwind CSS 4 y TypeScript. Detalle de la entrega en [`ENTREGA.md`](ENTREGA.md).

## Requisitos

Node 22.23 o superior (recomendado 24 LTS).

## Comandos

| Comando                                              | Qué hace                                                                                        |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `npm ci`                                             | Instala dependencias                                                                            |
| `npm run dev`                                        | Servidor de desarrollo                                                                          |
| `npm run build`                                      | Compila en `dist/`                                                                              |
| `npm run verificar`                                  | Formato, espacios, tipos, compilación y tests de navegador                                      |
| `npx astro preview --background` y `npm run auditar` | Auditoría completa (capturas, axe, SEO, enlaces, Lighthouse) en `.fabrica/auditoria/informe.md` |
| `npm run imagenes`                                   | Regenera la imagen social y el icono de Apple                                                   |

## Estructura

- `src/config/sitio.ts`: datos del negocio (contacto, horario, titular, navegación). Cámbialos solo aquí.
- `src/config/servicios.ts`: textos de las tres páginas de servicio.
- `src/styles/global.css`: colores y tipografías (tokens).
- `src/pages/`: páginas. `src/components/`: piezas reutilizables (`HuecoFoto` marca las fotos pendientes).
- `tests/sitio.spec.ts`: pruebas de navegador.
- `.fabrica/`: brief, requisitos, decisiones, bitácora e informes de auditoría.

## Despliegue

Netlify: `netlify.toml` ya define compilación, Node y cabeceras. Pasos en [`docs/puesta-en-produccion.md`](docs/puesta-en-produccion.md).

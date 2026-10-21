// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { sitio } from './src/config/sitio.ts';

// Rutas que nunca deben aparecer en el sitemap ni indexarse.
const RUTAS_PRIVADAS = ['/guia-estilo', '/404', '/gracias'];

export default defineConfig({
  site: sitio.url,
  trailingSlash: 'ignore',
  integrations: [
    sitemap({
      filter: (pagina) => !RUTAS_PRIVADAS.some((ruta) => new URL(pagina).pathname.startsWith(ruta)),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});

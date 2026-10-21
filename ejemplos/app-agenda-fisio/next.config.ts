import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cache Components (prerenderizado parcial) desactivado a propósito: en aplicaciones donde casi
  // todo es autenticado, el renderizado dinámico clásico es más simple y predecible.
  // Antes de activarlo, lee node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md
  // PGlite (PostgreSQL embebido para desarrollo y pruebas) se carga desde node_modules, sin empaquetar.
  serverExternalPackages: ['@electric-sql/pglite'],
  poweredByHeader: false,
  // Tailwind CSS 4 se procesa con su cargador para Turbopack.
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;

import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'server-only': path.resolve(__dirname, 'tests/soporte/server-only.ts'),
    },
  },
  test: {
    include: ['tests/unitarios/**/*.test.ts', 'tests/integracion/**/*.test.ts'],
    environment: 'node',
    // Las pruebas de integración usan PostgreSQL embebido en memoria: rápido y aislado.
    env: { DATABASE_URL: 'pglite://memoria' },
    fileParallelism: false,
  },
});

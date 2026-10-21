import { test, expect } from '@playwright/test';

// La tarea programada no depende de la sesión: se protege con CRON_SECRET.
test.describe('sin sesión', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('T3 · la purga exige el secreto y responde con él', async ({ request }) => {
    expect((await request.get('/api/cron/purgar-actividad')).status()).toBe(401);
    const mala = await request.get('/api/cron/purgar-actividad', {
      headers: { authorization: 'Bearer secreto-incorrecto' },
    });
    expect(mala.status()).toBe(401);
    const buena = await request.post('/api/cron/purgar-actividad', {
      headers: { authorization: 'Bearer secreto-cron-solo-pruebas' },
    });
    expect(buena.status()).toBe(200);
    expect(await buena.json()).toEqual({ eliminadas: 0 });
  });
});

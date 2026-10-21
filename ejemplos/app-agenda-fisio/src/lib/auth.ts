import 'server-only';
import { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { admin } from 'better-auth/plugins';
import { count } from 'drizzle-orm';
import { db } from './db';
import * as esquema from './db/esquema';
import { configuracion } from './configuracion';

// Política de altas:
// - REGISTRO_ABIERTO=true: cualquiera puede crear su cuenta (SaaS, apps de clientes finales).
// - Por defecto (herramientas internas): solo se puede registrar la primera persona, que será
//   administradora; después, las cuentas las crea una persona administradora desde /usuarios.
const registroAbierto = process.env.REGISTRO_ABIERTO === 'true';

export const auth = betterAuth({
  appName: configuracion.nombre,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: 'pg', schema: esquema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // se renueva una vez al día si hay actividad
  },
  // Límite de intentos (protege frente a ataques de fuerza bruta). Solo las pruebas automáticas lo desactivan.
  rateLimit: { enabled: process.env.NODE_ENV === 'production' && process.env.PRUEBAS_E2E !== 'true' },
  databaseHooks: {
    user: {
      create: {
        before: async (usuario, contexto) => {
          const [{ total }] = await db.select({ total: count() }).from(esquema.user);
          if (total === 0) return { data: { ...usuario, role: 'admin' } };
          if (contexto?.path === '/sign-up/email' && !registroAbierto) {
            throw new APIError('FORBIDDEN', {
              message: 'El registro está cerrado. Pide a una persona administradora que te dé de alta.',
            });
          }
        },
        // La primera cuenta (la dueña, que también es fisioterapeuta) atiende citas desde el principio.
        after: async (usuario) => {
          const [{ total }] = await db.select({ total: count() }).from(esquema.user);
          if (total === 1) {
            await db.insert(esquema.profesionales).values({ usuarioId: usuario.id }).onConflictDoNothing();
          }
        },
      },
    },
  },
  plugins: [admin(), nextCookies()],
});

export type Sesion = typeof auth.$Infer.Session;

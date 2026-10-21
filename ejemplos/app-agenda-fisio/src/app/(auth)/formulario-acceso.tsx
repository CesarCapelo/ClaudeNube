'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { authCliente } from '@/lib/auth-cliente';
import { Boton } from '@/components/ui/boton';
import { Campo } from '@/components/ui/campo';
import { Aviso } from '@/components/ui/aviso';

// Better Auth responde en inglés: se traducen los casos habituales.
function mensajeDeError(error: { status: number; code?: string; message?: string }) {
  if (error.status === 401) return 'Correo o contraseña incorrectos.';
  if (error.status === 429) return 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.';
  if (error.code === 'USER_ALREADY_EXISTS' || error.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL')
    return 'Ya existe una cuenta con ese correo.';
  if (error.code === 'PASSWORD_TOO_SHORT') return 'La contraseña debe tener al menos 10 caracteres.';
  if (error.code === 'BANNED_USER') return 'Tu cuenta está bloqueada. Contacta con la administración.';
  if (error.status === 403) return error.message ?? 'No tienes permiso para esta operación.';
  return 'No se ha podido completar la operación. Inténtalo de nuevo.';
}

export function FormularioAcceso({
  modo,
  puedeRegistrarse,
}: {
  modo: 'entrar' | 'registro';
  puedeRegistrarse: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    const datos = new FormData(evento.currentTarget);
    const email = String(datos.get('email'));
    const password = String(datos.get('password'));

    const { error } =
      modo === 'entrar'
        ? await authCliente.signIn.email({ email, password })
        : await authCliente.signUp.email({ name: String(datos.get('nombre')), email, password });

    setEnviando(false);
    if (error) {
      setError(mensajeDeError(error));
      return;
    }
    router.push('/agenda');
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      <h1 className="text-2xl font-bold">{modo === 'entrar' ? 'Entrar' : 'Crear cuenta'}</h1>
      {error && <Aviso tono="error">{error}</Aviso>}
      {modo === 'registro' && <Campo etiqueta="Nombre" nombre="nombre" required autoComplete="name" />}
      <Campo etiqueta="Correo electrónico" nombre="email" type="email" required autoComplete="email" />
      <Campo
        etiqueta="Contraseña"
        nombre="password"
        type="password"
        required
        minLength={10}
        autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
        ayuda={modo === 'registro' ? 'Mínimo 10 caracteres.' : undefined}
      />
      <Boton type="submit" className="w-full" disabled={enviando}>
        {enviando ? 'Un momento…' : modo === 'entrar' ? 'Entrar' : 'Crear cuenta'}
      </Boton>
      {modo === 'entrar' && puedeRegistrarse && (
        <p className="text-center text-sm text-tinta-suave">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="font-semibold text-marca-700 underline underline-offset-2">
            Crear una
          </Link>
        </p>
      )}
      {modo === 'registro' && (
        <p className="text-center text-sm text-tinta-suave">
          ¿Ya tienes cuenta?{' '}
          <Link href="/entrar" className="font-semibold text-marca-700 underline underline-offset-2">
            Entrar
          </Link>
        </p>
      )}
      <p className="text-center text-xs text-tinta-suave">
        <Link href="/privacidad" className="underline underline-offset-2">
          Privacidad
        </Link>
      </p>
    </form>
  );
}

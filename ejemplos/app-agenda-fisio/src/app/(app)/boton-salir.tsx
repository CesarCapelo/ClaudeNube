'use client';

import { useRouter } from 'next/navigation';
import { authCliente } from '@/lib/auth-cliente';
import { Boton } from '@/components/ui/boton';

export function BotonSalir() {
  const router = useRouter();
  return (
    <Boton
      variante="fantasma"
      className="-ml-4"
      onClick={async () => {
        await authCliente.signOut();
        router.push('/entrar');
        router.refresh();
      }}
    >
      Cerrar sesión
    </Boton>
  );
}

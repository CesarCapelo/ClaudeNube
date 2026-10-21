import { describe, expect, it } from 'vitest';
import { esquemaCliente } from '@/lib/validacion/clientes';

const valido = { nombre: 'Panadería Ruiz', email: 'Hola@Ruiz.es ', telefono: '+34 600 000 000', notas: '' };

describe('esquemaCliente', () => {
  it('acepta un cliente válido y normaliza los campos', () => {
    expect(esquemaCliente.parse(valido)).toEqual({
      nombre: 'Panadería Ruiz',
      email: 'hola@ruiz.es',
      telefono: '+34 600 000 000',
      notas: null,
    });
  });

  it('convierte los campos opcionales vacíos en null', () => {
    const resultado = esquemaCliente.parse({ nombre: 'Ana', email: '', telefono: '', notas: '' });
    expect(resultado).toMatchObject({ email: null, telefono: null, notas: null });
  });

  it('rechaza un nombre demasiado corto', () => {
    expect(esquemaCliente.safeParse({ ...valido, nombre: 'A' }).success).toBe(false);
  });

  it('rechaza un correo mal formado', () => {
    expect(esquemaCliente.safeParse({ ...valido, email: 'no-es-un-correo' }).success).toBe(false);
  });

  it('rechaza un teléfono con letras', () => {
    expect(esquemaCliente.safeParse({ ...valido, telefono: '600 ABC' }).success).toBe(false);
  });
});

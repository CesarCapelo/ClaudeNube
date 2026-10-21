// Errores de la capa de datos. Las acciones los traducen a mensajes para la persona usuaria.

export class ErrorPermiso extends Error {
  constructor(mensaje = 'No tienes permiso para esta operación.') {
    super(mensaje);
    this.name = 'ErrorPermiso';
  }
}

/** Regla de negocio incumplida (solape de citas, estado no permitido…); el mensaje es apto para mostrarse. */
export class ErrorNegocio extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ErrorNegocio';
  }
}

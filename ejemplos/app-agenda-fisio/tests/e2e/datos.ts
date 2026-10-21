// Credenciales de la cuenta administradora que crean las pruebas (solo existen en la base de datos en memoria).
export const ADMIN = {
  nombre: 'Ana Administradora',
  email: 'admin@pruebas.local',
  password: 'clave-de-pruebas-123',
};

export const unico = (prefijo: string) =>
  `${prefijo} ${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// Cuentas que crea la preparación de las pruebas (solo existen en la base de datos en memoria).
export const RECEPCION = {
  nombre: 'Rosa Recepción',
  email: 'recepcion@pruebas.local',
  password: 'clave-recepcion-123',
};
export const FISIO = {
  nombre: 'Félix Fisio',
  email: 'fisio@pruebas.local',
  password: 'clave-fisio-12345',
};

// Credenciales de la cuenta administradora que crean las pruebas (solo existen en la base de datos en memoria).
export const ADMIN = {
  nombre: 'Ana Administradora',
  email: 'admin@pruebas.local',
  password: 'clave-de-pruebas-123',
};

export const unico = (prefijo: string) =>
  `${prefijo} ${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

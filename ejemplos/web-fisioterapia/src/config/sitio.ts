// Fuente única de los datos del negocio.
// Cabecera, pie, SEO, datos estructurados, páginas legales y formulario leen de aquí:
// cambiar un dato en este fichero lo cambia en toda la web.
// Los valores marcados con PENDIENTE(cliente) los debe confirmar el cliente antes de publicar.

export type ModoFormulario = 'netlify' | 'endpoint' | 'mailto';
export type ProveedorAnalitica = 'ninguna' | 'plausible' | 'umami';

export interface EnlaceNavegacion {
  texto: string;
  href: string;
}

export interface Direccion {
  calle: string;
  codigoPostal: string;
  localidad: string;
  provincia: string;
  /** Código ISO 3166-1 alfa-2. */
  pais: string;
}

export interface Horario {
  /** Texto visible, p. ej. «Lunes a viernes». */
  dias: string;
  /** Texto visible, p. ej. «9:00–14:00 y 16:00–20:00». */
  horas: string;
  /** Formato schema.org openingHours, p. ej. ['Mo-Fr 09:00-14:00', 'Mo-Fr 16:00-20:30']. */
  schema: string[];
}

export const sitio = {
  /** URL de producción sin barra final. Se usa para canonical, sitemap y Open Graph. */
  url: 'https://fisioluciamartin.es',
  idioma: 'es',
  locale: 'es_ES',

  nombre: 'Fisioterapia Lucía Martín',
  eslogan: 'Fisioterapia individual en Getafe',
  /** Descripción por defecto para buscadores (entre 120 y 155 caracteres). */
  descripcion:
    'Fisioterapia en Getafe: deportiva, suelo pélvico y dolor de espalda y cuello. Sesiones individuales de 50 minutos con la misma fisioterapeuta.',
  /** Tipo schema.org más específico posible: LocalBusiness, Dentist, Restaurant, LegalService… */
  tipoSchema: 'Physiotherapy',

  contacto: {
    telefono: '+34 600 123 456',
    email: 'hola@fisioluciamartin.es',
    /** Número en formato internacional sin «+» ni espacios para wa.me. Vacío = sin botón de WhatsApp. */
    whatsapp: '34600123456',
  },

  /** Dirección física. Vacía si el negocio no atiende en un local. */
  direccion: {
    calle: 'Calle de Madrid, 25',
    codigoPostal: '28901',
    localidad: 'Getafe',
    provincia: 'Madrid',
    pais: 'ES',
  } as Direccion | null,
  /** Coordenadas para el mapa y los datos estructurados. null = sin mapa. */
  geo: null as { lat: number; lng: number } | null,

  horario: [
    {
      dias: 'Lunes a viernes',
      horas: '9:00–14:00 y 16:00–20:30',
      schema: ['Mo-Fr 09:00-14:00', 'Mo-Fr 16:00-20:30'],
    },
  ] as Horario[],

  redes: {
    instagram: 'https://www.instagram.com/fisioluciamartin',
    facebook: '',
    linkedin: '',
    youtube: '',
    tiktok: '',
  },

  /** Datos del titular para el aviso legal (LSSI art. 10) y la política de privacidad (RGPD). */
  titular: {
    razonSocial: 'PENDIENTE(cliente): razón social o nombre y apellidos del titular',
    nif: 'PENDIENTE(cliente): NIF/CIF',
    domicilio: 'PENDIENTE(cliente): domicilio social completo',
    email: 'hola@fisioluciamartin.es',
    /** Datos registrales si es sociedad; vacío si es autónomo. */
    registro: '',
    /** Colegio profesional, título y país de expedición, si la actividad es regulada. */
    profesionRegulada:
      'PENDIENTE(cliente): número de colegiada y colegio profesional de Fisioterapia',
  },

  formulario: {
    /**
     * netlify: Netlify Forms (sin código de servidor).
     * endpoint: POST JSON a `endpoint` (función de Cloudflare, Vercel u otro servicio).
     * mailto: abre el cliente de correo (último recurso).
     */
    modo: 'netlify' as ModoFormulario,
    endpoint: '/api/contacto',
    /** Encargado del tratamiento que recibe los mensajes, para la política de privacidad. */
    proveedor: 'Netlify, Inc. (formularios del alojamiento)',
  },

  analitica: {
    proveedor: 'ninguna' as ProveedorAnalitica,
    /** Plausible: dominio registrado. Umami: URL del script. */
    dominio: '',
    script: '',
    /** Umami: identificador del sitio. */
    idSitio: '',
  },

  navegacion: [
    { texto: 'Inicio', href: '/' },
    { texto: 'Deportiva', href: '/fisioterapia-deportiva' },
    { texto: 'Suelo pélvico', href: '/suelo-pelvico' },
    { texto: 'Espalda y cuello', href: '/dolor-de-espalda-y-cuello' },
    { texto: 'Sobre mí', href: '/sobre-mi' },
    { texto: 'Contacto', href: '/contacto' },
  ] as EnlaceNavegacion[],

  /** Llamada a la acción principal de la cabecera. */
  accionPrincipal: { texto: 'Pedir cita', href: '/contacto' } as EnlaceNavegacion,

  legal: {
    /** Fecha de última actualización de los textos legales (AAAA-MM-DD). */
    actualizacion: '2026-10-21',
  },
};

export const direccionEnUnaLinea = sitio.direccion
  ? `${sitio.direccion.calle}, ${sitio.direccion.codigoPostal} ${sitio.direccion.localidad} (${sitio.direccion.provincia})`
  : '';

export const telefonoEnlace = `tel:${sitio.contacto.telefono.replace(/[^+\d]/g, '')}`;

export const whatsappEnlace = sitio.contacto.whatsapp
  ? `https://wa.me/${sitio.contacto.whatsapp}?text=${encodeURIComponent(`Hola, os escribo desde la web de ${sitio.nombre} para pedir cita.`)}`
  : '';

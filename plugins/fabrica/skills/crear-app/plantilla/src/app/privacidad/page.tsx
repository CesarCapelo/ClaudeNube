import type { Metadata } from 'next';
import { configuracion } from '@/lib/configuracion';

export const metadata: Metadata = { title: 'Privacidad' };

// Información de protección de datos para las personas usuarias de la aplicación (RGPD, art. 13).
// La skill la adapta a los tratamientos reales de cada proyecto.
export default function Privacidad() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-12 leading-relaxed">
      <h1 className="text-3xl font-bold">Información sobre protección de datos</h1>
      <div className="mt-8 space-y-6 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6">
        <h2>Responsable</h2>
        <p>
          {configuracion.responsable}. Contacto: {configuracion.emailContacto}.
        </p>
        <h2>Qué datos tratamos y para qué</h2>
        <ul>
          <li>Datos de tu cuenta (nombre, correo y contraseña cifrada) para darte acceso a la aplicación.</li>
          <li>
            Datos de sesión (dirección IP y navegador) para mantener la sesión iniciada y proteger la cuenta.
          </li>
          <li>Los datos que registres en la aplicación, para prestar el servicio para el que se usa.</li>
        </ul>
        <h2>Base jurídica</h2>
        <p>
          La ejecución de la relación contractual o laboral que justifica tu acceso y el interés legítimo en
          mantener la seguridad de la aplicación.
        </p>
        <h2>Conservación</h2>
        <p>Mientras la cuenta esté activa y, después, durante los plazos legales aplicables.</p>
        <h2>Destinatarios</h2>
        <p>
          Proveedores de alojamiento y base de datos que actúan como encargados del tratamiento con contrato
          conforme al artículo 28 del RGPD. No se ceden datos a terceros salvo obligación legal.
        </p>
        <h2>Tus derechos</h2>
        <p>
          Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y
          portabilidad escribiendo a {configuracion.emailContacto}, y reclamar ante la Agencia Española de
          Protección de Datos (www.aepd.es).
        </p>
        <h2>Cookies</h2>
        <p>
          La aplicación solo usa cookies técnicas imprescindibles para mantener la sesión iniciada, que no
          requieren consentimiento.
        </p>
      </div>
    </main>
  );
}

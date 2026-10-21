import type { ComponentProps } from 'react';

type Props = {
  etiqueta: string;
  nombre: string;
  error?: string[];
  ayuda?: string;
  multilinea?: boolean;
} & Omit<ComponentProps<'input'>, 'name'>;

const estilo =
  'mt-1.5 block w-full rounded-lg border border-borde bg-superficie px-3 py-2 text-base text-tinta placeholder:text-tinta-suave/70 focus:border-marca-500 focus:ring-2 focus:ring-marca-200 focus:outline-none aria-[invalid=true]:border-peligro';

// Campo de formulario accesible: etiqueta asociada, ayuda y errores enlazados con aria-describedby.
export function Campo({ etiqueta, nombre, error, ayuda, multilinea, id, ...props }: Props) {
  const identificador = id ?? `campo-${nombre}`;
  const idAyuda = ayuda ? `${identificador}-ayuda` : undefined;
  const idError = error?.length ? `${identificador}-error` : undefined;
  const descrito = [idAyuda, idError].filter(Boolean).join(' ') || undefined;
  const comunes = {
    id: identificador,
    name: nombre,
    'aria-invalid': error?.length ? true : undefined,
    'aria-describedby': descrito,
    className: estilo,
  };

  return (
    <div>
      <label htmlFor={identificador} className="block text-sm font-semibold text-tinta">
        {etiqueta}
        {props.required && <span aria-hidden="true"> *</span>}
      </label>
      {multilinea ? (
        <textarea
          {...comunes}
          rows={4}
          defaultValue={props.defaultValue as string | undefined}
          required={props.required}
        />
      ) : (
        <input {...props} {...comunes} />
      )}
      {ayuda && (
        <p id={idAyuda} className="mt-1 text-sm text-tinta-suave">
          {ayuda}
        </p>
      )}
      {idError && (
        <p id={idError} className="mt-1 text-sm font-medium text-peligro">
          {error!.join(' ')}
        </p>
      )}
    </div>
  );
}

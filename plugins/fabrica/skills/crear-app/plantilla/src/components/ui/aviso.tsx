import type { ReactNode } from 'react';

const tonos = {
  info: 'bg-marca-50 text-marca-900 ring-marca-200',
  exito: 'bg-green-50 text-green-900 ring-green-200',
  error: 'bg-red-50 text-red-900 ring-red-200',
} as const;

export function Aviso({ tono = 'info', children }: { tono?: keyof typeof tonos; children: ReactNode }) {
  return (
    <div
      role={tono === 'error' ? 'alert' : 'status'}
      className={`rounded-lg px-4 py-3 text-sm ring-1 ring-inset ${tonos[tono]}`}
    >
      {children}
    </div>
  );
}

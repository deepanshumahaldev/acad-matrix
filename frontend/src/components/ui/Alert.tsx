import type { ReactNode } from 'react';

const tones = {
  error: 'bg-danger-tint text-danger',
  success: 'bg-ok-tint text-ok',
  info: 'bg-brand-tint text-brand-dark',
} as const;

export function Alert({ tone = 'error', children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-md px-3 py-2 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}

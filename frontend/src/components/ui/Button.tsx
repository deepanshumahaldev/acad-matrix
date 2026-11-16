import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark disabled:bg-brand/50',
  secondary: 'border border-line bg-white text-ink hover:bg-surface disabled:text-muted',
  ghost: 'text-brand hover:bg-brand-tint disabled:text-muted',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({ variant = 'primary', loading, fullWidth, className = '', children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex h-11 items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${fullWidth ? 'w-full' : ''} ${variants[variant]} ${className}`}
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
}

import { forwardRef, type InputHTMLAttributes } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ invalid, className = '', ...rest }, ref) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={`h-11 w-full rounded-md border bg-white px-3 text-sm text-ink placeholder:text-muted/70 ${invalid ? 'border-danger' : 'border-line'} ${className}`}
        {...rest}
      />
    );
  },
);

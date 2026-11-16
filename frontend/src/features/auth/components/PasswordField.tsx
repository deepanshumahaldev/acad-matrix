import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { FormField, Input } from '@/components/ui';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  hint?: string;
}

export const PasswordField = forwardRef<HTMLInputElement, Props>(function PasswordField({ label, id, error, hint, ...rest }, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <FormField label={label} htmlFor={id} error={error} hint={hint}>
      <div className="relative">
        <Input id={id} ref={ref} type={visible ? 'text' : 'password'} invalid={!!error} className="pr-16" {...rest} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-brand"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </FormField>
  );
});

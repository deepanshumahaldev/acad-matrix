import { Button } from '@/components/ui';
import { useCountdown } from '../hooks/useCountdown';

interface Props {
  /** Increment to restart the countdown (after a successful resend). */
  seconds: number;
  pending: boolean;
  onResend: () => void;
}

export function ResendCode({ seconds, pending, onResend }: Props) {
  const { remaining } = useCountdown(seconds);
  return (
    <Button type="button" variant="ghost" fullWidth loading={pending} disabled={remaining > 0} onClick={onResend}>
      {remaining > 0 ? `Send a new code in ${remaining}s` : 'Send a new code'}
    </Button>
  );
}

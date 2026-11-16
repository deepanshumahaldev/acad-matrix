import { config } from '../../config';
import { ConsoleEmailService } from './console.email';
import type { EmailService } from './email.service';
import { ResendEmailService } from './resend.email';

export * from './email.service';
export * from './templates';

export function createEmailService(): EmailService {
  const { apiKey, from } = config.email;
  if (apiKey && from) return new ResendEmailService(apiKey, from);
  return new ConsoleEmailService();
}

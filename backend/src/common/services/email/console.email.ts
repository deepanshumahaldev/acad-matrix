import { logger } from '../../utils/logger';
import type { EmailMessage, EmailService } from './email.service';

/** Development fallback when RESEND_API_KEY is not set: prints the email instead of sending it. */
export class ConsoleEmailService implements EmailService {
  async send(message: EmailMessage): Promise<void> {
    logger.warn(`\n--- EMAIL (not sent: no RESEND_API_KEY) ---\nTo: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n`);
  }
}

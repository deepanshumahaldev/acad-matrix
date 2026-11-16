export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** Provider-agnostic contract. Swap Resend for SES/SMTP by adding another implementation. */
export interface EmailService {
  send(message: EmailMessage): Promise<void>;
}

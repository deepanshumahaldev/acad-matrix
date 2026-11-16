import type { EmailMessage } from './email.service';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const layout = (title: string, bodyHtml: string) => `<!doctype html>
<html><body style="margin:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;color:#0e1b2c">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:8px;padding:32px">
<tr><td><div style="font-size:20px;font-weight:700;color:#1f4fd8">AcadMatrix</div>
<h1 style="font-size:18px;margin:24px 0 12px">${esc(title)}</h1>${bodyHtml}</td></tr>
</table></td></tr></table></body></html>`;

export function otpEmail(
  to: string,
  code: string,
  ttlMinutes: number,
  purpose: 'LOGIN' | 'PASSWORD_RESET',
): EmailMessage {
  const isReset = purpose === 'PASSWORD_RESET';
  const subject = isReset ? 'Your AcadMatrix password reset code' : 'Your AcadMatrix sign-in code';
  const intro = isReset ? 'Use this code to reset your password.' : 'Use this code to finish signing in.';
  const note = `It expires in ${ttlMinutes} minutes and works once. If you didn't request it, ignore this email.`;
  return {
    to,
    subject,
    text: `${intro}\n\n${code}\n\n${note}`,
    html: layout(
      subject,
      `<p style="margin:0 0 16px;line-height:1.5">${intro}</p>
<p style="font-size:32px;letter-spacing:8px;font-weight:700;margin:0 0 16px">${esc(code)}</p>
<p style="margin:0;color:#5b6778;font-size:13px;line-height:1.5">${note}</p>`,
    ),
  };
}

export function welcomeTemporaryPasswordEmail(
  to: string,
  name: string,
  role: string,
  temporaryPassword: string,
): EmailMessage {
  const subject = `Welcome to AcadMatrix — Your Account Credentials`;
  const intro = `Hello ${name}, an account has been created for you as ${role.toLowerCase()} on AcadMatrix.`;
  const note = `For your security, you are required to change this temporary password on your first sign in.`;
  return {
    to,
    subject,
    text: `${intro}\n\nTemporary Password: ${temporaryPassword}\n\n${note}`,
    html: layout(
      subject,
      `<p style="margin:0 0 16px;line-height:1.5">${esc(intro)}</p>
<div style="background:#f1f5f9;border-left:4px solid #1f4fd8;padding:12px 16px;margin:0 0 16px;border-radius:4px">
  <div style="font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;margin-bottom:4px">Temporary Password</div>
  <code style="font-size:18px;font-weight:700;color:#0e1b2c;letter-spacing:1px">${esc(temporaryPassword)}</code>
</div>
<p style="margin:0;color:#5b6778;font-size:13px;line-height:1.5">${esc(note)}</p>`,
    ),
  };
}

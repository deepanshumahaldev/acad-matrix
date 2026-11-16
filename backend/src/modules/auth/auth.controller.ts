import type { CookieOptions, Request, Response } from 'express';
import { config } from '../../common/config';
import { UnauthorizedError } from '../../common/errors';
import { sendSuccess } from '../../common/utils/response';
import type { AuthService } from './auth.service';
import type { RequestContext, Session } from './auth.types';

const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: config.auth.cookie.secure,
  sameSite: config.auth.cookie.sameSite,
  domain: config.auth.cookie.domain || undefined,
  path: '/api/v1/auth', // only sent to auth endpoints
});

const ctxOf = (req: Request): RequestContext => ({ ip: req.ip, userAgent: req.get('user-agent') ?? null });

function sendSession(res: Response, session: Session) {
  res.cookie(config.auth.cookie.name, session.refreshToken, { ...cookieOptions(), expires: session.refreshExpiresAt });
  return sendSuccess(res, { accessToken: session.accessToken, expiresIn: session.expiresIn, user: session.user });
}

const refreshCookie = (req: Request): string | undefined => {
  const value = (req.cookies as Record<string, unknown> | undefined)?.[config.auth.cookie.name];
  return typeof value === 'string' ? value : undefined;
};

/** HTTP only: reads the request, calls the service, shapes the response. */
export class AuthController {
  constructor(private readonly service: AuthService) {}

  login = async (req: Request, res: Response) => sendSuccess(res, await this.service.login(req.body, ctxOf(req)));

  verifyOtp = async (req: Request, res: Response) =>
    sendSession(res, await this.service.verifyLoginOtp(req.body, ctxOf(req)));

  resendOtp = async (req: Request, res: Response) => sendSuccess(res, await this.service.resendOtp(req.body));

  refresh = async (req: Request, res: Response) => {
    try {
      return sendSession(res, await this.service.refresh(refreshCookie(req), ctxOf(req)));
    } catch (err) {
      if (err instanceof UnauthorizedError) res.clearCookie(config.auth.cookie.name, cookieOptions());
      throw err;
    }
  };

  logout = async (req: Request, res: Response) => {
    await this.service.logout(refreshCookie(req), req.user?.id);
    res.clearCookie(config.auth.cookie.name, cookieOptions());
    return sendSuccess(res, { loggedOut: true });
  };

  me = async (req: Request, res: Response) => sendSuccess(res, await this.service.me(req.user!.id));

  changePassword = async (req: Request, res: Response) =>
    sendSession(res, await this.service.changePassword(req.user!.id, req.body, ctxOf(req)));

  forgotPassword = async (req: Request, res: Response) =>
    sendSuccess(res, await this.service.forgotPassword(req.body));

  resetPassword = async (req: Request, res: Response) => {
    await this.service.resetPassword(req.body, ctxOf(req));
    return sendSuccess(res, { passwordReset: true });
  };
}

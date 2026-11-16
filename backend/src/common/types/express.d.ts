import type { RoleName } from '../constants';

export interface AuthContext {
  id: string;
  role: RoleName;
  mustChangePassword: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthContext;
    }
  }
}

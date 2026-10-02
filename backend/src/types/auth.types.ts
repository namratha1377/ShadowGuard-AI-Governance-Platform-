export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
}

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}


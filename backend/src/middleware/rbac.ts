import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';
import { UserRole } from '../types/auth.types';

export const VALID_ROLES: readonly UserRole[] = ['admin', 'user'] as const;

export const requireRole = (...allowedRoles: UserRole[]) => {
  // Guard against any invalid role usage at development/runtime
  for (const role of allowedRoles) {
    if (!VALID_ROLES.includes(role)) {
      throw new Error(`Invalid RBAC role: '${role}'. Only 'admin' and 'user' are supported.`);
    }
  }

  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required before permission check'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          403,
          `Forbidden. Role '${req.user.role}' does not have sufficient permissions. Required: [${allowedRoles.join(', ')}]`
        )
      );
    }

    next();
  };
};


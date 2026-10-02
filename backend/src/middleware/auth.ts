import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';
import { AuthUser } from '../types/auth.types';

export const JWT_SECRET = process.env.JWT_SECRET || 'shadowguard-secret-key-super-secure';
export const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'shadowguard-refresh-secret-key-super-secure';

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Authentication required. Missing Bearer token.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError(401, 'Authentication required. Invalid Bearer token.');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      next(new AppError(401, 'Invalid or expired access token'));
    } else {
      next(error);
    }
  }
};

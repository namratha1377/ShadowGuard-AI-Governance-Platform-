import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/connection';
import { validateRequest } from '../middleware/validate.middleware';
import { AppError } from '../middleware/error.middleware';
import { JWT_SECRET, JWT_REFRESH_SECRET } from '../middleware/auth';
import { AuthUser } from '../types/auth.types';

const router = Router();

const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(1, 'Password is required'),
  }),
};

const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
};

const signupSchema = {
  body: z.object({
    name: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email address format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    department: z.enum(['Engineering', 'Marketing', 'HR', 'Finance', 'Product']),
  }),
};

interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'user';
  department?: string;
}

router.post(
  '/signup',
  validateRequest(signupSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, department } = req.body;

      // Verify email uniqueness
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existingUser) {
        throw new AppError(409, 'An account with this email address already exists');
      }

      // Secure password hash
      const passwordHash = await bcrypt.hash(password, 10);

      // Enforce 'user' role strictly - no admin signup via public endpoint
      const result = db
        .prepare(
          `INSERT INTO users (name, email, password_hash, role, department, created_at)
           VALUES (?, ?, ?, 'user', ?, DATETIME('now'))`
        )
        .run(name, email, passwordHash, department);

      const userId = Number(result.lastInsertRowid);

      const payload: AuthUser = {
        id: userId,
        name,
        email,
        role: 'user',
        department,
      };

      const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

      res.status(201).json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: payload,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/login',
  validateRequest(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as
        UserRow | undefined;

      if (!user) {
        throw new AppError(401, 'Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new AppError(401, 'Invalid credentials');
      }

      const payload: AuthUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || 'Engineering',
      };

      const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: payload,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/refresh',
  validateRequest(refreshSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as AuthUser;

      const payload: AuthUser = {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
      };

      const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
        },
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        next(new AppError(401, 'Invalid or expired refresh token'));
      } else {
        next(error);
      }
    }
  }
);

export default router;

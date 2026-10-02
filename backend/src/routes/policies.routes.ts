import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import db from '../db/connection';
import { validateRequest } from '../middleware/validate.middleware';
import { AppError } from '../middleware/error.middleware';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

const patchPolicySchema = {
  params: z.object({
    id: z.coerce.number().positive(),
  }),
  body: z.object({
    status: z.enum(['enabled', 'disabled']).optional(),
  }),
};

router.get(
  '/',
  authenticate,
  requireRole('admin'),
  (_req: Request, res: Response, next: NextFunction) => {
    try {
      const policies = db.prepare('SELECT * FROM policies ORDER BY id ASC').all();
      res.json({
        success: true,
        data: policies,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:id',
  authenticate,
  requireRole('admin'),
  validateRequest(patchPolicySchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const existing = db.prepare('SELECT * FROM policies WHERE id = ?').get(id) as
        { id: number; status: 'enabled' | 'disabled' } | undefined;

      if (!existing) {
        throw new AppError(404, `Policy with ID ${id} not found`);
      }

      const newStatus = req.body.status || (existing.status === 'enabled' ? 'disabled' : 'enabled');

      db.prepare(
        `UPDATE policies 
         SET status = ?, updated_at = DATETIME('now') 
         WHERE id = ?`
      ).run(newStatus, id);

      const updated = db.prepare('SELECT * FROM policies WHERE id = ?').get(id);

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

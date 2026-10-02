import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import db from '../db/connection';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

const getAuditLogsSchema = {
  query: z.object({
    severity: z.enum(['info', 'warning', 'critical']).optional(),
    page: z.coerce.number().positive().default(1),
    limit: z.coerce.number().positive().max(100).default(10),
  }),
};

router.get(
  '/',
  authenticate,
  requireRole('admin'),
  validateRequest(getAuditLogsSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const severity = req.query.severity as string | undefined;

      const conditions: string[] = [];
      const params: (string | number)[] = [];

      if (severity) {
        conditions.push('severity = ?');
        params.push(severity);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countSql = `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`;
      const totalRow = db.prepare(countSql).get(...params) as { count: number };
      const total = totalRow.count || 0;

      const querySql = `
        SELECT id, actor, action, target, severity, ip_address, created_at
        FROM audit_logs
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const logs = db.prepare(querySql).all(...params, limit, offset);

      res.json({
        success: true,
        data: logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

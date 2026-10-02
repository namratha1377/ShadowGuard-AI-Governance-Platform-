import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import db from '../db/connection';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

const getDataSecuritySchema = {
  query: z.object({
    category: z.enum(['PII', 'SourceCode', 'Financial', 'Confidential']).optional(),
    page: z.coerce.number().positive().default(1),
    limit: z.coerce.number().positive().max(100).default(10),
  }),
};

router.get(
  '/',
  authenticate,
  requireRole('admin'),
  validateRequest(getDataSecuritySchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const category = req.query.category as string | undefined;

      const conditions: string[] = [];
      const params: (string | number)[] = [];

      if (category) {
        conditions.push('d.category = ?');
        params.push(category);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countSql = `SELECT COUNT(*) as count FROM data_security_logs d ${whereClause}`;
      const totalRow = db.prepare(countSql).get(...params) as { count: number };
      const total = totalRow.count || 0;

      const querySql = `
        SELECT 
          d.id, 
          d.interaction_id, 
          d.category, 
          d.matched_pattern, 
          d.action, 
          d.created_at,
          i.user_name,
          i.department,
          i.target_app,
          i.prompt_summary,
          i.decision,
          i.risk_tier
        FROM data_security_logs d
        JOIN ai_interactions i ON d.interaction_id = i.id
        ${whereClause}
        ORDER BY d.created_at DESC
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

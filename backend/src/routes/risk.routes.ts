import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import db from '../db/connection';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

const getRiskAssessmentsSchema = {
  query: z.object({
    tier: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
    page: z.coerce.number().positive().default(1),
    limit: z.coerce.number().positive().max(100).default(10),
  }),
};

interface RiskAssessmentRow {
  id: number;
  interaction_id: number;
  score: number;
  tier: string;
  top_factors: string;
  created_at: string;
  user_name: string;
  department: string;
  target_app: string;
  category: string;
  prompt_summary: string;
  decision: string;
}

router.get(
  '/',
  authenticate,
  requireRole('admin'),
  validateRequest(getRiskAssessmentsSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const tier = req.query.tier as string | undefined;

      const conditions: string[] = [];
      const params: (string | number)[] = [];

      if (tier) {
        conditions.push('r.tier = ?');
        params.push(tier);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countSql = `SELECT COUNT(*) as count FROM risk_assessments r ${whereClause}`;
      const totalRow = db.prepare(countSql).get(...params) as { count: number };
      const total = totalRow.count || 0;

      const querySql = `
        SELECT 
          r.id, 
          r.interaction_id, 
          r.score, 
          r.tier, 
          r.top_factors, 
          r.created_at,
          i.user_name,
          i.department,
          i.target_app,
          i.category,
          i.prompt_summary,
          i.decision
        FROM risk_assessments r
        JOIN ai_interactions i ON r.interaction_id = i.id
        ${whereClause}
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const rows = db.prepare(querySql).all(...params, limit, offset) as RiskAssessmentRow[];

      const formatted = rows.map((row) => ({
        ...row,
        top_factors:
          typeof row.top_factors === 'string' ? JSON.parse(row.top_factors) : row.top_factors,
      }));

      res.json({
        success: true,
        data: formatted,
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

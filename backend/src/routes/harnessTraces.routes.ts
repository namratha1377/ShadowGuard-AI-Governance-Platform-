import { Router, Request, Response, NextFunction } from 'express';
import db from '../db/connection';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// GET /api/harness-traces -> Returns paginated harness traces joined with ai_interactions detail
router.get('/', authenticate, requireRole('admin'), (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const countRow = db.prepare('SELECT COUNT(*) as count FROM harness_traces').get() as { count: number };
    const total = countRow.count || 0;

    const rows = db.prepare(`
      SELECT 
        ht.id,
        ht.interaction_id,
        ht.workflow_path,
        ht.explanation,
        ht.agent_used,
        ht.verification_used,
        ht.created_at,
        ai.user_name,
        ai.department,
        ai.target_app,
        ai.prompt_summary,
        ai.risk_tier,
        ai.decision,
        ra.score as risk_score,
        ra.top_factors
      FROM harness_traces ht
      JOIN ai_interactions ai ON ht.interaction_id = ai.id
      LEFT JOIN risk_assessments ra ON ht.interaction_id = ra.interaction_id
      ORDER BY ht.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const formatted = rows.map((r: any) => ({
      ...r,
      workflow_path: typeof r.workflow_path === 'string' ? JSON.parse(r.workflow_path) : r.workflow_path,
      top_factors: typeof r.top_factors === 'string' ? JSON.parse(r.top_factors) : r.top_factors,
      verification_used: Boolean(r.verification_used)
    }));

    res.json({
      success: true,
      data: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/harness-traces/:interaction_id -> Returns trace detail for a specific interaction
router.get('/:interaction_id', authenticate, requireRole('admin'), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { interaction_id } = req.params;

    const row = db.prepare(`
      SELECT 
        ht.id,
        ht.interaction_id,
        ht.workflow_path,
        ht.explanation,
        ht.agent_used,
        ht.verification_used,
        ht.created_at,
        ai.user_name,
        ai.department,
        ai.target_app,
        ai.prompt_summary,
        ai.risk_tier,
        ai.decision,
        ra.score as risk_score,
        ra.top_factors
      FROM harness_traces ht
      JOIN ai_interactions ai ON ht.interaction_id = ai.id
      LEFT JOIN risk_assessments ra ON ht.interaction_id = ra.interaction_id
      WHERE ht.interaction_id = ?
    `).get(interaction_id) as any;

    if (!row) {
      return res.status(404).json({ success: false, error: 'Harness trace not found' });
    }

    const dlpLogs = db.prepare('SELECT category, matched_pattern, action FROM data_security_logs WHERE interaction_id = ?').all(interaction_id);

    const traceDetail = {
      ...row,
      workflow_path: typeof row.workflow_path === 'string' ? JSON.parse(row.workflow_path) : row.workflow_path,
      top_factors: typeof row.top_factors === 'string' ? JSON.parse(row.top_factors) : row.top_factors,
      verification_used: Boolean(row.verification_used),
      detected_entities: dlpLogs
    };

    res.json({
      success: true,
      data: traceDetail
    });
  } catch (error) {
    next(error);
  }
});

export default router;

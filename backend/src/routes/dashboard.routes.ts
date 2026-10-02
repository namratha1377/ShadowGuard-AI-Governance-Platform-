import { Router, Request, Response, NextFunction } from 'express';
import db from '../db/connection';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Governance metrics are administrative data and require an authenticated admin session.
router.get('/metrics', authenticate, requireRole('admin'), (_req: Request, res: Response, next: NextFunction) => {
  try {
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM ai_interactions').get() as {
      count: number;
    };
    const total = totalRow.count || 0;

    const decisionRows = db
      .prepare('SELECT decision, COUNT(*) as count FROM ai_interactions GROUP BY decision')
      .all() as { decision: string; count: number }[];

    const allowedCount = decisionRows.find((r) => r.decision === 'allowed')?.count || 0;
    const restrictedCount = decisionRows.find((r) => r.decision === 'restricted')?.count || 0;
    const blockedCount = decisionRows.find((r) => r.decision === 'blocked')?.count || 0;

    const verdictBreakdown = {
      allowed: {
        count: allowedCount,
        percentage: total > 0 ? parseFloat(((allowedCount / total) * 100).toFixed(1)) : 0,
      },
      restricted: {
        count: restrictedCount,
        percentage: total > 0 ? parseFloat(((restrictedCount / total) * 100).toFixed(1)) : 0,
      },
      blocked: {
        count: blockedCount,
        percentage: total > 0 ? parseFloat(((blockedCount / total) * 100).toFixed(1)) : 0,
      },
    };

    const dailyVolumeRows = db
      .prepare(
        `SELECT DATE(created_at) as date, decision, COUNT(*) as count
         FROM ai_interactions
         WHERE created_at >= DATETIME('now', '-14 days')
         GROUP BY DATE(created_at), decision
         ORDER BY DATE(created_at) ASC`
      )
      .all() as { date: string; decision: string; count: number }[];

    const dailyMap: Record<
      string,
      { date: string; allowed: number; restricted: number; blocked: number }
    > = {};
    for (const row of dailyVolumeRows) {
      if (!row.date) continue;
      if (!dailyMap[row.date]) {
        dailyMap[row.date] = { date: row.date, allowed: 0, restricted: 0, blocked: 0 };
      }
      if (row.decision === 'allowed') dailyMap[row.date].allowed += row.count;
      if (row.decision === 'restricted') dailyMap[row.date].restricted += row.count;
      if (row.decision === 'blocked') dailyMap[row.date].blocked += row.count;
    }
    const dailyVolume = Object.values(dailyMap);

    const appRows = db
      .prepare(
        'SELECT target_app as app, COUNT(*) as count FROM ai_interactions GROUP BY target_app ORDER BY count DESC'
      )
      .all() as { app: string; count: number }[];

    const recentAlerts = db
      .prepare(
        `SELECT id, user_name, department, target_app, category, prompt_summary, risk_tier, decision, created_at
         FROM ai_interactions
         WHERE risk_tier IN ('High', 'Critical') OR decision IN ('restricted', 'blocked')
         ORDER BY created_at DESC
         LIMIT 5`
      )
      .all();

    res.json({
      success: true,
      data: {
        totalInteractions: total,
        verdictBreakdown,
        dailyVolume,
        perAppCounts: appRows,
        recentAlerts,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

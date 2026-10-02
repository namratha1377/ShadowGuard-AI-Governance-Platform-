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

// Domain-specific AI analytics for the administrative dashboard.
router.get(
  '/analytics',
  authenticate,
  requireRole('admin'),
  (_req: Request, res: Response, next: NextFunction) => {
    try {
      const totalRow = db
        .prepare('SELECT COUNT(*) as count FROM ai_interactions')
        .get() as { count: number };

      const totalInteractions = totalRow.count || 0;

      // Governance decision breakdown
      const decisionRows = db
        .prepare(
          `SELECT decision, COUNT(*) as count
           FROM ai_interactions
           GROUP BY decision`
        )
        .all() as { decision: string; count: number }[];

      const decisions: Record<string, number> = {};
      for (const row of decisionRows) {
        decisions[row.decision] = row.count;
      }

      const allowed = decisions.allowed || 0;
      const restricted = decisions.restricted || 0;
      const blocked = decisions.blocked || 0;

      // Pending review count
      const pendingRow = db
        .prepare(
          `SELECT COUNT(*) as count
           FROM ai_interactions
           WHERE status = 'pending_review'
              OR decision = 'pending'`
        )
        .get() as { count: number };

      const pendingReview = pendingRow.count || 0;

      // Daily AI request volume for the last 14 days
      const dailyRows = db
        .prepare(
          `SELECT
             DATE(created_at) as date,
             decision,
             COUNT(*) as count
           FROM ai_interactions
           WHERE created_at >= DATETIME('now', '-14 days')
           GROUP BY DATE(created_at), decision
           ORDER BY DATE(created_at) ASC`
        )
        .all() as {
        date: string;
        decision: string;
        count: number;
      }[];

      const dailyMap: Record<
        string,
        {
          date: string;
          allowed: number;
          restricted: number;
          blocked: number;
        }
      > = {};

      for (const row of dailyRows) {
        if (!row.date) continue;

        if (!dailyMap[row.date]) {
          dailyMap[row.date] = {
            date: row.date,
            allowed: 0,
            restricted: 0,
            blocked: 0,
          };
        }

        if (row.decision === 'allowed') {
          dailyMap[row.date].allowed += row.count;
        }

        if (row.decision === 'restricted') {
          dailyMap[row.date].restricted += row.count;
        }

        if (row.decision === 'blocked') {
          dailyMap[row.date].blocked += row.count;
        }
      }

      const dailyVolume = Object.values(dailyMap);

      // AI usage by department and governance decision
         const departmentRows = db
        .prepare(
          `SELECT
            COALESCE(department, 'Unknown') as department,
            SUM(CASE WHEN decision = 'allowed' THEN 1 ELSE 0 END) as allowed,
            SUM(CASE WHEN decision = 'restricted' THEN 1 ELSE 0 END) as restricted,
            SUM(CASE WHEN decision = 'blocked' THEN 1 ELSE 0 END) as blocked,
            COUNT(*) as total
          FROM ai_interactions
          GROUP BY department
          ORDER BY total DESC`
        )
        .all() as {
        department: string;
        allowed: number;
        restricted: number;
        blocked: number;
        total: number;
      }[];    

      // AI provider usage
      const providerRows = db
        .prepare(
          `SELECT
            COALESCE(target_app, 'Unknown') as app,
            COUNT(*) as count
          FROM ai_interactions
          GROUP BY target_app
          ORDER BY count DESC`
        )
        .all() as {
        app: string;
        count: number;
      }[];

      // Security events by category and governance decision
        const securityRows = db
          .prepare(
            `SELECT
              COALESCE(d.category, 'Unknown') as category,
              COUNT(*) as count,
              SUM(CASE WHEN a.decision = 'restricted' THEN 1 ELSE 0 END) as restricted,
              SUM(CASE WHEN a.decision = 'blocked' THEN 1 ELSE 0 END) as blocked
            FROM data_security_logs d
            INNER JOIN ai_interactions a
              ON a.id = d.interaction_id
            GROUP BY d.category
            ORDER BY count DESC`
          )
          .all() as {
          category: string;
          count: number;
          restricted: number;
          blocked: number;
        }[];

      // Risk tier distribution
      const riskRows = db
        .prepare(
          `SELECT
             COALESCE(risk_tier, 'Unknown') as riskTier,
             COUNT(*) as count
           FROM ai_interactions
           GROUP BY risk_tier
           ORDER BY count DESC`
        )
        .all() as {
        riskTier: string;
        count: number;
      }[];

      // Prompt category distribution
      const categoryRows = db
        .prepare(
          `SELECT
             COALESCE(category, 'Unknown') as category,
             COUNT(*) as count
           FROM ai_interactions
           GROUP BY category
           ORDER BY count DESC`
        )
        .all() as {
        category: string;
        count: number;
      }[];

      res.json({
        success: true,
          data: {
        totalInteractions,

          allowedRequests: allowed,
          restrictedRequests: restricted,
          blockedRequests: blocked,
          pendingReview,

          dailyVolume,

          departmentBreakdown: departmentRows,

          providerUsage: providerRows,

          securityEvents: securityRows,

          riskDistribution: riskRows,

          categoryBreakdown: categoryRows,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

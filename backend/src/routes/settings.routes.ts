import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import db from '../db/connection';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

interface OrganizationSettingsRow {
  id: number;
  retention_days: number;
  webhook_slack: string | null;
  webhook_email: string | null;
}

const patchSettingsSchema = {
  body: z.object({
    retention_days: z.number().int().min(1).max(3650).optional(),
    webhook_slack: z.string().url().nullable().optional(),
    webhook_email: z.string().email().nullable().optional(),
  }),
};

router.get(
  '/',
  authenticate,
  requireRole('admin'),
  (_req: Request, res: Response, next: NextFunction) => {
    try {
      let settings = db
        .prepare('SELECT * FROM organization_settings ORDER BY id ASC LIMIT 1')
        .get() as OrganizationSettingsRow | undefined;

      if (!settings) {
        db.prepare(
          `INSERT INTO organization_settings (retention_days, webhook_slack, webhook_email)
           VALUES (365, 'https://hooks.slack.com/services/T00/B00/XXXX', 'security-alerts@shadowguard.io')`
        ).run();
        settings = db
          .prepare('SELECT * FROM organization_settings ORDER BY id ASC LIMIT 1')
          .get() as OrganizationSettingsRow;
      }

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/',
  authenticate,
  requireRole('admin'),
  validateRequest(patchSettingsSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      let settings = db
        .prepare('SELECT * FROM organization_settings ORDER BY id ASC LIMIT 1')
        .get() as OrganizationSettingsRow | undefined;

      if (!settings) {
        db.prepare(
          `INSERT INTO organization_settings (retention_days, webhook_slack, webhook_email)
           VALUES (365, 'https://hooks.slack.com/services/T00/B00/XXXX', 'security-alerts@shadowguard.io')`
        ).run();
        settings = db
          .prepare('SELECT * FROM organization_settings ORDER BY id ASC LIMIT 1')
          .get() as OrganizationSettingsRow;
      }

      const retentionDays = req.body.retention_days ?? settings.retention_days;
      const webhookSlack =
        req.body.webhook_slack !== undefined ? req.body.webhook_slack : settings.webhook_slack;
      const webhookEmail =
        req.body.webhook_email !== undefined ? req.body.webhook_email : settings.webhook_email;

      db.prepare(
        `UPDATE organization_settings
         SET retention_days = ?, webhook_slack = ?, webhook_email = ?
         WHERE id = ?`
      ).run(retentionDays, webhookSlack, webhookEmail, settings.id);

      const updated = db
        .prepare('SELECT * FROM organization_settings WHERE id = ?')
        .get(settings.id);

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

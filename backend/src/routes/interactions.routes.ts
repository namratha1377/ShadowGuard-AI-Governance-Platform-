import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import db from '../db/connection';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { HarnessClient } from '../services/harnessClient';
import { emitNewInteraction, emitInteractionStatusUpdate, getIO } from '../socket';

const router = Router();

// Employee responses intentionally expose no governance metadata. Admins retain
// the full interaction/evaluation data used by the governance dashboard.
const employeeSafeInteraction = (record: any) => ({
  id: record.id,
  prompt_summary: record.prompt_summary,
  target_app: record.target_app,
  category: record.category,
  file_name: record.file_name,
  created_at: record.created_at,
});

const employeeSafeEvaluation = (response: string | null, decision: string, requiresHumanReview: boolean) => ({
  response: response || (decision === 'blocked'
    ? 'Blocked'
    : requiresHumanReview || decision === 'restricted'
      ? 'In Review'
      : 'The AI response could not be generated.'),
});

// Only concrete leakage patterns are checked in model output. Generic words
// such as "password" in a code sample are not treated as leaked data.
const containsConcreteLeakage = (text: string) => {
  const patterns = [
    /AKIA[0-9A-Z]{16}/,
    /-----BEGIN (?:RSA|EC|OPENSSH|DSA|PGP)?\s?PRIVATE KEY-----/,
    /\b\d{3}-\d{2}-\d{4}\b/,
    /\b(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]\d{3}[-. ]\d{4}\b/,
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
    /\b(?:4\d{12}(?:\d{3})?|5[1-5]\d{14}|3[47]\d{13})\b/,
  ];
  return patterns.some((pattern) => pattern.test(text || ''));
};


const getInteractionsSchema = {
  query: z.object({
    user: z.string().optional(),
    department: z.enum(['Engineering', 'Marketing', 'HR', 'Finance', 'Product']).optional(),
    targetApp: z.enum(['ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Perplexity']).optional(),
    status: z.string().optional(),
    page: z.coerce.number().positive().default(1),
    limit: z.coerce.number().positive().max(100).default(10),
  }),
};

const createInteractionSchema = {
  body: z
    .object({
      user: z.string().min(1).optional(),
      user_name: z.string().min(1).optional(),
      department: z.enum(['Engineering', 'Marketing', 'HR', 'Finance', 'Product']).optional(),
      targetApp: z.enum(['ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Perplexity']).optional(),
      target_app: z.enum(['ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Perplexity']).optional(),
      prompt: z.string().min(1, 'Prompt is required'),
      category: z.string().optional().default('General Assistant'),
      file_name: z.string().optional(),
      file_content: z.string().optional(),
    })
    .refine((data) => data.targetApp || data.target_app, {
      message: 'Either targetApp or target_app must be provided',
      path: ['targetApp'],
    }),
};

// GET /api/ai-interactions
// Admin sees all organization records; normal 'user' only sees their own submission history
router.get(
  '/',
  authenticate,
  validateRequest(getInteractionsSchema),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const user = req.query.user as string | undefined;
      const department = req.query.department as string | undefined;
      const targetApp = req.query.targetApp as string | undefined;
      const status = req.query.status as string | undefined;

      const conditions: string[] = [];
      const params: (string | number)[] = [];

      // RBAC isolation: 'user' can ONLY see their own submission history
      if (req.user?.role === 'user') {
        conditions.push('user_name = ?');
        params.push(req.user.name);
      } else if (user) {
        // Admin can query by specific user
        conditions.push('user_name LIKE ?');
        params.push(`%${user}%`);
      }

      if (department) {
        conditions.push('department = ?');
        params.push(department);
      }
      if (targetApp) {
        conditions.push('target_app = ?');
        params.push(targetApp);
      }
      if (status) {
        conditions.push('(status = ? OR decision = ?)');
        params.push(status, status);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countSql = `SELECT COUNT(*) as count FROM ai_interactions ${whereClause}`;
      const totalRow = db.prepare(countSql).get(...params) as { count: number };
      const total = totalRow.count || 0;

      const querySql = `
        SELECT 
          i.id, i.user_name, i.user_id, i.department, i.target_app, i.category, i.prompt_summary, 
          i.risk_tier, i.decision, i.status, i.suggested_decision, i.review_note, i.file_name, i.created_at,
          r.score as risk_score,
          (SELECT matched_pattern FROM data_security_logs WHERE interaction_id = i.id LIMIT 1) as matched_policy,
          t.explanation
        FROM ai_interactions i
        LEFT JOIN risk_assessments r ON r.interaction_id = i.id
        LEFT JOIN harness_traces t ON t.interaction_id = i.id
        ${whereClause ? whereClause.replace(/\buser_name\b/g, 'i.user_name').replace(/\bdepartment\b/g, 'i.department').replace(/\btarget_app\b/g, 'i.target_app').replace(/\bstatus\b/g, 'i.status').replace(/\bdecision\b/g, 'i.decision') : ''}
        ORDER BY i.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const interactions = db.prepare(querySql).all(...params, limit, offset) as any[];
      const responseInteractions = req.user?.role === 'admin'
        ? interactions
        : interactions.map(employeeSafeInteraction);

      res.json({
        success: true,
        data: {
          interactions: responseInteractions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error: any) {
      if (error?.status === 503) {
        return res.status(503).json({
          success: false,
          error: "AI generation is currently unavailable. Please check the selected AI provider API configuration and try again.",
        });
      }
      next(error);
    }
  }
);

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB file upload limit
});

// Protected mutation endpoint: Both Admin and User (Employee) can submit prompts/files
router.post(
  '/',
  authenticate,
  requireRole('admin', 'user'),
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prompt = req.body.prompt;
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ success: false, error: 'Prompt is required' });
      }

      // If regular user, always enforce their own authenticated identity
      const isEmployee = req.user?.role === 'user';
      const userName = isEmployee
        ? req.user!.name
        : req.body.user || req.body.user_name || req.user?.name || 'Anonymous User';

      const department = isEmployee
        ? req.user?.department || 'Engineering'
        : req.body.department || req.user?.department || 'Engineering';

      const targetApp = req.body.targetApp || req.body.target_app || 'Gemini';
      const category = req.body.category || 'General Assistant';

      // Multer file upload: temporarily saved to backend/uploads/; record filename
      const uploadedFile = req.file;
      const fileName = uploadedFile ? uploadedFile.originalname : req.body.file_name || null;

      const combinedText = fileName ? `[Attached File: ${fileName}]\n${prompt}` : prompt;
      const promptSummary = prompt.length > 80 ? prompt.slice(0, 77) + '...' : prompt;

      // Resolve user id for socket rooms
      let userId = req.user?.id;
      if (!userId && userName) {
        const userRow = db.prepare('SELECT id FROM users WHERE name = ?').get(userName) as any;
        userId = userRow?.id;
      }
      if (!userId) userId = 1;

      // 1. Save the interaction initially with status="analyzing" and decision="pending"
      const insertInitial = db
        .prepare(
          `INSERT INTO ai_interactions (user_name, user_id, department, target_app, category, prompt_summary, risk_tier, decision, status, file_name, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'Low', 'pending', 'analyzing', ?, DATETIME('now'))`
        )
        .run(userName, userId, department, targetApp, category, promptSummary, fileName);

      const interactionId = Number(insertInitial.lastInsertRowid);

      // 2. Call Harness /evaluate (via harnessClient)
      const evalRes = await HarnessClient.evaluate({
        user: userName,
        department,
        target_app: targetApp,
        prompt: combinedText,
      });

      let aiResponse: string | null = null;
      let outputEvalRes: Awaited<ReturnType<typeof HarnessClient.evaluate>> | null = null;

      // Only allowed prompts reach the AI provider. Any sensitive finding in
      // the generated output also invalidates delivery and is converted to a
      // restricted/review outcome.
      if (evalRes.decision === 'allowed' && !evalRes.requires_human_review && evalRes.detected_entities.length === 0) {
        try {
          const generated = await HarnessClient.generate({
            prompt: combinedText,
            target_app: targetApp,
          });
          aiResponse = generated.response;

          // Do NOT run the generated answer back through the employee-prompt
          // governance graph. Generated code commonly contains words such as
          // "password", "email", or "revenue" as examples and that would
          // create false blocks. The request itself is the authorization
          // boundary. The provider receives only requests that already passed
          // the full ShadowGuard policy evaluation.
          if (containsConcreteLeakage(aiResponse)) {
            aiResponse = null;
            evalRes.decision = 'blocked';
            evalRes.requires_human_review = false;
            evalRes.matched_policy = 'Generated Output DLP';
            evalRes.detected_entities = [
              ...evalRes.detected_entities,
              { type: 'PII', match: 'Generated output matched a concrete secret/PII pattern.' },
            ];
          }
        } catch (generationError: any) {
          // A provider outage is NOT a security violation. Do not turn an
          // otherwise clean employee prompt into a false "Blocked" verdict.
          // Security blocking is reserved for policy/PII/confidential-data
          // findings from the governance evaluation.
          console.error('AI generation failed:', generationError?.message || generationError);
          aiResponse = null;
          const generationUnavailable = new Error(
            "AI generation is currently unavailable. Check the selected AI provider API configuration and try again."
          );
          (generationUnavailable as any).status = 503;
          throw generationUnavailable;
        }
      }

      const requiresHumanReview = Boolean(evalRes.requires_human_review);

      // Multi-table SQLite update & log inserts
      const transaction = db.transaction(() => {
        if (evalRes.decision === 'blocked') {
          db.prepare(
            `UPDATE ai_interactions
             SET risk_tier = ?, decision = 'blocked', status = 'blocked', suggested_decision = 'blocked'
             WHERE id = ?`
          ).run(evalRes.risk_tier, interactionId);
        } else if (requiresHumanReview || evalRes.decision === 'restricted') {
          db.prepare(
            `UPDATE ai_interactions
             SET risk_tier = ?, decision = 'pending', status = 'pending_review', suggested_decision = ?
             WHERE id = ?`
          ).run(evalRes.risk_tier, evalRes.decision || 'restricted', interactionId);
        } else {
          db.prepare(
            `UPDATE ai_interactions
             SET risk_tier = ?, decision = 'allowed', status = 'allowed'
             WHERE id = ?`
          ).run(evalRes.risk_tier, interactionId);
        }

        // Insert into risk_assessments
        const topFactorsJson = JSON.stringify(
          evalRes.top_factors || {
            user_role_contribution: 15,
            data_sensitivity_contribution: evalRes.risk_score * 0.4,
            endpoint_trust_contribution: 15,
            policy_match_contribution: evalRes.matched_policy ? 20 : 0,
          }
        );

        db.prepare(
          `INSERT INTO risk_assessments (interaction_id, score, tier, top_factors, created_at)
           VALUES (?, ?, ?, ?, DATETIME('now'))`
        ).run(interactionId, evalRes.risk_score, evalRes.risk_tier, topFactorsJson);

        // Insert into data_security_logs for detected entities
        for (const entity of evalRes.detected_entities) {
          const dlpCategory =
            entity.type === 'SourceCode'
              ? 'SourceCode'
              : entity.type === 'PII'
                ? 'PII'
                : entity.type === 'Financial'
                  ? 'Financial'
                  : 'Confidential';

          db.prepare(
            `INSERT INTO data_security_logs (interaction_id, category, matched_pattern, action, created_at)
             VALUES (?, ?, ?, ?, DATETIME('now'))`
          ).run(
            interactionId,
            dlpCategory,
            entity.match,
            evalRes.decision === 'blocked' ? 'Block' : 'Mask/Audit'
          );
        }

        // Insert into harness_traces
        db.prepare(
          `INSERT INTO harness_traces (interaction_id, workflow_path, explanation, agent_used, verification_used, created_at)
           VALUES (?, ?, ?, ?, ?, DATETIME('now'))`
        ).run(
          interactionId,
          JSON.stringify(evalRes.workflow_path),
          evalRes.explanation,
          'LangGraph + Dynamic Agents',
          evalRes.verification_used ? 1 : 0
        );

        return db.prepare('SELECT * FROM ai_interactions WHERE id = ?').get(interactionId) as any;
      });

      const updatedRecord = transaction();

      if (evalRes.decision === 'blocked') {
        emitInteractionStatusUpdate(userId, {
          interaction_id: interactionId,
          response: 'Blocked',
        });

        emitNewInteraction({
          ...updatedRecord,
          status: 'blocked',
          decision: 'blocked',
          suggested_decision: 'blocked',
          risk_score: evalRes.risk_score,
          risk_tier: evalRes.risk_tier,
          matched_policy: evalRes.matched_policy,
          explanation: evalRes.explanation,
          auto_approved: false,
          needs_action: false,
        });
      } else if (requiresHumanReview || evalRes.decision === 'restricted') {
        emitInteractionStatusUpdate(userId, {
          interaction_id: interactionId,
          response: 'In Review',
        });

        emitNewInteraction({
          ...updatedRecord,
          status: 'pending_review',
          decision: 'pending',
          suggested_decision: evalRes.decision,
          risk_score: evalRes.risk_score,
          risk_tier: evalRes.risk_tier,
          matched_policy: evalRes.matched_policy,
          explanation: evalRes.explanation,
          auto_approved: false,
          needs_action: true,
        });
      } else {
        emitInteractionStatusUpdate(userId, {
          interaction_id: interactionId,
          response: aiResponse || 'The AI response could not be generated.',
        });

        emitNewInteraction({
          ...updatedRecord,
          status: 'allowed',
          decision: 'allowed',
          suggested_decision: 'allow',
          risk_score: evalRes.risk_score,
          risk_tier: evalRes.risk_tier,
          matched_policy: evalRes.matched_policy,
          explanation: evalRes.explanation,
          auto_approved: true,
          needs_action: false,
        });
      }

      const isAdmin = req.user?.role === 'admin';
      res.status(201).json({
        success: true,
        data: isAdmin ? updatedRecord : employeeSafeInteraction(updatedRecord),
        ...(isAdmin
          ? { eval_result: evalRes, ai_response: aiResponse }
          : { employee_response: employeeSafeEvaluation(aiResponse, evalRes.decision, requiresHumanReview) }),
      });
    } catch (error: any) {
      if (error?.status === 503) {
        return res.status(503).json({
          success: false,
          error: "AI generation is currently unavailable. Please check the selected AI provider API configuration and try again.",
        });
      }
      next(error);
    }
  }
);

// Admin-only manual review endpoint
router.patch(
  '/:id/review',
  authenticate,
  requireRole('admin'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const { decision, note } = req.body;

      if (!decision || !['allowed', 'rejected'].includes(decision)) {
        return res.status(400).json({
          success: false,
          error: "Decision is required and must be either 'allowed' or 'rejected'",
        });
      }

      const existing = db.prepare('SELECT * FROM ai_interactions WHERE id = ?').get(id) as any;
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Interaction not found' });
      }

      // Update the interaction's status and final decision
      db.prepare(
        `UPDATE ai_interactions
         SET status = ?, decision = ?, review_note = ?
         WHERE id = ?`
      ).run(decision, decision, note || null, id);

      // Write an audit_logs entry (actor = admin, action = "Manual Review Decision")
      db.prepare(
        `INSERT INTO audit_logs (actor, action, target, severity, ip_address, created_at)
         VALUES (?, 'Manual Review Decision', ?, ?, ?, DATETIME('now'))`
      ).run(
        req.user?.name || req.user?.email || 'admin',
        `ai_interactions/${id}`,
        decision === 'allowed' ? 'info' : 'warning',
        req.ip || '127.0.0.1'
      );

      const updated = db.prepare('SELECT * FROM ai_interactions WHERE id = ?').get(id) as any;

      // Resolve user id for socket room
      let targetUserId = existing.user_id;
      if (!targetUserId && existing.user_name) {
        const userRow = db.prepare('SELECT id FROM users WHERE name = ?').get(existing.user_name) as any;
        targetUserId = userRow?.id;
      }
      if (!targetUserId) targetUserId = 1;

      const securityLog = db
        .prepare('SELECT matched_pattern FROM data_security_logs WHERE interaction_id = ? LIMIT 1')
        .get(id) as any;
      const policyReason = note || securityLog?.matched_pattern || 'organizational security policy';

      // Emit interaction-status-update to that specific user's room with the final outcome
      emitInteractionStatusUpdate(targetUserId, {
        interaction_id: id,
        status: decision,
        decision: decision,
        review_note: note || undefined,
        explanation:
          decision === 'allowed'
            ? 'Your request was manually reviewed and approved by the security administrator.'
            : `This request cannot be processed — it violates ${policyReason}. Contact your administrator if you believe this is an error.`,
      });

      // Broadcast review resolution to admin-room so pending queues animate out
      const io = getIO();
      if (io) {
        io.to('admin-room').emit('interaction-reviewed', {
          interaction_id: id,
          decision,
          note,
          reviewed_by: req.user?.name || 'Admin',
        });
      }

      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Testing endpoint for socket event verification
router.post('/test-socket-event', authenticate, (req: Request, res: Response) => {
  const { eventType, userId, payload } = req.body;
  if (eventType === 'new-interaction') {
    emitNewInteraction(payload || { id: 9999, prompt_summary: 'Test Socket.IO prompt', decision: 'allowed' });
  } else if (eventType === 'interaction-status-update') {
    emitInteractionStatusUpdate(
      userId || req.user?.id || 1,
      payload || { interaction_id: 9999, status: 'allowed', decision: 'allowed', explanation: 'Test explanation via Socket.IO' }
    );
  }
  res.json({ success: true, message: `Emitted ${eventType}` });
});

export default router;

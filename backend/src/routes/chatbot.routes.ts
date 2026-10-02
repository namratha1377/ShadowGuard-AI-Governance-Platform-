import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import axios from 'axios';
import db from '../db/connection';
import { validateRequest } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

const querySchema = {
  body: z.object({
    question: z.string().min(1, 'Question text is required'),
    interactionId: z.number().optional(),
    interaction_id: z.number().optional(),
    history: z
      .array(
        z.object({
          sender: z.enum(['user', 'assistant', 'model']),
          text: z.string(),
        })
      )
      .optional(),
  }),
};

function getCompactDbContext(requestedInteractionId?: number, questionText: string = '') {
  // 1. Total interactions & decision breakdown
  const totalRow = db.prepare('SELECT COUNT(*) as count FROM ai_interactions').get() as { count: number };
  const total = totalRow.count || 0;

  const decisionRows = db
    .prepare('SELECT decision, COUNT(*) as count FROM ai_interactions GROUP BY decision')
    .all() as { decision: string; count: number }[];

  const breakdown: Record<string, number> = { allowed: 0, restricted: 0, blocked: 0, rejected: 0, pending: 0 };
  decisionRows.forEach((r) => {
    breakdown[r.decision] = r.count;
  });

  const allowedPct = total > 0 ? ((breakdown.allowed / total) * 100).toFixed(1) : '0.0';
  const restrictedPct = total > 0 ? ((breakdown.restricted / total) * 100).toFixed(1) : '0.0';
  const blockedPct = total > 0 ? ((breakdown.blocked / total) * 100).toFixed(1) : '0.0';

  // 2. LIVE PENDING REVIEW QUEUE STATE (Phase 21 integration)
  const pendingRows = db
    .prepare(
      `SELECT 
        i.id, i.user_name, i.department, i.target_app, i.prompt_summary, i.risk_tier, i.suggested_decision, i.created_at,
        r.score as risk_score,
        (SELECT matched_pattern FROM data_security_logs WHERE interaction_id = i.id LIMIT 1) as matched_policy
       FROM ai_interactions i
       LEFT JOIN risk_assessments r ON r.interaction_id = i.id
       WHERE i.status = 'pending_review' OR i.decision = 'pending'
       ORDER BY i.created_at DESC`
    )
    .all() as any[];

  const riskiestPending =
    pendingRows.length > 0
      ? pendingRows.reduce(
          (prev, curr) => ((curr.risk_score || 0) > (prev.risk_score || 0) ? curr : prev),
          pendingRows[0]
        )
      : null;

  // 3. SPECIFIC HARNESS TRACE LOOKUP (#482 or interactionId parameter or regex)
  let targetId = requestedInteractionId;
  if (!targetId) {
    const match = questionText.match(/(?:interaction|trace|#)\s*#?(\d+)/i) || questionText.match(/#(\d+)/);
    if (match) {
      targetId = parseInt(match[1], 10);
    }
  }

  let specificRequestedTrace: any = null;
  if (targetId) {
    const interaction = db
      .prepare(
        `SELECT i.*, r.score as risk_score, r.top_factors
         FROM ai_interactions i
         LEFT JOIN risk_assessments r ON r.interaction_id = i.id
         WHERE i.id = ?`
      )
      .get(targetId) as any;

    if (interaction) {
      const trace = db.prepare('SELECT * FROM harness_traces WHERE interaction_id = ?').get(targetId) as any;
      const dlpLogs = db
        .prepare('SELECT category, matched_pattern, action FROM data_security_logs WHERE interaction_id = ?')
        .all(targetId);

      specificRequestedTrace = {
        interaction_id: interaction.id,
        user_name: interaction.user_name,
        department: interaction.department,
        target_app: interaction.target_app,
        prompt_summary: interaction.prompt_summary,
        risk_tier: interaction.risk_tier,
        decision: interaction.decision,
        status: interaction.status,
        suggested_decision: interaction.suggested_decision,
        review_note: interaction.review_note,
        risk_score: interaction.risk_score,
        top_factors: interaction.top_factors ? JSON.parse(interaction.top_factors) : null,
        workflow_path: trace ? JSON.parse(trace.workflow_path || '[]') : [],
        explanation: trace?.explanation || 'No trace explanation recorded',
        agent_used: trace?.agent_used,
        verification_used: trace?.verification_used ? true : false,
        detected_dlp_patterns: dlpLogs,
      };
    }
  }

  // 4. Top policies by violation count
  const topPolicies = db
    .prepare(
      'SELECT name, scope, rule_count, violation_count, status FROM policies ORDER BY violation_count DESC LIMIT 5'
    )
    .all();

  // 5. Recent High/Critical Alerts
  const recentAlerts = db
    .prepare(
      `SELECT id, user_name, department, target_app, prompt_summary, risk_tier, decision, status, created_at 
       FROM ai_interactions 
       WHERE risk_tier IN ('High', 'Critical') 
       ORDER BY created_at DESC LIMIT 5`
    )
    .all();

  // 6. DLP Log counts by category
  const dlpRows = db
    .prepare('SELECT category, COUNT(*) as count FROM data_security_logs GROUP BY category')
    .all() as { category: string; count: number }[];

  const dlpCounts: Record<string, number> = {};
  dlpRows.forEach((r) => {
    dlpCounts[r.category] = r.count;
  });

  // 7. Department decision breakdown
  const deptRows = db
    .prepare(
      `SELECT department, decision, COUNT(*) as count 
       FROM ai_interactions 
       GROUP BY department, decision`
    )
    .all() as { department: string; decision: string; count: number }[];

  const deptBreakdown: Record<string, Record<string, number>> = {};
  deptRows.forEach((r) => {
    if (!deptBreakdown[r.department]) {
      deptBreakdown[r.department] = { allowed: 0, restricted: 0, blocked: 0, rejected: 0, pending: 0 };
    }
    deptBreakdown[r.department][r.decision] = r.count;
  });

  return {
    metrics: {
      total_interactions: total,
      allowed_count: breakdown.allowed,
      allowed_percentage: `${allowedPct}%`,
      restricted_count: breakdown.restricted,
      restricted_percentage: `${restrictedPct}%`,
      blocked_count: breakdown.blocked,
      blocked_percentage: `${blockedPct}%`,
      rejected_count: breakdown.rejected || 0,
    },
    live_pending_reviews: {
      count: pendingRows.length,
      items: pendingRows,
      riskiest_item: riskiestPending,
    },
    specific_requested_trace: specificRequestedTrace,
    top_violated_policies: topPolicies,
    recent_high_critical_alerts: recentAlerts,
    dlp_category_counts: dlpCounts,
    department_decision_breakdown: deptBreakdown,
  };
}

function generateSuggestedChips(question: string, answer: string, dbContext: any): string[] {
  const qLower = question.toLowerCase();
  const aLower = answer.toLowerCase();

  const chips: string[] = [];

  if (qLower.includes('pending') || qLower.includes('review') || qLower.includes('waiting') || aLower.includes('pending')) {
    chips.push('Summarize the riskiest pending request');
    chips.push('Which department has the most pending reviews?');
    chips.push('Show top violated policies');
  } else if (qLower.includes('trace') || qLower.includes('interaction') || qLower.includes('#') || aLower.includes('workflow')) {
    chips.push("What's waiting for my review right now?");
    chips.push('Which policy was triggered most often?');
    chips.push('Summarize Finance department activity');
  } else if (qLower.includes('finance') || qLower.includes('engineering') || aLower.includes('department')) {
    chips.push('Show me all Finance requests this week');
    chips.push('Which policy is violated most by Engineering?');
    chips.push("What's waiting for my review right now?");
  } else if (qLower.includes('policy') || aLower.includes('policy')) {
    chips.push('Which policy has the highest violation count?');
    chips.push('Summarize the riskiest pending request');
    chips.push('Show recent high risk alerts');
  } else {
    chips.push("What's waiting for my review right now?");
    chips.push('Summarize the riskiest pending request');
    chips.push('Which department has the most restricted requests?');
  }

  return chips.slice(0, 3);
}

router.post(
  '/query',
  authenticate,
  requireRole('admin'),
  validateRequest(querySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, interactionId, interaction_id, history } = req.body;
      const targetInteractionId = interactionId || interaction_id;

      const dbContext = getCompactDbContext(targetInteractionId, question);
      const dataSources = [
        'Live Pending Review Queue',
        'Dashboard Metrics',
        'Top Violated Policies',
        'Recent High/Critical Alerts',
        'DLP Category Summary',
        'Department Breakdowns',
      ];
      if (dbContext.specific_requested_trace) {
        dataSources.unshift(`Harness Trace #${dbContext.specific_requested_trace.interaction_id}`);
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (apiKey) {
        try {
          // Format last ~10 history items if provided
          let historyContextPrompt = '';
          if (Array.isArray(history) && history.length > 0) {
            const recentHistory = history.slice(-10);
            historyContextPrompt = `\nRECENT CONVERSATION HISTORY (FOR MULTI-TURN MEMORY):\n${recentHistory
              .map((h) => `${h.sender.toUpperCase()}: ${h.text}`)
              .join('\n')}\n`;
          }

          const systemPrompt = `You are Ask ShadowGuard, an administrative, read-only AI security chatbot assistant.
Your task is to answer the user's question using ONLY the provided JSON context representing live organizational AI safety metrics and pipeline trace records.

STRICT INSTRUCTIONS:
1. Answer ONLY using the facts present in the provided JSON context.
2. Cite specific numbers, percentages, user names, departments, policy names, and interaction IDs wherever applicable.
3. If asked about a specific interaction or trace (e.g., "why was interaction #482 restricted?"), look at the "specific_requested_trace" object in the JSON context and explain its workflow_path, detected DLP patterns, and reasoning in plain, professional markdown English.
4. If asked about pending reviews or items waiting for action, use "live_pending_reviews" to state the count, user, department, risk score, and Harness recommendation.
5. Format your response cleanly using Markdown formatting (bold, bullet points, tables, code blocks) where helpful.
6. You are strictly READ-ONLY and advisory. Do NOT attempt, propose, or simulate data modification or policy changes.

JSON CONTEXT:
${JSON.stringify(dbContext, null, 2)}
${historyContextPrompt}
USER QUESTION:
"${question}"`;

          const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
          const response = await axios.post(
            geminiEndpoint,
            {
              contents: [{ parts: [{ text: systemPrompt }] }],
            },
            { timeout: 8000 }
          );

          const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidate) {
            const answerText = candidate.trim();
            const suggestedChips = generateSuggestedChips(question, answerText, dbContext);

            return res.json({
              success: true,
              data: {
                answer: answerText,
                data_sources_used: dataSources,
                suggested_chips: suggestedChips,
              },
            });
          }
        } catch (apiErr: any) {
          console.warn('Gemini API call failed for Chatbot, executing grounded local analysis:', apiErr.message);
        }
      }

      // Grounded local fallback analysis engine when API key is missing or offline
      let answer = '';
      const qLower = question.toLowerCase();

      // Case A: Specific interaction/trace explanation lookup
      if (dbContext.specific_requested_trace) {
        const tr = dbContext.specific_requested_trace;
        answer = `**Interaction #${tr.interaction_id} Analysis**:\n- **User**: ${tr.user_name} (${tr.department})\n- **Target AI**: ${tr.target_app}\n- **Risk Tier & Score**: ${tr.risk_tier} (${tr.risk_score || 'N/A'}/100)\n- **Status**: ${tr.status?.toUpperCase() || tr.decision?.toUpperCase()}\n- **Workflow Path**: \`${JSON.stringify(tr.workflow_path)}\`\n- **Explanation**: ${tr.explanation}\n${tr.detected_dlp_patterns?.length ? `- **DLP Matches**: ${tr.detected_dlp_patterns.map((d: any) => `${d.category} (${d.matched_pattern})`).join(', ')}` : ''}`;
      }
      // Case B: Live pending review queue inquiry
      else if (qLower.includes('pending') || qLower.includes('review') || qLower.includes('waiting') || qLower.includes('riskiest')) {
        const count = dbContext.live_pending_reviews.count;
        if (count === 0) {
          answer = `There are currently **0 interactions waiting for human review**. All compliance reviews across the organization are cleared.`;
        } else {
          const riskiest = dbContext.live_pending_reviews.riskiest_item;
          answer = `There are currently **${count} interaction(s)** waiting for administrator review in the Live Review Queue.\n\n**Riskiest Pending Request**:\n- **Interaction ID**: #${riskiest.id}\n- **Submitted By**: ${riskiest.user_name} (${riskiest.department})\n- **Target App**: ${riskiest.target_app}\n- **Risk Score**: ${riskiest.risk_score || 'N/A'}/100 (${riskiest.risk_tier})\n- **Prompt Summary**: "${riskiest.prompt_summary}"\n- **Harness Suggestion**: ${riskiest.suggested_decision?.toUpperCase() || 'RESTRICT'} ${riskiest.matched_policy ? `(Matched: ${riskiest.matched_policy})` : ''}`;
        }
      }
      // Case C: Overall risk exposure metrics
      else if (qLower.includes('risk') || qLower.includes('exposure') || qLower.includes('total') || qLower.includes('metrics')) {
        answer = `Our current risk exposure shows **${dbContext.metrics.total_interactions}** total AI interactions processed. Out of these:\n- **Allowed**: ${dbContext.metrics.allowed_count} (${dbContext.metrics.allowed_percentage})\n- **Restricted**: ${dbContext.metrics.restricted_count} (${dbContext.metrics.restricted_percentage})\n- **Blocked**: ${dbContext.metrics.blocked_count} (${dbContext.metrics.blocked_percentage})\n- **Pending Review**: ${dbContext.live_pending_reviews.count}`;
      }
      // Case D: Policy violation trends
      else if (qLower.includes('policy') || qLower.includes('violation')) {
        const top = dbContext.top_violated_policies[0] as any;
        if (top) {
          answer = `The policy with the highest violation count is **"${top.name}"** (Scope: ${top.scope}) with **${top.violation_count} recorded violations** across ${top.rule_count} configured rules.`;
        } else {
          answer = `Zero policy violations recorded across configured organizational policies.`;
        }
      }
      // Case E: Department breakdowns
      else if (qLower.includes('department') || qLower.includes('finance') || qLower.includes('engineering') || qLower.includes('restricted') || qLower.includes('blocked')) {
        let maxDept = '';
        let maxCount = -1;
        for (const [dept, counts] of Object.entries(dbContext.department_decision_breakdown as Record<string, any>)) {
          const totalNonAllowed = (counts.restricted || 0) + (counts.blocked || 0) + (counts.rejected || 0);
          if (totalNonAllowed > maxCount) {
            maxCount = totalNonAllowed;
            maxDept = dept;
          }
        }
        if (maxDept) {
          const deptCounts = (dbContext.department_decision_breakdown as any)[maxDept];
          answer = `The **${maxDept}** department has the highest count of non-allowed requests with **${deptCounts.restricted || 0} restricted** and **${deptCounts.blocked || 0} blocked** interactions.`;
        } else {
          answer = `I don't have department breakdown data for that query.`;
        }
      }
      // Case F: Security alerts summary
      else if (qLower.includes('alert') || qLower.includes('today') || qLower.includes('critical') || qLower.includes('high')) {
        const count = dbContext.recent_high_critical_alerts.length;
        if (count > 0) {
          const alert = dbContext.recent_high_critical_alerts[0] as any;
          answer = `There are **${count} recent High/Critical security alerts** on record. The most recent incident involved user **${alert.user_name}** (${alert.department}) using **${alert.target_app}** with prompt summary: *"${alert.prompt_summary}"* (Verdict: ${alert.decision.toUpperCase()}, Risk Tier: ${alert.risk_tier}).`;
        } else {
          answer = `Zero High or Critical severity security alerts detected today.`;
        }
      } else {
        answer = `I don't have that specific data in context. Try asking about pending reviews, high-risk alerts, policy violations, or specific interaction IDs like "#482".`;
      }

      const suggestedChips = generateSuggestedChips(question, answer, dbContext);

      return res.json({
        success: true,
        data: {
          answer,
          data_sources_used: dataSources,
          suggested_chips: suggestedChips,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  User,
  Cpu,
} from 'lucide-react';
import { SeverityPill } from '../ui/SeverityPill';

export interface PendingInteraction {
  id: number;
  user_name: string;
  department: string;
  target_app: string;
  prompt_summary: string;
  risk_tier: 'Low' | 'Medium' | 'High' | 'Critical';
  risk_score?: number;
  suggested_decision?: string;
  matched_policy?: string;
  explanation?: string;
  created_at: string;
}

interface PendingReviewPanelProps {
  items: PendingInteraction[];
  onReviewDecision: (id: number, decision: 'allowed' | 'rejected', note?: string) => Promise<void>;
}

interface PendingActionState {
  decision: 'allowed' | 'rejected';
  secondsLeft: number;
  timerId: any;
}

export const PendingReviewPanel: React.FC<PendingReviewPanelProps> = ({
  items,
  onReviewDecision,
}) => {
  // Map of interactionId -> PendingActionState (for 3s undo countdown)
  const [pendingActions, setPendingActions] = useState<Record<number, PendingActionState>>({});
  const pendingActionsRef = useRef(pendingActions);
  pendingActionsRef.current = pendingActions;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(pendingActionsRef.current).forEach((action) => {
        clearInterval(action.timerId);
      });
    };
  }, []);

  const handleInitiateAction = (id: number, decision: 'allowed' | 'rejected') => {
    // If an action already pending for this item, clear it
    if (pendingActions[id]) {
      clearInterval(pendingActions[id].timerId);
    }

    let countdown = 3;

    const timerId = setInterval(() => {
      countdown -= 1;
      if (countdown <= 0) {
        clearInterval(timerId);
        setPendingActions((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        // Execute the review decision
        onReviewDecision(id, decision);
      } else {
        setPendingActions((prev) => {
          if (!prev[id]) return prev;
          return {
            ...prev,
            [id]: {
              ...prev[id],
              secondsLeft: countdown,
            },
          };
        });
      }
    }, 1000);

    setPendingActions((prev) => ({
      ...prev,
      [id]: {
        decision,
        secondsLeft: countdown,
        timerId,
      },
    }));
  };

  const handleUndo = (id: number) => {
    if (pendingActions[id]) {
      clearInterval(pendingActions[id].timerId);
      setPendingActions((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/80 border border-amber-500/30 rounded-2xl p-5 backdrop-blur-md shadow-lg shadow-amber-500/5 space-y-4">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 dark:text-amber-400">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                Live Review Queue (Human-in-the-Loop)
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {items.length} Pending
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              High & Critical interactions quarantined by Adaptive Security requiring administrative approval.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono">Live Socket Active</span>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="py-8 text-center space-y-2 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 rounded-xl">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 dark:text-emerald-400 mx-auto opacity-80" />
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              All compliance reviews are cleared.
            </p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Any prompts flagged by the LangGraph multi-factor engine or organizational policies will appear here live.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {items.map((item) => {
              const pendingAction = pendingActions[item.id];

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25 }}
                  className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700/80 rounded-xl p-4 transition-all space-y-3 shadow-sm"
                >
                  {/* Item Meta & Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                        <User className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                        <span>{item.user_name}</span>
                      </div>
                      <span className="text-slate-400 dark:text-slate-600">•</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.department}
                      </span>
                      <span className="text-slate-400 dark:text-slate-600">•</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300">
                        {item.target_app}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <SeverityPill severity={item.risk_tier} />
                      <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Prompt Text Preview */}
                  <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-lg p-3 text-xs text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-1">
                      Submitted Prompt:
                    </span>
                    <p className="line-clamp-2 italic">"{item.prompt_summary}"</p>
                  </div>

                  {/* Harness Automatic Suggestion Box (Visually Distinguished) */}
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/50 text-xs">
                    <Cpu className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <div className="flex-1 text-[11px] text-indigo-200">
                      <strong className="text-indigo-400 font-semibold uppercase mr-1.5">
                        Harness Recommendation:
                      </strong>
                      <span>
                        Suggested: <strong className="font-semibold text-indigo-300">{item.suggested_decision ? item.suggested_decision.charAt(0).toUpperCase() + item.suggested_decision.slice(1) : 'Restrict'}</strong>
                        {item.risk_score !== undefined && ` — ${item.risk_score}% risk score`}
                        {item.matched_policy && ` — matched ${item.matched_policy} policy`}
                      </span>
                    </div>
                  </div>

                  {/* Action Bar / Undo Toast */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    {pendingAction ? (
                      /* 3-Second Undo Countdown State */
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                          pendingAction.decision === 'allowed'
                            ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                            : 'bg-rose-950/60 border-rose-700/60 text-rose-300'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                          Executing {pendingAction.decision === 'allowed' ? 'Approval' : 'Rejection'} in{' '}
                          <strong>{pendingAction.secondsLeft}s</strong>...
                        </span>
                        <button
                          onClick={() => handleUndo(item.id)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold transition shadow"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Undo
                        </button>
                      </motion.div>
                    ) : (
                      /* Operational Action Buttons */
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleInitiateAction(item.id, 'allowed')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
                          title="Authorize prompt submission"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Allow</span>
                        </button>

                        <button
                          onClick={() => handleInitiateAction(item.id, 'rejected')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition"
                          title="Reject and block prompt submission"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

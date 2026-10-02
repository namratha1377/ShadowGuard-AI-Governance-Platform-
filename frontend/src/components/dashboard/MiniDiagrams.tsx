import React from 'react';
import { motion } from 'framer-motion';

// Mini Animated SVG Diagrams for the 6 Admin Guide features

export const HarnessNodeDiagram: React.FC = () => {
  return (
    <div className="w-full h-36 bg-slate-950/90 rounded-xl border border-indigo-900/50 p-3 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="text-[10px] font-mono text-indigo-400 mb-2 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
        Dynamic Harness Execution Sequence
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 z-10">
        {[
          { label: 'Context', color: 'border-slate-700 bg-slate-900 text-slate-300' },
          { label: 'Sens', color: 'border-slate-700 bg-slate-900 text-slate-300' },
          { label: 'Risk', color: 'border-slate-700 bg-slate-900 text-slate-300' },
          { label: 'Policy', color: 'border-amber-700/60 bg-amber-950/40 text-amber-300' },
          { label: 'Agents', color: 'border-purple-700/60 bg-purple-950/40 text-purple-300' },
          { label: 'Decision', color: 'border-emerald-700/60 bg-emerald-950/40 text-emerald-300' },
        ].map((node, i) => (
          <React.Fragment key={i}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              className={`px-2 py-1 rounded-lg border text-[10px] font-mono font-semibold shadow-sm ${node.color}`}
            >
              {node.label}
            </motion.div>
            {i < 5 && (
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3], x: [0, 2, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.25 }}
                className="text-indigo-400 text-[10px] font-bold"
              >
                →
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-3 text-[9px] font-mono text-slate-500">
        Low Risk (5 steps) • Medium Risk (6 steps) • High/Critical (8 steps + dynamic agents)
      </div>
    </div>
  );
};

export const QuarantineFunnelDiagram: React.FC = () => {
  return (
    <div className="w-full h-36 bg-slate-950/90 rounded-xl border border-amber-900/40 p-3 flex items-center justify-between relative overflow-hidden">
      <div className="space-y-1 z-10 flex-1">
        <div className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Live Quarantine Queue
        </div>
        <p className="text-[11px] text-slate-300 leading-tight">
          High/Critical requests are quarantined for human compliance review.
        </p>
      </div>

      <div className="flex items-center gap-2 z-10">
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono text-center"
        >
          <div>Prompt</div>
          <div className="text-[9px] text-amber-400">Score 78</div>
        </motion.div>
        <span className="text-amber-500 text-xs">→</span>
        <div className="flex flex-col gap-1">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-semibold text-center shadow"
          >
            Allow (Green)
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="px-2 py-0.5 rounded bg-rose-600 text-white text-[9px] font-semibold text-center shadow"
          >
            Reject (Red)
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export const PolicyShieldDiagram: React.FC = () => {
  return (
    <div className="w-full h-36 bg-slate-950/90 rounded-xl border border-indigo-900/50 p-3 flex items-center justify-around relative overflow-hidden">
      {[
        { name: 'Source Code Guard', rules: '4 Rules', active: true, color: 'text-rose-400 border-rose-800/60 bg-rose-950/30' },
        { name: 'Financial Restrict', rules: '3 Rules', active: true, color: 'text-amber-400 border-amber-800/60 bg-amber-950/30' },
        { name: 'PII Protection', rules: '6 Rules', active: true, color: 'text-indigo-400 border-indigo-800/60 bg-indigo-950/30' },
      ].map((pol, i) => (
        <motion.div
          key={i}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5 }}
          className={`p-2.5 rounded-xl border flex flex-col items-center text-center space-y-1 ${pol.color}`}
        >
          <span className="text-[10px] font-bold font-mono">{pol.name}</span>
          <span className="text-[9px] text-slate-400">{pol.rules}</span>
          <span className="px-1.5 py-0.2 rounded text-[8px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            ENABLED
          </span>
        </motion.div>
      ))}
    </div>
  );
};

export const ChatbotSparklesDiagram: React.FC = () => {
  return (
    <div className="w-full h-36 bg-slate-950/90 rounded-xl border border-indigo-900/50 p-3 flex items-center justify-between relative overflow-hidden">
      <div className="space-y-1">
        <div className="text-[10px] font-mono text-indigo-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
          Ask ShadowGuard Assistant
        </div>
        <p className="text-[11px] text-slate-300 leading-tight">
          Read-only AI analyst querying live pending reviews & trace details.
        </p>
      </div>

      <div className="space-y-1.5 max-w-[200px]">
        <div className="p-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-[9px] text-indigo-200">
          "What's waiting for my review?"
        </div>
        <motion.div
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[9px] text-emerald-300 font-mono"
        >
          3 requests pending (Riskiest: #482 Score 79)
        </motion.div>
      </div>
    </div>
  );
};

export const DlpScannerDiagram: React.FC = () => {
  return (
    <div className="w-full h-36 bg-slate-950/90 rounded-xl border border-indigo-900/50 p-3 flex items-center justify-around relative overflow-hidden">
      <div className="space-y-1">
        <span className="text-[10px] font-mono text-indigo-400 block">DLP Entity Detection</span>
        <div className="text-[9px] text-slate-400 font-mono space-y-0.5">
          <div>• AWS Access Key → <span className="text-rose-400 font-semibold">[BLOCKED]</span></div>
          <div>• EBITDA Projections → <span className="text-amber-400 font-semibold">[MASKED]</span></div>
          <div>• Customer PII → <span className="text-amber-400 font-semibold">[REDACTED]</span></div>
        </div>
      </div>
    </div>
  );
};

export const AuditLedgerDiagram: React.FC = () => {
  return (
    <div className="w-full h-36 bg-slate-950/90 rounded-xl border border-indigo-900/50 p-3 flex flex-col justify-center space-y-1.5 relative overflow-hidden">
      <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Immutable Security Audit Ledger
      </div>
      {[
        { time: '10:42 AM', actor: 'sarah.connor@shadowguard.io', action: 'Manual Review Decision' },
        { time: '10:39 AM', actor: 'alex.mercer@shadowguard.local', action: 'Prompt Submission (Allowed)' },
      ].map((log, i) => (
        <div key={i} className="p-1.5 rounded bg-slate-900 border border-slate-800 text-[9px] font-mono text-slate-300 flex items-center justify-between">
          <span>{log.time} • {log.action}</span>
          <span className="text-indigo-400">{log.actor.split('@')[0]}</span>
        </div>
      ))}
    </div>
  );
};

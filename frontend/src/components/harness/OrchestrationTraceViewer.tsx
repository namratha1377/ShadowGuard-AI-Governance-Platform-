import React from 'react';
import { ShieldAlert, Sparkles, FileText, CheckCircle } from 'lucide-react';
import { SeverityPill } from '../ui/SeverityPill';
import { StatusBadge } from '../ui/StatusBadge';

interface DetectedEntity {
  category?: string;
  type?: string;
  matched_pattern?: string;
  match?: string;
  action?: string;
}

interface OrchestrationTraceViewerProps {
  explanation: string;
  riskScore: number;
  riskTier: 'Low' | 'Medium' | 'High' | 'Critical';
  decision: 'allowed' | 'restricted' | 'blocked';
  verificationUsed: boolean;
  detectedEntities?: DetectedEntity[];
  topFactors?: {
    user_role_contribution?: number;
    data_sensitivity_contribution?: number;
    endpoint_trust_contribution?: number;
    policy_match_contribution?: number;
  };
}

export const OrchestrationTraceViewer: React.FC<OrchestrationTraceViewerProps> = ({
  explanation,
  riskScore,
  riskTier,
  decision,
  verificationUsed,
  detectedEntities = [],
  topFactors
}) => {
  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium mb-1">Decision Verdict</div>
          <StatusBadge status={decision} />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium mb-1">Risk Score / Tier</div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold font-mono text-slate-100">{riskScore}/100</span>
            <SeverityPill severity={riskTier} />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs text-slate-400 font-medium mb-1">Gemini Pro Verification</div>
          <div className="flex items-center space-x-1.5 mt-1">
            {verificationUsed ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                Gemini Pro Verified
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                <CheckCircle className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Standard Scan (Reduced Overhead)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Explanation Trace Box */}
      <div className="bg-slate-900/70 border border-indigo-900/40 rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Execution Explanation Trace</span>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed font-sans font-medium">
          {explanation}
        </p>
      </div>

      {/* Detected Entities Breakdown */}
      {detectedEntities && detectedEntities.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Detected Sensitivity Matches ({detectedEntities.length})</span>
          </div>
          <div className="space-y-2">
            {detectedEntities.map((ent, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-slate-950/70 border border-slate-800/80 px-3.5 py-2.5 rounded-lg text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {ent.category || ent.type || 'Sensitivity Match'}
                  </span>
                  <span className="font-mono text-slate-300">
                    {ent.matched_pattern || ent.match}
                  </span>
                </div>
                {ent.action && (
                  <span className="text-[11px] font-medium text-slate-400">
                    Action: <span className="text-slate-200">{ent.action}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Factors Breakdown */}
      {topFactors && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Multi-Factor Risk Breakdown
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
              <span className="text-slate-400 block text-[11px]">User/Dept Baseline</span>
              <span className="font-mono text-slate-200 font-semibold">{topFactors.user_role_contribution ?? 0} pts</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
              <span className="text-slate-400 block text-[11px]">Data Sensitivity</span>
              <span className="font-mono text-slate-200 font-semibold">{topFactors.data_sensitivity_contribution ?? 0} pts</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
              <span className="text-slate-400 block text-[11px]">Endpoint Trust</span>
              <span className="font-mono text-slate-200 font-semibold">{topFactors.endpoint_trust_contribution ?? 0} pts</span>
            </div>
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
              <span className="text-slate-400 block text-[11px]">Policy Match Bump</span>
              <span className="font-mono text-slate-200 font-semibold">{topFactors.policy_match_contribution ?? 0} pts</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

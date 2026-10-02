import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Cpu, Sparkles, Eye, ShieldCheck } from 'lucide-react';
import { apiService } from '../services/api';
import { Card } from '../components/ui/Card';
import { SeverityPill } from '../components/ui/SeverityPill';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { WorkflowGraphViewer } from '../components/harness/WorkflowGraphViewer';
import { OrchestrationTraceViewer } from '../components/harness/OrchestrationTraceViewer';

interface HarnessTraceRow {
  id: number;
  interaction_id: number;
  workflow_path: string[];
  explanation: string;
  agent_used: string;
  verification_used: boolean;
  created_at: string;
  user_name: string;
  department: string;
  target_app: string;
  prompt_summary: string;
  risk_tier: 'Low' | 'Medium' | 'High' | 'Critical';
  decision: 'allowed' | 'restricted' | 'blocked';
  risk_score?: number;
  top_factors?: any;
  detected_entities?: any[];
}

import { usePageTitle } from '../hooks/usePageTitle';

export const HarnessConsolePage: React.FC = () => {
  usePageTitle('Harness Console');
  const [traces, setTraces] = useState<HarnessTraceRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTrace, setSelectedTrace] = useState<HarnessTraceRow | null>(null);

  const fetchTraces = async () => {
    setLoading(true);
    try {
      const res = await apiService.getHarnessTraces({ page: 1, limit: 20 });
      if (res.success && res.data) {
        setTraces(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch harness traces:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraces();
  }, []);

  const filteredTraces = traces.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      !searchQuery ||
      t.user_name?.toLowerCase().includes(q) ||
      t.department?.toLowerCase().includes(q) ||
      t.target_app?.toLowerCase().includes(q) ||
      t.explanation?.toLowerCase().includes(q) ||
      t.prompt_summary?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Execution Harness & StateGraph Console</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Harness Orchestration Traces</h1>
          <p className="text-sm text-slate-400 mt-1">
            Inspect real-time LangGraph node execution paths, multi-factor risk scores, and Gemini Pro verification decisions.
          </p>
        </div>

        <button
          onClick={fetchTraces}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-medium transition-all"
        >
          <RefreshCw className="w-4 h-4 text-slate-400" />
          <span>Refresh Traces</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user, department, target app, or trace explanation..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
      </Card>

      {/* Traces Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : filteredTraces.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No Harness Traces Found"
            description="Submit AI interaction prompts through the system to generate LangGraph execution traces."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">User & Dept</th>
                  <th className="px-6 py-3.5 font-semibold">Target App</th>
                  <th className="px-6 py-3.5 font-semibold">Prompt Summary</th>
                  <th className="px-6 py-3.5 font-semibold">Risk Tier</th>
                  <th className="px-6 py-3.5 font-semibold">Decision</th>
                  <th className="px-6 py-3.5 font-semibold">Gemini Verification</th>
                  <th className="px-6 py-3.5 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTraces.map((trace) => (
                  <tr key={trace.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">{trace.user_name}</div>
                      <div className="text-xs text-slate-400">{trace.department}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      {trace.target_app}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-300 max-w-xs truncate">
                      {trace.prompt_summary}
                    </td>
                    <td className="px-6 py-4">
                      <SeverityPill severity={trace.risk_tier} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={trace.decision} />
                    </td>
                    <td className="px-6 py-4">
                      {trace.verification_used ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                          <Sparkles className="w-3 h-3 mr-1 text-indigo-400" />
                          Gemini Verified
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Standard</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedTrace(trace)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold transition-all"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Inspect Trace</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Trace Detail Modal */}
      {selectedTrace && (
        <Modal
          isOpen={Boolean(selectedTrace)}
          onClose={() => setSelectedTrace(null)}
          title={`Harness Trace Inspection - Interaction #${selectedTrace.interaction_id}`}
        >
          <div className="space-y-6">
            <WorkflowGraphViewer workflowPath={selectedTrace.workflow_path} />
            <OrchestrationTraceViewer
              explanation={selectedTrace.explanation}
              riskScore={selectedTrace.risk_score || 0}
              riskTier={selectedTrace.risk_tier}
              decision={selectedTrace.decision}
              verificationUsed={selectedTrace.verification_used}
              detectedEntities={selectedTrace.detected_entities}
              topFactors={selectedTrace.top_factors}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default HarnessConsolePage;

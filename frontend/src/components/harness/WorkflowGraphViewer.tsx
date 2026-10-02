import React from 'react';
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Lock,
  Cpu,
  Zap,
} from 'lucide-react';

interface WorkflowGraphViewerProps {
  workflowPath: string[];
}

interface NodeConfig {
  label: string;
  type: 'core' | 'dynamic';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  borderClass: string;
  badgeClass: string;
  textClass: string;
}

const CORE_NODES = new Set([
  'context_node',
  'sensitivity_node',
  'risk_node',
  'policy_node',
  'decision_node',
]);

const NODE_CONFIGS: Record<string, NodeConfig> = {
  // Core Pipeline Steps (Fixed Baseline)
  context_node: {
    label: 'Context Ingest',
    type: 'core',
    description: 'Metadata & User Baseline',
    icon: CheckCircle2,
    borderClass: 'border-cyan-500/30 hover:border-cyan-500/60 bg-slate-900/90',
    badgeClass: 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60',
    textClass: 'text-cyan-200',
  },
  sensitivity_node: {
    label: 'DLP Sensitivity Scan',
    type: 'core',
    description: 'Presidio & Regex Entities',
    icon: CheckCircle2,
    borderClass: 'border-cyan-500/30 hover:border-cyan-500/60 bg-slate-900/90',
    badgeClass: 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60',
    textClass: 'text-cyan-200',
  },
  risk_node: {
    label: 'Risk Engine',
    type: 'core',
    description: 'Multi-Factor Heuristic',
    icon: CheckCircle2,
    borderClass: 'border-cyan-500/30 hover:border-cyan-500/60 bg-slate-900/90',
    badgeClass: 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60',
    textClass: 'text-cyan-200',
  },
  policy_node: {
    label: 'Policy Evaluator',
    type: 'core',
    description: 'Org Governance Rules',
    icon: CheckCircle2,
    borderClass: 'border-cyan-500/30 hover:border-cyan-500/60 bg-slate-900/90',
    badgeClass: 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60',
    textClass: 'text-cyan-200',
  },
  decision_node: {
    label: 'Verdict & Explanation',
    type: 'core',
    description: 'Gemini Verification & Trace',
    icon: CheckCircle2,
    borderClass: 'border-cyan-500/30 hover:border-cyan-500/60 bg-slate-900/90',
    badgeClass: 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60',
    textClass: 'text-cyan-200',
  },

  // Dynamically Dispatched Specialized Agents (Variable Runtime)
  redaction_agent: {
    label: 'Redaction Agent',
    type: 'dynamic',
    description: 'Masks Sensitive Entity Matches',
    icon: Sparkles,
    borderClass: 'border-purple-500/40 hover:border-purple-400 bg-purple-950/20 shadow-purple-500/10 shadow-sm',
    badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-700/60',
    textClass: 'text-purple-200',
  },
  output_validation_agent: {
    label: 'Output Validator',
    type: 'dynamic',
    description: 'Data Exfiltration Firewall',
    icon: ShieldCheck,
    borderClass: 'border-amber-500/40 hover:border-amber-400 bg-amber-950/20 shadow-amber-500/10 shadow-sm',
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
    textClass: 'text-amber-200',
  },
  approval_routing_agent: {
    label: 'Approval Routing',
    type: 'dynamic',
    description: 'Human Sign-off Quarantine',
    icon: UserCheck,
    borderClass: 'border-rose-500/40 hover:border-rose-400 bg-rose-950/20 shadow-rose-500/10 shadow-sm',
    badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
    textClass: 'text-rose-200',
  },
  restricted_model_routing_agent: {
    label: 'Restricted Model Enclave',
    type: 'dynamic',
    description: 'Diverts to Internal Secure LLM',
    icon: Lock,
    borderClass: 'border-sky-500/40 hover:border-sky-400 bg-sky-950/20 shadow-sky-500/10 shadow-sm',
    badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-700/60',
    textClass: 'text-sky-200',
  },
};

export const WorkflowGraphViewer: React.FC<WorkflowGraphViewerProps> = ({ workflowPath }) => {
  const defaultNodes = ['context_node', 'sensitivity_node', 'risk_node', 'policy_node', 'decision_node'];
  const activeNodes = workflowPath && workflowPath.length > 0 ? workflowPath : defaultNodes;

  const coreCount = activeNodes.filter((n) => CORE_NODES.has(n)).length;
  const dynamicCount = activeNodes.filter((n) => !CORE_NODES.has(n)).length;

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm space-y-4">
      {/* Header & Runtime Summary Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Dynamic Orchestration Workflow Trace
            </h4>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Visualizing fixed pipeline baseline vs. dynamically selected runtime agents.
          </p>
        </div>

        {/* Legend / Metrics Badges */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/50 border border-cyan-800/60 text-cyan-300 font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            {coreCount} Core Steps
          </span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11px] border ${
            dynamicCount > 0
              ? 'bg-purple-950/50 border-purple-700/60 text-purple-300'
              : 'bg-slate-800/50 border-slate-700 text-slate-400'
          }`}>
            <Zap className={`w-3 h-3 ${dynamicCount > 0 ? 'text-purple-400 animate-pulse' : 'text-slate-500'}`} />
            {dynamicCount} Dynamic Agents
          </span>
        </div>
      </div>

      {/* Nodes Graph */}
      <div className="flex flex-wrap items-center gap-2 md:gap-3 pt-1">
        {activeNodes.map((node, idx) => {
          const config = NODE_CONFIGS[node] || {
            label: node,
            type: CORE_NODES.has(node) ? 'core' : 'dynamic',
            description: 'Custom Pipeline Step',
            icon: CORE_NODES.has(node) ? CheckCircle2 : Zap,
            borderClass: 'border-slate-700 bg-slate-900',
            badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
            textClass: 'text-slate-200',
          };

          const Icon = config.icon;
          const isLast = idx === activeNodes.length - 1;
          const isDynamic = config.type === 'dynamic';

          return (
            <React.Fragment key={`${node}-${idx}`}>
              <div
                className={`relative group flex flex-col p-3 rounded-xl border transition-all duration-200 ${config.borderClass}`}
              >
                {/* Node Top Category Badge */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${config.badgeClass}`}
                  >
                    {isDynamic ? 'Dynamic Agent' : 'Core Step'}
                  </span>
                  <Icon className={`w-3.5 h-3.5 ${config.textClass}`} />
                </div>

                {/* Node Title */}
                <div className="text-xs font-semibold font-mono tracking-tight text-slate-100">
                  {config.label}
                </div>

                {/* Node Purpose Subtitle */}
                <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                  {config.description}
                </div>
              </div>

              {!isLast && (
                <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0 hidden sm:block" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Empty dynamic agents notice for Low Risk traces */}
      {dynamicCount === 0 && (
        <div className="text-[11px] text-slate-400 bg-slate-950/40 border border-slate-800/80 px-3 py-2 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>
            <strong>Low Risk Request:</strong> Benign baseline query passed all policies. Execution completed without requiring additional dynamic containment agents.
          </span>
        </div>
      )}
    </div>
  );
};

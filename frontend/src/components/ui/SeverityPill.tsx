import React from 'react';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

interface SeverityPillProps {
  severity: SeverityLevel | string;
  className?: string;
}

export const SeverityPill: React.FC<SeverityPillProps> = ({ severity, className = '' }) => {
  const styles: Record<string, { bg: string; text: string; dot: string; border: string }> = {
    Low: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400',
      border: 'border-emerald-500/20',
    },
    Medium: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      dot: 'bg-amber-400',
      border: 'border-amber-500/20',
    },
    High: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      dot: 'bg-orange-400',
      border: 'border-orange-500/20',
    },
    Critical: {
      bg: 'bg-rose-500/15',
      text: 'text-rose-400',
      dot: 'bg-rose-400 animate-pulse',
      border: 'border-rose-500/30',
    },
  };

  const current = styles[severity] || {
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    dot: 'bg-slate-400',
    border: 'border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.bg} ${current.text} ${current.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {severity}
    </span>
  );
};

import React from 'react';

export type BadgeVariant = 'default' | 'allowed' | 'restricted' | 'blocked' | 'indigo' | 'slate';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    allowed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    restricted: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    blocked: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    slate: 'bg-slate-900 text-slate-400 border-slate-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

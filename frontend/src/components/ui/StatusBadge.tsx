import React from 'react';
import { Badge } from './Badge';

interface StatusBadgeProps {
  status: 'allowed' | 'restricted' | 'blocked' | 'enabled' | 'disabled' | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalized = status.toLowerCase();

  if (normalized === 'allowed' || normalized === 'enabled') {
    return (
      <Badge variant="allowed" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
        {status.toUpperCase()}
      </Badge>
    );
  }

  if (normalized === 'restricted') {
    return (
      <Badge variant="restricted" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
        {status.toUpperCase()}
      </Badge>
    );
  }

  if (normalized === 'blocked' || normalized === 'disabled') {
    return (
      <Badge variant="blocked" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5" />
        {status.toUpperCase()}
      </Badge>
    );
  }

  return (
    <Badge variant="slate" className={className}>
      {status}
    </Badge>
  );
};

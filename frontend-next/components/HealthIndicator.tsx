'use client';

import type { HealthType } from '@/types';

interface Props {
  type: HealthType;
  text: string;
  className?: string;
}

const LABELS: Record<HealthType, string> = {
  success: 'Online',
  error: 'Offline',
  pending: '...',
};

export function HealthIndicator({ type, className }: Props) {
  const cls = type === 'success' ? 'ok' : type === 'error' ? 'err' : 'wait';
  return (
    <div className={`health-indicator ${cls} ${className ?? ''}`} aria-label={`Backend ${LABELS[type]}`}>
      <span className="health-dot" aria-hidden="true" />
      <span>{LABELS[type]}</span>
    </div>
  );
}

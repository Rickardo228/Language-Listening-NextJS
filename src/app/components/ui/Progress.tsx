'use client'

import { cn } from './utils';

interface ProgressProps {
  value: number;
  className?: string;
}

export function Progress({ value, className }: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800', className)}
    >
      <div
        className="h-full bg-slate-800 dark:bg-slate-200 transition-all"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}

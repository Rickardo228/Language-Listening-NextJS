'use client';

import { HTMLAttributes } from 'react';
import { cn } from './utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline';
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';
  const variantClasses =
    variant === 'outline'
      ? 'border border-border text-foreground bg-transparent'
      : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900';

  return (
    <span className={cn(baseClasses, variantClasses, className)} {...props} />
  );
}

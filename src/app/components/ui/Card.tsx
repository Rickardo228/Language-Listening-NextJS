'use client';

import { ElementType, ComponentPropsWithoutRef } from 'react';
import { cn } from './utils';

type CardProps<T extends ElementType> = {
  as?: T;
  className?: string;
} & ComponentPropsWithoutRef<T>;

export function Card<T extends ElementType = 'div'>({
  as,
  className,
  ...props
}: CardProps<T>) {
  const Component = as || 'div';

  return (
    <Component
      className={cn('rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/60', className)}
      {...props}
    />
  );
}

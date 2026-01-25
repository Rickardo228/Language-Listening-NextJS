'use client';

import { ComponentPropsWithRef, ElementType, forwardRef } from 'react';
import { cn } from './utils';

type CardProps<T extends ElementType> = {
  as?: T;
  className?: string;
} & ComponentPropsWithRef<T>;

export const Card = forwardRef(<T extends ElementType = 'div'>(
  { as, className, ...props }: CardProps<T>,
  ref: ComponentPropsWithRef<T>['ref']
) => {
  const Component = as || 'div';

  return (
    <Component
      ref={ref}
      className={cn('rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/60', className)}
      {...props}
    />
  );
});

Card.displayName = 'Card';

'use client';

import { ComponentPropsWithoutRef, ElementType, forwardRef } from 'react';
import { cn } from './utils';

type CardProps<T extends ElementType = 'div'> = {
  as?: T;
  className?: string;
} & ComponentPropsWithoutRef<T>;

type CardComponent = <T extends ElementType = 'div'>(
  props: CardProps<T> & { ref?: React.ComponentPropsWithRef<T>['ref'] }
) => React.ReactElement | null;

export const Card: CardComponent = forwardRef(function Card(
  { as, className, ...props }: CardProps<ElementType>,
  ref: React.ForwardedRef<Element>
) {
  const Component = (as || 'div') as ElementType;

  return (
    <Component
      ref={ref as React.Ref<never>}
      className={cn('rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/60', className)}
      {...props}
    />
  );
}) as CardComponent;

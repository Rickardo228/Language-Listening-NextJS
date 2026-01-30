'use client';

import { ComponentPropsWithoutRef, ElementType, forwardRef } from 'react';
import { cn } from './utils';

type OptionTone = 'indigo' | 'amber' | 'blue' | 'emerald' | 'slate';

type OptionCardProps<T extends ElementType = 'div'> = {
  as?: T;
  tone?: OptionTone;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
} & ComponentPropsWithoutRef<T>;

type OptionCardComponent = <T extends ElementType = 'div'>(
  props: OptionCardProps<T> & { ref?: React.ComponentPropsWithRef<T>['ref'] }
) => React.ReactElement | null;

const toneStyles: Record<OptionTone, { hover: string; selected: string }> = {
  indigo: {
    hover: 'hover:border-indigo-300 hover:bg-indigo-50/50',
    selected: 'border-indigo-400 bg-indigo-50 dark:border-indigo-400/70 dark:bg-indigo-500/15',
  },
  amber: {
    hover: 'hover:border-amber-300 hover:bg-amber-50/50',
    selected: 'border-amber-300 bg-amber-50 dark:border-amber-300/70 dark:bg-amber-500/15',
  },
  blue: {
    hover: 'hover:border-blue-300 hover:bg-blue-50/40',
    selected: 'border-blue-500 bg-blue-50 dark:border-blue-400/70 dark:bg-blue-900/25',
  },
  emerald: {
    hover: 'hover:border-emerald-200 hover:bg-emerald-50/40',
    selected: 'border-emerald-400 bg-emerald-50 dark:border-emerald-400/70 dark:bg-emerald-500/15',
  },
  slate: {
    hover: 'hover:border-slate-300 hover:bg-slate-50/60',
    selected: 'border-slate-400 bg-slate-50 dark:border-slate-400/70 dark:bg-slate-500/10',
  },
};

export const OptionCard: OptionCardComponent = forwardRef(function OptionCard(
  {
    as,
    tone = 'slate',
    selected = false,
    disabled = false,
    className,
    ...props
  }: OptionCardProps<ElementType>,
  ref: React.ForwardedRef<Element>
) {
  const Component = (as || 'div') as ElementType;
  const toneClass = toneStyles[tone];

  return (
    <Component
      ref={ref as React.Ref<never>}
      className={cn(
        'rounded-lg border-2 transition-all duration-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-800/60',
        selected ? toneClass.selected : cn('border-gray-200 dark:border-slate-700', toneClass.hover),
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className
      )}
      {...props}
    />
  );
}) as OptionCardComponent;

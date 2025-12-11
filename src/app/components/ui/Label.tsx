'use client'

import { LabelHTMLAttributes } from 'react';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  className?: string;
}

export function Label({
  required = false,
  className = '',
  children,
  ...props
}: LabelProps) {
  return (
    <label
      className={`block text-sm font-medium text-foreground mb-1 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  );
}

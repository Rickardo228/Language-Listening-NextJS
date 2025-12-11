'use client'

import { SelectHTMLAttributes } from 'react';
import { Label } from './Label';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  className?: string;
  selectClassName?: string;
}

export function Select({
  label,
  helperText,
  error,
  options,
  className = '',
  selectClassName = '',
  id,
  required,
  ...props
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const hasError = Boolean(error);

  const baseSelectClasses = 'w-full px-3 py-2.5 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-md cursor-pointer';
  const errorClasses = hasError ? 'border-destructive/50 focus:ring-destructive/20 focus:border-destructive' : 'border-border hover:border-primary/50 focus:ring-primary/20 focus:border-primary';

  return (
    <div className={className}>
      {label && <Label htmlFor={selectId} required={required}>{label}</Label>}

      <select
        id={selectId}
        className={`${baseSelectClasses} ${errorClasses} ${selectClassName}`}
        aria-invalid={hasError}
        aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <p id={`${selectId}-error`} className="text-sm text-destructive mt-1">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={`${selectId}-helper`} className="text-sm text-muted-foreground mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
}

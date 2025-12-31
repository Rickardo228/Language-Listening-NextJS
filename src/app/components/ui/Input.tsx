'use client'

import { InputHTMLAttributes, ReactNode } from 'react';
import { Label } from './Label';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  // Label
  label?: string;

  // Help text
  helperText?: string;

  // Error state
  error?: string;

  // Icons
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;

  // Styling
  className?: string;
  inputClassName?: string;
}

export function Input({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  className = '',
  inputClassName = '',
  id,
  required,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const hasError = Boolean(error);

  const baseInputClasses = 'w-full px-3 py-2.5 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-md';
  const errorClasses = hasError ? 'border-destructive/50 focus:ring-destructive/20 focus:border-destructive' : 'border-border hover:border-primary/50 focus:ring-primary/20 focus:border-primary';
  const iconPaddingLeft = leftIcon ? 'pl-10' : '';
  const iconPaddingRight = rightIcon ? 'pr-10' : '';

  return (
    <div className={className}>
      {label && <Label htmlFor={inputId} required={required}>{label}</Label>}

      <div className="relative group">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          className={`${baseInputClasses} ${errorClasses} ${iconPaddingLeft} ${iconPaddingRight} ${inputClassName}`}
          aria-invalid={hasError}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="text-sm text-destructive mt-1">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={`${inputId}-helper`} className="text-sm text-muted-foreground mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
}

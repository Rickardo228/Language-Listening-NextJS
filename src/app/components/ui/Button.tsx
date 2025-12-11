'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  // Visual variants
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'success';

  // Sizes
  size?: 'sm' | 'md' | 'lg';

  // State
  isLoading?: boolean;
  loadingText?: string;

  // Icons
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;

  // Layout
  fullWidth?: boolean;

  // Styling
  className?: string;
}

const variantClasses = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'border border-border text-foreground hover:bg-secondary',
  ghost: 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  success: 'bg-green-600 text-white hover:bg-green-700',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          {loadingText || children}
        </>
      ) : (
        <>
          {leftIcon && <span className="mr-2 flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2 flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}

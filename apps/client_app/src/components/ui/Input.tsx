'use client';

import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, helperText, startIcon, endIcon, className, ...props },
    ref,
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {startIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
              {startIcon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full px-4 py-2.5 rounded-lg',
              'bg-[var(--bg-input)] border border-[var(--border)]',
              'text-[var(--text-primary)] placeholder-[var(--text-muted)]',
              'focus:border-[var(--accent)] focus:outline-none transition-colors',
              startIcon && 'pl-10',
              endIcon && 'pr-10',
              error && 'border-[var(--error)]',
              className,
            )}
            {...props}
          />
          {endIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
              {endIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-[var(--error)] mt-1">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, type, showPasswordToggle = true, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const isPasswordInput = type === 'password';
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const effectiveType = isPasswordInput ? (isPasswordVisible ? 'text' : 'password') : type;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            {label}
            {props.required && <span className="text-rose-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={effectiveType}
            className={cn(
              'w-full bg-[#121724] border text-slate-100 text-sm rounded-lg block px-3.5 py-2.5 transition-colors placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50',
              error ? 'border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/30' : 'border-slate-800 focus:border-indigo-500',
              leftIcon ? 'pl-10' : '',
              isPasswordInput || rightIcon ? 'pr-10' : '',
              className
            )}
            {...props}
          />
          {isPasswordInput && showPasswordToggle ? (
            <button
              type="button"
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none transition-colors"
              title={isPasswordVisible ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {isPasswordVisible ? (
                <EyeOff className="w-4 h-4 text-slate-400" />
              ) : (
                <Eye className="w-4 h-4 text-slate-400" />
              )}
            </button>
          ) : rightIcon ? (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
              {rightIcon}
            </div>
          ) : null}
        </div>
        {error && <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-400 mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

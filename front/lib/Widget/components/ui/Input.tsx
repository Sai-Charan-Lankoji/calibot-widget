import React from "react";
import { cn } from "../../utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  multiline?: boolean;
}

export const Input = React.memo<InputProps>(({ 
  label,
  error,
  icon,
  multiline,
  className,
  ...props
}) => {
  const baseStyles = cn(
    "w-full px-4 py-3 rounded-xl border bg-base-100 text-base-content",
    "text-sm placeholder:text-neutral transition-all",
    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
    error ? "border-error" : "border-base",
    icon && "pl-10",
    className
  );

  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-base-content flex items-center gap-2">
          {icon}
          {label}
        </label>
      )}
      <div className="relative">
        {icon && !label && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral">
            {icon}
          </div>
        )}
        <InputComponent
          className={baseStyles}
          {...props as any}
        />
      </div>
      {error && (
        <p className="text-sm text-error">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
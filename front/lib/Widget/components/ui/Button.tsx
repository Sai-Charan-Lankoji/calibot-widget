import React from "react"
import { cn } from "../../utils/cn"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline"
  size?: "sm" | "md" | "lg"
  isLoading?: boolean
  children: React.ReactNode
}

export const Button = React.memo<ButtonProps>(
  ({ variant = "primary", size = "md", isLoading, disabled, className, children, ...props }) => {
    const baseStyles =
      "rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-primary"

    const variantStyles = {
      primary: "bg-theme-primary text-theme-primary-content hover:brightness-110 shadow-sm",
      secondary: "bg-theme-secondary text-theme-secondary-content hover:brightness-110",
      ghost: "hover:bg-theme-base-200 text-theme-base-content",
      outline: "border border-theme-base text-theme-base-content hover:bg-theme-base-200",
    }

    const sizeStyles = {
      sm: "h-9 px-3 text-sm",
      md: "h-11 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    }

    return (
      <button
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          (disabled || isLoading) && "opacity-50 cursor-not-allowed",
          !disabled && !isLoading && "active:scale-95",
          className,
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </div>
        ) : (
          children
        )}
      </button>
    )
  },
)

Button.displayName = "Button"

// import React from "react"
// import { cn } from "../../utils/cn"

// interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
//   label?: string
//   error?: string
//   icon?: React.ReactNode
//   multiline?: boolean
// }

// export const Input = React.memo<InputProps>(({ label, error, icon, multiline, className, ...props }) => {
//   const baseStyles = cn(
//     "w-full px-4 py-3 rounded-xl border bg-background text-foreground",
//     "text-sm placeholder:text-muted-foreground transition-all",
//     "focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary",
//     error ? "border-destructive" : "border-border",
//     icon && "pl-10",
//     className,
//   )

//   const InputComponent = multiline ? "textarea" : "input"

//   return (
//     <div className="space-y-2">
//       {label && (
//         <label className="text-sm font-medium text-foreground flex items-center gap-2">
//           {icon}
//           {label}
//         </label>
//       )}
//       <div className="relative">
//         {icon && !label && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>}
//         <InputComponent className={baseStyles} {...(props as any)} />
//       </div>
//       {error && <p className="text-sm text-destructive">{error}</p>}
//     </div>
//   )
// })

// Input.displayName = "Input"

import React, { forwardRef } from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={`input ${error ? "border-destructive focus:border-destructive" : ""} ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs text-destructive mt-1 px-1">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

import React from "react"
import { cn } from "../../utils/cn"

interface AvatarProps {
  src?: string
  fallback: string
  size?: "sm" | "md" | "lg"
  className?: string
  showStatus?: boolean
}

const sizeMap = {
  sm: "w-7 h-7",
  md: "w-10 h-10",
  lg: "w-16 h-16",
}

export const Avatar = React.memo<AvatarProps>(({ src, fallback, size = "md", className, showStatus = false }) => {
  const [imgError, setImgError] = React.useState(false)

  return (
    <div className={cn("relative", className)}>
      {src && !imgError ? (
        <img
          src={src || "/placeholder.svg"}
          alt="Avatar"
          className={cn(sizeMap[size], "rounded-theme-avatar object-cover bg-theme-base-200 border border-theme-base")}
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className={cn(
            sizeMap[size],
            "rounded-theme-avatar bg-theme-secondary text-theme-secondary-content flex items-center justify-center font-semibold",
            size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base",
          )}
        >
          {fallback.charAt(0).toUpperCase()}
        </div>
      )}
      {showStatus && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-theme-success rounded-full border-2 border-theme-base-100" />
      )}
    </div>
  )
})

Avatar.displayName = "Avatar"
